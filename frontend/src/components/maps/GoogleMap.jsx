import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Navigation,
  Globe,
  Mountain,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { loadGoogleMaps, isGoogleMapsLoaded } from './GoogleMapsLoader';

// Category color and icon map
export const CATEGORY_STYLES = {
  DAIRY: { icon: '🐄', color: '#2563eb', bg: '#dbeafe' },
  POULTRY: { icon: '🐔', color: '#ea580c', bg: '#ffedd5' },
  AGRICULTURE: { icon: '🌾', color: '#16a34a', bg: '#dcfce7' },
  FOOD: { icon: '📦', color: '#d97706', bg: '#fef3c7' },
  RETAIL: { icon: '🏪', color: '#7c3aed', bg: '#f3e8ff' },
  HEALTHCARE: { icon: '🏥', color: '#dc2626', bg: '#fee2e2' },
  TRANSPORT: { icon: '⛽', color: '#0891b2', bg: '#cffafe' },
  SERVICES: { icon: '🚜', color: '#475569', bg: '#f1f5f9' },
  MANDI: { icon: '🛒', color: '#6d28d9', bg: '#ede9fe' },
  DEFAULT: { icon: '🏢', color: '#059669', bg: '#d1fae5' }
};

export const getCategoryStyle = (catId = '') => {
  const key = String(catId).toUpperCase();
  return CATEGORY_STYLES[key] || CATEGORY_STYLES.DEFAULT;
};

