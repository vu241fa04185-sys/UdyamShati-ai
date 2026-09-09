/**
 * UdyamSarthi True AI Business Advisor Agent Service
 * 
 * Female AI Business Advisor with domain-specific knowledge for:
 * 1. Dairy Farming (Cows/Buffaloes, Shed, Land, Green Fodder, Milk Centers, Subsidies)
 * 2. Poultry Farming (Broiler vs Layer, Bird count, Shed, Electricity/Water, Market, Contract)
 * 3. Goat Farming (Meat vs Breeding, Unit size 10+1, Grazing/Stall-fed, Shed, Breed, NLM Subsidy)
 * 4. Food Processing / Small Food Business (Pickles, Spices, Flour, Snacks, Raw Materials, PMFME, FSSAI)
 * 
 * Core Architectural Guarantees:
 * - Natural Female Advisor Persona ("jaan sakti hoon", "help karungi", "samajh gayi")
 * - Dynamic Business Detection (auto-infers business from "10 buffaloes", "mango pickle", "broiler", etc.)
 * - Zero Dummy Defaults (all user data starts null/empty)
 * - Zero Repetition (never asks for known entities)
 * - Dynamic Contextual Questioning (each question reacts to prior answers)
 * - Multilingual Support (Hindi Devanagari, Hinglish Latin, Telugu, English)
 * - Informational Query Handling (answers subsidy, loan/EMI, profit questions mid-conversation)
 */

function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN');
}

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
 * Detect Language mode:
 * - 'hi_deva': Hindi in Devanagari script
 * - 'te': Telugu script or words
 * - 'hi_latin': Hinglish / Hindi in Latin script
 * - 'en': English
 */
function detectLanguageMode(text, currentLang = 'hi') {
  if (!text) return currentLang || 'hi_latin';
  const t = text.trim();
  const lower = t.toLowerCase();

  // Explicit switches
  if (/\b(in english|switch to english|english lo|speak in english)\b/i.test(lower)) return 'en';
  if (/\b(hindi mein|in hindi|hindi lo)\b/i.test(lower)) return 'hi_latin';
  if (/\b(telugu mein|in telugu|telugu lo)\b/i.test(lower)) return 'te';

  // Telugu script or distinct words
  if (/[\u0C00-\u0C7F]/.test(t) || /\b(naaku|na peru|vyaaparam|peddaga|pettubadi|daggara|cheyyali|unnayi|ledu|avunu|kadu|లక్ష|రూపాయలు|మేకలు|కోళ్లు|ఆవులు|గేదెలు)\b/i.test(lower)) {
    return 'te';
  }

  // Devanagari script
  if (/[\u0900-\u097F]/.test(t)) {
    return 'hi_deva';
  }

  // Pure English grammatical structures
  if (/\b(my name is|i live in|i want to start|i want to do|how much|what is the|suggest a|business in|start dairy|start poultry|do you have|what budget|buffaloes|cows|chickens|pickle|spices|food processing)\b/i.test(lower)) {
    return 'en';
  }

  // Hinglish keywords
  if (/\b(namaste|mera|meri|mujhe|karna|hai|paas|hazar|kheti|batao|kaunsa|hogi|bhai|ji|kisan|shehar|gaon|shuru|paisa|chahiye|milti|kya|kaise|rehta|hoon|raha|sakta|sakti)\b/i.test(lower)) {
    return 'hi_latin';
  }

  if (currentLang === 'hi_deva' || currentLang === 'hi') return 'hi_deva';
  if (currentLang === 'te') return 'te';
  if (currentLang === 'en') return 'en';
  return 'hi_latin';
}

/**
 * Deep Entity Extractor supporting 4 Rural Business Domains
 */
