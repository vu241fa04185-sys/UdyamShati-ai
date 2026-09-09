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

    // 1. Check if user is asking to search nearby places or view businesses on map
    const lowerMsg = (message || '').toLowerCase();
    const isNearbyQuery = /(nearby|paas ki|doodh ki dukan|kirana dukan|medical store|where is|kahan hai|chemist|pharmacy|fertilizer shop|petrol pump|shop in|दुकान|నందు|దుకాణం|daggara|దగ్గర)/i.test(lowerMsg);

    if (isNearbyQuery) {
      try {
        const agentResult = await callAI('/api/agent/chat', { message, profile: profile || {} });
        if (agentResult && agentResult.action_type === 'OPEN_MAP') {
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
            session_state: session_state || {},
            updated_profile: profile || {}
          });
        }
      } catch (err) {
        console.warn('AI agent nearby search fallback to local advisor:', err.message);
      }
    }

    // Process chat through Dynamic AI Advisor Agent Reasoning
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
