import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { validateSupabaseConfig, testSupabaseConnection } from './config/supabase';
import { SupabaseUserService } from './services/SupabaseUserService';

// Load environment variables
dotenv.config();

// Validate Supabase configuration
const configValidation = validateSupabaseConfig();
if (!configValidation.isValid) {
  console.error('❌ Supabase configuration errors:');
  configValidation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

// Import routes
import authRoutes from './routes/auth-supabase';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import paypalRoutes from './routes/paypal';
import emailRoutes from './routes/email';
import healthRoutes from './routes/health';
import investmentRoutes from './routes/investments';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for production deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'general',
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

const authRateLimiter = new RateLimiterMemory({
  keyPrefix: 'auth',
  points: 50, // 50 attempts
  duration: 60, // per 1 minute
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
        retryAfter: req.path.startsWith('/api/auth') ? '15 minutes' : '1 minute'
      });
    });
};

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use(rateLimiterMiddleware);

// Health check (before auth for monitoring)
app.use('/api/health', healthRoutes);

// Enhanced health check with Supabase
app.get('/api/health/supabase', async (req, res) => {
  try {
    const isConnected = await testSupabaseConnection();
    
    res.json({
      success: true,
      supabase: {
        connected: isConnected,
        url: process.env.SUPABASE_URL || 'Not configured',
        status: isConnected ? 'operational' : 'error'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      supabase: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/investments', investmentRoutes);

// Error handler
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

// Start server function
const startServer = async () => {
  try {
    console.log('🔌 Testing Supabase connection...');
    const isConnected = await testSupabaseConnection();
    
    if (!isConnected) {
      console.warn('⚠️  Supabase connection test failed, but server will continue');
    } else {
      console.log('✅ Supabase connection successful');
      
      // Create default admin user if it doesn't exist
      if (process.env.NODE_ENV !== 'production') {
        console.log('👑 Checking for default admin user...');
        await SupabaseUserService.createAdminUser();
      }
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000, http://localhost:5173'}`);
      console.log(`🗄️  Database: Supabase ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);
      
      console.log(`\n🎯 Test endpoints:`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Supabase: http://localhost:${PORT}/api/health/supabase`);
      console.log(`   Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   Login: POST http://localhost:${PORT}/api/auth/login`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`   Admin: POST http://localhost:${PORT}/api/auth/create-admin`);
        console.log(`\n💡 Default admin: admin@ositos.com / admin123`);
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
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

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n📡 ${signal} received. Starting graceful shutdown...`);
  console.log('✅ Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    console.error('❌ Startup error:', error);
    process.exit(1);
  });
}

export default app;
