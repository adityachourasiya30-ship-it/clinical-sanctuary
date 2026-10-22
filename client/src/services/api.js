import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: inject Bearer token if stored in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cs_token');
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
      // If unauthorized on protected routes (except during active checkAuth)
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/track/')) {
        localStorage.removeItem('cs_token');
        localStorage.removeItem('cs_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
