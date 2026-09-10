// Saarthi AI Multilingual Agent Engine & Interview Service
// Processes text and voice inputs, extracts structured business entities, manages conversational state,
// answers user questions, handles corrections, and drives the Live Business Plan Dossier.

import { parseCapitalAmount } from '../utils/businessPlanEngine';

/**
 * Normalizes and extracts numbers, land, locations, names, and business entities from multilingual input (EN, HI, TE).
 */
export function extractAllEntities(userMessage = '', currentDossier = {}, profile = {}) {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();
  const extracted = {};

  // 1. ENTREPRENEUR NAME
  const namePatterns = [
    /(?:my name is|i am|call me|name's)\s+([a-zA-Z\s]{2,20})/i,
    /(?:मेरा नाम|मैं हूँ|मुझे)\s+([a-zA-Z\u0900-\u097F\s]{2,20})/i,
    /(?:నా పేరు|నేను)\s+([a-zA-Z\u0C00-\u0C7F\s]{2,20})/i
  ];
  for (const pat of namePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const nameCand = match[1].split(/\s+(?:from|in|and|with|want|\d)/)[0].trim();
      if (nameCand.length >= 2 && !['business', 'poultry', 'dairy', 'a', 'the'].includes(nameCand.toLowerCase())) {
        extracted.entrepreneurName = nameCand.charAt(0).toUpperCase() + nameCand.slice(1);
        break;
      }
    }
  }

  // Single word answer when asked for name (e.g. "Laxya")
  if (!extracted.entrepreneurName && (!currentDossier.name || currentDossier.name === 'Entrepreneur') && text.split(/\s+/).length <= 2) {
    const cleanWord = text.replace(/[^a-zA-Z\u0900-\u097F\u0C00-\u0C7F]/g, '').trim();
    if (cleanWord.length >= 3 && !['hello', 'hi', 'namaste', 'namaskaram', 'yes', 'no', 'yeah'].includes(cleanWord.toLowerCase())) {
      extracted.entrepreneurName = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    }
  }

  // 2. BUSINESS IDEA & CATEGORY
  if (lower.includes('poultry') || lower.includes('broiler') || lower.includes('chicken') || lower.includes('egg') || lower.includes('కోడి') || lower.includes('मुर्गी')) {
    extracted.businessIdea = 'Poultry Farming Unit';
    extracted.categoryCode = 'POULTRY_FARMING';
  } else if (lower.includes('dairy') || lower.includes('cow') || lower.includes('buffalo') || lower.includes('milk') || lower.includes('పాడి') || lower.includes('डेयरी') || lower.includes('दूध')) {
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
  } else if (lower.includes('kirana') || lower.includes('retail') || lower.includes('shop') || lower.includes('store') || lower.includes('దుకాణం') || lower.includes('दुकान')) {
    extracted.businessIdea = 'Rural Retail Kirana Store';
    extracted.categoryCode = 'RETAIL_KIRANA';
  } else if (lower.includes('solar') || lower.includes('power kiosk') || lower.includes('सोलर')) {
    extracted.businessIdea = 'Solar Charging & Power Kiosk';
    extracted.categoryCode = 'SOLAR_ENERGY';
  } else if (lower.includes('agri input') || lower.includes('seed') || text.includes('fertilizer') || lower.includes('ఎరువులు')) {
    extracted.businessIdea = 'Agri Inputs & Fertilizer Depot';
    extracted.categoryCode = 'AGRI_INPUTS';
  }

  // 3. LOCATION (District/Village)
  const locMatch = text.match(/(?:in|at|near|from|lo|me|లో|में)\s+([a-zA-Z\u0900-\u097F\u0C00-\u0C7F\s]{3,20})/i);
  if (locMatch && locMatch[1]) {
    const locStr = locMatch[1].split(/\s+(?:with|having|for|budget|\d)/)[0].trim();
    if (locStr.length >= 3 && !['my', 'a', 'the', 'rupees', 'lakh', 'acres', 'state', 'village'].includes(locStr.toLowerCase())) {
      extracted.location = locStr.charAt(0).toUpperCase() + locStr.slice(1);
    }
  }

  // 4. CAPITAL
  const parsedCap = parseCapitalAmount(text);
  if (parsedCap) {
    extracted.availableCapital = parsedCap;
  }

  // 5. LAND HOLDING & OWNERSHIP
  const acreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:acres?|acre|ఎకరాలు|ఎకరం|एकड़)/i);
  if (acreMatch) {
    extracted.landHolding = `${acreMatch[1]} Acres`;
  } else if (lower.includes('sq ft') || lower.includes('square feet') || lower.includes('गज़')) {
    const sqMatch = lower.match(/(\d+)\s*(?:sq ft|square feet)/i);
    if (sqMatch) extracted.landHolding = `${sqMatch[1]} Sq Ft Workspace`;
  }

  if (lower.includes('own land') || lower.includes('my own') || lower.includes('owned') || lower.includes('సొంత') || lower.includes('खुद की')) {
    extracted.landOwnership = 'owned';
  } else if (lower.includes('rent') || lower.includes('leased') || lower.includes('కిరాయి') || lower.includes('किराए')) {
    extracted.landOwnership = 'rented';
  }

  // 6. INFRASTRUCTURE (Water & Electricity)
  if (lower.includes('water') || lower.includes('electricity') || lower.includes('power') || lower.includes('నీరు') || lower.includes('కరెంట్') || lower.includes('पानी') || lower.includes('बिजली')) {
    const hasWater = lower.includes('water') || lower.includes('నీరు') || lower.includes('पानी');
    const hasPower = lower.includes('electricity') || lower.includes('power') || lower.includes('కరెంట్') || lower.includes('बिजली');
    extracted.infrastructure = {
      water: hasWater ? 'Available' : 'Pending',
      electricity: hasPower ? 'Available' : 'Pending'
    };
  }

  // 7. EXPERIENCE & SKILLS
  if (lower.includes('experience') || lower.includes('anubhavam') || lower.includes('अनुभव') || lower.includes('worked in') || lower.includes('farming')) {
    if (lower.includes('no experience') || lower.includes('fresher') || lower.includes(' beginner') || lower.includes('లేదు') || lower.includes('नहीं')) {
      extracted.previousExperience = 'Beginner / Training required';
    } else {
      extracted.previousExperience = text.length > 50 ? 'Experienced in Agriculture/Farming' : text;
    }
  }

  return extracted;
}

