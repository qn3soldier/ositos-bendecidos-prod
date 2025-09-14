import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserService, CreateUserData, IUser } from '../models/UserMongoDB';
import { PasswordUtils } from '../utils/password';
import { JWTUtils } from '../utils/jwt-production';
import { authenticateToken } from '../middleware/auth-production';
import { config } from '../config/production';

const router = express.Router();

// Enhanced validation rules for production
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Please provide a valid email address (max 255 characters)'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
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

    // Additional password strength validation
    const passwordValidation = PasswordUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordValidation.errors
      });
    }

    // Create user using MongoDB service
    const userData: CreateUserData = {
      email,
      password, // Will be hashed by MongoDB pre-save hook
      firstName,
      lastName
    };

    const newUser = await UserService.create(userData);
    const userProfile = UserService.toProfile(newUser);

    // Generate tokens
    const tokens = JWTUtils.generateTokenPair(userProfile);

    // Update last login
    await UserService.updateLastLogin(newUser.id);

    // Log successful registration
    console.log(`✅ User registered: ${email} (${newUser.id})`);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userProfile,
      ...tokens
    });

  } catch (error) {
    console.error('Registration error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body?.email,
      timestamp: new Date().toISOString()
    });

    // Handle specific errors
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
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

    // Find user
    const user = await UserService.findByEmail(email);
    if (!user) {
      // Log failed login attempt
      console.warn(`❌ Failed login attempt: ${email} (user not found)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password using the instance method
    const isPasswordValid = await (user as any).comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      console.warn(`❌ Failed login attempt: ${email} (invalid password)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await UserService.updateLastLogin(user.id);

    // Generate tokens
    const userProfile = UserService.toProfile(user);
    const tokens = JWTUtils.generateTokenPair(userProfile);

    // Log successful login
    console.log(`✅ User logged in: ${email} (${user.id})`);

    return res.json({
      success: true,
      message: 'Login successful',
      user: userProfile,
      ...tokens
    });

  } catch (error) {
    console.error('Login error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body?.email,
      timestamp: new Date().toISOString()
    });

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

    // Verify refresh token
    const payload = JWTUtils.verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await UserService.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const userProfile = UserService.toProfile(user);
    const tokens = JWTUtils.generateTokenPair(userProfile);

    console.log(`🔄 Tokens refreshed for user: ${user.email} (${user.id})`);

    return res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      ...tokens
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

// Get current user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await UserService.findById(req.user!.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = UserService.toProfile(user);

    return res.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Profile fetch error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, avatar } = req.body;
    const userId = req.user!.userId;

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
    const updatedUser = await UserService.update(userId, {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      avatar
    } as Partial<IUser>);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = UserService.toProfile(updatedUser);

    console.log(`📝 Profile updated for user: ${updatedUser.email} (${updatedUser.id})`);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userProfile
    });

  } catch (error) {
    console.error('Profile update error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Log logout action
    const user = await UserService.findById(req.user!.userId);
    if (user) {
      console.log(`👋 User logged out: ${user.email} (${user.id})`);
    }

    return res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
});

// Admin only - Get all users
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page

    const { users, total } = await UserService.getAllUsers(page, limit);

    return res.json({
      success: true,
      users: users.map(user => UserService.toProfile(user)),
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
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

export default router;
