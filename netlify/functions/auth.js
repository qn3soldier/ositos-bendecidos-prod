const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'ositos-bendecidos-secret-key-2025';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ositos-bendecidos-refresh-2025';

// CORS Headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// Helper: Generate tokens
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Helper: Verify token
const verifyToken = (token, secret = JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const path = event.path.replace('/.netlify/functions/auth', '').replace('/api/auth', '');
  const method = event.httpMethod;

  try {
    // POST /api/auth/register
    if (method === 'POST' && path === '/register') {
      const { email, password, firstName, lastName } = JSON.parse(event.body);

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'All fields are required'
          })
        };
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'User with this email already exists'
          })
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user in database
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: 'user',
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(newUser.id, email);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role
          },
          accessToken,
          refreshToken
        })
      };
    }

    // POST /api/auth/login
    if (method === 'POST' && path === '/login') {
      const { email, password } = JSON.parse(event.body);

      // Validate input
      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Email and password are required'
          })
        };
      }

      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Invalid email or password'
          })
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Invalid email or password'
          })
        };
      }

      // Check if user is active
      if (!user.is_active) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Account is deactivated'
          })
        };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id, email);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          },
          accessToken,
          refreshToken
        })
      };
    }

    // POST /api/auth/refresh
    if (method === 'POST' && path === '/refresh') {
      const { refreshToken } = JSON.parse(event.body);

      if (!refreshToken) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Refresh token is required'
          })
        };
      }

      // Verify refresh token
      const decoded = verifyToken(refreshToken, JWT_REFRESH_SECRET);
      if (!decoded) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Invalid refresh token'
          })
        };
      }

      // Generate new tokens
      const tokens = generateTokens(decoded.userId, decoded.email);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          ...tokens
        })
      };
    }

    // GET /api/auth/verify
    if (method === 'GET' && path === '/verify') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'No token provided'
          })
        };
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }

      // Get user data
      const { data: user } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .eq('id', decoded.userId)
        .single();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          } : null
        })
      };
    }

    // POST /api/auth/logout
    if (method === 'POST' && path === '/logout') {
      // In a real app, you might want to blacklist the token
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully'
        })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Auth API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};