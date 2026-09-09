import React, { createContext, useContext, useState, useEffect } from 'react';
import { defaultBusinessPlans } from '../utils/defaultPlans';
import { extractBusinessIntent, generateDynamicBusinessAnalysis } from '../utils/businessPlanEngine';

const SaarthiContext = createContext(null);

export function SaarthiProvider({ children, auth, profile, onProfileUpdate, language = 'en' }) {
  // Current user identity ID
  const userId = auth?.user?.id || auth?.user?.phone || auth?.email || 'demo-user';

  // Key for localStorage persistence per user
  const storageKey = `udyam_plans_${userId}`;

  // Load user's saved personal business plans from localStorage
  const [personalPlans, setPersonalPlans] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Error reading personal business plans:", e);
    }
    return [];
  });

  // Active Business Plan ID
  const [activePlanId, setActivePlanId] = useState(() => {
    try {
      const savedPlans = localStorage.getItem(storageKey);
      if (savedPlans) {
        const parsed = JSON.parse(savedPlans);
        if (parsed && parsed.length > 0) {
          return parsed[0].id; // Newest personal plan
        }
      }
    } catch (e) {}
    return defaultBusinessPlans[0].id; // Fallback to first default plan
  });

  // Pending business idea state awaiting confirmation in chat
  const [pendingBusinessIdea, setPendingBusinessIdea] = useState(null);

  // Sync personal plans to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(personalPlans));
    } catch (e) {
      console.warn("Error saving personal business plans:", e);
    }
  }, [personalPlans, storageKey]);

  // Combine personal plans (first, newest first) + default reference plans
  const allPlans = [...personalPlans, ...defaultBusinessPlans];

  // Helper to get current active plan object
  const getActivePlan = () => {
    const found = allPlans.find(p => p.id === activePlanId);
    return found || personalPlans[0] || defaultBusinessPlans[0];
  };

  // Helper to get active recommendation object payload for sub-components
  const getActiveRecommendationPayload = () => {
    const activePlan = getActivePlan();
    if (!activePlan) return null;

    const raw = activePlan.rawRecommendation;
    // Construct recommendation payload expected by RecommendationsView, Finance, Schemes, Risk, Simulator, Report
    return {
      total_candidates_analyzed: defaultBusinessPlans.length + personalPlans.length,
      viable_candidates_count: allPlans.length,
      filtered_out: [],
      top_recommendation: raw,
      all_recommendations: allPlans.map(p => p.rawRecommendation || {}),
      alternatives: allPlans.slice(1).map(p => p.rawRecommendation || {})
    };
  };

  // Create a new Personal Business Plan from extracted intent
  const createPlanFromIntent = (intentInput) => {
    const intent = typeof intentInput === 'string' 
      ? extractBusinessIntent(intentInput, profile) 
      : intentInput;

    const newPlan = generateDynamicBusinessAnalysis(intent, profile, userId);

    setPersonalPlans(prev => [newPlan, ...prev]);
    setActivePlanId(newPlan.id);
    setPendingBusinessIdea(null);

    return newPlan;
  };

  // Update an existing Business Plan
  const updatePlan = (planId, updatedFields = {}) => {
    setPersonalPlans(prev => prev.map(p => {
      if (p.id === planId) {
        // If capital or details updated, recalculate analysis
        const updatedIntent = extractBusinessIntent(
          updatedFields.businessIdea || p.businessName,
          { ...profile, available_capital: updatedFields.capital || p.capital }
        );
        const recalculated = generateDynamicBusinessAnalysis(updatedIntent, profile, userId);
        return {
          ...p,
          ...recalculated,
          ...updatedFields,
          id: planId, // preserve original ID
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // Delete a Personal Business Plan
  const deletePlan = (planId) => {
    setPersonalPlans(prev => {
      const filtered = prev.filter(p => p.id !== planId);
      if (activePlanId === planId) {
        setActivePlanId(filtered.length > 0 ? filtered[0].id : defaultBusinessPlans[0].id);
      }
      return filtered;
    });
  };

  const activePlan = getActivePlan();

  const contextValue = {
    userId,
    profile,
    onProfileUpdate,
    language,
    personalPlans,
    defaultPlans: defaultBusinessPlans,
    allPlans,
    userPlans: allPlans,
    activePlan,
    activePlanId,
    setActivePlanId,
    getActivePlan,
    getActiveRecommendationPayload,
    pendingBusinessIdea,
    setPendingBusinessIdea,
    createPlanFromIntent,
    updatePlan,
    deletePlan
  };

  return (
    <SaarthiContext.Provider value={contextValue}>
      {children}
    </SaarthiContext.Provider>
  );
}

export function useSaarthi() {
  const context = useContext(SaarthiContext);
  if (!context) {
    console.warn("useSaarthi used outside SaarthiProvider context, returning safe defaults.");
    return {
      userId: 'demo-user',
      personalPlans: [],
      defaultPlans: defaultBusinessPlans,
      allPlans: defaultBusinessPlans,
      userPlans: defaultBusinessPlans,
      activePlan: defaultBusinessPlans[0],
      activePlanId: defaultBusinessPlans[0].id,
      setActivePlanId: () => {},
      getActivePlan: () => defaultBusinessPlans[0],
      getActiveRecommendationPayload: () => null,
      pendingBusinessIdea: null,
      setPendingBusinessIdea: () => {},
      createPlanFromIntent: () => defaultBusinessPlans[0],
      updatePlan: () => {},
      deletePlan: () => {}
    };
  }
  return context;
}
