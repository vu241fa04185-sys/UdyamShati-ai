/**
 * UDYAMSARTHI — MULTI-LANGUAGE CONVERSATIONAL INTERVIEW SYSTEM
 * 
 * Languages supported:
 * - English ('en')
 * - Hindi ('hi' / Hinglish)
 * - Telugu ('te')
 * 
 * Core Features:
 * - Strictly respects the user's selected language as the Source of Truth
 * - ONE unified internal question database and IDs
 * - Returns contextual quick-reply buttons with { label, value } for each language
 * - Supports mid-conversation language switching without losing user data or step
 * - Multilingual natural entity extraction
 * - Comprehensive 10-point business analysis in English, Hindi, and Telugu
 */

function cleanForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/•\s+/g, ', ')
    .replace(/[`_~|]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/₹\s*(\d+(?:,\d+)*)/g, 'Rs. $1')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Standardize and map business keywords to canonical business keys
 */
function normalizeBusiness(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();

  // Dairy variations (English, Hindi, Telugu, spoken phrases)
  if (/\b(dairy|milk|cows?|buffalo(?:es)?|bhains|doodh|cattle|dairy farming)\b/i.test(t) ||
      /(गाय|भैंस|दूध|डेयरी|पशुपालन|పాడి|డెయిరీ|పాల)/i.test(t)) {
    return 'DAIRY';
  }
  // Agriculture variations
  if (/\b(agri|agriculture|farming|farmer|kheti|crops?|vegetables?|organic)\b/i.test(t) ||
      /(कृषि|खेती|फसल|सब्जी|సాగు|వ్యవసాయం|పంట)/i.test(t)) {
    return 'AGRICULTURE';
  }
  // Food business variations
  if (/\b(food|restaurant|snacks?|tiffin|bakery|packaged food|street food|catering)\b/i.test(t) ||
      /(ढाबा|होटल|नाश्ता|खाद्य|भोजन|ఆహార|ఆహారం|హోటల్)/i.test(t)) {
    return 'FOOD';
  }
  // Retail business variations
  if (/\b(retail|grocery|clothing|electronics?|mobile|cosmetics?|general store|shop|kirana|store)\b/i.test(t) ||
      /(दुकान|किराना|रिटेल|व्यापार|కిరాణా|రిటైల్|దుకాణం)/i.test(t)) {
    return 'RETAIL';
  }
  // Manufacturing variations
  if (/\b(manufacturing|furniture|paper|construction|production|factory|making|unit)\b/i.test(t) ||
      /(मैन्युफैक्चरिंग|निर्माण|फैक्ट्री|उत्पादन|తయారీ)/i.test(t)) {
    return 'MANUFACTURING';
  }
  // Service variations
  if (/\b(service|repair|salon|beauty|transport|education|tuition|cleaning)\b/i.test(t) ||
      /(सर्विस|सेवा|मरम्मत|సర్వీస్|సేవలు)/i.test(t)) {
    return 'SERVICE';
  }
  // Handicraft variations
  if (/\b(handicraft|lippan|pottery|bamboo|wooden|handmade|textile|artisan|craft)\b/i.test(t) ||
      /(हस्तशिल्प|शिल्पकारी|ਕਾਰੀगरी|హస్తకళలు)/i.test(t)) {
    return 'HANDICRAFT';
  }
  // Digital / Online variations
  if (/\b(digital|online|freelancing|content|marketing|teaching|youtube|social media)\b/i.test(t) ||
      /(ऑनलाइन|डिजिटल|ఆన్‌లైన్|డిజిటల్)/i.test(t)) {
    return 'DIGITAL';
  }

  return null;
}

/**
 * Natural speech normalizer for Animal Counts (e.g. "around 5", "5 cows", "2-5", "paanch")
 */
function parseAnimalCount(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();
  if (/\b(20\+|above 20|more than 20|20 se zyada|20 se jyada|20 కంటే ఎక్కువ)\b/i.test(t)) {
    return '20+ animals';
  }
  if (/\b(1[1-9]|20)\b/i.test(t) || /\b(11–20|11-20|11 to 20)\b/i.test(t)) {
    return '11–20 animals';
  }
  if (/\b([6-9]|10)\b/i.test(t) || /\b(6–10|6-10|6 to 10|around\s*(?:[6-9]|10)|lagbhag\s*(?:[6-9]|10))\b/i.test(t)) {
    return '6–10 animals';
  }
  if (/\b([2-5])\b/i.test(t) || /\b(around\s*(?:[2-5])|lagbhag\s*(?:[2-5])|2–5|2-5|2 to 5)\b/i.test(t) ||
      /\b(two|three|four|five|do|teen|chaar|paanch|दो|तीन|चार|पाँच|రెండు|మూడు|నాలుగు|ఐదు)\b/i.test(t)) {
    return '2–5 animals';
  }
  return null;
}

/**
 * Returns the first question in the flow whose answer is not yet collected.
 */
function getNextUnansweredQuestion(questions, answers = {}) {
  if (!Array.isArray(questions)) return null;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const key = q.key;
    const isAnswered = Boolean(
      answers[key] !== undefined ||
      answers[q.questionId] !== undefined ||
      (key === 'dairy_animals' && (answers.animals !== undefined || answers.dairy_animals !== undefined)) ||
      (key === 'dairy_space' && (answers.space !== undefined || answers.dairy_space !== undefined)) ||
      (key === 'dairy_land' && (answers.land !== undefined || answers.dairy_land !== undefined)) ||
      (key === 'budget' && (answers.budget !== undefined || answers.dairy_budget !== undefined)) ||
      (key === 'dairy_budget' && (answers.budget !== undefined || answers.dairy_budget !== undefined)) ||
      (key === 'feed_and_vet' && (answers.feed_and_vet !== undefined || answers.dairy_feed_vet !== undefined)) ||
      (key === 'agri_land' && (answers.land !== undefined || answers.agri_land !== undefined)) ||
      (key.startsWith('dairy_') && answers[key.replace('dairy_', '')] !== undefined) ||
      (key.startsWith('agri_') && answers[key.replace('agri_', '')] !== undefined) ||
      (!key.startsWith('dairy_') && answers[`dairy_${key}`] !== undefined) ||
      (!key.startsWith('agri_') && answers[`agri_${key}`] !== undefined)
    );
    if (!isAnswered) {
      return { question: q, index: i };
    }
  }
  return null;
}

/**
 * Standardize language code ('en', 'hi', 'te')
 */
function normalizeLang(lang) {
  if (!lang) return 'en';
  const l = String(lang).toLowerCase();
  if (l.startsWith('hi')) return 'hi';
  if (l.startsWith('te')) return 'te';
  return 'en';
}

/**
 * INITIAL FLOW QUESTIONS DATABASE (Multilingual)
 */
const INITIAL_QUESTIONS = {
  ask_name: {
    questionId: 'ask_name',
    message: {
      en: "Hello! I am UdyamSarthi. I will help you choose and plan a suitable business for you.\n\nFirst, what is your name?",
      hi: "Namaste! Main UdyamSarthi hoon. Main aapko aapke liye suitable business choose aur plan karne mein help karungi.\n\nSabse pehle, aapka naam kya hai?",
      te: "నమస్కారం! నేను ఉద్యమ్‌సారథిని. మీకు తగిన వ్యాపారాన్ని ఎంచుకోవడంలో మరియు ప్రణాళిక రూపొందించడంలో నేను సహాయం చేస్తాను.\n\nముందుగా, మీ పేరు ఏమిటి?"
    },
    quickReplies: {
      en: [],
      hi: [],
      te: []
    }
  },

  ask_state: {
    questionId: 'ask_state',
    message: {
      en: (name) => `Nice to meet you, ${name}. Which state are you from?`,
      hi: (name) => `Nice to meet you, ${name}. Aap kis state se hain?`,
      te: (name) => `మిమ్మల్ని కలవడం సంతోషంగా ఉంది, ${name}. మీరు ఏ రాష్ట్రానికి చెందినవారు?`
    },
    quickReplies: {
      en: [
        { label: "Bihar", value: "Bihar" },
        { label: "Uttar Pradesh", value: "Uttar Pradesh" },
        { label: "Madhya Pradesh", value: "Madhya Pradesh" },
        { label: "Rajasthan", value: "Rajasthan" },
        { label: "Maharashtra", value: "Maharashtra" },
        { label: "Andhra Pradesh", value: "Andhra Pradesh" },
        { label: "Telangana", value: "Telangana" },
        { label: "Other", value: "Other" }
      ],
      hi: [
        { label: "बिहार", value: "Bihar" },
        { label: "उत्तर प्रदेश", value: "Uttar Pradesh" },
        { label: "मध्य प्रदेश", value: "Madhya Pradesh" },
        { label: "राजस्थान", value: "Rajasthan" },
        { label: "महाराष्ट्र", value: "Maharashtra" },
        { label: "आंध्र प्रदेश", value: "Andhra Pradesh" },
        { label: "तेलंगाना", value: "Telangana" },
        { label: "अन्य राज्य", value: "Other" }
      ],
      te: [
        { label: "ఆంధ్రప్రదేశ్", value: "Andhra Pradesh" },
        { label: "తెలంగాణ", value: "Telangana" },
        { label: "బీహార్", value: "Bihar" },
        { label: "ఉత్తర ప్రదేశ్", value: "Uttar Pradesh" },
        { label: "మధ్యప్రదేశ్", value: "Madhya Pradesh" },
        { label: "మహారాష్ట్ర", value: "Maharashtra" },
        { label: "ఇతర రాష్ట్రం", value: "Other" }
      ]
    }
  },

  ask_district: {
    questionId: 'ask_district',
    message: {
      en: "Which district are you from?",
      hi: "Aap kis district se hain?",
      te: "మీరు ఏ జిల్లాకు చెందినవారు?"
    },
    quickReplies: {
      en: [],
      hi: [],
      te: []
    }
  },

  idea_check: {
    questionId: 'idea_check',
    message: {
      en: "Do you already have a business idea, or would you like me to suggest one?",
      hi: "Aapke paas koi business idea hai ya main aapko business ideas suggest karun?",
      te: "మీ దగ్గర ఇప్పటికే వ్యాపార ఆలోచన ఉందా లేదా నేను సూచించనా?"
    },
    quickReplies: {
      en: [
        { label: "I have an idea", value: "own_idea" },
        { label: "Suggest a business", value: "suggest" }
      ],
      hi: [
        { label: "मेरे पास आइडिया है", value: "own_idea" },
        { label: "आप सुझाव दें", value: "suggest" }
      ],
      te: [
        { label: "నా దగ్గర ఆలోచన ఉంది", value: "own_idea" },
        { label: "మీరు సూచించండి", value: "suggest" }
      ]
    }
  },

  choose_business_own: {
    questionId: 'choose_business_own',
    message: {
      en: "Great! Which business would you like to start?",
      hi: "Bahut achha! Aap kaunsa business start karna chahte hain?",
      te: "చాలా మంచిది! మీరు ఏ వ్యాపారాన్ని ప్రారంభించాలనుకుంటున్నారు?"
    },
    quickReplies: {
      en: [
        { label: "Dairy Farming", value: "DAIRY" },
        { label: "Agriculture", value: "AGRICULTURE" },
        { label: "Food Business", value: "FOOD" },
        { label: "Retail Business", value: "RETAIL" },
        { label: "Manufacturing", value: "MANUFACTURING" },
        { label: "Service Business", value: "SERVICE" },
        { label: "Handicraft", value: "HANDICRAFT" },
        { label: "Digital/Online Business", value: "DIGITAL" },
        { label: "Other", value: "OTHER" }
      ],
      hi: [
        { label: "डेयरी फार्मिंग", value: "DAIRY" },
        { label: "कृषि / खेती", value: "AGRICULTURE" },
        { label: "खाद्य व्यवसाय", value: "FOOD" },
        { label: "रिटेल व्यापार", value: "RETAIL" },
        { label: "मैन्युफैक्चरिंग", value: "MANUFACTURING" },
        { label: "सर्विस व्यवसाय", value: "SERVICE" },
        { label: "हस्तशिल्प", value: "HANDICRAFT" },
        { label: "डिजिटल / ऑनलाइन", value: "DIGITAL" },
        { label: "अन्य", value: "OTHER" }
      ],
      te: [
        { label: "డెయిరీ ఫార్మింగ్", value: "DAIRY" },
        { label: "వ్యవసాయం", value: "AGRICULTURE" },
        { label: "ఆహార వ్యాపారం", value: "FOOD" },
        { label: "రిటైల్ వ్యాపారం", value: "RETAIL" },
        { label: "తయారీ రంగం", value: "MANUFACTURING" },
        { label: "సేవా వ్యాపారం", value: "SERVICE" },
        { label: "హస్తకళలు", value: "HANDICRAFT" },
        { label: "డిజిటల్ / ఆన్‌లైన్", value: "DIGITAL" },
        { label: "ఇతర", value: "OTHER" }
      ]
    }
  },

  choose_business_suggest: {
    questionId: 'choose_business_suggest',
    message: {
      en: "What type of business are you interested in?",
      hi: "Aap kis type ke business mein interested hain?",
      te: "మీరు ఏ రకమైన వ్యాపారంలో ఆసక్తి కలిగి ఉన్నారు?"
    },
    quickReplies: {
      en: [
        { label: "Agriculture", value: "AGRICULTURE" },
        { label: "Dairy", value: "DAIRY" },
        { label: "Food", value: "FOOD" },
        { label: "Retail", value: "RETAIL" },
        { label: "Manufacturing", value: "MANUFACTURING" },
        { label: "Service", value: "SERVICE" },
        { label: "Handicraft", value: "HANDICRAFT" },
        { label: "Digital/Online", value: "DIGITAL" }
      ],
      hi: [
        { label: "कृषि", value: "AGRICULTURE" },
        { label: "डेयरी", value: "DAIRY" },
        { label: "खाद्य", value: "FOOD" },
        { label: "रिटेल", value: "RETAIL" },
        { label: "मैन्युफैक्चरिंग", value: "MANUFACTURING" },
        { label: "सर्विस", value: "SERVICE" },
        { label: "हस्तशिल्प", value: "HANDICRAFT" },
        { label: "डिजिटल / ऑनलाइन", value: "DIGITAL" }
      ],
      te: [
        { label: "వ్యవసాయం", value: "AGRICULTURE" },
        { label: "డెయిరీ", value: "DAIRY" },
        { label: "ఆహారం", value: "FOOD" },
        { label: "రిటైల్", value: "RETAIL" },
        { label: "తయారీ", value: "MANUFACTURING" },
        { label: "సేవలు", value: "SERVICE" },
        { label: "హస్తకళలు", value: "HANDICRAFT" },
        { label: "డిజిటల్ / ఆన్‌లైన్", value: "DIGITAL" }
      ]
    }
  }
};

/**
 * 8 PREDEFINED BUSINESS FLOWS (Multilingual)
 */
const BUSINESS_FLOWS_I18N = {
  DAIRY: [
    {
      questionId: 'dairy_q1',
      key: 'dairy_animals',
      message: {
        en: "First, how many animals would you like to start dairy farming with?",
        hi: "Sabse pehle, aap dairy farming kitne animals se start karna chahte hain?",
        te: "ముందుగా, మీరు ఎన్ని పశువులతో డెయిరీ ఫార్మింగ్ ప్రారంభించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "2–5 animals", value: "2–5 animals" }, { label: "6–10 animals", value: "6–10 animals" }, { label: "11–20 animals", value: "11–20 animals" }, { label: "20+ animals", value: "20+ animals" }],
        hi: [{ label: "2–5 पशु", value: "2–5 animals" }, { label: "6–10 पशु", value: "6–10 animals" }, { label: "11–20 पशु", value: "11–20 animals" }, { label: "20+ पशु", value: "20+ animals" }],
        te: [{ label: "2–5 పశువులు", value: "2–5 animals" }, { label: "6–10 పశువులు", value: "6–10 animals" }, { label: "11–20 పశువులు", value: "11–20 animals" }, { label: "20+ పశువులు", value: "20+ animals" }]
      }
    },
    {
      questionId: 'dairy_q2',
      key: 'dairy_space',
      message: {
        en: "Do you have space available to keep the animals?",
        hi: "Aapke paas animals rakhne ke liye space available hai?",
        te: "పశువులను ఉంచడానికి మీ వద్ద తగిన స్థలం అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Limited space", value: "Limited space" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "सीमित जगह", value: "Limited space" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "పరిమిత స్థలం", value: "Limited space" }]
      }
    },
    {
      questionId: 'dairy_q3',
      key: 'dairy_land',
      message: {
        en: "Do you have your own land available?",
        hi: "Aapke paas apni land available hai?",
        te: "మీ వద్ద సొంత భూమి అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Family land", value: "Family land" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "पारिवारिक जमीन", value: "Family land" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "కుటుంబ భూమి", value: "Family land" }]
      }
    },
    {
      questionId: 'dairy_q4',
      key: 'budget',
      message: {
        en: "What is your approximate budget?",
        hi: "Aapka approximate budget kitna hai?",
        te: "మీ సుమారు బడ్జెట్ ఎంత?"
      },
      quickReplies: {
        en: [{ label: "Below ₹1 Lakh", value: "Below ₹1 Lakh" }, { label: "₹1–3 Lakh", value: "₹1–3 Lakh" }, { label: "₹3–5 Lakh", value: "₹3–5 Lakh" }, { label: "₹5–10 Lakh", value: "₹5–10 Lakh" }, { label: "Above ₹10 Lakh", value: "Above ₹10 Lakh" }],
        hi: [{ label: "₹1 लाख से कम", value: "Below ₹1 Lakh" }, { label: "₹1–3 लाख", value: "₹1–3 Lakh" }, { label: "₹3–5 लाख", value: "₹3–5 Lakh" }, { label: "₹5–10 लाख", value: "₹5–10 Lakh" }, { label: "₹10 लाख से अधिक", value: "Above ₹10 Lakh" }],
        te: [{ label: "₹1 లక్ష కంటే తక్కువ", value: "Below ₹1 Lakh" }, { label: "₹1–3 లక్షలు", value: "₹1–3 Lakh" }, { label: "₹3–5 లక్షలు", value: "₹3–5 Lakh" }, { label: "₹5–10 లక్షలు", value: "₹5–10 Lakh" }, { label: "₹10 లక్షల కంటే ఎక్కువ", value: "Above ₹10 Lakh" }]
      }
    },
    {
      questionId: 'dairy_q5',
      key: 'experience',
      message: {
        en: "Do you have prior experience in dairy farming?",
        hi: "Kya aapko dairy farming ka pehle se experience hai?",
        te: "మీకు డెయిరీ ఫార్మింగ్‌లో మునుపటి అనుభవం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Little experience", value: "Little experience" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "थोड़ा अनुभव", value: "Little experience" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "కొద్దిగా అనుభవం", value: "Little experience" }]
      }
    },
    {
      questionId: 'dairy_q6',
      key: 'market',
      message: {
        en: "Which market would you like to sell the milk to?",
        hi: "Aap milk kis market mein sell karna chahenge?",
        te: "మీరు పాలను ఏ మార్కెట్‌లో విక్రయించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Local customers", value: "Local customers" }, { label: "Dairy collection center", value: "Dairy collection center" }, { label: "Shops", value: "Shops" }, { label: "Hotels/Restaurants", value: "Hotels/Restaurants" }, { label: "Not decided", value: "Not decided" }],
        hi: [{ label: "स्थानीय ग्राहक", value: "Local customers" }, { label: "डेयरी कलेक्शन सेंटर", value: "Dairy collection center" }, { label: "दुकानें", value: "Shops" }, { label: "होटल / रेस्टोरेंट", value: "Hotels/Restaurants" }, { label: "तय नहीं किया", value: "Not decided" }],
        te: [{ label: "స్థానిక కస్టమర్లు", value: "Local customers" }, { label: "డెయిరీ కలెక్షన్ సెంటర్", value: "Dairy collection center" }, { label: "దుకాణాలు", value: "Shops" }, { label: "హోటళ్ళు / రెస్టారెంట్లు", value: "Hotels/Restaurants" }, { label: "ఇంకా నిర్ణయించలేదు", value: "Not decided" }]
      }
    },
    {
      questionId: 'dairy_q7',
      key: 'feed_and_vet',
      message: {
        en: "Are cattle feed and veterinary facilities available in your area?",
        hi: "Kya aapke area mein cattle feed aur veterinary facility available hai?",
        te: "మీ ప్రాంతంలో పశుగ్రాసం మరియు పశువైద్య సదుపాయాలు అందుబాటులో ఉన్నాయా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Not sure", value: "Not sure" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "पक्का नहीं पता", value: "Not sure" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "ఖచ్చితంగా తెలియదు", value: "Not sure" }]
      }
    },
    {
      questionId: 'dairy_q8',
      key: 'goal',
      message: {
        en: "What is your main goal?",
        hi: "Aapka main goal kya hai?",
        te: "మీ ముఖ్య లక్ష్యం ఏమిటి?"
      },
      quickReplies: {
        en: [{ label: "Monthly income", value: "Monthly income" }, { label: "Full-time business", value: "Full-time business" }, { label: "Family business", value: "Family business" }, { label: "Business expansion", value: "Business expansion" }],
        hi: [{ label: "मासिक आय", value: "Monthly income" }, { label: "पूर्णकालिक व्यवसाय", value: "Full-time business" }, { label: "पारिवारिक व्यवसाय", value: "Family business" }, { label: "व्यापार विस्तार", value: "Business expansion" }],
        te: [{ label: "నెలవారీ ఆదాయం", value: "Monthly income" }, { label: "పూర్తి సమయ వ్యాపారం", value: "Full-time business" }, { label: "కుటుంబ వ్యాపారం", value: "Family business" }, { label: "వ్యాపార విస్తరణ", value: "Business expansion" }]
      }
    }
  ],

  AGRICULTURE: [
    {
      questionId: 'agri_q1',
      key: 'land',
      message: {
        en: "How much land do you have available for agriculture?",
        hi: "Aapke paas agriculture ke liye kitni land available hai?",
        te: "వ్యవసాయం కోసం మీ వద్ద ఎంత భూమి అందుబాటులో ఉంది?"
      },
      quickReplies: {
        en: [{ label: "No land", value: "No land" }, { label: "Less than 1 Acre", value: "Less than 1 Acre" }, { label: "1–2 Acres", value: "1–2 Acres" }, { label: "2–5 Acres", value: "2–5 Acres" }, { label: "More than 5 Acres", value: "More than 5 Acres" }],
        hi: [{ label: "कोई जमीन नहीं", value: "No land" }, { label: "1 एकड़ से कम", value: "Less than 1 Acre" }, { label: "1–2 एकड़", value: "1–2 Acres" }, { label: "2–5 एकड़", value: "2–5 Acres" }, { label: "5 एकड़ से अधिक", value: "More than 5 Acres" }],
        te: [{ label: "భూమి లేదు", value: "No land" }, { label: "1 ఎకరం కంటే తక్కువ", value: "Less than 1 Acre" }, { label: "1–2 ఎకరాలు", value: "1–2 Acres" }, { label: "2–5 ఎకరాలు", value: "2–5 Acres" }, { label: "5 ఎకరాల కంటే ఎక్కువ", value: "More than 5 Acres" }]
      }
    },
    {
      questionId: 'agri_q2',
      key: 'irrigation',
      message: {
        en: "Is your land irrigated or rain-dependent?",
        hi: "Aapki land irrigated hai ya rain-dependent?",
        te: "మీ భూమికి నీటిపారుదల సౌకర్యం ఉందా లేదా వర్షాధారితమా?"
      },
      quickReplies: {
        en: [{ label: "Irrigated", value: "Irrigated" }, { label: "Rain-dependent", value: "Rain-dependent" }, { label: "Both", value: "Both" }, { label: "Not sure", value: "Not sure" }],
        hi: [{ label: "सिंचित (Irrigated)", value: "Irrigated" }, { label: "वर्षा आधारित", value: "Rain-dependent" }, { label: "दोनों", value: "Both" }, { label: "पक्का नहीं पता", value: "Not sure" }],
        te: [{ label: "నీటిపారుదల ఉంది", value: "Irrigated" }, { label: "వర్షాధారితం", value: "Rain-dependent" }, { label: "రెండూ", value: "Both" }, { label: "ఖచ్చితంగా తెలియదు", value: "Not sure" }]
      }
    },
    {
      questionId: 'agri_q3',
      key: 'farming_type',
      message: {
        en: "What type of farming are you interested in?",
        hi: "Aap kis type ki farming mein interested hain?",
        te: "మీరు ఏ రకమైన వ్యవసాయం చేయాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Vegetables", value: "Vegetables" }, { label: "Fruits", value: "Fruits" }, { label: "Grains", value: "Grains" }, { label: "Organic farming", value: "Organic farming" }, { label: "Flowers", value: "Flowers" }, { label: "Not decided", value: "Not decided" }],
        hi: [{ label: "सब्जियां", value: "Vegetables" }, { label: "फल", value: "Fruits" }, { label: "अनाज", value: "Grains" }, { label: "जैविक खेती", value: "Organic farming" }, { label: "फूल", value: "Flowers" }, { label: "तय नहीं किया", value: "Not decided" }],
        te: [{ label: "కూరగాయలు", value: "Vegetables" }, { label: "పండ్లు", value: "Fruits" }, { label: "ధాన్యాలు", value: "Grains" }, { label: "సేంద్రీయ వ్యవసాయం", value: "Organic farming" }, { label: "పూలు", value: "Flowers" }, { label: "ఇంకా నిర్ణయించలేదు", value: "Not decided" }]
      }
    },
    {
      questionId: 'agri_q4',
      key: 'budget',
      message: {
        en: "What is your approximate farming budget?",
        hi: "Aapka approximate farming budget kitna hai?",
        te: "మీ సుమారు వ్యవసాయ బడ్జెట్ ఎంత?"
      },
      quickReplies: {
        en: [{ label: "Below ₹50K", value: "Below ₹50K" }, { label: "₹50K–₹1 Lakh", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 Lakh", value: "₹1–3 Lakh" }, { label: "₹3–5 Lakh", value: "₹3–5 Lakh" }, { label: "Above ₹5 Lakh", value: "Above ₹5 Lakh" }],
        hi: [{ label: "₹50 हजार से कम", value: "Below ₹50K" }, { label: "₹50K–₹1 लाख", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 लाख", value: "₹1–3 Lakh" }, { label: "₹3–5 लाख", value: "₹3–5 Lakh" }, { label: "₹5 लाख से अधिक", value: "Above ₹5 Lakh" }],
        te: [{ label: "₹50 వేల కంటే తక్కువ", value: "Below ₹50K" }, { label: "₹50 వేలు–₹1 లక్ష", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 లక్షలు", value: "₹1–3 Lakh" }, { label: "₹3–5 లక్షలు", value: "₹3–5 Lakh" }, { label: "₹5 లక్షల కంటే ఎక్కువ", value: "Above ₹5 Lakh" }]
      }
    },
    {
      questionId: 'agri_q5',
      key: 'experience',
      message: {
        en: "Do you have prior farming experience?",
        hi: "Kya aapko farming ka pehle se experience hai?",
        te: "మీకు వ్యవసాయంలో మునుపటి అనుభవం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Some experience", value: "Some experience" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "कुछ अनुभव", value: "Some experience" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "కొంత అనుభవం", value: "Some experience" }]
      }
    },
    {
      questionId: 'agri_q6',
      key: 'market',
      message: {
        en: "Where would you like to sell your produce?",
        hi: "Aap apni produce kahan sell karna chahenge?",
        te: "మీరు మీ పంటను ఎక్కడ విక్రయించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Local market", value: "Local market" }, { label: "Wholesale market", value: "Wholesale market" }, { label: "Direct customers", value: "Direct customers" }, { label: "Retail shops", value: "Retail shops" }, { label: "Not decided", value: "Not decided" }],
        hi: [{ label: "स्थानीय बाजार", value: "Local market" }, { label: "थोक मंडी", value: "Wholesale market" }, { label: "सीधे ग्राहक", value: "Direct customers" }, { label: "खुदरा दुकानें", value: "Retail shops" }, { label: "तय नहीं किया", value: "Not decided" }],
        te: [{ label: "స్థానిక మార్కెట్", value: "Local market" }, { label: "హోల్‌సేల్ మార్కెట్", value: "Wholesale market" }, { label: "నేరుగా కస్టమర్లకు", value: "Direct customers" }, { label: "రిటైల్ షాపులు", value: "Retail shops" }, { label: "ఇంకా నిర్ణయించలేదు", value: "Not decided" }]
      }
    },
    {
      questionId: 'agri_q7',
      key: 'organic_interest',
      message: {
        en: "Are you interested in organic farming?",
        hi: "Kya aap organic farming mein interested hain?",
        te: "మీకు సేంద్రీయ వ్యవసాయంపై ఆసక్తి ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Maybe", value: "Maybe" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "शायद", value: "Maybe" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "బహుశా", value: "Maybe" }]
      }
    },
    {
      questionId: 'agri_q8',
      key: 'goal',
      message: {
        en: "What is your main goal?",
        hi: "Aapka main goal kya hai?",
        te: "మీ ముఖ్య లక్ష్యం ఏమిటి?"
      },
      quickReplies: {
        en: [{ label: "Monthly income", value: "Monthly income" }, { label: "Full-time farming", value: "Full-time farming" }, { label: "Family business", value: "Family business" }, { label: "Business growth", value: "Business growth" }],
        hi: [{ label: "मासिक आय", value: "Monthly income" }, { label: "पूर्णकालिक खेती", value: "Full-time farming" }, { label: "पारिवारिक व्यवसाय", value: "Family business" }, { label: "व्यापार वृद्धि", value: "Business growth" }],
        te: [{ label: "నెలవారీ ఆదాయం", value: "Monthly income" }, { label: "పూర్తి సమయ వ్యవసాయం", value: "Full-time farming" }, { label: "కుటుంబ వ్యాపారం", value: "Family business" }, { label: "వ్యాపార వృద్ధి", value: "Business growth" }]
      }
    }
  ],

  FOOD: [
    {
      questionId: 'food_q1',
      key: 'food_type',
      message: {
        en: "What type of food business would you like to start?",
        hi: "Aap food business mein kis type ka kaam karna chahte hain?",
        te: "మీరు ఏ రకమైన ఆహార వ్యాపారాన్ని ప్రారంభించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Restaurant", value: "Restaurant" }, { label: "Snacks", value: "Snacks" }, { label: "Tiffin service", value: "Tiffin service" }, { label: "Bakery", value: "Bakery" }, { label: "Packaged food", value: "Packaged food" }, { label: "Street food", value: "Street food" }],
        hi: [{ label: "रेस्टोरेंट / ढाबा", value: "Restaurant" }, { label: "स्नैक्स / नमकीन", value: "Snacks" }, { label: "टिफिन सर्विस", value: "Tiffin service" }, { label: "बेकरी", value: "Bakery" }, { label: "पैक्ड फूड", value: "Packaged food" }, { label: "स्ट्रीट फूड", value: "Street food" }],
        te: [{ label: "రెస్టారెంట్", value: "Restaurant" }, { label: "స్నాక్స్", value: "Snacks" }, { label: "టిఫిన్ సర్వీస్", value: "Tiffin service" }, { label: "బేకరీ", value: "Bakery" }, { label: "ప్యాకేజ్డ్ ఫుడ్", value: "Packaged food" }, { label: "స్ట్రీట్ ఫుడ్", value: "Street food" }]
      }
    },
    {
      questionId: 'food_q2',
      key: 'space',
      message: {
        en: "Do you have shop or kitchen space available?",
        hi: "Aapke paas shop ya kitchen space available hai?",
        te: "మీ వద్ద దుకాణం లేదా కిచెన్ స్థలం అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "I can arrange", value: "I can arrange" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "व्यवस्था कर सकता हूँ", value: "I can arrange" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "ఏర్పాటు చేయగలను", value: "I can arrange" }]
      }
    },
    {
      questionId: 'food_q3',
      key: 'budget',
      message: {
        en: "What is your approximate budget?",
        hi: "Aapka approximate budget kitna hai?",
        te: "మీ సుమారు బడ్జెట్ ఎంత?"
      },
      quickReplies: {
        en: [{ label: "Below ₹50K", value: "Below ₹50K" }, { label: "₹50K–₹1 Lakh", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 Lakh", value: "₹1–3 Lakh" }, { label: "₹3–5 Lakh", value: "₹3–5 Lakh" }, { label: "Above ₹5 Lakh", value: "Above ₹5 Lakh" }],
        hi: [{ label: "₹50 हजार से कम", value: "Below ₹50K" }, { label: "₹50K–₹1 लाख", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 लाख", value: "₹1–3 Lakh" }, { label: "₹3–5 लाख", value: "₹3–5 Lakh" }, { label: "₹5 लाख से अधिक", value: "Above ₹5 Lakh" }],
        te: [{ label: "₹50 వేల కంటే తక్కువ", value: "Below ₹50K" }, { label: "₹50 వేలు–₹1 లక్ష", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 లక్షలు", value: "₹1–3 Lakh" }, { label: "₹3–5 లక్షలు", value: "₹3–5 Lakh" }, { label: "₹5 లక్షల కంటే ఎక్కువ", value: "Above ₹5 Lakh" }]
      }
    },
    {
      questionId: 'food_q4',
      key: 'experience',
      message: {
        en: "Do you have experience in the food business?",
        hi: "Kya aapko food business ka experience hai?",
        te: "మీకు ఆహార వ్యాపారంలో అనుభవం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Some experience", value: "Some experience" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "कुछ अनुभव", value: "Some experience" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "కొంత అనుభవం", value: "Some experience" }]
      }
    },
    {
      questionId: 'food_q5',
      key: 'target_customers',
      message: {
        en: "Who will be your target customers?",
        hi: "Aapka target customer kaun hoga?",
        te: "మీ లక్ష్య కస్టమర్లు ఎవరు?"
      },
      quickReplies: {
        en: [{ label: "Students", value: "Students" }, { label: "Office workers", value: "Office workers" }, { label: "Local families", value: "Local families" }, { label: "Tourists", value: "Tourists" }, { label: "General customers", value: "General customers" }],
        hi: [{ label: "विद्यार्थी", value: "Students" }, { label: "ऑफिस कर्मचारी", value: "Office workers" }, { label: "स्थानीय परिवार", value: "Local families" }, { label: "पर्यटक", value: "Tourists" }, { label: "सामान्य ग्राहक", value: "General customers" }],
        te: [{ label: "విద్యార్థులు", value: "Students" }, { label: "ఆఫీస్ ఉద్యోగులు", value: "Office workers" }, { label: "స్థానిక కుటుంబాలు", value: "Local families" }, { label: "పర్యాటకులు", value: "Tourists" }, { label: "సాధారణ ప్రజలు", value: "General customers" }]
      }
    },
    {
      questionId: 'food_q6',
      key: 'operation_base',
      message: {
        en: "Would you like to start the food business from home or a shop?",
        hi: "Aap food business ghar se start karna chahenge ya shop se?",
        te: "మీరు ఆహార వ్యాపారాన్ని ఇంటి నుండి లేదా దుకాణం నుండి ప్రారంభించాలనుకుంటున్నారా?"
      },
      quickReplies: {
        en: [{ label: "Home-based", value: "Home-based" }, { label: "Shop", value: "Shop" }, { label: "Either", value: "Either" }],
        hi: [{ label: "घर से", value: "Home-based" }, { label: "दुकान से", value: "Shop" }, { label: "कोई भी", value: "Either" }],
        te: [{ label: "ఇంటి నుండి", value: "Home-based" }, { label: "దుకాణం నుండి", value: "Shop" }, { label: "ఏదైనా", value: "Either" }]
      }
    },
    {
      questionId: 'food_q7',
      key: 'delivery',
      message: {
        en: "Would you also like to provide food delivery?",
        hi: "Kya aap food delivery bhi provide karna chahenge?",
        te: "మీరు ఫుడ్ డెలివరీ కూడా అందించాలనుకుంటున్నారా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Maybe", value: "Maybe" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "शायद", value: "Maybe" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "బహుశా", value: "Maybe" }]
      }
    },
    {
      questionId: 'food_q8',
      key: 'goal',
      message: {
        en: "What is your main goal?",
        hi: "Aapka main goal kya hai?",
        te: "మీ ముఖ్య లక్ష్యం ఏమిటి?"
      },
      quickReplies: {
        en: [{ label: "Monthly income", value: "Monthly income" }, { label: "Full-time business", value: "Full-time business" }, { label: "Family business", value: "Family business" }, { label: "Business growth", value: "Business growth" }],
        hi: [{ label: "मासिक आय", value: "Monthly income" }, { label: "पूर्णकालिक व्यवसाय", value: "Full-time business" }, { label: "पारिवारिक व्यवसाय", value: "Family business" }, { label: "व्यापार वृद्धि", value: "Business growth" }],
        te: [{ label: "నెలవారీ ఆదాయం", value: "Monthly income" }, { label: "పూర్తి సమయ వ్యాపారం", value: "Full-time business" }, { label: "కుటుంబ వ్యాపారం", value: "Family business" }, { label: "వ్యాపార వృద్ధి", value: "Business growth" }]
      }
    }
  ],

  RETAIL: [
    {
      questionId: 'retail_q1',
      key: 'retail_type',
      message: {
        en: "What type of retail business would you like to start?",
        hi: "Aap kis type ka retail business start karna chahte hain?",
        te: "మీరు ఏ రకమైన రిటైల్ వ్యాపారాన్ని ప్రారంభించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Grocery", value: "Grocery" }, { label: "Clothing", value: "Clothing" }, { label: "Electronics", value: "Electronics" }, { label: "Mobile accessories", value: "Mobile accessories" }, { label: "Cosmetics", value: "Cosmetics" }, { label: "General store", value: "General store" }],
        hi: [{ label: "किराना / ग्रोसरी", value: "Grocery" }, { label: "कपड़े", value: "Clothing" }, { label: "इलेक्ट्रॉनिक्स", value: "Electronics" }, { label: "मोबाइल एक्सेसरीज", value: "Mobile accessories" }, { label: "कॉस्मेटिक्स", value: "Cosmetics" }, { label: "जनरल स्टोर", value: "General store" }],
        te: [{ label: "కిరాణా", value: "Grocery" }, { label: "వస్త్రాలు", value: "Clothing" }, { label: "ఎలక్ట్రానిక్స్", value: "Electronics" }, { label: "మొబైల్ ఉపకరణాలు", value: "Mobile accessories" }, { label: "సౌందర్య సాధనాలు", value: "Cosmetics" }, { label: "జనరల్ స్టోర్", value: "General store" }]
      }
    },
    {
      questionId: 'retail_q2',
      key: 'space',
      message: {
        en: "Do you have a shop available?",
        hi: "Kya aapke paas shop available hai?",
        te: "మీ వద్ద దుకాణం అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Own shop", value: "Own shop" }, { label: "Rented shop", value: "Rented shop" }, { label: "No shop", value: "No shop" }],
        hi: [{ label: "अपनी दुकान", value: "Own shop" }, { label: "किराये की दुकान", value: "Rented shop" }, { label: "कोई दुकान नहीं", value: "No shop" }],
        te: [{ label: "సొంత దుకాణం", value: "Own shop" }, { label: "అద్దె దుకాణం", value: "Rented shop" }, { label: "దుకాణం లేదు", value: "No shop" }]
      }
    },
    {
      questionId: 'retail_q3',
      key: 'budget',
      message: {
        en: "What is your approximate budget?",
        hi: "Aapka approximate budget kitna hai?",
        te: "మీ సుమారు బడ్జెట్ ఎంత?"
      },
      quickReplies: {
        en: [{ label: "Below ₹50K", value: "Below ₹50K" }, { label: "₹50K–₹1 Lakh", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 Lakh", value: "₹1–3 Lakh" }, { label: "₹3–5 Lakh", value: "₹3–5 Lakh" }, { label: "Above ₹5 Lakh", value: "Above ₹5 Lakh" }],
        hi: [{ label: "₹50 हजार से कम", value: "Below ₹50K" }, { label: "₹50K–₹1 लाख", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 लाख", value: "₹1–3 Lakh" }, { label: "₹3–5 लाख", value: "₹3–5 Lakh" }, { label: "₹5 लाख से अधिक", value: "Above ₹5 Lakh" }],
        te: [{ label: "₹50 వేల కంటే తక్కువ", value: "Below ₹50K" }, { label: "₹50 వేలు–₹1 లక్ష", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 లక్షలు", value: "₹1–3 Lakh" }, { label: "₹3–5 లక్షలు", value: "₹3–5 Lakh" }, { label: "₹5 లక్షల కంటే ఎక్కువ", value: "Above ₹5 Lakh" }]
      }
    },
    {
      questionId: 'retail_q4',
      key: 'shop_area',
      message: {
        en: "In what type of area will your shop be located?",
        hi: "Aapki shop kis type ke area mein hogi?",
        te: "మీ దుకాణం ఏ రకమైన ప్రాంతంలో ఉంటుంది?"
      },
      quickReplies: {
        en: [{ label: "Village", value: "Village" }, { label: "Market area", value: "Market area" }, { label: "Main road", value: "Main road" }, { label: "Near school/college", value: "Near school/college" }, { label: "Residential area", value: "Residential area" }],
        hi: [{ label: "गांव", value: "Village" }, { label: "बाजार क्षेत्र", value: "Market area" }, { label: "मेन रोड", value: "Main road" }, { label: "स्कूल/कॉलेज के पास", value: "Near school/college" }, { label: "आवासीय इलाका", value: "Residential area" }],
        te: [{ label: "గ్రామం", value: "Village" }, { label: "మార్కెట్ ఏరియా", value: "Market area" }, { label: "ప్రధాన రహదారి", value: "Main road" }, { label: "పాఠశాల/కళాశాల దగ్గర", value: "Near school/college" }, { label: "నివాస ప్రాంతం", value: "Residential area" }]
      }
    },
    {
      questionId: 'retail_q5',
      key: 'experience',
      message: {
        en: "Do you have experience in retail business?",
        hi: "Kya aapko retail business ka experience hai?",
        te: "మీకు రిటైల్ వ్యాపారంలో అనుభవం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Some experience", value: "Some experience" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "कुछ अनुभव", value: "Some experience" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "కొంత అనుభవం", value: "Some experience" }]
      }
    },
    {
      questionId: 'retail_q6',
      key: 'market',
      message: {
        en: "Will you sell products to local customers?",
        hi: "Aap business mein products local customers ko sell karenge?",
        te: "మీరు స్థానిక కస్టమర్లకు ఉత్పత్తులను విక్రయిస్తారా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Both local and online", value: "Both local and online" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "स्थानीय और ऑनलाइन दोनों", value: "Both local and online" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "స్థానికంగా మరియు ఆన్‌లైన్‌లో", value: "Both local and online" }]
      }
    },
    {
      questionId: 'retail_q7',
      key: 'online_selling',
      message: {
        en: "Would you also like to sell online?",
        hi: "Kya aap online selling bhi karna chahenge?",
        te: "మీరు ఆన్‌లైన్ ద్వారా కూడా విక్రయించాలనుకుంటున్నారా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Maybe", value: "Maybe" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "शायद", value: "Maybe" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "బహుశా", value: "Maybe" }]
      }
    },
    {
      questionId: 'retail_q8',
      key: 'goal',
      message: {
        en: "What is your main goal?",
        hi: "Aapka main goal kya hai?",
        te: "మీ ముఖ్య లక్ష్యం ఏమిటి?"
      },
      quickReplies: {
        en: [{ label: "Monthly income", value: "Monthly income" }, { label: "Full-time business", value: "Full-time business" }, { label: "Family business", value: "Family business" }, { label: "Business growth", value: "Business growth" }],
        hi: [{ label: "मासिक आय", value: "Monthly income" }, { label: "पूर्णकालिक व्यवसाय", value: "Full-time business" }, { label: "पारिवारिक व्यवसाय", value: "Family business" }, { label: "व्यापार वृद्धि", value: "Business growth" }],
        te: [{ label: "నెలవారీ ఆదాయం", value: "Monthly income" }, { label: "పూర్తి సమయ వ్యాపారం", value: "Full-time business" }, { label: "కుటుంబ వ్యాపారం", value: "Family business" }, { label: "వ్యాపార వృద్ధి", value: "Business growth" }]
      }
    }
  ],

  MANUFACTURING: [
    {
      questionId: 'mfg_q1',
      key: 'mfg_type',
      message: {
        en: "What type of manufacturing business would you like to start?",
        hi: "Aap kis type ka manufacturing business start karna chahte hain?",
        te: "మీరు ఏ రకమైన తయారీ వ్యాపారాన్ని ప్రారంభించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Food products", value: "Food products" }, { label: "Furniture", value: "Furniture" }, { label: "Clothing", value: "Clothing" }, { label: "Paper products", value: "Paper products" }, { label: "Construction products", value: "Construction products" }, { label: "Other", value: "Other" }],
        hi: [{ label: "खाद्य उत्पाद", value: "Food products" }, { label: "फर्नीचर", value: "Furniture" }, { label: "कपड़े", value: "Clothing" }, { label: "कागज उत्पाद", value: "Paper products" }, { label: "निर्माण सामग्री", value: "Construction products" }, { label: "अन्य", value: "Other" }],
        te: [{ label: "ఆహార ఉత్పత్తులు", value: "Food products" }, { label: "ఫర్నిచర్", value: "Furniture" }, { label: "వస్త్రాలు", value: "Clothing" }, { label: "పేపర్ ఉత్పత్తులు", value: "Paper products" }, { label: "నిర్మాణ సామాగ్రి", value: "Construction products" }, { label: "ఇతర", value: "Other" }]
      }
    },
    {
      questionId: 'mfg_q2',
      key: 'space',
      message: {
        en: "Do you have space available for manufacturing?",
        hi: "Kya aapke paas manufacturing ke liye space available hai?",
        te: "తయారీ కోసం మీ వద్ద తగిన స్థలం అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "I can arrange", value: "I can arrange" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "व्यवस्था कर सकता हूँ", value: "I can arrange" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "ఏర్పాటు చేయగలను", value: "I can arrange" }]
      }
    },
    {
      questionId: 'mfg_q3',
      key: 'budget',
      message: {
        en: "What is your approximate budget?",
        hi: "Aapka approximate budget kitna hai?",
        te: "మీ సుమారు బడ్జెట్ ఎంత?"
      },
      quickReplies: {
        en: [{ label: "Below ₹1 Lakh", value: "Below ₹1 Lakh" }, { label: "₹1–3 Lakh", value: "₹1–3 Lakh" }, { label: "₹3–5 Lakh", value: "₹3–5 Lakh" }, { label: "₹5–10 Lakh", value: "₹5–10 Lakh" }, { label: "Above ₹10 Lakh", value: "Above ₹10 Lakh" }],
        hi: [{ label: "₹1 लाख से कम", value: "Below ₹1 Lakh" }, { label: "₹1–3 लाख", value: "₹1–3 Lakh" }, { label: "₹3–5 लाख", value: "₹3–5 Lakh" }, { label: "₹5–10 लाख", value: "₹5–10 Lakh" }, { label: "₹10 लाख से अधिक", value: "Above ₹10 Lakh" }],
        te: [{ label: "₹1 లక్ష కంటే తక్కువ", value: "Below ₹1 Lakh" }, { label: "₹1–3 లక్షలు", value: "₹1–3 Lakh" }, { label: "₹3–5 లక్షలు", value: "₹3–5 Lakh" }, { label: "₹5–10 లక్షలు", value: "₹5–10 Lakh" }, { label: "₹10 లక్షల కంటే ఎక్కువ", value: "Above ₹10 Lakh" }]
      }
    },
    {
      questionId: 'mfg_q4',
      key: 'experience',
      message: {
        en: "Do you have prior experience in manufacturing?",
        hi: "Kya aapko manufacturing ka pehle se experience hai?",
        te: "మీకు తయారీ రంగంలో మునుపటి అనుభవం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Some experience", value: "Some experience" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "कुछ अनुभव", value: "Some experience" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "కొంత అనుభవం", value: "Some experience" }]
      }
    },
    {
      questionId: 'mfg_q5',
      key: 'raw_material',
      message: {
        en: "Is the required raw material easily available in your area?",
        hi: "Kya aapke area mein required raw material easily available hai?",
        te: "మీ ప్రాంతంలో అవసరమైన ముడి పదార్థాలు సులభంగా లభిస్తాయా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Not sure", value: "Not sure" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "पक्का नहीं पता", value: "Not sure" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "ఖచ్చితంగా తెలియదు", value: "Not sure" }]
      }
    },
    {
      questionId: 'mfg_q6',
      key: 'electricity',
      message: {
        en: "Do you have reliable electricity supply available?",
        hi: "Aapke paas electricity supply available hai?",
        te: "మీ వద్ద సరైన విద్యుత్ సరఫరా అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Limited", value: "Limited" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "सीमित", value: "Limited" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "పరిమితం", value: "Limited" }]
      }
    },
    {
      questionId: 'mfg_q7',
      key: 'market',
      message: {
        en: "Where would you like to sell the products?",
        hi: "Aap products kahan sell karna chahenge?",
        te: "మీరు ఉత్పత్తులను ఎక్కడ విక్రయించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Local market", value: "Local market" }, { label: "Wholesale", value: "Wholesale" }, { label: "Retail shops", value: "Retail shops" }, { label: "Online", value: "Online" }, { label: "Multiple markets", value: "Multiple markets" }],
        hi: [{ label: "स्थानीय बाजार", value: "Local market" }, { label: "थोक में", value: "Wholesale" }, { label: "खुदरा दुकानों में", value: "Retail shops" }, { label: "ऑनलाइन", value: "Online" }, { label: "कई बाजारों में", value: "Multiple markets" }],
        te: [{ label: "స్థానిక మార్కెట్", value: "Local market" }, { label: "హోల్‌సేల్", value: "Wholesale" }, { label: "రిటైల్ షాపులు", value: "Retail shops" }, { label: "ఆన్‌లైన్", value: "Online" }, { label: "వివిధ మార్కెట్లు", value: "Multiple markets" }]
      }
    },
    {
      questionId: 'mfg_q8',
      key: 'goal',
      message: {
        en: "What is your main goal?",
        hi: "Aapka main goal kya hai?",
        te: "మీ ముఖ్య లక్ష్యం ఏమిటి?"
      },
      quickReplies: {
        en: [{ label: "Monthly income", value: "Monthly income" }, { label: "Employment", value: "Employment" }, { label: "Family business", value: "Family business" }, { label: "Business growth", value: "Business growth" }],
        hi: [{ label: "मासिक आय", value: "Monthly income" }, { label: "रोजगार सृजन", value: "Employment" }, { label: "पारिवारिक व्यवसाय", value: "Family business" }, { label: "व्यापार वृद्धि", value: "Business growth" }],
        te: [{ label: "నెలవారీ ఆదాయం", value: "Monthly income" }, { label: "ఉపాధి కల్పన", value: "Employment" }, { label: "కుటుంబ వ్యాపారం", value: "Family business" }, { label: "వ్యాపార వృద్ధి", value: "Business growth" }]
      }
    }
  ],

  SERVICE: [
    {
      questionId: 'service_q1',
      key: 'service_type',
      message: {
        en: "What type of service business would you like to start?",
        hi: "Aap kis type ka service business start karna chahte hain?",
        te: "మీరు ఏ రకమైన సేవా వ్యాపారాన్ని ప్రారంభించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Repair service", value: "Repair service" }, { label: "Salon/Beauty", value: "Salon/Beauty" }, { label: "Digital service", value: "Digital service" }, { label: "Transport", value: "Transport" }, { label: "Education/Tuition", value: "Education/Tuition" }, { label: "Other", value: "Other" }],
        hi: [{ label: "रिपेयर सर्विस", value: "Repair service" }, { label: "सैलून / ब्यूटी पार्लर", value: "Salon/Beauty" }, { label: "डिजिटल सर्विस", value: "Digital service" }, { label: "ट्रांसपोर्ट", value: "Transport" }, { label: "ट्यूशन / कोचिंग", value: "Education/Tuition" }, { label: "अन्य", value: "Other" }],
        te: [{ label: "రిపేర్ సర్వీస్", value: "Repair service" }, { label: "సెలూన్ / బ్యూటీ", value: "Salon/Beauty" }, { label: "డిజిటల్ సర్వీస్", value: "Digital service" }, { label: "రవాణా", value: "Transport" }, { label: "ట్యూషన్ / విద్య", value: "Education/Tuition" }, { label: "ఇతర", value: "Other" }]
      }
    },
    {
      questionId: 'service_q2',
      key: 'experience',
      message: {
        en: "Do you have prior experience in this field?",
        hi: "Kya aapke paas is field mein experience hai?",
        te: "మీకు ఈ రంగంలో అనుభవం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Some experience", value: "Some experience" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "कुछ अनुभव", value: "Some experience" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "కొంత అనుభవం", value: "Some experience" }]
      }
    },
    {
      questionId: 'service_q3',
      key: 'budget',
      message: {
        en: "What is your approximate budget?",
        hi: "Aapka approximate budget kitna hai?",
        te: "మీ సుమారు బడ్జెట్ ఎంత?"
      },
      quickReplies: {
        en: [{ label: "Below ₹50K", value: "Below ₹50K" }, { label: "₹50K–₹1 Lakh", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 Lakh", value: "₹1–3 Lakh" }, { label: "₹3–5 Lakh", value: "₹3–5 Lakh" }, { label: "Above ₹5 Lakh", value: "Above ₹5 Lakh" }],
        hi: [{ label: "₹50 हजार से कम", value: "Below ₹50K" }, { label: "₹50K–₹1 लाख", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 लाख", value: "₹1–3 Lakh" }, { label: "₹3–5 लाख", value: "₹3–5 Lakh" }, { label: "₹5 लाख से अधिक", value: "Above ₹5 Lakh" }],
        te: [{ label: "₹50 వేల కంటే తక్కువ", value: "Below ₹50K" }, { label: "₹50 వేలు–₹1 లక్ష", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 లక్షలు", value: "₹1–3 Lakh" }, { label: "₹3–5 లక్షలు", value: "₹3–5 Lakh" }, { label: "₹5 లక్షల కంటే ఎక్కువ", value: "Above ₹5 Lakh" }]
      }
    },
    {
      questionId: 'service_q4',
      key: 'space',
      message: {
        en: "Do you have a shop or workspace for the business?",
        hi: "Kya aapke paas business ke liye shop ya workspace hai?",
        te: "వ్యాపారం కోసం మీ వద్ద దుకాణం లేదా పని స్థలం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Home-based", value: "Home-based" }, { label: "I can arrange", value: "I can arrange" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "घर से", value: "Home-based" }, { label: "व्यवस्था कर सकता हूँ", value: "I can arrange" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "ఇంటి నుండి", value: "Home-based" }, { label: "ఏర్పాటు చేయగలను", value: "I can arrange" }]
      }
    },
    {
      questionId: 'service_q5',
      key: 'target_customers',
      message: {
        en: "Who will be your target customers?",
        hi: "Aapke target customers kaun honge?",
        te: "మీ లక్ష్య కస్టమర్లు ఎవరు?"
      },
      quickReplies: {
        en: [{ label: "Village customers", value: "Village customers" }, { label: "Students", value: "Students" }, { label: "Families", value: "Families" }, { label: "Businesses", value: "Businesses" }, { label: "General customers", value: "General customers" }],
        hi: [{ label: "ग्रामीण ग्राहक", value: "Village customers" }, { label: "विद्यार्थी", value: "Students" }, { label: "परिवार", value: "Families" }, { label: "व्यापार / दुकानें", value: "Businesses" }, { label: "सामान्य ग्राहक", value: "General customers" }],
        te: [{ label: "గ్రామస్థులు", value: "Village customers" }, { label: "విద్యార్థులు", value: "Students" }, { label: "కుటుంబాలు", value: "Families" }, { label: "వ్యాపారాలు", value: "Businesses" }, { label: "సాధారణ ప్రజలు", value: "General customers" }]
      }
    },
    {
      questionId: 'service_q6',
      key: 'doorstep_service',
      message: {
        en: "Would you also like to provide doorstep service?",
        hi: "Kya aap service ghar par bhi provide karna chahenge?",
        te: "మీరు ఇంటి వద్దకే సేవలను అందించాలనుకుంటున్నారా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Both", value: "Both" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "दोनों", value: "Both" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "రెండూ", value: "Both" }]
      }
    },
    {
      questionId: 'service_q7',
      key: 'online_service',
      message: {
        en: "Would you also like to target online customers?",
        hi: "Kya aap online customers bhi target karna chahenge?",
        te: "మీరు ఆన్‌లైన్ కస్టమర్లను కూడా లక్ష్యంగా చేసుకోవాలనుకుంటున్నారా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Maybe", value: "Maybe" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "शायद", value: "Maybe" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "బహుశా", value: "Maybe" }]
      }
    },
    {
      questionId: 'service_q8',
      key: 'goal',
      message: {
        en: "What is your main goal?",
        hi: "Aapka main goal kya hai?",
        te: "మీ ముఖ్య లక్ష్యం ఏమిటి?"
      },
      quickReplies: {
        en: [{ label: "Monthly income", value: "Monthly income" }, { label: "Full-time business", value: "Full-time business" }, { label: "Family business", value: "Family business" }, { label: "Business growth", value: "Business growth" }],
        hi: [{ label: "मासिक आय", value: "Monthly income" }, { label: "पूर्णकालिक व्यवसाय", value: "Full-time business" }, { label: "पारिवारिक व्यवसाय", value: "Family business" }, { label: "व्यापार वृद्धि", value: "Business growth" }],
        te: [{ label: "నెలవారీ ఆదాయం", value: "Monthly income" }, { label: "పూర్తి సమయ వ్యాపారం", value: "Full-time business" }, { label: "కుటుంబ వ్యాపారం", value: "Family business" }, { label: "వ్యాపార వృద్ధి", value: "Business growth" }]
      }
    }
  ],

  HANDICRAFT: [
    {
      questionId: 'craft_q1',
      key: 'craft_type',
      message: {
        en: "What type of handicraft business would you like to do?",
        hi: "Aap kis type ka handicraft business karna chahte hain?",
        te: "మీరు ఏ రకమైన హస్తకళల వ్యాపారాన్ని చేయాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Lippan Art", value: "Lippan Art" }, { label: "Pottery", value: "Pottery" }, { label: "Bamboo Craft", value: "Bamboo Craft" }, { label: "Wooden Craft", value: "Wooden Craft" }, { label: "Handmade Decor", value: "Handmade Decor" }, { label: "Textile Craft", value: "Textile Craft" }, { label: "Other", value: "Other" }],
        hi: [{ label: "लिप्पन आर्ट", value: "Lippan Art" }, { label: "मिट्टी के बर्तन / पॉटरी", value: "Pottery" }, { label: "बांस शिल्प", value: "Bamboo Craft" }, { label: "लकड़ी शिल्प", value: "Wooden Craft" }, { label: "हैंडमेड डेकोर", value: "Handmade Decor" }, { label: "वस्त्र शिल्प", value: "Textile Craft" }, { label: "अन्य", value: "Other" }],
        te: [{ label: "లిప్పన్ ఆర్ట్", value: "Lippan Art" }, { label: "మట్టి పాత్రలు", value: "Pottery" }, { label: "వెదురు వస్తువులు", value: "Bamboo Craft" }, { label: "చెక్క కళాకృతులు", value: "Wooden Craft" }, { label: "చేతితో చేసిన అలంకరణలు", value: "Handmade Decor" }, { label: "చేనేత / వస్త్రాలు", value: "Textile Craft" }, { label: "ఇతర", value: "Other" }]
      }
    },
    {
      questionId: 'craft_q2',
      key: 'experience',
      message: {
        en: "Do you have experience in making handicrafts?",
        hi: "Kya aapko handicraft banane ka experience hai?",
        te: "మీకు హస్తకళల తయారీలో అనుభవం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Learning", value: "Learning" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "सीख रहा हूँ", value: "Learning" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "నేర్చుకుంటున్నాను", value: "Learning" }]
      }
    },
    {
      questionId: 'craft_q3',
      key: 'budget',
      message: {
        en: "What is your approximate starting budget?",
        hi: "Aapka approximate starting budget kitna hai?",
        te: "మీ సుమారు ప్రారంభ బడ్జెట్ ఎంత?"
      },
      quickReplies: {
        en: [{ label: "Below ₹25K", value: "Below ₹25K" }, { label: "₹25K–₹50K", value: "₹25K–₹50K" }, { label: "₹50K–₹1 Lakh", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 Lakh", value: "₹1–3 Lakh" }, { label: "Above ₹3 Lakh", value: "Above ₹3 Lakh" }],
        hi: [{ label: "₹25 हजार से कम", value: "Below ₹25K" }, { label: "₹25K–₹50 हजार", value: "₹25K–₹50K" }, { label: "₹50K–₹1 लाख", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 लाख", value: "₹1–3 Lakh" }, { label: "₹3 लाख से अधिक", value: "Above ₹3 Lakh" }],
        te: [{ label: "₹25 వేల కంటే తక్కువ", value: "Below ₹25K" }, { label: "₹25–50 వేలు", value: "₹25K–₹50K" }, { label: "₹50 వేలు–₹1 లక్ష", value: "₹50K–₹1 Lakh" }, { label: "₹1–3 లక్షలు", value: "₹1–3 Lakh" }, { label: "₹3 లక్షల కంటే ఎక్కువ", value: "Above ₹3 Lakh" }]
      }
    },
    {
      questionId: 'craft_q4',
      key: 'space',
      message: {
        en: "Do you have workspace available for working?",
        hi: "Kya aapke paas kaam karne ke liye space available hai?",
        te: "పని చేయడానికి మీ వద్ద తగిన స్థలం అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Home", value: "Home" }, { label: "Separate workspace", value: "Separate workspace" }, { label: "No", value: "No" }],
        hi: [{ label: "घर पर", value: "Home" }, { label: "अलग वर्कस्पेस", value: "Separate workspace" }, { label: "नहीं", value: "No" }],
        te: [{ label: "ఇంట్లో", value: "Home" }, { label: "ప్రత్యేక వర్క్‌స్పేస్", value: "Separate workspace" }, { label: "లేదు", value: "No" }]
      }
    },
    {
      questionId: 'craft_q5',
      key: 'market',
      message: {
        en: "Where would you like to sell your products?",
        hi: "Aap apne products kahan sell karna chahenge?",
        te: "మీరు మీ ఉత్పత్తులను ఎక్కడ విక్రయించాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Local market", value: "Local market" }, { label: "Shops", value: "Shops" }, { label: "Exhibitions", value: "Exhibitions" }, { label: "Meesho/Marketplace", value: "Meesho/Marketplace" }, { label: "Instagram/Online", value: "Instagram/Online" }],
        hi: [{ label: "स्थानीय बाजार", value: "Local market" }, { label: "दुकानें", value: "Shops" }, { label: "प्रदर्शनियां (Exhibitions)", value: "Exhibitions" }, { label: "मीशो / मार्केटप्लेस", value: "Meesho/Marketplace" }, { label: "इंस्टाग्राम / ऑनलाइन", value: "Instagram/Online" }],
        te: [{ label: "స్థానిక మార్కెట్", value: "Local market" }, { label: "దుకాణాలు", value: "Shops" }, { label: "ఎగ్జిబిషన్లు", value: "Exhibitions" }, { label: "మీషో / మార్కెట్‌ప్లేస్", value: "Meesho/Marketplace" }, { label: "ఇన్‌స్టాగ్రామ్ / ఆన్‌లైన్", value: "Instagram/Online" }]
      }
    },
    {
      questionId: 'craft_q6',
      key: 'online_selling',
      message: {
        en: "Would you like to sell products online?",
        hi: "Kya aap products online sell karna chahenge?",
        te: "మీరు ఉత్పత్తులను ఆన్‌లైన్‌లో విక్రయించాలనుకుంటున్నారా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Maybe", value: "Maybe" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "शायद", value: "Maybe" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "బహుశా", value: "Maybe" }]
      }
    },
    {
      questionId: 'craft_q7',
      key: 'custom_orders',
      message: {
        en: "Would you also like to accept custom personalized orders?",
        hi: "Kya aap custom orders bhi lena chahenge?",
        te: "మీరు కస్టమ్ / ప్రత్యేక ఆర్డర్‌లను కూడా తీసుకోవాలనుకుంటున్నారా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Maybe", value: "Maybe" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "शायद", value: "Maybe" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "బహుశా", value: "Maybe" }]
      }
    },
    {
      questionId: 'craft_q8',
      key: 'goal',
      message: {
        en: "What is your main goal?",
        hi: "Aapka main goal kya hai?",
        te: "మీ ముఖ్య లక్ష్యం ఏమిటి?"
      },
      quickReplies: {
        en: [{ label: "Side income", value: "Side income" }, { label: "Full-time business", value: "Full-time business" }, { label: "Family business", value: "Family business" }, { label: "Business growth", value: "Business growth" }],
        hi: [{ label: "अतिरिक्त आय", value: "Side income" }, { label: "पूर्णकालिक व्यवसाय", value: "Full-time business" }, { label: "पारिवारिक व्यवसाय", value: "Family business" }, { label: "व्यापार वृद्धि", value: "Business growth" }],
        te: [{ label: "అదనపు ఆదాయం", value: "Side income" }, { label: "పూర్తి సమయ వ్యాపారం", value: "Full-time business" }, { label: "కుటుంబ వ్యాపారం", value: "Family business" }, { label: "వ్యాపార వృద్ధి", value: "Business growth" }]
      }
    }
  ],

  DIGITAL: [
    {
      questionId: 'digital_q1',
      key: 'digital_type',
      message: {
        en: "What type of online business would you like to do?",
        hi: "Aap kis type ka online business karna chahte hain?",
        te: "మీరు ఏ రకమైన ఆన్‌లైన్ వ్యాపారాన్ని చేయాలనుకుంటున్నారు?"
      },
      quickReplies: {
        en: [{ label: "Online selling", value: "Online selling" }, { label: "Freelancing", value: "Freelancing" }, { label: "Content creation", value: "Content creation" }, { label: "Digital marketing", value: "Digital marketing" }, { label: "Online teaching", value: "Online teaching" }, { label: "Other", value: "Other" }],
        hi: [{ label: "ऑनलाइन सेलिंग", value: "Online selling" }, { label: "फ्रीलांसिंग", value: "Freelancing" }, { label: "कंटेंट क्रिएशन", value: "Content creation" }, { label: "डिजिटल मार्केटिंग", value: "Digital marketing" }, { label: "ऑनलाइन टीचिंग", value: "Online teaching" }, { label: "अन्य", value: "Other" }],
        te: [{ label: "ఆన్‌లైన్ అమ్మకాలు", value: "Online selling" }, { label: "ఫ్రీలాన్సింగ్", value: "Freelancing" }, { label: "కంటెంట్ క్రియేషన్", value: "Content creation" }, { label: "డిజిటల్ మార్కెటింగ్", value: "Digital marketing" }, { label: "ఆన్‌లైన్ బోధన", value: "Online teaching" }, { label: "ఇతర", value: "Other" }]
      }
    },
    {
      questionId: 'digital_q2',
      key: 'device',
      message: {
        en: "Do you have a smartphone or computer available?",
        hi: "Aapke paas smartphone ya computer available hai?",
        te: "మీ వద్ద స్మార్ట్‌ఫోన్ లేదా కంప్యూటర్ అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Smartphone", value: "Smartphone" }, { label: "Computer", value: "Computer" }, { label: "Both", value: "Both" }],
        hi: [{ label: "स्मार्टफोन", value: "Smartphone" }, { label: "कंप्यूटर / लैपटॉप", value: "Computer" }, { label: "दोनों", value: "Both" }],
        te: [{ label: "స్మార్ట్‌ఫోన్", value: "Smartphone" }, { label: "కంప్యూటర్", value: "Computer" }, { label: "రెండూ", value: "Both" }]
      }
    },
    {
      questionId: 'digital_q3',
      key: 'internet',
      message: {
        en: "Do you have reliable internet access available?",
        hi: "Aapke paas reliable internet available hai?",
        te: "మీ వద్ద నమ్మకమైన ఇంటర్నెట్ సౌకర్యం అందుబాటులో ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Sometimes", value: "Sometimes" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "कभी-कभी", value: "Sometimes" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "అప్పుడప్పుడు", value: "Sometimes" }]
      }
    },
    {
      questionId: 'digital_q4',
      key: 'budget',
      message: {
        en: "What is your approximate starting budget?",
        hi: "Aapka approximate starting budget kitna hai?",
        te: "మీ సుమారు ప్రారంభ బడ్జెట్ ఎంత?"
      },
      quickReplies: {
        en: [{ label: "No investment", value: "No investment" }, { label: "Below ₹25K", value: "Below ₹25K" }, { label: "₹25K–₹50K", value: "₹25K–₹50K" }, { label: "₹50K–₹1 Lakh", value: "₹50K–₹1 Lakh" }, { label: "Above ₹1 Lakh", value: "Above ₹1 Lakh" }],
        hi: [{ label: "बिना निवेश (शून्य)", value: "No investment" }, { label: "₹25 हजार से कम", value: "Below ₹25K" }, { label: "₹25K–₹50 हजार", value: "₹25K–₹50K" }, { label: "₹50K–₹1 लाख", value: "₹50K–₹1 Lakh" }, { label: "₹1 लाख से अधिक", value: "Above ₹1 Lakh" }],
        te: [{ label: "పెట్టుబడి లేదు", value: "No investment" }, { label: "₹25 వేల కంటే తక్కువ", value: "Below ₹25K" }, { label: "₹25–50 వేలు", value: "₹25K–₹50K" }, { label: "₹50 వేలు–₹1 లక్ష", value: "₹50K–₹1 Lakh" }, { label: "₹1 లక్ష కంటే ఎక్కువ", value: "Above ₹1 Lakh" }]
      }
    },
    {
      questionId: 'digital_q5',
      key: 'experience',
      message: {
        en: "Do you have prior experience in the digital field?",
        hi: "Aapko digital field mein pehle se experience hai?",
        te: "మీకు డిజిటల్ రంగంలో మునుపటి అనుభవం ఉందా?"
      },
      quickReplies: {
        en: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Some experience", value: "Some experience" }],
        hi: [{ label: "हाँ", value: "Yes" }, { label: "नहीं", value: "No" }, { label: "कुछ अनुभव", value: "Some experience" }],
        te: [{ label: "అవును", value: "Yes" }, { label: "లేదు", value: "No" }, { label: "కొంత అనుభవం", value: "Some experience" }]
      }
    },
    {
      questionId: 'digital_q6',
      key: 'commitment',
      message: {
        en: "Would you like to work full-time or part-time?",
        hi: "Aap full-time ya part-time kaam karna chahenge?",
        te: "మీరు పూర్తి సమయం లేదా పార్ట్-టైమ్ పని చేయాలనుకుంటున్నారా?"
      },
      quickReplies: {
        en: [{ label: "Full-time", value: "Full-time" }, { label: "Part-time", value: "Part-time" }, { label: "Both", value: "Both" }],
        hi: [{ label: "फुल-टाइम", value: "Full-time" }, { label: "पार्ट-टाइम", value: "Part-time" }, { label: "दोनों", value: "Both" }],
        te: [{ label: "పూర్తి సమయం", value: "Full-time" }, { label: "పార్ట్-టైమ్", value: "Part-time" }, { label: "రెండూ", value: "Both" }]
      }
    },
    {
      questionId: 'digital_q7',
      key: 'goal',
      message: {
        en: "What is your main goal?",
        hi: "Aapka main goal kya hai?",
        te: "మీ ముఖ్య లక్ష్యం ఏమిటి?"
      },
      quickReplies: {
        en: [{ label: "Side income", value: "Side income" }, { label: "Monthly income", value: "Monthly income" }, { label: "Full-time career", value: "Full-time career" }, { label: "Business growth", value: "Business growth" }],
        hi: [{ label: "साइड इनकम", value: "Side income" }, { label: "मासिक आय", value: "Monthly income" }, { label: "फुल-टाइम करियर", value: "Full-time career" }, { label: "व्यापार वृद्धि", value: "Business growth" }],
        te: [{ label: "అదనపు ఆదాయం", value: "Side income" }, { label: "నెలవారీ ఆదాయం", value: "Monthly income" }, { label: "కెరీర్", value: "Full-time career" }, { label: "వ్యాపార వృద్ధి", value: "Business growth" }]
      }
    }
  ]
};

const COMMON_STATES = [
  "Bihar", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Maharashtra",
  "Andhra Pradesh", "Telangana", "Gujarat", "Punjab", "Haryana",
  "West Bengal", "Karnataka", "Tamil Nadu", "Odisha", "Jharkhand",
  "Chhattisgarh", "Assam", "Uttarakhand", "Himachal Pradesh", "Kerala"
];

/**
 * Multilingual Entity Extractor
 */
function extractCompoundEntities(text, existingState = {}) {
  if (!text) return {};
  const t = text.trim();
  const lower = t.toLowerCase();
  const extracted = {};

  // 1. Budget extraction (Supports digits & number words in en/hi/te: "2 lakh", "do lakh", "రెండు లక్షలు", "₹50,000", etc.)
  const wordToNum = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'ek': 1, 'do': 2, 'teen': 3, 'chaar': 4, 'paanch': 5, 'chhah': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
    'ఒకటి': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5, 'ఆరు': 6, 'ఏడు': 7, 'ఎనిమిది': 8, 'తొమ్మిది': 9, 'పది': 10
  };

  const wordLakhMatch = t.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|chaar|paanch|chhah|saat|aath|nau|das|एक|दो|तीन|चार|पाँच|छह|सात|आठ|नौ|दस|ఒకటి|రెండు|మూడు|నాలుగు|ఐదు|ఆరు|ఏడు|ఎనిమిది|తొమ్మిది|పది)\s*(?:lakh|lac|लाख|లక్ష|లక్షలు)/i);
  if (wordLakhMatch) {
    const num = wordToNum[wordLakhMatch[1].toLowerCase()] || wordLakhMatch[1];
    extracted.budget = `₹${num} Lakh`;
  } else {
    const lakhMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख|లక్ష|లక్షలు)/i);
    if (lakhMatch) {
      extracted.budget = `₹${lakhMatch[1]} Lakh`;
    } else {
      const kMatch = t.match(/(\d+)\s*(?:k|hazar|हजार|వేలు)/i);
      if (kMatch) {
        extracted.budget = `₹${kMatch[1]},000`;
      } else {
        const directNum = t.match(/(?:₹|rs\.?|inr)?\s*(\d{4,8})\b/i);
        if (directNum && directNum[1].length !== 6) { // avoid pincodes
          extracted.budget = `₹${Number(directNum[1]).toLocaleString('en-IN')}`;
        }
      }
    }
  }

  // 2. Name extraction
  const namePatterns = [
    /(?:main|mera naam|my name is|i am|naam)\s*[:=]?\s*([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+)/i,
    /(?:मेरा\s*नाम)\s*[:=]?\s*([^\s,।!?]+)/u,
    /(?:నా\s*పేరు)\s*[:=]?\s*([^\s,।!?]+)/u
  ];
  for (const pat of namePatterns) {
    const m = t.match(pat);
    if (m && m[1]) {
      let cand = m[1].replace(/[।!?.,]/g, '').trim();
      cand = cand.replace(/\b(hoon|hu|hai|ji|from|se|lo|గారు|అండి)\b/gi, '').trim();
      const forbidden = ['bihar', 'gaya', 'dairy', 'farming', 'food', 'retail', 'lakh', 'budget', 'name'];
      if (cand.length >= 2 && !forbidden.includes(cand.toLowerCase())) {
        extracted.name = cand.charAt(0).toUpperCase() + cand.slice(1);
        break;
      }
    }
  }

  // 3. State extraction
  for (const st of COMMON_STATES) {
    const re = new RegExp(`\\b${st}\\b`, 'i');
    if (re.test(t)) {
      extracted.state = st;
      break;
    }
  }
  if (!extracted.state) {
    if (/ఆంధ్రప్రదేశ్|ఆంధ్ర/i.test(t)) extracted.state = 'Andhra Pradesh';
    else if (/తెలంగాణ/i.test(t)) extracted.state = 'Telangana';
    else if (/బీహార్|बिहार/i.test(t)) extracted.state = 'Bihar';
    else if (/उत्तर प्रदेश/i.test(t)) extracted.state = 'Uttar Pradesh';
    else if (/महाराष्ट्र|మహారాష్ట్ర/i.test(t)) extracted.state = 'Maharashtra';
  }

  // 4. District extraction
  const preDistMatch = t.match(/([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+)\s+(?:district|zila|jila|dist|జిల్లా)\b/i);
  if (preDistMatch && preDistMatch[1]) {
    const cand = preDistMatch[1].replace(/[।!?.,]/g, '').trim();
    const forbidden = ['bihar', 'state', 'dairy', 'farming', 'food', 'retail', 'lakh', 'budget', 'mera', 'meri', 'se', 'hai'];
    if (cand.length >= 2 && !forbidden.includes(cand.toLowerCase())) {
      extracted.district = cand.charAt(0).toUpperCase() + cand.slice(1);
    }
  }

  if (!extracted.district) {
    const postDistMatch = t.match(/(?:district|zila|jila|dist|జిల్లా)\s*[:=]\s*([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+)/i);
    if (postDistMatch && postDistMatch[1]) {
      const cand = postDistMatch[1].replace(/[।!?.,]/g, '').trim();
      const forbidden = ['bihar', 'state', 'dairy', 'farming', 'food', 'retail', 'lakh', 'se'];
      if (cand.length >= 3 && !forbidden.includes(cand.toLowerCase())) {
        extracted.district = cand.charAt(0).toUpperCase() + cand.slice(1);
      }
    }
  }

  if (!extracted.district) {
    const knownDistricts = [
      'Gaya', 'Patna', 'Guntur', 'Krishna', 'Varanasi', 'Lucknow', 'Jaipur',
      'Pune', 'Nagpur', 'Nashik', 'Indore', 'Bhopal', 'Ranchi', 'Muzaffarpur',
      'Bhagalpur', 'Kurnool', 'Nellore', 'Visakhapatnam', 'Chittoor', 'Prakasam'
    ];
    for (const d of knownDistricts) {
      if (new RegExp(`\\b${d}\\b`, 'i').test(t)) {
        extracted.district = d;
        break;
      }
    }
  }

  // 5. Business Idea / Selection
  const biz = normalizeBusiness(t);
  if (biz) {
    extracted.business = biz;
  }

  // 6. Land extraction
  if (/\b(own land|have my own land|family land|have land|1-2 acres|2-5 acres|apni zameen|khud ki zameen)\b/i.test(t) ||
      /(సొంత భూమి|కుటుంబ భూమి|భూమి ఉంది|अपनी जमीन|पारिवारिक जमीन|खुद की जमीन)/i.test(t)) {
    extracted.land = 'Yes';
  } else if (/\b(no land|don't have land|rented land|kiraya)\b/i.test(t) ||
             /(భూమి లేదు|जमीन नहीं|किराये पर)/i.test(t)) {
    extracted.land = 'No';
  }

  // 7. Space extraction
  if (/\b(have space|enough space|sufficient space|space available|jagah hai|jagah available)\b/i.test(t) ||
      /(స్థలం ఉంది|తగిన స్థలం|जगह है|जगह उपलब्ध)/i.test(t)) {
    extracted.space = 'Yes';
  } else if (/\b(no space|limited space|kam jagah)\b/i.test(t) ||
             /(పరిమిత స్థలం|స్థలం లేదు|कम जगह|जगह नहीं)/i.test(t)) {
    extracted.space = 'Limited space';
  }

  // 8. Animals extraction
  const animCount = parseAnimalCount(t);
  if (animCount) {
    extracted.animals = animCount;
  }

  return extracted;
}

/**
 * Generate Final 10-Point Business Analysis in the Selected Language
 */
function generateFinalAnalysis(state, lang = 'en') {
  const l = normalizeLang(lang);
  const name = state.name || 'Entrepreneur';
  const stateName = state.state || (state.district ? `${state.district} area` : 'Your area');
  const district = state.district || 'Your district';
  const biz = state.business || 'DAIRY';
  const answers = state.answers || {};

  const budgetVal = answers.budget || state.budget || (l === 'en' ? '₹1–3 Lakh (Approximate)' : (l === 'te' ? '₹1–3 లక్షలు (సుమారు)' : '₹1–3 लाख (अनुमानित)'));

  if (l === 'en') {
    const bizTitles = {
      DAIRY: 'Dairy Farming Business',
      AGRICULTURE: 'Commercial Agriculture & Farming',
      FOOD: 'Food & Culinary Processing Unit',
      RETAIL: 'Retail Store Business',
      MANUFACTURING: 'Small-Scale Manufacturing Unit',
      SERVICE: 'Service & Maintenance Enterprise',
      HANDICRAFT: 'Handicraft & Artisan Workshop',
      DIGITAL: 'Digital & Online Services Venture'
    };
    const title = bizTitles[biz] || biz;

    let whyFit = `You have space and resources suited for starting with ${answers.dairy_animals || answers.land || 'your scale'} in ${district}, ${stateName}. Daily local demand provides steady cash flow.`;
    let res = `${answers.dairy_animals || '2-5 Animals'} / workspace, clean water, power, and storage.`;
    let income = '₹20,000 – ₹45,000 per month (depending on production & local rates).';
    let setup = 'Setting up clean shed/workspace, local trade registration, and tie-up with buyers/cooperatives.';
    let market = answers.market || answers.target_customers || 'Local customers, daily markets, retail shops.';
    let risks = 'Input price volatility and health/maintenance. (Mitigation: Insurance and regular checkups).';
    let schemes = 'PM Mudra Yojana, PMEGP (up to 35% subsidy), and NABARD / State Subsidies.';
    let steps = '1. Finalize your location and reliable suppliers.\n2. Complete basic Udyam / FSSAI registration.\n3. Secure initial customer pre-orders and start operations.';

    return `🎉 **${title} — Complete Business Analysis for ${name}**

1. **Selected Business:**
   **${title}**

2. **Why this business fits your situation:**
   ${whyFit}

3. **Estimated Starting Investment:**
   **${budgetVal}** *(Based on your indicated budget and startup requirements)*

4. **Required Resources:**
   ${res}

5. **Possible Income Range:**
   **${income}**

6. **Basic Setup Requirements:**
   ${setup}

7. **Possible Customers & Market:**
   ${market}

8. **Major Risks & Mitigation:**
   ${risks}

9. **Relevant Government Support & Schemes:**
   ${schemes}

10. **Simple First Steps to Start:**
${steps}

---
⚠️ *Note: Investment and income figures are estimates. Actual returns depend on your location, local demand, raw material costs, competition, and business execution.*`;
  }

  if (l === 'te') {
    const bizTitles = {
      DAIRY: 'వాణిజ్య పాడి పరిశ్రమ (డైరీ ఫార్మింగ్)',
      AGRICULTURE: 'వాణిజ్య వ్యవసాయం & సాగు',
      FOOD: 'ఆహార తయారీ & ప్రాసెసింగ్ యూనిట్',
      RETAIL: 'రిటైల్ దుకాణం వ్యాపారం',
      MANUFACTURING: 'చిన్న తరహా తయారీ యూనిట్',
      SERVICE: 'సేవా మరియు నిర్వహణ వ్యాపారం',
      HANDICRAFT: 'హస్తకళలు & ఆర్టిసాన్ యూనిట్',
      DIGITAL: 'డిజిటల్ & ఆన్‌లైన్ సర్వీసెస్'
    };
    const title = bizTitles[biz] || biz;

    let whyFit = `${district}, ${stateName} ప్రాంతంలో మీ బడ్జెట్ మరియు అందుబాటులో ఉన్న వనరులకు ఈ వ్యాపారం అనుకూలంగా ఉంటుంది. స్థానికంగా స్థిరమైన డిమాండ్ ఉంది.`;
    let res = `అవసరమైన పశువులు/యంత్రాలు, పని స్థలం, నీటి వసతి మరియు ముడి సరుకు.`;
    let income = 'నెలకు ₹20,000 – ₹45,000 (ఉత్పత్తి మరియు స్థానిక మార్కెట్ ధరపై ఆధారపడి).';
    let setup = 'షెడ్/షాప్ ఏర్పాటు, లైసెన్స్ లేదా రిజిస్ట్రేషన్ మరియు కొనుగోలుదారులతో ఒప్పందం.';
    let market = answers.market || answers.target_customers || 'స్థానిక కస్టమర్లు, మార్కెట్లు మరియు రిటైల్ షాపులు.';
    let risks = 'ఖర్చులు పెరగడం మరియు మార్కెట్ ఒడిదుడుకులు. (పరిష్కారం: బీమా మరియు ముందస్తు ప్రణాళిక).';
    let schemes = 'పీఎం ముద్ర యోజన (రూ. 10 లక్షల వరకు), PMEGP రాయితీ పథకం, నాబార్డ్ సబ్సిడీ.';
    let steps = '1. సరైన స్థలాన్ని సిద్ధం చేసుకోవడం.\n2. ప్రాథమిక ప్రభుత్వ రిజిస్ట్రేషన్ పూర్తి చేయడం.\n3. స్థానిక కస్టమర్లతో నేరుగా అనుసంధానం కావడం.';

    return `🎉 **${title} — ${name} గారి కోసం పూర్తి వ్యాపార విశ్లేషణ**

1. **ఎంచుకున్న వ్యాపారం:**
   **${title}**

2. **ఈ వ్యాపారం మీ పరిస్థితికి ఎందుకు అనుకూలం:**
   ${whyFit}

3. **అంచనా ప్రారంభ పెట్టుబడి:**
   **${budgetVal}** *(మీ బడ్జెట్ మరియు ప్రాథమిక అవసరాల ప్రకారం)*

4. **అవసరమైన వనరులు:**
   ${res}

5. **సంభావ్య ఆదాయ పరిధి:**
   **${income}**

6. **ప్రాథమిక ఏర్పాట్లు:**
   ${setup}

7. **కస్టమర్లు మరియు మార్కెట్:**
   ${market}

8. **ప్రధాన రిస్క్‌లు మరియు నివారణ:**
   ${risks}

9. **ప్రభుత్వ పథకాలు & రాయితీలు:**
   ${schemes}

10. **ప్రారంభించడానికి మొదటి దశలు:**
${steps}

---
⚠️ *గమనిక: పెట్టుబడి మరియు ఆదాయం అంచనాలు మాత్రమే. ఇవి స్థానిక డిమాండ్, ఖర్చులు, పోటీ మరియు నిర్వహణపై ఆధారపడి ఉంటాయి.*`;
  }

  // Default Hindi
  const bizTitles = {
    DAIRY: 'डेयरी फार्मिंग बिजनेस',
    AGRICULTURE: 'व्यावसायिक कृषि एवं खेती',
    FOOD: 'खाद्य प्रसंस्करण एवं फूड बिजनेस',
    RETAIL: 'रिटेल स्टोर एवं व्यापार',
    MANUFACTURING: 'लघु विनिर्माण (मैन्युफैक्चरिंग) इकाई',
    SERVICE: 'सर्विस एवं मेंटेनेंस व्यवसाय',
    HANDICRAFT: 'हस्तशिल्प एवं कारीगरी इकाई',
    DIGITAL: 'डिजिटल एवं ऑनलाइन सेवा उद्यम'
  };
  const title = bizTitles[biz] || biz;

  let whyFit = `${district} (${stateName}) में आपके बजट और उपलब्ध संसाधनों के अनुकूल यह व्यापार सही संतुलन देता है। यहाँ दैनिक स्थिर मांग उपलब्ध है।`;
  let res = `कार्यस्थल, आवश्यक उपकरण, बिजली-पानी और शुरुआती कच्चा माल।`;
  let income = '₹20,000 – ₹45,000 प्रतिमाह (स्थानीय बाजार व उत्पादन के आधार पर)।';
  let setup = 'कार्यस्थल का निर्माण, बेसिक उद्यम/FSSAI रजिस्ट्रेशन और सप्लायर्स से अनुबंध।';
  let market = answers.market || answers.target_customers || 'स्थानीय ग्राहक, किराना दुकानें व थोक बाजार।';
  let risks = 'लागत में उतार-चढ़ाव और मौसम। (समाधान: बीमा एवं समय पर टीकाकरण/रखरखाव)।';
  let schemes = 'पीएम मुद्रा योजना, PMEGP (25%–35% सब्सिडी), नाबार्ड एवं राज्य स्तरीय योजनाएं।';
  let steps = '1. स्थान एवं आवश्यक सप्लायर फाइनल करें।\n2. जरूरी बेसिक ऑनलाइन रजिस्ट्रेशन पूरा करें।\n3. लोकल ग्राहकों से एडवांस ऑर्डर लेकर काम शुरू करें।';

  return `🎉 **${title} — ${name} जी के लिए संपूर्ण बिजनेस विश्लेषण**

1. **चुना गया व्यवसाय (Selected Business):**
   **${title}**

2. **यह आपके लिए क्यों उपयुक्त है:**
   ${whyFit}

3. **अनुमानित शुरुआती निवेश:**
   **${budgetVal}** *(आपके बताए गए बजट और शुरुआती आवश्यकताओं के अनुसार)*

4. **आवश्यक संसाधन:**
   ${res}

5. **संभावित आय सीमा:**
   **${income}**

6. **बुनियादी आवश्यकताएं (Setup):**
   ${setup}

7. **संभावित ग्राहक व बाजार:**
   ${market}

8. **मुख्य जोखिम व समाधान:**
   ${risks}

9. **सरकारी योजनाएं व सब्सिडी:**
   ${schemes}

10. **शुरुआत के आसान कदम:**
${steps}

---
⚠️ *ध्यान दें: यहाँ बताया गया निवेश और आय अनुमानित (estimates) हैं। वास्तविक लाभ आपके क्षेत्र की मांग, लागत, प्रतिस्पर्धा और प्रबंधन पर निर्भर करता है।*`;
}

/**
 * Main Conversational Engine supporting Language as the Source of Truth
 */
function processConversationalTurn({ message, conversation_state = {}, lang = 'en' }) {
  const selectedLang = normalizeLang(lang || conversation_state.lang || 'en');
  const userText = (message || '').trim();
  const state = { ...conversation_state };

  // Store current selected language in state
  state.lang = selectedLang;

  // Defaults
  state.name = state.name || null;
  state.state = state.state || null;
  state.district = state.district || null;
  state.business = state.business || null;
  state.flowType = state.flowType || null; // 'own_idea' or 'suggest'
  state.step = state.step || 'START';
  state.currentQuestionIndex = state.currentQuestionIndex !== undefined ? state.currentQuestionIndex : 0;
  state.answers = state.answers || {};

  // Compound Extraction from user's current message
  const compound = extractCompoundEntities(userText, state);
  if (compound.name && !state.name) state.name = compound.name;
  if (compound.state && !state.state) state.state = compound.state;
  if (compound.district && !state.district) state.district = compound.district;
  if (compound.budget) {
    state.answers.budget = compound.budget;
    state.answers.dairy_budget = compound.budget;
  }
  if (compound.land) {
    state.answers.land = compound.land;
    state.answers.dairy_land = compound.land;
    state.answers.agri_land = compound.land;
  }
  if (compound.space) {
    state.answers.space = compound.space;
    state.answers.dairy_space = compound.space;
  }
  if (compound.animals) {
    state.answers.animals = "2-5";
    state.answers.dairy_animals = compound.animals;
  }
  let justIdentifiedBusiness = false;
  if (compound.business && !state.business) {
    state.business = compound.business;
    state.businessType = compound.business.toLowerCase();
    justIdentifiedBusiness = true;
  }
  if (state.business && !state.businessType) {
    state.businessType = state.business.toLowerCase();
  }

  // Check for "I don't know" / unsure
  const lower = userText.toLowerCase();
  const isUnsure = /\b(don't know|dont know|not sure|pata nahi|nahi pata|idea nahi|samajh nahi|decide nahi|తెలియదు|ఖచ్చితంగా తెలియదు)\b/i.test(lower);

  // --------------------------------------------------------------------------
  // STEP 1: ASK NAME
  // --------------------------------------------------------------------------
  if (state.step === 'START' || !state.name) {
    if (userText && !compound.name && state.step === 'ASK_NAME') {
      const cleanName = userText.replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F]/gi, '').trim();
      const forbidden = ['hello', 'hi', 'namaste', 'dairy', 'farming', 'yes', 'no', 'నమస్కారం', 'హలో'];
      if (cleanName.length >= 2 && !forbidden.includes(cleanName.toLowerCase())) {
        state.name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }
    }

    if (!state.name) {
      state.step = 'ASK_NAME';
      const qObj = INITIAL_QUESTIONS.ask_name;
      const msg = qObj.message[selectedLang];
      return {
        message: msg,
        language: selectedLang,
        questionId: qObj.questionId,
        quickReplies: qObj.quickReplies[selectedLang],
        business: null,
        step: 1,
        waitingForAnswer: true,
        reply: msg,
        speak_text: cleanForSpeech(msg),
        conversation_state: state
      };
    }
  }

  // --------------------------------------------------------------------------
  // STEP 2: ASK STATE
  // --------------------------------------------------------------------------
  if (state.name && !state.state) {
    if (userText && state.step === 'ASK_STATE') {
      const matched = COMMON_STATES.find(s => s.toLowerCase() === lower || lower.includes(s.toLowerCase()));
      if (matched) {
        state.state = matched;
      } else if (compound.state) {
        state.state = compound.state;
      } else if (userText.length >= 2 && !['yes', 'no', 'namaste'].includes(lower)) {
        state.state = userText.charAt(0).toUpperCase() + userText.slice(1);
      }
    }

    if (!state.state) {
      state.step = 'ASK_STATE';
      const qObj = INITIAL_QUESTIONS.ask_state;
      const msg = qObj.message[selectedLang](state.name);
      return {
        message: msg,
        language: selectedLang,
        questionId: qObj.questionId,
        quickReplies: qObj.quickReplies[selectedLang],
        business: null,
        step: 2,
        waitingForAnswer: true,
        reply: msg,
        speak_text: cleanForSpeech(msg),
        conversation_state: state
      };
    }
  }

  // --------------------------------------------------------------------------
  // STEP 3: ASK DISTRICT
  // --------------------------------------------------------------------------
  if (state.name && state.state && !state.district) {
    if (userText && state.step === 'ASK_DISTRICT') {
      const cleanDist = userText.replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F]/gi, '').trim();
      const forbidden = ['yes', 'no', 'dairy', 'farming', 'state', 'district', 'lakh', 'avunu', 'ledu'];
      if (cleanDist.length >= 2 && !forbidden.includes(cleanDist.toLowerCase())) {
        state.district = cleanDist.charAt(0).toUpperCase() + cleanDist.slice(1);
      }
    }

    if (!state.district) {
      state.step = 'ASK_DISTRICT';
      const qObj = INITIAL_QUESTIONS.ask_district;
      const msg = qObj.message[selectedLang];
      return {
        message: msg,
        language: selectedLang,
        questionId: qObj.questionId,
        quickReplies: qObj.quickReplies[selectedLang],
        business: null,
        step: 3,
        waitingForAnswer: true,
        reply: msg,
        speak_text: cleanForSpeech(msg),
        conversation_state: state
      };
    }
  }

  // --------------------------------------------------------------------------
  // STEP 4: IDEA CHECK
  // --------------------------------------------------------------------------
  if (state.name && state.state && state.district && !state.business && !state.flowType) {
    if (userText && state.step === 'ASK_IDEA_CHECK') {
      if (/\b(own_idea|mere paas|idea hai|i have an idea|నా దగ్గర ఆలోచన|own idea|yes|already)\b/i.test(lower)) {
        state.flowType = 'own_idea';
      } else if (/\b(suggest|aap suggest|suggest a business|మీరు సూచించండి|no|nahi|recommend)\b/i.test(lower)) {
        state.flowType = 'suggest';
      } else {
        const detected = normalizeBusiness(userText);
        if (detected) {
          state.business = detected;
          state.businessType = detected.toLowerCase();
          state.flowType = 'own_idea';
          justIdentifiedBusiness = true;
        }
      }
    }

    if (!state.flowType && !state.business) {
      state.step = 'ASK_IDEA_CHECK';
      const qObj = INITIAL_QUESTIONS.idea_check;
      const msg = qObj.message[selectedLang];
      return {
        message: msg,
        language: selectedLang,
        questionId: qObj.questionId,
        quickReplies: qObj.quickReplies[selectedLang],
        business: null,
        step: 4,
        waitingForAnswer: true,
        reply: msg,
        speak_text: cleanForSpeech(msg),
        conversation_state: state
      };
    }
  }

  // --------------------------------------------------------------------------
  // STEP 5: CHOOSE BUSINESS
  // --------------------------------------------------------------------------
  if (!state.business) {
    if (userText && (state.step === 'ASK_BUSINESS_SELECTION' || state.step === 'ASK_IDEA_CHECK')) {
      const detected = normalizeBusiness(userText);
      if (detected) {
        state.business = detected;
        state.businessType = detected.toLowerCase();
        justIdentifiedBusiness = true;
      }
    }

    if (!state.business) {
      state.step = 'ASK_BUSINESS_SELECTION';
      const qObj = state.flowType === 'own_idea' ? INITIAL_QUESTIONS.choose_business_own : INITIAL_QUESTIONS.choose_business_suggest;
      const msg = qObj.message[selectedLang];
      return {
        message: msg,
        language: selectedLang,
        questionId: qObj.questionId,
        quickReplies: qObj.quickReplies[selectedLang],
        business: null,
        step: 5,
        waitingForAnswer: true,
        reply: msg,
        speak_text: cleanForSpeech(msg),
        conversation_state: state
      };
    }
  }

  // --------------------------------------------------------------------------
  // BUSINESS FLOW QUESTIONS (DAIRY, AGRICULTURE, FOOD, RETAIL, etc.)
  // --------------------------------------------------------------------------
  const questions = BUSINESS_FLOWS_I18N[state.business] || BUSINESS_FLOWS_I18N.DAIRY;

  // Immediately after successfully identifying business: ask Question 1 without stopping!
  if (justIdentifiedBusiness) {
    const nextQ = getNextUnansweredQuestion(questions, state.answers);
    if (nextQ) {
      state.step = `BIZ_Q_${nextQ.index}`;
      state.currentQuestionIndex = nextQ.index;

      const acks = {
        en: "Great! Let's understand your requirements step by step.\n\n",
        hi: "बहुत अच्छा! आइए चरणबद्ध तरीके से आपकी आवश्यकताएं समझते हैं।\n\n",
        te: "చాలా మంచిది! మీ అవసరాలను దశలవారీగా అర్థం చేసుకుందాం.\n\n"
      };
      const ack = acks[selectedLang] || acks.en;
      const qMsg = nextQ.question.message[selectedLang] || nextQ.question.message.en;
      const fullMsg = `${ack}${qMsg}`;
      const qReplies = nextQ.question.quickReplies[selectedLang] || nextQ.question.quickReplies.en;

      return {
        message: fullMsg,
        language: selectedLang,
        questionId: nextQ.question.questionId,
        quickReplies: qReplies,
        business: state.business,
        step: nextQ.index + 1,
        waitingForAnswer: true,
        reply: fullMsg,
        speak_text: cleanForSpeech(fullMsg),
        conversation_state: state
      };
    }
  }

  // Record answer to previous question if answering an active step
  if (state.step.startsWith('BIZ_Q_')) {
    const prevIdx = parseInt(state.step.replace('BIZ_Q_', ''), 10);
    const prevQuestionObj = questions[prevIdx];
    if (prevQuestionObj && userText) {
      // Land validation for "I don't know"
      if (isUnsure && (prevQuestionObj.key === 'land' || prevQuestionObj.key === 'dairy_land' || prevQuestionObj.key === 'agri_land')) {
        const landValidation = {
          en: {
            msg: "No problem. Can you tell the approximate land area?",
            buttons: [
              { label: "No Land", value: "No land" },
              { label: "Less than 1 Acre", value: "Less than 1 Acre" },
              { label: "1–2 Acres", value: "1–2 Acres" },
              { label: "2–5 Acres", value: "2–5 Acres" },
              { label: "More than 5 Acres", value: "More than 5 Acres" }
            ]
          },
          hi: {
            msg: "Koi problem nahi. Aap approximate area bata sakte hain?",
            buttons: [
              { label: "कोई जमीन नहीं", value: "No land" },
              { label: "1 एकड़ से कम", value: "Less than 1 Acre" },
              { label: "1–2 एकड़", value: "1–2 Acres" },
              { label: "2–5 एकड़", value: "2–5 Acres" },
              { label: "5 एकड़ से अधिक", value: "More than 5 Acres" }
            ]
          },
          te: {
            msg: "సమస్య లేదు. సుమారు ఎంత భూమి అందుబాటులో ఉందో చెప్పగలరా?",
            buttons: [
              { label: "భూమి లేదు", value: "No land" },
              { label: "1 ఎకరం కంటే తక్కువ", value: "Less than 1 Acre" },
              { label: "1–2 ఎకరాలు", value: "1–2 Acres" },
              { label: "2–5 ఎకరాలు", value: "2–5 Acres" },
              { label: "5 ఎకరాల కంటే ఎక్కువ", value: "More than 5 Acres" }
            ]
          }
        };

        const v = landValidation[selectedLang];
        return {
          message: v.msg,
          language: selectedLang,
          questionId: 'land_unsure_validation',
          quickReplies: v.buttons,
          business: state.business,
          step: prevIdx + 1,
          waitingForAnswer: true,
          reply: v.msg,
          speak_text: cleanForSpeech(v.msg),
          conversation_state: state
        };
      }

      let normalizedAnswer = userText;
      // Normalization for Animal Count ("around 5" -> "2-5" / "2–5 animals")
      if (prevQuestionObj.key === 'dairy_animals' || prevQuestionObj.key === 'animals') {
        const parsed = parseAnimalCount(userText);
        if (parsed) normalizedAnswer = parsed;
      }
      // Normalization for Budget
      else if ((prevQuestionObj.key === 'budget' || prevQuestionObj.key === 'dairy_budget') && compound.budget) {
        normalizedAnswer = compound.budget;
      }
      // Normalization for Land / Space
      else if ((prevQuestionObj.key === 'land' || prevQuestionObj.key === 'dairy_land' || prevQuestionObj.key === 'agri_land') && compound.land) {
        normalizedAnswer = compound.land;
      }
      else if ((prevQuestionObj.key === 'space' || prevQuestionObj.key === 'dairy_space' || prevQuestionObj.key === 'food_space' || prevQuestionObj.key === 'mfg_space') && compound.space) {
        normalizedAnswer = compound.space;
      }
      // Check quick-replies across all languages (en, hi, te)
      else if (prevQuestionObj.quickReplies) {
        for (const lCode of ['en', 'hi', 'te']) {
          const list = prevQuestionObj.quickReplies[lCode];
          if (Array.isArray(list)) {
            const matched = list.find(qr => 
              (qr.label && qr.label.toLowerCase() === userText.toLowerCase()) ||
              (qr.value && qr.value.toLowerCase() === userText.toLowerCase())
            );
            if (matched) {
              normalizedAnswer = matched.value;
              break;
            }
          }
        }
      }

      state.answers[prevQuestionObj.key] = normalizedAnswer;
      if (prevQuestionObj.key === 'dairy_animals') {
        state.answers.animals = "2-5";
        state.answers.dairy_animals = normalizedAnswer;
      }
      if (prevQuestionObj.key === 'dairy_space') state.answers.space = normalizedAnswer;
      if (prevQuestionObj.key === 'dairy_land') state.answers.land = normalizedAnswer;
      if (prevQuestionObj.key === 'dairy_budget') state.answers.budget = normalizedAnswer;
    }
  }

  // Find the next unanswered question (skipping already answered questions)
  const nextUnanswered = getNextUnansweredQuestion(questions, state.answers);

  // If all questions are answered, deliver Final Analysis
  if (!nextUnanswered) {
    state.step = 'FINAL_ANALYSIS';
    const analysis = generateFinalAnalysis(state, selectedLang);
    return {
      message: analysis,
      language: selectedLang,
      questionId: 'final_analysis',
      quickReplies: [],
      business: state.business,
      step: "COMPLETED",
      waitingForAnswer: false,
      reply: analysis,
      speak_text: cleanForSpeech(analysis.split('⚠️')[0].slice(0, 260)),
      conversation_state: state
    };
  }

  // Ask the next predefined question in the selected language
  const currentQ = nextUnanswered.question;
  const qIndex = nextUnanswered.index;
  state.step = `BIZ_Q_${qIndex}`;
  state.currentQuestionIndex = qIndex;

  const currentMsg = currentQ.message[selectedLang] || currentQ.message.en;
  const currentReplies = currentQ.quickReplies[selectedLang] || currentQ.quickReplies.en;

  return {
    message: currentMsg,
    language: selectedLang,
    questionId: currentQ.questionId,
    quickReplies: currentReplies,
    business: state.business,
    step: qIndex + 1,
    waitingForAnswer: true,
    reply: currentMsg,
    speak_text: cleanForSpeech(currentMsg),
    conversation_state: state
  };
}

/**
 * Public export for generating dynamic advisory
 */
exports.generateDynamicAdvisory = async function({ message, conversation_state = {}, history = [], profile = {}, lang = 'en' }) {
  const language = normalizeLang(lang || conversation_state?.lang || 'en');
  return processConversationalTurn({ message, conversation_state, lang: language });
};

exports.cleanForSpeech = cleanForSpeech;
exports.normalizeBusiness = normalizeBusiness;
exports.normalizeLang = normalizeLang;
exports.INITIAL_QUESTIONS = INITIAL_QUESTIONS;
exports.BUSINESS_FLOWS_I18N = BUSINESS_FLOWS_I18N;
exports.extractCompoundEntities = extractCompoundEntities;
exports.generateFinalAnalysis = generateFinalAnalysis;
