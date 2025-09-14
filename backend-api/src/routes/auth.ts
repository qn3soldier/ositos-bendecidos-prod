import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel, CreateUserData } from '../models/User';
import { PasswordUtils } from '../utils/password';
import { JWTUtils } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    // Validate password strength
    const passwordValidation = PasswordUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hash(password);

    // Create user
    const userData: CreateUserData = {
      email,
      password: hashedPassword,
      firstName,
      lastName
    };

    const newUser = await UserModel.create(userData);
    const userProfile = UserModel.toProfile(newUser);

    // Generate tokens
    const tokens = JWTUtils.generateTokenPair(userProfile);

    // Update last login
    await UserModel.updateLastLogin(newUser.id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userProfile,
      ...tokens
    });

  } catch (error) {
    console.error('Registration error:', error);
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
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await PasswordUtils.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    const userProfile = UserModel.toProfile(user);
    const tokens = JWTUtils.generateTokenPair(userProfile);

    return res.json({
      success: true,
      message: 'Login successful',
      user: userProfile,
      ...tokens
    });

  } catch (error) {
    console.error('Login error:', error);
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
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const userProfile = UserModel.toProfile(user);
    const tokens = JWTUtils.generateTokenPair(userProfile);

    return res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      ...tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = UserModel.toProfile(user);

    return res.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
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
    if (firstName && (typeof firstName !== 'string' || firstName.length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'First name must be a string with maximum 50 characters'
      });
    }

    if (lastName && (typeof lastName !== 'string' || lastName.length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be a string with maximum 50 characters'
      });
    }

    // Update user
    const updatedUser = await UserModel.update(userId, {
      firstName,
      lastName,
      avatar
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = UserModel.toProfile(updatedUser);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Logout (client-side only since we're using stateless JWT)
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    // In a stateless JWT system, logout is mainly handled client-side by removing tokens
    // However, we can log this action for security/audit purposes
    console.log(`User ${req.user!.userId} logged out at ${new Date().toISOString()}`);

    return res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
});

export default router;
