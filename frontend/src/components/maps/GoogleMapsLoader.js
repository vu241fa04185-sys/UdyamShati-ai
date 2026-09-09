/**
 * GoogleMapsLoader.js
 * Asynchronous loader for Google Maps JavaScript Platform SDK
 * Supports libraries: places, geometry, visualization
 */

let loadPromise = null;
let loadedApiKey = null;

export const loadGoogleMaps = (apiKey) => {
  if (!apiKey || apiKey.trim().length < 10) {
    return Promise.reject(new Error('Valid Google Maps API Key is required.'));
  }

  // If already loaded with the same key, resolve immediately
  if (window.google && window.google.maps && loadedApiKey === apiKey) {
    return Promise.resolve(window.google.maps);
  }

  // If a script is currently loading with this key, return that promise
  if (loadPromise && loadedApiKey === apiKey) {
    return loadPromise;
  }

  loadedApiKey = apiKey;
  loadPromise = new Promise((resolve, reject) => {
    // Remove any previously inserted google maps scripts if key changed
    const existingScript = document.getElementById('google-maps-sdk-script');
    if (existingScript) {
      existingScript.remove();
    }

    const callbackName = `__googleMapsInit_${Date.now()}`;
    window[callbackName] = () => {
      delete window[callbackName];
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps SDK object missing after load'));
      }
    };

    const script = document.createElement('script');
    script.id = 'google-maps-sdk-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey.trim()
    )}&libraries=places,geometry,visualization&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onerror = (err) => {
      delete window[callbackName];
      loadPromise = null;
      reject(new Error('Failed to load Google Maps SDK script: ' + (err.message || 'Network error')));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = () => {
  return !!(window.google && window.google.maps);
};
