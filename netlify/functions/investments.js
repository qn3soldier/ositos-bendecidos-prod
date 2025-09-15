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
  const path = event.path.replace('/.netlify/functions/investments', '').replace('/api/investments', '').replace('/api/investment-platform', '');
  const method = event.httpMethod;

  try {
    // GET /opportunities - Get all investment opportunities
    if (method === 'GET' && path === '/opportunities') {
      const { data, error } = await supabase
        .from('investment_opportunities')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          opportunities: data || []
        })
      };
    }

    // POST /inquiries - Submit investment inquiry
    if (method === 'POST' && path === '/inquiries') {
      const body = JSON.parse(event.body);

      const inquiryData = {
        full_name: body.fullName,
        email: body.email,
        investment_amount: parseFloat(body.investmentAmount) || 0,
        interest_area: body.interestArea,
        message: body.message,
        receive_updates: body.receiveUpdates || false,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('investment_inquiries')
        .insert([inquiryData])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          inquiry: data,
          message: 'Thank you for your interest! We will contact you soon.'
        })
      };
    }

    // POST /opportunities/:id/invest - Make an investment
    if (method === 'POST' && path.includes('/invest')) {
      const pathParts = path.split('/');
      const opportunityId = pathParts[2];
      const body = JSON.parse(event.body);

      const investmentData = {
        opportunity_id: opportunityId,
        amount: body.amount,
        investment_type: body.investment_type || 'donation',
        payment_method: body.payment_method,
        investor_name: body.investor_name,
        investor_email: body.investor_email,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('investments')
        .insert([investmentData])
        .select()
        .single();

      if (error) throw error;

      // Update opportunity funded amount
      const { data: opportunity } = await supabase
        .from('investment_opportunities')
        .select('current_funded, investor_count')
        .eq('id', opportunityId)
        .single();

      if (opportunity) {
        await supabase
          .from('investment_opportunities')
          .update({
            current_funded: (opportunity.current_funded || 0) + body.amount,
            investor_count: (opportunity.investor_count || 0) + 1
          })
          .eq('id', opportunityId);
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          investment: data,
          message: 'Investment processed successfully!'
        })
      };
    }

    // GET /categories - Get investment categories
    if (method === 'GET' && path === '/categories') {
      const { data, error } = await supabase
        .from('investment_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          categories: data || []
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Endpoint not found',
        path: path,
        method: method
      })
    };

  } catch (error) {
    console.error('Investments API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error.message
      })
    };
  }
};