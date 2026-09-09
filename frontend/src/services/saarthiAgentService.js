// Saarthi AI Multilingual Agent Engine & Stateful Conversational Advisor
// Stateful Conversation Orchestrator, Multi-Entity Extraction, Context Memory, Correction Parser,
// Business-Specific Adaptive Questions, Multilingual (EN, HI, TE, Hinglish, Teluglish), and Live Dossier Sync.

import { parseCapitalAmount } from '../utils/businessPlanEngine';

/**
 * High-Precision Intent & Command Classifier
 * Distinguishes UI/system commands ("edit details", "suggest ideas") from business data entities.
 */
export function detectIntent(text = '') {
  const lower = (text || '').toLowerCase().trim();

  if (lower.includes('edit details') || lower.includes('let me edit') || lower.includes('change details') || lower.includes('edit the details') || lower.includes('details edit') || lower === 'edit details') {
    return 'EDIT_DETAILS';
  }
  if (lower.includes('suggest') || lower.includes('recommend') || lower.includes('what business can i') || lower.includes('best business ideas') || lower.includes('suggest ideas') || lower.includes('సూచించండి') || lower.includes('सुझाव') || lower.includes('कौन सा बिजनेस')) {
    return 'BUSINESS_IDEA_SUGGESTION';
  }
  if (lower.includes('start over') || lower.includes('reset chat') || lower.includes('new conversation') || lower.includes('clear chat')) {
    return 'RESET_CHAT';
  }
  if (lower.includes('loan') || lower.includes('finance') || lower.includes('రుణం') || lower.includes('ऋण')) {
    if (!lower.includes('start') && !lower.includes('farm') && !lower.includes('store') && !lower.includes('unit')) {
      return 'LOAN_QUERY';
    }
  }
  return null;
}

/**
 * Universal Multi-Entity Extraction Engine
 * Extracts ALL entities present in a single user message pass while ignoring system commands.
 */
