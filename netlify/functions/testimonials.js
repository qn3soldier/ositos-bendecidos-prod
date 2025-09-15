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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const method = event.httpMethod;

  try {
    // GET all testimonials
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, testimonials: data })
      };
    }

    // POST new testimonial
    if (method === 'POST') {
      const body = JSON.parse(event.body);

      // Validate required fields
      if (!body.name || !body.story) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Name and story are required'
          })
        };
      }

      // Prepare testimonial data with defaults
      const testimonialData = {
        name: body.name,
        email: body.email || null,
        story: body.story,
        location: body.location || null,
        impact_category: body.impactCategory || null,
        status: 'pending',
        is_verified: false,
        is_featured: false,
        tags: body.tags || []
      };

      const { data, error } = await supabase
        .from('testimonials')
        .insert([testimonialData])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, testimonial: data })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, message: 'Not found' })
    };

  } catch (error) {
    console.error('Testimonials API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};