export default function GoogleMap({
  latitude = 20.1706,
  longitude = 73.984,
  radiusKm = 10.0,
  places = [],
  entrepreneurName = 'Entrepreneur Location',
  selectedPlace = null,
  activeRoute = null, // { waypoints: [[lat, lng], ...], distance_km, ... }
  isHeatmapActive = false,
  apiKey = '',
  onLocationChange,
  onSelectPlace
}) {
  const containerRef = useRef(null);
  const [mapEngine, setMapEngine] = useState('LEAFLET_HYBRID'); // 'GOOGLE_MAPS' | 'LEAFLET_HYBRID'
  const [mapType, setMapType] = useState('ROADMAP'); // 'ROADMAP' | 'SATELLITE' | 'TERRAIN'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(radiusKm <= 5 ? 13 : 12);

  // References for Google Maps instance and overlays
  const gMapRef = useRef(null);
  const gCircleRef = useRef(null);
  const gEntrepreneurMarkerRef = useRef(null);
  const gPlaceMarkersRef = useRef([]);
  const gHeatmapRef = useRef(null);
  const gPolylineRef = useRef(null);

  // References for Leaflet instance and overlays
  const lMapRef = useRef(null);
  const lTileLayerRef = useRef(null);
  const lCircleRef = useRef(null);
  const lEntrepreneurMarkerRef = useRef(null);
  const lMarkersGroupRef = useRef(null);
  const lPolylineRef = useRef(null);

  // 1. Attempt loading Google Maps if API key is provided
  useEffect(() => {
    let isCancelled = false;

    if (apiKey && apiKey.trim().length > 10) {
      loadGoogleMaps(apiKey)
        .then(() => {
          if (!isCancelled) {
            setMapEngine('GOOGLE_MAPS');
          }
        })
        .catch((err) => {
          console.warn('Google Maps JS SDK load failed, falling back to PostGIS hybrid engine:', err.message);
          if (!isCancelled) {
            setMapEngine('LEAFLET_HYBRID');
          }
        });
    } else {
      setMapEngine('LEAFLET_HYBRID');
    }

    return () => {
      isCancelled = true;
    };
  }, [apiKey]);

  // Adjust zoom when radius changes
  useEffect(() => {
    const newZoom = radiusKm <= 5 ? 13 : 12;
    setZoomLevel(newZoom);
    if (gMapRef.current && mapEngine === 'GOOGLE_MAPS') {
      gMapRef.current.setZoom(newZoom);
    }
    if (lMapRef.current && mapEngine === 'LEAFLET_HYBRID') {
      lMapRef.current.setZoom(newZoom);
    }
  }, [radiusKm, mapEngine]);

  // =========================================================================
  // GOOGLE MAPS ENGINE INITIALIZATION & UPDATES
  // =========================================================================
  useEffect(() => {
    if (mapEngine !== 'GOOGLE_MAPS' || !containerRef.current || !window.google || !window.google.maps) {
      return;
    }

    // Clean up any Leaflet instance if existing
    if (lMapRef.current) {
      lMapRef.current.remove();
      lMapRef.current = null;
    }

    const google = window.google;
    const center = new google.maps.LatLng(latitude, longitude);

    if (!gMapRef.current) {
      const gMap = new google.maps.Map(containerRef.current, {
        center,
        zoom: zoomLevel,
        mapTypeId: mapType.toLowerCase(),
        mapTypeControl: false,
        streetViewControl: true,
        zoomControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy'
      });

      // Click to pin on map
      gMap.addListener('click', (e) => {
        if (onLocationChange && e.latLng) {
          onLocationChange({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          });
        }
      });

      gMapRef.current = gMap;
    } else {
      gMapRef.current.panTo(center);
      gMapRef.current.setMapTypeId(mapType.toLowerCase());
    }

    const map = gMapRef.current;

    // Draw Catchment Circle
    if (gCircleRef.current) {
      gCircleRef.current.setMap(null);
    }
    gCircleRef.current = new google.maps.Circle({
      strokeColor: '#059669',
      strokeOpacity: 0.85,
      strokeWeight: 2.5,
      fillColor: '#10b981',
      fillOpacity: 0.12,
      map,
      center,
      radius: radiusKm * 1000
    });

    // Entrepreneur Marker
    if (gEntrepreneurMarkerRef.current) {
      gEntrepreneurMarkerRef.current.setMap(null);
    }
    gEntrepreneurMarkerRef.current = new google.maps.Marker({
      position: center,
      map,
      title: entrepreneurName,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#047857',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      },
      zIndex: 999
    });

    // Clear and redraw Place Markers
    gPlaceMarkersRef.current.forEach((m) => m.setMap(null));
    gPlaceMarkersRef.current = [];

    places.forEach((place) => {
      const style = getCategoryStyle(place.category_id || place.category);
      const isSelected = selectedPlace && (selectedPlace.place_id === place.place_id || selectedPlace.id === place.id);

      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        map,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 11 : 8,
          fillColor: style.color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: isSelected ? 3 : 2
        }
      });

      marker.addListener('click', () => {
        if (onSelectPlace) onSelectPlace(place);
      });

      gPlaceMarkersRef.current.push(marker);
    });

    // Heatmap Layer
    if (isHeatmapActive && google.maps.visualization) {
      if (gHeatmapRef.current) {
        gHeatmapRef.current.setMap(null);
      }
      const heatPoints = places.map(
        (p) => new google.maps.LatLng(p.latitude, p.longitude)
      );
      gHeatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatPoints,
        map,
        radius: 35
      });
    } else if (gHeatmapRef.current) {
      gHeatmapRef.current.setMap(null);
    }

    // Polyline Route
    if (activeRoute && activeRoute.waypoints && activeRoute.waypoints.length > 0) {
      if (gPolylineRef.current) {
        gPolylineRef.current.setMap(null);
      }
      const path = activeRoute.waypoints.map((pt) => ({ lat: pt[0], lng: pt[1] }));
      gPolylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#059669',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map
      });
    } else if (gPolylineRef.current) {
      gPolylineRef.current.setMap(null);
    }
  }, [
    mapEngine,
    latitude,
    longitude,
    radiusKm,
    places,
    mapType,
    selectedPlace,
    activeRoute,
    isHeatmapActive,
    entrepreneurName
  ]);

  // =========================================================================
  // POSTGIS HYBRID ENGINE (LEAFLET WITH SATELLITE & TERRAIN TILES)
  // =========================================================================
  useEffect(() => {
    if (mapEngine !== 'LEAFLET_HYBRID' || !containerRef.current) {
      return;
    }

    // Clean up Google Maps instance if existing
    if (gMapRef.current) {
      gMapRef.current = null;
    }

    // Tile URLs based on view mode
    const tileLayers = {
      ROADMAP: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attr: '&copy; OpenStreetMap contributors | PostGIS Spatial Engine'
      },
      SATELLITE: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      },
      TERRAIN: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attr: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
      }
    };

    const currentTile = tileLayers[mapType] || tileLayers.ROADMAP;

    if (!lMapRef.current) {
      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false
      });

      lTileLayerRef.current = L.tileLayer(currentTile.url, {
        attribution: currentTile.attr,
        maxZoom: 19
      }).addTo(map);

      lMarkersGroupRef.current = L.layerGroup().addTo(map);

      // Click to pin on map
      map.on('click', (e) => {
        if (onLocationChange && e.latlng) {
          onLocationChange({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          });
        }
      });

      lMapRef.current = map;
    } else {
      const map = lMapRef.current;
      map.setView([latitude, longitude], zoomLevel);

      // Switch tile layer if changed
      if (lTileLayerRef.current) {
        lTileLayerRef.current.remove();
      }
      lTileLayerRef.current = L.tileLayer(currentTile.url, {
        attribution: currentTile.attr,
        maxZoom: 19
      }).addTo(map);
    }

    const map = lMapRef.current;

    // Refresh size to prevent gray tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Draw Catchment Circle
    if (lCircleRef.current) {
      lCircleRef.current.remove();
    }
    lCircleRef.current = L.circle([latitude, longitude], {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.12,
      weight: 2.5,
      radius: radiusKm * 1000
    }).addTo(map);

    // Clear and redraw markers
    const group = lMarkersGroupRef.current;
    group.clearLayers();

    // Entrepreneur Marker
    const entrepreneurIcon = L.divIcon({
      className: 'custom-beacon-icon',
      html: `<div style="background-color: #047857; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; border: 3px solid white; box-shadow: 0 4px 12px rgba(4,120,87,0.45); animation: pulse 2s infinite;">📍</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    L.marker([latitude, longitude], { icon: entrepreneurIcon, zIndexOffset: 1000 })
      .addTo(group)
      .bindPopup(
        `<div style="font-family: sans-serif; padding: 2px;">
          <strong style="color: #047857; font-size: 12px;">📍 Entrepreneur Location</strong><br/>
          <b>${entrepreneurName}</b><br/>
          <small style="color: #64748b;">${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E</small>
        </div>`
      );

    // Place Markers
    places.forEach((place) => {
      const style = getCategoryStyle(place.category_id || place.category);
      const isSelected = selectedPlace && (selectedPlace.place_id === place.place_id || selectedPlace.id === place.id);

      const placeIcon = L.divIcon({
        className: 'custom-place-icon',
        html: `<div style="background-color: ${style.color}; color: white; width: ${isSelected ? 32 : 26}px; height: ${isSelected ? 32 : 26}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${isSelected ? 14 : 11}px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: transform 0.2s;">${style.icon}</div>`,
        iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
        iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13]
      });

      const m = L.marker([place.latitude, place.longitude], { icon: placeIcon }).addTo(group);

      m.on('click', () => {
        if (onSelectPlace) onSelectPlace(place);
      });

      m.bindTooltip(`<b>${place.name}</b><br/>${place.category || 'Shop'} • ${place.road_distance_km || place.straight_distance_km} km`, {
        direction: 'top',
        offset: [0, -12]
      });
    });

    // Polyline Route
    if (activeRoute && activeRoute.waypoints && activeRoute.waypoints.length > 0) {
      if (lPolylineRef.current) {
        lPolylineRef.current.remove();
      }
      lPolylineRef.current = L.polyline(activeRoute.waypoints, {
        color: '#059669',
        weight: 4,
        opacity: 0.85,
        dashArray: '2, 6',
        lineCap: 'round'
      }).addTo(map);
    } else if (lPolylineRef.current) {
      lPolylineRef.current.remove();
    }
  }, [
    mapEngine,
    latitude,
    longitude,
    radiusKm,
    places,
    mapType,
    selectedPlace,
    activeRoute,
    isHeatmapActive,
    entrepreneurName
  ]);

  // Zoom helpers
  const handleZoomIn = () => {
    if (mapEngine === 'GOOGLE_MAPS' && gMapRef.current) {
      gMapRef.current.setZoom(gMapRef.current.getZoom() + 1);
    } else if (lMapRef.current) {
      lMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapEngine === 'GOOGLE_MAPS' && gMapRef.current) {
      gMapRef.current.setZoom(gMapRef.current.getZoom() - 1);
    } else if (lMapRef.current) {
      lMapRef.current.zoomOut();
    }
  };

  const handleCenter = () => {
    if (mapEngine === 'GOOGLE_MAPS' && gMapRef.current && window.google) {
      gMapRef.current.panTo(new window.google.maps.LatLng(latitude, longitude));
    } else if (lMapRef.current) {
      lMapRef.current.setView([latitude, longitude], zoomLevel);
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-md transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-[2000] rounded-none' : 'h-[500px] w-full'
      }`}
    >
      {/* Map Canvas */}
      <div ref={containerRef} className="w-full h-full bg-slate-100" />

      {/* Top Left: Map Engine Status Badge */}
      <div className="absolute top-3 left-3 z-[400] flex items-center space-x-2">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm text-xs font-bold text-slate-800 flex items-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              mapEngine === 'GOOGLE_MAPS' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-600'
            }`}
          />
          <span>
            {mapEngine === 'GOOGLE_MAPS'
              ? 'Google Maps Platform (Live SDK)'
              : 'PostGIS Hybrid GIS Engine'}
          </span>
        </div>
      </div>

      {/* Top Right: Layer Type Controls */}
      <div className="absolute top-3 right-3 z-[400] flex items-center space-x-1.5 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 shadow-sm">
        <button
          type="button"
          onClick={() => setMapType('ROADMAP')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
            mapType === 'ROADMAP'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-3 h-3" />
          <span>Normal</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType('SATELLITE')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
            mapType === 'SATELLITE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType('TERRAIN')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
            mapType === 'TERRAIN'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mountain className="w-3 h-3" />
          <span>Terrain</span>
        </button>
      </div>

      {/* Bottom Right: Zoom & Center Controls */}
      <div className="absolute bottom-4 right-3 z-[400] flex flex-col space-y-1.5">
        <button
          type="button"
          onClick={handleCenter}
          title="Center on Entrepreneur"
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 hover:text-emerald-700 rounded-xl border border-slate-200/80 shadow-md transition"
        >
          <Navigation className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl border border-slate-200/80 shadow-md transition"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl border border-slate-200/80 shadow-md transition"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl border border-slate-200/80 shadow-md transition"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Left: Guidance Hint */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-200/70 text-[10px] text-slate-600 shadow-xs pointer-events-none">
        💡 Click anywhere on map to reposition your entrepreneur origin pin
      </div>
    </div>
  );
}
