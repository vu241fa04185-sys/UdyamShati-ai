import React from 'react';
import { Target } from 'lucide-react';
import { translations } from '../../locales/translations';

export default function RadiusSelector({ radiusKm, setRadiusKm, disabled = false, lang = 'en' }) {
  const t = translations[lang] || translations.en;

  const options = [
    { km: 5.0, area: '78.5 sq km', desc: t.radius5kmDesc || 'Immediate Village Catchment' },
    { km: 10.0, area: '314.2 sq km', desc: t.radius10kmDesc || 'Cluster & Mandi Corridor' },
    { km: 15.0, area: '706.9 sq km', desc: t.radius15kmDesc || 'Regional Tehsil Belt' }
  ];

  const currentOption = options.find((o) => o.km === radiusKm) || options[1];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {t.catchmentRadiusLabel || "Catchment Analysis Radius"}
          </span>
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-extrabold text-slate-800">
              {radiusKm} {t.km || "km"} Radius
            </span>
            <span className="text-slate-300">•</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
              {currentOption.area} {t.analyzedText || "Analyzed"}
            </span>
          </div>
        </div>
      </div>

      {/* Selector Buttons */}
      <div className="inline-flex bg-slate-100 p-1 rounded-xl shadow-inner">
        {options.map((opt) => {
          const isActive = radiusKm === opt.km;
          return (
            <button
              key={opt.km}
              type="button"
              disabled={disabled}
              onClick={() => setRadiusKm && setRadiusKm(opt.km)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-sm scale-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{opt.km} KM</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
