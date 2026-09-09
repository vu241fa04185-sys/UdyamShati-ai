import React from 'react';
import { Layers, Flame, Eye } from 'lucide-react';

export default function CompetitionHeatmap({
  isActive,
  onToggle,
  densityScore = 0.42
}) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex items-center justify-between text-xs">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
          isActive ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
        }`}>
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <span className="font-extrabold text-slate-800 block text-xs">
            Competition Density Heatmap
          </span>
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
            <span>Density Level:</span>
            <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600" />
            <span className="font-semibold text-slate-700">Hotspots</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
          isActive
            ? 'bg-rose-600 text-white shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>{isActive ? 'Layer Active' : 'Show Layer'}</span>
      </button>
    </div>
  );
}
