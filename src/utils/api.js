import axios from 'axios';
import { API_CONFIG, validateConfig } from '../config/env.js';

// Validate configuration on import
validateConfig();

const api = axios.create({ 
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if(token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && err.response.data.msg === "Token has expired") {
      localStorage.removeItem('token');
      window.location.href = '/login';   // or use your router to navigate
      return Promise.reject(new Error('Session expired, please log in again.'));
    }
    return Promise.reject(err);
  }
);

export default api;
