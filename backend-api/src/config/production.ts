// Production Configuration for Ositos Bendecidos

export interface ProductionConfig {
  // Database
  mongodbUri: string;
  
  // JWT
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  
  // Server
  port: number;
  frontendUrl: string[];
  
  // Security
  bcryptSaltRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // Email
  emailService: string;
  emailUser?: string;
  emailPass?: string;
  emailFrom: string;
  adminEmail: string;
  
  // Stripe
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  
  // PayPal
  paypalClientId: string;
  paypalClientSecret: string;
  
  // Logging
  logLevel: string;
  logFilePath: string;
}

const getProductionConfig = (): ProductionConfig => {
  // Validate required environment variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'STRIPE_SECRET_KEY',
    'FRONTEND_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    // Database
    mongodbUri: process.env.MONGODB_URI!,
    
    // JWT
    jwtSecret: process.env.JWT_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    
    // Server
    port: parseInt(process.env.PORT || '3001'),
    frontendUrl: process.env.FRONTEND_URL?.split(',') || ['https://yourdomain.com'],
    
    // Security
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    
    // Email
    emailService: process.env.EMAIL_SERVICE || 'sendgrid',
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    emailFrom: process.env.EMAIL_FROM || 'noreply@ositosbendecidos.com',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@ositosbendecidos.com',
    
    // Stripe
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    
    // PayPal
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFilePath: process.env.LOG_FILE_PATH || './logs/app.log'
  };
};

// Development config fallback
const getDevelopmentConfig = (): ProductionConfig => {
  return {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ositos-bendecidos',
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
    port: 3001,
    frontendUrl: ['http://localhost:3000', 'http://localhost:5173'],
    bcryptSaltRounds: 12,
    rateLimitWindowMs: 900000,
    rateLimitMaxRequests: 1000, // More lenient for development
    emailService: 'console',
    emailFrom: 'dev@ositosbendecidos.com',
    adminEmail: 'admin@ositosbendecidos.com',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_dev_key',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    logLevel: 'debug',
    logFilePath: './logs/dev.log'
  };
};

export const config = process.env.NODE_ENV === 'production' 
  ? getProductionConfig() 
  : getDevelopmentConfig();

// Helper functions for configuration validation
export const validateProductionConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (process.env.NODE_ENV === 'production') {
    // Check JWT secrets strength
    if (!config.jwtSecret || config.jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long for production');
    }

    if (!config.jwtRefreshSecret || config.jwtRefreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long for production');
    }

    if (config.jwtSecret === config.jwtRefreshSecret) {
      errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }

    // Check MongoDB URI
    if (!config.mongodbUri.includes('mongodb+srv://') && !config.mongodbUri.includes('mongodb://')) {
      errors.push('MONGODB_URI must be a valid MongoDB connection string');
    }

    // Check HTTPS URLs
    const hasInsecureUrls = config.frontendUrl.some(url => url.startsWith('http://'));
    if (hasInsecureUrls) {
      errors.push('All frontend URLs must use HTTPS in production');
    }

    // Check Stripe
    if (!config.stripeSecretKey.startsWith('sk_live_')) {
      errors.push('STRIPE_SECRET_KEY must be a live key for production (starts with sk_live_)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Production security headers
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};
