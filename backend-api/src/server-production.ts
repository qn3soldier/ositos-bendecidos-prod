import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { DatabaseConnection } from './models/UserMongoDB';
import { config, validateProductionConfig, getSecurityHeaders } from './config/production';

// Load environment variables
dotenv.config();

// Validate production configuration
const configValidation = validateProductionConfig();
if (!configValidation.isValid) {
  console.error('❌ Production configuration errors:');
  configValidation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

// Import routes
import authRoutes from './routes/auth-production';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import paypalRoutes from './routes/paypal';
import emailRoutes from './routes/email';
import healthRoutes from './routes/health';
import investmentRoutes from './routes/investments';

// Initialize Express app
const app = express();

// Trust proxy for production deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Enhanced Rate limiting for production
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'general',
  points: config.rateLimitMaxRequests,
  duration: config.rateLimitWindowMs / 1000, // convert to seconds
});

const authRateLimiter = new RateLimiterMemory({
  keyPrefix: 'auth',
  points: 5, // 5 attempts
  duration: 900, // per 15 minutes
});

const rateLimiterMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const limiter = req.path.startsWith('/api/auth') ? authRateLimiter : rateLimiter;
  
  limiter.consume(req.ip || req.socket.remoteAddress || 'unknown')
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ 
        success: false, 
        message: 'Too many requests. Please try again later.',
        retryAfter: req.path.startsWith('/api/auth') ? '15 minutes' : '15 minutes'
      });
    });
};

// Production security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Add custom security headers
  app.use((req, res, next) => {
    const headers = getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  });
} else {
  app.use(helmet());
}

// Standard middleware
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use(rateLimiterMiddleware);

// Health check (before auth for monitoring)
app.use('/api/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/investments', investmentRoutes);

// Production error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', {
    error: error.message,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    success: false,
    message: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { 
      stack: error.stack,
      details: error 
    })
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n📡 ${signal} received. Starting graceful shutdown...`);
  
  try {
    // Disconnect from database
    await DatabaseConnection.disconnect();
    console.log('✅ Database disconnected');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server function
const startServer = async () => {
  try {
    // Connect to database first
    console.log('🔌 Connecting to MongoDB...');
    await DatabaseConnection.connect();
    
    // Start server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${config.frontendUrl.join(', ')}`);
      console.log(`🛡️  Security: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} mode`);
      console.log(`📊 Database: ${DatabaseConnection.isDbConnected() ? 'Connected' : 'Disconnected'}`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log('🔐 Production security measures active');
        console.log('🚫 Rate limiting: Active');
        console.log('🛡️  Helmet security headers: Active');
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.port} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    console.error('❌ Startup error:', error);
    process.exit(1);
  });
}

export default app;
