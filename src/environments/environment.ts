export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  appName: 'Receipt Management System',
  version: '1.0.0',
  
  // Feature flags
  features: {
    enableTranslation: true,
    enableProductAnalysis: true,
    enableBudgetTracking: true,
    enableOfflineMode: false
  },
  
  // API configuration
  api: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    compressionQuality: 0.8
  },
  
  // Cache configuration
  cache: {
    defaultTTL: 300000, // 5 minutes
    maxSize: 100
  },
  
  // Logging configuration
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false
  }
};