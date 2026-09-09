import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  Calculator, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Percent,
  Sliders,
  DollarSign,
  RefreshCw,
  Save,
  Building2,
  Sparkles,
  Layers,
  Table as TableIcon,
  PieChart,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { translations } from '../locales/translations';

// Standard MoSJE / National Scheme Presets
const SCHEME_PRESETS = [
  {
    id: 'NBCFDC_TERM',
    nameEn: 'NBCFDC / NSFDC Term Loan (MoSJE)',
    nameHi: 'एनबीसीएफडीसी टर्म लोन (सामाजिक न्याय मंत्रालय)',
    nameTe: 'NBCFDC టర్మ్ లోన్ (MoSJE)',
    marginPct: 10,
    interestRate: 8.0,
    tenureYears: 7,
    moratoriumMonths: 6,
    badge: '10/90 Concessional'
  },
  {
    id: 'NBCFDC_MICRO',
    nameEn: 'NBCFDC Micro Finance (Up to ₹1.4 Lakh)',
    nameHi: 'एनबीसीएफडीसी माइक्रो फाइनेंस (1.4 लाख तक)',
    nameTe: 'NBCFDC మైక్రో ఫైనాన్స్ (రూ. 1.4 లక్షల వరకు)',
    marginPct: 10,
    interestRate: 6.5,
    tenureYears: 3,
    moratoriumMonths: 3,
    badge: 'Micro Credit @ 6.5%'
  },
  {
    id: 'PMEGP',
    nameEn: 'PMEGP Scheme (KVIC / MoMSME)',
    nameHi: 'पीएमईजीपी योजना (15-35% सरकारी सब्सिडी)',
    nameTe: 'PMEGP పథకం (15-35% రాయితీ)',
    marginPct: 10,
    interestRate: 8.5,
    tenureYears: 5,
    moratoriumMonths: 6,
    badge: 'Govt Capital Subsidy'
  },
  {
    id: 'MUDRA',
    nameEn: 'Pradhan Mantri Mudra Yojana (PMMY)',
    nameHi: 'पीएम मुद्रा योजना (किशोर / तरुण)',
    nameTe: 'ప్రధాన మంత్రి ముద్రా యోజన',
    marginPct: 15,
    interestRate: 9.0,
    tenureYears: 5,
    moratoriumMonths: 3,
    badge: 'Collateral-Free MUDRA'
  },
  {
    id: 'STANDUP',
    nameEn: 'Stand-Up India (SC/ST & Women)',
    nameHi: 'स्टैंड-अप इंडिया (एससी/एसटी एवं महिला उद्यमी)',
    nameTe: 'స్టాండ్-అప్ ఇండియా (SC/ST & మహిళలు)',
    marginPct: 15,
    interestRate: 8.0,
    tenureYears: 7,
    moratoriumMonths: 12,
    badge: 'Greenfield Enterprise'
  },
  {
    id: 'COMMERCIAL',
    nameEn: 'Commercial Bank MSME Loan',
    nameHi: 'व्यावसायिक बैंक एमएसएमई ऋण',
    nameTe: 'కమర్షియల్ బ్యాంక్ MSME లోన్',
    marginPct: 25,
    interestRate: 11.0,
    tenureYears: 5,
    moratoriumMonths: 0,
    badge: 'Standard Bank Credit'
  }
];

