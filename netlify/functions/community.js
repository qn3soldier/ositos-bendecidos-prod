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
  const path = event.path.replace('/.netlify/functions/community', '').replace('/api/community', '');
  const method = event.httpMethod;

  try {
    // GET all community requests
    if (method === 'GET' && path === '/requests') {
      const { data, error } = await supabase
        .from('community_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
    }

    // POST donation
    if (method === 'POST' && path.includes('/donate')) {
      const requestId = path.split('/')[2];
      const body = JSON.parse(event.body);
      
      // Add donation
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert([{
          request_id: requestId,
          user_id: body.user_id,
          amount: body.amount,
          payment_method: body.payment_method || 'direct',
          message: body.message
        }])
        .select()
        .single();

      if (donationError) throw donationError;

      // Update request totals
      const { data: request, error: requestError } = await supabase
        .from('community_requests')
        .select('raised_amount, goal_amount')
        .eq('id', requestId)
        .single();

      if (!requestError) {
        const newRaised = (request.raised_amount || 0) + body.amount;
        const updateData = {
          raised_amount: newRaised,
          status: newRaised >= request.goal_amount ? 'completed' : 'active'
        };

        await supabase
          .from('community_requests')
          .update(updateData)
          .eq('id', requestId);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, donation })
      };
    }

    // POST new request
    if (method === 'POST' && path === '/requests') {
      const body = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('community_requests')
        .insert([body])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, request: data })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, message: 'Not found' })
    };

  } catch (error) {
    console.error('Community API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};