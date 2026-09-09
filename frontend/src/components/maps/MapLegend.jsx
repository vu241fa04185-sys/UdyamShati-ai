import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { translations } from '../../locales/translations';

export default function MapLegend({ isHeatmapActive, setIsHeatmapActive, lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const [isOpen, setIsOpen] = useState(false);

  const legendItems = [
    { icon: '📍', label: t.entrepreneurLocation || 'Entrepreneur Location', color: '#047857', badge: t.centerBadge || 'Center' },
    { icon: '🐄', label: t.dairyCategory || 'Dairy & Milk', color: '#2563eb' },
    { icon: '🐔', label: t.poultryCategory || 'Poultry & Broiler', color: '#ea580c' },
    { icon: '🌾', label: t.agriCategory || 'Agri & Seeds', color: '#16a34a' },
    { icon: '📦', label: t.foodCategory || 'Food Processing', color: '#d97706' },
    { icon: '🏪', label: t.retailCategory || 'Retail & Kirana', color: '#7c3aed' },
    { icon: '🏥', label: t.healthcareCategory || 'Healthcare & Vet', color: '#dc2626' },
    { icon: '⛽', label: t.transportCategory || 'Fuel & Logistics', color: '#0891b2' },
    { icon: '🚜', label: t.servicesCategory || 'Banking & Machinery', color: '#475569' },
    { icon: '🛒', label: t.apmcMandi || 'APMC Regional Mandi', color: '#6d28d9', badge: t.mandiBadge || 'Mandi' }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
          <span className="font-bold text-slate-800">{t.mapLegendTitle || "Map Legend & Layers"}</span>
        </div>

        <div className="flex items-center space-x-2">
          {setIsHeatmapActive && (
            <button
              type="button"
              onClick={() => setIsHeatmapActive(!isHeatmapActive)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition ${
                isHeatmapActive
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{isHeatmapActive ? (t.heatmapOn || 'Heatmap: ON') : (t.heatmapOff || 'Heatmap: OFF')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-1.5 p-1 rounded-lg hover:bg-slate-50">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-sm border border-white"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                {item.icon}
              </span>
              <span className="text-[11px] font-medium text-slate-700 truncate">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-bold">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
