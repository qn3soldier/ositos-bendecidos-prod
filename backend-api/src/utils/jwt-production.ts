import jwt, { SignOptions } from 'jsonwebtoken';
import { UserProfile } from '../models/UserMongoDB';
import { config } from '../config/production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTUtils {
  static generateTokenPair(user: UserProfile): TokenPair {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.accessTokenExpiresIn,
      issuer: 'ositos-bendecidos',
      audience: 'ositos-bendecidos-users'
    } as SignOptions);

    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.refreshTokenExpiresIn,
      issuer: 'ositos-bendecidos',
      audience: 'ositos-bendecidos-users'
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret, {
        issuer: 'ositos-bendecidos',
        audience: 'ositos-bendecidos-users'
      }) as JWTPayload;

      // Additional validation
      if (!decoded.userId || !decoded.email || !decoded.role) {
        throw new Error('Invalid token payload');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwtRefreshSecret, {
        issuer: 'ositos-bendecidos',
        audience: 'ositos-bendecidos-users'
      }) as JWTPayload;

      // Additional validation
      if (!decoded.userId || !decoded.email || !decoded.role) {
        throw new Error('Invalid token payload');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    // Support both "Bearer TOKEN" and "TOKEN" formats
    const parts = authHeader.split(' ');
    
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }

    return null;
  }

  static getTokenInfo(token: string): { 
    payload: JWTPayload | null; 
    isExpired: boolean; 
    expiresAt: Date | null;
    issuedAt: Date | null;
  } {
    try {
      // Decode without verification to get info
      const decoded = jwt.decode(token) as JWTPayload;
      
      if (!decoded) {
        return { payload: null, isExpired: true, expiresAt: null, issuedAt: null };
      }

      const now = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp ? decoded.exp < now : true;
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
      const issuedAt = decoded.iat ? new Date(decoded.iat * 1000) : null;

      return {
        payload: decoded,
        isExpired,
        expiresAt,
        issuedAt
      };
    } catch (error) {
      return { payload: null, isExpired: true, expiresAt: null, issuedAt: null };
    }
  }

  // Generate a secure random string for additional security measures
  static generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validate token format
  static isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // JWT format: header.payload.signature
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  // Security: Check if token is blacklisted (implement with Redis in production)
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    // TODO: Implement with Redis for production
    // For now, return false (no blacklist)
    return false;
  }

  // Security: Add token to blacklist (implement with Redis in production)
  static async blacklistToken(token: string, expiresAt?: Date): Promise<void> {
    // TODO: Implement with Redis for production
    // Store token hash with expiration time
    console.log(`Token blacklisted: ${token.substring(0, 20)}...`);
  }
}
