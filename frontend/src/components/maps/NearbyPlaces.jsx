import React, { useState } from 'react';
import { Store, Star, Search, ChevronRight } from 'lucide-react';
import { translations } from '../../locales/translations';

export default function NearbyPlaces({
  places = [],
  radiusKm = 10,
  selectedPlaceId = null,
  onSelectPlace,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaces = places.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.formatted_address && p.formatted_address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Store className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            {t.placesInReach || "Places in Reach"} ({filteredPlaces.length})
          </h4>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold">{t.sortedByDistance || "Sorted by Road Distance"}</span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.filterPlacesPlaceholder || "Filter by shop name, category, or village..."}
          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Places List */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {filteredPlaces.length === 0 ? (
          <div className="p-6 text-center text-slate-400 space-y-1">
            <Store className="w-6 h-6 mx-auto opacity-40 mb-1" />
            <p>{(t.noPlacesFoundInRadius || "No places found matching your filter within this radius.").replace('{radius}', radiusKm)}</p>
          </div>
        ) : (
          filteredPlaces.map((place) => {
            const isSelected = selectedPlaceId === place.place_id || selectedPlaceId === place.id;
            const roadDist = place.road_distance_km || (place.straight_distance_km * 1.25).toFixed(1);
            const travelTime = place.estimated_travel_time_minutes || Math.round((roadDist / 30) * 60);

            return (
              <div
                key={place.place_id || place.id}
                onClick={() => onSelectPlace && onSelectPlace(place)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                    : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-black text-slate-900 truncate block text-xs">
                      {place.name}
                    </span>
                    {place.source === 'postgis_database' && (
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-bold shrink-0">
                        {t.localDbBadge || "Local DB"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-semibold uppercase text-[9px]">
                      {place.category_id || place.category}
                    </span>
                    <span className="flex items-center text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                      {place.rating || 4.2}
                    </span>
                    <span className="truncate">{place.formatted_address || place.vicinity || ''}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-800 text-xs block">
                    {roadDist} {t.km || "km"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ~{travelTime} min
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
