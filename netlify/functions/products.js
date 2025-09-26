const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Check if environment variables are loaded
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables in products function:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Server configuration error'
      })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const method = event.httpMethod;
  const path = event.path.replace('/.netlify/functions/products', '');
  console.log('Products API - Method:', method, 'Path:', path, 'Full path:', event.path);

  try {
    // Handle /api/products/meta/categories
    if (path === '/meta/categories' || path.includes('/meta/categories')) {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('status', 'active')
        .order('category');

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(uniqueCategories) // Return array directly
      };
    }

    // GET all products with filters
    if (method === 'GET') {
      const params = event.queryStringParameters || {};
      let query = supabase.from('products').select('*');
      
      if (params.category) {
        query = query.eq('category', params.category);
      }
      
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      
      const limit = parseInt(params.limit) || 50;
      const offset = parseInt(params.offset) || 0;
      
      query = query.range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || []) // Return array directly for GET requests
      };
    }

    // Admin-only operations
    if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
      // Check authorization
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }

      const token = authHeader.substring(7);
      let decoded;

      try {
        decoded = jwt.verify(token, jwtSecret);

        // Verify user is admin
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', decoded.id)
          .single();

        if (!user || user.role !== 'admin') {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ success: false, message: 'Admin access required' })
          };
        }
      } catch (error) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, message: 'Invalid token' })
        };
      }
    }

    // POST new product
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('products')
        .insert([body])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, product: data })
      };
    }

    // PATCH update product
    if (method === 'PATCH') {
      // Get product ID from query params
      const params = event.queryStringParameters || {};
      const productId = params.id;
      console.log('PATCH - productId:', productId, 'params:', params);

      if (!productId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Product ID required. Use ?id=productId' })
        };
      }

      const body = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('products')
        .update(body)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, product: data })
      };
    }

    // DELETE product
    if (method === 'DELETE') {
      // Get product ID from query params
      const params = event.queryStringParameters || {};
      const productId = params.id;
      console.log('DELETE - productId:', productId, 'params:', params);

      if (!productId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Product ID required. Use ?id=productId' })
        };
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Products API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};