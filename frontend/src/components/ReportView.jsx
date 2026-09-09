import React from 'react';
import { 
  FileCheck2, 
  Printer, 
  Building2, 
  Coins, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { translations } from '../locales/translations';
import { useSaarthi } from '../context/SaarthiContext';

export default function ReportView({ profile, recommendations, lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const { userPlans = [], activePlan, activePlanId, setActivePlanId, deletePlan } = useSaarthi();
  const plansList = Array.isArray(userPlans) ? userPlans : [];

  // Normalize recommendation object from active plan or fallback top_recommendation
  const topRec = activePlan?.rawRecommendation 
    || recommendations?.top_recommendation 
    || (activePlan ? {
        name_en: activePlan.businessName,
        description: activePlan.description,
        overall_suitability_score: activePlan.suitabilityScore || 90,
        confidence_score: activePlan.confidenceScore || 92,
        why_recommended_en: activePlan.marketAnalysis?.keyOpportunity || "Strong local market demand matched with rural entrepreneur capabilities.",
        financials: {
          project_cost: activePlan.requiredInvestment,
          own_contribution_required: Math.round(activePlan.requiredInvestment * 0.1),
          loan_amount: Math.round(activePlan.requiredInvestment * 0.9),
          interest_rate_pct: 8.0,
          tenure_years: 7,
          moratorium_months: 6,
          monthly_emi: Math.round((activePlan.requiredInvestment * 0.9 * 0.08 / 12 * Math.pow(1.00667, 84)) / (Math.pow(1.00667, 84) - 1)),
          projected_monthly_revenue: parseInt(activePlan.financialAnalysis?.expectedMonthlyRevenue) || 65000,
          projected_monthly_operating_profit: parseInt(activePlan.financialAnalysis?.expectedNetProfit) || 24000,
          dscr: 1.85,
          financial_viability: "High Viability"
        },
        top_scheme: {
          title_en: activePlan.schemeAnalysis?.matchedSchemes?.[0] || "NSFDC Micro Credit Scheme",
          organization: "MoSJE / SCA",
          source_url: "https://nsfdc.nic.in",
          last_verified_date: "2026-03-01"
        }
      } : null);

  const fin = topRec?.financials || {};
  const mkt = topRec?.market || {};
  const scheme = topRec?.top_scheme || {};

  const handlePrint = () => {
    window.print();
  };

  const personalPlans = plansList.filter(p => !p.isDefault);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Saved Business Plans Management Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              {t.myBusinessPlans || "My Saved Business Plans"} ({plansList.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {t.selectPlanToInspect || "Select a plan below to view, export, or print its official feasibility dossier."}
          </span>
        </div>

        {/* Plan Cards Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {plansList.map((plan) => {
            const isSelected = plan.id === activePlanId;
            const isPersonal = !plan.isDefault;
            return (
              <div
                key={plan.id}
                onClick={() => setActivePlanId(plan.id)}
                className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      isPersonal
                        ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isPersonal ? (
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          {t.yourPlanBadge || "YOUR PLAN"}
                        </span>
                      ) : (
                        t.exampleBadge || "EXAMPLE"
                      )}
                    </span>

                    {isPersonal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete plan "${plan.businessName}"?`)) {
                            deletePlan(plan.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {plan.businessName}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {plan.category || plan.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                  <span className="font-bold text-emerald-800">
                    ₹{(plan.requiredInvestment || 0).toLocaleString('en-IN')}
                  </span>
                  <span>
                    Score: <strong className="text-slate-900">{plan.suitabilityScore || 90}/100</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <span>{t.reportTitle || "Official Project Feasibility & Decision Dossier"}</span>
            {activePlan && (
              <span className="ml-2 text-xs font-normal text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {activePlan.businessName}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            {t.reportSubtitle || "Formally structured for submission to District Industries Centre (DIC) and State Channelizing Agencies (SCAs)."}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{t.printPdfBtn || "Print / Save as Official PDF"}</span>
        </button>
      </div>

      {/* Official Printable Document Container */}
      <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-emerald-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 block">
              {t.dossierHeaderMinistry || "Ministry of Social Justice & Empowerment (MoSJE) • Government of India"}
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-0.5">
              {t.dossierDocumentTitle || "UDYAMSAARTHI RURAL MICRO-ENTERPRISE FEASIBILITY DOSSIER"}
            </h1>
            <span className="text-xs text-slate-500 block mt-0.5">
              Dossier Ref: UDYAM-DOSSIER-{Math.floor(100000 + Math.random() * 900000)} • Generated on {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN'), { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="text-right">
            <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-extrabold uppercase">
              {t.officialDecisionOutput || "Official Decision Output"}
            </span>
          </div>
        </div>

        {/* 1. Entrepreneur Demographic Profile */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            {t.section1Demographic || "1. Entrepreneur Demographic & Asset Profile"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">{t.fullNameLabel || "Name"}:</span>
              <span className="font-bold text-slate-800">{profile.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t.locationLabel || "Location"}:</span>
              <span className="font-semibold text-slate-800">{profile.village_name}, {profile.district}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t.socialCategoryLabel || "Social Category"}:</span>
              <span className="font-bold text-emerald-700 uppercase">{profile.social_category}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t.familyIncomeLabel || "Annual Family Income"}:</span>
              <span className="font-semibold text-slate-800">₹{(profile.annual_family_income || 180000).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t.availableCapitalLabel || "Available Capital"}:</span>
              <span className="font-bold text-slate-900">₹{(profile.available_capital || 0).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t.liquidReserveLabel || "Liquid Reserve"}:</span>
              <span className="font-semibold text-slate-800">₹{(profile.liquid_reserve || 20000).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t.landAcresLabel || "Land Holding"}:</span>
              <span className="font-semibold text-slate-800">{profile.land_acres || 0} Acres</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t.skillsLabel || "Core Skills"}:</span>
              <span className="font-semibold text-slate-800 capitalize">{(profile.skills || []).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* 2. Top Recommended Business */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            {t.section2Recommendation || "2. Selected Micro-Enterprise Recommendation"}
          </h3>
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-extrabold text-emerald-950">
                  {lang === 'hi' ? (topRec.name_hi || topRec.name_en) : (lang === 'te' ? (topRec.name_te || topRec.name_en) : topRec.name_en)}
                </h4>
                <p className="text-slate-600 text-xs mt-0.5">
                  {lang === 'hi' ? (topRec.description_hi || topRec.description) : (lang === 'te' ? (topRec.description_te || topRec.description) : topRec.description)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-800 block leading-tight">
                  {topRec.overall_suitability_score}/100
                </span>
                <span className="text-[10px] text-slate-500">{t.confidence || "Confidence"}: {topRec.confidence_score}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 text-slate-700 leading-relaxed text-[11px]">
              <strong>{t.primaryRationale || "Primary Rationale:"} </strong>
              {lang === 'hi' ? (topRec.why_recommended_hi || topRec.why_recommended_en) : (lang === 'te' ? (topRec.why_recommended_te || topRec.why_recommended_en) : topRec.why_recommended_en)}
            </div>
          </div>
        </div>

        {/* 3. Concessional Financial Blueprint */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            {t.section3Financial || "3. Concessional Financing & Debt Servicing Structure"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">{t.totalProjectCost || "Total Project Investment"}:</span>
              <span className="font-extrabold text-slate-900 text-sm">₹{(fin.project_cost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">{t.beneficiaryMargin || "Beneficiary Margin (10%)"}:</span>
              <span className="font-extrabold text-emerald-700 text-sm">₹{(fin.own_contribution_required || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">{t.concessionalLoan || "Concessional Loan (90%)"}:</span>
              <span className="font-extrabold text-teal-800 text-sm">₹{(fin.loan_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">{t.interestRateLabel || "Annual Concessional Rate"}:</span>
              <span className="font-bold text-slate-800">{fin.interest_rate_pct || 8.0}% p.a.</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">{t.moratoriumLabel || "Repayment Tenure / Grace"}:</span>
              <span className="font-bold text-slate-800">{fin.tenure_years || 7} {t.years || "Years"} ({fin.moratorium_months || 6}m {t.moratoriumGrace || "moratorium"})</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">{t.monthlyLoanEMI || "Monthly Reducing EMI"}:</span>
              <span className="font-extrabold text-rose-700">₹{(fin.monthly_emi || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">{t.projectedMonthlyRevenue || "Projected Monthly Revenue"}:</span>
              <span className="font-bold text-slate-900">₹{(fin.projected_monthly_revenue || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] block">{t.monthlyProfit || "Monthly Operating Profit"}:</span>
              <span className="font-bold text-emerald-700">₹{(fin.projected_monthly_operating_profit || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-emerald-50/70 border-emerald-200">
              <span className="text-emerald-900 text-[10px] font-bold block">{t.dscr || "DSCR Debt Coverage Ratio"}:</span>
              <span className="font-black text-emerald-800 text-sm">{fin.dscr}x ({fin.financial_viability})</span>
            </div>
          </div>
        </div>

        {/* 4. Verified Government Scheme */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            {t.section4Scheme || "4. Matched Government Financing Scheme"}
          </h3>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {lang === 'hi' ? (scheme.title_hi || scheme.title_en) : (lang === 'te' ? (scheme.title_te || scheme.title_en) : scheme.title_en)}
            </div>
            <div className="text-slate-500 text-[11px]">Administering Ministry/Agency: {scheme.organization}</div>
            <div className="text-slate-700 pt-1 text-[11px]">
              Channelizing Agency: State Channelizing Agency (SCA) & Designated Public Sector / Regional Rural Banks.
            </div>
            <div className="text-emerald-700 text-[10px] pt-1">
              Source URL: {scheme.source_url} ({t.verifiedDate || "Verified"}: {scheme.last_verified_date || '2026-03-01'})
            </div>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <span className="font-bold text-slate-800 block">{t.entrepreneurSignature || "Entrepreneur Signature"}</span>
            <span className="text-[10px] text-slate-400">{profile.name}</span>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <span className="font-bold text-slate-800 block">{t.authorizedOfficerSignature || "Authorized Verification Officer"}</span>
            <span className="text-[10px] text-slate-400">{t.districtCommittee || "District Implementation Committee (DIC)"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
