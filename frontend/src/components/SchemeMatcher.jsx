import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import { translations } from '../locales/translations';
import { useSaarthi } from '../context/SaarthiContext';

export default function SchemeMatcher({ profile, recommendations, lang = 'en' }) {
  const t = translations[lang] || translations.en;
  
  let saarthiCtx = null;
  try {
    saarthiCtx = useSaarthi();
  } catch (e) {}

  const activePayload = saarthiCtx?.getActiveRecommendationPayload() || recommendations;
  const topRec = activePayload?.top_recommendation;
  const projectCost = topRec?.financials?.project_cost || 300000;

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState([]);
  const [ragSearching, setRagSearching] = useState(false);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      try {
        const res = await axios.post('/api/scheme-matching', {
          profile: profile,
          project_cost: projectCost,
          language: lang
        });
        setSchemes(res.data || []);
      } catch (err) {
        console.error("Error evaluating schemes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, [profile, projectCost, lang]);

  const handleRagSearch = async (e) => {
    e?.preventDefault();
    if (!ragQuery.trim()) return;

    setRagSearching(true);
    try {
      const res = await axios.post('/api/rag/search', {
        query: ragQuery,
        top_k: 3,
        language: lang
      });
      setRagResults(res.data || []);
    } catch (err) {
      console.error("Error retrieving RAG docs:", err);
    } finally {
      setRagSearching(false);
    }
  };

  const filteredSchemes = schemes.filter(s => {
    const title = lang === 'hi' ? (s.title_hi || s.title_en) : (lang === 'te' ? (s.title_te || s.title_en) : s.title_en);
    const org = s.organization || '';
    const q = filterText.toLowerCase();
    return title.toLowerCase().includes(q) || org.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
            {t.verifiedEligibility || "Verified Eligibility"} • MoSJE & Central Guidelines
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {t.schemesPageTitle || "Government Concessional Schemes & Rules"}
          </h2>
          <p className="text-xs text-slate-500">
            {t.schemesPageSubtitle || "Direct rule engine verification for MoSJE, NBCFDC, NSFDC, Mudra, and PMEGP."}
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={t.searchSchemesPlaceholder || "Search scheme by name, category, or keyword..."}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0F3D2E]"
          />
        </div>
      </div>

      {/* RAG Circular Policy Search */}
      <div className="bg-gradient-to-r from-[#0F3D2E] to-[#165440] text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h3 className="text-sm font-bold text-amber-100">
            {t.ragTitle || "AI Policy Search (Circulars & Guidelines)"}
          </h3>
        </div>

        <form onSubmit={handleRagSearch} className="flex gap-2">
          <input
            type="text"
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder={t.ragSearchPlaceholder || "Search official circulars, guidelines, or loan terms..."}
            className="flex-1 px-4 py-2 bg-white/10 text-white placeholder-emerald-200 text-xs rounded-xl border border-white/20 focus:outline-none"
          />
          <button
            type="submit"
            disabled={ragSearching}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-bold text-xs rounded-xl transition"
          >
            {ragSearching ? 'Searching...' : (t.send || 'Search')}
          </button>
        </form>

        {ragResults.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 space-y-2 border border-white/10 text-xs">
            {ragResults.map((doc, idx) => (
              <div key={idx} className="border-b border-white/10 pb-2 last:border-0 last:pb-0">
                <span className="font-bold text-amber-300 block">{doc.title}</span>
                <p className="text-[11px] text-emerald-100">{doc.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-[#0F3D2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold text-slate-600">{t.verifyingEligibilityLoading || "Verifying scheme eligibility against official rules..."}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSchemes.map((scheme, idx) => {
            const isEligible = scheme.is_eligible ?? true;
            const title = lang === 'hi' ? (scheme.title_hi || scheme.title_en) : (lang === 'te' ? (scheme.title_te || scheme.title_en) : scheme.title_en);
            const desc = lang === 'hi' ? (scheme.description_hi || scheme.description_en) : (lang === 'te' ? (scheme.description_te || scheme.description_en) : scheme.description_en);

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {scheme.organization || 'MoSJE Agency'}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                        {title}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 flex items-center space-x-1 ${
                      isEligible 
                        ? 'bg-emerald-100 text-[#0F3D2E] border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {isEligible ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>{isEligible ? (t.qualifiedBadge || "Qualified") : (t.notQualifiedBadge || "Not Eligible")}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {desc}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{t.maxLoanAmount || "Max Loan Amount"}</span>
                      <span className="font-bold text-slate-800">₹{(scheme.max_loan_amount || projectCost).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{t.interestRateRange || "Interest Rate"}</span>
                      <span className="font-bold text-emerald-700">{scheme.interest_rate_pct || 8.0}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{t.ownMargin || "Beneficiary Margin"}</span>
                      <span className="font-semibold text-slate-800">{scheme.beneficiary_margin_pct || 10}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{t.moratoriumGrace || "Grace Period"}</span>
                      <span className="font-semibold text-slate-800">{scheme.moratorium_months || 6} {t.months || "Months"}</span>
                    </div>
                  </div>

                  {scheme.eligibility_reasons && (
                    <div className="space-y-1 text-[11px]">
                      <span className="font-bold text-slate-700 block">{t.eligibilityCriteria || "Eligibility Criteria"}:</span>
                      {scheme.eligibility_reasons.map((r, rIdx) => (
                        <div key={rIdx} className="flex items-center space-x-1.5 text-slate-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href={scheme.official_url || "https://socialjustice.gov.in"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#165440] text-amber-300 text-xs font-bold text-center transition flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <span>{t.applyNow || "Apply via Official Portal"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
