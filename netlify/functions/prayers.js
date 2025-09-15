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
  const path = event.path.replace('/.netlify/functions/prayers', '').replace('/api/prayers', '');
  const method = event.httpMethod;

  try {
    // GET all prayers
    if (method === 'GET' && !path) {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
    }

    // POST new prayer
    if (method === 'POST' && !path) {
      const body = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('prayers')
        .insert([body])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, prayer: data })
      };
    }

    // POST prayer interaction (like)
    if (method === 'POST' && path.includes('/pray')) {
      const prayerId = path.split('/')[1];
      const body = JSON.parse(event.body);
      
      // Add prayer interaction
      const { data: interaction, error: interactionError } = await supabase
        .from('prayer_interactions')
        .insert([{
          prayer_id: prayerId,
          user_id: body.user_id,
          interaction_type: 'prayer'
        }])
        .select()
        .single();

      if (interactionError && !interactionError.message.includes('duplicate')) {
        throw interactionError;
      }

      // Update prayer count
      const { data: prayer, error: prayerError } = await supabase
        .from('prayers')
        .select('prayer_count')
        .eq('id', prayerId)
        .single();

      if (!prayerError) {
        await supabase
          .from('prayers')
          .update({ prayer_count: (prayer.prayer_count || 0) + 1 })
          .eq('id', prayerId);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Prayer recorded' })
      };
    }

    // POST comment
    if (method === 'POST' && path.includes('/comments')) {
      const prayerId = path.split('/')[1];
      const body = JSON.parse(event.body);
      
      const { data, error } = await supabase
        .from('prayer_comments')
        .insert([{
          prayer_id: prayerId,
          user_id: body.user_id,
          user_name: body.user_name,
          content: body.content
        }])
        .select()
        .single();

      if (error) throw error;

      // Update comment count
      await supabase.rpc('increment_prayer_comments', { prayer_id: prayerId });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, comment: data })
      };
    }

    // GET interactions (comments)
    if (method === 'GET' && path.includes('/interactions')) {
      const prayerId = path.split('/')[1];
      const type = event.queryStringParameters?.type || 'comment';

      const { data, error } = await supabase
        .from('prayer_interactions')
        .select('*')
        .eq('prayer_id', prayerId)
        .eq('interaction_type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
    }

    // GET comments (legacy support)
    if (method === 'GET' && path.includes('/comments')) {
      const prayerId = path.split('/')[1];

      const { data, error } = await supabase
        .from('prayer_comments')
        .select('*')
        .eq('prayer_id', prayerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, message: 'Not found' })
    };

  } catch (error) {
    console.error('Prayer API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};