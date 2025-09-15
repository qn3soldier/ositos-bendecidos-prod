const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  try {
    // Handle /api/products/meta/categories
    if (path === '/meta/categories') {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .order('category');

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ categories: uniqueCategories })
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
        body: JSON.stringify({ 
          products: data || [],
          pagination: {
            total: count || 0,
            limit,
            offset
          }
        })
      };
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