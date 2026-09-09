import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  MapPin,
  Crosshair,
  Search,
  Sparkles,
  X,
  Compass,
  Store,
  Star,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Layers,
  Map as MapIcon,
  List as ListIcon
} from 'lucide-react';
import GoogleMap, { getCategoryStyle } from './maps/GoogleMap';
import RadiusSelector from './maps/RadiusSelector';
import MapLegend from './maps/MapLegend';
import NearbyPlaces from './maps/NearbyPlaces';
import MarketOpportunity from './maps/MarketOpportunity';
import { detectAccurateLocation } from '../utils/geolocation';
import { translations } from '../locales/translations';
import { useSaarthi } from '../context/SaarthiContext';

export default function MarketMapView({
  profile = {},
  setProfile,
  recommendations,
  lang = 'en',
  onLocationUpdate
}) {
  const t = translations[lang] || translations.en;
  const { activePlan, mapSearchState, setMapSearchState } = useSaarthi();

  // Active Location Coordinates
  const lat = profile.latitude || 20.1706;
  const lon = profile.longitude || 73.9840;
  const villageName = profile.village_name || 'Pimpalgaon Baswant';
  const district = profile.district || 'Nashik';
  const state = profile.state || 'Maharashtra';

  // Search & Filter State
  const [radiusKm, setRadiusKm] = useState(mapSearchState?.radius_km || 5.0);
  const [selectedCategory, setSelectedCategory] = useState(mapSearchState?.category || 'ALL');
  const [searchQuery, setSearchQuery] = useState(mapSearchState?.query || '');
  const [places, setPlaces] = useState([]);
  const [businessIntelligence, setBusinessIntelligence] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // View Mode: 'map' | 'list'
  const [viewMode, setViewMode] = useState('map');

  // Village Center Relocation State
  const [villageSearchInput, setVillageSearchInput] = useState('');
  const [isRelocatingVillage, setIsRelocatingVillage] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Google Maps API Key handling
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [apiKey] = useState(() => {
    return localStorage.getItem('udyamsetu_gmaps_key') || envKey;
  });

  // Popular Indian Rural Benchmark Hubs
  const popularHubs = [
    { name: 'Pimpalgaon Baswant (Nashik)', lat: 20.1706, lon: 73.9840, district: 'Nashik', state: 'Maharashtra' },
    { name: 'Kankipadu (Krishna)', lat: 16.4258, lon: 80.7712, district: 'Krishna', state: 'Andhra Pradesh' },
    { name: 'Chaubeypur (Varanasi)', lat: 25.4380, lon: 83.0560, district: 'Varanasi', state: 'Uttar Pradesh' },
    { name: 'Mogri Rural (Anand)', lat: 22.5360, lon: 72.9340, district: 'Anand', state: 'Gujarat' }
  ];

  // Quick Search Chips for Rural & Semi-Urban Businesses
  const QUICK_SEARCH_CHIPS = [
    { id: 'ALL', label: t.allPlacesChip || 'All Places', icon: '🏢', query: '' },
    { id: 'DAIRY', label: 'Milk / Dairy', icon: '🥛', query: 'milk shop' },
    { id: 'GROCERY', label: 'Grocery / Kirana', icon: '🏪', query: 'grocery store' },
    { id: 'PHARMACY', label: 'Pharmacy / Medical', icon: '💊', query: 'pharmacy' },
    { id: 'AGRICULTURE_SEEDS', label: 'Fertilizer & Seeds', icon: '🌾', query: 'fertilizer shop' },
    { id: 'POULTRY', label: 'Poultry Farm', icon: '🐔', query: 'poultry shop' },
    { id: 'MECHANIC', label: 'Auto & Mechanic', icon: '🔧', query: 'mechanic' },
    { id: 'PETROL_PUMP', label: 'Petrol Pump', icon: '⛽', query: 'petrol pump' },
    { id: 'FARM_EQUIPMENT', label: 'Farm Equipment', icon: '🚜', query: 'farm equipment' },
    { id: 'BAKERY', label: 'Bakery & Sweets', icon: '🍞', query: 'bakery' },
    { id: 'RESTAURANT', label: 'Restaurant / Dhaba', icon: '🍽️', query: 'restaurant' },
    { id: 'TAILOR', label: 'Tailor & Cloth', icon: '✂️', query: 'tailor' },
    { id: 'SALON', label: 'Salon & Barber', icon: '💈', query: 'salon' }
  ];

  // Sync from cross-component SaarthiContext mapSearchState if set by AI Chat
  useEffect(() => {
    if (mapSearchState?.query !== undefined && mapSearchState?.query !== '') {
      setSearchQuery(mapSearchState.query);
    }
    if (mapSearchState?.category) {
      setSelectedCategory(mapSearchState.category);
    }
    if (mapSearchState?.radius_km) {
      setRadiusKm(mapSearchState.radius_km);
    }
  }, [mapSearchState]);

  // Primary Fetch: Searches Places & Computes Business Intelligence
  const fetchPlacesAndAnalysis = useCallback(async (currentLat, currentLon, currentRadius, currentQuery, currentCat) => {
    setIsLoading(true);
    try {
      const topRec = activePlan?.rawRecommendation || recommendations?.top_recommendation;
      const categoryCode = topRec?.category_code || activePlan?.category || 'VEGETABLE_FARMING';

      const [searchRes, analysisRes] = await Promise.all([
        axios.post('/api/maps/search', {
          latitude: currentLat,
          longitude: currentLon,
          radius_km: currentRadius,
          query: (currentQuery || '').trim(),
          category: currentCat || 'ALL',
          apiKey: apiKey,
          language: lang
        }),
        axios.post('/api/maps/market-analysis', {
          latitude: currentLat,
          longitude: currentLon,
          category_code: categoryCode,
          radius_km: currentRadius,
          language: lang
        }).catch((err) => {
          console.warn('Market analysis fallback:', err.message);
          return { data: null };
        })
      ]);

      if (searchRes.data && searchRes.data.success) {
        setPlaces(searchRes.data.places || []);
        setBusinessIntelligence(searchRes.data.business_intelligence || null);
      }
      if (analysisRes && analysisRes.data) {
        setMarketAnalysis(analysisRes.data);
      }
    } catch (err) {
      console.error('Error fetching search places:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, lang, activePlan, recommendations]);

  // Trigger search when coordinates, radius, or category change
  useEffect(() => {
    fetchPlacesAndAnalysis(lat, lon, radiusKm, searchQuery, selectedCategory);
  }, [lat, lon, radiusKm, selectedCategory, fetchPlacesAndAnalysis]);

  // Submit text search manually
  const handleBusinessSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchPlacesAndAnalysis(lat, lon, radiusKm, searchQuery, selectedCategory);
  };

  // Clear business search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    if (setMapSearchState) {
      setMapSearchState({ query: '', category: 'ALL', radius_km: radiusKm });
    }
    fetchPlacesAndAnalysis(lat, lon, radiusKm, '', 'ALL');
  };

  // Quick chip click
  const handleChipSelect = (chip) => {
    setSelectedCategory(chip.id);
    setSearchQuery(chip.query);
    if (setMapSearchState) {
      setMapSearchState({ query: chip.query, category: chip.id, radius_km: radiusKm });
    }
    fetchPlacesAndAnalysis(lat, lon, radiusKm, chip.query, chip.id);
  };

  // Relocate Search Center: Interactive Map Click
  const handleMapLocationChange = (coords) => {
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
    const newLat = parseFloat(coords.lat.toFixed(4));
    const newLon = parseFloat(coords.lng.toFixed(4));

    if (onLocationUpdate) {
      onLocationUpdate({
        ...profile,
        village_name: `Point (${newLat.toFixed(3)}°N, ${newLon.toFixed(3)}°E)`,
        latitude: newLat,
        longitude: newLon
      });
    }
  };

  // Relocate Search Center: Hub Selection
  const handleHubSelect = (hub) => {
    if (onLocationUpdate) {
      onLocationUpdate({
        ...profile,
        village_name: hub.name.split(' ')[0],
        district: hub.district,
        state: hub.state,
        latitude: hub.lat,
        longitude: hub.lon
      });
    }
  };

  // Relocate Search Center: Live GPS
  const handleDetectGPS = async () => {
    setIsLocating(true);
    try {
      const accurateLoc = await detectAccurateLocation();
      if (accurateLoc && onLocationUpdate) {
        onLocationUpdate({
          ...profile,
          district: accurateLoc.district || profile.district,
          state: accurateLoc.state || profile.state,
          latitude: accurateLoc.latitude || profile.latitude,
          longitude: accurateLoc.longitude || profile.longitude
        });
      }
    } catch (e) {
      console.warn('GPS detection notice:', e);
    } finally {
      setIsLocating(false);
    }
  };

  // Relocate Search Center: Village Geocoding
  const handleVillageGeocodeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!villageSearchInput.trim()) return;

    setIsRelocatingVillage(true);
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(villageSearchInput + ', India')}`;
      const response = await axios.get(geoUrl);

      if (response.data && response.data.length > 0) {
        const first = response.data[0];
        const newLat = parseFloat(first.lat);
        const newLon = parseFloat(first.lon);

        const parts = first.display_name.split(',').map((s) => s.trim());
        const detectedVillage = parts[0] || villageSearchInput;
        const detectedDistrict = parts.length > 2 ? parts[parts.length - 3] : district;
        const detectedState = parts.length > 1 ? parts[parts.length - 2] : state;

        if (onLocationUpdate) {
          onLocationUpdate({
            ...profile,
            village_name: detectedVillage,
            district: detectedDistrict,
            state: detectedState,
            latitude: newLat,
            longitude: newLon
          });
        }
        setVillageSearchInput('');
      }
    } catch (err) {
      console.warn('Village geocoding notice:', err);
    } finally {
      setIsRelocatingVillage(false);
    }
  };

  // Competition level badge formatting
  const renderCompetitionBadge = (level) => {
    switch (level) {
      case 'None':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            🟢 {t.competitionNone || 'No Direct Competition (First Mover Opportunity)'}
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            🟢 {t.competitionLow || 'Low Competition (Favorable)'}
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            🟡 {t.competitionModerate || 'Moderate Competition (Differentiated Entry Needed)'}
          </span>
        );
      case 'High':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            🔴 {t.competitionHigh || 'High Competition (Saturated Market)'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. TOP HEADER & LIVE GPS BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center">
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            {t.gisIntelligenceTag || 'Hyper-Local Google Maps Intelligence'}
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {t.gisTitle || 'Multi-Factor Spatial Catchment & Competitor Map'}
          </h2>
          <p className="text-xs text-slate-500">
            {t.gisSubtitle || 'Live GPS catchment analysis, competitor density mapping, and APMC mandi benchmarks.'}
          </p>
        </div>

        {/* Action Controls: Live GPS & View Switch */}
        <div className="flex items-center gap-2">
          {/* Dual Map / List Switch */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'map'
                  ? 'bg-[#0F3D2E] text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t.mapViewTab || 'Map'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-[#0F3D2E] text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>
                {t.listViewTab || 'List'} ({places.length})
              </span>
            </button>
          </div>

          {/* Live GPS Button */}
          <button
            onClick={handleDetectGPS}
            disabled={isLocating}
            className="flex items-center space-x-1.5 bg-[#0F3D2E] hover:bg-[#165440] disabled:opacity-50 text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm shrink-0"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? t.gpsDetecting || 'Detecting...' : t.autoDetectGPS || '📍 Live GPS'}</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH CENTER INDICATOR & RELOCATION BANNER */}
      <div className="bg-linear-to-r from-emerald-950 via-[#0F3D2E] to-emerald-900 text-white p-4 rounded-2xl shadow-sm border border-emerald-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  {t.activeCenterLabel || 'Active Search Center'}
                </span>
                <span className="text-xs text-emerald-200">
                  ({lat.toFixed(4)}° N, {lon.toFixed(4)}° E)
                </span>
              </div>
              <h3 className="text-sm md:text-base font-extrabold text-white mt-0.5">
                📍 {villageName}, {district}, {state}
              </h3>
            </div>
          </div>

          {/* Relocate Center by Village Search */}
          <form onSubmit={handleVillageGeocodeSubmit} className="flex items-center gap-1.5 w-full md:w-80">
            <input
              type="text"
              value={villageSearchInput}
              onChange={(e) => setVillageSearchInput(e.target.value)}
              placeholder={t.searchVillageRelocatePlaceholder || 'Relocate: enter village, town or mandi...'}
              className="flex-1 px-3 py-1.5 bg-emerald-900/60 border border-emerald-700/60 rounded-xl text-xs text-white placeholder-emerald-300/60 focus:outline-none focus:border-amber-300 transition"
            />
            <button
              type="submit"
              disabled={isRelocatingVillage || !villageSearchInput.trim()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-emerald-950 font-bold text-xs rounded-xl transition shrink-0"
            >
              {isRelocatingVillage ? '...' : t.relocateBtn || 'Relocate'}
            </button>
          </form>
        </div>

        {/* Preset Rural Hub Buttons */}
        <div className="pt-2 border-t border-emerald-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-emerald-200/80 text-[11px] font-medium mr-1">
            {t.presetHubsLabel || 'Select Rural Hub Preset:'}
          </span>
          {popularHubs.map((hub, idx) => {
            const isCurrent = Math.abs(hub.lat - lat) < 0.01 && Math.abs(hub.lon - lon) < 0.01;
            return (
              <button
                key={idx}
                onClick={() => handleHubSelect(hub)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  isCurrent
                    ? 'bg-amber-400 text-emerald-950 ring-2 ring-amber-300 font-bold'
                    : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 hover:text-white border border-emerald-700/50'
                }`}
              >
                📍 {hub.name}
              </button>
            );
          })}
          <span className="text-[10px] text-amber-200/70 italic ml-auto hidden sm:inline">
            💡 {t.centerRelocateTip || 'Tap anywhere on the map to relocate the center'}
          </span>
        </div>
      </div>

      {/* 3. BUSINESS SEARCH BOX & RADIUS SELECTOR BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Primary Business Search Input */}
          <form onSubmit={handleBusinessSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchBusinessPlaceholder || 'Search business keyword (e.g. Milk shop, Grocery, Pharmacy, Fertilizer...)'}
              className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0F3D2E] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0F3D2E] text-amber-300 hover:bg-[#165440] px-2.5 py-1 rounded-lg text-xs font-bold transition"
            >
              Search
            </button>
          </form>

          {/* Strict Radius Selector (1 km, 2 km, 5 km, 10 km) */}
          <div className="shrink-0 w-full sm:w-auto">
            <RadiusSelector radiusKm={radiusKm} setRadiusKm={setRadiusKm} lang={lang} />
          </div>
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Quick:
          </span>
          {QUICK_SEARCH_CHIPS.map((chip) => {
            const isSelected = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => handleChipSelect(chip)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                  isSelected
                    ? 'bg-[#0F3D2E] text-amber-300 shadow-2xs ring-1 ring-emerald-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. BUSINESS INTELLIGENCE METRIC CARDS & DISCLAIMER */}
      {businessIntelligence && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Metric 1: Total Businesses Found */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total in Radius
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900">
                  {businessIntelligence.total_count}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  businesses
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                Within {radiusKm} km radius
              </span>
            </div>

            {/* Metric 2: Nearest Competitor Distance */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.nearestCompetitor || 'Nearest Competitor'}
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900">
                  {businessIntelligence.nearest_competitor_km !== null
                    ? `${businessIntelligence.nearest_competitor_km} km`
                    : 'None'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                {businessIntelligence.nearest_competitor_km !== null
                  ? 'Straight-line distance'
                  : `No competitors in ${radiusKm} km`}
              </span>
            </div>

            {/* Metric 3: Business Density */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.businessDensity || 'Business Density'}
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900">
                  {businessIntelligence.business_density_per_sq_km}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  shops / km²
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                Catchment: {businessIntelligence.area_sq_km} km²
              </span>
            </div>

            {/* Metric 4: Competition Level Badge */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.competitionLevel || 'Competition Level'}
              </span>
              <div className="mt-1">
                {renderCompetitionBadge(businessIntelligence.competition_level)}
              </div>
            </div>
          </div>

          {/* Zero-Hallucination Truthful Disclaimer */}
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-2 text-[11px] text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold mr-1">
                {t.disclaimerLabel || 'Field Ground-Truth Notice'}:
              </span>
              <span>
                {businessIntelligence.disclaimer ||
                  'Demand data is currently unavailable. Lower business density was observed. Demand should be verified using additional market data and on-ground field surveys.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. ZERO RESULTS STATE */}
      {!isLoading && places.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              {t.noPlacesFoundTitle || 'No businesses found in this radius'}
            </h3>
            <p className="text-xs text-slate-500">
              {t.noPlacesFoundDesc || 'No places matching your criteria were found within'}{' '}
              <strong className="text-slate-800">{radiusKm} km</strong> of{' '}
              <strong className="text-slate-800">{villageName}</strong>.
            </p>
          </div>
          {radiusKm < 10.0 && (
            <button
              onClick={() => {
                setRadiusKm(10.0);
                fetchPlacesAndAnalysis(lat, lon, 10.0, searchQuery, selectedCategory);
              }}
              className="inline-flex items-center space-x-1.5 bg-[#0F3D2E] hover:bg-[#165440] text-amber-300 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <span>{t.expandRadiusTo10 || 'Expand Radius to 10 km'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          )}
        </div>
      )}

      {/* 6. MAIN MAP & CONTEXT WORKSPACE */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Interactive Map */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden h-[480px]">
              <GoogleMap
                lat={lat}
                lon={lon}
                latitude={lat}
                longitude={lon}
                places={places}
                radiusKm={radiusKm}
                selectedPlace={selectedPlace}
                onSelectPlace={setSelectedPlace}
                onLocationChange={handleMapLocationChange}
                apiKey={apiKey}
                isHeatmapActive={isHeatmapActive}
              />
            </div>

            <MapLegend
              isHeatmapActive={isHeatmapActive}
              setIsHeatmapActive={setIsHeatmapActive}
              lang={lang}
            />
          </div>

          {/* Right Column: Places List & Market Opportunity */}
          <div className="space-y-6">
            <MarketOpportunity
              scoreBreakdown={marketAnalysis?.score_breakdown}
              overallScore={marketAnalysis?.opportunity_score}
              lang={lang}
            />

            <NearbyPlaces
              places={places}
              radiusKm={radiusKm}
              selectedPlace={selectedPlace}
              onSelectPlace={setSelectedPlace}
              searchQuery={searchQuery}
              lang={lang}
            />
          </div>
        </div>
      ) : (
        /* Full List View Mode */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                📋 {t.listViewTab || 'Detailed Business Directory'} ({places.length})
              </h3>
              <p className="text-xs text-slate-500">
                Within {radiusKm} km of {villageName} • Strict Haversine distance sorted nearest first
              </p>
            </div>
            <button
              onClick={() => setViewMode('map')}
              className="bg-[#0F3D2E] text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t.mapViewTab || 'Back to Map'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {places.map((place) => {
              const style = getCategoryStyle(place.category_code || place.category_id || place.category);
              const dist = place.straight_distance_km !== undefined ? place.straight_distance_km : place.road_distance_km;
              const reviewsCount = place.user_ratings_total || 0;

              return (
                <div
                  key={place.place_id || place.id}
                  onClick={() => {
                    setSelectedPlace(place);
                    setViewMode('map');
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-white transition cursor-pointer space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg p-1.5 rounded-lg bg-white shadow-2xs border border-slate-100">
                          {style.icon}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                            {place.name}
                          </h4>
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: style.bg, color: style.color }}
                          >
                            {style.label || place.category}
                          </span>
                        </div>
                      </div>
                      <span className="font-extrabold text-emerald-800 text-xs flex items-center shrink-0">
                        <MapPin className="w-3 h-3 mr-0.5 text-emerald-600" />
                        {dist} km
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {place.address || place.formatted_address || place.vicinity || 'Rural Commercial Corridor'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    {place.rating ? (
                      <span className="flex items-center text-amber-600 font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                        {place.rating} {reviewsCount > 0 ? `(${reviewsCount})` : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Verified local</span>
                    )}

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#0F3D2E] text-amber-300 font-bold hover:bg-[#165440] transition text-[10px]"
                    >
                      <Navigation className="w-2.5 h-2.5" />
                      <span>{t.getDirections || 'Directions'}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
