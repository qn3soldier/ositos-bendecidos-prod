import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { SupabaseUserService, CreateUserData, LoginCredentials } from '../services/SupabaseUserService';

const router = express.Router();

// Enhanced validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Please provide a valid email address (max 255 characters)'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('First name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Last name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .isLength({ max: 128 })
    .withMessage('Password is required and must be less than 128 characters')
];

// Register new user
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    const userData: CreateUserData = {
      email,
      password,
      firstName,
      lastName
    };

    const result = await SupabaseUserService.register(userData);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.user,
      accessToken: result.session?.access_token,
      refreshToken: result.session?.refresh_token
    });

  } catch (error) {
    console.error('Registration error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body?.email,
      timestamp: new Date().toISOString()
    });

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      if (error.message.includes('Password validation failed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
});

// Login user
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const credentials: LoginCredentials = { email, password };
    const result = await SupabaseUserService.login(credentials);

    return res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      accessToken: result.session?.access_token,
      refreshToken: result.session?.refresh_token
    });

  } catch (error) {
    console.error('Login error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body?.email,
      timestamp: new Date().toISOString()
    });

    // Handle specific errors
    if (error instanceof Error && (
      error.message.includes('Invalid login credentials') ||
      error.message.includes('Email not confirmed') ||
      error.message.includes('Invalid email or password')
    )) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const result = await SupabaseUserService.refreshSession(refreshToken);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    return res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      user: result.user,
      accessToken: result.session?.access_token,
      refreshToken: result.session?.refresh_token
    });

  } catch (error) {
    console.error('Token refresh error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

// Get current user profile (requires valid session)
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const user = await SupabaseUserService.verifySession(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Profile fetch error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const currentUser = await SupabaseUserService.verifySession(token);
    
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const { firstName, lastName, avatar } = req.body;

    // Validate input
    if (firstName && (typeof firstName !== 'string' || firstName.length > 50 || !/^[a-zA-ZÀ-ÿ\s-']+$/.test(firstName))) {
      return res.status(400).json({
        success: false,
        message: 'First name must be a valid string with maximum 50 characters'
      });
    }

    if (lastName && (typeof lastName !== 'string' || lastName.length > 50 || !/^[a-zA-ZÀ-ÿ\s-']+$/.test(lastName))) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be a valid string with maximum 50 characters'
      });
    }

    if (avatar && (typeof avatar !== 'string' || avatar.length > 255)) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL must be a valid string with maximum 255 characters'
      });
    }

    // Update user
    const updatedUser = await SupabaseUserService.updateUserProfile(currentUser.id, {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      avatar
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

    await SupabaseUserService.logout(token);

    return res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
});

// Admin only - Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const currentUser = await SupabaseUserService.verifySession(token);
    
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page

    const { users, total } = await SupabaseUserService.getAllUsers(page, limit);

    return res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Users fetch error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Create default admin user (for initial setup)
router.post('/create-admin', async (req: Request, res: Response) => {
  try {
    // Only allow this in development or if no admin exists
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Admin creation disabled in production'
      });
    }

    const admin = await SupabaseUserService.createAdminUser();

    if (!admin) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create admin user'
      });
    }

    return res.json({
      success: true,
      message: 'Admin user created successfully',
      user: admin
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create admin user'
    });
  }
});

export default router;
