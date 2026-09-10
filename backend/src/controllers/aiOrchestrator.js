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
    const { message, profile, session_state = {}, history = [] } = req.body;
    const activeLang = req.body.lang || req.body.language || session_state?.lang || 'en';
    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Process chat through Dynamic AI Advisor Agent Reasoning
    const sarthiResult = await generateDynamicAdvisory({
      message,
      conversation_state: session_state || {},
      history,
      profile: profile || {},
      lang: activeLang
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
      message: sarthiResult.message || sarthiResult.reply,
      language: sarthiResult.language || activeLang,
      questionId: sarthiResult.questionId || null,
      quickReplies: sarthiResult.quickReplies || [],
      business: sarthiResult.business || state.business || null,
      step: sarthiResult.step !== undefined ? sarthiResult.step : state.step,
      waitingForAnswer: sarthiResult.waitingForAnswer !== undefined ? sarthiResult.waitingForAnswer : true,
      reply: sarthiResult.reply || sarthiResult.message,
      speak_text: sarthiResult.speak_text,
      intent: sarthiResult.intent || 'FIXED_CONVERSATION_STEP',
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
