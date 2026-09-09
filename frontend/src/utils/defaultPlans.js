// 4 Default Reference Business Opportunities (Demonstration / Example Plans)
// Classified internally with type: "default", isDefault: true, source: "default"

export const defaultBusinessPlans = [
  {
    id: "default_custom_hiring",
    userId: "system",
    type: "default",
    isDefault: true,
    source: "default",
    businessName: "Custom Hiring Centre / Farm Machinery Rental",
    category: "FARM_MACHINERY",
    category_code: "CUSTOM_HIRING_CENTRE",
    description: "Tractor, rotavator, power tiller & harvester rental hub for smallholder cluster.",
    description_hi: "छोटे किसानों के समूह के लिए ट्रैक्टर, रोटावेटर और पावर टिलर किराया केंद्र।",
    description_te: "చిన్న రైతు సమూహాల కోసం ట్రాక్టర్, రోటావేటర్ & పవర్ టిల్లర్ అద్దె కేంద్రం.",
    location: {
      village: "Pimpalgaon Baswant",
      mandal: "Niphad",
      district: "Nashik",
      state: "Maharashtra",
      latitude: 20.1706,
      longitude: 73.9840
    },
    capital: 300000,
    requiredInvestment: 500000,
    suitabilityScore: 92.4,
    confidenceScore: 94.0,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    why_recommended_en: "High hyper-local demand index (92/100) with strong farm mechanization deficit. Project requires ₹50,000 own margin with ₹4,50,000 concessional loan via NBCFDC Schemes. Projected DSCR is a robust 2.15x.",
    why_recommended_hi: "स्थानीय मांग सूचकांक (92/100) बहुत मजबूत है और कृषि मशीनीकरण का बड़ा अंतर है। परियोजना में ₹50,000 स्वयं का अंशदान आवश्यक है। ऋण शोधन अनुपात (DSCR) 2.15x है।",
    why_recommended_te: "అధిక స్థానిక డిమాండ్ సూచిక (92/100) తో యంత్రాల కొరత ఉంది. రూ. 50,000 సొంత మార్జిన్ మరియు NBCFDC పథకం ద్వారా రూ. 4,50,000 రుణం అవసరం. DSCR 2.15x.",
    rawRecommendation: {
      category_code: "CUSTOM_HIRING_CENTRE",
      name_en: "Custom Hiring Centre (Farm Machinery Rental)",
      name_hi: "कस्टम हायरिंग सेंटर (कृषि उपकरण किराया केंद्र)",
      name_te: "కస్టమ్ హైరింగ్ సెంటర్ (వ్యవసాయ పరికరాల అద్దె)",
      sector: "FARM_MACHINERY",
      description: "Tractor, rotavator, power tiller & harvester rental hub for smallholder cluster.",
      overall_suitability_score: 92.4,
      confidence_score: 94.0,
      sub_scores: {
        market_opportunity: 94.0,
        financial_feasibility: 92.0,
        skill_compatibility: 90.0,
        profitability: 95.0,
        competition: 88.0,
        risk_safety: 93.0
      },
      financials: {
        project_cost: 500000,
        own_contribution_required: 50000,
        loan_amount: 450000,
        interest_rate_pct: 8.0,
        tenure_years: 7,
        moratorium_months: 6,
        monthly_emi: 7018,
        projected_monthly_revenue: 85000,
        projected_monthly_expense: 42000,
        projected_monthly_operating_profit: 43000,
        monthly_net_surplus_after_emi: 35982,
        dscr: 2.15,
        financial_viability: "HIGH_VIABILITY",
        break_even_monthly_revenue: 48000,
        projections: [
          { yearNum: 1, revenue: 1020000, expenses: 504000 },
          { yearNum: 2, revenue: 1071000, expenses: 524160 },
          { yearNum: 3, revenue: 1124550, expenses: 545126 },
          { yearNum: 4, revenue: 1180777, expenses: 566931 },
          { yearNum: 5, revenue: 1239816, expenses: 589608 }
        ]
      },
      market: {
        market_opportunity_score: 94.0,
        demand_index: 92,
        demand_supply_gap: "HIGH_DEFICIT",
        competitor_count: 1,
        reference_village: "Pimpalgaon Baswant",
        analysis_radius_km: 10.0,
        data_confidence_pct: 94.0
      },
      risks: {
        risk_safety_score: 93.0,
        overall_severity: "LOW",
        top_risks: [
          { dimension: "Diesel Inflation", severity: "LOW", mitigation: "Bulk fuel purchase agreement" }
        ]
      },
      stress_test: {
        survival_status: "SURVIVES_COMFORTABLY",
        stressed_dscr: 1.72
      },
      top_scheme: {
        title_en: "NBCFDC General Term Loan Scheme (Farm Machinery)",
        title_hi: "एनबीसीएफडीसी सामान्य अवधि ऋण योजना (कृषि उपकरण)",
        title_te: "NBCFDC టర్మ్ లోన్ పథకం (వ్యవసాయ పరికరాలు)",
        organization: "National Backward Classes Finance & Development Corporation (MoSJE)",
        interest_rate_pct: 8.0,
        moratorium_months: 6,
        is_eligible: true,
        source_url: "https://nbcfdc.gov.in/en/schemes",
        last_verified_date: "2026-03-01"
      },
      matched_schemes: [
        {
          title_en: "NBCFDC General Term Loan Scheme (Farm Machinery)",
          organization: "MoSJE / NBCFDC",
          interest_rate_pct: 8.0,
          moratorium_months: 6,
          is_eligible: true,
          source_url: "https://nbcfdc.gov.in/en/schemes"
        }
      ]
    }
  },
  {
    id: "default_mushroom",
    userId: "system",
    type: "default",
    isDefault: true,
    source: "default",
    businessName: "Indoor Oyster & Button Mushroom Unit",
    category: "AGRI_PROCESSING",
    category_code: "MUSHROOM_FARMING",
    description: "Climate-controlled indoor bag cultivation with local wholesale & restaurant supply contract.",
    description_hi: "स्थानीय थोक और होटल आपूर्ति के लिए इनडोर मशरूम उत्पादन इकाई।",
    description_te: "స్థానిక మార్కెట్ మరియు హోటల్ సరఫరా కోసం రక్షిత పుట్టగొడుగుల సాగు యూనిట్.",
    location: {
      village: "Pimpalgaon Baswant",
      mandal: "Niphad",
      district: "Nashik",
      state: "Maharashtra",
      latitude: 20.1706,
      longitude: 73.9840
    },
    capital: 200000,
    requiredInvestment: 250000,
    suitabilityScore: 88.5,
    confidenceScore: 91.0,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    why_recommended_en: "High urban & restaurant demand with year-round harvest cycles. Low land requirement (0.1 acre indoor space). Excellent 32% operating margin.",
    why_recommended_hi: "वर्ष भर की फसल चक्र के साथ उच्च स्थानीय मांग। केवल 0.1 एकड़ इनडोर स्थान की आवश्यकता। 32% का उत्कृष्ट परिचालन मार्जिन।",
    why_recommended_te: "సంవత్సరం పొడవునా దిగుబడి మరియు అధిక మార్కెట్ డిమాండ్. తక్కువ స్థలం చాలు. 32% నిర్వహణ మార్జిన్.",
    rawRecommendation: {
      category_code: "MUSHROOM_FARMING",
      name_en: "Indoor Oyster & Button Mushroom Unit",
      name_hi: "इनडोर ऑयस्टर व बटन मशरूम उत्पादन इकाई",
      name_te: "ఇండోర్ బటన్ & ఆయిస్టర్ మష్రూమ్ సాగు యూనిట్",
      sector: "AGRI_PROCESSING",
      description: "Climate-controlled indoor bag cultivation with local wholesale & restaurant supply contract.",
      overall_suitability_score: 88.5,
      confidence_score: 91.0,
      sub_scores: {
        market_opportunity: 90.0,
        financial_feasibility: 89.0,
        skill_compatibility: 85.0,
        profitability: 92.0,
        competition: 84.0,
        risk_safety: 86.0
      },
      financials: {
        project_cost: 250000,
        own_contribution_required: 25000,
        loan_amount: 225000,
        interest_rate_pct: 8.0,
        tenure_years: 5,
        moratorium_months: 4,
        monthly_emi: 4562,
        projected_monthly_revenue: 55000,
        projected_monthly_expense: 28000,
        projected_monthly_operating_profit: 27000,
        monthly_net_surplus_after_emi: 22438,
        dscr: 1.95,
        financial_viability: "HIGH_VIABILITY",
        break_even_monthly_revenue: 31000,
        projections: [
          { yearNum: 1, revenue: 660000, expenses: 336000 },
          { yearNum: 2, revenue: 693000, expenses: 349440 },
          { yearNum: 3, revenue: 727650, expenses: 363418 },
          { yearNum: 4, revenue: 764033, expenses: 377954 },
          { yearNum: 5, revenue: 802234, expenses: 393072 }
        ]
      },
      market: {
        market_opportunity_score: 90.0,
        demand_index: 88,
        demand_supply_gap: "MODERATE_DEFICIT",
        competitor_count: 2,
        reference_village: "Pimpalgaon Baswant",
        analysis_radius_km: 10.0,
        data_confidence_pct: 91.0
      },
      risks: {
        risk_safety_score: 86.0,
        overall_severity: "LOW_MEDIUM",
        top_risks: [
          { dimension: "Contamination Risk", severity: "LOW", mitigation: "HEPA air filtration and strict sanitation protocol" }
        ]
      },
      stress_test: {
        survival_status: "SURVIVES_COMFORTABLY",
        stressed_dscr: 1.58
      },
      top_scheme: {
        title_en: "MIDH Scheme for Mushroom Cultivation Unit",
        title_hi: "एकीकृत बागवानी विकास मिशन (MIDH) मशरूम योजना",
        title_te: "మష్రూమ్ సాగు కోసం MIDH పథకం",
        organization: "Ministry of Agriculture & Farmers Welfare / MoSJE",
        interest_rate_pct: 8.0,
        moratorium_months: 4,
        is_eligible: true,
        source_url: "https://midh.gov.in",
        last_verified_date: "2026-03-01"
      },
      matched_schemes: [
        {
          title_en: "MIDH Scheme for Mushroom Cultivation Unit",
          organization: "MoA&FW / MoSJE",
          interest_rate_pct: 8.0,
          moratorium_months: 4,
          is_eligible: true,
          source_url: "https://midh.gov.in"
        }
      ]
    }
  },
  {
    id: "default_polyhouse",
    userId: "system",
    type: "default",
    isDefault: true,
    source: "default",
    businessName: "Polyhouse & Precision Vegetable Farming",
    category: "HIGH_VALUE_AGRI",
    category_code: "VEGETABLE_FARMING",
    description: "0.5-acre polyhouse for high-value capsicum, cucumber & exotic vegetable cultivation.",
    description_hi: "उच्च मूल्य वाली शिमला मिर्च और खीरे के लिए 0.5 एकड़ पॉलीहाउस खेती।",
    description_te: "అధిక విలువ గల క్యాప్సికం మరియు దోసకాయల కోసం 0.5 ఎకరాల పాలిహౌస్ సాగు.",
    location: {
      village: "Pimpalgaon Baswant",
      mandal: "Niphad",
      district: "Nashik",
      state: "Maharashtra",
      latitude: 20.1706,
      longitude: 73.9840
    },
    capital: 300000,
    requiredInvestment: 600000,
    suitabilityScore: 86.0,
    confidenceScore: 92.0,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    why_recommended_en: "High yield per sq. meter with year-round climate protection. Direct linkage to regional mandi & wholesale buyers.",
    why_recommended_hi: "मौसम सुरक्षा के साथ प्रति वर्ग मीटर उच्च पैदावार। क्षेत्रीय मंडी और थोक खरीदारों से सीधा जुड़ाव।",
    why_recommended_te: "సంవత్సరం పొడవునా వాతావరణ రక్షణతో అధిక దిగుబడి. మార్కెట్ వ్యాపారులతో నేరుగా అనుసంధానం.",
    rawRecommendation: {
      category_code: "VEGETABLE_FARMING",
      name_en: "Polyhouse & Precision Vegetable Farming",
      name_hi: "पॉलीहाउस व पॉलीहाउस सब्जी खेती",
      name_te: "పాలిహౌస్ & సునిశిత కూరగాయల సాగు",
      sector: "HIGH_VALUE_AGRI",
      description: "0.5-acre polyhouse for high-value capsicum, cucumber & exotic vegetable cultivation.",
      overall_suitability_score: 86.0,
      confidence_score: 92.0,
      sub_scores: {
        market_opportunity: 88.0,
        financial_feasibility: 85.0,
        skill_compatibility: 89.0,
        profitability: 87.0,
        competition: 82.0,
        risk_safety: 84.0
      },
      financials: {
        project_cost: 600000,
        own_contribution_required: 60000,
        loan_amount: 540000,
        interest_rate_pct: 8.0,
        tenure_years: 7,
        moratorium_months: 6,
        monthly_emi: 8422,
        projected_monthly_revenue: 95000,
        projected_monthly_expense: 52000,
        projected_monthly_operating_profit: 43000,
        monthly_net_surplus_after_emi: 34578,
        dscr: 1.88,
        financial_viability: "HIGH_VIABILITY",
        break_even_monthly_revenue: 58000,
        projections: [
          { yearNum: 1, revenue: 1140000, expenses: 624000 },
          { yearNum: 2, revenue: 1197000, expenses: 648960 },
          { yearNum: 3, revenue: 1256850, expenses: 674918 },
          { yearNum: 4, revenue: 1319693, expenses: 701915 },
          { yearNum: 5, revenue: 1385677, expenses: 729992 }
        ]
      },
      market: {
        market_opportunity_score: 88.0,
        demand_index: 86,
        demand_supply_gap: "HIGH_DEFICIT",
        competitor_count: 2,
        reference_village: "Pimpalgaon Baswant",
        analysis_radius_km: 10.0,
        data_confidence_pct: 92.0
      },
      risks: {
        risk_safety_score: 84.0,
        overall_severity: "MEDIUM",
        top_risks: [
          { dimension: "Pest Attack", severity: "MEDIUM", mitigation: "Integrated pest management & yellow sticky traps" }
        ]
      },
      stress_test: {
        survival_status: "SURVIVES_TIGHTLY",
        stressed_dscr: 1.51
      },
      top_scheme: {
        title_en: "Mission for Integrated Development of Horticulture (MIDH)",
        title_hi: "एकीकृत बागवानी विकास मिशन (MIDH) योजना",
        title_te: "సునిశిత వ్యవసాయం కోసం MIDH పథకం",
        organization: "Ministry of Agriculture / MoSJE",
        interest_rate_pct: 8.0,
        moratorium_months: 6,
        is_eligible: true,
        source_url: "https://midh.gov.in",
        last_verified_date: "2026-03-01"
      },
      matched_schemes: [
        {
          title_en: "Mission for Integrated Development of Horticulture (MIDH)",
          organization: "MoA&FW / MoSJE",
          interest_rate_pct: 8.0,
          moratorium_months: 6,
          is_eligible: true,
          source_url: "https://midh.gov.in"
        }
      ]
    }
  },
  {
    id: "default_dairy",
    userId: "system",
    type: "default",
    isDefault: true,
    source: "default",
    businessName: "Commercial Dairy Farming",
    category: "LIVESTOCK",
    category_code: "DAIRY_FARMING",
    description: "5-cow high-yielding Murrah buffalo / HF crossbred dairy unit with chilling tie-up.",
    description_hi: "दूध डेयरी संघ से जुड़ाव के साथ 5 गाय/भैंस की वाणिज्यिक डेयरी इकाई।",
    description_te: "డైరీ సహకార సంఘంతో అనుసంధానించబడిన 5 గేదెల/ఆవుల కమర్షియల్ డైరీ యూనిట్.",
    location: {
      village: "Pimpalgaon Baswant",
      mandal: "Niphad",
      district: "Nashik",
      state: "Maharashtra",
      latitude: 20.1706,
      longitude: 73.9840
    },
    capital: 300000,
    requiredInvestment: 400000,
    suitabilityScore: 84.2,
    confidenceScore: 90.0,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    why_recommended_en: "Daily liquid cash flow through milk cooperative collection. Low risk with livestock insurance coverage under MoSJE/AHIDF schemes.",
    why_recommended_hi: "डेयरी सहकारी समिति के माध्यम से दैनिक नकद आय। पशुधन बीमा के साथ कम जोखिम।",
    why_recommended_te: "పాల సహకార సంఘాల ద్వారా రోజువారీ నగదు రాబడి. పశువుల భీమా తో తక్కువ ప్రమాదం.",
    rawRecommendation: {
      category_code: "DAIRY_FARMING",
      name_en: "Commercial Dairy Farming",
      name_hi: "वाणिज्यिक डेयरी फार्मिंग (दुग्ध उत्पादन)",
      name_te: "కమర్షియల్ డైరీ ఫార్మింగ్",
      sector: "LIVESTOCK",
      description: "5-cow high-yielding Murrah buffalo / HF crossbred dairy unit with chilling tie-up.",
      overall_suitability_score: 84.2,
      confidence_score: 90.0,
      sub_scores: {
        market_opportunity: 86.0,
        financial_feasibility: 84.0,
        skill_compatibility: 88.0,
        profitability: 82.0,
        competition: 80.0,
        risk_safety: 85.0
      },
      financials: {
        project_cost: 400000,
        own_contribution_required: 40000,
        loan_amount: 360000,
        interest_rate_pct: 8.0,
        tenure_years: 6,
        moratorium_months: 6,
        monthly_emi: 6314,
        projected_monthly_revenue: 65000,
        projected_monthly_expense: 38000,
        projected_monthly_operating_profit: 27000,
        monthly_net_surplus_after_emi: 20686,
        dscr: 1.78,
        financial_viability: "HIGH_VIABILITY",
        break_even_monthly_revenue: 42000,
        projections: [
          { yearNum: 1, revenue: 780000, expenses: 456000 },
          { yearNum: 2, revenue: 819000, expenses: 474240 },
          { yearNum: 3, revenue: 859950, expenses: 493210 },
          { yearNum: 4, revenue: 902948, expenses: 512938 },
          { yearNum: 5, revenue: 948095, expenses: 533456 }
        ]
      },
      market: {
        market_opportunity_score: 86.0,
        demand_index: 84,
        demand_supply_gap: "MODERATE_DEFICIT",
        competitor_count: 3,
        reference_village: "Pimpalgaon Baswant",
        analysis_radius_km: 10.0,
        data_confidence_pct: 90.0
      },
      risks: {
        risk_safety_score: 85.0,
        overall_severity: "LOW_MEDIUM",
        top_risks: [
          { dimension: "Fodder Shortage", severity: "MEDIUM", mitigation: "Silage storage bunker & green fodder cultivation" }
        ]
      },
      stress_test: {
        survival_status: "SURVIVES_COMFORTABLY",
        stressed_dscr: 1.52
      },
      top_scheme: {
        title_en: "Animal Husbandry Infrastructure Development Fund (AHIDF)",
        title_hi: "पशुपालन अवसंरचना विकास कोष (AHIDF) योजना",
        title_te: "పశుసంవర్ధక మౌలిక సదుపాయాల అభివృద్ధి నిధి (AHIDF)",
        organization: "Department of Animal Husbandry & Dairying / MoSJE",
        interest_rate_pct: 8.0,
        moratorium_months: 6,
        is_eligible: true,
        source_url: "https://ahidf.udyamimitra.in",
        last_verified_date: "2026-03-01"
      },
      matched_schemes: [
        {
          title_en: "Animal Husbandry Infrastructure Development Fund (AHIDF)",
          organization: "DAHD / MoSJE",
          interest_rate_pct: 8.0,
          moratorium_months: 6,
          is_eligible: true,
          source_url: "https://ahidf.udyamimitra.in"
        }
      ]
    }
  }
];
