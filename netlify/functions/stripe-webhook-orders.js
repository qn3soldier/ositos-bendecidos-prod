const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
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

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_ORDERS || process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  console.log('Processing webhook event:', stripeEvent.type);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;

        // Проверяем что это заказ из магазина
        if (session.metadata?.type !== 'shop_order') {
          console.log('Not a shop order, skipping');
          return { statusCode: 200, headers, body: 'OK' };
        }

        console.log('Processing shop order:', session.id);

        // Парсим метаданные
        const items = JSON.parse(session.metadata.items || '[]');
        const shippingAddress = JSON.parse(session.metadata.shipping_address || '{}');

        // Создаем запись заказа
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            customer_email: session.customer_email || session.customer_details?.email,
            customer_name: session.metadata.customer_name || session.customer_details?.name || 'Guest',
            customer_phone: session.customer_details?.phone,
            shipping_address: shippingAddress,
            payment_status: 'succeeded',
            fulfillment_status: 'pending',
            subtotal: session.amount_subtotal / 100,
            shipping_cost: session.total_details?.amount_shipping / 100 || 0,
            tax: session.total_details?.amount_tax / 100 || 0,
            total: session.amount_total / 100
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          throw orderError;
        }

        console.log('Order created:', order.id);

        // Создаем записи order_items
        if (items.length > 0) {
          const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_price: item.price,
            product_image: item.image,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            console.error('Error creating order items:', itemsError);
            throw itemsError;
          }

          // Уменьшаем stock для каждого товара
          for (const item of items) {
            const { error: stockError } = await supabase
              .from('products')
              .update({
                stock: supabase.raw('stock - ?', [item.quantity])
              })
              .eq('id', item.product_id)
              .gt('stock', item.quantity - 1); // проверяем что достаточно товара

            if (stockError) {
              console.error(`Error updating stock for product ${item.product_id}:`, stockError);
            }
          }
        }

        console.log('Order processing completed');
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object;

        // Обновляем статус заказа если он существует
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating order status:', error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};