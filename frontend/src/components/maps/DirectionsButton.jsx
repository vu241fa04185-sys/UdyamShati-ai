import React, { useState } from 'react';
import { Navigation, Car, Bike, Footprints, Clock, MapPin, ExternalLink, X } from 'lucide-react';
import axios from 'axios';

export default function DirectionsButton({
  origin, // { lat, lng, name }
  destination, // { lat, lng, name }
  apiKey,
  onRouteCalculated
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);

  const fetchDirections = async (travelMode = mode) => {
    if (!origin || !destination) return;
    setLoading(true);

    try {
      const res = await axios.post('/api/maps/directions', {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        mode: travelMode,
        apiKey
      });

      if (res.data && res.data.success) {
        setRouteData(res.data);
        if (onRouteCalculated) {
          onRouteCalculated(res.data);
        }
      }
    } catch (err) {
      console.error('Directions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchDirections(mode);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    fetchDirections(newMode);
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=${mode}`;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
      >
        <Navigation className="w-3.5 h-3.5" />
        <span>Get Route Directions</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl space-y-4">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Turn-by-Turn Route Navigation</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Origin & Destination Labels */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-900">From:</span>
                  <span className="truncate">{origin.name || 'Current Entrepreneur Location'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <span className="font-semibold text-slate-900">To:</span>
                  <span className="truncate">{destination.name || 'Destination Business'}</span>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'driving', icon: Car, label: 'Driving' },
                  { id: 'bicycling', icon: Bike, label: 'Bicycle' },
                  { id: 'walking', icon: Footprints, label: 'Walking' }
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleModeChange(m.id)}
                      className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Metrics Result */}
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Calculating optimized rural road path...</p>
                </div>
              ) : routeData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Road Distance
                      </span>
                      <span className="text-lg font-black text-emerald-800">
                        {routeData.distance_km} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Est. Travel Time
                      </span>
                      <span className="text-lg font-black text-slate-900 flex items-center justify-center space-x-1">
                        <Clock className="w-4 h-4 text-emerald-600 mr-1" />
                        <span>{routeData.duration_minutes} mins</span>
                      </span>
                    </div>
                  </div>

                  {/* Turn-by-Turn Guidance Steps */}
                  {routeData.steps && routeData.steps.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Turn-by-Turn Guidance
                      </span>
                      {routeData.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-slate-800 font-medium">{step.instruction}</p>
                            <span className="text-[10px] text-slate-400">
                              {step.distance} • {step.duration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Open in Google Maps Native App */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow transition"
                  >
                    <span>Open in Google Maps Navigation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
