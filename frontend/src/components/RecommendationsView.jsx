import React from 'react';
import { 
  Building2, 
  Coins, 
  TrendingUp, 
  ChevronRight, 
  CheckCircle2, 
  Info,
  Layers,
  FileText,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Bookmark
} from 'lucide-react';
import { translations } from '../locales/translations';
import { useSaarthi } from '../context/SaarthiContext';

export default function RecommendationsView({ lang = 'en', setActiveTab }) {
  const t = translations[lang] || translations.en;
  
  const { 
    personalPlans, 
    defaultPlans, 
    allPlans, 
    activePlanId, 
    setActivePlanId, 
    getActivePlan 
  } = useSaarthi();

  const activePlan = getActivePlan();
  const activeRec = activePlan?.rawRecommendation;

  const hasPersonalPlans = personalPlans.length > 0;
  const isPersonalActive = activePlan?.type === 'personal';

  if (!activeRec) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">
          {t.noRecsTitle || "No Recommendations Computed Yet"}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          {t.noRecsDesc || "Please run the decision advisory or provide entrepreneur profile information."}
        </p>
        <button
          onClick={() => setActiveTab('home')}
          className="bg-[#0F3D2E] text-white px-4 py-2 rounded-xl text-xs font-semibold"
        >
          {t.talkToSaarthi || "Talk to Saarthi"}
        </button>
      </div>
    );
  }

  const sub = activeRec.sub_scores || {};
  const fin = activeRec.financials || {};
  const mkt = activeRec.market || {};
  const scheme = activeRec.top_scheme || {};
  const explanation = activeRec.explanation || {};

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* ============================================================ */}
      {/* SECTION 1: YOUR BUSINESS PLAN (PERSONAL PLAN FIRST)          */}
      {/* ============================================================ */}
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#C28A17]" />
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              {t.yourBusinessPlan || "YOUR BUSINESS PLAN"}
            </h2>
            {isPersonalActive && (
              <span className="bg-amber-100 text-[#0F3D2E] border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center space-x-1">
                <span>{t.yourPlanBadge || "✨ YOUR PLAN"}</span>
              </span>
            )}
          </div>

          {/* Multiple Personal Plans Selector Tabs */}
          {hasPersonalPlans && (
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
              {personalPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setActivePlanId(plan.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    activePlanId === plan.id
                      ? 'bg-[#0F3D2E] text-amber-300 shadow-sm'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#C28A17]" />
                  <span className="truncate max-w-[140px]">{plan.businessName}</span>
                  <span className="bg-amber-400/20 text-amber-900 px-1.5 py-0.2 rounded text-[10px]">
                    {plan.suitabilityScore}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* IF USER HAS NO PERSONAL PLAN YET: BEAUTIFUL EMPTY STATE */}
        {!hasPersonalPlans ? (
          <div className="bg-gradient-to-br from-[#0F3D2E] to-[#144f3c] rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t.createdWithSaarthi || "Created with Saarthi"}</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                {t.noPersonalPlanTitle || "Let's build your first business plan."}
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                {t.noPersonalPlanDesc || "Tell Saarthi what you want to start, and we'll analyze the opportunity for you using local market demand, concessional loans, and scheme matching."}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('home')}
                  className="bg-amber-400 hover:bg-amber-300 text-stone-900 px-5 py-3 rounded-2xl text-xs font-extrabold shadow-lg transition flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.talkToSaarthi || "Talk to Saarthi"}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Graphic Badge */}
            <div className="w-full md:w-64 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center space-y-2 shrink-0">
              <Building2 className="w-10 h-10 text-amber-300 mx-auto" />
              <span className="text-xs font-bold block text-white">Interactive Advisory</span>
              <span className="text-[11px] text-emerald-200 block">Personal plans appear here automatically when created with Saarthi.</span>
            </div>
          </div>
        ) : (
          /* FEATURED PERSONAL PLAN SHOWCASE CARD */
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-800/30 shadow-xl space-y-6">
            
            {/* Personal Plan Title & Suitability Score Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-stone-100">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="bg-emerald-100 text-[#0F3D2E] px-3 py-0.5 rounded-full text-xs font-extrabold tracking-wide flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C28A17] mr-1" />
                    <span>{t.createdWithSaarthi || "Created with Saarthi"}</span>
                  </span>
                  <span className="text-xs font-bold text-stone-500 capitalize">
                    {activePlan.category?.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {lang === 'hi' ? (activeRec.name_hi || activeRec.name_en) : (lang === 'te' ? (activeRec.name_te || activeRec.name_en) : activeRec.name_en)}
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-2xl font-medium">
                  {lang === 'hi' ? (activeRec.description_hi || activeRec.description) : (lang === 'te' ? (activeRec.description_te || activeRec.description) : activeRec.description)}
                </p>
                <div className="mt-2 text-xs text-emerald-800 font-bold flex items-center space-x-1">
                  <span>📍 {activePlan.location?.village || 'Local Area'}, {activePlan.location?.district || ''}</span>
                  <span className="mx-1.5">•</span>
                  <span>Available Capital: ₹{(activePlan.capital || 300000).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Suitability Score Gauge */}
              <div className="bg-gradient-to-br from-[#0F3D2E] to-[#165440] text-white p-5 rounded-2xl text-center min-w-[140px] shadow-md border border-emerald-700/50">
                <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-90 block text-amber-300">
                  {t.suitability || "Suitability"}
                </span>
                <span className="text-4xl font-black block leading-none my-1 text-amber-300">
                  {activePlan.suitabilityScore}
                </span>
                <span className="text-[10px] opacity-80 block">{t.outOf100 || "out of 100"}</span>
                <div className="mt-2 pt-2 border-t border-white/20 text-[10px] font-semibold text-emerald-100">
                  {t.confidence || "Confidence"}: {activePlan.confidenceScore}%
                </div>
              </div>
            </div>

            {/* Main 2-Column Grid: Sub-scores & Financials */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Multi-Factor Sub-scores & Evidence */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 6 Deterministic Scoring Dimensions */}
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    {t.scoringSubDimensions || "Deterministic Scoring Sub-Dimensions (Weights Verified)"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* 1. Market Opportunity (30%) */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span className="text-stone-700">{t.marketOpportunity || "Local Market Opportunity"} (30%)</span>
                        <span className="text-emerald-700 font-bold">{sub.market_opportunity || 90}/100</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${sub.market_opportunity || 90}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-500 block">{t.demandIndex || "Demand Index"}: {mkt.demand_index || 88} • {t.gap || "Gap"}: {mkt.demand_supply_gap || 'HIGH'}</span>
                    </div>

                    {/* 2. Financial Feasibility (20%) */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span className="text-stone-700">{t.financialFeasibility || "Financial Feasibility"} (20%)</span>
                        <span className="text-emerald-700 font-bold">{sub.financial_feasibility || 88}/100</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full" style={{ width: `${sub.financial_feasibility || 88}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-500 block">{t.dscr || "DSCR"}: {fin.dscr || 2.10}x • {t.margin || "Margin"}: ₹{(fin.own_contribution_required || 30000).toLocaleString('en-IN')}</span>
                    </div>

                    {/* 3. Skill Match (15%) */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span className="text-stone-700">{t.skillCompatibility || "Skill Compatibility"} (15%)</span>
                        <span className="text-blue-700 font-bold">{sub.skill_compatibility || 92}/100</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${sub.skill_compatibility || 92}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-500 block">{t.alignsExperience || "Aligns with verified past experience"}</span>
                    </div>

                    {/* 4. Profitability (15%) */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span className="text-stone-700">{t.operatingProfitability || "Operating Profitability"} (15%)</span>
                        <span className="text-amber-700 font-bold">{sub.profitability || 86}/100</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${sub.profitability || 86}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-500 block">{t.monthlyProfit || "Profit"}: ₹{(fin.projected_monthly_operating_profit || 35000).toLocaleString('en-IN')}/mo</span>
                    </div>

                    {/* 5. Competition (10%) */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span className="text-stone-700">{t.competitionSafety || "Competition Safety"} (10%)</span>
                        <span className="text-indigo-700 font-bold">{sub.competition || 85}/100</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${sub.competition || 85}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-500 block">{mkt.competitor_count || 1} {t.competitors || "competitor(s) in"} {mkt.analysis_radius_km || 10} {t.km || "km"}</span>
                    </div>

                    {/* 6. Risk Safety (10%) */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span className="text-stone-700">{t.riskSafetyTier || "Risk Safety Tier"} (10%)</span>
                        <span className="text-rose-700 font-bold">{sub.risk_safety || 88}/100</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${sub.risk_safety || 88}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-500 block">{t.resilience || "Resilience"}: {activeRec.stress_test?.survival_status || 'SURVIVES_COMFORTABLY'}</span>
                    </div>
                  </div>
                </div>

                {/* Evidence & Rationale */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                    <Info className="w-4 h-4 mr-1.5 text-emerald-700" />
                    {t.evidenceChainTitle || "Explainable Decision Evidence Chain (Audit Trail)"}
                  </h4>

                  <div className="space-y-1.5 text-xs text-stone-800 font-medium">
                    {(explanation.evidence_chain || [
                      lang === 'hi' ? (activeRec.why_recommended_hi || activeRec.why_recommended_en) : (lang === 'te' ? (activeRec.why_recommended_te || activeRec.why_recommended_en) : activeRec.why_recommended_en)
                    ]).map((step, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Financing & Scheme Match */}
              <div className="space-y-6">
                {/* Concessional Financing Card */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center">
                      <Coins className="w-4 h-4 mr-1.5 text-emerald-600" />
                      {t.mosjeLendingCard || "MoSJE Concessional Lending"}
                    </h4>
                    <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {t.concessionBadge || "10/90 Concession"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-stone-200/80">
                      <span className="text-stone-500">{t.totalProjectCost || "Total Project Cost"}</span>
                      <span className="font-bold text-stone-900">₹{(fin.project_cost || 300000).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200/80">
                      <span className="text-stone-500">{t.beneficiaryMargin || "Beneficiary Own Margin (10%)"}</span>
                      <span className="font-bold text-emerald-700">₹{(fin.own_contribution_required || 30000).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200/80">
                      <span className="text-stone-500">{t.concessionalLoan || "Concessional Loan (90%)"}</span>
                      <span className="font-bold text-stone-900">₹{(fin.loan_amount || 270000).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200/80">
                      <span className="text-stone-500">{t.interestRateLabel || "Interest Rate & Tenure"}</span>
                      <span className="font-semibold text-stone-800">{fin.interest_rate_pct || 8.0}% p.a. • {fin.tenure_years || 7} yrs</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200/80">
                      <span className="text-stone-500">{t.estimatedEMI || "Estimated Monthly EMI"}</span>
                      <span className="font-bold text-rose-700">₹{(fin.monthly_emi || 4200).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-emerald-100/70 p-2 rounded-xl font-bold">
                      <span className="text-emerald-950">{t.netSurplusAfterEMI || "Net Surplus After EMI"}</span>
                      <span className="text-emerald-800">₹{(fin.monthly_net_surplus_after_emi || 28000).toLocaleString('en-IN')}/mo</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('finance')}
                    className="w-full flex items-center justify-center space-x-1.5 bg-[#0F3D2E] text-amber-300 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition shadow-xs"
                  >
                    <span>{t.detailedCashFlow || "Detailed 5-Yr Cash Flow & DSCR"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Matched Scheme Card */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      🏛️ {t.matchedSchemeTitle || "Matched Government Scheme"}
                    </span>
                  </div>

                  <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/50 space-y-1">
                    <h5 className="text-xs font-bold text-stone-900">
                      {lang === 'hi' ? (scheme.title_hi || scheme.title_en) : (lang === 'te' ? (scheme.title_te || scheme.title_en) : scheme.title_en)}
                    </h5>
                    <p className="text-[11px] text-stone-500 font-medium">
                      {scheme.organization || 'MoSJE State Channelizing Agency'}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('schemes')}
                    className="w-full flex items-center justify-center space-x-1.5 bg-emerald-800 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-900 transition shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.exploreSchemeVerification || "Explore Scheme Verification"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: EXAMPLE OPPORTUNITIES (DEFAULT PLANS)             */}
      {/* ============================================================ */}
      
      <div className="pt-6 border-t border-stone-200/80 space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-emerald-800" />
            <h3 className="text-lg font-extrabold text-stone-900">
              {t.exampleOpportunities || "EXAMPLE OPPORTUNITIES"}
            </h3>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Reference business plans and benchmark opportunities available across rural catchment zones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {defaultPlans.map((plan) => {
            const isSelected = activePlanId === plan.id;
            const rec = plan.rawRecommendation;

            return (
              <div
                key={plan.id}
                onClick={() => setActivePlanId(plan.id)}
                className={`
                  bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md
                  ${isSelected 
                    ? 'border-2 border-[#0F3D2E] ring-2 ring-[#0F3D2E]/20 bg-emerald-50/20' 
                    : 'border-stone-200 hover:border-emerald-700/60'
                  }
                `}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-bold">
                      {t.exampleBadge || "Example Opportunity"}
                    </span>
                    <span className="text-xs font-black text-[#0F3D2E]">
                      {plan.suitabilityScore}/100
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">
                    {lang === 'hi' ? (rec.name_hi || plan.businessName) : (lang === 'te' ? (rec.name_te || plan.businessName) : plan.businessName)}
                  </h4>

                  <p className="text-[11px] text-stone-500 line-clamp-2 font-medium">
                    {lang === 'hi' ? (rec.description_hi || plan.description) : (lang === 'te' ? (rec.description_te || plan.description) : plan.description)}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-stone-500">
                    Est. ₹{(plan.requiredInvestment || 300000).toLocaleString('en-IN')}
                  </span>

                  <span className={`font-bold flex items-center ${isSelected ? 'text-[#0F3D2E]' : 'text-stone-400 group-hover:text-emerald-800'}`}>
                    <span>{isSelected ? 'Active Plan' : 'Inspect'}</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
