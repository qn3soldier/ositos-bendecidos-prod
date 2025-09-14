import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwt-production';
import { UserService } from '../models/UserMongoDB';

// User type is already declared in auth.ts middleware

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Validate token format
    if (!JWTUtils.isValidTokenFormat(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_FORMAT'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await JWTUtils.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    // Verify token
    const payload = JWTUtils.verifyAccessToken(token);
    
    // Verify user still exists and is active
    const user = await UserService.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or deactivated',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user info to request
    req.user = payload;

    // Log access for security monitoring
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔐 Auth: ${user.email} accessed ${req.method} ${req.path}`);
    }

    return next();

  } catch (error) {
    console.error('Authentication error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    let errorCode = 'AUTH_FAILED';
    let message = 'Authentication failed';

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorCode = 'TOKEN_EXPIRED';
        message = 'Access token expired';
      } else if (error.message.includes('invalid')) {
        errorCode = 'INVALID_TOKEN';
        message = 'Invalid access token';
      }
    }

    return res.status(401).json({
      success: false,
      message,
      code: errorCode
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NO_AUTH'
    });
  }

  if (req.user.role !== 'admin') {
    // Log unauthorized admin access attempt
    console.warn(`⚠️  Unauthorized admin access attempt: ${req.user.email} (${req.user.userId}) tried to access ${req.method} ${req.path}`);
    
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }

  // Log admin access
  console.log(`👑 Admin access: ${req.user.email} accessed ${req.method} ${req.path}`);

  return next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`⚠️  Unauthorized role access: ${req.user.email} (${req.user.role}) tried to access ${req.method} ${req.path}. Required: ${allowedRoles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    return next();
  };
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token && JWTUtils.isValidTokenFormat(token)) {
      try {
        const payload = JWTUtils.verifyAccessToken(token);
        const user = await UserService.findById(payload.userId);
        
        if (user) {
          req.user = payload;
        }
      } catch (error) {
        // Ignore errors for optional auth
        // Token might be expired or invalid, but that's okay
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  
  return next();
};

// Rate limiting middleware for sensitive endpoints
export const sensitiveEndpointRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This would integrate with Redis rate limiting in production
  // For now, just log the access
  console.log(`🚨 Sensitive endpoint access: ${req.ip} -> ${req.method} ${req.path}`);
  return next();
};

// Middleware to check if user is verified (email verification)
export const requireVerified = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NO_AUTH'
    });
  }

  try {
    const user = await UserService.findById(req.user.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    return next();

  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification check failed',
      code: 'VERIFICATION_ERROR'
    });
  }
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return next();
};

// API key validation for server-to-server communication
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.API_KEY;

  if (!expectedApiKey) {
    return res.status(500).json({
      success: false,
      message: 'API key not configured',
      code: 'API_KEY_NOT_CONFIGURED'
    });
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    console.warn(`🚨 Invalid API key attempt from ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  return next();
};
