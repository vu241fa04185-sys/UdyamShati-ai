import re
from typing import Dict, Any, List

class MultilingualParser:
    def parse_user_prompt(self, text: str) -> Dict[str, Any]:
        """
        Parses free-form colloquial text in Hindi, Hinglish, Telugu, or English
        to extract structured entrepreneur parameters and intent.
        """
        text_lower = text.lower().strip()

        # 1. Detect Language
        has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
        has_telugu = any('\u0C00' <= char <= '\u0C7F' for char in text)

        if has_telugu or any(w in text_lower for w in ["రూపాయలు", "వ్యాపారం", "సాగు", "నా దగ్గర", "ఎక్కడ"]):
            detected_lang = "te"
        elif has_devanagari or any(w in text_lower for w in [
            "paas", "rupaye", "lakh", "karo", "kaunsa", "mere", "hai", "kheti",
            "kya", "bata", "sakte", "hain", "mera", "meri", "naam", "gaon", "shehar"
        ]):
            detected_lang = "hi"
        else:
            detected_lang = "en"

        # 2. Extract Capital / Amount
        extracted_capital = None
        lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख|లక్ష)', text_lower)
        if lakh_match:
            extracted_capital = float(lakh_match.group(1)) * 100000.0
        else:
            word_lakh_match = re.search(r'(ek|do|teen|chaar|panch|ek\s*lakh|teen\s*lakh|do\s*lakh)\s*(?:lakh|lac)', text_lower)
            word_map = {"ek": 100000.0, "do": 200000.0, "teen": 300000.0, "chaar": 400000.0, "panch": 500000.0}
            if word_lakh_match:
                key = word_lakh_match.group(1).split()[0]
                extracted_capital = word_map.get(key, 300000.0)
            else:
                k_match = re.search(r'(\d+)\s*(?:k|hazar|हजार|వేలు)', text_lower)
                if k_match:
                    extracted_capital = float(k_match.group(1)) * 1000.0
                else:
                    num_match = re.search(r'(?:₹|rs\.?|inr)?\s*(\d{4,8})', text_lower)
                    # Check if number is not a pincode
                    if num_match and len(num_match.group(1)) != 6:
                        extracted_capital = float(num_match.group(1))

        # 3. Extract Land Acres
        extracted_land = None
        land_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:acre|acres|ekad|एकड़|ఎకరాలు)', text_lower)
        if land_match:
            extracted_land = float(land_match.group(1))

        # 4. Extract Name if mentioned (e.g. "Mera naam Ramesh Patil hai", "My name is John")
        extracted_name = None
        name_match = re.search(r'(?:mera naam|my name is|na peru|naam|main hoon|i am)\s+([a-zA-Z\u0900-\u097F]+(?:\s+[a-zA-Z\u0900-\u097F]+)?)', text_lower)
        if name_match:
            raw_n = name_match.group(1).strip()
            # Clean stop words
            raw_n = re.sub(r'\b(hai|hoon|kisan|farmer|ji)\b', '', raw_n).strip()
            if len(raw_n) >= 2:
                extracted_name = " ".join([w.capitalize() for w in raw_n.split()])

        # 5. Extract Social Category (for MoSJE Scheme Matching)
        extracted_category = None
        if re.search(r'\b(obc|other backward|ओबीसी|पिछड़ा|ఓబీసీ)\b', text_lower):
            extracted_category = "OBC"
        elif re.search(r'\b(sc|scheduled caste|अनुसूचित जाति|ఎస్సీ)\b', text_lower):
            extracted_category = "SC"
        elif re.search(r'\b(st|scheduled tribe|अनुसूचित जनजाति|आदिवासी|ఎస్టీ)\b', text_lower):
            extracted_category = "ST"
        elif re.search(r'\b(dnt|denotified|de-notified|घुमंतू|विमुक्त)\b', text_lower):
            extracted_category = "DNT"
        elif re.search(r'\b(general|सामान्य|open|सामान्य वर्ग)\b', text_lower):
            extracted_category = "GENERAL"

        # 6. Extract Infrastructure / Utilities
        has_water = bool(re.search(r'\b(water|pani|borewell|bore|kuan|पानी|जल|నీరు|బోర్)\b', text_lower))
        has_power = bool(re.search(r'\b(electricity|bijli|power|light|3 phase|बिजली|కరెంట్)\b', text_lower))
        has_vehicle = bool(re.search(r'\b(vehicle|gaadi|tempo|van|tractor|गाड़ी|వాహనం)\b', text_lower))
        has_shop = bool(re.search(r'\b(shop|shed|dukan|godown|building|दुकान|షెడ్)\b', text_lower))

        # 7. Extract Skills / Experience
        detected_skills = []
        skill_keywords = {
            "farming": ["farming", "kheti", "kisan", "krishi", "agriculture", "खेती", "సాగు"],
            "dairy": ["dairy", "doodh", "cow", "buffalo", "milk", "डेयरी", "పాల", "పాడి"],
            "poultry": ["poultry", "murgi", "broiler", "chicken", "पोल्ट्री", "కోళ్ల"],
            "machinery": ["tractor", "machine", "mechanic", "chakkki", "mill", "मशीन", "యంత్ర"],
            "food_processing": ["food processing", "masala", "atta", "spice", "मसाला", "आटा"],
            "retail": ["dukan", "shop", "kirana", "store", "business", "दुकान", "కిరాణా"],
            "goat_farming": ["bakri", "goat", "बकरी", "మేకల"]
        }

        for skill, kw_list in skill_keywords.items():
            if any(kw in text_lower for kw in kw_list):
                detected_skills.append(skill)

        # 8. Extract Location mentions
        detected_location = None
        locations = {
            "Nashik": ["nashik", "pimpalgaon", "niphad", "नासिक"],
            "Krishna": ["krishna", "kankipadu", "vijayawada", "కృష్ణా", "విజయవాడ"],
            "Varanasi": ["varanasi", "kashi", "chaubeypur", "वाराणसी", "बनारस"],
            "Anand": ["anand", "gujarat", "mogri", "आणंद"],
            "Pune": ["pune", "पुणे"],
            "Lucknow": ["lucknow", "लखनऊ"],
            "Hyderabad": ["hyderabad", "హైదరాబాద్"]
        }
        for loc_name, kw_list in locations.items():
            if any(kw in text_lower for kw in kw_list):
                detected_location = loc_name
                break

        # 7. High-Precision Intent Detection
        # Check specific conversational questions FIRST:
        
        # A. Location Queries
        is_location_query = any(phrase in text_lower for phrase in [
            "location bata", "current location", "kahan hoon", "kahan pe", "kaha pe", 
            "where am i", "mera gaon", "mera location", "meri location", "where is my", 
            "location kya hai", "location kahan", "ఏ ప్రాంతం", "లొకేషన్"
        ])

        # B. Profile / Identity Queries
        is_profile_query = any(phrase in text_lower for phrase in [
            "mera naam kya", "meri capital", "mera paisa", "meri zameen", "mera profile", 
            "who am i", "my profile", "my capital", "my land", "నా వివరాలు"
        ])

        # C. Scheme / Government Queries
        is_scheme_query = any(phrase in text_lower for phrase in [
            "scheme", "yojana", "subsidy", "sarkari", "योजना", "పథకం", "nbcfdc", "nsfdc", "pmegp", "mudra"
        ])

        # D. Financial / EMI Queries
        is_finance_query = any(phrase in text_lower for phrase in [
            "emi", "loan", "rin", "karz", "किस्त", "రుణం", "dscr", "interest", "byaj", "ब्याज", "munafa", "profit"
        ])

        # E. Map / Catchment Queries
        is_map_query = any(phrase in text_lower for phrase in [
            "map", "naksha", "radius", "competitor", "mandi", "दूरी", "नक्शा", "మ్యాప్"
        ])

        if is_location_query:
            detected_intent = "LOCATION_QUERY"
        elif is_profile_query:
            detected_intent = "PROFILE_QUERY"
        elif is_scheme_query:
            detected_intent = "SCHEME_SEARCH"
        elif is_finance_query:
            detected_intent = "FINANCIAL_ANALYSIS"
        elif is_map_query:
            detected_intent = "MARKET_ANALYSIS"
        elif extracted_capital or extracted_land or detected_skills or any(w in text_lower for w in ["business", "start", "suggest", "karna hai", "kaunsa", "batao", "idea"]):
            detected_intent = "BUSINESS_RECOMMENDATION"
        else:
            detected_intent = "GENERAL_CONVERSATION"

        return {
            "raw_input": text,
            "detected_language": detected_lang,
            "intent": detected_intent,
            "entities": {
                "name": extracted_name,
                "capital": extracted_capital,
                "land_acres": extracted_land,
                "skills": detected_skills,
                "location_hint": detected_location,
                "social_category": extracted_category,
                "has_water_source": has_water if has_water else None,
                "has_electricity": has_power if has_power else None,
                "has_vehicle": has_vehicle if has_vehicle else None,
                "has_shop_building": has_shop if has_shop else None
            }
        }
