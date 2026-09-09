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

// 1. Multilingual Chat & Conversational Assistant
exports.handleChat = async (req, res) => {
  try {
    const { message, profile } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Step 1: NLU parsing in Python AI Microservice
    const nluResult = await callAI('/api/nlp/parse', { text: message });
    const lang = nluResult.detected_language || 'hi';
    const intent = nluResult.intent || 'BUSINESS_RECOMMENDATION';
    const entities = nluResult.entities || {};

    const currentProfile = profile || {};

    // Merge newly extracted entities into entrepreneur profile if provided
    const updatedProfile = {
      ...currentProfile,
      name: entities.name || currentProfile.name || 'Ramesh Kisan',
      available_capital: entities.capital !== null && entities.capital !== undefined ? entities.capital : (currentProfile.available_capital || 300000),
      land_acres: entities.land_acres !== null && entities.land_acres !== undefined ? entities.land_acres : (currentProfile.land_acres || 1.0),
      skills: entities.skills && entities.skills.length > 0 ? Array.from(new Set([...(currentProfile.skills || []), ...entities.skills])) : (currentProfile.skills || ['farming']),
      social_category: entities.social_category || currentProfile.social_category || 'OBC',
      has_water_source: entities.has_water_source !== null && entities.has_water_source !== undefined ? entities.has_water_source : (currentProfile.has_water_source ?? true),
      has_electricity: entities.has_electricity !== null && entities.has_electricity !== undefined ? entities.has_electricity : (currentProfile.has_electricity ?? true),
      has_vehicle: entities.has_vehicle !== null && entities.has_vehicle !== undefined ? entities.has_vehicle : (currentProfile.has_vehicle ?? false),
      has_shop_building: entities.has_shop_building !== null && entities.has_shop_building !== undefined ? entities.has_shop_building : (currentProfile.has_shop_building ?? false)
    };

    // If a known location was mentioned by name, update coordinates
    if (entities.location_hint) {
      const locCoords = {
        "Nashik": { lat: 20.1706, lon: 73.9840, village: "Pimpalgaon Baswant", district: "Nashik", state: "Maharashtra" },
        "Krishna": { lat: 16.4258, lon: 80.7712, village: "Kankipadu", district: "Krishna", state: "Andhra Pradesh" },
        "Varanasi": { lat: 25.4380, lon: 83.0560, village: "Chaubeypur", district: "Varanasi", state: "Uttar Pradesh" },
        "Anand": { lat: 22.5360, lon: 72.9340, village: "Mogri Rural", district: "Anand", state: "Gujarat" }
      };
      if (locCoords[entities.location_hint]) {
        const c = locCoords[entities.location_hint];
        updatedProfile.latitude = c.lat;
        updatedProfile.longitude = c.lon;
        updatedProfile.village_name = c.village;
        updatedProfile.district = c.district;
        updatedProfile.state = c.state;
      }
    }

    let replyText = '';
    let actionType = null;
    let topRec = null;
    let allRecs = [];
    let alternatives = [];

    // Step 2: Handle specific conversational intents intelligently!
    if (intent === 'FORM_FILLING') {
      actionType = 'START_FORM_FILLING';
      if (lang === 'hi') {
        replyText = `बिल्कुल! चलिए आपका उद्यम पंजीकरण शुरू करते हैं। मैं आपसे एक-एक करके सारे विवरण पूछूँगा और आपका फ़ॉर्म भर दूँगा।\n\n**पहला सवाल:** कृपया अपना **शुभ नाम (Full Name)** बताएं।`;
      } else if (lang === 'te') {
        replyText = `తప్పకుండా! మీ వ్యాపార నమోదును ప్రారంభిద్దాం. నేను ఒక్కొక్క వివరాలను అడుగుతాను. మొదట మీ **పూర్తి పేరు (Full Name)** చెప్పండి.`;
      } else {
        replyText = `Certainly! Let's fill out your enterprise registration together step-by-step. I will ask you all the details one by one.\n\n**Step 1:** What is your **full name**?`;
      }
    } else if (intent === 'LOCATION_QUERY') {
      actionType = 'SHOW_LOCATION_ACTIONS';
      const village = updatedProfile.village_name || 'Pimpalgaon Baswant';
      const dist = updatedProfile.district || 'Nashik';
      const state = updatedProfile.state || 'Maharashtra';
      const lat = (updatedProfile.latitude || 20.1706).toFixed(4);
      const lon = (updatedProfile.longitude || 73.9840).toFixed(4);

      if (lang === 'hi') {
        replyText = `आपकी वर्तमान पंजीकृत लोकेशन **${village}** (जिला: ${dist}, राज्य: ${state}) है। GPS निर्देशांक: **${lat}° N, ${lon}° E** हैं।\n\nयदि आप अपने मोबाइल/लैपटॉप की लाइव GPS लोकेशन से सीधे मैप देखना चाहते हैं, तो नीचे दिए गए '📍 Use Device Live GPS' बटन पर क्लिक करें।`;
      } else if (lang === 'te') {
        replyText = `మీ ప్రస్తుత నమోదిత ప్రాంతం **${village}** (జిల్లా: ${dist}, రాష్ట్రం: ${state}). GPS కోఆర్డినేట్స్: **${lat}° N, ${lon}° E**.\n\nమీ పరికరం యొక్క లైవ్ జీపీఎస్ లొకేషన్‌ను తీసుకోవడానికి క్రింది బటన్‌ను క్లిక్ చేయండి.`;
      } else {
        replyText = `Your current registered location is **${village}** (District: ${dist}, State: ${state}) at coordinates **${lat}° N, ${lon}° E**.\n\nTo synchronize with your device's real-time GPS location, click the '📍 Use Device Live GPS' button below.`;
      }
    } else if (intent === 'PROFILE_QUERY') {
      const cap = (updatedProfile.available_capital || 0).toLocaleString('en-IN');
      const land = updatedProfile.land_acres || 0;
      const skills = (updatedProfile.skills || []).join(', ');
      const category = updatedProfile.social_category || 'OBC';

      if (lang === 'hi') {
        replyText = `आपकी वर्तमान प्रोफ़ाइल विवरण:\n• नाम: **${updatedProfile.name}**\n• उपलब्ध पूँजी: **₹${cap}**\n• भूमि: **${land} एकड़**\n• सामाजिक वर्ग: **${category}**\n• अनुभव/कौशल: **${skills}**\n• स्थान: **${updatedProfile.village_name}, ${updatedProfile.district}**\n\nआप इनमें से किसी भी विवरण को बोलकर बदल सकते हैं (जैसे 'मेरे पास 4 लाख रुपये हैं')।`;
      } else if (lang === 'te') {
        replyText = `మీ ప్రస్తుత ప్రొఫైల్ వివరాలు:\n• పేరు: **${updatedProfile.name}**\n• పెట్టుబడి: **₹${cap}**\n• భూమి: **${land} ఎకరాలు**\n• సామాజిక వర్గం: **${category}**\n• నైపుణ్యాలు: **${skills}**\n• ప్రాంతం: **${updatedProfile.village_name}, ${updatedProfile.district}**`;
      } else {
        replyText = `Here is your current registered profile:\n• Name: **${updatedProfile.name}**\n• Capital: **₹${cap}**\n• Land: **${land} Acres**\n• Social Category: **${category}**\n• Skills: **${skills}**\n• Location: **${updatedProfile.village_name}, ${updatedProfile.district}**`;
      }
    } else if (intent === 'SCHEME_SEARCH') {
      actionType = 'SHOW_SCHEMES';
      const schemesResult = await callAI('/api/schemes/evaluate', {
        profile: updatedProfile,
        project_cost: updatedProfile.available_capital ? updatedProfile.available_capital * 1.5 : 300000
      });
      const eligible = (schemesResult || []).filter(s => s.is_eligible);
      const topScheme = eligible[0] || schemesResult[0];

      if (lang === 'hi') {
        replyText = `आपकी श्रेणी (${updatedProfile.social_category}) और पूँजी के आधार पर, सबसे उपयुक्त सरकारी योजना **${topScheme ? topScheme.title_hi : 'एनबीसीएफडीसी सामान्य सावधि ऋण योजना'}** है। इसमें **10% लाभार्थी अंशदान** और **90% रियायती ऋण** (${topScheme?.interest_rate_pct || 8.0}% ब्याज दर) का प्रावधान है।`;
      } else if (lang === 'te') {
        replyText = `మీ వర్గం (${updatedProfile.social_category}) ప్రకారం అర్హత కలిగిన పథకం **${topScheme ? topScheme.title_te : 'ఎన్‌బీసీఎఫ్‌డీసీ టర్మ్ లోన్ పథకం'}**. ఇందులో 10% స్వంత వాటా మరియు 90% రాయితీ రుణం లభిస్తుంది.`;
      } else {
        replyText = `Based on your social category (${updatedProfile.social_category}) and capital, the best matched scheme is **${topScheme ? topScheme.title_en : 'NBCFDC Term Loan'}** featuring **10% beneficiary margin** and **90% concessional loan** at ${topScheme?.interest_rate_pct || 8.0}% interest with a moratorium period.`;
      }
    } else {
      // General recommendation / data ingestion intent
      const recResult = await callAI('/api/recommendations', updatedProfile);
      topRec = recResult.top_recommendation;
      allRecs = recResult.all_recommendations;
      alternatives = recResult.alternatives;

      if (lang === 'hi') {
        replyText = `नमस्ते! मैंने आपकी जानकारी अपडेट कर ली है: पूँजी ₹${(updatedProfile.available_capital || 0).toLocaleString('en-IN')}, जमीन ${updatedProfile.land_acres} एकड़ और कौशल: ${updatedProfile.skills.join(', ')}।\n\nआपके स्थानीय क्षेत्र (${updatedProfile.village_name || '10 किमी दायरा'}) के विश्लेषण के अनुसार, सबसे उपयुक्त व्यवसाय **${topRec ? topRec.name_hi : 'सब्जी या डेयरी व्यवसाय'}** (उपयुक्तता स्कोर: ${topRec ? topRec.overall_suitability_score : 85}/100) है। इसमें मासिक लाभ लगभग ₹${(topRec?.financials?.projected_monthly_operating_profit || 0).toLocaleString('en-IN')} अनुमानित है।`;
      } else if (lang === 'te') {
        replyText = `నమస్కారం! మీ వివరాలు అప్‌డేట్ అయ్యాయి: పెట్టుబడి ₹${(updatedProfile.available_capital || 0).toLocaleString('en-IN')}, భూమి ${updatedProfile.land_acres} ఎకరాలు మరియు నైపుణ్యాలు: ${updatedProfile.skills.join(', ')}.\n\nమీ ప్రాంతంలో అత్యంత లాభదాయక వ్యాపారం **${topRec ? topRec.name_te : 'పాడి లేదా వ్యవసాయ ఆధారిత వ్యాపారం'}** (స్కోర్: ${topRec ? topRec.overall_suitability_score : 85}/100).`;
      } else {
        replyText = `Profile updated: Capital ₹${(updatedProfile.available_capital || 0).toLocaleString('en-IN')}, Land ${updatedProfile.land_acres} acres, Skills: ${updatedProfile.skills.join(', ')}.\n\nBased on hyper-local intelligence in ${updatedProfile.village_name || 'your area'}, the top recommended business is **${topRec ? topRec.name_en : 'Polyhouse Vegetable or Dairy Farming'}** (Suitability: ${topRec ? topRec.overall_suitability_score : 85}/100) with estimated monthly profit of ₹${(topRec?.financials?.projected_monthly_operating_profit || 0).toLocaleString('en-IN')}.`;
      }
    }

    res.json({
      reply: replyText,
      intent: intent,
      action_type: actionType,
      nlu: nluResult,
      updated_profile: updatedProfile,
      top_recommendation: topRec,
      all_recommendations: allRecs,
      alternatives: alternatives
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
