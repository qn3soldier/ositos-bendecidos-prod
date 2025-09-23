const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

exports.handler = async (event) => {
  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get session_id from query params
    const { session_id } = event.queryStringParameters || {};

    if (!session_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'session_id is required' })
      };
    }

    // First try to get order from our database
    const { data: order, error: dbError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('stripe_checkout_session_id', session_id)
      .single();

    if (order) {
      // Order found in database
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order: {
            id: order.id,
            orderNumber: order.id.slice(0, 8).toUpperCase(),
            total: order.total,
            subtotal: order.subtotal,
            shipping: order.shipping_cost,
            tax: order.tax,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            status: order.payment_status,
            fulfillmentStatus: order.fulfillment_status,
            items: order.order_items,
            createdAt: order.created_at,
            shippingAddress: order.shipping_address
          }
        })
      };
    }

    // If not in database yet (webhook might be processing), get from Stripe
    console.log('Order not found in DB, fetching from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    });

    if (session) {
      // Return basic info from Stripe session
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order: {
            id: session.id,
            orderNumber: session.id.slice(-8).toUpperCase(),
            total: session.amount_total / 100,
            customerEmail: session.customer_email || session.customer_details?.email,
            customerName: session.customer_details?.name || 'Customer',
            status: session.payment_status,
            items: session.line_items?.data.map(item => ({
              product_name: item.description,
              quantity: item.quantity,
              subtotal: item.amount_total / 100
            })) || [],
            createdAt: new Date(session.created * 1000).toISOString()
          },
          fromStripe: true // Flag to indicate data is from Stripe, not DB
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Order not found' })
    };

  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch order',
        details: error.message
      })
    };
  }
};