/**
 * Detects if user message is correcting a previously stated field
 */
export function detectCorrection(text = '', currentDossier = {}) {
  const lower = text.toLowerCase();
  
  const isCorrectionPhrase = lower.includes('actually') || 
                             lower.includes('instead of') || 
                             lower.includes('change') || 
                             lower.includes('correction') || 
                             lower.includes('not ') || 
                             lower.includes('కాదు') || 
                             lower.includes('नहीं');

  if (!isCorrectionPhrase) return null;

  // Check capital correction
  const cap = parseCapitalAmount(text);
  if (cap && currentDossier.capital !== cap) {
    return {
      field: 'availableCapital',
      value: cap,
      messageEn: `Got it — I'll update your available capital to ₹${cap.toLocaleString('en-IN')}.`,
      messageHi: `समझ गया — मैं आपकी उपलब्ध पूँजी को ₹${cap.toLocaleString('en-IN')} पर अपडेट कर रहा हूँ।`,
      messageTe: `అర్థమైంది — నేను మీ అందుబాటులో ఉన్న పెట్టుబడిని ₹${cap.toLocaleString('en-IN')} కి నవీకరిస్తున్నాను.`
    };
  }

  return null;
}

/**
 * Detects if user is asking a general question during interview
 */
export function detectQuestion(text = '') {
  const lower = text.toLowerCase();
  const isQ = text.includes('?') || 
              lower.startsWith('what') || 
              lower.startsWith('how') || 
              lower.startsWith('can') || 
              lower.startsWith('is') || 
              lower.startsWith('are') ||
              lower.includes('cost') ||
              lower.includes('scheme') ||
              lower.includes('loan') ||
              lower.includes(' subsidy') ||
              lower.includes('ఎంత') ||
              lower.includes('ఏమిటి') ||
              lower.includes('कितना');

  if (!isQ) return null;

  if (lower.includes('cost') || lower.includes('budget') || lower.includes('investment') || lower.includes('ఖర్చు')) {
    return {
      answerEn: "For a micro-enterprise, project cost depends on scale. A small unit ranges from ₹2L to ₹5L, with 90% concessional loan eligibility under MoSJE schemes.",
      answerHi: "सूक्ष्म उद्यम के लिए लागत पैमाने पर निर्भर करती है। छोटी इकाई ₹2 लाख से ₹5 लाख तक होती है, जिसमें 90% तक रियायती ऋण मिलता है।",
      answerTe: "సూక్ష్మ వ్యాపారానికి ఖర్చు స్థాయిపై ఆధారపడి ఉంటుంది. చిన్న యూనిట్ ₹2L నుండి ₹5L వరకు ఉంటుంది, 90% రాయితీ రుణం అందుబాటులో ఉంటుంది."
    };
  }

  if (lower.includes('scheme') || lower.includes('subsidy') || lower.includes('government') || lower.includes('పథకం') || lower.includes('योजना')) {
    return {
      answerEn: "Eligible entrepreneurs can access MoSJE concessional loans (NBCFDC/NSFDC) at 4-8% interest rate with up to 90% project coverage.",
      answerHi: "पात्र उद्यमी 4-8% ब्याज दर पर 90% तक की कवरेज के साथ MoSJE रियायती ऋण योजना (NBCFDC/NSFDC) का लाभ उठा सकते हैं।",
      answerTe: "అర్హులైన పారిశ్రామికవేత్తలు 4-8% వడ్డీ రేటుతో 90% వరకు ప్రాజెక్ట్ కవరేజ్ పొందే NBCFDC/NSFDC పథకాలను పొందవచ్చు."
    };
  }

  if (lower.includes('loan') || lower.includes('bank') || lower.includes('రుణం') || lower.includes('ऋण')) {
    return {
      answerEn: "Yes! Based on your target plan, UdyamSaarthi prepares an official bank-ready DPR and connects you to government loan schemes.",
      answerHi: "हाँ! आपकी योजना के आधार पर, सारथी बैंक-रेडी डीपीआर (DPR) तैयार करता है और आपको सरकारी ऋण योजनाओं से जोड़ता है।",
      answerTe: "అవును! మీ ప్రణాళిక ఆధారంగా, సారథి అధికారిక బ్యాంక్ DPR ని తయారు చేసి ప్రభుత్వ రుణ పథకాలకు కలుపుతుంది."
    };
  }

  return {
    answerEn: "I can guide you through every step of this business, including market feasibility, total setup cost, loan schemes, and projected profits.",
    answerHi: "मैं आपको इस व्यवसाय के हर चरण में मार्गदर्शन कर सकता हूँ, जिसमें बाज़ार, लागत, सरकारी योजनाएं और लाभ शामिल हैं।",
    answerTe: "మార్కెట్ అవకాశాలు, ఖర్చు, ప్రభుత్వ పథకాలు మరియు లాభాల అంచనాలతో సహా ప్రతి దశలో నేను సహాయం చేస్తాను."
  };
}