export function extractAllEntities(userMessage = '', currentBusiness = {}, profile = {}) {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();
  const extracted = {};

  // Ignore command-only phrases
  const commandIntent = detectIntent(text);
  if (commandIntent === 'EDIT_DETAILS' || commandIntent === 'RESET_CHAT') {
    return extracted;
  }

  // 1. ENTREPRENEUR NAME
  const namePatterns = [
    /(?:my name is|i am|call me|name's)\s+([a-zA-Z\s]{2,20})/i,
    /(?:मेरा नाम|मैं हूँ|मुझे)\s+([a-zA-Z\u0900-\u097F\s]{2,20})/i,
    /(?:నా పేరు|నేను)\s+([a-zA-Z\u0C00-\u0C7F\s]{2,20})/i
  ];
  for (const pat of namePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const nameCand = match[1].split(/\s+(?:from|in|and|with|want|\d|for|to|edit|details)/)[0].trim();
      const forbidden = ['business', 'poultry', 'dairy', 'a', 'the', 'guntur', 'vijayawada', 'start', 'edit', 'details', 'suggest', 'ideas'];
      if (nameCand.length >= 2 && !forbidden.includes(nameCand.toLowerCase())) {
        extracted.entrepreneurName = nameCand.charAt(0).toUpperCase() + nameCand.slice(1);
        break;
      }
    }
  }

  // 2. BUSINESS IDEA & CATEGORY (Only if not asking Saarthi to suggest)
  if (commandIntent !== 'BUSINESS_IDEA_SUGGESTION') {
    if (lower.includes('poultry') || lower.includes('broiler') || lower.includes('chicken') || lower.includes('egg') || lower.includes('కోడి') || lower.includes('ముర్గి') || lower.includes('मुर्गी')) {
      extracted.businessIdea = 'Poultry Farming Unit';
      extracted.categoryCode = 'POULTRY_FARMING';
    } else if (lower.includes('dairy') || lower.includes('cow') || lower.includes('buffalo') || lower.includes('milk') || lower.includes('పాడి') || lower.includes('డైరీ') || lower.includes('डेयरी') || lower.includes('दूध') || lower.includes('పాలు')) {
      extracted.businessIdea = 'Commercial Dairy Farming';
      extracted.categoryCode = 'DAIRY_FARMING';
    } else if (lower.includes('mushroom') || lower.includes('oyster') || lower.includes('button mushroom') || lower.includes('పుట్టగొడుగులు') || lower.includes('मशरूम')) {
      extracted.businessIdea = 'Indoor Oyster & Button Mushroom Unit';
      extracted.categoryCode = 'MUSHROOM_FARMING';
    } else if (lower.includes('food processing') || lower.includes('flour mill') || lower.includes('spice') || lower.includes('dal mill') || lower.includes('आटा मिल') || lower.includes('మిల్లు')) {
      extracted.businessIdea = 'Small Food Processing Unit';
      extracted.categoryCode = 'FOOD_PROCESSING';
    } else if (lower.includes('polyhouse') || lower.includes('greenhouse') || lower.includes('vegetable') || lower.includes('కూరగాయలు') || lower.includes('सब्जी')) {
      extracted.businessIdea = 'Polyhouse Vegetable Farming';
      extracted.categoryCode = 'VEGETABLE_FARMING';
    } else if (lower.includes('custom hiring') || lower.includes('tractor') || lower.includes('machinery') || lower.includes('rental') || lower.includes('ట్రాక్టర్')) {
      extracted.businessIdea = 'Custom Hiring Centre (Farm Machinery)';
      extracted.categoryCode = 'CUSTOM_HIRING_CENTRE';
    } else if (lower.includes('tailoring') || lower.includes('garment') || lower.includes('stitching') || lower.includes('boutique') || lower.includes('టైలరింగ్') || lower.includes('दर्जी')) {
      extracted.businessIdea = 'Garment Tailoring & Apparel Unit';
      extracted.categoryCode = 'GARMENT_TAILORING';
    } else if (lower.includes('kirana') || lower.includes('retail') || lower.includes('shop') || lower.includes('store') || lower.includes('దుకాణం') || lower.includes('दुकान') || lower.includes('కిరాణా') || lower.includes('restaurant')) {
      extracted.businessIdea = lower.includes('restaurant') ? 'Rural Restaurant & Eatery' : 'Rural Retail Kirana Store';
      extracted.categoryCode = lower.includes('restaurant') ? 'RESTAURANT' : 'RETAIL_KIRANA';
    } else if (lower.includes('solar') || lower.includes('power kiosk') || lower.includes('सोलर')) {
      extracted.businessIdea = 'Solar Charging & Power Kiosk';
      extracted.categoryCode = 'SOLAR_ENERGY';
    } else if (lower.includes('agri input') || lower.includes('seed') || lower.includes('fertilizer') || lower.includes('ఎరువులు')) {
      extracted.businessIdea = 'Agri Inputs & Fertilizer Depot';
      extracted.categoryCode = 'AGRI_INPUTS';
    }
  }

  // 3. LOCATION (Village / District / City)
  const locPatterns = [
    /(?:in|at|near|from|lo|me|to|లో|में)\s+([a-zA-Z\u0900-\u097F\u0C00-\u0C7F\s]{3,20})/i,
    /(?:location|city|village|district|place)(?:\s+is|\s+should be|\s+=)?\s+([a-zA-Z\u0900-\u097F\u0C00-\u0C7F\s]{3,20})/i
  ];
  for (const pat of locPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const locCandidate = match[1].split(/\s+(?:with|having|for|budget|\d|and|my|instead|not|capital|lakh|edit|details|suggest)/)[0].trim();
      const forbiddenLocs = ['my', 'a', 'the', 'rupees', 'lakh', 'acres', 'state', 'village', 'poultry', 'dairy', 'start', 'business', 'budget', 'edit', 'details', 'change', 'suggest', 'ideas', 'the', 'location'];
      if (locCandidate.length >= 3 && !forbiddenLocs.includes(locCandidate.toLowerCase())) {
        extracted.location = locCandidate.charAt(0).toUpperCase() + locCandidate.slice(1);
        extracted.district = extracted.location;
        extracted.village = extracted.location;
        break;
      }
    }
  }

  // Explicit city names check if mentioned
  const knownCities = ['Guntur', 'Vijayawada', 'Niphad', 'Nashik', 'Vadlamudi', 'Hyderabad', 'Warangal', 'Visakhapatnam', 'Kakinada', 'Tirupati', 'Kurnool', 'Nellore', 'Anantapur', 'Ongole', 'Eluru'];
  for (const city of knownCities) {
    if (lower.includes(city.toLowerCase())) {
      extracted.location = city;
      extracted.district = city;
      extracted.village = city;
      break;
    }
  }

  // 4. CAPITAL AMOUNT
  const parsedCap = parseCapitalAmount(text);
  if (parsedCap) {
    extracted.capital = parsedCap;
  }

  // 5. LAND HOLDING & OWNERSHIP
  const acreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:acres?|acre|ఎకరాలు|ఎకరం|एकड़)/i);
  if (acreMatch) {
    extracted.land = `${acreMatch[1]} Acres`;
    extracted.landAcres = parseFloat(acreMatch[1]);
  } else if (lower.includes('no land') || lower.includes("don't have land") || lower.includes('dont have land') || lower.includes('land nahi') || lower.includes('land ledu') || lower.includes('భూమి లేదు')) {
    extracted.land = '0 Acres';
    extracted.landAcres = 0;
  }

  if (lower.includes('own land') || lower.includes('my own') || lower.includes('owned') || lower.includes('సొంత') || lower.includes('खुद की')) {
    extracted.landOwnership = 'owned';
  } else if (lower.includes('rent') || lower.includes('leased') || lower.includes('కిరాయి') || lower.includes('किराए')) {
    extracted.landOwnership = 'rented';
  }

  // 6. FINANCING / LOAN REQUIREMENT
  if (lower.includes('loan') || lower.includes('credit') || lower.includes('financing') || lower.includes('రుణం') || lower.includes('ऋण') || lower.includes('कर्ज')) {
    extracted.financingRequired = true;
  }

  // 7. EXPERIENCE & INFRASTRUCTURE
  const expMatch = lower.match(/(\d+)\s*(?:years?|saal|varsh|ఏళ్లు|సంవత్సరాల)/i);
  const ownerPrefix = (lower.includes('father') || lower.includes('nanna') || lower.includes('pita') || lower.includes('family')) ? ' (Father)' : '';
  
  if (expMatch) {
    extracted.experienceYears = parseInt(expMatch[1]);
    extracted.experience = `${expMatch[1]} Years Experience${ownerPrefix}`;
  } else if (lower.includes('experience') || lower.includes('anubhavam') || lower.includes('अनुभव') || lower.includes('cows') || lower.includes('chickens') || lower.includes('farming')) {
    if (lower.includes('no experience') || lower.includes('fresher') || lower.includes('లేదు') || lower.includes('नहीं')) {
      extracted.experience = 'Beginner / Training required';
    } else {
      extracted.experience = text.length > 30 ? 'Experienced in Business/Farming' : `${text}${ownerPrefix}`;
    }
  }

  if (lower.includes('water') || lower.includes('electricity') || lower.includes('power') || lower.includes('नीरू') || lower.includes('करेंट')) {
    extracted.infrastructure = {
      water: lower.includes('water') || lower.includes('नीरू') ? 'Available' : 'Pending',
      electricity: lower.includes('electricity') || lower.includes('power') ? 'Available' : 'Pending'
    };
  }

  return extracted;
}