// Catalog Enterprise Benchmarks for quick pre-fill
const BUSINESS_BENCHMARKS = [
  {
    id: 'VEGETABLE_FARMING',
    nameEn: 'Polyhouse & Precision Vegetable Farming',
    nameHi: 'सब्जी उत्पादन (पॉलीहाउस/प्राकृतिक खेती)',
    nameTe: 'పాలీహౌస్ & ఆధునిక కూరగాయల సాగు',
    typicalCost: 300000,
    typicalRevenue: 62000,
    typicalExpense: 38000,
    breakdown: { rawMaterial: 15000, labor: 9500, utilities: 5500, rent: 2000, transport: 6000 }
  },
  {
    id: 'DAIRY_FARMING',
    nameEn: 'Commercial Dairy Farming (2-4 Cows/Buffaloes)',
    nameHi: 'डेयरी फार्मिंग (दुग्ध व्यवसाय 2-4 पशु)',
    nameTe: 'వాణిజ్య పాడి పరిశ్రమ (2-4 ఆవులు/గేదెలు)',
    typicalCost: 400000,
    typicalRevenue: 72000,
    typicalExpense: 46000,
    breakdown: { rawMaterial: 26000, labor: 7000, utilities: 4000, rent: 3000, transport: 6000 }
  },
  {
    id: 'POULTRY_BROILER',
    nameEn: 'Commercial Broiler Poultry Unit (1000 Birds)',
    nameHi: 'ब्रायलर पोल्ट्री फार्मिंग (1000 पक्षी)',
    nameTe: 'కమర్షియల్ బ్రాయిలర్ పౌల్ట్రీ యూనిట్',
    typicalCost: 450000,
    typicalRevenue: 85000,
    typicalExpense: 62000,
    breakdown: { rawMaterial: 38000, labor: 9000, utilities: 7000, rent: 2000, transport: 6000 }
  },
  {
    id: 'MUSHROOM_FARMING',
    nameEn: 'Indoor Oyster & Button Mushroom Unit',
    nameHi: 'मशरूम उत्पादन एवं पैकेजिंग यूनिट',
    nameTe: 'పుట్టగొడుగుల పెంపకం & ప్యాకేజింగ్',
    typicalCost: 135000,
    typicalRevenue: 45000,
    typicalExpense: 24000,
    breakdown: { rawMaterial: 9000, labor: 6000, utilities: 4000, rent: 2000, transport: 3000 }
  },
  {
    id: 'FOOD_PROCESSING_MILL',
    nameEn: 'Mini Flour, Spices & Oil Expeller Mill',
    nameHi: 'मिनी आटा, मसाला एवं तेल पिराई उद्योग',
    nameTe: 'చిన్న పిండి, మసాలా & ఆయిల్ ప్రాసెసింగ్ మిల్లు',
    typicalCost: 220000,
    typicalRevenue: 52000,
    typicalExpense: 29000,
    breakdown: { rawMaterial: 11000, labor: 6000, utilities: 6000, rent: 3000, transport: 3000 }
  },
  {
    id: 'KIRANA_DAILY_NEEDS',
    nameEn: 'Smart Village Kirana & Daily Provisions Store',
    nameHi: 'स्मार्ट ग्रामीण किराना एवं दैनिक स्टोर',
    nameTe: 'గ్రామీణ స్మార్ట్ కిరాణా దుకాణం',
    typicalCost: 250000,
    typicalRevenue: 95000,
    typicalExpense: 74000,
    breakdown: { rawMaterial: 62000, labor: 4000, utilities: 3000, rent: 3000, transport: 2000 }
  },
  {
    id: 'AGRI_EQUIPMENT_RENTAL',
    nameEn: 'Custom Hiring Centre (Farm Machinery Rental)',
    nameHi: 'कृषि यंत्र कस्टम हायरिंग केंद्र (किराया सेवा)',
    nameTe: 'వ్యవసాయ యంత్రాల అద్దె కేంద్రం',
    typicalCost: 600000,
    typicalRevenue: 78000,
    typicalExpense: 36000,
    breakdown: { rawMaterial: 6000, labor: 8000, utilities: 14000, rent: 2000, transport: 6000 }
  },
  {
    id: 'GOAT_REARING',
    nameEn: 'Stall-Fed Goat Rearing & Breeding Unit (20+1)',
    nameHi: 'उन्नत बकरी पालन इकाई (20+1 शेड मॉडल)',
    nameTe: 'షెడ్-ఫెడ్ మేకల పెంపకం యూనిట్ (20+1)',
    typicalCost: 210000,
    typicalRevenue: 42000,
    typicalExpense: 23000,
    breakdown: { rawMaterial: 11000, labor: 4000, utilities: 3000, rent: 2000, transport: 3000 }
  },
  {
    id: 'CUSTOM',
    nameEn: 'Custom Enterprise / My Own Business Idea',
    nameHi: 'कस्टम व्यवसाय / मेरा अपना व्यवसाय विचार',
    nameTe: 'నా స్వంత వ్యాపార ఆలోచన',
    typicalCost: 300000,
    typicalRevenue: 65000,
    typicalExpense: 40000,
    breakdown: { rawMaterial: 20000, labor: 8000, utilities: 5000, rent: 3000, transport: 4000 }
  }
];

