/**
 * Free Public OSRM Road Routing Service with Haversine Fallback.
 * 100% Free - Requires no API key, works seamlessly in browser.
 */

/**
 * Calculate Great-Circle distance between two coordinates using Haversine formula (km)
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's mean radius in km
  const toRad = (val) => (val * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Fetch true road polyline and driving telemetry between two points using public OSRM API.
 * Automatically falls back to Haversine straight line if OSRM endpoint times out or fails.
 *
 * @param {Array<number>} start - [latitude, longitude] of starting point (e.g. Responder)
 * @param {Array<number>} end - [latitude, longitude] of destination (e.g. Patient)
 * @returns {Promise<{
 *   success: boolean,
 *   polyline: Array<[number, number]>,
 *   distanceKm: number,
 *   durationMins: number,
 *   isFallback: boolean,
 *   summary?: string
 * }>}
 */
export const fetchRoadRoute = async (start, end) => {
  if (!start || !end || !start[0] || !start[1] || !end[0] || !end[1]) {
    return {
      success: false,
      polyline: [],
      distanceKm: 0,
      durationMins: 0,
      isFallback: true,
    };
  }

  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  // Haversine fallback calculation ready upfront
  const haversineDist = calculateHaversineDistance(startLat, startLng, endLat, endLng);
  const fallbackDistKm = Number(haversineDist.toFixed(2));
  // Urban emergency response estimate (35 km/h avg speed)
  const fallbackDurationMins = Math.max(1, Math.round((fallbackDistKm / 35) * 60));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s max wait

    // OSRM expects coordinates in {longitude},{latitude} order
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OSRM HTTP status ${res.status}`);
    }

    const data = await res.json();

    if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      // OSRM GeoJSON geometry coordinates are [lng, lat]; Leaflet requires [lat, lng]
      const leafLatLonPoints = primaryRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distanceKm = Number((primaryRoute.distance / 1000).toFixed(2));
      const durationMins = Math.max(1, Math.round(primaryRoute.duration / 60));

      return {
        success: true,
        polyline: leafLatLonPoints,
        distanceKm,
        durationMins,
        isFallback: false,
        summary: primaryRoute.legs?.[0]?.summary || 'Primary road corridor',
      };
    }

    throw new Error('OSRM returned empty route');
  } catch (err) {
    console.debug('OSRM routing fallback used (Haversine direct line):', err.message);
    return {
      success: true,
      polyline: [
        [startLat, startLng],
        [endLat, endLng],
      ],
      distanceKm: fallbackDistKm,
      durationMins: fallbackDurationMins,
      isFallback: true,
    };
  }
};

export default {
  calculateHaversineDistance,
  fetchRoadRoute,
};
