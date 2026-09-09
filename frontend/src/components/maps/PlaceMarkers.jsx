import React from 'react';
import { CATEGORY_STYLES, getCategoryStyle } from './GoogleMap';

/**
 * PlaceMarkers.jsx
 * Marker utilities and visual badge icon rendering
 */

export const createGoogleMarkerIcon = (google, categoryId, isSelected = false) => {
  const style = getCategoryStyle(categoryId);
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: isSelected ? 12 : 8,
    fillColor: style.color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: isSelected ? 3 : 2
  };
};

export const createLeafletMarkerIcon = (L, categoryId, isSelected = false) => {
  const style = getCategoryStyle(categoryId);
  const size = isSelected ? 32 : 26;
  return L.divIcon({
    className: 'custom-place-icon',
    html: `<div style="background-color: ${style.color}; color: white; width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${
      isSelected ? 14 : 11
    }px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${style.icon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export default function PlaceMarkers() {
  return null;
}
