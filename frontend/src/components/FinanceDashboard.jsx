import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  Calculator, 
  BarChart3, 
  ChevronRight
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
import { useSaarthi } from '../context/SaarthiContext';

export default function FinanceDashboard({ recommendations, profile, lang = 'en' }) {
  const t = translations[lang] || translations.en;
  
  let saarthiCtx = null;
  try {
    saarthiCtx = useSaarthi();
  } catch (e) {}

  const activePayload = saarthiCtx?.getActiveRecommendationPayload() || recommendations;
  const topRec = activePayload?.top_recommendation;
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

  // Sync state when active business plan changes
  React.useEffect(() => {
    if (fin.project_cost) setProjectCost(fin.project_cost);
    if (fin.interest_rate_pct) setInterestRate(fin.interest_rate_pct);
    if (fin.tenure_years) setTenureYears(fin.tenure_years);
  }, [topRec?.name_en, fin.project_cost]);

  // Reducing balance EMI calculation
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

  const yearLabel = t.yearPrefix || 'Year';

  // Chart dataset for 5-Year Projection with localized year labels
  const rawProjections = fin.projections || [
    { yearNum: 1, revenue: 744000, expenses: 456000 },
    { yearNum: 2, revenue: 781200, expenses: 471960 },
    { yearNum: 3, revenue: 820260, expenses: 488478 },
    { yearNum: 4, revenue: 861273, expenses: 505575 },
    { yearNum: 5, revenue: 904336, expenses: 523270 }
  ];

  const chartData = rawProjections.map((item, idx) => {
    const yNum = item.yearNum || (idx + 1);
    return {
      year: `${yearLabel} ${yNum}`,
      revenue: item.revenue,
      expenses: item.expenses,
      debt_service: liveEmi * 12,
      net_cash_flow: item.revenue - item.expenses - (liveEmi * 12)
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* 1. Header & Identity Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center">
            <Coins className="w-4 h-4 mr-1.5 text-amber-500" />
            {t.lendingStructureTag || "National Concessional Lending Structure • MoSJE Framework"}
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {t.financeTitle || "Financial Structuring, Cash Flow & Debt Service Coverage Ratio (DSCR)"}
          </h2>
          <p className="text-xs text-slate-500">
            {t.financeSubtitle || "10% beneficiary margin and 90% concessional term loan via State Channelizing Agencies (NBCFDC/NSFDC)."}
          </p>
        </div>

        {/* DSCR Badge */}
        <div className={`px-5 py-3 rounded-2xl text-center border shadow-sm ${
          parseFloat(liveDscr) >= 1.50
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          <span className="text-[10px] uppercase font-extrabold tracking-wider block text-slate-500">
            {t.dscrBenchmark || "DSCR Benchmark (≥ 1.50x)"}
          </span>
          <span className="text-2xl font-black block leading-tight text-emerald-700">
            {liveDscr}x
          </span>
          <span className="text-[11px] font-bold text-emerald-800">
            {parseFloat(liveDscr) >= 1.50 ? (t.highSafetyCushion || "✓ High Debt Safety Cushion") : (t.marginalCushion || "Marginal Repayment Cushion")}
          </span>
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
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold">{t.totalProjectCost || "Total Project Cost"}</span>
          <div className="text-xl font-black text-slate-900">
            ₹{projectCost.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">{t.capitalWorkingSetup || "Capital + Working Setup"}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm space-y-1">
          <span className="text-emerald-800 font-semibold">{t.beneficiaryMargin || "10% Beneficiary Margin"}</span>
          <div className="text-xl font-black text-emerald-700">
            ₹{ownMargin.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">{t.mandatoryContribution || "Mandatory Own Contribution"}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold">{t.concessionalLoan || "90% Concessional Loan"}</span>
          <div className="text-xl font-black text-teal-800">
            ₹{loanRequired.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">@ {interestRate}% p.a. {t.concessionText || "Concession"}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold">{t.monthlyEMI || "Monthly Reducing EMI"}</span>
          <div className="text-xl font-black text-rose-700">
            ₹{liveEmi.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">{tenureYears} {t.tenureYearsLabel || "Years Tenure"}</span>
        </div>
      </div>

      {/* Interactive Financial Simulator Sliders */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
          <Calculator className="w-4 h-4 mr-1.5 text-emerald-600" />
          {t.slidersTitle || "Interactive Sensitivity Sliders (Test Different Loan Sizes)"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="flex justify-between font-bold mb-1.5">
              <span>{t.projectScale || "Project Scale / Investment"}</span>
              <span className="text-emerald-700">₹{projectCost.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="100000"
              max="1500000"
              step="25000"
              value={projectCost}
              onChange={(e) => setProjectCost(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold mb-1.5">
              <span>{t.concessionalInterestRate || "Concessional Interest Rate"}</span>
              <span className="text-teal-700">{interestRate}% p.a.</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="12.0"
              step="0.25"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold mb-1.5">
              <span>{t.repaymentTenure || "Repayment Tenure"}</span>
              <span className="text-blue-700">{tenureYears} {t.years || "Years"}</span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Chart & Operating Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5-Year Cash Flow Projection Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
              <BarChart3 className="w-4 h-4 mr-1.5 text-emerald-600" />
              {t.cashFlowTitle || "5-Year Cash Flow & Debt Servicing Projection"}
            </h3>
            <span className="text-[11px] text-slate-400">{t.valuesInRupees || "Values in ₹"}</span>
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
                <Bar dataKey="revenue" name={t.annualRevenue || "Annual Revenue"} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name={t.operatingExpenses || "Operating Expenses"} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debt_service" name={t.debtServiceEMI || "Debt Service (EMI)"} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_cash_flow" name={t.netCashSurplus || "Net Cash Surplus"} fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Operating Economics & Break-Even Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-teal-600" />
            {t.operatingEconomicsTitle || "Monthly Operating Economics"}
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">{t.projectedMonthlyRevenue || "Projected Monthly Revenue"}</span>
              <span className="font-bold text-slate-900">₹{monthlyRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">{t.monthlyOperatingExpenses || "Monthly Operating Expenses"}</span>
              <span className="font-bold text-slate-700">₹{monthlyExpense.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">{t.operatingProfitPreDebt || "Operating Profit (Pre-Debt)"}</span>
              <span className="font-bold text-emerald-700">₹{monthlyProfit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">{t.monthlyLoanEMI || "Monthly Loan EMI"}</span>
              <span className="font-bold text-rose-700">-₹{liveEmi.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <div className="flex justify-between text-emerald-950 font-bold">
                <span>{t.discretionarySurplus || "Discretionary Surplus"}</span>
                <span className="text-sm text-emerald-700">₹{(monthlyProfit - liveEmi).toLocaleString('en-IN')}/mo</span>
              </div>
              <span className="text-[10px] text-emerald-700 mt-1 block">
                {t.retainedHouseholdIncome || "Retained rural household income after honoring debt service."}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
              <span className="font-bold block text-[11px]">{t.breakEvenMonthlyRevenue || "Break-Even Monthly Revenue:"}</span>
              <span className="text-base font-extrabold text-slate-900">
                ₹{(fin.break_even_monthly_revenue || 35000).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {Math.round(((monthlyRevenue - (fin.break_even_monthly_revenue || 35000)) / monthlyRevenue) * 100)}% {t.marginOfSafety || "operating above break-even margin of safety."}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
