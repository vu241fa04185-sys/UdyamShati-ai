import React from 'react';
import { Globe2 } from 'lucide-react';

export default function LanguageSelector({ lang, setLang, variant = 'light' }) {
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'hi', label: 'हिंदी' },
  ];

  return (
    <div 
      className={`inline-flex items-center space-x-1 p-1 rounded-2xl border transition-all ${
        variant === 'dark' 
          ? 'bg-slate-100/90 border-slate-200 shadow-inner' 
          : 'bg-forest/60 backdrop-blur-md border-emerald-800/80 shadow-sm'
      }`}
      aria-label="Language selection"
    >
      <Globe2 className={`w-3.5 h-3.5 ml-1.5 mr-0.5 ${variant === 'dark' ? 'text-forest' : 'text-earthy-gold'}`} />
      
      {languages.map((item) => {
        const isActive = lang === item.code;
        return (
          <button
            key={item.code}
            onClick={() => setLang(item.code)}
            type="button"
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 ${
              isActive
                ? variant === 'dark'
                  ? 'bg-forest text-white shadow-md scale-105'
                  : 'bg-emerald-green text-white shadow-md scale-105'
                : variant === 'dark'
                  ? 'text-charcoal hover:bg-slate-200 hover:text-forest'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
            aria-pressed={isActive}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
