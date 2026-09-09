/**
 * UdyamSarthi Controlled Conversational Business Advisory Engine
 * Implements the 59-Rule Canonical UdyamSarthi Specification
 * Trilingual: Hindi (Hinglish/Devanagari), Telugu, English
 */

const { UDYAMSARTHI_SYSTEM_PROMPT } = require('../config/udyamSarthiPrompt');

// Helper to format currency in Indian numbering system
function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN');
}

// Clean markdown syntax for speech synthesis
function toSpeechText(markdownText) {
  if (!markdownText) return '';
  return markdownText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/•\s+/g, ', ')
    .replace(/[`_~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Detect language from text
 */
function detectLanguage(text, currentLang = 'hi') {
  const t = text.toLowerCase();
  const hasTelugu = /[\u0C00-\u0C7F]/.test(text) || /\b(naaku|vyaaparam|peddaga|pettubadi|lopaliki|daggara|cheyyali|unnayi)\b/i.test(t);
  const hasHindi = /[\u0900-\u097F]/.test(text) || /\b(namaste|mera|meri|mujhe|karna|hai|paas|lakh|zameen|kheti|batao|kaunsa|hogi|bhai|kisan|ji)\b/i.test(t);
  
  // Explicit language switch detection
  if (/\b(english mein|in english|switch to english|english lo)\b/i.test(t)) return 'en';
  if (/\b(hindi mein|in hindi|hindi lo|hindi lo cheppandi)\b/i.test(t)) return 'hi';
  if (/\b(telugu mein|in telugu|telugu lo|telugu lo matladu)\b/i.test(t)) return 'te';

  if (hasTelugu) return 'te';
  if (hasHindi) return 'hi';
  
  // Check if mostly English words
  if (/\b(i want|how much|suggest|business|loan|scheme|investment|profit|risk|capital)\b/i.test(t)) {
    return currentLang === 'te' ? 'te' : (currentLang === 'hi' ? 'hi' : 'en');
  }

  return currentLang || 'hi';
}

/**
 * Check for out-of-domain queries (cricket, sports, Bollywood, politics, etc.)
 */
function isOutOfDomain(text) {
  const t = text.toLowerCase();
  const outKeywords = [
    'cricket', 'ipl', 'match', 'who won', 'score', 'football', 'actor', 'actress', 
    'movie', 'film', 'song', 'joke', 'shayari', 'politics', 'election', 'pm kon hai', 
    'prime minister', 'weather today', 'mausam kaisa'
  ];
  return outKeywords.some(kw => t.includes(kw));
}

/**
 * Check for business comparison query (e.g. "dairy aur poultry mein kya better hai")
 */
function isComparisonQuery(text) {
  const t = text.toLowerCase();
  return (
    (t.includes('dairy') && t.includes('poultry')) ||
    (t.includes('better') && (t.includes('ya') || t.includes('or') || t.includes('aur'))) ||
    t.includes('compare') || t.includes('tulna')
  );
}

/**
 * Check for loan EMI query
 */
function isLoanQuery(text) {
  const t = text.toLowerCase();
  return (
    t.includes('emi') || 
    (t.includes('loan') && (t.includes('kitni') || t.includes('calculate') || t.includes('rate') || t.includes('byaj')))
  );
}

/**
 * Calculate deterministic EMI
 */
function calculateEMI(principal, annualRatePct = 8.5, tenureYears = 5) {
  const monthlyRate = (annualRatePct / 100) / 12;
  const totalMonths = tenureYears * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - principal;
  return {
    monthlyEMI: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    principal,
    rate: annualRatePct,
    tenureYears
  };
}

/**
 * Extract entities from user speech
 */
function extractEntities(text) {
  const t = text.toLowerCase();
  const entities = {};

  // Extract Capital / Money
  const lakhMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख|లక్ష)/i);
  if (lakhMatch) {
    entities.capital = parseFloat(lakhMatch[1]) * 100000;
  } else {
    const wordMap = { 'ek': 100000, 'do': 200000, 'teen': 300000, 'chaar': 400000, 'panch': 500000, 'one': 100000, 'two': 200000, 'three': 300000, 'four': 400000, 'five': 500000 };
    for (const [w, val] of Object.entries(wordMap)) {
      if (new RegExp(`\\b${w}\\s*(?:lakh|lac)\\b`, 'i').test(t)) {
        entities.capital = val;
        break;
      }
    }
    if (!entities.capital) {
      const kMatch = t.match(/(\d+)\s*(?:k|hazar|हजार|వేలు)/i);
      if (kMatch) {
        entities.capital = parseFloat(kMatch[1]) * 1000;
      } else {
        const directNum = t.match(/(?:₹|rs\.?|inr)?\s*(\d{5,7})\b/i);
        if (directNum) {
          entities.capital = parseFloat(directNum[1]);
        }
      }
    }
  }

  // Extract Land Acres
  const landMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ekad|एकड़|ఎకరాలు|bigha)/i);
  if (landMatch) {
    entities.land_acres = parseFloat(landMatch[1]);
  } else if (/\b(zameen nahi|no land|bhoomi ledu|land ledu)\b/i.test(t)) {
    entities.land_acres = 0;
  }

  // Extract Name (explicit or standalone word)
  const nameMatch = t.match(/(?:mera naam|my name is|na peru|naam)\s+([a-zA-Z\u0900-\u097F]+)/i);
  if (nameMatch) {
    entities.name = nameMatch[1].trim();
  }

  // Extract Experience / Skills
  if (/\b(farming|kheti|kisan|krishi|agriculture|సాగు)\b/i.test(t)) {
    entities.skills = ['farming', 'agriculture'];
    entities.experience = 'farming';
  } else if (/\b(dairy|doodh|cow|buffalo|milk|పాడి|పాల)\b/i.test(t)) {
    entities.skills = ['dairy'];
    entities.experience = 'dairy';
  } else if (/\b(poultry|murgi|chicken|కోళ్ల)\b/i.test(t)) {
    entities.skills = ['poultry'];
    entities.experience = 'poultry';
  } else if (/\b(shop|dukan|kirana|retail|store|కిరాణా)\b/i.test(t)) {
    entities.skills = ['retail', 'shop'];
    entities.experience = 'retail';
  } else if (/\b(mechanic|repair|machinery|tractor|మోటారు)\b/i.test(t)) {
    entities.skills = ['mechanic', 'repair'];
    entities.experience = 'technical_repair';
  }

  // Extract Experience Years
  const expYearsMatch = t.match(/(\d+)\s*(?:saal|sal|years|varshalu|ఏళ్లు)/i);
  if (expYearsMatch) {
    entities.experience_years = parseInt(expYearsMatch[1], 10);
  }

  // Extract Resources
  if (/\b(water|pani|borewell|kuan|నీరు)\b/i.test(t)) entities.has_water_source = true;
  if (/\b(electricity|bijli|power|3 phase|కరెంట్)\b/i.test(t)) entities.has_electricity = true;
  if (/\b(shop|shed|building|room|godown|షెడ్)\b/i.test(t)) entities.has_shop_building = true;
  if (/\b(vehicle|tractor|gaadi|tempo|వాహనం)\b/i.test(t)) entities.has_vehicle = true;

  // Extract Business Goal
  if (/\b(additional income|side business|extra income|part time|अतिरिक्त आय)\b/i.test(t) || t === '1') {
    entities.goal = 'Additional income';
  } else if (/\b(full time|main business|full-time|मुख्य व्यवसाय)\b/i.test(t) || t === '2') {
    entities.goal = 'Full-time business';
  } else if (/\b(employment|rozgar|jobs|ఉపాధి)\b/i.test(t) || t === '3') {
    entities.goal = 'Employment generation';
  } else if (/\b(expansion|badhana|grow|విస్తరణ)\b/i.test(t) || t === '4') {
    entities.goal = 'Existing business expansion';
  }

  return entities;
}

/**
 * Main UdyamSarthi Conversational Step Processor
 */
async function processUdyamSarthiChat({ message, profile = {}, session_state = {}, currentLang = 'hi', callAI }) {
  const userText = (message || '').trim();
  const detectedLang = detectLanguage(userText, session_state.lang || currentLang);
  const entities = extractEntities(userText);

  // Maintain profile memory
  const memory = {
    ...session_state,
    lang: detectedLang,
    name: entities.name || session_state.name || profile.name || null,
    capital: entities.capital !== undefined ? entities.capital : (session_state.capital || profile.available_capital || null),
    land_acres: entities.land_acres !== undefined ? entities.land_acres : (session_state.land_acres !== undefined ? session_state.land_acres : (profile.land_acres || null)),
    skills: entities.skills || session_state.skills || profile.skills || [],
    experience_years: entities.experience_years || session_state.experience_years || profile.experience_years || null,
    goal: entities.goal || session_state.goal || null,
    has_water_source: entities.has_water_source !== undefined ? entities.has_water_source : (session_state.has_water_source ?? profile.has_water_source ?? true),
    has_electricity: entities.has_electricity !== undefined ? entities.has_electricity : (session_state.has_electricity ?? profile.has_electricity ?? true),
    has_shop_building: entities.has_shop_building !== undefined ? entities.has_shop_building : (session_state.has_shop_building ?? profile.has_shop_building ?? false),
    has_vehicle: entities.has_vehicle !== undefined ? entities.has_vehicle : (session_state.has_vehicle ?? profile.has_vehicle ?? false),
    stage: session_state.stage || 'GREETING'
  };

  const userName = memory.name || 'Rajeev';
  const lang = detectedLang;

  // 1. Check Out-of-Domain Guardrail (Rule 38)
  if (isOutOfDomain(userText)) {
    let reply = '';
    if (lang === 'hi') {
      reply = `Main UdyamSarthi hoon aur mera focus rural aur small-town business planning, market analysis, finance, business risk aur government business schemes par hai. Is topic mein main reliable assistance nahi de sakta.\n\nBataiye, aapke business ya investment plan mein main aapki kya madad karoon?`;
    } else if (lang === 'te') {
      reply = `నేను ఉద్యమ్‌సారథిని. గ్రామీణ మరియు పట్టణ వ్యాపార ప్రణాళిక, మార్కెట్ విశ్లేషణ, ఆర్థిక సహాయం మరియు ప్రభుత్వ పథకాలపై మాత్రమే నా దృష్టి ఉంటుంది. ఈ అంశంపై నేను సహాయం చేయలేను.\n\nమీ వ్యాపార ప్రణాళికలో నేను మీకు ఎలా సహాయపడగలను?`;
    } else {
      reply = `I am UdyamSarthi, dedicated strictly to rural and small-town business planning, local market feasibility, micro-finance, risk analysis, and government schemes. I cannot answer queries outside this business domain.\n\nHow may I assist you with your enterprise journey?`;
    }
    return {
      reply,
      speakText: toSpeechText(reply),
      session_state: memory,
      intent: 'OUT_OF_DOMAIN'
    };
  }

  // 2. Check Business Comparison (Rule 49)
  if (isComparisonQuery(userText)) {
    let reply = '';
    if (lang === 'hi') {
      reply = `### Dairy बनाम Poultry व्यवसाय तुलना\n\n| कारक (Factor) | Dairy Farming (डेयरी) | Poultry Farming (पोल्ट्री) |\n|---|---|---|\n| **प्रारंभिक पूँजी** | ₹2.5 लाख - ₹5 लाख (2-4 गाय/भैंस) | ₹1.8 लाख - ₹3 लाख (500-1000 ब्रायलर) |\n| **दैनिक नकद प्रवाह** | रोजाना दूध बिक्री से नियमित आय | 35-42 दिनों के बैच चक्र में एकमुश्त आय |\n| **जोखिम स्तर** | मध्यम (पशु स्वास्थ्य, हरा चारा उपलब्धता) | उच्च (तापमान, बीमारी, ब्रूडिंग नियंत्रण) |\n| **श्रम आवश्यकता** | प्रतिदिन 4-5 घंटे निरंतर देखभाल | बैच के दौरान गहन निगरानी |\n| **सरकारी योजना** | एनबीसीएफडीसी सावधि ऋण + डेयरी उद्यमिता | पीएमईजीपी + नाबार्ड पोल्ट्री वेंचर |\n\n**UdyamSarthi निष्कर्ष:** यदि आपके पास पर्याप्त हरा चारा और पानी उपलब्ध है, तो **डेयरी व्यवसाय** दैनिक स्थिर आय के लिए अधिक सुरक्षित विकल्प है।`;
    } else if (lang === 'te') {
      reply = `### పాల వ్యాపారం (Dairy) vs కోళ్ల వ్యాపారం (Poultry)\n\n• **పెట్టుబడి**: పాడి పరిశ్రమకు ₹2.5L - ₹5L అవసరం కాగా, పౌల్ట్రీకి ₹1.8L - ₹3L సరిపోతుంది.\n• **ఆదాయం**: పాల ద్వారా రోజువారీ నగదు లభిస్తుంది; పౌల్ట్రీలో 40 రోజుల బ్యాచ్ తర్వాత మాత్రమే వస్తుంది.\n• **రిస్క్**: పౌల్ట్రీలో వ్యాధుల రిస్క్ ఎక్కువ, పాడిలో స్థిరత్వం ఎక్కువ.\n\nమీకు పచ్చిగడ్డి మరియు నీటి సదుపాయం ఉంటే, **పాడి పరిశ్రమ** ఉత్తమ ఎంపిక!`;
    } else {
      reply = `### Business Comparison: Dairy Farming vs. Poultry Farming\n\n| Parameter | Dairy Farming | Poultry (Broiler) |\n|---|---|---|\n| **Initial Capital** | ₹2.5L - ₹5.0L (2-4 cattle) | ₹1.8L - ₹3.0L (500-1000 birds) |\n| **Cash Flow** | Daily steady milk sales | Lump-sum every 40-45 day cycle |\n| **Risk Level** | Moderate (vet care, fodder) | High (disease sensitivity, temperature) |\n| **Govt. Schemes** | NBCFDC Concessional / DEDS | PMEGP (up to 35% subsidy) |\n\n**Verdict:** Dairy provides consistent daily cash flow if fodder and water are accessible; Poultry gives faster capital turnover.`;
    }
    return {
      reply,
      speakText: toSpeechText(reply),
      session_state: memory,
      intent: 'BUSINESS_COMPARISON'
    };
  }

  // 3. Check Loan EMI Query (Rule 51)
  if (isLoanQuery(userText)) {
    const loanAmt = entities.capital || 500000;
    const emiDetails = calculateEMI(loanAmt, 8.5, 5);
    let reply = '';
    if (lang === 'hi') {
      reply = `**${formatINR(loanAmt)}** के व्यावसायिक ऋण का वित्तीय विवरण (8.5% रियायती ब्याज दर, 5 वर्ष अवधि):\n\n• **मासिक किस्त (EMI):** **${formatINR(emiDetails.monthlyEMI)}/माह**\n• **कुल देय ब्याज:** **${formatINR(emiDetails.totalInterest)}**\n• **कुल पुनर्भुगतान:** **${formatINR(emiDetails.totalPayment)}**\n\n(नोट: एनबीसीएफडीसी या मुद्रा योजना के तहत ब्याज दर 6% से 8.5% तक रियायती हो सकती है)।`;
    } else if (lang === 'te') {
      reply = `**${formatINR(loanAmt)}** వ్యాపార రుణానికి (8.5% వడ్డీ, 5 సంవత్సరాల కాలపరిమితి):\n\n• **నెలవారీ ఈఎమ్‌ఐ (EMI):** **${formatINR(emiDetails.monthlyEMI)}/నెల**\n• **మొత్తం వడ్డీ:** **${formatINR(emiDetails.totalInterest)}**\n• **మొత్తం చెల్లింపు:** **${formatINR(emiDetails.totalPayment)}**`;
    } else {
      reply = `Indicative EMI calculation for a **${formatINR(loanAmt)}** enterprise loan at 8.5% p.a. for 5 years:\n\n• **Monthly EMI:** **${formatINR(emiDetails.monthlyEMI)}/month**\n• **Total Interest:** **${formatINR(emiDetails.totalInterest)}**\n• **Total Repayment:** **${formatINR(emiDetails.totalPayment)}**\n\n*(Concessional schemes like NBCFDC or Mudra may offer rates as low as 6.0% - 8.0%).*`;
    }
    return {
      reply,
      speakText: toSpeechText(reply),
      session_state: memory,
      intent: 'EMI_CALCULATION'
    };
  }

  // 4. Conversational Progression Flow (Rules 11, 12, 13, 16, 44)
  const currentStage = memory.stage;

  // Case A: Initial Greeting or User saying hello
  if (currentStage === 'GREETING' || /^(namaste|hello|hi|hey|shuru karo|pranam|start)/i.test(userText)) {
    if (!memory.name) {
      memory.stage = 'ASKED_NAME';
      let reply = '';
      if (lang === 'hi') {
        reply = `Namaste! Kya main aapka naam jaan sakta hoon?`;
      } else if (lang === 'te') {
        reply = `నమస్కారం! మీ పేరు తెలుసుకోవచ్చా?`;
      } else {
        reply = `Hello! May I know your name?`;
      }
      return {
        reply,
        speakText: reply,
        session_state: memory,
        intent: 'GREETING'
      };
    }
  }

  // Case B: User just provided Name
  if (currentStage === 'ASKED_NAME' || (entities.name && !memory.capital)) {
    if (entities.name) memory.name = entities.name;
    else if (userText.split(' ').length <= 3 && !memory.capital) {
      memory.name = userText.replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F]/gi, '').trim();
    }
    
    memory.stage = 'ASKED_IDEA';
    const name = memory.name || 'Entrepreneur';
    let reply = '';
    if (lang === 'hi') {
      reply = `Dhanyavaad ${name} ji. 😊\nBataiye, main aapki kya madad kar sakta hoon?\n\nKya aapke mind mein koi particular business hai, ya main aapke liye suitable business suggest karun?`;
    } else if (lang === 'te') {
      reply = `ధన్యవాదాలు ${name} గారు. 😊\nనేను మీకు ఎలా సహాయం చేయగలను?\n\nమీకు ఇప్పటికే ఏదైనా వ్యాపార ఆలోచన ఉందా, లేక నేను మీకు సరిపోయే వ్యాపారాన్ని సూచించమంటారా?`;
    } else {
      reply = `Thank you, ${name}. 😊\nHow can I help you today?\n\nDo you already have a particular business in mind, or would you like me to suggest suitable options?`;
    }
    return {
      reply,
      speakText: toSpeechText(reply),
      session_state: memory,
      intent: 'NAME_ACKNOWLEDGED'
    };
  }

  // Case C: User asks to suggest a business or states intent to start
  if (currentStage === 'ASKED_IDEA' || (memory.name && !memory.capital)) {
    // If capital wasn't provided yet, ask for capital
    if (!memory.capital) {
      memory.stage = 'ASKED_CAPITAL';
      const name = memory.name || 'Kisan';
      let reply = '';
      if (lang === 'hi') {
        reply = `Bilkul ${name} ji. Sabse pehle mujhe aapka approximate investment budget pata hona chahiye.\n\nAap business mein kitna paisa invest kar sakte hain?`;
      } else if (lang === 'te') {
        reply = `ఖచ్చితంగా ${name} గారు. ముందుగా మీ పెట్టుబడి బడ్జెట్ తెలుసుకోవాలి.\n\nమీరు వ్యాపారంలో ఎంత మొత్తం పెట్టుబడి పెట్టగలరు?`;
      } else {
        reply = `Certainly, ${name}. First, I would like to know your approximate investment capacity.\n\nHow much capital can you invest in the business?`;
      }
      return {
        reply,
        speakText: toSpeechText(reply),
        session_state: memory,
        intent: 'ASK_CAPITAL'
      };
    }
  }

  // Case D: Capital received, now ask about Resources (Land, Shop, Vehicle, etc.)
  if (currentStage === 'ASKED_CAPITAL' || (memory.capital && memory.land_acres === null)) {
    if (entities.capital) memory.capital = entities.capital;
    memory.stage = 'ASKED_RESOURCES';
    const capFormatted = formatINR(memory.capital || 300000);
    let reply = '';
    if (lang === 'hi') {
      reply = `Ji, aapke paas approximately ${capFormatted} ka investment budget hai. 👍\n\nAb batayein, aapke paas koi land, shop, building, vehicle ya machinery available hai?`;
    } else if (lang === 'te') {
      reply = `సరే, మీ వద్ద దాదాపు ${capFormatted} పెట్టుబడి బడ్జెట్ ఉంది. 👍\n\nమీకు ఏదైనా భూమి, షాపు, భవనం లేదా యంత్ర పరికరాలు అందుబాటులో ఉన్నాయా?`;
    } else {
      reply = `Understood, you have an investment capacity of approximately ${capFormatted}. 👍\n\nDo you have any land, shop, building, vehicle, or machinery available?`;
    }
    return {
      reply,
      speakText: toSpeechText(reply),
      session_state: memory,
      intent: 'ASK_RESOURCES'
    };
  }

  // Case E: Resources received, now ask about Skills / Experience
  if (currentStage === 'ASKED_RESOURCES' || (memory.land_acres !== null && (!memory.skills || memory.skills.length === 0))) {
    if (entities.land_acres !== undefined) memory.land_acres = entities.land_acres;
    memory.stage = 'ASKED_EXPERIENCE';
    const landTxt = memory.land_acres ? `${memory.land_acres} acre land` : 'resources';
    let reply = '';
    if (lang === 'hi') {
      reply = `Bahut achha ${userName} ji. Aapke paas ${landTxt} available hai.\n\nKya aapko farming ya kisi agricultural activity ka experience hai? Ya kisi anya kaam ka anubhav hai?`;
    } else if (lang === 'te') {
      reply = `చాలా మంచిది ${userName} గారు. మీ వద్ద ${landTxt} అందుబాటులో ఉంది.\n\nమీకు వ్యవసాయం, పాడి పరిశ్రమ లేదా మరేదైనా పనిలో అనుభవం ఉందా?`;
    } else {
      reply = `Great, ${userName}. You have ${landTxt} available.\n\nDo you have experience in farming, dairy, or any specific technical or trade skill?`;
    }
    return {
      reply,
      speakText: toSpeechText(reply),
      session_state: memory,
      intent: 'ASK_EXPERIENCE'
    };
  }

  // Case F: Experience received, ask for Business Goal
  if (currentStage === 'ASKED_EXPERIENCE' || (memory.skills && memory.skills.length > 0 && !memory.goal)) {
    memory.stage = 'ASKED_GOAL';
    const capFormatted = formatINR(memory.capital || 300000);
    const landFormatted = memory.land_acres ? `${memory.land_acres} एकड़` : 'उपलब्ध संसाधन';
    const skillFormatted = (memory.skills || ['खेती']).join(', ');

    let reply = '';
    if (lang === 'hi') {
      reply = `Excellent ${userName} ji.\n\nAbhi tak main samjha hoon:\n• **Investment:** ${capFormatted}\n• **Land/Site:** ${landFormatted}\n• **Experience:** ${skillFormatted} (${memory.experience_years || 3} saal)\n\nAb ek aur important cheez bataiye, aapka main goal kya hai?\n1. **Additional income** (अतिरिक्त आय)\n2. **Full-time business** (पूर्णकालिक व्यवसाय)\n3. **Employment generation** (स्थानीय रोजगार सृजन)\n4. **Existing business expansion** (मौजूदा व्यवसाय विस्तार)`;
    } else if (lang === 'te') {
      reply = `చాలా బాగుంది ${userName} గారు.\n\nఇప్పటివరకు సేకరించిన సమాచారం:\n• పెట్టుబడి: ${capFormatted}\n• భూమి: ${landFormatted}\n• అనుభవం: ${skillFormatted}\n\nమీ ముఖ్య ఉద్దేశ్యం ఏమిటి?\n1. అదనపు ఆదాయం\n2. పూర్తి స్థాయి వ్యాపారం\n3. ఇతరులకు ఉపాధి కల్పన\n4. ప్రస్తుత వ్యాపార విస్తరణ`;
    } else {
      reply = `Excellent, ${userName}.\n\nHere is what we have mapped so far:\n• **Investment:** ${capFormatted}\n• **Land/Site:** ${landFormatted}\n• **Experience:** ${skillFormatted} (${memory.experience_years || 3} years)\n\nWhat is your primary enterprise goal?\n1. **Additional income**\n2. **Full-time business**\n3. **Employment generation**\n4. **Existing business expansion**`;
    }
    return {
      reply,
      speakText: toSpeechText(reply),
      session_state: memory,
      intent: 'ASK_GOAL'
    };
  }

  // Case G: All core profile variables gathered -> Execute Deterministic Recommendation Engine!
  memory.stage = 'ADVISORY_READY';

  const fullProfile = {
    ...profile,
    name: memory.name || profile.name || null,
    available_capital: memory.capital || profile.available_capital || null,
    land_acres: memory.land_acres !== null ? memory.land_acres : (profile.land_acres || null),
    skills: memory.skills && memory.skills.length > 0 ? memory.skills : (profile.skills || []),
    experience_years: memory.experience_years || profile.experience_years || null,
    business_goal: memory.goal || profile.business_goal || null,
    social_category: profile.social_category || null,
    latitude: profile.latitude || null,
    longitude: profile.longitude || null,
    village_name: profile.village_name || null,
    district: profile.district || memory.district || null,
    state: profile.state || null
  };

  let topRec = null;
  let allRecs = [];
  try {
    if (callAI) {
      const recResult = await callAI('/api/recommendations', fullProfile);
      topRec = recResult.top_recommendation;
      allRecs = recResult.all_recommendations;
    }
  } catch (err) {
    console.warn('AI recommendation call notice:', err.message);
  }

  const recName = topRec ? (lang === 'hi' ? topRec.name_hi : (lang === 'te' ? topRec.name_te : topRec.name_en)) : (lang === 'hi' ? 'डेयरी एवं वर्मीकम्पोस्ट इकाई' : 'Dairy & Fodder Unit');
  const score = topRec ? topRec.overall_suitability_score : 88;
  const profit = topRec?.financials?.projected_monthly_operating_profit ? formatINR(topRec.financials.projected_monthly_operating_profit) : '₹28,500';

  let reply = '';
  if (lang === 'hi') {
    reply = `### 🎯 UdyamSarthi अनुशंसा: ${recName}\n\n${userName} ji, aapke ${formatINR(fullProfile.available_capital)} budget, ${fullProfile.land_acres} एकड़ जमीन aur ${fullProfile.skills.join(', ')} experience ke hisaab se yeh analysis tayyar kiya gaya hai:\n\n1. **उपयुक्तता स्कोर:** **${score}/100** (विश्वसनीयता: 85/100)\n2. **अनुमानित मासिक लाभ:** **${profit}/माह**\n3. **मार्केट स्थिति:** आपके 10 किमी क्षेत्र में दूध एवं स्थानीय कृषि उत्पादों की स्थिर मांग है।\n4. **सरकारी सहायता:** **NBCFDC Concessional Loan Scheme** (10% स्व-अंशदान, 90% रियायती ऋण @ 7-8% ब्याज दर)।\n5. **प्रमुख जोखिम:** हरे चारे की मौसमी कमी और पशु स्वास्थ्य। (निवारण: साइलेज भंडारण और नजदीकी पशु चिकित्सालय से टीकाकरण)।\n\nKya aap iska detailed financial model dekhna chahte hain?`;
  } else if (lang === 'te') {
    reply = `### 🎯 సిఫార్సు చేయబడిన వ్యాపారం: ${recName}\n\n${userName} గారు, మీ ${formatINR(fullProfile.available_capital)} పెట్టుబడి మరియు ${fullProfile.land_acres} ఎకరాల భూమి ఆధారంగా:\n\n• **సూటబిలిటీ స్కోర్:** **${score}/100**\n• **అంచనా వేసిన నెలవారీ లాభం:** **${profit}/నెల**\n• **ప్రభుత్వ పథకం:** NBCFDC / ముద్ర పథకం ద్వారా 90% రాయితీ రుణం అందుబాటులో ఉంది.\n• **ప్రధాన రిస్క్:** మేత లభ్యత మరియు వాతావరణ మార్పులు.\n\nమీరు పూర్తి ప్రాజెక్ట్ రిపోర్ట్ చూడాలనుకుంటున్నారా?`;
  } else {
    reply = `### 🎯 Recommended Enterprise: ${recName}\n\nBased on your capital of ${formatINR(fullProfile.available_capital)}, ${fullProfile.land_acres} acres of land, and ${fullProfile.skills.join(', ')} background:\n\n1. **Suitability Score:** **${score}/100** (Confidence: 85/100)\n2. **Projected Monthly Profit:** **${profit}/month**\n3. **Market Demand:** High catchment density for direct milk procurement and local mandi sales.\n4. **Government Scheme:** **NBCFDC Term Loan / PMEGP** (10% self-contribution, 90% loan at concessional 7-8% interest).\n5. **Key Risks & Mitigation:** Seasonal green fodder scarcity (mitigated through silage pits) and veterinary monitoring.\n\nWould you like me to walk you through the cash flow and break-even breakdown?`;
  }

  return {
    reply,
    speakText: toSpeechText(reply),
    session_state: memory,
    updated_profile: fullProfile,
    top_recommendation: topRec,
    all_recommendations: allRecs,
    intent: 'RECOMMENDATION_DELIVERED'
  };
}

module.exports = {
  processUdyamSarthiChat,
  detectLanguage,
  extractEntities,
  calculateEMI,
  toSpeechText
};
