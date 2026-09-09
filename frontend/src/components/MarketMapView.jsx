import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  MapPin,
  Crosshair,
  Search,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import GoogleMap from './maps/GoogleMap';
import RadiusSelector from './maps/RadiusSelector';
import MapLegend from './maps/MapLegend';
import CategoryFilter from './maps/CategoryFilter';
import NearbyPlaces from './maps/NearbyPlaces';
import PlaceDetails from './maps/PlaceDetails';
import MarketSummary from './maps/MarketSummary';
import MarketOpportunity from './maps/MarketOpportunity';
import CompetitionHeatmap from './maps/CompetitionHeatmap';
import { detectAccurateLocation } from '../utils/geolocation';
import { translations } from '../locales/translations';
import { useSaarthi } from '../context/SaarthiContext';

export default function MarketMapView({
  profile,
  setProfile,
  recommendations,
  lang = 'en',
  onLocationUpdate
}) {
  const t = translations[lang] || translations.en;
  const { activePlan } = useSaarthi();

  // Active Location Coordinates
  const lat = profile.latitude || 20.1706;
  const lon = profile.longitude || 73.984;
  const villageName = profile.village_name || 'Pimpalgaon Baswant';
  const district = profile.district || 'Nashik';
  const state = profile.state || 'Maharashtra';

  // State Management
  const [radiusKm, setRadiusKm] = useState(profile.analysis_radius_km || 10.0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);

  // Search and Manual Coordinate Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [manualLat, setManualLat] = useState(lat.toFixed(4));
  const [manualLon, setManualLon] = useState(lon.toFixed(4));
  const [isLocating, setIsLocating] = useState(false);

  // Google Maps API Key handling
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('udyamsetu_gmaps_key') || envKey;
  });

  // Popular Indian Rural Benchmark Hubs
  const popularHubs = [
    { name: 'Pimpalgaon Baswant (Nashik)', lat: 20.1706, lon: 73.984, district: 'Nashik', state: 'Maharashtra' },
    { name: 'Kankipadu (Krishna)', lat: 16.4258, lon: 80.7712, district: 'Krishna', state: 'Andhra Pradesh' },
    { name: 'Chaubeypur (Varanasi)', lat: 25.438, lon: 83.056, district: 'Varanasi', state: 'Uttar Pradesh' },
    { name: 'Mogri Rural (Anand)', lat: 22.536, lon: 72.934, district: 'Anand', state: 'Gujarat' }
  ];

  // Update manual inputs when coordinate props change
  useEffect(() => {
    setManualLat(lat.toFixed(4));
    setManualLon(lon.toFixed(4));
  }, [lat, lon]);

  // Load Business Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/maps/categories');
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.warn('Could not load categories:', err.message);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Nearby Places & GIS Spatial Analysis
  useEffect(() => {
    let isCancelled = false;

    const fetchMapIntelligence = async () => {
      try {
        const topRec = activePlan?.rawRecommendation || recommendations?.top_recommendation;
        const categoryCode = topRec?.category_code || activePlan?.category || 'VEGETABLE_FARMING';

        const [placesRes, analysisRes] = await Promise.all([
          axios.post('/api/maps/nearby', {
            latitude: lat,
            longitude: lon,
            radius_km: radiusKm,
            category: selectedCategory,
            apiKey: apiKey,
            language: lang
          }),
          axios.post('/api/maps/market-analysis', {
            latitude: lat,
            longitude: lon,
            category_code: categoryCode,
            radius_km: radiusKm,
            language: lang
          })
        ]);

        if (isCancelled) return;

        if (placesRes.data && placesRes.data.success) {
          setPlaces(placesRes.data.places || []);
        }
        if (analysisRes.data) {
          setMarketAnalysis(analysisRes.data);
        }
      } catch (err) {
        console.error('Error fetching hyper-local map intelligence:', err);
      }
    };

    fetchMapIntelligence();

    return () => {
      isCancelled = true;
    };
  }, [lat, lon, radiusKm, selectedCategory, apiKey, activePlan, recommendations, lang]);

  // Handle Location Search
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingLocation(true);
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', India')}`;
      const response = await axios.get(geoUrl);

      if (response.data && response.data.length > 0) {
        const first = response.data[0];
        const newLat = parseFloat(first.lat);
        const newLon = parseFloat(first.lon);

        const parts = first.display_name.split(',').map(s => s.trim());
        const detectedVillage = parts[0] || searchQuery;
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
      }
    } catch (err) {
      console.warn("Geocoding failed:", err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Live Browser GPS Detection
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
      console.warn("GPS detection notice:", e);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center">
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            {t.gisIntelligenceTag || "Hyper-Local Google Maps Intelligence"}
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {t.gisTitle || "Multi-Factor Spatial Catchment & Competitor Map"}
          </h2>
          <p className="text-xs text-slate-500">
            {t.gisSubtitle || "Live GPS catchment analysis, competitor density mapping, and APMC mandi benchmarks."}
          </p>
        </div>

        {/* Live GPS Button */}
        <button
          onClick={handleDetectGPS}
          disabled={isLocating}
          className="flex items-center space-x-1.5 bg-[#0F3D2E] hover:bg-[#165440] disabled:opacity-50 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shrink-0"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? (t.gpsDetecting || 'Detecting GPS...') : (t.autoDetectGPS || '📍 Auto-Detect Live GPS')}</span>
        </button>
      </div>

      {/* Preset Rural Hubs Selection */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700 shrink-0">{t.presetHubsLabel || "Select Rural Hub Preset:"}</span>
        <div className="flex flex-wrap gap-2">
          {popularHubs.map((hub, idx) => (
            <button
              key={idx}
              onClick={() => {
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
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0F3D2E] text-slate-700 hover:text-amber-300 font-medium transition shadow-2xs"
            >
              📍 {hub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchVillageMandiPlaceholder || "Search village, town, or APMC mandi..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0F3D2E]"
          />
        </form>

        <RadiusSelector radiusKm={radiusKm} setRadiusKm={setRadiusKm} lang={lang} />
      </div>

      {/* Map & Context Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden h-[450px]">
            <GoogleMap
              lat={lat}
              lon={lon}
              places={places}
              radiusKm={radiusKm}
              selectedPlace={selectedPlace}
              onSelectPlace={setSelectedPlace}
              activeRoute={activeRoute}
              apiKey={apiKey}
            />
          </div>

          <MapLegend isHeatmapActive={isHeatmapActive} setIsHeatmapActive={setIsHeatmapActive} lang={lang} />
        </div>

        {/* Right Column: Places & Market Intelligence */}
        <div className="space-y-6">
          <MarketOpportunity marketAnalysis={marketAnalysis} lang={lang} />

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            lang={lang}
          />

          <NearbyPlaces
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
}
