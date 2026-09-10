/**
 * Multi-Language Question Translation Dictionary for UdyamSarthi
 * 
 * Supports instant client-side question & quick-reply retranslation
 * when language is toggled mid-conversation.
 */

export const QUESTION_TRANSLATIONS = {
  ask_name: {
    message: {
      en: "Hello! I am UdyamSarthi. I will help you choose and plan a suitable business for you.\n\nFirst, what is your name?",
      hi: "Namaste! Main UdyamSarthi hoon. Main aapko aapke liye suitable business choose aur plan karne mein help karungi.\n\nSabse pehle, aapka naam kya hai?",
      te: "నమస్కారం! నేను ఉద్యమ్‌సారథిని. మీకు తగిన వ్యాపారాన్ని ఎంచుకోవడంలో మరియు ప్రణాళిక రూపొందించడంలో నేను సహాయం చేస్తాను.\n\nముందుగా, మీ పేరు ఏమిటి?"
    },
    quickReplies: { en: [], hi: [], te: [] }
  },

  ask_state: {
    message: {
      en: (name) => `Nice to meet you, ${name || 'friend'}. Which state are you from?`,
      hi: (name) => `Nice to meet you, ${name || 'dost'}. Aap kis state se hain?`,
      te: (name) => `మిమ్మల్ని కలవడం సంతోషంగా ఉంది, ${name || 'మిత్రమా'}. మీరు ఏ రాష్ట్రానికి చెందినవారు?`
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
    message: {
      en: "Which district are you from?",
      hi: "Aap kis district se hain?",
      te: "మీరు ఏ జిల్లాకు చెందినవారు?"
    },
    quickReplies: { en: [], hi: [], te: [] }
  },

  idea_check: {
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
  },

  dairy_q1: {
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

  dairy_q2: {
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

  dairy_q3: {
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

  dairy_q4: {
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

  dairy_q5: {
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

  dairy_q6: {
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

  dairy_q7: {
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

  dairy_q8: {
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
};

/**
 * Retrieve translated message and quickReplies for a given questionId
 */
export function getTranslatedQuestion(questionId, lang = 'en', state = {}) {
  const l = (lang && (lang.startsWith('hi') ? 'hi' : lang.startsWith('te') ? 'te' : 'en')) || 'en';
  const item = QUESTION_TRANSLATIONS[questionId];
  if (!item) return null;

  let msg = item.message[l] || item.message.en;
  if (typeof msg === 'function') {
    msg = msg(state?.name);
  }

  const replies = item.quickReplies[l] || item.quickReplies.en || [];
  return {
    message: msg,
    quickReplies: replies
  };
}