function extractEntities(text, existingState = {}) {
  if (!text) return {};
  const t = text.trim();
  const lower = t.toLowerCase();
  const extracted = {};

  // --------------------------------------------------------------------------
  // 1. BUDGET / CAPITAL EXTRACTION
  // --------------------------------------------------------------------------
  const lakhMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख|లక్ష|लाख\s*रुपये|లక్షల|లక్షలు)/i);
  if (lakhMatch) {
    extracted.budget = parseFloat(lakhMatch[1]) * 100000;
  } else {
    const wordsToNum = {
      'एक': 100000, 'दो': 200000, 'तीन': 300000, 'चार': 400000, 'पांच': 500000, 'दस': 1000000,
      'ek': 100000, 'one': 100000, 'do': 200000, 'two': 200000,
      'teen': 300000, 'three': 300000, 'chaar': 400000, 'four': 400000,
      'panch': 500000, 'five': 500000, 'das': 1000000, 'ten': 1000000,
      'ఒక': 100000, 'రెండు': 200000, 'మూడు': 300000, 'నాలుగు': 400000, 'ఐదు': 500000, 'పది': 1000000
    };
    for (const [w, val] of Object.entries(wordsToNum)) {
      if (t.includes(w) && (t.includes('लाख') || t.includes('lakh') || t.includes('lac') || t.includes('లక్ష'))) {
        extracted.budget = val;
        break;
      }
    }

    if (!extracted.budget) {
      const kMatch = t.match(/(\d+)\s*(?:k|hazar|हजार|వేలు)/i);
      if (kMatch) {
        extracted.budget = parseFloat(kMatch[1]) * 1000;
      } else {
        const directNum = t.replace(/,/g, '').match(/(?:₹|rs\.?|inr)?\s*(\d{5,8})\b/i);
        if (directNum && directNum[1].length !== 6) {
          extracted.budget = parseFloat(directNum[1]);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. NAME EXTRACTION
  // --------------------------------------------------------------------------
  if (existingState.name) {
    extracted.name = existingState.name;
  } else {
    // Devanagari prefix
    const devaNameMatch = t.match(/(?:मेरा\s*नाम\s*(?:है)?|नाम)\s*[:=]?\s*([^\s,।!?]+(?:\s+[^\s,।!?]+)?)/u);
    if (devaNameMatch) {
      let clean = devaNameMatch[1].replace(/[।!?.,]/g, '').trim();
      clean = clean.replace(/\s*(?:है|हूँ|हूं|किसान|भाई|जी)$/u, '').trim();
      const forbidden = ['डेयरी', 'पोल्ट्री', 'गुंटूर', 'व्यापार', 'बिजनेस', 'काम', 'करना', 'बकरी'];
      if (clean.length >= 2 && !forbidden.includes(clean)) {
        extracted.name = clean;
      }
    }

    // Telugu prefix
    if (!extracted.name) {
      const teNameMatch = t.match(/(?:నా\s*పేరు|పేరు)\s*[:=]?\s*([^\s,।!?]+(?:\s+[^\s,।!?]+)?)/u);
      if (teNameMatch) {
        let clean = teNameMatch[1].replace(/[।!?.,]/g, '').trim();
        clean = clean.replace(/\s*(?:గారు|ఉంటాను|చేయాలి|పాడి)$/u, '').trim();
        const forbidden = ['పాడి', 'గుంటూరు', 'వ్యాపారం', 'చేయాలి'];
        if (clean.length >= 2 && !forbidden.includes(clean)) {
          extracted.name = clean;
        }
      }
    }

    // English / Latin prefix
    if (!extracted.name) {
      const engNameMatch = t.match(/(?:my name is|i am|mera naam|na peru|naam)\s*[:=]?\s*([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+(?:\s+[a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+)?)/i);
      if (engNameMatch) {
        let clean = engNameMatch[1].replace(/[।!?.,]/g, '').trim();
        clean = clean.replace(/\b(hai|hoon|kisan|farmer|ji|and|aur|from|se|lo)\b/gi, '').trim();
        if (clean.length >= 2 && !/^(dairy|poultry|farming|guntur|business|delhi)$/i.test(clean)) {
          extracted.name = clean;
        }
      }
    }

    // 1-2 words raw name reply when name missing
    if (!extracted.name && !existingState.district) {
      const words = t.split(/\s+/).filter(w => w.trim().length > 0);
      if (words.length <= 2) {
        const candidate = t.replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F]/gi, '').trim();
        const forbidden = [
          'dairy', 'poultry', 'farming', 'guntur', 'lakh', 'rupees', 'hello', 'hi', 'namaste',
          'डेयरी', 'गुंटूर', 'लाख', 'रुपये', 'नमस्ते', 'పాడి', 'గుంటూరు', 'లక్షలు', 'నమస్కారం'
        ];
        if (candidate.length >= 2 && !forbidden.includes(candidate.toLowerCase())) {
          extracted.name = candidate;
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 3. DISTRICT / LOCATION EXTRACTION
  // --------------------------------------------------------------------------
  if (existingState.district) {
    extracted.district = existingState.district;
  } else {
    const locationMap = [
      { canonical: 'Guntur', hi: 'गुंटूर', te: 'గుంటూరు', aliases: ['guntur', 'गुंटूर', 'గుంటూరు', 'గుంటూరులో', 'గుంటూరు జిల్లా'] },
      { canonical: 'Krishna', hi: 'कृष्णा', te: 'కృష్ణా', aliases: ['krishna', 'कृष्णा', 'కృష్ణా'] },
      { canonical: 'Prakasam', hi: 'प्रकाशम', te: 'ప్రకాశం', aliases: ['prakasam', 'प्रकाशम', 'ప్రకాశం'] },
      { canonical: 'Vijayawada', hi: 'विजयवाड़ा', te: 'విజయవాడ', aliases: ['vijayawada', 'विजयवाड़ा', 'విజయవాడ'] },
      { canonical: 'Visakhapatnam', hi: 'विशाखापट्टनम', te: 'విశాఖపట్నం', aliases: ['visakhapatnam', 'vizag', 'विशाखापट्टनम', 'విశాఖపట్నం'] },
      { canonical: 'Chittoor', hi: 'चित्तूर', te: 'చిత్తూరు', aliases: ['chittoor', 'चित्तूर', 'చిత్తూరు'] },
      { canonical: 'Kurnool', hi: 'कर्नूल', te: 'కర్నూలు', aliases: ['kurnool', 'कर्नूल', 'కర్నూలు'] },
      { canonical: 'Nellore', hi: 'नेल्लोर', te: 'నెల్లూరు', aliases: ['nellore', 'नेल्लोर', 'నెల్లూరు'] },
      { canonical: 'Nashik', hi: 'नासिक', te: 'నాసిక్', aliases: ['nashik', 'नासिक', 'నాసిక్'] },
      { canonical: 'Pune', hi: 'पुणे', te: 'పూణే', aliases: ['pune', 'पुणे', 'పూణే'] },
      { canonical: 'Nagpur', hi: 'नागपुर', te: 'నాగ్‌పూర్', aliases: ['nagpur', 'नागपुर', 'నాగ్‌పూర్'] },
      { canonical: 'Varanasi', hi: 'वाराणसी', te: 'వారణాసి', aliases: ['varanasi', 'वाराणसी', 'बनारस'] },
      { canonical: 'Patna', hi: 'पटना', te: 'పాట్నా', aliases: ['patna', 'पटना'] },
      { canonical: 'Jaipur', hi: 'जयपुर', te: 'జైపూర్', aliases: ['jaipur', 'जयपुर'] },
      { canonical: 'Hyderabad', hi: 'हैदराबाद', te: 'హైదరాబాద్', aliases: ['hyderabad', 'हैदराबाद', 'హైదరాబాద్'] },
      { canonical: 'Chebrole', hi: 'चेबरोलु', te: 'చేబ్రోలు', aliases: ['chebrole', 'चेबरोलु', 'చేబ్రోలు'] },
      { canonical: 'Vadlamudi', hi: 'वडलामूडी', te: 'వడ్లమూడి', aliases: ['vadlamudi', 'वडलामूडी', 'వడ్లమూడి'] },
      { canonical: 'Tenali', hi: 'तेनाली', te: 'తెనాలి', aliases: ['tenali', 'तेनाली', 'తెనాలి'] }
    ];

    for (const item of locationMap) {
      for (const alias of item.aliases) {
        if (t.toLowerCase().includes(alias.toLowerCase())) {
          if (/[\u0900-\u097F]/.test(t)) {
            extracted.district = item.hi;
          } else if (/[\u0C00-\u0C7F]/.test(t)) {
            extracted.district = item.te;
          } else {
            extracted.district = item.canonical;
          }
          break;
        }
      }
      if (extracted.district) break;
    }

    if (!extracted.district) {
      const locPhraseMatch = t.match(/(?:live in|from|district|location|shehar|gaon|mein|rehta hoon|रहता हूँ|रहता हूं|ఉంటాను|జిల్లా)\s*[:=]?\s*([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+)/iu);
      if (locPhraseMatch) {
        const cand = locPhraseMatch[1].replace(/[।!?.,]/g, '').trim();
        if (cand.length >= 3 && !['dairy', 'poultry', 'business', 'farming', 'डेयरी', 'पाडी'].includes(cand.toLowerCase())) {
          extracted.district = cand;
        }
      }
    }

    if (!extracted.district && existingState.name) {
      const words = t.split(/\s+/).filter(w => w.trim().length > 0);
      if (words.length <= 2) {
        const cand = t.replace(/[।!?.,]/g, '').trim();
        const forbidden = [
          'dairy', 'poultry', 'farming', 'business', 'lakh', 'rupees', 'yes', 'no', 'haan', 'nahi',
          'डेयरी', 'पोल्ट्री', 'खेती', 'व्यापार', 'लाख', 'रुपये', 'हाँ', 'नहीं', 'పాడి', 'పౌల్ట్రీ', 'లక్షలు'
        ];
        if (cand.length >= 2 && !forbidden.includes(cand.toLowerCase())) {
          extracted.district = cand;
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. BUSINESS CATEGORY DETECTION (4 Key Rural Categories)
  // --------------------------------------------------------------------------
  if (existingState.business) {
    extracted.business = existingState.business;
  } else {
    // 1. Dairy Farming
    if (/(dairy|milk|cow|cows|buffalo|buffaloes|bhains|doodh|डेयरी|दूध|गाय|भैंस|పాడి|పాల|డెయిరీ)/i.test(t)) {
      extracted.business = 'Dairy Farming';
    }
    // 2. Poultry Farming
    else if (/(poultry|broiler|layer|chicken|birds|murgi|पोल्ट्री|मुर्गी|पक्षी|పౌల్ట్రీ|కోళ్ల)/i.test(t)) {
      extracted.business = 'Poultry Farming';
    }
    // 3. Goat Farming
    else if (/(goat|goats|bakri|bakriyan|बकरी|बकरा|మేకల|మేకలు)/i.test(t)) {
      extracted.business = 'Goat Farming';
    }
    // 4. Food Processing / Small Food Business
    else if (/(food processing|pickle|pickles|achar|spices|masala|papad|flour|atta chakki|snacks|chips|अचार|मसाला|मसाले|पापड़|आटा|खाद्य प्रसंस्करण|ఆహార ప్రాసెసింగ్|ఊరగాయ|మసాలాలు)/i.test(t)) {
      extracted.business = 'Food Processing';
    }
  }

  // --------------------------------------------------------------------------
  // 5. DOMAIN-SPECIFIC ENTITIES (Animals, Quantity, SubCategory, Products)
  // --------------------------------------------------------------------------
  // A. Animal Type & Quantity
  const qtyMatch = t.match(/(\d+)\s*(?:buffaloes|buffalo|bhains|bhainse|cows|cow|gaay|gay|birds|murgi|murgiyan|goats|goat|bakri|bakriyan|భైన్స్|గేదెలు|ఆవులు|కోళ్లు|మేకలు|भैंस|गाय|मुर्गी|बकरी|पक्षी)/i);
  if (qtyMatch) {
    extracted.quantity = parseInt(qtyMatch[1], 10);
    const matchedText = qtyMatch[0].toLowerCase();
    if (/buffalo|bhains|గేదె|भैंस/.test(matchedText)) {
      extracted.animalType = 'Buffalo';
      if (!extracted.business) extracted.business = 'Dairy Farming';
    } else if (/cow|gaay|ఆవు|गाय/.test(matchedText)) {
      extracted.animalType = 'Cow';
      if (!extracted.business) extracted.business = 'Dairy Farming';
    } else if (/bird|murgi|కోడి|కోళ్ల|मुर्गी|पक्षी/.test(matchedText)) {
      extracted.animalType = 'Poultry Bird';
      if (!extracted.business) extracted.business = 'Poultry Farming';
    } else if (/goat|bakri|మేక|बकरी/.test(matchedText)) {
      extracted.animalType = 'Goat';
      if (!extracted.business) extracted.business = 'Goat Farming';
    }
  }

  // Handle 10+1 unit pattern for goats
  const unit10Match = t.match(/10\s*\+\s*1\s*(?:unit|goat|bakri|మేకలు)?/i);
  if (unit10Match) {
    extracted.quantity = 11;
    extracted.animalType = 'Goat';
    if (!extracted.business) extracted.business = 'Goat Farming';
  }

  // Direct mention of animals without number
  if (!extracted.animalType) {
    if (/(buffalo|bhains|भैंस|గేదె)/i.test(t)) {
      extracted.animalType = 'Buffalo';
      if (!extracted.business) extracted.business = 'Dairy Farming';
    } else if (/(cow|cows|gaay|गाय|ఆవు)/i.test(t)) {
      extracted.animalType = 'Cow';
      if (!extracted.business) extracted.business = 'Dairy Farming';
    } else if (/(goat|goats|bakri|bakriyan|बकरी|మేక)/i.test(t)) {
      extracted.animalType = 'Goat';
      if (!extracted.business) extracted.business = 'Goat Farming';
    } else if (/(broiler|layer|chicken|bird|birds|murgi|కోడి)/i.test(t)) {
      extracted.animalType = 'Poultry Bird';
      if (!extracted.business) extracted.business = 'Poultry Farming';
    }
  }

  // Raw number reply for quantity if business already known and quantity missing
  if (!extracted.quantity && !existingState.quantity && existingState.business) {
    const pureNumMatch = t.match(/^(\d{1,5})$/);
    if (pureNumMatch) {
      extracted.quantity = parseInt(pureNumMatch[1], 10);
    }
  }

  // B. Poultry Subcategory (Broiler vs Layer)
  if (/(broiler|meat|मांस|బ్రాయిలర్)/i.test(t)) {
    extracted.subCategory = 'Broiler';
    if (!extracted.business) extracted.business = 'Poultry Farming';
  } else if (/(layer|egg|eggs|ande|अंडे|లేయర్|గుడ్లు)/i.test(t)) {
    extracted.subCategory = 'Layer';
    if (!extracted.business) extracted.business = 'Poultry Farming';
  }

  // C. Goat Subcategory (Meat vs Breeding vs Both)
  if (/(both|meat and breeding|dono|दोनों|రెండు|మాంసం మరియు బ్రీడింగ్)/i.test(t) && (/goat|bakri|మేక/i.test(t) || existingState.business === 'Goat Farming')) {
    extracted.subCategory = 'Dual Purpose';
    if (!extracted.business) extracted.business = 'Goat Farming';
  } else if (/(breeding|नस्ल सुधार|ब्रीडिंग|ప్రజననం)/i.test(t) && (/goat|bakri|మేక/i.test(t) || existingState.business === 'Goat Farming')) {
    extracted.subCategory = 'Breeding';
    if (!extracted.business) extracted.business = 'Goat Farming';
  } else if (/(meat|mutton|मांस|మటన్)/i.test(t) && (/goat|bakri|మేక/i.test(t) || existingState.business === 'Goat Farming')) {
    extracted.subCategory = 'Meat';
    if (!extracted.business) extracted.business = 'Goat Farming';
  }

  // D. Food Processing Products
  if (/(mango pickle|aam ka achar|आम का अचार|మామిడికాయ ఊరగాయ|mango)/i.test(t)) {
    extracted.productType = 'Mango Pickle';
    if (!extracted.business) extracted.business = 'Food Processing';
  } else if (/(lemon pickle|nimbu ka achar|नींबू का अचार|నిమ్మకాయ ఊరగాయ|lemon|nimbu)/i.test(t)) {
    extracted.productType = 'Lemon Pickle';
    if (!extracted.business) extracted.business = 'Food Processing';
  } else if (/(chilli pickle|mirch ka achar|मिर्च का अचार|మిర్చి ఊరగాయ|chilli|mirch)/i.test(t)) {
    extracted.productType = 'Chilli Pickle';
    if (!extracted.business) extracted.business = 'Food Processing';
  } else if (/(pickle|pickles|achar|अचार|ఊరగాయ)/i.test(t)) {
    extracted.productType = 'Pickles';
    if (!extracted.business) extracted.business = 'Food Processing';
  } else if (/(spices|masala|masale|मसाला|मसाले|మసాలాలు)/i.test(t)) {
    extracted.productType = 'Spices';
    if (!extracted.business) extracted.business = 'Food Processing';
  } else if (/(papad|पापड़|అప్పడాలు)/i.test(t)) {
    extracted.productType = 'Papad';
    if (!extracted.business) extracted.business = 'Food Processing';
  } else if (/(flour|atta|chakki|आटा|పిండి|ఆటా)/i.test(t)) {
    extracted.productType = 'Flour Milling';
    if (!extracted.business) extracted.business = 'Food Processing';
  } else if (/(snacks|chips|namkeen|नमकीन|चिप्स|స్నాక్స్)/i.test(t)) {
    extracted.productType = 'Snacks & Chips';
    if (!extracted.business) extracted.business = 'Food Processing';
  } else if (/(sweet|sweets|mithai|bakery|मिठाई|స్వీట్లు)/i.test(t)) {
    extracted.productType = 'Sweets & Bakery';
    if (!extracted.business) extracted.business = 'Food Processing';
  }

  // --------------------------------------------------------------------------
  // 6. RESOURCES: LAND, SHED, FODDER, RAW MATERIAL, WORKSPACE, SALES CHANNEL
  // --------------------------------------------------------------------------
  // Compound land & shed answers:
  if (/(have land.*(?:no|without).*shed|land hai.*shed nahi|zameen hai.*shed nahi|जमीन है.*शेड नहीं|స్థలం ఉంది.*షెడ్ లేదు)/i.test(t)) {
    extracted.landAvailable = true;
    extracted.shedAvailable = false;
  } else if (/(no.*land.*(?:have|with).*shed|land nahi.*shed hai|जमीन नहीं.*शेड है|స్థలం లేదు.*షెడ్ ఉంది)/i.test(t)) {
    extracted.landAvailable = false;
    extracted.shedAvailable = true;
  } else if (/(have both|both are available|dono hai|donon hai|दोनों हैं|రెండు ఉన్నాయి|land and shed|zameen aur shed)/i.test(t)) {
    extracted.landAvailable = true;
    extracted.shedAvailable = true;
  } else if (/(neither|dono nahi|donon nahi|dono nahi hai|दोनों नहीं|రెండు లేవు|no land.*no shed)/i.test(t)) {
    extracted.landAvailable = false;
    extracted.shedAvailable = false;
  } else {
    // Individual Land
    if (/(have land|land is available|land available|land hai|zameen hai|जमीन है|సొంత స్థలం ఉంది|స్థలం ఉంది|open grazing land)/i.test(t)) {
      extracted.landAvailable = true;
    } else if (/(no land|without land|land nahi|zameen nahi|जमीन नहीं|స్థలం లేదు)/i.test(t)) {
      extracted.landAvailable = false;
    }

    // Individual Shed
    if (/(have shed|shed is available|shed available|have a shed|have cattle shed|have poultry shed|have goat shed|shed hai|शेड है|షెడ్ ఉంది)/i.test(t)) {
      extracted.shedAvailable = true;
    } else if (/(no shed|no cattle shed|no poultry shed|without shed|shed nahi|need a shed|need to build a shed|shed banana padega|शेड नहीं|షెడ్ లేదు)/i.test(t)) {
      extracted.shedAvailable = false;
    }
  }

  // Green Fodder / Feed:
  if (/(green fodder available|fodder available|hara chara hai|हरा चारा है|పచ్చిగడ్డి ఉంది|fodder is available|feed available|green fodder)/i.test(t)) {
    extracted.feedFodder = 'locally available';
  } else if (/(purchase feed|market se khareedenge|खरीदेंगे|కొనుగోలు చేస్తాము|dry feed|purchase from market|bazaar se)/i.test(t)) {
    extracted.feedFodder = 'purchase from market';
  }

  // Water & Electricity:
  if (/(water is available|clean water|pani hai|water available|pani ki suvidha hai|తాగునీరు ఉంది|మంచి నీరు)/i.test(t)) {
    extracted.waterAvailable = true;
  } else if (/(no water|pani nahi|water problem|నీటి సమస్య)/i.test(t)) {
    extracted.waterAvailable = false;
  }

  if (/(electricity available|bijli hai|current undi|విద్యుత్ ఉంది)/i.test(t)) {
    extracted.electricityAvailable = true;
  } else if (/(no electricity|bijli nahi|power cut|కరెంట్ లేదు)/i.test(t)) {
    extracted.electricityAvailable = false;
  }

  // Veterinary Access:
  if (/(veterinary available|hospital nearby|doctor hai|డాక్టర్ ఉన్నారు|पशु अस्पताल|doctor available|access to veterinary)/i.test(t)) {
    extracted.veterinaryAccess = true;
  } else if (/(no doctor|no veterinary|hospital door hai|పశువైద్యశాల లేదు)/i.test(t)) {
    extracted.veterinaryAccess = false;
  }

  // Food Raw Materials:
  if (/(locally available|locally|mangoes locally|local market|आसानी से मिलता है|స్థానికంగా|local mangoes|local raw material)/i.test(t)) {
    extracted.rawMaterial = 'locally available';
  } else if (/(suppliers|outside|बाहर से|సప్లయర్స్|purchase from suppliers|wholesale market)/i.test(t)) {
    extracted.rawMaterial = 'from suppliers';
  }

  // Workspace:
  if (/(from home|start from home|ghar se|घर से|ఇంట్లో)/i.test(t)) {
    extracted.workspace = 'home';
  } else if (/(separate unit|commercial unit|workshop|alag jagah|अलग जगह|ప్రత్యేక యూనిట్|commercial workspace)/i.test(t)) {
    extracted.workspace = 'commercial unit';
  }

  // Sales Channel:
  if (/(collection center|dairy collection center|dairy center|cooperative|सहकारी|డైరీ కలెక్షన్ సెంటర్|సొసైటీ)/i.test(t)) {
    extracted.salesChannel = 'dairy collection center';
  } else if (/(wholesalers|mandi|मंडी|హోల్‌సేల్)/i.test(t)) {
    extracted.salesChannel = 'wholesalers';
  } else if (/(contract|contract farming|company|कॉन्ट्रैक्ट|కాంట్రాక్ట్)/i.test(t)) {
    extracted.salesChannel = 'contract farming';
  } else if (/(local customers|shops|hotels|local shops|स्थानीय|लोकल|వినియోగదారులు|హాటల్స్)/i.test(t)) {
    extracted.salesChannel = 'local customers';
  }

  // Experience:
  if (/(have experience|experience hai|anubhav hai|worked before|అనుభవం ఉంది|अनुभव है|experienced)/i.test(t)) {
    extracted.experience = 'experienced';
  } else if (/(no experience|beginner|naya hoon|pehli baar|new to this|అనుభవం లేదు|अनुभव नहीं)/i.test(t)) {
    extracted.experience = 'beginner';
  }

  // Subsidy / Loan:
  if (/(need loan|need subsidy|subsidy chahiye|loan chahiye|सरकारी मदद|రుణం కావాలి|సబ్సిడీ కావాలి|government support)/i.test(t)) {
    extracted.subsidyNeeded = true;
  } else if (/(own funds|self funded|khud ka paisa|khud lagayenge|సొంత నిధులు)/i.test(t)) {
    extracted.subsidyNeeded = false;
  }

  return extracted;
}

/**
 * Check if the user is asking an informational question mid-flow
 */
function detectUserQuestion(text) {
  const lower = text.toLowerCase();
  
  // Subsidy query
  const hasSubsidyWord = lower.includes('subsidy') || lower.includes('सब्सिडी') || 
    lower.includes('సబ్సిడీ') || lower.includes('yojana') || lower.includes('योजना') || lower.includes('పథకం') || 
    lower.includes('sahayata') || lower.includes('सहायता') || lower.includes('సహాయం') || lower.includes('anudan') || lower.includes('अनुदान');

  const hasQueryWord = lower.includes('milegi') || lower.includes('milti') || lower.includes('kya') || lower.includes('hai') || 
    lower.includes('how much') || lower.includes('లభిస్తుంది') || lower.includes('ఉందా') || lower.includes('मिलती') || 
    lower.includes('मिलेगी') || lower.includes('क्या') || lower.includes('है क्या') || lower.includes('ఎంత');

  if (hasSubsidyWord && (hasQueryWord || text.includes('?'))) {
    return 'SUBSIDY_QUESTION';
  }

  // Loan / EMI query
  const hasLoanWord = lower.includes('loan') || lower.includes('emi') || lower.includes('लोन') || lower.includes('ऋण') || 
    lower.includes('రుణం') || lower.includes('byaj') || lower.includes('ब्याज') || lower.includes('వడ్డీ') || lower.includes('ఈఎమ్‌ఐ');

  const hasLoanQueryWord = lower.includes('kitna') || lower.includes('kaise') || lower.includes('how') || lower.includes('ఎంత') || 
    lower.includes('rate') || lower.includes('कितना') || lower.includes('कितनी') || lower.includes('मिलेगा') || lower.includes('लगेगा');

  if (hasLoanWord && (hasLoanQueryWord || text.includes('?'))) {
    return 'LOAN_QUESTION';
  }

  // Profit query
  if (lower.includes('profit') || lower.includes('मुनाफा') || lower.includes('कमाई') || lower.includes('लाभ') || 
      lower.includes('లాభం') || lower.includes('income') || lower.includes('आमदनी')) {
    return 'PROFIT_QUESTION';
  }

  return null;
}

/**
 * Direct Question Answer Formulations in Female Advisor Persona
 */
function answerUserQuestion(questionType, state, langMode) {
  const name = state.name ? `${state.name} ji` : (langMode === 'en' ? 'friend' : (langMode === 'te' ? 'గారు' : 'जी'));
  let bTitle = state.business || 'व्यवसाय';
  if (state.business === 'Dairy Farming') bTitle = langMode === 'hi_deva' ? 'डेयरी फार्मिंग' : (langMode === 'te' ? 'పాడి పరిశ్రమ' : 'Dairy Farming');
  else if (state.business === 'Poultry Farming') bTitle = langMode === 'hi_deva' ? 'पोल्ट्री फार्मिंग' : (langMode === 'te' ? 'పౌల్ట్రీ ఫార్మింగ్' : 'Poultry Farming');
  else if (state.business === 'Goat Farming') bTitle = langMode === 'hi_deva' ? 'बकरी पालन' : (langMode === 'te' ? 'మేకల పెంపకం' : 'Goat Farming');
  else if (state.business === 'Food Processing') bTitle = langMode === 'hi_deva' ? 'खाद्य प्रसंस्करण' : (langMode === 'te' ? 'ఆహార ప్రాసెసింగ్' : 'Food Processing');

  if (questionType === 'SUBSIDY_QUESTION') {
    if (langMode === 'hi_deva') {
      return `जी हाँ ${name}! **${bTitle}** के लिए सरकार से आकर्षक सब्सिडी उपलब्ध है:\n\n` +
        `• **नाबार्ड / AHIDF योजना:** पशुपालन व डेयरी प्रोजेक्ट पर 25% से 33.33% तक कैपिटल सब्सिडी मिलती है।\n` +
        `• **PMEGP योजना:** ग्रामीण क्षेत्र में सूक्ष्म उद्योग के लिए 25% से 35% तक सब्सिडी मिलती है।\n` +
        `• **राष्ट्रीय पशुधन मिशन (NLM):** बकरी पालन यूनिट पर 50% तक सब्सिडी उपलब्ध है।\n` +
        `• **PMFME योजना:** खाद्य प्रसंस्करण में 35% तक सब्सिडी (अधिकतम ₹10 लाख) मिलती है।\n\n` +
        `क्या आपके पास पहले से जमीन या शेड उपलब्ध है?`;
    } else if (langMode === 'te') {
      return `అవును ${name}! **${bTitle}** కోసం ప్రభుత్వ రాయితీలు అందుబాటులో ఉన్నాయి:\n\n` +
        `• **నాబార్డ్ / AHIDF పథకం:** ప్రాజెక్ట్ ఖర్చుపై 25% నుండి 33.33% వరకు రాయితీ లభిస్తుంది.\n` +
        `• **PMEGP:** గ్రామీణ ప్రాంతాల్లో 25% - 35% సబ్సిడీ లభిస్తుంది.\n` +
        `• **జాతీయ పశుసంవర్ధక మిషన్ (NLM):** మేకల పెంపకంపై 50% సబ్సిడీ లభిస్తుంది.\n\n` +
        `మీ వద్ద ముందే సొంత స్థలం లేదా షెడ్ అందుబాటులో ఉందా?`;
    } else if (langMode === 'hi_latin') {
      return `Ji haan ${name}! **${bTitle}** ke liye sarkar se subsidy uplabdh hai:\n\n` +
        `• **NABARD / AHIDF Yojana:** 25% se 33.33% tak ki capital subsidy milti hai.\n` +
        `• **PMEGP Yojana:** Grameen area mein 25% se 35% tak ki subsidy milti hai.\n` +
        `• **KCC Pashupalan:** 4% concessional interest rate par loan milta hai.\n\n` +
        `Kya aapke paas pehle se zameen ya shed available hai?`;
    } else {
      return `Yes, ${name}! Government subsidies are actively available for **${bTitle}**:\n\n` +
        `• **NABARD / AHIDF Scheme:** 25% to 33.33% back-ended capital subsidy for livestock & dairy.\n` +
        `• **PMEGP Scheme:** Up to 35% margin money subsidy in rural areas.\n` +
        `• **NLM (National Livestock Mission):** Up to 50% subsidy for goat & poultry units.\n` +
        `• **PMFME Scheme:** 35% subsidy for micro food processing units.\n\n` +
        `Do you already have land or a shed available?`;
    }
  }

  if (questionType === 'LOAN_QUESTION') {
    const budget = state.budget || 200000;
    const loanAmt = Math.round(budget * 0.85);
    const emi = Math.round((loanAmt * 0.08 / 12) / (1 - Math.pow(1 + 0.08 / 12, -60)));

    if (langMode === 'hi_deva') {
      return `**${formatINR(budget)}** के प्रोजेक्ट पर लगभग **${formatINR(loanAmt)}** तक का बैंक ऋण मिल सकता है:\n\n` +
        `• **ब्याज दर:** 7.5% - 8.5% वार्षिक (KCC पर मात्र 4%)\n` +
        `• **अवधि:** 5 वर्ष (60 महीने)\n` +
        `• **अनुमानित मासिक EMI:** लगभग **${formatINR(emi)}/माह**\n\n` +
        `क्या आपके पास पहले से जमीन या शेड उपलब्ध है?`;
    } else if (langMode === 'te') {
      return `**${formatINR(budget)}** ప్రాజెక్టుకు దాదాపు **${formatINR(loanAmt)}** వరకు బ్యాంకు రుణం లభిస్తుంది:\n\n` +
        `• **వడ్డీ రేటు:** 7.5% - 8.5% వార్షికం\n` +
        `• **నెలవారీ ఈఎమ్‌ఐ:** దాదాపు **${formatINR(emi)}/నెల**\n\n` +
        `మీ వద్ద ముందే సొంత స్థలం లేదా షెడ్ అందుబాటులో ఉందా?`;
    } else {
      return `For a **${formatINR(budget)}** project, you can avail a bank loan of approx. **${formatINR(loanAmt)}**:\n\n` +
        `• **Interest Rate:** 7.5% - 8.5% p.a. (4% on Animal Husbandry KCC)\n` +
        `• **Tenure:** 5 Years\n` +
        `• **Estimated Monthly EMI:** approx. **${formatINR(emi)}/month**\n\n` +
        `Do you already have land or a shed available?`;
    }
  }

  return null;
}

/**
 * Intelligent Dynamic Advisor Agent Engine (Female Persona)
 */
function dynamicAgentReasoning({ message, conversation_state = {}, lang = 'hi' }) {
  const langMode = detectLanguageMode(message, conversation_state.lang || lang);
  const newlyExtracted = extractEntities(message, conversation_state);

  // Merge updated entities into conversation state (NEVER overwrite non-null with null)
  const state = {
    name: newlyExtracted.name || conversation_state.name || null,
    district: newlyExtracted.district || conversation_state.district || null,
    state: newlyExtracted.state || conversation_state.state || null,
    business: newlyExtracted.business || conversation_state.business || null,
    subCategory: newlyExtracted.subCategory || conversation_state.subCategory || null,
    animalType: newlyExtracted.animalType || conversation_state.animalType || null,
    quantity: newlyExtracted.quantity !== undefined && newlyExtracted.quantity !== null
      ? newlyExtracted.quantity 
      : (conversation_state.quantity || null),
    productType: newlyExtracted.productType || conversation_state.productType || null,
    budget: newlyExtracted.budget !== undefined && newlyExtracted.budget !== null 
      ? newlyExtracted.budget 
      : (conversation_state.budget || null),
    landAvailable: newlyExtracted.landAvailable !== undefined && newlyExtracted.landAvailable !== null
      ? newlyExtracted.landAvailable 
      : (conversation_state.landAvailable !== undefined ? conversation_state.landAvailable : null),
    shedAvailable: newlyExtracted.shedAvailable !== undefined && newlyExtracted.shedAvailable !== null
      ? newlyExtracted.shedAvailable 
      : (conversation_state.shedAvailable !== undefined ? conversation_state.shedAvailable : null),
    feedFodder: newlyExtracted.feedFodder || conversation_state.feedFodder || null,
    rawMaterial: newlyExtracted.rawMaterial || conversation_state.rawMaterial || null,
    waterAvailable: newlyExtracted.waterAvailable !== undefined && newlyExtracted.waterAvailable !== null
      ? newlyExtracted.waterAvailable 
      : (conversation_state.waterAvailable !== undefined ? conversation_state.waterAvailable : null),
    electricityAvailable: newlyExtracted.electricityAvailable !== undefined && newlyExtracted.electricityAvailable !== null
      ? newlyExtracted.electricityAvailable 
      : (conversation_state.electricityAvailable !== undefined ? conversation_state.electricityAvailable : null),
    veterinaryAccess: newlyExtracted.veterinaryAccess !== undefined && newlyExtracted.veterinaryAccess !== null
      ? newlyExtracted.veterinaryAccess 
      : (conversation_state.veterinaryAccess !== undefined ? conversation_state.veterinaryAccess : null),
    workspace: newlyExtracted.workspace || conversation_state.workspace || null,
    salesChannel: newlyExtracted.salesChannel || conversation_state.salesChannel || null,
    experience: newlyExtracted.experience || conversation_state.experience || null,
    subsidyNeeded: newlyExtracted.subsidyNeeded !== undefined && newlyExtracted.subsidyNeeded !== null
      ? newlyExtracted.subsidyNeeded 
      : (conversation_state.subsidyNeeded !== undefined ? conversation_state.subsidyNeeded : null),
    goal: newlyExtracted.goal || conversation_state.goal || null,
    lang: langMode
  };

  // Check if user asked an informational question mid-flow
  const detectedQuestion = detectUserQuestion(message);
  if (detectedQuestion) {
    const questionAnswer = answerUserQuestion(detectedQuestion, state, langMode);
    if (questionAnswer) {
      return {
        reply: questionAnswer,
        speak_text: cleanForSpeech(questionAnswer),
        conversation_state: state,
        intent: detectedQuestion
      };
    }
  }

  // Core progression state
  const hasName = Boolean(state.name);
  const hasDistrict = Boolean(state.district);
  const hasBusiness = Boolean(state.business);

  // --------------------------------------------------------------------------
  // STAGE 1: ASK NAME (FEMALE PERSONA: "jaan sakti hoon?")
  // --------------------------------------------------------------------------
  if (!hasName) {
    let reply = '';
    if (langMode === 'hi_deva') {
      reply = `नमस्ते! मैं उद्यमसारथी हूँ, आपकी एआई बिजनेस एडवाइजर। मैं आपको नया व्यवसाय शुरू करने या बढ़ाने में मदद करूँगी।\n\nसबसे पहले, क्या मैं आपका नाम जान सकती हूँ?`;
    } else if (langMode === 'te') {
      reply = `నమస్కారం! నేను ఉద్యమ్‌సారథిని, మీ ఏఐ వ్యాపార సలహాదారుని. వ్యాపారం ప్రారంభించడానికి మరియు వృద్ధి చేయడానికి నేను మీకు సహాయం చేస్తాను.\n\nముందుగా, మీ పేరు ఏమిటి?`;
    } else if (langMode === 'hi_latin') {
      reply = `Namaste! Main UdyamSarthi hoon, aapki AI business advisor. Main aapko business start ya grow karne mein help karungi.\n\nSabse pehle, kya main aapka naam jaan sakti hoon?`;
    } else {
      reply = `Namaste! I am UdyamSarthi, your AI Business Advisor. I will help you start and scale your enterprise.\n\nFirst, may I know your name?`;
    }
    return {
      reply,
      speak_text: cleanForSpeech(reply),
      conversation_state: state,
      intent: 'ASK_NAME'
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 2: ASK DISTRICT (NEVER ASK NAME AGAIN)
  // --------------------------------------------------------------------------
  if (hasName && !hasDistrict) {
    let reply = '';
    if (langMode === 'hi_deva') {
      reply = `बहुत अच्छा ${state.name} जी। आप किस जिले में अपना व्यवसाय शुरू करना चाहते हैं?`;
    } else if (langMode === 'te') {
      reply = `ధన్యవాదాలు ${state.name} గారు. మీరు ఏ జిల్లాలో వ్యాపారం ప్రారంభించాలనుకుంటున్నారు?`;
    } else if (langMode === 'hi_latin') {
      reply = `Bahut achha ${state.name} ji. Aap kis district mein business shuru karna chahte hain?`;
    } else {
      reply = `Thank you, ${state.name}. Which district do you want to start your business in?`;
    }
    return {
      reply,
      speak_text: cleanForSpeech(reply),
      conversation_state: state,
      intent: 'ASK_DISTRICT'
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 3: ASK BUSINESS (NEVER ASK NAME OR DISTRICT AGAIN)
  // --------------------------------------------------------------------------
  if (hasName && hasDistrict && !hasBusiness) {
    let reply = '';
    if (langMode === 'hi_deva') {
      reply = `बहुत बढ़िया। ${state.district} में आप किस प्रकार का व्यवसाय शुरू करना चाहते हैं — जैसे डेयरी फार्मिंग, पोल्ट्री, बकरी पालन, या खाद्य प्रसंस्करण?`;
    } else if (langMode === 'te') {
      reply = `చాలా బాగుంది. ${state.district}లో మీరు ఏ రకమైన వ్యాపారం ప్రారంభించాలనుకుంటున్నారు — పాడి పరిశ్రమ, పౌల్ట్రీ, మేకల పెంపకం లేదా ఆహార ప్రాసెసింగ్?`;
    } else if (langMode === 'hi_latin') {
      reply = `Bahut badhiya. ${state.district} mein aap kis type ka business shuru karna chahte hain — jaise dairy farming, poultry, goat farming, ya food processing?`;
    } else {
      reply = `Great. What type of business would you like to start in ${state.district} — such as dairy farming, poultry farming, goat farming, or food processing?`;
    }
    return {
      reply,
      speak_text: cleanForSpeech(reply),
      conversation_state: state,
      intent: 'ASK_BUSINESS_IDEA'
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 4: DYNAMIC BUSINESS-SPECIFIC ADVISORY (4 RURAL DOMAINS)
  // --------------------------------------------------------------------------

  // ==========================================================================
  // DOMAIN 1: DAIRY FARMING
  // ==========================================================================
  if (state.business === 'Dairy Farming') {
    // A. If user mentioned budget first, acknowledge budget and check land & shed (matching user's exact example)
    if (state.budget && (state.landAvailable === null || state.shedAvailable === null)) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `यह एक बहुत अच्छी शुरुआत है ${state.name} जी। क्या आपके पास पहले से जमीन और पशु शेड उपलब्ध है?`;
      } else if (langMode === 'te') {
        reply = `ఇది మంచి ప్రారంభం ${state.name} గారు. మీ వద్ద ముందే సొంత స్థలం మరియు పశువుల షెడ్ అందుబాటులో ఉందా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Yeh ek acchi shuruaat hai ${state.name} ji. Kya aapke paas pehle se land aur cattle shed available hai?`;
      } else {
        reply = `That's a good start, ${state.name}. Do you already have land and a cattle shed available?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'DAIRY_ASK_LAND_SHED'
      };
    }

    // B. If land & shed are known, or if budget wasn't provided first, ask number of animals
    if (!state.quantity && !state.animalType) {
      let reply = '';
      const shedNote = state.shedAvailable === false 
        ? (langMode === 'hi_deva' ? 'समझ गई, शेड निर्माण की योजना के साथ, ' : (langMode === 'hi_latin' ? 'Samajh gayi, shed banane ke saath, ' : 'Understood. Since you will need to construct a shed, '))
        : '';

      if (langMode === 'hi_deva') {
        reply = `${shedNote}आप डेयरी में कितने पशुओं (गाय या भैंस) से शुरुआत करने की योजना बना रहे हैं?`;
      } else if (langMode === 'te') {
        reply = `మీరు పాడి పరిశ్రమలో ఎన్ని ఆవులు లేదా గేదెలతో ప్రారంభించాలనుకుంటున్నారు?`;
      } else if (langMode === 'hi_latin') {
        reply = `${shedNote}aap dairy farming mein kitne cows ya buffaloes se shuruaat karna chahte hain?`;
      } else {
        reply = `${shedNote}how many cows or buffaloes are you planning to keep?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'DAIRY_ASK_ANIMALS'
      };
    }

    // C. If land & shed still unknown (user told animals first)
    if (state.landAvailable === null || state.shedAvailable === null) {
      const animalTxt = state.quantity ? `${state.quantity} ${state.animalType || 'पशुओं'}` : 'डेयरी फार्मिंग';
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `समझ गई ${state.name} जी। ${animalTxt} के लिए क्या आपके पास पहले से जमीन और पशु शेड उपलब्ध है?`;
      } else if (langMode === 'te') {
        reply = `అర్థమైంది ${state.name} గారు. మీ వద్ద ముందే సొంత స్థలం మరియు పశువుల షెడ్ అందుబాటులో ఉందా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Samajh gayi ${state.name} ji. ${animalTxt} ke liye kya aapke paas pehle se land aur cattle shed available hai?`;
      } else {
        reply = `Understood, ${state.name}. Do you already have land and a cattle shed available for ${animalTxt}?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'DAIRY_ASK_INFRA'
      };
    }

    // D. Investment Budget (if not already known)
    if (!state.budget) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `बहुत अच्छा। इस डेयरी सेटअप के लिए आपका अनुमानित निवेश बजट कितना है?`;
      } else if (langMode === 'te') {
        reply = `చాలా మంచిది. ఈ పాడి పరిశ్రమ కోసం మీ వద్ద అందుబాటులో ఉన్న పెట్టుబడి బడ్జెట్ ఎంత?`;
      } else if (langMode === 'hi_latin') {
        reply = `Bahut achha. Is dairy setup ke liye aapka approximate investment budget kitna hai?`;
      } else {
        reply = `What is your approximate investment budget for this dairy farm?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'DAIRY_ASK_BUDGET'
      };
    }

    // E. Green Fodder & Water
    if (!state.feedFodder) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `पशुओं के लिए क्या आपके पास हरा चारा और स्वच्छ पानी आसानी से उपलब्ध है, या आप बाजार से सूखा चारा व दाना खरीदेंगे?`;
      } else if (langMode === 'te') {
        reply = `పశువులకు పచ్చిగడ్డి సాగు చేయడానికి నీరు మరియు స్థలం అందుబాటులో ఉందా, లేక మార్కెట్ నుండి కొనుగోలు చేస్తారా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Pashuon ke liye kya aapke paas hara chara aur paani easily available hai, ya aap market se feed khareedenge?`;
      } else {
        reply = `Is green fodder and clean water easily available at your location, or will you purchase cattle feed from the market?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'DAIRY_ASK_FODDER'
      };
    }

    // F. Sales Channel
    if (!state.salesChannel) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `दूध की बिक्री आप कहाँ करेंगे — स्थानीय ग्राहकों को, दुकानों/होटलों में, या नजदीकी डेयरी कलेक्शन सेंटर में?`;
      } else if (langMode === 'te') {
        reply = `పాల విక్రయం మీరు స్థానిక కస్టమర్లకు, హోటళ్లకు చేస్తారా లేక డైరీ కలెక్షన్ సెంటర్‌కా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Doodh ki bikri aap kahan karenge — local customers ko, shops/hotels mein, ya nearby dairy collection center mein?`;
      } else {
        reply = `Will you produce milk for local customers, shops, hotels, or dairy collection centers?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'DAIRY_ASK_SALES'
      };
    }

    // G. Comprehensive Personalized Dairy Feasibility Advisory
    const qty = state.quantity || 4;
    const animal = state.animalType || 'भैंस';
    const isBuffalo = /buffalo|भैंस|గేదె/i.test(animal);
    const dailyLitres = qty * (isBuffalo ? 10 : 12);
    const milkRate = isBuffalo ? 55 : 42;
    const grossDaily = dailyLitres * milkRate;
    const grossMonthly = grossDaily * 30;
    const netMonthly = Math.round(grossMonthly * 0.42);
    const budgetFmt = formatINR(state.budget);

    let reply = '';
    if (langMode === 'hi_deva') {
      reply = `शानदार ${state.name} जी! ${state.district} में आपकी डेयरी फार्मिंग योजना तैयार है:\n\n` +
        `• **पशु:** ${qty} ${animal}\n` +
        `• **अनुमानित दैनिक दूध उत्पादन:** लगभग ${dailyLitres} लीटर/दिन\n` +
        `• **निवेश बजट:** ${budgetFmt}\n` +
        `• **अनुमानित मासिक शुद्ध आय:** लगभग ${formatINR(netMonthly)}/माह\n\n` +
        `**उद्यमसारथी वित्तीय व सरकारी सहायता रणनीति:**\n` +
        `1. **नाबार्ड / AHIDF योजना:** इस प्रोजेक्ट पर 25% से 33.33% तक कैपिटल सब्सिडी उपलब्ध है।\n` +
        `2. **पशुपालन KCC:** मात्र 4% रियायती ब्याज दर पर कार्यशील पूंजी ऋण मिल सकता है।\n` +
        `3. ${state.salesChannel === 'dairy collection center' ? 'डेयरी कलेक्शन सेंटर में नियमित भुगतान और फैट आधारित बोनस सुनिश्चित रहेगा।' : 'स्थानीय ग्राहकों व दुकानों को सीधे आपूर्ति से अधिकतम लाभ मार्जिन मिलेगा।'}\n\n` +
        `क्या आप नाबार्ड सब्सिडी के लिए आवेदन प्रक्रिया और आवश्यक दस्तावेजों के बारे में जानना चाहते हैं?`;
    } else if (langMode === 'te') {
      reply = `చాలా బాగుంది ${state.name} గారు! ${state.district}లో మీ పాడి పరిశ్రమ ప్రణాళిక సిద్ధమైంది:\n\n` +
        `• **పశువులు:** ${qty} ${animal}\n` +
        `• **రోజువారీ పాల ఉత్పత్తి:** దాదాపు ${dailyLitres} లీటర్లు/రోజు\n` +
        `• **పెట్టుబడి బడ్జెట్:** ${budgetFmt}\n` +
        `• **అంచనా నికర ఆదాయం:** దాదాపు ${formatINR(netMonthly)}/నెల\n\n` +
        `నాబార్డ్ పథకం ద్వారా 25% నుండి 33.33% సబ్సిడీ మరియు కేవలం 4% వడ్డీతో KCC రుణం లభిస్తుంది. మీరు సబ్సిడీ దరఖాస్తు విధానం గురించి తెలుసుకోవాలనుకుంటున్నారా?`;
    } else if (langMode === 'hi_latin') {
      reply = `Shandar ${state.name} ji! ${state.district} mein aapki dairy farming scheme ready hai:\n\n` +
        `• **Animals:** ${qty} ${animal}\n` +
        `• **Estimated Milk Yield:** approx. ${dailyLitres} Litres/day\n` +
        `• **Budget:** ${budgetFmt}\n` +
        `• **Estimated Net Income:** approx. ${formatINR(netMonthly)}/month\n\n` +
        `**Govt Support & Subsidies:**\n` +
        `1. **NABARD / AHIDF:** 25% se 33.33% capital subsidy uplabdh hai.\n` +
        `2. **KCC Pashupalan:** Concessional 4% interest rate working capital loan.\n\n` +
        `Kya aap NABARD subsidy application process ke bare mein aur detail janna chahte hain?`;
    } else {
      reply = `Excellent, ${state.name}! Your personalized dairy enterprise plan in ${state.district} is structured:\n\n` +
        `• **Livestock Unit:** ${qty} ${animal}\n` +
        `• **Projected Milk Production:** ~${dailyLitres} Litres/day\n` +
        `• **Budget:** ${budgetFmt}\n` +
        `• **Projected Net Income:** approx. ${formatINR(netMonthly)}/month\n\n` +
        `**Financial Advisory & Government Incentives:**\n` +
        `1. **NABARD / AHIDF Scheme:** 25% to 33.33% back-ended capital subsidy.\n` +
        `2. **Animal Husbandry KCC:** Working capital loans at 4% concessional interest rate.\n\n` +
        `Would you like guidance on applying for the NABARD subsidy and bank loan documentation?`;
    }
    return {
      reply,
      speak_text: cleanForSpeech(reply),
      conversation_state: state,
      intent: 'DAIRY_COMPLETE_ADVICE'
    };
  }

  // ==========================================================================
  // DOMAIN 2: POULTRY FARMING
  // ==========================================================================
  if (state.business === 'Poultry Farming') {
    // 1. Broiler vs Layer
    if (!state.subCategory) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `पोल्ट्री फार्मिंग बहुत लाभदायक व्यवसाय है। आप ब्रायलर (मांस उत्पादन) शुरू करना चाहते हैं या लेयर (अंडा उत्पादन)?`;
      } else if (langMode === 'te') {
        reply = `పౌల్ట్రీ ఫార్మింగ్ చాలా లాభదాయకమైనది. మీరు బ్రాయిలర్ (చికెన్ మాంసం) ప్రారంభించాలనుకుంటున్నారా లేక లేయర్ (గుడ్ల ఉత్పత్తి)నా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Poultry farming bahut faydemand business hai. Aap broiler (chicken meat) shuru karna chahte hain ya layer (egg production)?`;
      } else {
        reply = `Poultry farming is a high-growth business. Do you want to start broiler or layer poultry farming?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'POULTRY_ASK_TYPE'
      };
    }

    // 2. Quantity (Bird Count)
    if (!state.quantity) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `बहुत बढ़िया। आप शुरुआत में कितने पक्षियों (जैसे 500 या 1000 birds) से फार्म शुरू करने की योजना बना रहे हैं?`;
      } else if (langMode === 'te') {
        reply = `చాలా మంచిది. మీరు బ్యాచ్‌లో ఎన్ని కోళ్లతో (ఉదాహరణకు 500 లేదా 1000 birds) ప్రారంభించాలనుకుంటున్నారు?`;
      } else if (langMode === 'hi_latin') {
        reply = `Bahut badhiya. Aap batch mein kitne birds (jaise 500 ya 1000 birds) rakhne ki yojana bana rahe hain?`;
      } else {
        reply = `Great! How many birds are you planning to keep in your batch (e.g. 500, 1000, or 2000 birds)?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'POULTRY_ASK_BIRDS'
      };
    }

    // 3. Shed & Electricity/Water
    if (state.shedAvailable === null || state.landAvailable === null) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `क्या आपके पास पोल्ट्री शेड, जमीन और बिजली-पानी की उचित व्यवस्था उपलब्ध है?`;
      } else if (langMode === 'te') {
        reply = `మీ వద్ద పౌల్ట్రీ షెడ్ మరియు నిరంతర విద్యుత్, తాగునీటి సదుపాయం అందుబాటులో ఉందా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Kya aapke paas poultry shed, zameen aur electricity-water ki arrangement available hai?`;
      } else {
        reply = `Do you already have a poultry shed and land with reliable electricity and clean water?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'POULTRY_ASK_SHED'
      };
    }

    // 4. Budget
    if (!state.budget) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `इस पोल्ट्री सेटअप के लिए आपका अनुमानित निवेश बजट कितना है?`;
      } else if (langMode === 'te') {
        reply = `ఈ పౌల్ట్రీ యూనిట్ కోసం మీ వద్ద ఉన్న పెట్టుబడి బడ్జెట్ ఎంత?`;
      } else if (langMode === 'hi_latin') {
        reply = `Is poultry setup ke liye aapka approximate investment budget kitna hai?`;
      } else {
        reply = `What is your approximate investment budget for this poultry farm?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'POULTRY_ASK_BUDGET'
      };
    }

    // 5. Sales Channel / Contract
    if (!state.salesChannel) {
      let reply = '';
      if (state.subCategory === 'Broiler') {
        if (langMode === 'hi_deva') {
          reply = `क्या आप तैयार चिकन सीधे स्थानीय दुकानों/होलसेलरों को बेचेंगे, या किसी कंपनी के साथ कॉन्ट्रैक्ट फार्मिंग करेंगे?`;
        } else {
          reply = `Will you sell directly to local butcher shops and wholesalers, or partner with a company for contract poultry farming?`;
        }
      } else {
        if (langMode === 'hi_deva') {
          reply = `अंडों की बिक्री आप स्थानीय किराना दुकानों व बेकरियों में करेंगे या होलसेल व्यापारियों को?`;
        } else {
          reply = `Where will you sell the eggs — to local bakeries/shops or wholesale egg traders?`;
        }
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'POULTRY_ASK_MARKET'
      };
    }

    // 6. Comprehensive Poultry Advisory
    const birds = state.quantity || 1000;
    const budgetFmt = formatINR(state.budget);
    const estProfitPerBatch = state.subCategory === 'Broiler' ? birds * 32 : Math.round(birds * 25);

    let reply = '';
    if (langMode === 'hi_deva') {
      reply = `बहुत बढ़िया ${state.name} जी! ${state.district} में ${birds} पक्षियों के साथ ${state.subCategory} पोल्ट्री फार्मिंग योजना:\n\n` +
        `• **यूनिट क्षमता:** ${birds} पक्षी (${state.subCategory})\n` +
        `• **निवेश बजट:** ${budgetFmt}\n` +
        `• **अनुमानित लाभ प्रति चक्र:** लगभग ${formatINR(estProfitPerBatch)} (35-42 दिन का चक्र)\n\n` +
        `**उद्यमसारथी वित्तीय व सरकारी सहायता रणनीति:**\n` +
        `1. **PMEGP योजना:** ग्रामीण क्षेत्र में पोल्ट्री फार्मिंग के लिए 25% से 35% तक सरकारी सब्सिडी मिलती है।\n` +
        `2. ${state.salesChannel === 'contract farming' ? 'कॉन्ट्रैक्ट फार्मिंग में फीड व चूजों की लागत कंपनी वहन करती है, जिससे बाजार मूल्य जोखिम शून्य हो जाता है।' : 'स्वतंत्र रूप से थोक मंडी व स्थानीय दुकानों में बिक्री से प्रति पक्षी ₹30-₹35 का शुद्ध मार्जिन प्राप्त होता है।'}\n\n` +
        `क्या आप पोल्ट्री शेड निर्माण मानक और बायो-सिक्योरिटी टीकाकरण के बारे में जानना चाहते हैं?`;
    } else {
      reply = `Excellent, ${state.name}! Your ${state.subCategory} poultry enterprise plan in ${state.district} is structured:\n\n` +
        `• **Unit Capacity:** ${birds} Birds (${state.subCategory})\n` +
        `• **Budget:** ${budgetFmt}\n` +
        `• **Projected Net Margin:** approx. ${formatINR(estProfitPerBatch)} per batch (35-42 day cycle)\n\n` +
        `**Financial Advisory & Incentives:**\n` +
        `1. **PMEGP Scheme:** Eligible for 25% to 35% margin money subsidy in rural areas.\n` +
        `2. **Working Capital:** Concessional poultry loans available through rural commercial banks.\n\n` +
        `Would you like guidance on poultry shed biosecurity standards or PMEGP loan application?`;
    }
    return {
      reply,
      speak_text: cleanForSpeech(reply),
      conversation_state: state,
      intent: 'POULTRY_COMPLETE_ADVICE'
    };
  }

  // ==========================================================================
  // DOMAIN 3: GOAT FARMING
  // ==========================================================================
  if (state.business === 'Goat Farming') {
    // 1. Meat vs Breeding vs Both
    if (!state.subCategory) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `बकरी पालन कम लागत में बेहतरीन मुनाफा देता है। आप इसे मुख्य रूप से मांस बिक्री (meat) के लिए करना चाहते हैं, ब्रीडिंग (नस्ल सुधार) के लिए, या दोनों के लिए?`;
      } else if (langMode === 'te') {
        reply = `మేకల పెంపకం తక్కువ ఖర్చుతో మంచి లాభాలనిస్తుంది. మీరు దీన్ని మాంసం విక్రయం కోసమా, బ్రీడింగ్ కోసమా లేక రెండింటి కోసమా చేయాలనుకుంటున్నారు?`;
      } else if (langMode === 'hi_latin') {
        reply = `Goat farming kam lagat mein accha munafa deta hai. Aap meat production ke liye karna chahte hain, breeding ke liye, ya dono ke liye?`;
      } else {
        reply = `Goat farming offers strong returns with low initial capital. Are you planning goat farming for meat, breeding, or both?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'GOAT_ASK_TYPE'
      };
    }

    // 2. Quantity
    if (!state.quantity) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `बहुत बढ़िया। आप शुरुआत में कितनी बकरियों से शुरू करना चाहते हैं — जैसे मानक 10+1 यूनिट (10 बकरी + 1 बकरा) या 20 बकरियां?`;
      } else if (langMode === 'te') {
        reply = `చాలా మంచిది. మీరు ఎన్ని మేకలతో ప్రారంభించాలనుకుంటున్నారు — ఉదాహరణకు 10+1 యూనిట్ లేదా 20 మేకలు?`;
      } else if (langMode === 'hi_latin') {
        reply = `Bahut badhiya. Aap kitni goats se shuru karna chahte hain — jaise standard 10+1 unit ya 20 goats?`;
      } else {
        reply = `How many goats are you planning to start with — for example, a standard 10+1 unit (10 does + 1 buck) or 20 goats?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'GOAT_ASK_QUANTITY'
      };
    }

    // 3. Shed & Land / Grazing
    if (state.shedAvailable === null || state.landAvailable === null) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `क्या आपके पास बकरियों के लिए शेड और जमीन उपलब्ध है, और आप चराई (grazing) कराएंगे या स्टॉल-फीडिंग (शेड में चारा खिलाना) करेंगे?`;
      } else if (langMode === 'te') {
        reply = `మీ వద్ద మేకల షెడ్ మరియు స్థలం అందుబాటులో ఉందా, మరియు మీరు బయట మేపుతారా లేక స్టాల్ ఫీడింగ్ చేస్తారా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Kya aapke paas goat shed aur land available hai, aur aap grazing karayenge ya stall feeding?`;
      } else {
        reply = `Do you have land and a goat shed available, and will you rely on open grazing or stall-fed management?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'GOAT_ASK_SHED'
      };
    }

    // 4. Budget
    if (!state.budget) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `बकरियों की खरीद व शेड निर्माण के लिए आपका अनुमानित निवेश बजट कितना है?`;
      } else if (langMode === 'te') {
        reply = `మేకల కొనుగోలు మరియు షెడ్ కోసం మీ అంచనా బడ్జెట్ ఎంత?`;
      } else if (langMode === 'hi_latin') {
        reply = `Goat purchase aur shed setup ke liye aapka approximate investment budget kitna hai?`;
      } else {
        reply = `What is your approximate investment budget for purchasing the goats and setting up the shed?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'GOAT_ASK_BUDGET'
      };
    }

    // 5. Veterinary Access
    if (state.veterinaryAccess === null) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `क्या आपके क्षेत्र में टीकाकरण व प्राथमिक उपचार के लिए पशु चिकित्सक (veterinary doctor) या पशु अस्पताल उपलब्ध है?`;
      } else {
        reply = `Do you have access to veterinary services or an animal hospital nearby in your block?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'GOAT_ASK_VET'
      };
    }

    // 6. Comprehensive Goat Advisory
    const qty = state.quantity || 11;
    const budgetFmt = formatINR(state.budget);
    const annualProfit = Math.round(qty * 8500);

    let reply = '';
    if (langMode === 'hi_deva') {
      reply = `शानदार ${state.name} जी! ${state.district} में ${qty} बकरियों के साथ ${state.subCategory || 'मांस व ब्रीडिंग'} योजना तैयार है:\n\n` +
        `• **यूनिट आकार:** ${qty} बकरियां (अनुशंसित नस्ल: सिरोही या उस्मानाबादी)\n` +
        `• **निवेश बजट:** ${budgetFmt}\n` +
        `• **अनुमानित वार्षिक शुद्ध लाभ:** लगभग ${formatINR(annualProfit)}/वर्ष (बच्चे व मांस बिक्री)\n\n` +
        `**उद्यमसारथी वित्तीय व सरकारी सहायता रणनीति:**\n` +
        `1. **राष्ट्रीय पशुधन मिशन (NLM):** 100+ बकरी यूनिट पर 50% तक कैपिटल सब्सिडी मिलती है।\n` +
        `2. **पशुपालन KCC ऋण:** 4% की रियायती ब्याज दर पर बैंक लोन उपलब्ध है।\n` +
        `3. सिरोही और उस्मानाबादी नस्लें स्थानीय मौसम में रोग प्रतिरोधी हैं और तेजी से वजन बढ़ाती हैं।\n\n` +
        `क्या आप बकरियों के टीकाकरण चार्ट और स्थानीय पशु हाट में बिक्री के बारे में जानना चाहते हैं?`;
    } else {
      reply = `Excellent, ${state.name}! Your goat farming enterprise plan in ${state.district} is structured:\n\n` +
        `• **Unit Size:** ${qty} Goats (Recommended Breeds: Sirohi / Osmanabadi)\n` +
        `• **Budget:** ${budgetFmt}\n` +
        `• **Projected Annual Net Income:** approx. ${formatINR(annualProfit)}/year\n\n` +
        `**Government Schemes & Advisory:**\n` +
        `1. **National Livestock Mission (NLM):** Up to 50% capital subsidy on commercial units.\n` +
        `2. **Animal Husbandry KCC:** Concessional working capital at 4% interest.\n\n` +
        `Would you like guidance on vaccination schedules and goat procurement markets?`;
    }
    return {
      reply,
      speak_text: cleanForSpeech(reply),
      conversation_state: state,
      intent: 'GOAT_COMPLETE_ADVICE'
    };
  }

  // ==========================================================================
  // DOMAIN 4: FOOD PROCESSING / SMALL FOOD BUSINESS
  // ==========================================================================
  if (state.business === 'Food Processing') {
    // 1. Specific Product Type
    if (!state.productType) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `खाद्य प्रसंस्करण में बहुत संभावनाएं हैं। आप किस प्रकार का खाद्य उत्पाद बनाना चाहते हैं — जैसे अचार (pickles), मसाले (spices), पापड़, आटा चक्की, नमकीन/चिप्स, या कुछ और?`;
      } else if (langMode === 'te') {
        reply = `ఆహార ప్రాసెసింగ్‌లో అద్భుతమైన అవకాశాలు ఉన్నాయి. మీరు ఏ ఉత్పత్తి తయారు చేయాలనుకుంటున్నారు — ఊరగాయలు (pickles), మసాలాలు, పిండి, అప్పడాలు, చిప్స్ లేదా స్వీట్లు?`;
      } else if (langMode === 'hi_latin') {
        reply = `Food processing mein bahut acchi demand hai. Aap kaunsa product banana chahte hain — jaise pickles (achar), spices, papad, chakki flour, ya snacks/chips?`;
      } else {
        reply = `Food processing is a high-demand business. What type of food product do you want to make — such as pickles, spices, flour, snacks, papad, chips, or sweets?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'FOOD_ASK_PRODUCT'
      };
    }

    // 2. Specific Variety (if generic pickles)
    if (state.productType === 'Pickles') {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `शानदार! आप किस प्रकार का अचार बनाने की योजना बना रहे हैं — जैसे आम का अचार, नींबू, मिर्च, या मिक्स अचार?`;
      } else if (langMode === 'te') {
        reply = `చాలా బాగుంది! మీరు ఏ రకమైన ఊరగాయ తయారు చేయాలనుకుంటున్నారు — మామిడికాయ, నిమ్మకాయ, పచ్చిమిర్చి లేదా మిక్స్డ్?`;
      } else if (langMode === 'hi_latin') {
        reply = `Shandar! Aap kis type ka achar banana chahte hain — jaise mango, lemon, chilli, ya mix achar?`;
      } else {
        reply = `Great! What type of pickle are you planning to make, such as mango, lemon, chilli, or something else?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'FOOD_ASK_PICKLE_TYPE'
      };
    }

    // 3. Raw Materials Availability
    if (!state.rawMaterial) {
      const pName = state.productType;
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `बहुत बढ़िया। क्या आपको ${pName} के लिए कच्चा माल ${state.district} में स्थानीय स्तर पर आसानी से मिल जाता है, या आप बाहर से मंगाएंगे?`;
      } else if (langMode === 'te') {
        reply = `చాలా మంచిది. మీకు ${pName} తయారీకి ముడి పదార్థాలు స్థానికంగా సులభంగా లభిస్తాయా, లేక బయటి నుండి తెప్పించుకుంటారా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Bahut badhiya. Kya aapko ${pName} ke liye raw material locally mil jata hai ya bahar se purchase karenge?`;
      } else {
        reply = `Excellent. Do you already have access to raw materials for ${pName} locally in ${state.district}, or will you purchase them from suppliers?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'FOOD_ASK_RAW_MATERIAL'
      };
    }

    // 4. Investment Budget
    if (!state.budget) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `कच्चे माल, पैकेजिंग और मशीनरी के लिए आपका अनुमानित निवेश बजट कितना है?`;
      } else if (langMode === 'te') {
        reply = `ముడి పదార్థాలు మరియు ప్యాకేజింగ్ యంత్రాల కోసం మీ అంచనా బడ్జెట్ ఎంత?`;
      } else if (langMode === 'hi_latin') {
        reply = `Raw material aur packaging machine ke liye aapka approximate investment budget kitna hai?`;
      } else {
        reply = `What is your approximate investment budget for ingredients and packaging equipment?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'FOOD_ASK_BUDGET'
      };
    }

    // 5. Workspace (Home vs Commercial)
    if (!state.workspace) {
      let reply = '';
      if (langMode === 'hi_deva') {
        reply = `क्या आप इस उत्पाद का निर्माण शुरुआत में घर से करना चाहते हैं या एक अलग कमर्शियल वर्कशॉप में?`;
      } else if (langMode === 'te') {
        reply = `మీరు దీన్ని ఇంట్లో ప్రారంభించాలనుకుంటున్నారా లేక ప్రత్యేక యూనిట్ ఏర్పాటు చేస్తారా?`;
      } else if (langMode === 'hi_latin') {
        reply = `Kya aap ise shuruaat mein ghar se start karna chahte hain ya alag commercial workshop mein?`;
      } else {
        reply = `Do you want to start from home or establish a separate commercial unit?`;
      }
      return {
        reply,
        speak_text: cleanForSpeech(reply),
        conversation_state: state,
        intent: 'FOOD_ASK_WORKSPACE'
      };
    }

    // 6. Comprehensive Food Processing Advisory
    const budgetFmt = formatINR(state.budget);
    const estMonthlyProfit = Math.round(state.budget * 0.28);

    let reply = '';
    if (langMode === 'hi_deva') {
      reply = `बधाई हो ${state.name} जी! ${state.district} में **${state.productType}** निर्माण इकाई की योजना:\n\n` +
        `• **उत्पाद:** ${state.productType} (कच्चा माल: ${state.rawMaterial === 'locally available' ? 'स्थानीय उपलब्धता' : 'सप्लायर्स'})\n` +
        `• **कार्यस्थल:** ${state.workspace === 'home' ? 'घरेलू स्तर' : 'कमर्शियल वर्कशॉप'}\n` +
        `• **निवेश बजट:** ${budgetFmt}\n` +
        `• **अनुमानित मासिक शुद्ध लाभ:** लगभग ${formatINR(estMonthlyProfit)}/माह (35%-40% ग्रॉस मार्जिन)\n\n` +
        `**उद्यमसारथी लाइसेंसिंग व सरकारी सब्सिडी गाइड:**\n` +
        `1. **PMFME योजना:** सूक्ष्म खाद्य उद्यमों के लिए 35% क्रेडिट-लिंक्ड पूंजी सब्सिडी (अधिकतम ₹10 लाख) उपलब्ध है।\n` +
        `2. **FSSAI रजिस्ट्रेशन:** पैकेज्ड फूड की बिक्री के लिए FSSAI बेसिक रजिस्ट्रेशन (मात्र ₹100/वर्ष) ऑनलाइन अनिवार्य है।\n` +
        `3. आकर्षक पाउच पैकेजिंग और FSSAI नंबर से आप सीधे नजदीकी किराना दुकानों और सुपरमार्केट में आपूर्ति कर सकते हैं।\n\n` +
        `क्या आप PMFME सब्सिडी के आवेदन या FSSAI लाइसेंस पंजीकरण के बारे में जानना चाहते हैं?`;
    } else {
      reply = `Congratulations, ${state.name}! Your **${state.productType}** processing plan in ${state.district} is structured:\n\n` +
        `• **Product Line:** ${state.productType} (Sourced: ${state.rawMaterial})\n` +
        `• **Setup:** ${state.workspace === 'home' ? 'Home-based unit' : 'Dedicated commercial workshop'}\n` +
        `• **Budget:** ${budgetFmt}\n` +
        `• **Projected Net Margin:** approx. ${formatINR(estMonthlyProfit)}/month (35%-40% gross margins)\n\n` +
        `**Government Schemes & Licensing Advisory:**\n` +
        `1. **PMFME Scheme:** 35% capital subsidy up to ₹10 Lakhs for micro food processors.\n` +
        `2. **FSSAI Registration:** Mandatory basic food license (₹100/yr online) + Udyam MSME certification.\n\n` +
        `Would you like step-by-step guidance on PMFME subsidy application or FSSAI registration?`;
    }
    return {
      reply,
      speak_text: cleanForSpeech(reply),
      conversation_state: state,
      intent: 'FOOD_COMPLETE_ADVICE'
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 5: GENERAL DEFAULT FALLBACK
  // --------------------------------------------------------------------------
  let reply = '';
  if (langMode === 'hi_deva') {
    reply = `${state.name} जी, ${state.district} में आपके ${state.business || 'व्यवसाय'} के लिए योजना तैयार हो रही है। आप इसके बारे में आगे क्या जानना चाहते हैं?`;
  } else {
    reply = `${state.name}, your enterprise plan in ${state.district} is progressing well. What aspect would you like to explore next?`;
  }

  return {
    reply,
    speak_text: cleanForSpeech(reply),
    conversation_state: state,
    intent: 'BUSINESS_ADVICE'
  };
}

/**
 * Main Dynamic Advisory Generator
 */
exports.generateDynamicAdvisory = async function({ message, conversation_state = {}, history = [], profile = {}, lang = 'hi' }) {
  const langMode = detectLanguageMode(message, conversation_state.lang || lang);
  return dynamicAgentReasoning({ message, conversation_state, lang: langMode });
};
