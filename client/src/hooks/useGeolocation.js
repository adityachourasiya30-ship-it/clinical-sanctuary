import { useState, useEffect, useCallback } from 'react';

export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options,
  };

  const handleSuccess = (position) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: position.timestamp,
    });
    setError(null);
    setLoading(false);
  };

  const handleError = (err) => {
    let message = 'Unable to retrieve location.';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location permission was denied by browser/user.';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'Location information is currently unavailable.';
        break;
      case err.TIMEOUT:
        message = 'Location request timed out.';
        break;
      default:
        message = err.message;
    }
    setError(message);
    setLoading(false);
  };

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, defaultOptions);
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return { location, error, loading, refreshLocation };
};
