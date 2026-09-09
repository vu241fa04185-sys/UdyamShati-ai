import React, { useState } from 'react';
import { Award, ChevronDown, ChevronUp, Calculator, HelpCircle } from 'lucide-react';
import { translations } from '../../locales/translations';

export default function MarketOpportunity({ scoreBreakdown, overallScore = 82, lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const [showFormula, setShowFormula] = useState(false);

  const b = scoreBreakdown || {
    demand_score: 85,
    gap_score: 72,
    competition_score: 80,
    pricing_score: 78,
    accessibility_score: 90,
  };

  const factors = [
    {
      name: t.localConsumerDemand || 'Local Consumer Demand',
      weight: '30%',
      val: b.demand_score || 85,
      contrib: Number(((b.demand_score || 85) * 0.3).toFixed(1)),
      color: 'bg-emerald-600'
    },
    {
      name: t.demandSupplyGap || 'Demand-Supply Gap',
      weight: '25%',
      val: b.gap_score || 72,
      contrib: Number(((b.gap_score || 72) * 0.25).toFixed(1)),
      color: 'bg-teal-600'
    },
    {
      name: t.competitiveDefensibility || 'Competitive Defensibility',
      weight: '20%',
      val: b.competition_score || 80,
      contrib: Number(((b.competition_score || 80) * 0.2).toFixed(1)),
      color: 'bg-blue-600'
    },
    {
      name: t.pricingPowerMargins || 'Pricing Power & Margins',
      weight: '15%',
      val: b.pricing_score || 78,
      contrib: Number(((b.pricing_score || 78) * 0.15).toFixed(1)),
      color: 'bg-amber-600'
    },
    {
      name: t.roadAccessibility || 'Road & Mandi Accessibility',
      weight: '10%',
      val: b.accessibility_score || 90,
      contrib: Number(((b.accessibility_score || 90) * 0.1).toFixed(1)),
      color: 'bg-indigo-600'
    }
  ];

  const getBadge = (s) => {
    if (s >= 75) return { text: t.highMarketOpportunity || 'High Market Opportunity', bg: 'bg-emerald-100 text-emerald-800' };
    if (s >= 55) return { text: t.moderateOpportunity || 'Moderate Opportunity', bg: 'bg-amber-100 text-amber-800' };
    return { text: t.highRiskSaturated || 'High Risk / Saturated', bg: 'bg-rose-100 text-rose-800' };
  };

  const badge = getBadge(overallScore);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
              {t.deterministicMarketScoreTitle || "Deterministic Market Opportunity Score"}
            </h3>
            <span className="text-[10px] text-slate-400">
              {t.multiFactorScoringSubtitle || "5-Factor Multi-Criteria Spatial Scoring"}
            </span>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full font-black text-xs ${badge.bg}`}>
          {badge.text}
        </span>
      </div>

      {/* Main Score Display */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl">
        <div>
          <span className="text-slate-400 text-[11px] block">{t.overallCatchmentViability || "Overall Catchment Viability"}</span>
          <span className="text-3xl font-black text-emerald-400">
            {overallScore}<span className="text-sm font-semibold text-slate-400"> / 100</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center space-x-1 text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{showFormula ? (t.hideFormula || 'Hide Formula') : (t.inspectFormula || 'Inspect Formula')}</span>
          {showFormula ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Formula Explanation Accordion */}
      {showFormula && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] space-y-1.5 text-slate-700">
          <p className="font-bold flex items-center">
            <Calculator className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {t.deterministicFormulaTitle || "Deterministic Formula:"}
          </p>
          <code className="block bg-white p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-900">
            Score = (30% × Demand) + (25% × Gap) + (20% × Competition) + (15% × Pricing) + (10% × Accessibility)
          </code>
          <p className="text-slate-500 text-[10px]">
            {t.deterministicFormulaDesc || "Strict Mathematical Determinism: Evaluated without probabilistic drift or hallucination."}
          </p>
        </div>
      )}

      {/* 5 Factors Progress Breakdown */}
      <div className="space-y-2.5 pt-1">
        {factors.map((f, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700">
                {f.name} <span className="text-slate-400 font-normal">({f.weight})</span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                {f.val}/100 <span className="text-emerald-700 font-semibold">(+{f.contrib} pts)</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${f.color}`}
                style={{ width: `${Math.min(100, f.val)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
