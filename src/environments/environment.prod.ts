export const environment = {
  production: true,
  apiUrl: process.env['API_URL'] || 'https://api.receipt-management.com',
  appName: 'Receipt Management System',
  version: '1.0.0',
  
  // Feature flags
  features: {
    enableTranslation: true,
    enableProductAnalysis: true,
    enableBudgetTracking: true,
    enableOfflineMode: true
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
    defaultTTL: 600000, // 10 minutes
    maxSize: 200
  },
  
  // Logging configuration
  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: true
  }
};