/**
 * Intelligent Correction Detection Engine
 * Detects user corrections ("change location to Vijayawada", "budget is 12 lakh", "make it dairy instead of poultry")
 */
export function detectCorrection(text = '', currentBusiness = {}) {
  const lower = text.toLowerCase();
  
  const isCorrectionPhrase = lower.includes('actually') || 
                             lower.includes('instead') || 
                             lower.includes('change') || 
                             lower.includes('correction') || 
                             lower.includes('wait') || 
                             lower.includes('make it') || 
                             lower.includes('not ') || 
                             lower.includes('i mean') || 
                             lower.includes('i changed') || 
                             lower.includes('location should be') || 
                             lower.includes('location is') ||
                             lower.includes('budget is') || 
                             lower.includes('కాదు') || 
                             lower.includes('नहीं') ||
                             lower.includes('మార్చు');

  if (!isCorrectionPhrase) return null;

  // Check location correction
  const locPatterns = [
    /(?:to|in|location|city|place)\s+([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]{3,20})/i,
    /(?:change location to|make it|place is|location is)\s+([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]{3,20})/i
  ];

  const knownCities = ['Vijayawada', 'Guntur', 'Niphad', 'Nashik', 'Vadlamudi', 'Hyderabad', 'Warangal', 'Visakhapatnam', 'Kakinada', 'Tirupati', 'Kurnool', 'Nellore', 'Anantapur'];
  let newLoc = null;

  for (const city of knownCities) {
    if (lower.includes(city.toLowerCase()) && currentBusiness.location !== city) {
      newLoc = city;
      break;
    }
  }

  if (!newLoc) {
    for (const pat of locPatterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const cand = match[1].split(/\s+(?:and|with|budget|capital|\d)/)[0].trim();
        if (cand.length >= 3 && !['location', 'budget', 'poultry', 'dairy', 'capital', 'change', 'make'].includes(cand.toLowerCase())) {
          newLoc = cand.charAt(0).toUpperCase() + cand.slice(1);
          break;
        }
      }
    }
  }

  if (newLoc) {
    return {
      field: 'location',
      value: newLoc,
      messageEn: `Got it — I've updated your business location to **${newLoc}**. 👍`,
      messageHi: `समझ गया — आपकी व्यावसायिक लोकेशन को **${newLoc}** पर अपडेट कर दिया गया है। 👍`,
      messageTe: `అర్థమైంది — మీ వ్యాపార ప్రాంతాన్ని **${newLoc}** కు నవీకరించాను. 👍`
    };
  }

  // Check capital correction
  const cap = parseCapitalAmount(text);
  if (cap && currentBusiness.capital !== cap) {
    return {
      field: 'capital',
      value: cap,
      messageEn: `Got it — I've updated your available capital to **₹${cap.toLocaleString('en-IN')}**. 👍`,
      messageHi: `समझ गया — आपकी उपलब्ध पूँजी को **₹${cap.toLocaleString('en-IN')}** पर अपडेट कर दिया गया है। 👍`,
      messageTe: `అర్థమైంది — మీ పెట్టుబడిని **₹${cap.toLocaleString('en-IN')}** కి నవీకరించాను. 👍`
    };
  }

  // Check business type correction
  if ((lower.includes('dairy') && currentBusiness.businessIdea !== 'Commercial Dairy Farming') ||
      (lower.includes('poultry') && currentBusiness.businessIdea !== 'Poultry Farming Unit') ||
      (lower.includes('mushroom') && currentBusiness.businessIdea !== 'Indoor Oyster & Button Mushroom Unit')) {
    let newBiz = 'Commercial Dairy Farming';
    let newCode = 'DAIRY_FARMING';
    if (lower.includes('poultry')) {
      newBiz = 'Poultry Farming Unit';
      newCode = 'POULTRY_FARMING';
    } else if (lower.includes('mushroom')) {
      newBiz = 'Indoor Oyster & Button Mushroom Unit';
      newCode = 'MUSHROOM_FARMING';
    }

    return {
      field: 'businessIdea',
      value: newBiz,
      categoryCode: newCode,
      messageEn: `Got it — I've updated your business plan to **${newBiz}**. 👍`,
      messageHi: `समझ गया — आपकी योजना को **${newBiz}** पर अपडेट कर दिया गया है। 👍`,
      messageTe: `అర్థమైంది — మీ వ్యాపారాన్ని **${newBiz}** గా నవీకరించాను. 👍`
    };
  }

  return null;
}

