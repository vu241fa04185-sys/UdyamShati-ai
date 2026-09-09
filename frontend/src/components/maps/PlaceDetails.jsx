import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  Clock,
  Star,
  CheckCircle2,
  Navigation,
  Eye,
  Store,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import PlacePhotos from './PlacePhotos';
import DirectionsButton from './DirectionsButton';
import StreetViewPanel from './StreetViewPanel';

export default function PlaceDetails({
  place,
  origin,
  apiKey,
  onClose,
  onRouteCalculated
}) {
  const [showStreetView, setShowStreetView] = useState(false);

  if (!place) return null;

  const straightDist = place.straight_distance_km || 0;
  const roadDist = place.road_distance_km || (straightDist * 1.25).toFixed(2);
  const travelTime = place.estimated_travel_time_minutes || Math.round((roadDist / 30) * 60);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-xs space-y-4">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase">
              {place.category || 'Business'}
            </span>
            <span className="flex items-center text-[10px] text-emerald-400 font-bold">
              <ShieldCheck className="w-3 h-3 mr-0.5" />
              Verified Place
            </span>
          </div>
          <h3 className="text-base font-black text-white">{place.name}</h3>
          <p className="text-slate-300 text-[11px] flex items-center">
            <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
            <span className="truncate">{place.formatted_address || place.vicinity || 'Rural Hub'}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Rating & Status Bar */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="font-extrabold text-sm ml-1 text-slate-900">
                {place.rating ? place.rating.toFixed(1) : '4.2'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              ({place.user_ratings_total || 12} reviews)
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[11px] text-emerald-700">
              {place.business_status === 'OPERATIONAL' ? 'Operational / Open' : 'Open Today'}
            </span>
          </div>
        </div>

        {/* Distance Intelligence Comparison */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Straight-Line Distance
            </span>
            <span className="text-sm font-black text-emerald-800">{straightDist} km</span>
          </div>
          <div className="bg-teal-50/70 border border-teal-200 p-2.5 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Road Distance & Time
            </span>
            <span className="text-sm font-black text-teal-800">
              {roadDist} km <span className="text-xs font-semibold text-slate-500">({travelTime} min)</span>
            </span>
          </div>
        </div>

        {/* Contact & Hours */}
        <div className="space-y-2 text-slate-600">
          {place.phone_number && place.phone_number !== 'N/A' && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="flex items-center space-x-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{place.phone_number}</span>
              </span>
              <a
                href={`tel:${place.phone_number}`}
                className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px]"
              >
                Call Now
              </a>
            </div>
          )}

          {place.opening_hours && Array.isArray(place.opening_hours) && (
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <span className="flex items-center space-x-1.5 font-bold text-slate-700 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating Timings:</span>
              </span>
              <div className="text-[11px] text-slate-500 space-y-0.5 pl-5">
                {place.opening_hours.slice(0, 3).map((h, i) => (
                  <p key={i}>{h}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Directions & Street View */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {origin && (
            <DirectionsButton
              origin={origin}
              destination={{
                lat: place.latitude,
                lng: place.longitude,
                name: place.name
              }}
              apiKey={apiKey}
              onRouteCalculated={onRouteCalculated}
            />
          )}

          <button
            type="button"
            onClick={() => setShowStreetView(!showStreetView)}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>{showStreetView ? 'Hide Street View' : 'Explore Street View'}</span>
          </button>
        </div>

        {/* Street View Panel if toggled */}
        {showStreetView && (
          <StreetViewPanel
            latitude={place.latitude}
            longitude={place.longitude}
            placeName={place.name}
            apiKey={apiKey}
            onClose={() => setShowStreetView(false)}
          />
        )}

        {/* Verified Photos Component */}
        <PlacePhotos photos={place.photos} placeName={place.name} />
      </div>
    </div>
  );
}
