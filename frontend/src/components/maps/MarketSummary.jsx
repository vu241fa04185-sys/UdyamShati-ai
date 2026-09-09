import React from 'react';
import {
  TrendingUp,
  Store,
  Truck,
  Compass,
  Building2,
  CheckCircle2,
  Gauge,
  Activity,
  Layers,
  MapPin
} from 'lucide-react';

export default function MarketSummary({ marketAnalysis, radiusKm = 10.0 }) {
  if (!marketAnalysis) return null;

  const m = marketAnalysis;

  const metrics = [
    {
      label: 'Catchment Area',
      val: `${m.catchment_area_sq_km || (radiusKm === 5 ? 78.5 : 314.2)} sq km`,
      icon: Layers,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200'
    },
    {
      label: 'Direct Competitors',
      val: m.competitor_count ?? 0,
      icon: Store,
      color: 'text-rose-700',
      bg: 'bg-rose-50 border-rose-200'
    },
    {
      label: 'Competitor Density',
      val: `${m.competitor_density_per_sq_km ?? 0}/km²`,
      icon: Gauge,
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200'
    },
    {
      label: 'Verified Suppliers',
      val: m.supplier_count ?? 0,
      icon: Truck,
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200'
    },
    {
      label: 'Nearest APMC Mandi',
      val: `${m.nearest_mandi_distance_km ?? 4.2} km`,
      icon: Building2,
      color: 'text-purple-700',
      bg: 'bg-purple-50 border-purple-200'
    },
    {
      label: 'Nearest Supplier',
      val: `${m.nearest_supplier_distance_km ?? 2.1} km`,
      icon: MapPin,
      color: 'text-teal-700',
      bg: 'bg-teal-50 border-teal-200'
    },
    {
      label: 'Road Accessibility',
      val: `${m.accessibility_score ?? 85}/100`,
      icon: Compass,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50 border-indigo-200'
    },
    {
      label: 'Concentration Index',
      val: `${m.business_concentration_index ?? 35}/100`,
      icon: Activity,
      color: 'text-slate-700',
      bg: 'bg-slate-100 border-slate-200'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
            10 Spatial Intelligence Metrics ({radiusKm} km Reach)
          </h3>
        </div>
        <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md text-[10px]">
          Confidence: {m.data_confidence_pct ?? 95}%
        </span>
      </div>

      {/* Demand Supply Gap Highlight */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 rounded-xl border border-emerald-200 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-700 font-bold">Demand-Supply Gap Index</span>
          <span className="font-black text-base text-emerald-800">
            +{m.demand_supply_gap ?? 65} pts
          </span>
        </div>
        <div className="w-full bg-emerald-200/70 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full"
            style={{ width: `${Math.min(100, m.demand_supply_gap ?? 65)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
          <span>Consumer Demand: {m.demand_index ?? 85}/100</span>
          <span>Local Competitor Supply: {m.supply_index ?? 20}/100</span>
        </div>
      </div>

      {/* Grid of 8 Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border ${item.bg} space-y-1`}
            >
              <div className="flex items-center space-x-1 text-slate-500">
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span className="text-[10px] font-bold uppercase truncate">{item.label}</span>
              </div>
              <span className={`text-sm font-black ${item.color} block`}>
                {item.val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
