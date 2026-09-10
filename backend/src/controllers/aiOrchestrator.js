const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Helper to make requests to Python AI Microservice
const callAI = async (endpoint, data, method = 'post') => {
  try {
    const url = `${config.AI_SERVICE_URL}${endpoint}`;
    if (method === 'get') {
      const resp = await axios.get(url, { params: data });
      return resp.data;
    }
    const resp = await axios.post(url, data);
    return resp.data;
  } catch (err) {
    console.error(`Error calling AI service at ${endpoint}:`, err.message);
    throw new Error(`AI Analytics Service unavailable: ${err.message}`);
  }
};

const { generateDynamicAdvisory } = require('../services/llmAdvisorService');

// 1. Multilingual Chat & Conversational Assistant (UdyamSarthi AI Agent)
exports.handleChat = async (req, res) => {
  try {
    const { message, profile, lang = 'hi', session_state = {}, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Assemble unified entrepreneur profile
    const baseProfile = session_state?.master_profile || profile || {};
    const currentProfile = {
      ...baseProfile,
      name: session_state?.name || baseProfile?.name || null,
      district: session_state?.district || baseProfile?.location?.village || baseProfile?.district || null,
      available_capital: session_state?.budget !== undefined && session_state?.budget !== null 
        ? session_state.budget 
        : (baseProfile?.financial?.capital ?? baseProfile?.available_capital ?? baseProfile?.capital ?? null),
      capital: session_state?.budget !== undefined && session_state?.budget !== null 
        ? session_state.budget 
        : (baseProfile?.financial?.capital ?? baseProfile?.available_capital ?? baseProfile?.capital ?? null),
      business_interest: session_state?.business || session_state?.businessIdea || baseProfile?.business?.interest || baseProfile?.business_interest || null,
      land_acres: session_state?.landAvailable !== undefined ? session_state.landAvailable : (baseProfile?.resources?.land_acres ?? baseProfile?.land_acres ?? null),
      experience_years: session_state?.experience !== undefined ? session_state.experience : (baseProfile?.experience?.experience_years ?? baseProfile?.experience_years ?? null),
      shed: session_state?.shed !== undefined ? session_state.shed : (baseProfile?.resources?.shed ?? null),
      water: session_state?.water !== undefined ? session_state.water : (baseProfile?.resources?.water ?? null),
      cattle_count: session_state?.cattle_count !== undefined ? session_state.cattle_count : (baseProfile?.resources?.cattle_count ?? null),
      cattle: session_state?.cattle || (baseProfile?.resources?.cattle ?? null),
      preferred_language: lang
    };

    let agentResult = null;
    try {
      // 1. Primary Engine: UdyamSarthi Autonomous Specialist Agent (Python Microservice)
      agentResult = await callAI('/api/agent/chat', { 
        message, 
        profile: currentProfile,
        session_id: session_state?.session_id || 'default_session'
      });
    } catch (microErr) {
      console.warn('AI Microservice call failed, falling back to local Express Advisor:', microErr.message);
    }

    if (agentResult) {
      const up = agentResult.updated_profile || {};
      const fin = up.financial || {};
      const resrc = up.resources || {};
      const exp = up.experience || {};
      const biz = up.business || {};
      const loc = up.location || {};

      const updatedSessionState = {
        ...(session_state || {}),
        master_profile: up,
        name: up.name || session_state?.name || null,
        district: loc.village || loc.district || session_state?.district || null,
        state: loc.state || session_state?.state || null,
        business: biz.interest || biz.business_idea || session_state?.business || null,
        businessIdea: biz.interest || biz.business_idea || session_state?.businessIdea || null,
        budget: fin.capital !== undefined && fin.capital !== null ? fin.capital : session_state?.budget,
        landAvailable: resrc.land_acres !== undefined && resrc.land_acres !== null ? resrc.land_acres : session_state?.landAvailable,
        experience: exp.experience_years !== undefined && exp.experience_years !== null ? exp.experience_years : session_state?.experience,
        shed: resrc.shed !== undefined ? resrc.shed : session_state?.shed,
        water: resrc.water !== undefined ? resrc.water : session_state?.water,
        cattle_count: resrc.cattle_count !== undefined ? resrc.cattle_count : session_state?.cattle_count,
        cattle: resrc.cattle || session_state?.cattle,
        lang: agentResult.detected_language === 'TELUGU' ? 'te' : (agentResult.detected_language === 'ENGLISH' ? 'en' : 'hi'),
        lastIntent: agentResult.intent
      };

      const updatedProfileResponse = {
        ...up,
        name: up.name || profile?.name || null,
        district: loc.village || loc.district || profile?.district || null,
        available_capital: fin.capital !== undefined && fin.capital !== null ? fin.capital : profile?.available_capital,
        business_interest: biz.interest || profile?.business_interest || null
      };

      return res.json({
        reply: agentResult.reply,
        response: agentResult.reply,
        speak_text: agentResult.reply,
        intent: agentResult.intent,
        action_type: agentResult.action_type,
        action_payload: agentResult.action_payload || (agentResult.map_action ? {
          search_query: agentResult.map_action.query,
          category: agentResult.map_action.category,
          radius_km: agentResult.map_action.radius_km,
          total_count: agentResult.map_action.total_count
        } : null),
        recommendation_score: agentResult.recommendation_score,
        confidence_score: agentResult.confidence_score,
        comparison_table: agentResult.comparison_table,
        financial_summary: agentResult.financial_summary,
        map_action: agentResult.map_action,
        sources: agentResult.sources,
        session_state: updatedSessionState,
        updated_profile: updatedProfileResponse
      });
    }

    // Fallback: Dynamic Advisor Service
    const sarthiResult = await generateDynamicAdvisory({
      message,
      conversation_state: session_state || {},
      history,
      profile: profile || {},
      lang
    });

    const state = sarthiResult.conversation_state || {};
    const updatedProfile = {
      ...(profile || {}),
      name: state.name || profile?.name || null,
      district: state.district || profile?.district || null,
      available_capital: state.budget !== undefined && state.budget !== null ? state.budget : (profile?.available_capital || null),
      business_interest: state.business || state.businessIdea || profile?.business_interest || null
    };

    return res.json({
      reply: sarthiResult.reply,
      response: sarthiResult.reply,
      speak_text: sarthiResult.speak_text,
      intent: sarthiResult.intent,
      action_type: sarthiResult.action_type || null,
      action_payload: sarthiResult.action_payload || null,
      session_state: state,
      updated_profile: updatedProfile
    });
  } catch (err) {
    console.error("handleChat error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Full Decision Recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const profile = req.body;
    const result = await callAI('/api/recommendations', profile);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Market GIS Analysis
exports.analyzeMarket = async (req, res) => {
  try {
    const result = await callAI('/api/market/analyze', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Competitor Pins
exports.getCompetitors = async (req, res) => {
  try {
    const result = await callAI('/api/market/competitors', req.query, 'get');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Financial Structuring
exports.structureFinances = async (req, res) => {
  try {
    const result = await callAI('/api/finance/structure', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Schemes Evaluation
exports.evaluateSchemes = async (req, res) => {
  try {
    const { profile, project_cost } = req.body;
    const result = await callAI('/api/schemes/evaluate', { profile, project_cost });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. What-If Simulation
exports.simulateWhatIf = async (req, res) => {
  try {
    const result = await callAI('/api/simulation/whatif', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. RAG Scheme Search
exports.searchRAG = async (req, res) => {
  try {
    const result = await callAI('/api/rag/search', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. Static catalog & villages data endpoints for quick UI loads
exports.getCatalog = (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(config.DATA_DIR, 'business_catalog.json'), 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLocations = (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(config.DATA_DIR, 'villages_and_locations.json'), 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 10. Natural Language Parser (multilingual NLU entity extractor)
exports.parseNLP = async (req, res) => {
  try {
    const result = await callAI('/api/nlp/parse', req.body);
    res.json(result);
  } catch (err) {
    console.warn('NLP parse fallback:', err.message);
    res.json({
      raw_input: req.body?.text || '',
      detected_language: 'en',
      intent: 'GENERAL_CONVERSATION',
      entities: {}
    });
  }
};
