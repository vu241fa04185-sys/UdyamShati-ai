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

// 1. Multilingual Chat & Conversational Assistant powered by UdyamSarthi Advisory Agent
exports.handleChat = async (req, res) => {
  try {
    const { message, profile } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Delegate to UdyamSarthi Advisory Agent in Python AI Microservice
    const agentResult = await callAI('/api/agent/chat', {
      message,
      profile: profile || {}
    });

    const updatedProfile = agentResult.updated_profile || profile || {};

    // Backward-compatible flat profile for legacy components
    const legacyFlatProfile = {
      ...updatedProfile,
      name: updatedProfile.name || 'Ramesh Kisan',
      available_capital: updatedProfile.financial?.capital || 300000,
      land_acres: updatedProfile.resources?.land_acres || 1.0,
      skills: updatedProfile.experience?.skills || ['farming'],
      social_category: updatedProfile.social_category || 'OBC',
      has_water_source: updatedProfile.resources?.water ?? true,
      has_electricity: updatedProfile.resources?.electricity ?? true,
      has_vehicle: updatedProfile.resources?.vehicle ?? false,
      has_shop_building: updatedProfile.resources?.shop ?? false,
      village_name: updatedProfile.location?.village || 'Pimpalgaon Baswant',
      district: updatedProfile.location?.district || 'Nashik',
      state: updatedProfile.location?.state || 'Maharashtra',
      latitude: updatedProfile.location?.latitude || 20.1706,
      longitude: updatedProfile.location?.longitude || 73.9840
    };

    res.json({
      reply: agentResult.reply,
      intent: agentResult.intent,
      action_type: agentResult.action_type,
      detected_language: agentResult.detected_language,
      updated_profile: legacyFlatProfile,
      structured_profile: updatedProfile,
      profile_completeness: agentResult.profile_completeness,
      recommendation_score: agentResult.recommendation_score,
      confidence_score: agentResult.confidence_score,
      comparison_table: agentResult.comparison_table,
      financial_summary: agentResult.financial_summary,
      sources: agentResult.sources,
      top_recommendation: agentResult.top_recommendation || null,
      all_recommendations: agentResult.all_recommendations || [],
      alternatives: agentResult.alternatives || []
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
