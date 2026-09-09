import React from 'react';
import { ArrowRight, Sprout } from 'lucide-react';
import heroImg from '../../assets/rural_entrepreneur_hero.jpg';
import { translations } from '../../locales/translations';

export default function HeroBanner({ userName, onStartAnalysis, lang = 'en' }) {
  const t = translations[lang] || translations.en;

  // Get time-based greeting key
  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning || 'Good morning';
    if (hour < 17) return t.goodAfternoon || 'Good afternoon';
    return t.goodEvening || 'Good evening';
  };

  const firstName = userName ? userName.split(' ')[0] : 'Entrepreneur';

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#0F3D2E] text-white shadow-xl border border-emerald-800/40">
      
      {/* Background Image Layer with Right-Side Positioning */}
      <div 
        className="absolute inset-0 bg-cover bg-right sm:bg-right-top opacity-35 sm:opacity-45 mix-blend-luminosity transform scale-105"
        style={{ backgroundImage: `url(${heroImg})` }}
      />

      {/* Text-Safe Gradient Overlay (Left to Right) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F3D2E] via-[#0F3D2E]/90 to-transparent sm:w-3/4" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F3D2E]/80 via-transparent to-transparent" />

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-10 max-w-2xl flex flex-col justify-between min-h-[240px] sm:min-h-[280px]">
        
        {/* Top Tag */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-semibold w-fit mb-3">
          <Sprout className="w-3.5 h-3.5 text-amber-300" />
          <span>{t.missionBadge || "Bharat Rural Enterprise Mission"}</span>
        </div>

        {/* Greeting & Headline */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-100 tracking-tight leading-tight">
            {getGreetingText()}, <span className="text-amber-400">{firstName}</span>! ☀️
          </h1>
          <p className="text-lg sm:text-xl font-bold text-white mt-1 leading-snug">
            {t.heroHeadline || "Your ideas can create a stronger tomorrow."}
          </p>
          <p className="text-xs sm:text-sm text-stone-200 mt-2 font-normal leading-relaxed max-w-lg">
            {t.heroSupportingText || "Talk to UdyamSaarthi — your AI companion for business guidance, financial planning and government support."}
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="mt-6">
          <button
            onClick={onStartAnalysis}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-[#C28A17] hover:bg-[#b07d14] text-white font-bold text-sm shadow-lg shadow-amber-900/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <span>{t.startAnalysisBtn || "Start New Business Analysis →"}</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

      </div>
    </div>
  );
}
