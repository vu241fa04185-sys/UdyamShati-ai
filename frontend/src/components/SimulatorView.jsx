import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import { translations } from '../locales/translations';
import { useSaarthi } from '../context/SaarthiContext';

export default function SimulatorView({ profile, recommendations, lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const { activePlan } = useSaarthi();

  const planCost = activePlan?.requiredInvestment 
    || activePlan?.rawRecommendation?.financials?.project_cost 
    || 300000;
  const planRevenue = activePlan?.rawRecommendation?.financials?.projected_monthly_revenue 
    || (activePlan?.financialAnalysis?.expectedMonthlyRevenue ? parseInt(activePlan.financialAnalysis.expectedMonthlyRevenue) : 65000);

  const [scenarioA, setScenarioA] = useState({
    name: t.scenarioAName || 'Scenario A (Conservative Scale)',
    project_cost: planCost,
    available_capital: profile?.available_capital || planCost,
    liquid_reserve: profile?.liquid_reserve || 20000,
    interest_rate: 8.0,
    tenure_years: 7,
    monthly_revenue: planRevenue,
    monthly_expense: Math.round(planRevenue * 0.6)
  });

  const [scenarioB, setScenarioB] = useState({
    name: t.scenarioBName || 'Scenario B (Expansion Scale)',
    project_cost: Math.round(planCost * 1.5),
    available_capital: Math.round((profile?.available_capital || planCost) * 1.3),
    liquid_reserve: 30000,
    interest_rate: 8.0,
    tenure_years: 7,
    monthly_revenue: Math.round(planRevenue * 1.6),
    monthly_expense: Math.round(planRevenue * 0.95)
  });

  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Synchronize scenarios if activePlan changes
  useEffect(() => {
    setScenarioA(prev => ({
      ...prev,
      project_cost: planCost,
      monthly_revenue: planRevenue,
      monthly_expense: Math.round(planRevenue * 0.6)
    }));
    setScenarioB(prev => ({
      ...prev,
      project_cost: Math.round(planCost * 1.5),
      monthly_revenue: Math.round(planRevenue * 1.6),
      monthly_expense: Math.round(planRevenue * 0.95)
    }));
  }, [activePlan?.id]);

  // Fallback local calculation when backend API is unavailable
  const computeLocalSimulation = (scA, scB) => {
    const calcScenario = (sc) => {
      const own = Math.round(sc.project_cost * 0.1);
      const loan = Math.round(sc.project_cost * 0.9);
      const r = (sc.interest_rate / 100) / 12;
      const n = sc.tenure_years * 12;
      const emi = Math.round((loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      const profit = sc.monthly_revenue - sc.monthly_expense;
      const netProfit = profit - emi;
      const dscr = emi > 0 ? parseFloat((profit / emi).toFixed(2)) : 3.5;
      const viability = dscr >= 1.5 ? "High Viability" : dscr >= 1.1 ? "Moderate Viability" : "Stressed";
      return {
        own_contribution_required: own,
        loan_amount: loan,
        monthly_emi: emi,
        projected_monthly_operating_profit: profit,
        net_monthly_profit: netProfit,
        dscr,
        financial_viability: viability
      };
    };

    const resA = calcScenario(scA);
    const resB = calcScenario(scB);
    return {
      scenario_a: { results: resA },
      scenario_b: { results: resB },
      comparative_summary: `Scenario B increases monthly operating profit by ₹${(resB.projected_monthly_operating_profit - resA.projected_monthly_operating_profit).toLocaleString('en-IN')}/mo with a DSCR of ${resB.dscr}x.`
    };
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/simulation', {
        scenario_a: scenarioA,
        scenario_b: scenarioB,
        language: lang
      });
      if (res.data && res.data.scenario_a) {
        setSimResults(res.data);
      } else {
        setSimResults(computeLocalSimulation(scenarioA, scenarioB));
      }
    } catch (err) {
      console.warn("Backend simulation API not reachable, using intelligent client-side simulation engine.");
      setSimResults(computeLocalSimulation(scenarioA, scenarioB));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [lang, scenarioA.project_cost, scenarioA.monthly_revenue, scenarioB.project_cost, scenarioB.monthly_revenue]);

  const resA = simResults?.scenario_a?.results;
  const resB = simResults?.scenario_b?.results;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center">
            <Sliders className="w-4 h-4 mr-1.5" />
            {t.simulatorTag || "Strategic Business Scenario Simulator"}
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {t.simulatorTitle || "What-If Scenario Comparison (Conservative vs Expansion)"}
          </h2>
          <p className="text-xs text-slate-500">
            {t.simulatorSubtitle || "Compare business viability across different capital commitments, loan tenures, and operating scales."}
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-[#0F3D2E] hover:bg-[#165440] disabled:opacity-50 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? (t.simulatingBtn || 'Simulating...') : (t.recalculateBtn || 'Recalculate Scenarios')}</span>
        </button>
      </div>

      {/* Comparative Summary Pill */}
      {simResults?.comparative_summary && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed font-medium">
            {simResults.comparative_summary}
          </p>
        </div>
      )}

      {/* Side-by-Side Sliders & Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario A Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 mr-2" />
              {t.scenarioAName || scenarioA.name}
            </h3>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
              {t.baselineBadge || "Baseline"}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>{t.totalProjectCost || "Project Cost"}</span>
                <span className="font-bold text-slate-900">₹{scenarioA.project_cost.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="100000"
                max="1000000"
                step="25000"
                value={scenarioA.project_cost}
                onChange={(e) => setScenarioA({ ...scenarioA, project_cost: parseFloat(e.target.value) })}
                className="w-full accent-slate-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>{t.monthlyRevenueExpected || "Monthly Revenue Expected"}</span>
                <span className="font-bold text-emerald-700">₹{scenarioA.monthly_revenue.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="30000"
                max="150000"
                step="5000"
                value={scenarioA.monthly_revenue}
                onChange={(e) => setScenarioA({ ...scenarioA, monthly_revenue: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {resA && (
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs bg-slate-50 p-3 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.ownMargin || "10% Beneficiary Margin"}:</span>
                <span className="font-bold text-slate-800">₹{resA.own_contribution_required.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.concessionalLoan || "Concessional Loan (90%)"}:</span>
                <span className="font-bold text-slate-800">₹{resA.loan_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.monthlyEMI || "Monthly EMI"}:</span>
                <span className="font-bold text-rose-600">₹{resA.monthly_emi.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.monthlyProfit || "Operating Profit"}:</span>
                <span className="font-bold text-emerald-700">₹{resA.projected_monthly_operating_profit.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-900">
                <span>{t.dscr || "DSCR Ratio"}:</span>
                <span className="text-emerald-700">{resA.dscr}x ({resA.financial_viability})</span>
              </div>
            </div>
          )}
        </div>

        {/* Scenario B Card */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-300 ring-1 ring-emerald-400/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-2" />
              {t.scenarioBName || scenarioB.name}
            </h3>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
              {t.scaledOptionBadge || "Scaled Option"}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>{t.totalProjectCost || "Project Cost"}</span>
                <span className="font-bold text-emerald-700">₹{scenarioB.project_cost.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="200000"
                max="1500000"
                step="25000"
                value={scenarioB.project_cost}
                onChange={(e) => setScenarioB({ ...scenarioB, project_cost: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>{t.monthlyRevenueExpected || "Monthly Revenue Expected"}</span>
                <span className="font-bold text-emerald-700">₹{scenarioB.monthly_revenue.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="50000"
                max="250000"
                step="5000"
                value={scenarioB.monthly_revenue}
                onChange={(e) => setScenarioB({ ...scenarioB, monthly_revenue: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {resB && (
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.ownMargin || "10% Beneficiary Margin"}:</span>
                <span className="font-bold text-slate-800">₹{resB.own_contribution_required.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.concessionalLoan || "Concessional Loan (90%)"}:</span>
                <span className="font-bold text-slate-800">₹{resB.loan_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.monthlyEMI || "Monthly EMI"}:</span>
                <span className="font-bold text-rose-600">₹{resB.monthly_emi.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.monthlyProfit || "Operating Profit"}:</span>
                <span className="font-bold text-emerald-700">₹{resB.projected_monthly_operating_profit.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-emerald-200 text-slate-900">
                <span>{t.dscr || "DSCR Ratio"}:</span>
                <span className="text-emerald-700">{resB.dscr}x ({resB.financial_viability})</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
