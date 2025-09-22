const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Received checkout request:', event.body);

    // Check if Stripe key exists
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }
    const { items, customerEmail, customerName, shippingAddress } = JSON.parse(event.body);

    console.log('Parsed data:', {
      itemCount: items?.length,
      customerEmail,
      customerName,
      hasShippingAddress: !!shippingAddress
    });

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No items in cart' })
      };
    }

    // Создаем line items для Stripe
    const lineItems = await Promise.all(items.map(async (item) => {
      // Получаем актуальную цену из БД
      const { data: product } = await supabase
        .from('products')
        .select('price, name')
        .eq('id', item.id)
        .single();

      if (!product) {
        throw new Error(`Product ${item.id} not found`);
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: item.image ? [item.image] : [],
            metadata: {
              product_id: item.id
            }
          },
          unit_amount: Math.round(product.price * 100) // конвертируем в центы
        },
        quantity: item.quantity
      };
    }));

    // Считаем итоговую сумму
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 100 ? 0 : 10; // бесплатная доставка от $100
    const tax = subtotal * 0.07; // 7% налог

    // Создаем Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.URL || process.env.VITE_FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || process.env.VITE_FRONTEND_URL}/cart`,
      customer_email: customerEmail,

      // Добавляем доставку
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: shipping * 100,
              currency: 'usd',
            },
            display_name: subtotal > 100 ? 'Free Shipping' : 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
      ],

      // Метаданные для webhook
      metadata: {
        type: 'shop_order',
        customer_name: customerName || 'Guest',
        items: JSON.stringify(items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        }))),
        shipping_address: JSON.stringify(shippingAddress || {})
      },

      // Автоматический расчет налогов (опционально)
      // automatic_tax: {
      //   enabled: true,
      // },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};