export default function FinanceDashboard({ 
  recommendations, 
  profile, 
  setProfile, 
  onProfileUpdate, 
  lang = 'en' 
}) {
  const t = translations[lang] || translations.en;
  const topRec = recommendations?.top_recommendation;
  const fin = topRec?.financials || {};

  // Selected enterprise
  const initialBusinessId = topRec?.category_code || 'VEGETABLE_FARMING';
  const [selectedBusinessId, setSelectedBusinessId] = useState(initialBusinessId);

  // Core Real Financial Inputs (initialized with user's actual profile if available)
  const [availableCapital, setAvailableCapital] = useState(
    profile?.available_capital !== undefined ? profile.available_capital : 300000
  );
  const [projectCost, setProjectCost] = useState(
    fin.project_cost || (profile?.available_capital ? Math.round(profile.available_capital / 0.10) : 300000)
  );
  const [monthlyRevenue, setMonthlyRevenue] = useState(
    fin.projected_monthly_revenue || 65000
  );
  const [monthlyExpense, setMonthlyExpense] = useState(
    fin.projected_monthly_expense || 41000
  );

  // Scheme and Loan Configuration
  const [selectedSchemeId, setSelectedSchemeId] = useState('NBCFDC_TERM');
  const [marginPct, setMarginPct] = useState(10);
  const [interestRate, setInterestRate] = useState(fin.interest_rate_pct || 8.0);
  const [tenureYears, setTenureYears] = useState(fin.tenure_years || 7);
  const [moratoriumMonths, setMoratoriumMonths] = useState(6);

  // Itemized Expense Breakdown toggle & values
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [expenseBreakdown, setExpenseBreakdown] = useState({
    rawMaterial: Math.round((fin.projected_monthly_expense || 41000) * 0.45),
    labor: Math.round((fin.projected_monthly_expense || 41000) * 0.20),
    utilities: Math.round((fin.projected_monthly_expense || 41000) * 0.15),
    rent: Math.round((fin.projected_monthly_expense || 41000) * 0.08),
    transport: Math.round((fin.projected_monthly_expense || 41000) * 0.12)
  });

  // UI view state (Chart vs Table)
  const [projectionViewMode, setProjectionViewMode] = useState('chart'); // 'chart' | 'table'
  const [isSyncingWithApi, setIsSyncingWithApi] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // When profile updates from outside, sync available capital if not edited
  useEffect(() => {
    if (profile?.available_capital !== undefined) {
      setAvailableCapital(profile.available_capital);
    }
  }, [profile?.available_capital]);

  // Handle Business Selection
  const handleBusinessChange = (busId) => {
    setSelectedBusinessId(busId);
    const benchmark = BUSINESS_BENCHMARKS.find(b => b.id === busId);
    if (benchmark && busId !== 'CUSTOM') {
      setProjectCost(benchmark.typicalCost);
      setMonthlyRevenue(benchmark.typicalRevenue);
      setMonthlyExpense(benchmark.typicalExpense);
      setExpenseBreakdown(benchmark.breakdown);
    }
  };

  // Handle Scheme Selection
  const handleSchemeChange = (schemeId) => {
    setSelectedSchemeId(schemeId);
    const scheme = SCHEME_PRESETS.find(s => s.id === schemeId);
    if (scheme) {
      setMarginPct(scheme.marginPct);
      setInterestRate(scheme.interestRate);
      setTenureYears(scheme.tenureYears);
      setMoratoriumMonths(scheme.moratoriumMonths);
    }
  };

  // Updating itemized expense and summing up
  const handleItemizedExpenseChange = (field, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    const updated = { ...expenseBreakdown, [field]: num };
    setExpenseBreakdown(updated);
    const total = Object.values(updated).reduce((acc, curr) => acc + curr, 0);
    setMonthlyExpense(total);
  };

  // Direct monthly expense change adjusts itemized breakdown proportionally
  const handleDirectExpenseChange = (val) => {
    const newTotal = Math.max(0, parseFloat(val) || 0);
    setMonthlyExpense(newTotal);
    const oldTotal = monthlyExpense > 0 ? monthlyExpense : 1;
    const factor = newTotal / oldTotal;
    setExpenseBreakdown({
      rawMaterial: Math.round(expenseBreakdown.rawMaterial * factor),
      labor: Math.round(expenseBreakdown.labor * factor),
      utilities: Math.round(expenseBreakdown.utilities * factor),
      rent: Math.round(expenseBreakdown.rent * factor),
      transport: Math.round(expenseBreakdown.transport * factor)
    });
  };

  // Deterministic Reducing Balance EMI Calculation
  const calculateEMI = (P, rAnnual, yrs) => {
    if (P <= 0 || yrs <= 0) return 0;
    const r = (rAnnual / 100) / 12;
    const n = yrs * 12;
    if (r === 0) return Math.round(P / n);
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  // Calculations
  const ownMarginRequired = Math.round(projectCost * (marginPct / 100));
  const loanRequired = Math.max(0, projectCost - ownMarginRequired);
  const liveEmi = calculateEMI(loanRequired, interestRate, tenureYears);
  
  // Capital adequacy check
  const liquidReserve = profile?.liquid_reserve !== undefined ? profile.liquid_reserve : 20000;
  const investableCapital = Math.max(0, availableCapital - liquidReserve);
  const capitalDeficit = Math.max(0, ownMarginRequired - investableCapital);
  const isCapitalSufficient = capitalDeficit === 0;

  // Operating economics
  const monthlyProfit = monthlyRevenue - monthlyExpense;
  const annualDebtService = liveEmi * 12;
  const annualCashFlow = monthlyProfit * 12;
  const liveDscr = annualDebtService > 0 ? (annualCashFlow / annualDebtService).toFixed(2) : '9.99';
  const monthlyNetSurplus = monthlyProfit - liveEmi;

  // Break-Even Analysis
  const fixedMonthlyCosts = liveEmi + Math.round(monthlyExpense * 0.35);
  const variableCostRatio = monthlyRevenue > 0 ? (monthlyExpense * 0.65) / monthlyRevenue : 0.60;
  const grossMarginRatio = Math.max(0.15, Math.min(0.90, 1 - variableCostRatio));
  const breakEvenMonthlyRevenue = Math.round(fixedMonthlyCosts / grossMarginRatio);
  const safetyMarginPct = monthlyRevenue > breakEvenMonthlyRevenue 
    ? Math.round(((monthlyRevenue - breakEvenMonthlyRevenue) / monthlyRevenue) * 100) 
    : 0;

  // Dynamic 5-Year Projections generated from real inputs
  const dynamicProjections = useMemo(() => {
    const list = [];
    let cumulativeReserve = 0;
    for (let yr = 1; yr <= 5; yr++) {
      const growthRev = Math.pow(1.05, yr - 1);
      const inflationExp = Math.pow(1.035, yr - 1);
      const yrRevenue = Math.round(monthlyRevenue * 12 * growthRev);
      const yrExpense = Math.round(monthlyExpense * 12 * inflationExp);
      const yrDebt = yr <= tenureYears ? liveEmi * 12 : 0;
      const yrOperatingProfit = yrRevenue - yrExpense;
      const yrNetCashFlow = yrOperatingProfit - yrDebt;
      cumulativeReserve += yrNetCashFlow;

      list.push({
        year: `Year ${yr}`,
        revenue: yrRevenue,
        expenses: yrExpense,
        operating_profit: yrOperatingProfit,
        debt_service: yrDebt,
        net_cash_flow: yrNetCashFlow,
        cumulative_surplus: cumulativeReserve
      });
    }
    return list;
  }, [monthlyRevenue, monthlyExpense, liveEmi, tenureYears]);

  // Sync data to User Profile so the entire app reflects the user's real business numbers
  const handleSaveToProfile = () => {
    const updatedProfile = {
      ...profile,
      available_capital: availableCapital,
      target_monthly_income: monthlyNetSurplus > 0 ? monthlyNetSurplus : profile?.target_monthly_income,
      business_interest: selectedBusinessId !== 'CUSTOM' ? selectedBusinessId : profile?.business_interest
    };

    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    } else if (setProfile) {
      setProfile(updatedProfile);
    }

    setSaveSuccessMsg(
      lang === 'hi'
        ? 'आपके वास्तविक वित्तीय आंकड़े प्रोफाइल में सफलतापूर्वक सुरक्षित कर लिए गए हैं!'
        : lang === 'te'
        ? 'మీ నిజమైన ఆర్థిక వివరాలు ప్రొఫైల్‌లో సేవ్ చేయబడ్డాయి!'
        : 'Real financial figures successfully saved to your Entrepreneur Profile!'
    );

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  // Re-verify with Backend AI Microservice (Parity with FastAPI MoSJE calculation)
  const handleVerifyWithBackend = async () => {
    setIsSyncingWithApi(true);
    try {
      const payload = {
        project_cost: projectCost,
        available_capital: availableCapital,
        liquid_reserve: liquidReserve,
        interest_rate: interestRate,
        tenure_years: tenureYears,
        monthly_revenue: monthlyRevenue,
        monthly_expense: monthlyExpense
      };
      const res = await axios.post('/api/financial-analysis', payload);
      if (res.data) {
        setSaveSuccessMsg(
          lang === 'hi'
            ? `एआई सत्यापन पूर्ण: बैंक व्यवहार्यता स्कोर ${res.data.financial_score}/100 (${res.data.financial_viability})`
            : lang === 'te'
            ? `AI నిర్ధారణ పూర్తయింది: బ్యాంక్ స్కోర్ ${res.data.financial_score}/100 (${res.data.financial_viability})`
            : `AI Verification Complete: Bankability Score ${res.data.financial_score}/100 (${res.data.financial_viability})`
        );
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.warn("Backend finance verification note:", err);
    } finally {
      setIsSyncingWithApi(false);
    }
  };

  // Reset to initial profile figures
  const handleResetToProfile = () => {
    if (profile?.available_capital !== undefined) {
      setAvailableCapital(profile.available_capital);
      setProjectCost(Math.round(profile.available_capital / 0.10));
    }
  };

  const getBusinessName = (bus) => {
    if (lang === 'hi') return bus.nameHi;
    if (lang === 'te') return bus.nameTe;
    return bus.nameEn;
  };

  const getSchemeName = (scheme) => {
    if (lang === 'hi') return scheme.nameHi;
    if (lang === 'te') return scheme.nameTe;
    return scheme.nameEn;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* 1. Header & Identity Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center">
              <Coins className="w-3.5 h-3.5 mr-1 text-amber-500" />
              {lang === 'hi' ? 'वास्तविक वित्तीय योजनाकार' : lang === 'te' ? 'నిజమైన ఆర్థిక ప్రణాళిక' : 'Real Business Financial Planner'}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              • {profile?.name || 'Entrepreneur'} ({profile?.district || 'Rural Center'}, {profile?.state || 'India'})
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">
            {lang === 'hi' 
              ? 'व्यवसाय लागत, ऋण किस्त एवं लाभ योजनाकार' 
              : lang === 'te'
              ? 'వ్యాపార వ్యయం, రుణం & లాభాల ప్రణాళిక'
              : 'Interactive Financial Structuring & Debt Service (DSCR)'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {lang === 'hi'
              ? 'अपनी वास्तविक पूँजी, अपेक्षित मासिक बिक्री एवं व्यय दर्ज करें। सिस्टम स्वचालित रूप से ईएमआई, सुरक्षा मार्जिन एवं 5 वर्षीय रिपोर्ट तैयार करेगा।'
              : lang === 'te'
              ? 'మీ నిజమైన మూలధనం, ఆశించిన నెలవారీ ఆదాయం & ఖర్చులు నమోదు చేయండి. సరైన EMI, సేఫ్టీ మార్జిన్ లెక్కించబడుతుంది.'
              : 'Enter your real capital, project size, and monthly sales to compute exact reducing EMI, DSCR, and cash surplus under MoSJE schemes.'}
          </p>
        </div>

        {/* Action Buttons: Sync & Save */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetToProfile}
            title="Reload numbers saved in profile"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            {lang === 'hi' ? 'प्रोफ़ाइल से लाएं' : lang === 'te' ? 'ప్రొఫైల్ నుండి పొందండి' : 'Sync Profile'}
          </button>

          <button
            onClick={handleSaveToProfile}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow flex items-center transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {lang === 'hi' ? 'प्रोफ़ाइल में सेव करें' : lang === 'te' ? 'ప్రొఫైల్‌లో సేవ్ చేయండి' : 'Save to Profile'}
          </button>

          <button
            onClick={handleVerifyWithBackend}
            disabled={isSyncingWithApi}
            className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 flex items-center transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1.5 text-teal-600 ${isSyncingWithApi ? 'animate-spin' : ''}`} />
            {isSyncingWithApi ? 'Validating...' : (lang === 'hi' ? 'AI बैंक सत्यापन' : lang === 'te' ? 'AI తనిఖీ' : 'AI Bank Check')}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm transition animate-fadeIn">
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-4">✕</button>
        </div>
      )}

      {/* 2. Top Summary KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Tile 1: Project Scale */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 font-semibold">
            <span>{lang === 'hi' ? 'कुल परियोजना लागत' : lang === 'te' ? 'మొత్తం ప్రాజెక్ట్ ఖర్చు' : 'Total Project Cost'}</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900">
            ₹{projectCost.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {projectCost <= 140000 
              ? (lang === 'hi' ? 'माइक्रो फाइनेंस सीमा में' : 'Micro Credit Tier (≤ ₹1.4L)') 
              : (lang === 'hi' ? 'टर्म लोन योजना (MoSJE)' : 'Term Loan Tier (MoSJE)')}
          </span>
        </div>

        {/* Tile 2: Required Own Margin */}
        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 relative overflow-hidden ${
          isCapitalSufficient 
            ? 'bg-emerald-50/50 border-emerald-200' 
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex justify-between items-center font-semibold">
            <span className={isCapitalSufficient ? 'text-emerald-800' : 'text-amber-900'}>
              {lang === 'hi' ? `${marginPct}% स्व-अंशदान` : lang === 'te' ? `${marginPct}% సొంత వాటా` : `${marginPct}% Own Margin Required`}
            </span>
            <ShieldCheck className={`w-4 h-4 ${isCapitalSufficient ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div className={`text-xl font-black ${isCapitalSufficient ? 'text-emerald-700' : 'text-amber-800'}`}>
            ₹{ownMarginRequired.toLocaleString('en-IN')}
          </div>
          <span className={`text-[11px] font-bold block ${isCapitalSufficient ? 'text-emerald-600' : 'text-amber-700'}`}>
            {isCapitalSufficient 
              ? `✓ Available: ₹${availableCapital.toLocaleString('en-IN')}` 
              : `⚠ Deficit: ₹${capitalDeficit.toLocaleString('en-IN')}`}
          </span>
        </div>

        {/* Tile 3: Concessional Loan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 font-semibold">
            <span>{lang === 'hi' ? `${100 - marginPct}% रियायती ऋण` : lang === 'te' ? `${100 - marginPct}% రుణం` : `${100 - marginPct}% Concessional Loan`}</span>
            <Percent className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl font-black text-teal-800">
            ₹{loanRequired.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 block">
            @ {interestRate}% p.a. • {tenureYears} Years
          </span>
        </div>

        {/* Tile 4: Monthly Reducing EMI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 font-semibold">
            <span>{lang === 'hi' ? 'मासिक ऋण किस्त (EMI)' : lang === 'te' ? 'నెలవారీ EMI' : 'Monthly Reducing EMI'}</span>
            <Calculator className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-700">
            ₹{liveEmi.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {lang === 'hi' ? `वार्षिक: ₹${annualDebtService.toLocaleString('en-IN')}` : `Annual: ₹${annualDebtService.toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>

      {/* 3. Real Data Inputs Panel: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Enter Real Numbers (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">

          {/* Card A: Enterprise Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1.5 text-emerald-600" />
                {lang === 'hi' ? '1. व्यवसाय / उद्यम चुनें' : lang === 'te' ? '1. వ్యాపార ఎంపిక' : '1. Select Planned Business Enterprise'}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold lowercase">
                {selectedBusinessId !== 'CUSTOM' ? 'Benchmarked' : 'Custom'}
              </span>
            </label>

            <select
              value={selectedBusinessId}
              onChange={(e) => handleBusinessChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {BUSINESS_BENCHMARKS.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {getBusinessName(bus)}
                </option>
              ))}
            </select>
          </div>

          {/* Card B: Real Capital & Project Cost Inputs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1 text-emerald-600" />
                {lang === 'hi' ? '2. आपकी वास्तविक पूँजी एवं निवेश राशि' : lang === 'te' ? '2. మీ నిజమైన పెట్టుబడి వివరాలు' : '2. Your Real Capital & Total Investment'}
              </span>
              <span className="text-[11px] font-normal text-slate-400">Direct Rupee Inputs</span>
            </h3>

            {/* Input 1: Own Available Capital */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">
                  {lang === 'hi' ? 'आपके पास उपलब्ध खुद की पूँजी (₹)' : lang === 'te' ? 'మీ వద్ద ఉన్న మూలధనం (₹)' : 'Your Available Own Capital / Savings (₹)'}
                </span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  ₹{availableCapital.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="10000"
                  max="10000000"
                  step="5000"
                  value={availableCapital}
                  onChange={(e) => setAvailableCapital(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="e.g. 150000"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Quick Presets for Available Capital */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Quick Set:</span>
                {[50000, 100000, 200000, 300000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAvailableCapital(amt)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                      availableCapital === amt 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{(amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1)}L
                  </button>
                ))}
              </div>

              {/* Capital Adequacy Message */}
              {!isCapitalSufficient && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      {lang === 'hi' ? `₹${capitalDeficit.toLocaleString('en-IN')} का पूँजी घाटा:` : `Capital Deficit of ₹${capitalDeficit.toLocaleString('en-IN')}:`}
                    </span>{' '}
                    {lang === 'hi'
                      ? 'परियोजना के लिए 10% अंशदान आवश्यक है। कृपया परियोजना लागत घटाएं, बचत बढ़ाएं, या PMEGP में 25-35% सरकारी सब्सिडी के लिए आवेदन करें।'
                      : 'You need additional margin contribution. You can either scale down your project cost, save more, or seek 25-35% capital subsidy under PMEGP.'}
                  </div>
                </div>
              )}
            </div>

            {/* Input 2: Total Project Cost */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">
                  {lang === 'hi' ? 'कुल परियोजना लागत / सेटअप व्यय (₹)' : lang === 'te' ? 'మొత్తం ప్రాజెక్ట్ ఖర్చు (₹)' : 'Total Project Cost / Machinery & Setup (₹)'}
                </span>
                <span className="font-extrabold text-slate-900 text-sm">
                  ₹{projectCost.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                min="25000"
                max="5000000"
                step="10000"
                value={projectCost}
                onChange={(e) => setProjectCost(Math.max(10000, parseFloat(e.target.value) || 0))}
                placeholder="e.g. 400000"
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <input
                type="range"
                min="50000"
                max="2500000"
                step="25000"
                value={projectCost}
                onChange={(e) => setProjectCost(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹50k (Micro)</span>
                <span>₹10 Lakh</span>
                <span>₹25 Lakh (Commercial)</span>
              </div>
            </div>

          </div>

          {/* Card C: Real Monthly Revenue & Expense Inputs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-teal-600" />
                {lang === 'hi' ? '3. अपेक्षित मासिक बिक्री एवं परिचालन व्यय' : lang === 'te' ? '3. నెలవారీ అమ్మకాలు & ఖర్చులు' : '3. Real Monthly Sales & Operating Costs'}
              </span>
              <span className="text-[11px] font-normal text-slate-400">Monthly Cash In/Out</span>
            </h3>

            {/* Input: Expected Monthly Revenue */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">
                  {lang === 'hi' ? 'अपेक्षित मासिक कुल बिक्री / राजस्व (₹)' : lang === 'te' ? 'ఆశించిన నెలవారీ ఆదాయం (₹)' : 'Expected Monthly Gross Sales / Revenue (₹)'}
                </span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  ₹{monthlyRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                min="5000"
                max="5000000"
                step="2500"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 focus:border-teal-500 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Daily Sales Equivalent: ≈ ₹{Math.round(monthlyRevenue / 30).toLocaleString('en-IN')}/day</span>
                <span>Annual Gross: ₹{(monthlyRevenue * 12).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Input: Expected Monthly Operating Expenses */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">
                  {lang === 'hi' ? 'अपेक्षित मासिक कुल व्यय (कच्चा माल + मजदूरी + बिजली आदि) (₹)' : lang === 'te' ? 'నెలవారీ ఖర్చులు (₹)' : 'Expected Monthly Operating Expenses (₹)'}
                </span>
                <span className="font-extrabold text-slate-700 text-sm">
                  ₹{monthlyExpense.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                min="2000"
                max="4500000"
                step="1000"
                value={monthlyExpense}
                onChange={(e) => handleDirectExpenseChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-slate-500 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
              />

              {/* Toggle Itemized Expense Breakdown */}
              <button
                type="button"
                onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center transition pt-1 cursor-pointer"
              >
                {showExpenseBreakdown ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                {showExpenseBreakdown 
                  ? (lang === 'hi' ? 'मदवार व्यय विवरण छिपाएं' : 'Hide Itemized Expense Breakdown') 
                  : (lang === 'hi' ? 'मदवार व्यय दर्ज करें (कच्चा माल, मजदूरी, बिजली, किराया)' : 'Edit Itemized Expenses (Raw Material, Labor, Power, Rent)')}
              </button>

              {/* Itemized Breakdown Inputs */}
              {showExpenseBreakdown && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs animate-fadeIn">
                  <div className="text-[11px] font-bold text-slate-600 mb-1">
                    {lang === 'hi' ? 'मासिक व्यय की मदें (इनका योग स्वतः कुल व्यय बनेगा):' : 'Itemized Monthly Breakdown (Auto-sums to total):'}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Raw Material / Stock / Feed</span>
                      <input
                        type="number"
                        value={expenseBreakdown.rawMaterial}
                        onChange={(e) => handleItemizedExpenseChange('rawMaterial', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Labor / Helper Wages</span>
                      <input
                        type="number"
                        value={expenseBreakdown.labor}
                        onChange={(e) => handleItemizedExpenseChange('labor', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Electricity & Fuel / Diesel</span>
                      <input
                        type="number"
                        value={expenseBreakdown.utilities}
                        onChange={(e) => handleItemizedExpenseChange('utilities', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Shop / Shed Rent</span>
                      <input
                        type="number"
                        value={expenseBreakdown.rent}
                        onChange={(e) => handleItemizedExpenseChange('rent', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                      />
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block mb-0.5">Transport to Mandi & Logistics</span>
                      <input
                        type="number"
                        value={expenseBreakdown.transport}
                        onChange={(e) => handleItemizedExpenseChange('transport', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Card D: Concessional Loan & Terms Structuring */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center">
                <Sliders className="w-4 h-4 mr-1 text-blue-600" />
                {lang === 'hi' ? '4. ऋण योजना एवं बैंक शर्तें' : lang === 'te' ? '4. లోన్ పథకం & నిబంధనలు' : '4. Concessional Loan Scheme & Bank Terms'}
              </span>
              <span className="text-[11px] font-normal text-slate-400">MoSJE Guidelines</span>
            </h3>

            {/* Scheme Selector */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">
                {lang === 'hi' ? 'सरकारी योजना का चयन करें:' : 'Select Financial Lending Scheme:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SCHEME_PRESETS.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSchemeChange(sc.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                      selectedSchemeId === sc.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-slate-800 text-[11px]">{getSchemeName(sc)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-semibold text-emerald-700">{sc.interestRate}% p.a.</span>
                      <span>• {sc.tenureYears} Yrs</span>
                      <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">{sc.badge}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fine-Tuning Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              {/* Own Margin % */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Own Margin</span>
                  <span className="text-emerald-700">{marginPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="5"
                  value={marginPct}
                  onChange={(e) => setMarginPct(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Interest Rate</span>
                  <span className="text-teal-700">{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="14.0"
                  step="0.25"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              {/* Tenure Years */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Tenure</span>
                  <span className="text-blue-700">{tenureYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Live Deterministic Financial Analysis & Viability (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">

          {/* Card 1: DSCR & Bank Approval Viability Badge */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                {lang === 'hi' ? 'बैंक ऋण स्वीकृति स्कोर (DSCR)' : 'Bank Loan Feasibility (DSCR)'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                parseFloat(liveDscr) >= 1.50
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : parseFloat(liveDscr) >= 1.20
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {parseFloat(liveDscr) >= 1.50 ? '✓ Bankable' : parseFloat(liveDscr) >= 1.20 ? 'Eligible' : 'Needs Margin'}
              </span>
            </div>

            {/* Gauge Display */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                Debt Service Coverage Ratio
              </span>
              <div className="text-4xl font-black text-emerald-700 tracking-tight">
                {liveDscr}x
              </div>
              <span className="text-xs font-bold text-slate-700 block">
                {parseFloat(liveDscr) >= 1.75
                  ? (lang === 'hi' ? 'उत्कृष्ट पुनर्भुगतान क्षमता (सुरक्षित ऋण)' : 'High Debt Servicing Cushion (≥ 1.75x)')
                  : parseFloat(liveDscr) >= 1.40
                  ? (lang === 'hi' ? 'मानक बैंक ऋण सीमा स्वीकृत' : 'Acceptable Bank Benchmark (≥ 1.40x)')
                  : (lang === 'hi' ? 'ऋण किस्त का दबाव अधिक है' : 'Tight Margin / Stressed Repayment')}
              </span>
              <p className="text-[10px] text-slate-500 pt-1">
                Formula: Annual Operating Profit (₹{(monthlyProfit * 12).toLocaleString('en-IN')}) ÷ Annual Loan Repayment (₹{annualDebtService.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          {/* Card 2: Operating Economics & Real Household Surplus */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
              <Coins className="w-4 h-4 mr-1.5 text-amber-500" />
              {lang === 'hi' ? 'मासिक नकदी प्रवाह एवं घर की शुद्ध बचत' : 'Monthly Cash Flow & Family Income'}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gross Monthly Revenue</span>
                <span className="font-bold text-emerald-700">+₹{monthlyRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Operating Expenses</span>
                <span className="font-bold text-slate-700">-₹{monthlyExpense.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-700 font-semibold">Operating Profit (Pre-Debt)</span>
                <span className="font-extrabold text-slate-900">₹{monthlyProfit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-rose-600 font-semibold">Monthly Loan EMI Repayment</span>
                <span className="font-bold text-rose-700">-₹{liveEmi.toLocaleString('en-IN')}</span>
              </div>

              {/* Net Discretionary Surplus Callout */}
              <div className={`p-4 rounded-2xl border ${
                monthlyNetSurplus >= 0 
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-xs">
                    {lang === 'hi' ? 'शुद्ध मासिक बचत (घर की आय):' : 'Net Discretionary Surplus:'}
                  </span>
                  <span className={`text-base font-black ${monthlyNetSurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ₹{monthlyNetSurplus.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 mt-1 block">
                  {monthlyNetSurplus >= 0
                    ? (lang === 'hi' ? 'सभी खर्चे और ऋण किस्त चुकाने के बाद परिवार की शुद्ध बचत।' : 'Retained family profit after honoring all operational costs and loan repayment.')
                    : (lang === 'hi' ? 'चेतावनी: मासिक घाटा! बिक्री बढ़ाएं या खर्चे घटाएं।' : 'Warning: Operating at a deficit! Increase sales or lower monthly costs.')}
                </span>
              </div>
            </div>

            {/* Break-Even Revenue Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-600 text-[11px]">
                  {lang === 'hi' ? 'नो-प्रॉफिट नो-लॉस बिक्री (Break-Even):' : 'Break-Even Monthly Sales:'}
                </span>
                <span className="text-sm font-black text-slate-900">
                  ₹{breakEvenMonthlyRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    monthlyRevenue >= breakEvenMonthlyRevenue ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((monthlyRevenue / Math.max(1, breakEvenMonthlyRevenue)) * 50))}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {monthlyRevenue >= breakEvenMonthlyRevenue
                  ? (lang === 'hi' ? `सुरक्षा मार्जिन: ${safetyMarginPct}% ऊपर परिचालन` : `Safety Cushion: Operating ${safetyMarginPct}% above break-even volume.`)
                  : (lang === 'hi' ? `घाटे का जोखिम: ब्रेक-ईवन से ₹${(breakEvenMonthlyRevenue - monthlyRevenue).toLocaleString('en-IN')} कम` : `Below break-even by ₹${(breakEvenMonthlyRevenue - monthlyRevenue).toLocaleString('en-IN')}`)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Dynamic 5-Year Cash Flow Projection (Chart & Table) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
              <BarChart3 className="w-4 h-4 mr-1.5 text-emerald-600" />
              {lang === 'hi' ? '5 वर्षीय नकदी प्रवाह एवं ऋण पुनर्भुगतान प्रक्षेपण' : '5-Year Cash Flow & Debt Servicing Projection'}
            </h3>
            <span className="text-[11px] text-slate-400">
              {lang === 'hi' ? 'वार्षिक 5% बिक्री वृद्धि एवं 3.5% लागत मुद्रास्फीति पर आधारित' : 'Based on 5% annual revenue growth and 3.5% cost inflation.'}
            </span>
          </div>

          {/* Toggle View: Chart vs Table */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setProjectionViewMode('chart')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center transition cursor-pointer ${
                projectionViewMode === 'chart'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              {lang === 'hi' ? 'चार्ट देखें' : 'Chart View'}
            </button>
            <button
              onClick={() => setProjectionViewMode('table')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center transition cursor-pointer ${
                projectionViewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 mr-1" />
              {lang === 'hi' ? 'खाता बही (टेबल)' : 'Ledger Table'}
            </button>
          </div>
        </div>

        {/* Chart View */}
        {projectionViewMode === 'chart' && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicProjections} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenue" name="Annual Revenue (बिक्री)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Operating Costs (व्यय)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debt_service" name="Debt Service / EMI (किस्त)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_cash_flow" name="Net Annual Surplus (शुद्ध बचत)" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table View */}
        {projectionViewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timeline</th>
                  <th className="py-2.5 px-3">Annual Sales (₹)</th>
                  <th className="py-2.5 px-3">Operating Costs (₹)</th>
                  <th className="py-2.5 px-3">Operating Profit (₹)</th>
                  <th className="py-2.5 px-3">Annual EMI (₹)</th>
                  <th className="py-2.5 px-3">Net Cash Surplus (₹)</th>
                  <th className="py-2.5 px-3">Cumulative Reserve (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dynamicProjections.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.year}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">₹{row.revenue.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-slate-600">₹{row.expenses.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-semibold">₹{row.operating_profit.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-rose-600 font-medium">₹{row.debt_service.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">₹{row.net_cash_flow.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-extrabold text-teal-900">₹{row.cumulative_surplus.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MoSJE Guidance Note Footer */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">
              {lang === 'hi' ? 'सरकारी रियायती ऋण संरचना नियम (MoSJE & KVIC):' : 'National Concessional Framework Notes:'}
            </span>{' '}
            {lang === 'hi'
              ? 'राष्ट्रीय पिछड़ा वर्ग वित्त एवं विकास निगम (NBCFDC) एवं अनुसूचित जाति वित्त एवं विकास निगम (NSFDC) के अंतर्गत 90% तक ऋण 6-8% रियायती ब्याज दर पर उपलब्ध होता है। 10% लाभार्थी अंशदान अनिवार्य है।'
              : 'Under NBCFDC and NSFDC guidelines, up to 90% term loan is sanctioned through State Channelizing Agencies at concessional rates (6-8% p.a.) with a mandatory 10% own beneficiary margin.'}
          </div>
        </div>
      </div>

    </div>
  );
}