/**
 * Evaluates dossier completeness and determines the next intelligent question
 */
export function processSaarthiMessage({
  message = '',
  history = [],
  dossier = {},
  profile = {},
  language = 'en'
}) {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Extract new entities from current input
  const extracted = extractAllEntities(text, dossier, profile);

  // 2. Merge with existing dossier state
  const updatedDossier = {
    ...dossier,
    name: extracted.entrepreneurName || dossier.name || profile.name || 'Entrepreneur',
    businessIdea: extracted.businessIdea || dossier.businessIdea || profile.business_idea || '',
    categoryCode: extracted.categoryCode || dossier.categoryCode || 'GENERAL_ENTERPRISE',
    location: extracted.location || dossier.location || `${profile.village_name || 'Guntur'}, ${profile.district || 'Guntur'}`,
    capital: extracted.availableCapital || dossier.capital || profile.available_capital || 300000,
    land: extracted.landHolding || dossier.land || `${profile.land_acres || 2} Acres`,
    landOwnership: extracted.landOwnership || dossier.landOwnership || 'owned',
    infrastructure: {
      water: extracted.infrastructure?.water || dossier.infrastructure?.water || 'Available',
      electricity: extracted.infrastructure?.electricity || dossier.infrastructure?.electricity || 'Available'
    },
    experience: extracted.previousExperience || dossier.experience || (profile.skills || ['Agriculture']).join(', '),
    scale: dossier.scale || 'Small'
  };

  // 3. Check for corrections
  const correction = detectCorrection(text, dossier);
  if (correction) {
    updatedDossier[correction.field] = correction.value;
  }

  // 4. Calculate dossier completeness (0 to 100%)
  let score = 0;
  if (updatedDossier.name && updatedDossier.name !== 'Entrepreneur') score += 15;
  if (updatedDossier.businessIdea) score += 35;
  if (updatedDossier.location) score += 20;
  if (updatedDossier.capital) score += 15;
  if (updatedDossier.land) score += 10;
  if (updatedDossier.experience) score += 5;

  updatedDossier.completeness = Math.min(100, score);

  // 5. Check if user asked a question
  const questionAnswer = detectQuestion(text);

  // 6. Check explicit trigger commands ("create plan", "analyze", "yes go ahead")
  const isCommand = lower.includes('create') || 
                    lower.includes('analyze') || 
                    lower.includes('go ahead') || 
                    lower.includes('confirm') || 
                    lower.includes('వ్యాపార ప్రణాళిక') || 
                    lower.includes('विश्लेषण');

  // 7. Determine Next Interview State & Response Message
  let responseText = '';
  let actionType = 'ASK_QUESTION';
  let readyForAnalysis = false;

  // Case A: Correction handling
  if (correction) {
    const corrMsg = language === 'hi' ? correction.messageHi : (language === 'te' ? correction.messageTe : correction.messageEn);
    responseText = corrMsg;
  }
  
  // Case B: User question handling
  else if (questionAnswer) {
    const qAns = language === 'hi' ? questionAnswer.answerHi : (language === 'te' ? questionAnswer.answerTe : questionAnswer.answerEn);
    
    if (updatedDossier.businessIdea && updatedDossier.capital) {
      const transEn = `\n\nReturning to your ${updatedDossier.businessIdea}: would you like me to run the full business analysis now?`;
      const transHi = `\n\nआपकी ${updatedDossier.businessIdea} योजना पर वापस आते हुए: क्या मैं अब इसका संपूर्ण विश्लेषण करूँ?`;
      const transTe = `\n\nమీ ${updatedDossier.businessIdea} ప్రణాళికకు వస్తే: నేను ఇప్పుడు పూర్తి విశ్లేషణను ప్లే చేయమంటారా?`;
      responseText = qAns + (language === 'hi' ? transHi : (language === 'te' ? transTe : transEn));
    } else {
      responseText = qAns;
    }
  }

  // Case C: Initial greeting response (Asking Name or Business Idea)
  else if (!updatedDossier.name || updatedDossier.name === 'Entrepreneur') {
    if (extracted.entrepreneurName) {
      responseText = language === 'hi'
        ? `नमस्ते ${extracted.entrepreneurName} 👋\n\nक्या आपके पास कोई व्यावसायिक विचार (जैसे पोल्ट्री, डेयरी, खाद्य प्रसंस्करण) है, या मैं आपको अवसर सुझाऊँ?`
        : (language === 'te'
          ? `నమస్తే ${extracted.entrepreneurName} 👋\n\nమీ మనస్సులో ఏదైనా వ్యాపార ఆలోచన ఉందా (ఉదా: పౌల్ట్రీ, డైరీ, ఫుడ్ ప్రాసెసింగ్), లేదా నేను కొన్ని అవకాశాలను సూచించమంటారా?`
          : `Hello ${extracted.entrepreneurName} 👋\n\nDo you already have a business idea in mind (such as Poultry, Dairy, Food Processing), or would you like me to suggest some opportunities?`);
    } else {
      responseText = language === 'hi'
        ? "Hello! Main UdyamSarthi hoon. Main aapke liye aapki location, interest, budget aur resources ke according suitable business identify karne mein help karungi. Sabse pehle, aapka naam kya hai?"
        : (language === 'te'
          ? "నమస్కారం! నేను ఉద్యమ్‌సారథిని. మీ ప్రాంతం, ఆసక్తి, బడ్జెట్ మరియు వనరుల ఆధారంగా సరైన వ్యాపారాన్ని గుర్తించడంలో నేను సహాయం చేస్తాను. ముందుగా, మీ పేరు ఏమిటి?"
          : "Hello! I am UdyamSarthi. I will help you identify a suitable business based on your location, interest, budget, and resources. First, what is your name?");
    }
  }

  // Case D: Missing Business Idea
  else if (!updatedDossier.businessIdea) {
    responseText = language === 'hi'
      ? `नमस्ते ${updatedDossier.name} 👋\nआप किस प्रकार का व्यवसाय शुरू करना चाहते हैं? (उदा. पोल्ट्री फ़ार्म, डेयरी, मशरूम खेती, या किराना स्टोर)`
      : (language === 'te'
        ? `నమస్తే ${updatedDossier.name} 👋\nమీరు ఏ రకమైన వ్యాపారం ప్రారంభించాలనుకుంటున్నారు? (ఉదా: పౌల్ట్రీ ఫారమ్, డైరీ, పుట్టగొడుగుల పెంపకం, లేదా కిరాణా స్టోర్)`
        : `Hello ${updatedDossier.name} 👋\nWhat type of business idea would you like to start? (e.g. Poultry Farm, Dairy Farming, Mushroom Unit, or Retail Shop)`);
  }

  // Case E: Core info acquired -> Check next missing details (Capital, Land, Experience)
  else if (!extracted.availableCapital && dossier.capital === 300000 && !text.includes('300000')) {
    responseText = language === 'hi'
      ? `बहुत बढ़िया ${updatedDossier.name}! ${updatedDossier.businessIdea} एक बेहतरीन अवसर है।\nइस व्यवसाय के लिए आप लगभग कितना बजट या पूँजी लगाने की योजना बना रहे हैं?`
      : (language === 'te'
        ? `చాలా మంచిది ${updatedDossier.name}! ${updatedDossier.businessIdea} ఒక మంచి అవకాశం.\nఈ వ్యాపారం కోసం మీరు ఎంత పెట్టుబడి పెట్టాలనుకుంటున్నారు?`
        : `That sounds interesting, ${updatedDossier.name}! A ${updatedDossier.businessIdea} in ${updatedDossier.location} can be evaluated based on local demand and setup costs.\nHow much capital are you planning to invest?`);
  }

  // Case F: Ask about Land / Workspace
  else if (!extracted.landHolding && dossier.land === '2 Acres' && !text.includes('acre')) {
    responseText = language === 'hi'
      ? `ठीक है, ₹${updatedDossier.capital.toLocaleString('en-IN')} का बजट।\nक्या आपके पास ${updatedDossier.businessIdea} के लिए अपनी ज़मीन/स्थान उपलब्ध है, या आप किराए पर लेंगे?`
      : (language === 'te'
        ? `సరే, ₹${updatedDossier.capital.toLocaleString('en-IN')} పెట్టుబడి.\nఈ ${updatedDossier.businessIdea} కోసం మీకు సొంత స్థలం ఉందా, లేదా అద్దెకు తీసుకుంటారా?`
        : `Got it, around ₹${updatedDossier.capital.toLocaleString('en-IN')} capital.\nWill you be using your own land/space for the ${updatedDossier.businessIdea}, or do you plan to rent a space?`);
  }

  // Case G: Confirmation & Analysis Readiness
  if (updatedDossier.businessIdea && (updatedDossier.capital || extracted.availableCapital) && (isCommand || updatedDossier.completeness >= 65)) {
    readyForAnalysis = true;
    actionType = 'CONFIRM_BUSINESS_PLAN';
    
    responseText = language === 'hi'
      ? `मैंने आपके विचार का विवरण तैयार कर लिया है:\n• उद्यमी: **${updatedDossier.name}**\n• व्यवसाय: **${updatedDossier.businessIdea}**\n• स्थान: **${updatedDossier.location}**\n• उपलब्ध पूँजी: **₹${updatedDossier.capital.toLocaleString('en-IN')}**\n• भूमि/स्थान: **${updatedDossier.land}**\n\nक्या मैं इसका संपूर्ण व्यावसायिक और वित्तीय विश्लेषण शुरू करूँ?`
      : (language === 'te'
        ? `మీ ఆలోచన వివరాలను నేను సేకరించాను:\n• పారిశ్రామికవేత్త: **${updatedDossier.name}**\n• వ్యాపారం: **${updatedDossier.businessIdea}**\n• ప్రాంతం: **${updatedDossier.location}**\n• అందుబాటులో ఉన్న పెట్టుబడి: **₹${updatedDossier.capital.toLocaleString('en-IN')}**\n• స్థలం: **${updatedDossier.land}**\n\nనేను దీని వ్యాపార మరియు ఆర్థిక విశ్లేషణను ప్రారంభించమంటారా?`
        : `Here's what I understood about your business idea:\n• Entrepreneur: **${updatedDossier.name}**\n• Business Idea: **${updatedDossier.businessIdea}**\n• Location: **${updatedDossier.location}**\n• Available Capital: **₹${updatedDossier.capital.toLocaleString('en-IN')}**\n• Land/Workspace: **${updatedDossier.land}**\n\nShould I analyze this business opportunity now?`);
  }

  return {
    reply: responseText,
    actionType,
    updatedDossier,
    extractedEntities: extracted,
    readyForAnalysis
  };
}
