import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ArrowRight, 
  TrendingUp, 
  Coins, 
  CheckCircle2, 
  BarChart2, 
  RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import { translations } from '../locales/translations';

export default function SimulatorView({ profile, recommendations, lang }) {
  const t = translations[lang] || translations.en;
  const topRec = recommendations?.top_recommendation;

  const [scenarioA, setScenarioA] = useState({
    name: 'Scenario A (Conservative Scale)',
    project_cost: 300000,
    available_capital: 300000,
    liquid_reserve: 20000,
    interest_rate: 8.0,
    tenure_years: 7,
    monthly_revenue: 65000,
    monthly_expense: 41000
  });

  const [scenarioB, setScenarioB] = useState({
    name: 'Scenario B (Expansion Scale)',
    project_cost: 600000,
    available_capital: 450000,
    liquid_reserve: 30000,
    interest_rate: 8.0,
    tenure_years: 7,
    monthly_revenue: 110000,
    monthly_expense: 66000
  });

  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/simulation', {
        scenario_a: scenarioA,
        scenario_b: scenarioB
      });
      setSimResults(res.data);
    } catch (err) {
      console.error("Error simulating what-if:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const resA = simResults?.scenario_a?.results;
  const resB = simResults?.scenario_b?.results;
  const deltas = simResults?.deltas;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center">
            <Sliders className="w-4 h-4 mr-1.5" />
            Strategic Business Scenario Simulator
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            What-If Scenario Comparison (Conservative vs Expansion)
          </h2>
          <p className="text-xs text-slate-500">
            Compare business viability across different capital commitments, loan tenures, and operating scales.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Simulating...' : 'Recalculate Scenarios'}</span>
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
              {scenarioA.name}
            </h3>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
              Baseline
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Project Cost</span>
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
                <span>Monthly Revenue Expected</span>
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
                <span className="text-slate-500">10% Own Margin:</span>
                <span className="font-bold text-slate-800">₹{resA.own_contribution_required.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Concessional Loan (90%):</span>
                <span className="font-bold text-slate-800">₹{resA.loan_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly EMI:</span>
                <span className="font-bold text-rose-600">₹{resA.monthly_emi.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operating Profit:</span>
                <span className="font-bold text-emerald-700">₹{resA.projected_monthly_operating_profit.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-900">
                <span>DSCR Ratio:</span>
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
              {scenarioB.name}
            </h3>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
              Scaled Option
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Project Cost</span>
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
                <span>Monthly Revenue Expected</span>
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
                <span className="text-slate-500">10% Own Margin:</span>
                <span className="font-bold text-slate-800">₹{resB.own_contribution_required.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Concessional Loan (90%):</span>
                <span className="font-bold text-slate-800">₹{resB.loan_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly EMI:</span>
                <span className="font-bold text-rose-600">₹{resB.monthly_emi.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operating Profit:</span>
                <span className="font-bold text-emerald-700">₹{resB.projected_monthly_operating_profit.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-emerald-200 text-slate-900">
                <span>DSCR Ratio:</span>
                <span className="text-emerald-700">{resB.dscr}x ({resB.financial_viability})</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
