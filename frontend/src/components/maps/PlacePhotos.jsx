import React, { useState } from 'react';
import { Camera, ExternalLink, X, ZoomIn } from 'lucide-react';

export default function PlacePhotos({ photos = [], placeName = 'Rural Establishment' }) {
  const [activePhoto, setActivePhoto] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
        <Camera className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
        <span>No official photos uploaded for this rural location.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
        <span className="flex items-center space-x-1.5">
          <Camera className="w-3.5 h-3.5 text-emerald-600" />
          <span>Place Photos & Survey Documentation ({photos.length})</span>
        </span>
      </div>

      {/* Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((ph, idx) => (
          <div
            key={idx}
            onClick={() => setActivePhoto(ph)}
            className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer shadow-sm hover:shadow transition"
          >
            <img
              src={ph.photo_url}
              alt={`${placeName} ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
              <ZoomIn className="w-4 h-4 mr-1" /> Enlarge
            </div>
            {ph.attribution && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-[9px] text-white/90 px-1.5 py-0.5 truncate">
                {ph.attribution}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2 flex items-center justify-center bg-black min-h-[300px]">
              <img
                src={activePhoto.photo_url}
                alt={placeName}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between text-xs">
              <div>
                <p className="font-bold">{placeName}</p>
                <p className="text-slate-400 text-[11px]">
                  Attribution: {activePhoto.attribution || 'Google Maps Platform / Verified Rural Survey'}
                </p>
              </div>
              <a
                href={activePhoto.photo_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <span>Full Res</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
