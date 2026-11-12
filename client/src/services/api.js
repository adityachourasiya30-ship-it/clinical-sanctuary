import axios from 'axios';

/**
 * Determine API Base URL:
 * - If VITE_API_URL is configured (e.g. https://clinical-sanctuary-ixnu.onrender.com),
 *   normalize it and append /api if not already included.
 * - Otherwise fallback to '/api' for local Vite development proxy.
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: inject Bearer token from sessionStorage (tab-isolated) or localStorage (fallback)
api.interceptors.request.use(
  (config) => {
    const token =
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cs_token') : null) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('cs_token') : null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: handle 401 unauthenticated responses cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected routes (except during active checkAuth or login)
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (!currentPath.includes('/login') && !currentPath.includes('/track/')) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('cs_token');
          sessionStorage.removeItem('cs_user');
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('cs_token');
          localStorage.removeItem('cs_user');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
