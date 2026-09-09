import React, { useEffect, useRef, useState } from 'react';
import { Eye, AlertTriangle, X, RotateCw, Compass } from 'lucide-react';
import axios from 'axios';

export default function StreetViewPanel({
  latitude,
  longitude,
  placeName,
  apiKey,
  onClose
}) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('CHECKING'); // 'CHECKING', 'AVAILABLE', 'UNAVAILABLE'
  const [streetViewData, setStreetViewData] = useState(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const checkCoverage = async () => {
      setStatus('CHECKING');
      try {
        const res = await axios.post('/api/maps/street-view', {
          latitude,
          longitude,
          apiKey
        });

        if (!isMounted) return;

        if (res.data && res.data.available) {
          setStreetViewData(res.data);
          setStatus('AVAILABLE');
        } else {
          setStatus('UNAVAILABLE');
        }
      } catch (err) {
        if (isMounted) setStatus('UNAVAILABLE');
      }
    };

    checkCoverage();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, apiKey]);

  // Mount Google Maps JS StreetViewPanorama if Google Maps SDK is loaded
  useEffect(() => {
    if (status === 'AVAILABLE' && containerRef.current && window.google && window.google.maps) {
      try {
        const sv = new window.google.maps.StreetViewPanorama(containerRef.current, {
          position: { lat: latitude, lng: longitude },
          pov: { heading: heading || 0, pitch: 0 },
          zoom: 1,
          addressControl: true,
          showRoadLabels: true
        });
      } catch (e) {
        console.warn('Could not initialize window.google.maps.StreetViewPanorama:', e);
      }
    }
  }, [status, latitude, longitude, heading]);

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-700 shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs">
            Street View & Ground Perspective • {placeName || 'Location'}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4">
        {status === 'CHECKING' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400 text-xs">
            <RotateCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Scanning Google Street View metadata at {latitude.toFixed(4)}°, {longitude.toFixed(4)}°...</span>
          </div>
        )}

        {status === 'UNAVAILABLE' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">
              Street View Imagery Unavailable
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Google Street View panoramic trekker coverage is not currently available for this rural interior coordinate.
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold">
              ✓ Strict Honesty: We never render fabricated, AI-generated, or misleading 360° panoramas.
            </p>
          </div>
        )}

        {status === 'AVAILABLE' && (
          <div className="space-y-3">
            {apiKey && streetViewData?.embed_url ? (
              <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-700">
                <iframe
                  title="Street View Panorama"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={streetViewData.embed_url}
                  allowFullScreen
                />
              </div>
            ) : (
              <div
                ref={containerRef}
                className="h-64 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950"
              />
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center space-x-1">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pano ID: {streetViewData?.pano_id || 'Verified Coverage'}</span>
              </span>
              <span>Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
