import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import paypalRoutes from './routes/paypal';
import emailRoutes from './routes/email';
import healthRoutes from './routes/health';
import investmentRoutes from './routes/investments';
import productsRoutes from './routes/products';
import prayersRoutes from './routes/prayers';
import communityRoutes from './routes/community';
import testimonialsRoutes from './routes/testimonials';
import adminRoutes from './routes/admin';
import investmentPlatformRoutes from './routes/investment-platform';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'general',
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

const rateLimiterMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  rateLimiter.consume(req.ip || req.socket.remoteAddress || 'unknown')
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ 
        success: false, 
        message: 'Too many requests. Please try again later.' 
      });
    });
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiterMiddleware);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/prayers', prayersRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/investment-platform', investmentPlatformRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/investments', investmentRoutes);

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

export default app;
