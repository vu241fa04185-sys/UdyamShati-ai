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
  Sparkles,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';
import { translations } from '../locales/translations';

export default function SchemeMatcher({ profile, recommendations, lang }) {
  const t = translations[lang] || translations.en;
  const topRec = recommendations?.top_recommendation;
  const projectCost = topRec?.financials?.project_cost || 300000;

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState([]);
  const [ragSearching, setRagSearching] = useState(false);

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      try {
        const res = await axios.post('/api/scheme-matching', {
          profile: profile,
          project_cost: projectCost
        });
        setSchemes(res.data || []);
      } catch (err) {
        console.error("Error evaluating schemes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, [profile, projectCost]);

  const handleRagSearch = async (e) => {
    e?.preventDefault();
    if (!ragQuery.trim()) return;

    setRagSearching(true);
    try {
      const res = await axios.post('/api/rag/search', {
        query: ragQuery,
        top_k: 3
      });
      setRagResults(res.data || []);
    } catch (err) {
      console.error("Error retrieving RAG docs:", err);
    } finally {
      setRagSearching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Deterministic Rule Engine • MoSJE Concessional Framework
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            Government Scheme Eligibility & Concessional Matcher
          </h2>
          <p className="text-xs text-slate-500">
            Rules evaluated deterministically without LLM hallucinations. Source-verified against official gazettes.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs text-emerald-800">
          <span className="font-semibold block">Applicant Profile Match:</span>
          <span>Category: <strong className="uppercase">{profile.social_category}</strong> • Family Income: <strong>₹{(profile.annual_family_income || 180000).toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* RAG Knowledge Retrieval Bar */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold">
            RAG Government Knowledge System (Verified Circulars & Guidelines)
          </h3>
        </div>
        <p className="text-xs text-emerald-200/90 max-w-2xl">
          Search authoritative MoSJE guidelines, interest rate notifications, required verification documents, or moratorium rules.
        </p>

        <form onSubmit={handleRagSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="e.g., What documents are required for NBCFDC term loan? or PMEGP margin subsidy..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder:text-emerald-200/60 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <button
            type="submit"
            disabled={ragSearching}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ragSearching ? 'Retrieving...' : 'Search Guidelines'}</span>
          </button>
        </form>

        {/* RAG Results Display */}
        {ragResults.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/15 space-y-2">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide block">
              Retrieved Official Excerpts ({ragResults.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {ragResults.map((r, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/15 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-emerald-300 text-xs">{r.title}</span>
                    <a
                      href={r.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-emerald-300 flex items-center text-[10px] space-x-0.5"
                    >
                      <span>Source</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="text-[10px] text-emerald-200/80 font-medium">{r.section}</div>
                  <p className="text-[11px] text-emerald-100 leading-relaxed">{r.text}</p>
                  <div className="text-[10px] text-emerald-300/60 pt-1 border-t border-white/10">
                    Verified: {r.verified_date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schemes Grid with Deterministic Rule Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {schemes.map((scheme, idx) => {
          const isEligible = scheme.is_eligible;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition ${
                isEligible ? 'border-emerald-300 ring-1 ring-emerald-400/20' : 'border-slate-200 opacity-80'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {scheme.organization}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {lang === 'hi' ? scheme.title_hi : (lang === 'te' ? scheme.title_te : scheme.title_en)}
                    </h4>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 ${
                    isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isEligible ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {isEligible ? 'QUALIFIED' : 'NOT ELIGIBLE'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Key Financing Terms Pill Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Interest Rate</span>
                    <span className="font-extrabold text-emerald-700">{scheme.interest_rate_pct}% p.a.</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Margin / Loan</span>
                    <span className="font-bold text-slate-800">{scheme.beneficiary_margin_pct}% / {scheme.concessional_loan_pct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Tenure / Grace</span>
                    <span className="font-bold text-slate-800">{scheme.tenure_years}y / {scheme.moratorium_months}m</span>
                  </div>
                </div>

                {/* Deterministic Rules Checklist */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Criteria Rule Verification:
                  </span>
                  {scheme.rules_passed?.map((r, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] leading-tight">{r.description}</span>
                    </div>
                  ))}
                  {scheme.rules_failed?.map((r, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-rose-600">
                      <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] leading-tight font-medium">{r.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer with Portal Link & Verified Date */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center text-[10px] text-slate-400 space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Verified: {scheme.last_verified_date}</span>
                </div>

                <a
                  href={scheme.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 font-bold text-emerald-700 hover:text-emerald-800 transition"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
