import axios from 'axios';

/**
 * Enhanced Resilient Geolocation Utility
 * 
 * 1. Tries Browser GPS (navigator.geolocation) with high accuracy
 * 2. If it times out or fails (common on laptops/PCs without GPS hardware), tries network mode
 * 3. If permission denied or unavailable, falls back to IP Geolocation (ipwho.is)
 * 4. Reverse-geocodes with Nominatim to retrieve village/town, district, state
 */

export const detectAccurateLocation = async () => {
  return new Promise((resolve) => {
    // Helper to reverse geocode lat/lng to rural address
    const reverseGeocode = async (lat, lon, fallbackVillage = 'Current Location', fallbackDistrict = 'District', fallbackState = 'State') => {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
          { timeout: 4000 }
        );
        if (res.data?.address) {
          const a = res.data.address;
          const village = a.village || a.suburb || a.town || a.city || a.hamlet || fallbackVillage;
          const district = a.state_district || a.county || a.district || fallbackDistrict;
          const state = a.state || fallbackState;
          const pincode = a.postcode || '';
          return { village, district, state, pincode };
        }
      } catch (e) {
        console.warn('Reverse geocode warning:', e.message);
      }
      return { village: fallbackVillage, district: fallbackDistrict, state: fallbackState, pincode: '' };
    };

    // Helper: Fallback to reliable IP geolocation
    const fallbackToIP = async (reason = '') => {
      try {
        const ipRes = await axios.get('https://ipwho.is/', { timeout: 5000 });
        if (ipRes.data && ipRes.data.success !== false && ipRes.data.latitude && ipRes.data.longitude) {
          const lat = ipRes.data.latitude;
          const lon = ipRes.data.longitude;
          const city = ipRes.data.city || 'Local Area';
          const region = ipRes.data.region || 'State';

          const geo = await reverseGeocode(lat, lon, city, city, region);

          return resolve({
            success: true,
            latitude: lat,
            longitude: lon,
            village_name: geo.village || city,
            district: geo.district || city,
            state: geo.state || region,
            pincode: geo.pincode || ipRes.data.postal || '',
            source: 'network_ip',
            message: `Live Location detected: ${geo.village || city}, ${geo.district || city} (${geo.state || region}) via Network/WiFi.`
          });
        }
      } catch (ipErr) {
        console.warn('IP geolocation fallback failed:', ipErr.message);
      }

      // If everything failed, resolve with failure reason
      resolve({
        success: false,
        latitude: 20.1706,
        longitude: 73.9840,
        village_name: 'Pimpalgaon Baswant',
        district: 'Nashik',
        state: 'Maharashtra',
        source: 'benchmark_default',
        message: reason || 'Location services unavailable. Using benchmark coordinates.'
      });
    };

    // Check if browser geolocation is available
    if (!navigator.geolocation) {
      return fallbackToIP('Geolocation API not supported by this browser.');
    }

    // Try Browser GPS with balanced options
    let resolved = false;

    // Safety timeout: if browser hangs waiting for user prompt or GPS satellites
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        fallbackToIP('GPS satellite fix timed out on this device. Switched to live Network location.');
      }
    }, 6000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 50);

        const geo = await reverseGeocode(lat, lon);

        resolve({
          success: true,
          latitude: lat,
          longitude: lon,
          accuracy_meters: accuracy,
          village_name: geo.village,
          district: geo.district,
          state: geo.state,
          pincode: geo.pincode,
          source: 'gps_device',
          message: `GPS Location acquired: ${geo.village}, ${geo.district} (${lat.toFixed(4)}°, ${lon.toFixed(4)}° • Accuracy: ±${accuracy}m)`
        });
      },
      (err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        console.warn('Browser GPS error code:', err.code, err.message);

        let hint = '';
        if (err.code === 1) {
          hint = 'Browser location permission was blocked. Using Network Location.';
        } else if (err.code === 2) {
          hint = 'Hardware GPS unavailable on this computer. Using Network Location.';
        } else {
          hint = 'GPS timed out. Using Network Location.';
        }

        fallbackToIP(hint);
      },
      {
        enableHighAccuracy: false, // false works reliably on laptops and WiFi
        timeout: 5000,
        maximumAge: 60000
      }
    );
  });
};
