import React from 'react';
import { 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';
import { translations } from '../../locales/translations';

export default function LowerDashboard({ language = 'en', lang }) {
  const activeLang = language || lang || 'en';
  const t = translations[activeLang] || translations.en;

  return (
    <div className="space-y-6 mt-8">
      
      {/* 1. WHY UDYAMSAARTHI CARD */}
      <div className="bg-gradient-to-br from-[#0F3D2E]/5 via-[#0F3D2E]/10 to-amber-500/5 rounded-3xl p-6 border border-[#0F3D2E]/15 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#C28A17]" />
          <h3 className="text-base font-extrabold text-[#0F3D2E]">
            {t.whyUdyamSaarthi || t.whyUdyamSaarthiTitle || 'Why UdyamSaarthi?'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start space-x-2.5 bg-white/80 p-3.5 rounded-2xl border border-emerald-900/10 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-stone-700 leading-snug">
              {t.reason1 || t.whyPoint1 || 'Personalized recommendations based on your location'}
            </span>
          </div>

          <div className="flex items-start space-x-2.5 bg-white/80 p-3.5 rounded-2xl border border-emerald-900/10 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-stone-700 leading-snug">
              {t.reason2 || t.whyPoint2 || 'Access to government schemes & concessional loans'}
            </span>
          </div>

          <div className="flex items-start space-x-2.5 bg-white/80 p-3.5 rounded-2xl border border-emerald-900/10 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-stone-700 leading-snug">
              {t.reason3 || t.whyPoint3 || 'Financial planning made simple'}
            </span>
          </div>

          <div className="flex items-start space-x-2.5 bg-white/80 p-3.5 rounded-2xl border border-emerald-900/10 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-stone-700 leading-snug">
              {t.reason4 || t.whyPoint4 || 'Guidance you can trust step by step'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
