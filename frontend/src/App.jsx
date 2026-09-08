import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import ChatAssistant from './components/ChatAssistant';
import ProfileWizard from './components/ProfileWizard';
import RecommendationsView from './components/RecommendationsView';
import MarketMapView from './components/MarketMapView';
import FinanceDashboard from './components/FinanceDashboard';
import SchemeMatcher from './components/SchemeMatcher';
import RiskStressView from './components/RiskStressView';
import SimulatorView from './components/SimulatorView';
import ReportView from './components/ReportView';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [lang, setLang] = useState('hi'); // Default to Hindi for rural accessibility
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());

  // Default Entrepreneur Profile (Archetype: Ramesh Kisan, Nashik)
  const [profile, setProfile] = useState({
    name: 'Ramesh Kisan',
    phone: '9876543210',
    social_category: 'OBC',
    gender: 'MALE',
    annual_family_income: 180000,
    state: 'Maharashtra',
    district: 'Nashik',
    mandal_or_block: 'Niphad',
    village_name: 'Pimpalgaon Baswant',
    pincode: '422209',
    latitude: 20.1706,
    longitude: 73.9840,
    available_capital: 300000,
    liquid_reserve: 20000,
    land_acres: 2.0,
    has_shop_building: false,
    has_vehicle: true,
    has_machinery: false,
    has_electricity: true,
    has_water_source: true,
    has_internet: true,
    has_storage_facility: false,
    skills: ['farming', 'agriculture'],
    experience_years: 5,
    business_interest: null,
    target_monthly_income: 25000,
    risk_preference: 'MODERATE',
    preferred_language: 'hi',
    analysis_radius_km: 10.0
  });

  const [recommendations, setRecommendations] = useState(null);

  // Run decision advisory pipeline
  const runDecisionAdvisory = async (customProfile = null) => {
    setLoading(true);
    const targetProfile = customProfile || profile;
    try {
      const res = await axios.post('/api/recommendations', targetProfile);
      setRecommendations(res.data);
      setLastSyncTime(Date.now());
    } catch (err) {
      console.error("Error executing recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial advisory run on application startup
  useEffect(() => {
    runDecisionAdvisory(profile);
  }, []);

  // When speech or wizard updates the profile, instantly save & re-evaluate
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    runDecisionAdvisory(updatedProfile);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        profile={profile}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {loading && !recommendations ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-600">
              Evaluating hyper-local GIS catchment area & MoSJE concessional schemes...
            </span>
          </div>
        ) : (
          <>
            {activeTab === 'chat' && (
              <ChatAssistant
                lang={lang}
                profile={profile}
                onProfileUpdate={handleProfileUpdate}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileWizard
                profile={profile}
                setProfile={setProfile}
                onRunAdvisory={() => {
                  runDecisionAdvisory(profile);
                  setActiveTab('recommendations');
                }}
                lang={lang}
              />
            )}

            {activeTab === 'recommendations' && (
              <RecommendationsView
                recommendations={recommendations}
                lang={lang}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'market' && (
              <MarketMapView
                profile={profile}
                setProfile={setProfile}
                recommendations={recommendations}
                lang={lang}
                onLocationUpdate={handleProfileUpdate}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceDashboard
                recommendations={recommendations}
                profile={profile}
                lang={lang}
              />
            )}

            {activeTab === 'schemes' && (
              <SchemeMatcher
                profile={profile}
                recommendations={recommendations}
                lang={lang}
              />
            )}

            {activeTab === 'risk' && (
              <RiskStressView
                recommendations={recommendations}
                lang={lang}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorView
                profile={profile}
                recommendations={recommendations}
                lang={lang}
              />
            )}

            {activeTab === 'report' && (
              <ReportView
                profile={profile}
                recommendations={recommendations}
                lang={lang}
              />
            )}
          </>
        )}
      </main>

      {/* Production Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">
            UdyamSetu AI • National Rural Micro-Enterprise Advisory Platform
          </span>
          <span>
            Ministry of Social Justice & Empowerment (MoSJE), Government of India
          </span>
        </div>
      </footer>
    </div>
  );
}
