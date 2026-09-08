import React from 'react';
import { 
  FileCheck2, 
  Printer, 
  Building2, 
  Coins, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar 
} from 'lucide-react';
import { translations } from '../locales/translations';

export default function ReportView({ profile, recommendations, lang }) {
  const t = translations[lang] || translations.en;
  const topRec = recommendations?.top_recommendation;
  const fin = topRec?.financials || {};
  const mkt = topRec?.market || {};
  const scheme = topRec?.top_scheme || {};

  const handlePrint = () => {
    window.print();
  };

  if (!topRec) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-2xl mx-auto text-slate-500 text-xs">
        No advisory report generated yet. Please run the decision engine.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Official Project Feasibility & Decision Dossier
          </h2>
          <p className="text-xs text-slate-500">
            Formally structured for submission to District Industries Centre (DIC) and State Channelizing Agencies (SCAs).
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save as Official PDF</span>
        </button>
      </div>

      {/* Official Printable Document Container */}
      <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-emerald-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 block">
              Ministry of Social Justice & Empowerment (MoSJE) • Government of India
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-0.5">
              UDYAMSETU RURAL MICRO-ENTERPRISE FEASIBILITY DOSSIER
            </h1>
            <span className="text-xs text-slate-500 block mt-0.5">
              Dossier Ref: UDYAM-DOSSIER-{Math.floor(100000 + Math.random() * 900000)} • Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="text-right">
            <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-extrabold uppercase">
              Official Decision Output
            </span>
          </div>
        </div>

        {/* 1. Entrepreneur Demographic Profile */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            1. Entrepreneur Demographic & Asset Profile
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">Name:</span>
              <span className="font-bold text-slate-800">{profile.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Location:</span>
              <span className="font-semibold text-slate-800">{profile.village_name}, {profile.district}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Social Category:</span>
              <span className="font-bold text-emerald-700 uppercase">{profile.social_category}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Annual Family Income:</span>
              <span className="font-semibold text-slate-800">₹{(profile.annual_family_income || 180000).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Available Capital:</span>
              <span className="font-bold text-slate-900">₹{(profile.available_capital || 0).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Liquid Reserve:</span>
              <span className="font-semibold text-slate-800">₹{(profile.liquid_reserve || 20000).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Land Holding:</span>
              <span className="font-semibold text-slate-800">{profile.land_acres || 0} Acres</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Core Skills:</span>
              <span className="font-semibold text-slate-800 capitalize">{(profile.skills || []).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* 2. Top Recommended Business */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            2. Selected Micro-Enterprise Recommendation
          </h3>
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-extrabold text-emerald-950">
                  {lang === 'hi' ? topRec.name_hi : (lang === 'te' ? topRec.name_te : topRec.name_en)}
                </h4>
                <p className="text-slate-600 text-xs mt-0.5">{topRec.description}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-800 block leading-tight">
                  {topRec.overall_suitability_score}/100
                </span>
                <span className="text-[10px] text-slate-500">Confidence: {topRec.confidence_score}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 text-slate-700 leading-relaxed text-[11px]">
              <strong>Primary Rationale: </strong>
              {topRec.why_recommended_en}
            </div>
          </div>
        </div>

        {/* 3. Concessional Financial Blueprint */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            3. Concessional Financing & Debt Servicing Structure
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">Total Project Investment:</span>
              <span className="font-extrabold text-slate-900 text-sm">₹{(fin.project_cost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">Beneficiary Margin (10%):</span>
              <span className="font-extrabold text-emerald-700 text-sm">₹{(fin.own_contribution_required || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">Concessional Loan (90%):</span>
              <span className="font-extrabold text-teal-800 text-sm">₹{(fin.loan_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">Annual Concessional Rate:</span>
              <span className="font-bold text-slate-800">{fin.interest_rate_pct}% p.a.</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">Repayment Tenure / Grace:</span>
              <span className="font-bold text-slate-800">{fin.tenure_years} Years ({fin.moratorium_months}m moratorium)</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">Monthly Reducing EMI:</span>
              <span className="font-extrabold text-rose-700">₹{(fin.monthly_emi || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">Projected Monthly Revenue:</span>
              <span className="font-bold text-slate-900">₹{(fin.projected_monthly_revenue || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">Monthly Operating Profit:</span>
              <span className="font-bold text-emerald-700">₹{(fin.projected_monthly_operating_profit || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-emerald-50/70 border-emerald-200">
              <span className="text-emerald-900 text-[10px] font-bold block">DSCR Debt Coverage Ratio:</span>
              <span className="font-black text-emerald-800 text-sm">{fin.dscr}x ({fin.financial_viability})</span>
            </div>
          </div>
        </div>

        {/* 4. Verified Government Scheme */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            4. Matched Government Financing Scheme
          </h3>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900 text-sm">{scheme.title_en}</div>
            <div className="text-slate-500 text-[11px]">Administering Ministry/Agency: {scheme.organization}</div>
            <div className="text-slate-700 pt-1 text-[11px]">
              Channelizing Agency: State Channelizing Agency (SCA) & Designated Public Sector / Regional Rural Banks.
            </div>
            <div className="text-emerald-700 text-[10px] pt-1">
              Source URL: {scheme.source_url} (Verified: {scheme.last_verified_date})
            </div>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <span className="font-bold text-slate-800 block">Entrepreneur Signature</span>
            <span className="text-[10px] text-slate-400">{profile.name}</span>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <span className="font-bold text-slate-800 block">Authorized Verification Officer</span>
            <span className="text-[10px] text-slate-400">District Implementation Committee (DIC)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
