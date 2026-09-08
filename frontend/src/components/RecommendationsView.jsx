import React, { useState } from 'react';
import { 
  Building2, 
  Award, 
  ShieldCheck, 
  Coins, 
  TrendingUp, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Layers,
  FileText
} from 'lucide-react';
import { translations } from '../locales/translations';

export default function RecommendationsView({ recommendations, lang, setActiveTab }) {
  const t = translations[lang] || translations.en;
  const [selectedRecIndex, setSelectedRecIndex] = useState(0);

  const allRecs = recommendations?.all_recommendations || [];
  const activeRec = allRecs[selectedRecIndex] || recommendations?.top_recommendation;

  if (!activeRec) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Recommendations Computed Yet</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Please run the decision advisory or provide entrepreneur profile information.
        </p>
        <button
          onClick={() => setActiveTab('profile')}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold"
        >
          Go to Profile Studio
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Alternative Rank Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Explainable AI Decision Engine
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            Ranked Business Opportunities in Local Area ({mkt.reference_village || 'Local Area'})
          </h2>
        </div>

        {/* Candidate Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
          {allRecs.slice(0, 4).map((rec, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedRecIndex(idx)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedRecIndex === idx
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>#{idx + 1} {lang === 'hi' ? rec.name_hi : (lang === 'te' ? rec.name_te : rec.name_en)}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                selectedRecIndex === idx ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {rec.overall_suitability_score}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hero Recommendation Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Profile & Scores */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide">
                    Rank #{selectedRecIndex + 1} Recommended
                  </span>
                  <span className="text-xs font-medium text-slate-500 capitalize">
                    {activeRec.sector?.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {lang === 'hi' ? activeRec.name_hi : (lang === 'te' ? activeRec.name_te : activeRec.name_en)}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  {activeRec.description}
                </p>
              </div>

              {/* Suitability Score Gauge */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-4 rounded-2xl text-center min-w-[130px] shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 block">
                  Suitability
                </span>
                <span className="text-3xl font-black block leading-none my-1">
                  {activeRec.overall_suitability_score}
                </span>
                <span className="text-[10px] opacity-80 block">out of 100</span>
                <div className="mt-2 pt-2 border-t border-white/20 text-[10px] font-semibold text-emerald-100">
                  Confidence: {activeRec.confidence_score}%
                </div>
              </div>
            </div>

            {/* 6-Factor Multi-Criteria Decision Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Deterministic Scoring Sub-Dimensions (Weights Verified)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* 1. Market Opportunity (30%) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Local Market Opportunity (30% weight)</span>
                    <span className="text-emerald-700 font-bold">{sub.market_opportunity}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${sub.market_opportunity}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Demand Index: {mkt.demand_index} • Gap: {mkt.demand_supply_gap}</span>
                </div>

                {/* 2. Financial Feasibility (20%) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Financial Feasibility (20% weight)</span>
                    <span className="text-emerald-700 font-bold">{sub.financial_feasibility}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: `${sub.financial_feasibility}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">DSCR: {fin.dscr}x • Margin: ₹{(fin.own_contribution_required || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* 3. Skill Match (15%) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Skill Compatibility (15% weight)</span>
                    <span className="text-blue-700 font-bold">{sub.skill_compatibility}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${sub.skill_compatibility}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Aligns with verified past experience</span>
                </div>

                {/* 4. Profitability (15%) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Operating Profitability (15% weight)</span>
                    <span className="text-amber-700 font-bold">{sub.profitability}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${sub.profitability}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Profit: ₹{(fin.projected_monthly_operating_profit || 0).toLocaleString('en-IN')}/mo</span>
                </div>

                {/* 5. Competition (10%) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Competition Safety (10% weight)</span>
                    <span className="text-indigo-700 font-bold">{sub.competition}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${sub.competition}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">{mkt.competitor_count} competitor(s) in {mkt.analysis_radius_km} km</span>
                </div>

                {/* 6. Risk Safety (10%) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Risk Safety Tier (10% weight)</span>
                    <span className="text-rose-700 font-bold">{sub.risk_safety}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${sub.risk_safety}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Resilience: {activeRec.stress_test?.survival_status}</span>
                </div>
              </div>
            </div>

            {/* Explainable Reasoning Chain */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                <Info className="w-4 h-4 mr-1.5 text-emerald-700" />
                Explainable Decision Evidence Chain (Audit Trail)
              </h4>

              <div className="space-y-1.5 text-xs text-slate-700">
                {(explanation.evidence_chain || [activeRec.why_recommended_en]).map((step, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Snapshot & Scheme Match */}
        <div className="space-y-6">
          {/* Concessional Financing Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                <Coins className="w-4 h-4 mr-1.5 text-emerald-600" />
                MoSJE Concessional Lending
              </h4>
              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                10/90 Concession
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Total Project Cost</span>
                <span className="font-bold text-slate-900">₹{(fin.project_cost || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Beneficiary Own Margin (10%)</span>
                <span className="font-bold text-emerald-700">₹{(fin.own_contribution_required || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Concessional Loan (90%)</span>
                <span className="font-bold text-slate-900">₹{(fin.loan_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Interest Rate & Tenure</span>
                <span className="font-semibold text-slate-800">{fin.interest_rate_pct}% p.a. • {fin.tenure_years} Years</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Repayment Moratorium</span>
                <span className="font-semibold text-slate-800">{fin.moratorium_months} Months</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Estimated Monthly EMI</span>
                <span className="font-bold text-rose-700">₹{(fin.monthly_emi || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 bg-emerald-50 p-2 rounded-lg font-bold">
                <span className="text-emerald-900">Net Surplus After EMI</span>
                <span className="text-emerald-700">₹{(fin.monthly_net_surplus_after_emi || 0).toLocaleString('en-IN')}/mo</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('finance')}
              className="w-full flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl text-xs font-semibold transition"
            >
              <span>Detailed 5-Yr Cash Flow & DSCR</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Matched Scheme Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                🏛️ Matched MoSJE Scheme
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Verified: {scheme.last_verified_date || '2026-03-01'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-900">
                {lang === 'hi' ? scheme.title_hi : (lang === 'te' ? scheme.title_te : scheme.title_en)}
              </h5>
              <p className="text-[11px] text-slate-500">
                {scheme.organization}
              </p>
              <div className="text-[11px] text-slate-700 pt-1">
                Concessional lending @ {scheme.interest_rate_pct}% interest with {scheme.moratorium_months} months grace.
              </div>
            </div>

            <button
              onClick={() => setActiveTab('schemes')}
              className="w-full flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-semibold transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Explore Scheme Rule Verification</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
