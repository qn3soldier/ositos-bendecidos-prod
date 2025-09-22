const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'ositos-bendecidos-secret-key-2025';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check auth and admin role
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'No authorization token' })
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (!user || user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // GET - Fetch records from table
    if (event.httpMethod === 'GET') {
      const table = event.queryStringParameters?.table;

      if (!table) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Table parameter required' })
        };
      }

      const { data: records, error } = await supabase
        .from(table)
        .select('*')
        .limit(100);

      if (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ records })
      };
    }

    // DELETE - Delete a record
    if (event.httpMethod === 'DELETE') {
      const { table, id } = JSON.parse(event.body);

      if (!table || !id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Table and ID required' })
        };
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }
};