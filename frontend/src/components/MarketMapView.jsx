import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  MapPin,
  Crosshair,
  Navigation,
  Search,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
  Compass,
  ArrowRight
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

export default function MarketMapView({
  profile,
  setProfile,
  recommendations,
  lang = 'en',
  onLocationUpdate
}) {
  const t = translations[lang] || translations.en;

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
  const [locationStatus, setLocationStatus] = useState(null);

  // Google Maps API Key handling
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('udyamsetu_gmaps_key') || envKey;
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);

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
        const topRec = recommendations?.top_recommendation;
        const categoryCode = topRec?.category_code || 'VEGETABLE_FARMING';

        const [placesRes, analysisRes] = await Promise.all([
          axios.post('/api/maps/nearby', {
            latitude: lat,
            longitude: lon,
            radius_km: radiusKm,
            category: selectedCategory,
            apiKey: apiKey
          }),
          axios.post('/api/maps/market-analysis', {
            latitude: lat,
            longitude: lon,
            category_code: categoryCode,
            radius_km: radiusKm
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
  }, [lat, lon, radiusKm, selectedCategory, apiKey, recommendations]);

  // Calculate place counts per category for pill badges
  const placeCounts = places.reduce((acc, p) => {
    const cat = p.category_id || p.category || 'OTHER';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // 1. Device Live GPS & Network Geolocation
  const handleDetectLiveLocation = async () => {
    setIsLocating(true);
    setLocationStatus('Locating device (GPS satellites / Network WiFi)...');

    const result = await detectAccurateLocation();

    if (result.success) {
      const updated = {
        ...profile,
        latitude: result.latitude,
        longitude: result.longitude,
        village_name: result.village_name,
        district: result.district,
        state: result.state,
        pincode: result.pincode || profile.pincode
      };

      if (setProfile) setProfile(updated);
      if (onLocationUpdate) onLocationUpdate(updated);

      setLocationStatus(result.message);
    } else {
      setLocationStatus(result.message);
    }
    setIsLocating(false);
  };

  // 2. Village / Town Search via OpenStreetMap Geocoding
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingLocation(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );

      if (res.data && res.data.length > 0) {
        const item = res.data[0];
        const newLat = parseFloat(item.lat);
        const newLon = parseFloat(item.lon);
        const nameParts = item.display_name.split(',');
        const vName = nameParts[0].trim();

        const updated = {
          ...profile,
          latitude: newLat,
          longitude: newLon,
          village_name: vName,
          district: nameParts[1] ? nameParts[1].trim() : district
        };

        if (setProfile) setProfile(updated);
        if (onLocationUpdate) onLocationUpdate(updated);
        setLocationStatus(`Found and centered on: ${item.display_name.slice(0, 50)}...`);
      } else {
        alert('Could not find this location. Try specifying village name with district or state.');
      }
    } catch (err) {
      console.error('Search location error:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // 3. Manual Latitude / Longitude Submit
  const handleManualCoordsSubmit = (e) => {
    e.preventDefault();
    const parsedLat = parseFloat(manualLat);
    const parsedLon = parseFloat(manualLon);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      alert('Please enter valid numeric latitude and longitude.');
      return;
    }

    const updated = {
      ...profile,
      latitude: parsedLat,
      longitude: parsedLon,
      village_name: `Custom (${parsedLat.toFixed(3)}°, ${parsedLon.toFixed(3)}°)`
    };

    if (setProfile) setProfile(updated);
    if (onLocationUpdate) onLocationUpdate(updated);
    setLocationStatus(`Updated origin to coordinates: ${parsedLat}°, ${parsedLon}°`);
  };

  // 4. Click-to-Pin on Map
  const handleMapLocationChange = async ({ lat: newLat, lng: newLon }) => {
    let vName = 'Selected Map Pin';

    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLon}&zoom=14&addressdetails=1`
      );
      if (res.data?.address) {
        vName = res.data.address.village || res.data.address.town || res.data.address.suburb || vName;
      }
    } catch (e) {}

    const updated = {
      ...profile,
      latitude: newLat,
      longitude: newLon,
      village_name: vName
    };

    if (setProfile) setProfile(updated);
    if (onLocationUpdate) onLocationUpdate(updated);
    setLocationStatus(`Pin placed: ${vName} (${newLat.toFixed(4)}°, ${newLon.toFixed(4)}°)`);
  };

  // Save API Key
  const handleSaveApiKey = () => {
    const trimmed = inputKey.trim();
    setApiKey(trimmed);
    localStorage.setItem('udyamsetu_gmaps_key', trimmed);
    setShowKeyModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & MULTI-MODE LOCATION SELECTION TOOLBAR                      */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center">
              <Crosshair className="w-4 h-4 mr-1.5 text-emerald-600" />
              Hyper-Local Google Maps Intelligence • Multi-Factor Spatial Catchment
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-0.5 flex items-center space-x-2">
              <span>📍 {villageName}</span>
              <span className="text-sm font-semibold text-slate-500">
                ({district}, {state})
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live Coordinates: <b>{lat.toFixed(4)}° N, {lon.toFixed(4)}° E</b> • Click map or enter coordinates to reposition origin.
            </p>
          </div>

          {/* Action Tools: Live GPS & API Key Setting */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDetectLiveLocation}
              disabled={isLocating}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition transform hover:-translate-y-0.5"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : '📍 Device Live GPS'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition"
            >
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>{apiKey ? 'API Key: Connected' : 'Google Maps Key'}</span>
            </button>

            {/* Quick Benchmark Hubs Dropdown */}
            <select
              value={`${lat.toFixed(4)},${lon.toFixed(4)}`}
              onChange={(e) => {
                const [sLat, sLon] = e.target.value.split(',').map(Number);
                const hub = popularHubs.find((h) => Math.abs(h.lat - sLat) < 0.01);
                if (hub) {
                  const updated = {
                    ...profile,
                    latitude: hub.lat,
                    longitude: hub.lon,
                    village_name: hub.name.split(' (')[0],
                    district: hub.district,
                    state: hub.state
                  };
                  if (setProfile) setProfile(updated);
                  if (onLocationUpdate) onLocationUpdate(updated);
                  setLocationStatus(`Switched to benchmark hub: ${hub.name}`);
                }
              }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="">Select Rural Hub Preset...</option>
              {popularHubs.map((h, i) => (
                <option key={i} value={`${h.lat.toFixed(4)},${h.lon.toFixed(4)}`}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Search Bar & Manual Lat/Long Input Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          {/* Search Bar */}
          <form onSubmit={handleSearchLocation} className="md:col-span-7 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search village, town, or APMC mandi (e.g. Niphad, Baramati)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingLocation}
              className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition"
            >
              {isSearchingLocation ? 'Searching...' : 'Locate'}
            </button>
          </form>

          {/* Manual Latitude / Longitude */}
          <form onSubmit={handleManualCoordsSubmit} className="md:col-span-5 flex items-center space-x-2">
            <input
              type="text"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Latitude"
              className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              placeholder="Longitude"
              className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition"
            >
              Go
            </button>
          </form>
        </div>

        {/* GPS or Status Feedback */}
        {locationStatus && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-2 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{locationStatus}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-extrabold uppercase">Live Geospatial Synchronized</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. RADIUS SELECTOR & HEATMAP CONTROL BAR                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-7">
          <RadiusSelector
            radiusKm={radiusKm}
            onRadiusChange={(newRadius) => {
              setRadiusKm(newRadius);
              if (setProfile) {
                setProfile({ ...profile, analysis_radius_km: newRadius });
              }
            }}
          />
        </div>
        <div className="md:col-span-5">
          <CompetitionHeatmap
            isActive={isHeatmapActive}
            onToggle={() => setIsHeatmapActive(!isHeatmapActive)}
            densityScore={marketAnalysis?.competitor_density_per_sq_km || 0.45}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CATEGORY PILL FILTER BAR                                               */}
      {/* ========================================================================= */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
          placeCounts={placeCounts}
        />
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN MAP CANVAS & LEGEND                                               */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <GoogleMap
          latitude={lat}
          longitude={lon}
          radiusKm={radiusKm}
          places={places}
          entrepreneurName={profile.name || 'Entrepreneur Location'}
          selectedPlace={selectedPlace}
          activeRoute={activeRoute}
          isHeatmapActive={isHeatmapActive}
          apiKey={apiKey}
          onLocationChange={handleMapLocationChange}
          onSelectPlace={(place) => setSelectedPlace(place)}
        />

        {/* Floating / Compact Legend */}
        <MapLegend
          isHeatmapActive={isHeatmapActive}
          onToggleHeatmap={() => setIsHeatmapActive(!isHeatmapActive)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 5. PLACES DIRECTORY & SLIDE-OUT DETAIL PANEL                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Nearby Places Directory */}
        <div className={selectedPlace ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <NearbyPlaces
            places={places}
            radiusKm={radiusKm}
            selectedPlaceId={selectedPlace?.place_id || selectedPlace?.id}
            onSelectPlace={(place) => setSelectedPlace(place)}
          />
        </div>

        {/* Right: Selected Place Detail Drawer */}
        {selectedPlace && (
          <div className="lg:col-span-5">
            <PlaceDetails
              place={selectedPlace}
              origin={{
                lat,
                lng: lon,
                name: `${villageName} (Entrepreneur Origin)`
              }}
              apiKey={apiKey}
              onClose={() => {
                setSelectedPlace(null);
                setActiveRoute(null);
              }}
              onRouteCalculated={(route) => setActiveRoute(route)}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. 10 SPATIAL INTELLIGENCE METRICS & DETERMINISTIC OPPORTUNITY SCORE      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketSummary
          marketAnalysis={marketAnalysis}
          radiusKm={radiusKm}
        />

        <MarketOpportunity
          overallScore={marketAnalysis?.market_opportunity_score || 82}
          scoreBreakdown={marketAnalysis?.score_breakdown}
        />
      </div>

      {/* ========================================================================= */}
      {/* 7. GOOGLE MAPS API KEY CONFIGURATION MODAL                                */}
      {/* ========================================================================= */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Google Maps Platform API Key
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your Google Maps Platform JavaScript & Places API Key below. When connected, live Google satellite layers, Street View panoramas, and official Place Photos will be activated.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Google Maps API Key (Client & Server)
              </label>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Seamless PostGIS Hybrid Engine:</p>
              <p>
                If an API key is not supplied or billing is pending, the application automatically runs on our PostGIS rural cluster engine with high-resolution satellite tiles and verified field surveys.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setInputKey('');
                  setApiKey('');
                  localStorage.removeItem('udyamsetu_gmaps_key');
                  setShowKeyModal(false);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Reset to PostGIS Engine
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
