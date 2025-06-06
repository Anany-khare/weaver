import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    // If the response includes a new token, update it
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response;
  },
  (error) => {
    // Only handle 401 errors for non-auth requests
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.replace('/auth/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api; 