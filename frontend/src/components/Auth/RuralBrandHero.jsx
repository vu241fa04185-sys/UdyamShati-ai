import React from 'react';
import BrandLogo from './BrandLogo';
import { Sprout, IndianRupee, Landmark, TrendingUp, Users, HeartHandshake, ShieldCheck } from 'lucide-react';
import ruralHeroImg from '../../assets/rural_entrepreneur_hero.jpg';
import { translations } from '../../locales/translations';

export default function RuralBrandHero({ lang }) {
  const t = translations[lang] || translations.en;

  const features = [
    {
      id: 'opp',
      label: t.featureOpportunities || 'Discover Opportunities',
      icon: Sprout,
    },
    {
      id: 'fin',
      label: t.featureFinances || 'Plan Finances',
      icon: IndianRupee,
    },
    {
      id: 'sch',
      label: t.featureSchemes || 'Explore Schemes',
      icon: Landmark,
    },
    {
      id: 'fut',
      label: t.featureFuture || 'Build a Better Future',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="relative w-full h-full min-h-[600px] lg:min-h-screen flex flex-col justify-between overflow-hidden select-none bg-forest">
      
      {/* REALISTIC CINEMATIC RURAL INDIA HERO IMAGE FULL-BLEED BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={ruralHeroImg}
          alt="Confident Indian Rural Entrepreneur"
          className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.05]"
        />

        {/* Dedicated Soft Cream Gradient Overlay on Left Side so Text NEVER Overlaps Center Entrepreneur */}
        <div className="absolute inset-0 bg-gradient-to-r from-cream/95 via-cream/85 to-transparent w-full lg:w-[58%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-transparent to-cream/50 w-full" />
      </div>

      {/* TOP BAR: BRANDING + EMPOWER | ENABLE | EXPAND */}
      <div className="relative z-10 p-6 lg:p-10 flex flex-wrap items-center justify-between gap-4">
        {/* Top-Left Logo */}
        <div className="w-[250px] sm:w-[280px]">
          <BrandLogo size="large" theme="light" />
        </div>

        {/* Top-Center Branding: Empower | Enable | Expand */}
        <div className="hidden sm:flex items-center space-x-2 font-script text-2xl lg:text-3xl font-bold text-forest tracking-wide">
          <span>{t.empower || 'Empower'}</span>
          <span className="text-gold font-sans font-semibold text-base">•</span>
          <span>{t.enable || 'Enable'}</span>
          <span className="text-gold font-sans font-semibold text-base">•</span>
          <span>{t.expand || 'Expand'}</span>
        </div>
      </div>

      {/* MIDDLE HERO AREA: CONSTRAINED LEFT TEXT-SAFE REGION (40-45% WIDTH) */}
      <div className="relative z-10 px-6 lg:px-10 my-auto w-full lg:w-[48%] max-w-xl py-4">
        
        {/* Main Hero Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] mb-4 text-forest max-w-md">
          {t.ruralHeroHeadline || 'Turn Your Idea into a'}{' '}
          <span className="text-gold block sm:inline drop-shadow-xs">
            {t.thrivingEnterprise || 'Thriving Enterprise.'}
          </span>
        </h1>

        {/* Concise Supporting Copy (No paragraphs, NO quotes) */}
        <div className="space-y-1 mb-8 max-w-md">
          <p className="text-sm sm:text-base font-extrabold text-forest/90 leading-snug">
            {t.heroSub1 || 'AI-driven insights. Local opportunities.'}
          </p>
          <p className="text-xs sm:text-sm font-bold text-forest/80">
            {t.heroSub2 || 'Financial guidance. All in one place.'}
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-gold tracking-wide pt-1">
            {t.heroSub3 || 'For every rural entrepreneur.'}
          </p>
        </div>

        {/* 4 ELEGANT CIRCULAR ICON FEATURES (FLOATING NATURALLY IN LEFT TEXT-SAFE AREA) */}
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className="flex items-center space-x-3 p-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-gold/40 shadow-xs hover:border-forest transition"
              >
                <div className="w-9 h-9 rounded-full border-2 border-gold bg-white flex items-center justify-center text-forest shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-forest leading-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM LEFT: ORGANIC FOREST GREEN WAVE FOOTER */}
      <div className="relative z-10 mt-auto">
        <svg 
          className="w-full h-10 text-forest -mb-1 block" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,0 C300,90 800,10 1200,60 L1200,120 L0,120 Z" />
        </svg>

        <div className="bg-forest text-white px-6 lg:px-10 py-4 border-t border-gold/40 shadow-2xl">
          <div className="max-w-xl grid grid-cols-3 gap-2 text-center">
            
            <div className="flex flex-col items-center">
              <Users className="w-3.5 h-3.5 text-gold mb-1" />
              <span className="text-[11px] font-bold text-white leading-tight">
                {t.empowerRuralIndia || 'Empowering Rural India'}
              </span>
            </div>

            <div className="flex flex-col items-center border-x border-emerald-800/80 px-2">
              <HeartHandshake className="w-3.5 h-3.5 text-gold mb-1" />
              <span className="text-[11px] font-bold text-white leading-tight">
                {t.enablingEntrepreneurs || 'Enabling Entrepreneurs'}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-gold mb-1" />
              <span className="text-[11px] font-bold text-white leading-tight">
                {t.buildingCommunities || 'Building Sustainable Communities'}
              </span>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
