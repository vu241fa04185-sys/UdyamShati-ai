import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Users, 
  Store, 
  TrendingUp, 
  Layers, 
  ShieldAlert, 
  CheckCircle2,
  Navigation,
  Crosshair,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { translations } from '../locales/translations';

// Fix standard Leaflet default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MarketMapView({ profile, setProfile, recommendations, lang, onLocationUpdate }) {
  const t = translations[lang] || translations.en;
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [radiusKm, setRadiusKm] = useState(profile.analysis_radius_km || 10.0);
  const [competitors, setCompetitors] = useState([]);
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);

  const lat = profile.latitude || 20.1706;
  const lon = profile.longitude || 73.9840;
  const topRec = recommendations?.top_recommendation;
  const categoryCode = topRec?.category_code || 'VEGETABLE_FARMING';

  // Popular Indian rural hubs for quick 1-click selection
  const popularHubs = [
    { name: "Pimpalgaon Baswant (Nashik)", lat: 20.1706, lon: 73.9840, district: "Nashik", state: "Maharashtra" },
    { name: "Kankipadu (Krishna)", lat: 16.4258, lon: 80.7712, district: "Krishna", state: "Andhra Pradesh" },
    { name: "Chaubeypur (Varanasi)", lat: 25.4380, lon: 83.0560, district: "Varanasi", state: "Uttar Pradesh" },
    { name: "Mogri Rural (Anand)", lat: 22.5360, lon: 72.9340, district: "Anand", state: "Gujarat" }
  ];

  // 1. Live Device GPS Location Detection
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Detecting GPS satellites...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        setLocationStatus("GPS coordinates acquired! Reverse geocoding address...");

        let village = "My Current Location";
        let district = profile.district || "Local District";
        let state = profile.state || "India";

        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLon}&zoom=14&addressdetails=1`
          );
          if (geoRes.data?.address) {
            const addr = geoRes.data.address;
            village = addr.village || addr.suburb || addr.town || addr.city || "Local Village";
            district = addr.state_district || addr.county || addr.district || district;
            state = addr.state || state;
          }
        } catch (geoErr) {
          console.warn("Reverse geocode fallback:", geoErr);
        }

        const newProfile = {
          ...profile,
          latitude: userLat,
          longitude: userLon,
          village_name: village,
          district: district,
          state: state
        };

        if (setProfile) setProfile(newProfile);
        if (onLocationUpdate) onLocationUpdate(newProfile);

        setLocationStatus(`Locked on: ${village}, ${district} (${userLat.toFixed(4)}°, ${userLon.toFixed(4)}°)`);
        setIsLocating(false);

        // Center map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([userLat, userLon], 13);
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setIsLocating(false);
        setLocationStatus("GPS permission denied or unavailable. Using benchmark coordinates.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Load competitor and market analysis data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, marketRes] = await Promise.all([
          axios.get('/api/competitors', {
            params: { latitude: lat, longitude: lon, radius_km: radiusKm }
          }),
          axios.post('/api/market-analysis', {
            latitude: lat,
            longitude: lon,
            category_code: categoryCode,
            radius_km: radiusKm
          })
        ]);
        setCompetitors(compRes.data || []);
        setMarketAnalysis(marketRes.data || null);
      } catch (err) {
        console.error("Error loading GIS market data:", err);
      }
    };
    fetchData();
  }, [lat, lon, radiusKm, categoryCode]);

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: radiusKm <= 5 ? 13 : 12,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | UdyamSetu Spatial Engine',
        maxZoom: 18,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);

      // Interactive Click to Set Location on Map!
      map.on('click', async (e) => {
        const clickedLat = e.latlng.lat;
        const clickedLon = e.latlng.lng;
        
        let vName = "Selected Pin Location";
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickedLat}&lon=${clickedLon}&zoom=14&addressdetails=1`
          );
          if (res.data?.address) {
            vName = res.data.address.village || res.data.address.town || res.data.address.suburb || vName;
          }
        } catch (e) {}

        const updated = {
          ...profile,
          latitude: clickedLat,
          longitude: clickedLon,
          village_name: vName
        };

        if (setProfile) setProfile(updated);
        if (onLocationUpdate) onLocationUpdate(updated);
      });

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lon], radiusKm <= 5 ? 13 : 12);
    }

    const map = mapInstanceRef.current;
    
    // Invalidate size after mount to prevent gray tile rendering!
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // 1. Draw 5-10km Radius Catchment Circle
    if (circleRef.current) {
      circleRef.current.remove();
    }
    const circle = L.circle([lat, lon], {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.12,
      weight: 2.5,
      radius: radiusKm * 1000 // in meters
    }).addTo(map);
    circleRef.current = circle;

    // 2. Add Live Entrepreneur Pin (Pulse beacon)
    const entrepreneurIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #047857; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); animation: pulse 2s infinite;">📍</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    L.marker([lat, lon], { icon: entrepreneurIcon })
      .addTo(markersGroup)
      .bindPopup(`
        <div style="font-family: sans-serif; padding: 2px;">
          <strong style="color: #047857; font-size: 13px;">📍 Current Active Location</strong><br/>
          <strong>${profile.name}</strong><br/>
          ${profile.village_name || 'Village'}, ${profile.district || 'District'}<br/>
          <small style="color: #64748b;">GPS: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E</small>
        </div>
      `)
      .openPopup();

    // 3. Add Competitor Pins
    competitors.forEach((comp) => {
      const isSameCategory = comp.category_code === categoryCode;
      const compIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${isSameCategory ? '#dc2626' : '#f59e0b'}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">🏢</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([comp.latitude, comp.longitude], { icon: compIcon })
        .addTo(markersGroup)
        .bindPopup(`
          <div style="font-family: sans-serif;">
            <strong style="font-size: 12px;">${comp.name}</strong><br/>
            <span style="color: #dc2626; font-size: 11px; font-weight: bold;">Competitor in ${comp.category_code}</span><br/>
            Turnover: ~₹${(comp.estimated_monthly_turnover || 0).toLocaleString('en-IN')}/mo<br/>
            Distance: <b>${comp.distance_km || 0} km</b>
          </div>
        `);
    });

    // 4. Add APMC Mandi Marker
    if (marketAnalysis?.nearest_mandi_distance_km) {
      const mandiLat = lat + 0.025;
      const mandiLon = lon + 0.025;
      const mandiIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #7c3aed; color: white; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">🛒</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      L.marker([mandiLat, mandiLon], { icon: mandiIcon })
        .addTo(markersGroup)
        .bindPopup(`<b>APMC Regional Mandi & Market Hub</b><br/>Distance: ~${marketAnalysis.nearest_mandi_distance_km} km`);
    }

  }, [lat, lon, radiusKm, competitors, marketAnalysis, categoryCode, profile]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner with LIVE GPS DETECTION Button */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center">
            <Crosshair className="w-4 h-4 mr-1.5 text-emerald-600" />
            Hyper-Local Geospatial Intelligence • Live GPS Catchment Area
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-0.5">
            {profile.village_name || 'Current Location'} ({lat.toFixed(4)}° N, {lon.toFixed(4)}° E)
          </h2>
          <p className="text-xs text-slate-500">
            Click anywhere on the map or use the live GPS button to analyze your real village.
          </p>
        </div>

        {/* Live GPS Action & Hub Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDetectLiveLocation}
            disabled={isLocating}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition transform hover:-translate-y-0.5"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting GPS...' : '📍 Use My Device Live GPS'}</span>
          </button>

          {/* Quick Hub Selector */}
          <select
            value={`${lat},${lon}`}
            onChange={(e) => {
              const [selectedLat, selectedLon] = e.target.value.split(',').map(Number);
              const hub = popularHubs.find(h => Math.abs(h.lat - selectedLat) < 0.001);
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
              }
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">Preset Rural Hubs...</option>
            {popularHubs.map((h, i) => (
              <option key={i} value={`${h.lat},${h.lon}`}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GPS Status Banner if active */}
      {locationStatus && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{locationStatus}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">Live Synced</span>
        </div>
      )}

      {/* Map + Side Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 px-1">
            <div className="flex items-center space-x-4">
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-700 mr-1.5"></span> You (Center Pin)</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-600 mr-1.5"></span> Direct Competitor</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-md bg-purple-600 mr-1.5"></span> APMC Mandi Hub</span>
            </div>

            {/* Radius Switcher */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setRadiusKm(5.0)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  radiusKm === 5.0 ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                5 km
              </button>
              <button
                onClick={() => setRadiusKm(10.0)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  radiusKm === 10.0 ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                10 km
              </button>
              <button
                onClick={() => setRadiusKm(15.0)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  radiusKm === 15.0 ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                15 km
              </button>
            </div>
          </div>

          <div className="h-[460px] rounded-xl overflow-hidden border border-slate-200 relative">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-[10px] text-slate-600 z-[400] shadow-sm pointer-events-none">
              💡 Tip: Click anywhere on map to reposition your business origin
            </div>
          </div>
        </div>

        {/* Catchment Metrics & Demand-Supply Gap */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-600" />
              Catchment Area Intelligence ({radiusKm} km Reach)
            </h3>

            {marketAnalysis && (
              <div className="space-y-3 text-xs">
                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Demand-Supply Gap Index</span>
                    <span className="font-extrabold text-sm text-emerald-800">
                      +{marketAnalysis.demand_supply_gap}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Demand Index: {marketAnalysis.demand_index}/100</span>
                    <span>Local Supply: {marketAnalysis.supply_index}/100</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, marketAnalysis.demand_supply_gap)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="border border-slate-100 bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Population Reach</span>
                    <span className="text-sm font-bold text-slate-900">
                      {(marketAnalysis.population_reach || 10000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="border border-slate-100 bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Households</span>
                    <span className="text-sm font-bold text-slate-900">
                      {(marketAnalysis.households_reach || 2000).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Competitors in {radiusKm} km:</span>
                    <span className="font-bold text-slate-900">{marketAnalysis.competitor_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nearest APMC Mandi:</span>
                    <span className="font-semibold text-slate-800">~{marketAnalysis.nearest_mandi_distance_km} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Market Opportunity Score:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {marketAnalysis.market_opportunity_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data Confidence:</span>
                    <span className="font-bold text-slate-700">{marketAnalysis.data_confidence_pct}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nearby Competitors List */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
              <Store className="w-4 h-4 mr-1.5 text-rose-600" />
              Nearby Competitors in Radius
            </h4>

            <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
              {competitors.length === 0 ? (
                <div className="text-center py-4 text-slate-400">
                  No competitors found within {radiusKm} km radius. High market entry opportunity!
                </div>
              ) : (
                competitors.map((c, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{c.name}</span>
                      <span className="text-emerald-700">{c.distance_km} km</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span className="capitalize">{c.village || 'Village'}</span>
                      <span>₹{(c.estimated_monthly_turnover || 0).toLocaleString('en-IN')}/mo</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
