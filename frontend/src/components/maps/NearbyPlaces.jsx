import React, { useState } from 'react';
import { Store, Star, Search, ChevronRight, Navigation, Phone, MapPin } from 'lucide-react';
import { translations } from '../../locales/translations';
import { getCategoryStyle } from './GoogleMap';

export default function NearbyPlaces({
  places = [],
  radiusKm = 5,
  selectedPlace = null,
  selectedPlaceId = null,
  onSelectPlace,
  searchQuery = '',
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;
  const [filterText, setFilterText] = useState('');

  const activeSelectedId = selectedPlace?.place_id || selectedPlace?.id || selectedPlaceId;

  const filteredPlaces = places.filter((p) => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.category_code && p.category_code.toLowerCase().includes(q)) ||
      (p.category_label && p.category_label.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.formatted_address && p.formatted_address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Store className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              {t.placesInReach || "Verified Businesses in Radius"} ({filteredPlaces.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold block">
              Within {radiusKm} km • Sorted Nearest First
            </span>
          </div>
        </div>
      </div>

      {/* Filter Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder={t.filterPlacesPlaceholder || "Filter results by name, village, or keyword..."}
          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white transition"
        />
      </div>

      {/* Places List */}
      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredPlaces.length === 0 ? (
          <div className="p-6 text-center text-slate-500 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Store className="w-7 h-7 mx-auto text-slate-400 opacity-60" />
            <p className="font-medium text-xs">
              No businesses found within {radiusKm} km.
            </p>
            <p className="text-[11px] text-slate-400">
              Try increasing the search radius to 10 km or adjust your keyword.
            </p>
          </div>
        ) : (
          filteredPlaces.map((place) => {
            const isSelected = activeSelectedId === place.place_id || activeSelectedId === place.id;
            const dist = place.straight_distance_km !== undefined ? place.straight_distance_km : place.road_distance_km;
            const style = getCategoryStyle(place.category_code || place.category_id || place.category);
            const reviewsCount = place.user_ratings_total || 0;

            return (
              <div
                key={place.place_id || place.id}
                onClick={() => onSelectPlace && onSelectPlace(place)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2 min-w-0">
                    <span className="text-base shrink-0 p-1.5 rounded-lg bg-white shadow-2xs border border-slate-100">
                      {style.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 truncate block text-xs">
                          {place.name}
                        </span>
                        {place.source === 'postgis_database' && (
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-semibold shrink-0">
                            Verified DB
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span
                          className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          {style.label || place.category_code || place.category}
                        </span>
                        {place.rating && (
                          <span className="flex items-center text-amber-600 font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                            {place.rating} {reviewsCount > 0 ? `(${reviewsCount})` : ''}
                          </span>
                        )}
                        {place.business_status && (
                          <span className={`text-[9px] font-bold ${place.business_status === 'OPERATIONAL' ? 'text-emerald-700' : 'text-slate-400'}`}>
                            • {place.business_status === 'OPERATIONAL' ? 'Operational' : place.business_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-emerald-800 text-xs flex items-center justify-end">
                      <MapPin className="w-3 h-3 mr-0.5 text-emerald-600" />
                      {dist} km
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      away
                    </span>
                  </div>
                </div>

                {/* Address and Directions */}
                <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                  <span className="truncate flex-1">
                    {place.address || place.formatted_address || place.vicinity || 'Rural Commercial Zone'}
                  </span>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#0F3D2E] text-amber-300 font-bold hover:bg-[#165440] transition shrink-0 shadow-2xs"
                  >
                    <Navigation className="w-2.5 h-2.5" />
                    <span>Directions</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
