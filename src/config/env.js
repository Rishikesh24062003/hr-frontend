/**
 * Frontend Environment Configuration
 * Centralized configuration for environment variables
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3
};

// Application Configuration
export const APP_CONFIG = {
  NAME: 'HR Resume System',
  VERSION: '1.0.0',
  ENVIRONMENT: import.meta.env.MODE || 'development',
  DEBUG: import.meta.env.DEV || false
};

// Feature Flags
export const FEATURES = {
  LLM_ENABLED: import.meta.env.VITE_LLM_ENABLED === 'true',
  FILE_UPLOAD_ENABLED: true,
  ANALYTICS_ENABLED: import.meta.env.VITE_ANALYTICS_ENABLED === 'true'
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
  ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx']
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  RESUMES: {
    LIST: '/resumes',
    UPLOAD: '/resumes',
    GET: (id) => `/resumes/${id}`,
    DELETE: (id) => `/resumes/${id}`
  },
  JOBS: {
    LIST: '/jobs',
    CREATE: '/jobs',
    GET: (id) => `/jobs/${id}`,
    UPDATE: (id) => `/jobs/${id}`,
    DELETE: (id) => `/jobs/${id}`
  },
  RANKINGS: {
    CREATE: '/rankings',
    BY_JOB: (jobId) => `/rankings/job/${jobId}`,
    BY_RESUME: (resumeId) => `/rankings/resume/${resumeId}`,
    DELETE: (id) => `/rankings/${id}`
  },
  ANALYTICS: {
    STATS: '/analytics/stats',
    REPORTS: '/analytics/reports',
    JOB_PERFORMANCE: (jobId) => `/analytics/job-performance/${jobId}`
  },
  LLM: {
    PARSE_RESUME: '/llm/parse-resume',
    MATCH_JOBS: '/llm/match-jobs',
    RANK_CANDIDATE: '/llm/rank-candidate'
  }
};

// Environment helpers
export const isDevelopment = () => APP_CONFIG.ENVIRONMENT === 'development';
export const isProduction = () => APP_CONFIG.ENVIRONMENT === 'production';
export const isDebug = () => APP_CONFIG.DEBUG;

// Configuration validation
export const validateConfig = () => {
  const errors = [];
  
  if (!API_CONFIG.BASE_URL) {
    errors.push('VITE_API_URL is not set');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    return false;
  }
  
  return true;
};

// Export default configuration
export default {
  API_CONFIG,
  APP_CONFIG,
  FEATURES,
  UPLOAD_CONFIG,
  STORAGE_KEYS,
  API_ENDPOINTS,
  isDevelopment,
  isProduction,
  isDebug,
  validateConfig
}; 