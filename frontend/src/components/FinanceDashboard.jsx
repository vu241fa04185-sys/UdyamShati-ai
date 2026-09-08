import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Line 
} from 'recharts';
import { translations } from '../locales/translations';

export default function FinanceDashboard({ recommendations, profile, lang }) {
  const t = translations[lang] || translations.en;
  const topRec = recommendations?.top_recommendation;
  const fin = topRec?.financials || {};

  const [projectCost, setProjectCost] = useState(fin.project_cost || 300000);
  const [interestRate, setInterestRate] = useState(fin.interest_rate_pct || 8.0);
  const [tenureYears, setTenureYears] = useState(fin.tenure_years || 7);

  // Reducing balance EMI calculation
  const calculateEMI = (P, rAnnual, yrs) => {
    if (P <= 0) return 0;
    const r = (rAnnual / 100) / 12;
    const n = yrs * 12;
    if (r === 0) return Math.round(P / n);
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const ownMargin = Math.round(projectCost * 0.10);
  const loanReq = Math.round(projectCost * 0.90);
  const liveEmi = calculateEMI(loanReq, interestRate, tenureYears);
  const monthlyRevenue = fin.projected_monthly_revenue || 65000;
  const monthlyExpense = fin.projected_monthly_expense || 41000;
  const monthlyProfit = monthlyRevenue - monthlyExpense;
  const annualDebtService = liveEmi * 12;
  const annualCads = monthlyProfit * 12;
  const liveDscr = annualDebtService > 0 ? (annualCads / annualDebtService).toFixed(2) : 9.99;

  // Chart dataset for 5-Year Projection
  const chartData = (fin.projections || [
    { year: 'Year 1', revenue: 744000, expenses: 456000, debt_service: liveEmi * 12, net_cash_flow: 237500 },
    { year: 'Year 2', revenue: 781200, expenses: 471960, debt_service: liveEmi * 12, net_cash_flow: 258740 },
    { year: 'Year 3', revenue: 820260, expenses: 488478, debt_service: liveEmi * 12, net_cash_flow: 281282 },
    { year: 'Year 4', revenue: 861273, expenses: 505575, debt_service: liveEmi * 12, net_cash_flow: 305198 },
    { year: 'Year 5', revenue: 904336, expenses: 523270, debt_service: liveEmi * 12, net_cash_flow: 330566 }
  ]).map(item => ({
    ...item,
    debt_service: liveEmi * 12,
    net_cash_flow: item.revenue - item.expenses - (liveEmi * 12)
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center">
            <Coins className="w-4 h-4 mr-1.5 text-amber-500" />
            National Concessional Lending Structure • MoSJE Framework
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            Financial Structuring, Cash Flow & Debt Service Coverage Ratio (DSCR)
          </h2>
          <p className="text-xs text-slate-500">
            10% beneficiary margin and 90% concessional term loan via State Channelizing Agencies (NBCFDC/NSFDC).
          </p>
        </div>

        {/* DSCR Badge */}
        <div className={`px-5 py-3 rounded-2xl text-center border shadow-sm ${
          parseFloat(liveDscr) >= 1.50
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          <span className="text-[10px] uppercase font-extrabold tracking-wider block text-slate-500">
            DSCR Benchmark (≥ 1.50x)
          </span>
          <span className="text-2xl font-black block leading-tight text-emerald-700">
            {liveDscr}x
          </span>
          <span className="text-[11px] font-bold text-emerald-800">
            {parseFloat(liveDscr) >= 1.50 ? '✓ High Debt Safety Cushion' : 'Marginal Repayment Cushion'}
          </span>
        </div>
      </div>

      {/* 4 Key Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold">Total Project Cost</span>
          <div className="text-xl font-black text-slate-900">
            ₹{projectCost.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">Capital + Working Setup</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm space-y-1">
          <span className="text-emerald-800 font-semibold">10% Beneficiary Margin</span>
          <div className="text-xl font-black text-emerald-700">
            ₹{ownMargin.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">Mandatory Own Contribution</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold">90% Concessional Loan</span>
          <div className="text-xl font-black text-teal-800">
            ₹{loanReq.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">@ {interestRate}% p.a. Concession</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold">Monthly Reducing EMI</span>
          <div className="text-xl font-black text-rose-700">
            ₹{liveEmi.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">{tenureYears} Years Tenure</span>
        </div>
      </div>

      {/* Interactive Financial Simulator Sliders */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
          <Calculator className="w-4 h-4 mr-1.5 text-emerald-600" />
          Interactive Sensitivity Sliders (Test Different Loan Sizes)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="flex justify-between font-bold mb-1.5">
              <span>Project Scale / Investment</span>
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
              <span>Concessional Interest Rate</span>
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
              <span>Repayment Tenure</span>
              <span className="text-blue-700">{tenureYears} Years</span>
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
              5-Year Cash Flow & Debt Servicing Projection
            </h3>
            <span className="text-[11px] text-slate-400">Values in ₹</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenue" name="Annual Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Operating Expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debt_service" name="Debt Service (EMI)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_cash_flow" name="Net Cash Surplus" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating Economics & Break-Even Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-teal-600" />
            Monthly Operating Economics
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Projected Monthly Revenue</span>
              <span className="font-bold text-slate-900">₹{monthlyRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Monthly Operating Expenses</span>
              <span className="font-bold text-slate-700">₹{monthlyExpense.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Operating Profit (Pre-Debt)</span>
              <span className="font-bold text-emerald-700">₹{monthlyProfit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Monthly Loan EMI</span>
              <span className="font-bold text-rose-700">-₹{liveEmi.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <div className="flex justify-between text-emerald-950 font-bold">
                <span>Discretionary Surplus</span>
                <span className="text-sm text-emerald-700">₹{(monthlyProfit - liveEmi).toLocaleString('en-IN')}/mo</span>
              </div>
              <span className="text-[10px] text-emerald-700 mt-1 block">
                Retained rural household income after honoring debt service.
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
              <span className="font-bold block text-[11px]">Break-Even Monthly Revenue:</span>
              <span className="text-base font-extrabold text-slate-900">
                ₹{(fin.break_even_monthly_revenue || 35000).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Operating above break-even by {Math.round(((monthlyRevenue - (fin.break_even_monthly_revenue || 35000)) / monthlyRevenue) * 100)}% margin of safety.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