/**
 * Detects language switch commands ("Telugu lo matladu", "Hindi mein baat karo", "Talk to me in English")
 */
export function detectLanguageSwitch(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('telugu lo') || lower.includes('in telugu') || lower.includes('telugu mein') || lower.includes('talk in telugu') || lower.includes('speak in telugu') || lower.includes('తెలుగు')) {
    return 'te';
  }
  if (lower.includes('hindi mein') || lower.includes('in hindi') || lower.includes('hindi lo') || lower.includes('talk in hindi') || lower.includes('speak in hindi') || lower.includes('हिंदी')) {
    return 'hi';
  }
  if (lower.includes('english') || lower.includes('in english') || lower.includes('talk in english') || lower.includes('speak in english')) {
    return 'en';
  }
  return null;
}

/**
 * Central Conversational Advisor Engine
 * Orchestrates turns, maintains canonical state, checks required fields, and selects dynamic human-like questions.
 */
export function processSaarthiMessage({
  message = '',
  history = [],
  dossier = {},
  profile = {},
  language = 'en',
  lastQuestionType = null
}) {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Language Detection & Preference Memory
  const requestedLang = detectLanguageSwitch(text);
  const currentLang = requestedLang || language;

  // 2. Intent Classification
  const commandIntent = detectIntent(text);

  // 3. Extract new entities from current input
  const extracted = extractAllEntities(text, dossier, profile);

  // 4. Contextual short answers based on lastQuestionType
  if (lastQuestionType === 'ASK_CAPITAL' && !extracted.capital) {
    const numMatch = text.match(/^(\d+(?:\.\d+)?)$/);
    if (numMatch) {
      const val = parseFloat(numMatch[1]);
      extracted.capital = val < 100 ? val * 100000 : val;
    }
  } else if (lastQuestionType === 'ASK_LAND' && !extracted.land) {
    const numMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      extracted.land = `${numMatch[1]} Acres`;
      extracted.landAcres = parseFloat(numMatch[1]);
    } else if (lower.includes('yes') || lower.includes('avunu') || lower.includes('ha') || lower.includes('हां')) {
      extracted.land = '1 Acre';
      extracted.landAcres = 1.0;
    } else if (lower.includes('no') || lower.includes('ledu') || lower.includes('nahi') || lower.includes('नहीं')) {
      extracted.land = '0 Acres';
      extracted.landAcres = 0.0;
    }
  }

  // 5. Merge with existing session dossier state (CANONICAL STATE PRESERVATION)
  const authName = (profile && profile.name && profile.name !== 'Ramesh Kisan') ? profile.name : 'Entrepreneur';

  const updatedDossier = {
    ...dossier,
    name: extracted.entrepreneurName || dossier.name || authName,
    businessIdea: extracted.businessIdea || dossier.businessIdea || '',
    categoryCode: extracted.categoryCode || dossier.categoryCode || 'GENERAL_ENTERPRISE',
    location: extracted.location || dossier.location || null,
    capital: extracted.capital !== undefined ? extracted.capital : (dossier.capital !== undefined && dossier.capital !== null ? dossier.capital : null),
    land: extracted.land || dossier.land || null,
    landAcres: extracted.landAcres !== undefined ? extracted.landAcres : (dossier.landAcres !== undefined && dossier.landAcres !== null ? dossier.landAcres : null),
    landOwnership: extracted.landOwnership || dossier.landOwnership || null,
    infrastructure: extracted.infrastructure || dossier.infrastructure || {},
    experience: extracted.previousExperience || extracted.experience || dossier.experience || null,
    financingRequired: extracted.financingRequired !== undefined ? extracted.financingRequired : (dossier.financingRequired || false),
    scale: dossier.scale || 'Small'
  };

  // 6. Check for explicit corrections
  const correction = detectCorrection(text, updatedDossier);
  if (correction) {
    if (correction.field === 'location') {
      updatedDossier.location = correction.value;
    } else if (correction.field === 'capital') {
      updatedDossier.capital = correction.value;
    } else if (correction.field === 'businessIdea') {
      updatedDossier.businessIdea = correction.value;
      updatedDossier.categoryCode = correction.categoryCode;
    }
  }

  // 7. Calculate completeness score
  let score = 0;
  if (updatedDossier.name && updatedDossier.name !== 'Entrepreneur') score += 15;
  if (updatedDossier.businessIdea) score += 35;
  if (updatedDossier.location) score += 20;
  if (updatedDossier.capital) score += 15;
  if (updatedDossier.land) score += 10;
  if (updatedDossier.experience) score += 5;
  updatedDossier.completeness = Math.min(100, score);

  // Check core facts
  const hasIdea = Boolean(updatedDossier.businessIdea);
  const hasLocation = Boolean(updatedDossier.location && updatedDossier.location !== 'Village, District');
  const hasCapital = Boolean(updatedDossier.capital && updatedDossier.capital > 0);
  const hasLand = Boolean(updatedDossier.land);
  const hasExperience = Boolean(updatedDossier.experience);

  // 8. Check analysis confirmation triggers ("yes", "go ahead", "analyze it", "avunu", "ha", "do it", "analyze my business")
  const isConfirmation = lower === 'yes' || 
                         lower === 'go ahead' || 
                         lower === 'analyze' || 
                         lower === 'analyze it' || 
                         lower === 'do it' || 
                         lower === 'avunu' || 
                         lower === 'ha' || 
                         lower === 'haan' || 
                         lower === 'అవును' || 
                         lower === 'हाँ' || 
                         lower.includes('analyze my business') || 
                         lower.includes('go ahead') || 
                         lower.includes('analyze it');

  let responseText = '';
  let actionType = 'ASK_QUESTION';
  let readyForAnalysis = false;

  // Turn count check (Greeting strictly on Turn 0)
  const isTurn0 = history.length <= 1;

  // RESPONSE GENERATION PIPELINE

  // Path A: Edit Details Intent
  if (commandIntent === 'EDIT_DETAILS') {
    actionType = 'EDIT_DETAILS';
    responseText = currentLang === 'hi'
      ? `ज़रूर! आप क्या विवरण अपडेट करना चाहते हैं? आप अपना स्थान ('स्थान विजयवाड़ा है'), बजट ('बजट 12 लाख है') या व्यवसाय प्रकार बदल सकते हैं।`
      : (currentLang === 'te'
        ? `ఖచ్చితంగా! మీరు ఏ వివరాలను నవీకరించాలనుకుంటున్నారు? మీరు మీ ప్రాంతం ('విజయవాడ అని మార్చు'), పెట్టుబడి ('బడ్జెట్ 12 లక్షలు') లేదా వ్యాపారాన్ని మార్చవచ్చు.`
        : `Sure, ${updatedDossier.name}! What detail would you like to edit? You can update your location (e.g., 'change location to Vijayawada'), capital ('make budget 12 lakh'), or business idea ('make it dairy').`);
  }
  // Path B: Business Idea Suggestion Intent
  else if (commandIntent === 'BUSINESS_IDEA_SUGGESTION' && !hasIdea) {
    if (!hasLocation) {
      actionType = 'ASK_LOCATION_FOR_SUGGESTION';
      responseText = currentLang === 'hi'
        ? `बिल्कुल! मैं आपके लिए सबसे बेहतरीन ग्रामीण व्यावसायिक अवसरों का सुझाव दूंगा। आप किस स्थान या गाँव में व्यवसाय शुरू करना चाहते हैं?`
        : (currentLang === 'te'
          ? `ఖచ్చితంగా! మీ ప్రాంతానికి అత్యంత అనుకూలమైన వ్యాపార అవకాశాలను సూచించడానికి నేను సిద్ధంగా ఉన్నాను. మీరు ఏ ప్రాంతం లేదా గ్రామంలో ప్రారంభించాలనుకుంటున్నారు?`
          : `Of course, ${updatedDossier.name}! I'd be happy to suggest top high-potential rural business opportunities for you. Which location or village are you planning to operate in?`);
    } else {
      actionType = 'SHOW_RECOMMENDATIONS';
      responseText = currentLang === 'hi'
        ? `**${updatedDossier.location}** में बाज़ार मांग के आधार पर शीर्ष अनुशंसित अवसर:\n\n1. 🚜 **कस्टम हायरिंग सेंटर** — उच्च क्षेत्रीय मांग\n2. 🥛 **डेयरी फार्मिंग** — दैनिक स्थिर आय\n3. 🍄 **मशरूम यूनिट** — कम भूमि आवश्यकता\n\nआप इनमें से कौन सा अवसर शुरू करना चाहेंगे?`
        : (currentLang === 'te'
          ? `**${updatedDossier.location}** లో మార్కెట్ డిమాండ్ ఆధారంగా ఉత్తమ వ్యాపార అవకాశాలు:\n\n1. 🚜 **కస్టమ్ హైరింగ్ సెంటర్** — అధిక డిమాండ్\n2. 🥛 **డైరీ ఫారమింగ్** — నిరంతర రోజువారీ ఆదాయం\n3. 🍄 **మష్రూమ్ యూనిట్** — తక్కువ స్థలం అవసరం\n\nవీటిలో ఏ వ్యాపారం మీరు ప్రారంభించాలనుకుంటున్నారు?`
          : `Based on market demand in **${updatedDossier.location}**, here are the top recommended micro-enterprise opportunities:\n\n1. 🚜 **Custom Hiring Centre (Farm Machinery)** — High regional demand & subsidies\n2. 🥛 **Commercial Dairy Farming** — Stable daily cash flow\n3. 🍄 **Indoor Oyster & Button Mushroom Unit** — Low land footprint, fast returns\n4. ☀️ **Solar Kiosk & Power Hub** — Essential rural energy service\n\nWhich of these opportunities sounds most interesting to you?`);
    }
  }
  // Path C: Explicit Correction Handling
  else if (correction) {
    responseText = currentLang === 'hi' ? correction.messageHi : (currentLang === 'te' ? correction.messageTe : correction.messageEn);
  }
  // Path D: Analysis Confirmation Triggered
  else if (isConfirmation && hasIdea) {
    readyForAnalysis = true;
    actionType = 'CONFIRM_BUSINESS_PLAN';
    responseText = currentLang === 'hi'
      ? `🎉 मैंने आपकी **${updatedDossier.businessIdea}** योजना का संपूर्ण विश्लेषण पूरा कर लिया है! नीचे बटन पर क्लिक करके अपना विश्लेषण देखें।`
      : (currentLang === 'te'
        ? `🎉 నేను మీ **${updatedDossier.businessIdea}** వ్యాపార ప్రణాళిక విశ్లేషణను పూర్తి చేశాను! వివరాల కోసం కింద ఉన్న బటన్ నొక్కండి.`
        : `🎉 I've analyzed your **${updatedDossier.businessIdea}** business opportunity! Click below to inspect your full analysis.`);
  }
  // Path E: Missing Business Idea
  else if (!hasIdea) {
    actionType = 'ASK_BUSINESS_IDEA';
    if (isTurn0) {
      responseText = currentLang === 'hi'
        ? `नमस्ते ${updatedDossier.name} 👋\n\nमैं सारथी हूँ, आपका व्यावसायिक साथी। क्या आपके पास कोई व्यावसायिक विचार है, या आप चाहते हैं कि मैं आपको कुछ बेहतरीन अवसर सुझाऊँ?`
        : (currentLang === 'te'
          ? `నమస్తే ${updatedDossier.name} 👋\n\nనేను సారథిని, మీ వ్యాపార తోడు. మీ మనస్సులో ఏదైనా వ్యాపార ఆలోచన ఉందా, లేదా నేను కొన్ని అవకాశాలను సూచించమంటారా?`
          : `Hello ${updatedDossier.name} 👋\n\nI'm Saarthi, your business companion. Do you already have a business idea in mind, or would you like me to suggest some opportunities for you?`);
    } else {
      responseText = currentLang === 'hi'
        ? `आप किस प्रकार का व्यवसाय शुरू करना चाहते हैं? (उदा. पोल्ट्री फ़ार्म, डेयरी, मशरूम खेती, या किराना स्टोर)`
        : (currentLang === 'te'
          ? `మీరు ఏ రకమైన వ్యాపారం ప్రారంభించాలనుకుంటున్నారు? (ఉదా: పౌల్ట్రీ ఫారమ్, డైరీ, పుట్టగొడుగుల పెంపకం, లేదా కిరాణా స్టోర్)`
          : `What type of business idea would you like to start? (e.g. Poultry Farm, Commercial Dairy Farming, Mushroom Unit, or Retail Store)`);
    }
  }
  // Path F: Missing Location
  else if (!hasLocation) {
    actionType = 'ASK_LOCATION';
    responseText = currentLang === 'hi'
      ? `गॉट इट — **${updatedDossier.businessIdea}**। आप इसे किस शहर या गांव में शुरू करना चाहते हैं?`
      : (currentLang === 'te'
        ? `అర్థమైంది — **${updatedDossier.businessIdea}**। మీరు దీన్ని ఏ ప్రాంతం లేదా జిల్లాలో ప్రారంభించాలనుకుంటున్నారు?`
        : `That sounds promising! **${updatedDossier.businessIdea}** can be very rewarding. What location or village are you planning to operate in?`);
  }
  // Path G: Missing Capital
  else if (!hasCapital) {
    actionType = 'ASK_CAPITAL';
    responseText = currentLang === 'hi'
      ? `गॉट इट — **${updatedDossier.businessIdea}** (${updatedDossier.location})। इस व्यवसाय के लिए आप लगभग कितना बजट या पूँजी लगाने की योजना बना रहे हैं?`
      : (currentLang === 'te'
        ? `అర్థమైంది — **${updatedDossier.businessIdea}** (${updatedDossier.location})। ఈ వ్యాపారం కోసం మీరు ఎంత పెట్టుబడి పెట్టాలనుకుంటున్నారు?`
        : `Got it — **${updatedDossier.businessIdea}** in ${updatedDossier.location}.\nRoughly how much capital are you comfortable investing?`);
  }
  // Path H: Missing Land / Workspace
  else if (!hasLand) {
    actionType = 'ASK_LAND';
    responseText = currentLang === 'hi'
      ? `समझ गया — ₹${updatedDossier.capital.toLocaleString('en-IN')} का बजट। क्या आपके पास ${updatedDossier.businessIdea} के लिए अपनी ज़मीन या शेड उपलब्ध है?`
      : (currentLang === 'te'
        ? `సరే, ₹${updatedDossier.capital.toLocaleString('en-IN')} పెట్టుబడి. ఈ ${updatedDossier.businessIdea} కోసం మీకు స్థలం లేదా షెడ్ ఉందా?`
        : `₹${updatedDossier.capital.toLocaleString('en-IN')} gives us a solid investment foundation.\nDo you already have land or a suitable workspace available for ${updatedDossier.businessIdea}?`);
  }
  // Path I: Missing Experience
  else if (!hasExperience) {
    actionType = 'ASK_EXPERIENCE';
    responseText = currentLang === 'hi'
      ? `बहुत अच्छा — ${updatedDossier.land} उपलब्ध है। क्या आपके या आपके परिवार के पास ${updatedDossier.businessIdea} का कोई पूर्व अनुभव या प्रशिक्षण है?`
      : (currentLang === 'te'
        ? `చాలా మంచిది — ${updatedDossier.land} అందుబాటులో ఉంది. మీకు లేదా మీ కుటుంబానికి ఈ ${updatedDossier.businessIdea} లో ముందస్తు అనుభవం ఉందా?`
        : `Got it, ${updatedDossier.land} available.\nDo you or your family have any previous experience or training in ${updatedDossier.businessIdea}?`);
  }
  // Path J: All 5 Core Fields Present -> Offer Analysis
  else {
    readyForAnalysis = true;
    actionType = 'OFFER_ANALYSIS';
    responseText = currentLang === 'hi'
      ? `बहुत बढ़िया, ${updatedDossier.name}। मैंने आपके विचार का विवरण तैयार कर लिया है:\n• व्यवसाय: **${updatedDossier.businessIdea}**\n• स्थान: **${updatedDossier.location}**\n• उपलब्ध पूँजी: **₹${updatedDossier.capital.toLocaleString('en-IN')}**\n• भूमि/स्थान: **${updatedDossier.land}**\n• अनुभव: **${updatedDossier.experience}**${updatedDossier.financingRequired ? '\n• बैंक ऋण: **आवश्यक**' : ''}\n\nक्या मैं इसका संपूर्ण व्यावसायिक और वित्तीय विश्लेषण शुरू करूँ?`
      : (currentLang === 'te'
        ? `చాలా సంతోషం, ${updatedDossier.name}। మీ ఆలోచన వివరాలను నేను రికార్డ్ చేశాను:\n• వ్యాపారం: **${updatedDossier.businessIdea}**\n• ప్రాంతం: **${updatedDossier.location}**\n• పెట్టుబడి: **₹${updatedDossier.capital.toLocaleString('en-IN')}**\n• స్థలం: **${updatedDossier.land}**\n• అనుభవం: **${updatedDossier.experience}**${updatedDossier.financingRequired ? '\n• బ్యాంక్ రుణం: **అవసరం**' : ''}\n\nనేను దీని వ్యాపార మరియు ఆర్థిక విశ్లేషణను ప్రారంభించమంటారా?`
        : `Great, ${updatedDossier.name}. I now have enough information to evaluate this ${updatedDossier.businessIdea} opportunity in ${updatedDossier.location}.\n\nHere's what I've understood:\n• Business: **${updatedDossier.businessIdea}**\n• Location: **${updatedDossier.location}**\n• Investment: **₹${updatedDossier.capital.toLocaleString('en-IN')}**\n• Land/Workspace: **${updatedDossier.land}**\n• Experience: **${updatedDossier.experience}**${updatedDossier.financingRequired ? '\n• Financing: **Bank Loan Assistance Required**' : ''}\n\nWould you like me to analyze this business opportunity now?`);
  }

  return {
    reply: responseText,
    actionType,
    updatedDossier,
    extractedEntities: extracted,
    readyForAnalysis,
    detectedLanguage: currentLang
  };
}
