import { findNearbyHospitals } from '../services/hospitalService.js';

/**
 * Get nearby hospitals, clinics, and emergency centers
 */
export const getNearbyHospitals = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseInt(req.query.radius, 10) || 5000;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude (lat) and longitude (lng) query parameters are required.',
      });
    }

    const hospitals = await findNearbyHospitals(lat, lng, radius);

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      coordinates: { latitude: lat, longitude: lng },
      searchRadiusMeters: radius,
      hospitals,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to search nearby hospitals.',
      error: err.message,
    });
  }
};
