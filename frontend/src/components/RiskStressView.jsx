import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  TrendingDown, 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  Sliders, 
  RefreshCw 
} from 'lucide-react';
import { translations } from '../locales/translations';

export default function RiskStressView({ recommendations, lang }) {
  const t = translations[lang] || translations.en;
  const topRec = recommendations?.top_recommendation;
  const riskData = topRec?.risks || {};
  const fin = topRec?.financials || {};

  const [revShock, setRevShock] = useState(-20);
  const [expShock, setExpShock] = useState(15);

  const baseRev = fin.projected_monthly_revenue || 65000;
  const baseExp = fin.projected_monthly_expense || 41000;
  const monthlyEmi = fin.monthly_emi || 4200;

  // Live Stress Recalculation
  const stressedRev = Math.round(baseRev * (1 + revShock / 100));
  const stressedExp = Math.round(baseExp * (1 + expShock / 100));
  const stressedProfit = stressedRev - stressedExp;
  const stressedCads = stressedProfit * 12;
  const annualDebt = monthlyEmi * 12;
  const stressedDscr = annualDebt > 0 ? (stressedCads / annualDebt).toFixed(2) : 9.99;
  const netSurplus = stressedProfit - monthlyEmi;

  let survivalBadge = { text: 'SURVIVES COMFORTABLY', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (parseFloat(stressedDscr) < 1.0) {
    survivalBadge = { text: 'DEBT DISTRESS / VULNERABLE', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  } else if (parseFloat(stressedDscr) < 1.25) {
    survivalBadge = { text: 'SURVIVES TIGHTLY', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            7-Axis Risk Framework & Macro Shock Simulator
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            Risk Analysis & Stress Testing Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Assesses viability under unfavorable monsoon, price crashes, and input inflation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center text-xs">
            <span className="text-slate-400 block text-[10px]">Risk Safety Score</span>
            <span className="text-lg font-black text-emerald-700">{riskData.risk_safety_score || 82}/100</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center text-xs">
            <span className="text-slate-400 block text-[10px]">Overall Severity</span>
            <span className="text-lg font-black text-slate-800">{riskData.overall_severity || 'LOW'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Economic Shock Simulator */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center">
              <Activity className="w-4 h-4 mr-1.5" />
              Real-Time Stress Testing Simulator
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Simulate Economic Shock: Market Revenue Drop & Expense Escalation
            </h3>
          </div>

          <div className={`px-3 py-1.5 rounded-full border text-xs font-extrabold ${survivalBadge.color}`}>
            {survivalBadge.text}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-300">Revenue Shock (Mandi Price / Demand Drop)</span>
              <span className="text-rose-400 font-extrabold">{revShock}%</span>
            </div>
            <input
              type="range"
              min="-40"
              max="0"
              step="5"
              value={revShock}
              onChange={(e) => setRevShock(parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Simulates adverse weather, crop glut, or lean tourism season.
            </span>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-300">Expense Shock (Feed, Fuel & Power Inflation)</span>
              <span className="text-amber-400 font-extrabold">+{expShock}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="5"
              value={expShock}
              onChange={(e) => setExpShock(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Simulates fertilizer price spike, diesel hike, or feed shortage.
            </span>
          </div>
        </div>

        {/* Recalculated Stressed Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[11px]">Stressed Monthly Revenue</span>
            <span className="text-sm font-bold text-white">₹{stressedRev.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-rose-400 block">was ₹{baseRev.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[11px]">Stressed Monthly Expense</span>
            <span className="text-sm font-bold text-white">₹{stressedExp.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-amber-400 block">was ₹{baseExp.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[11px]">Stressed Monthly Profit</span>
            <span className="text-sm font-bold text-emerald-400">₹{stressedProfit.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 block">EMI: ₹{monthlyEmi.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[11px]">Stressed DSCR</span>
            <span className="text-lg font-black text-teal-300 leading-tight">{stressedDscr}x</span>
            <span className="text-[10px] text-slate-300 block">Surplus: ₹{netSurplus.toLocaleString('en-IN')}/mo</span>
          </div>
        </div>
      </div>

      {/* 7 Risk Dimensions Table & Concrete Mitigations */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          7 Core Risk Dimensions & Farmer-Specific Mitigations
        </h3>

        <div className="space-y-3">
          {(riskData.factors || []).map((f, idx) => {
            const isHigh = f.severity === 'HIGH';
            const isMed = f.severity === 'MEDIUM';
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 md:max-w-md">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{f.dimension}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isHigh ? 'bg-rose-100 text-rose-800' : (isMed ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {f.severity} RISK ({f.score}/25)
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    <strong className="text-slate-800">Actionable Mitigation: </strong>
                    {f.mitigation}
                  </p>
                </div>

                <div className="flex items-center space-x-4 text-center">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Probability</span>
                    <span className="font-bold text-slate-800">{f.probability}/5</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Impact</span>
                    <span className="font-bold text-slate-800">{f.impact}/5</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
