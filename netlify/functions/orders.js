const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// CORS Headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Helper: Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `OB-${timestamp}-${random}`;
};

// Helper: Calculate order totals
const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.0825; // 8.25% tax rate
  const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
  const total = subtotal + tax + shipping;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const path = event.path.replace('/.netlify/functions/orders', '').replace('/api/orders', '');
  const method = event.httpMethod;

  try {
    // POST /api/orders - Create new order
    if (method === 'POST' && !path) {
      const { items, customerInfo, shippingInfo, paymentMethod, paymentIntentId } = JSON.parse(event.body);

      // Validate required fields
      if (!items || !items.length || !customerInfo || !shippingInfo) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Missing required order information'
          })
        };
      }

      // Calculate totals
      const totals = calculateTotals(items);
      const orderNumber = generateOrderNumber();

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: uuidv4(),
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'pending',
          payment_method: paymentMethod || 'stripe',
          payment_intent_id: paymentIntentId,
          customer_email: customerInfo.email,
          customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          customer_phone: customerInfo.phone,
          shipping_address: {
            street: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zip: shippingInfo.zipCode,
            country: shippingInfo.country || 'USA'
          },
          billing_address: shippingInfo.billingAddress || {
            street: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zip: shippingInfo.zipCode,
            country: shippingInfo.country || 'USA'
          },
          subtotal: totals.subtotal,
          tax: totals.tax,
          shipping: totals.shipping,
          total: totals.total,
          currency: 'USD',
          notes: shippingInfo.notes
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        id: uuidv4(),
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product inventory
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('inventory_count')
          .eq('id', item.id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ 
              inventory_count: Math.max(0, product.inventory_count - item.quantity)
            })
            .eq('id', item.id);
        }
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          orderId: order.id,
          orderNumber: orderNumber,
          totals,
          message: 'Order created successfully'
        })
      };
    }

    // GET /api/orders/:id - Get order by ID
    if (method === 'GET' && path && !path.includes('/')) {
      const orderId = path.substring(1);

      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (error || !order) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Order not found'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order
        })
      };
    }

    // GET /api/orders - Get all orders (admin)
    if (method === 'GET' && !path) {
      const { page = 1, limit = 10, status, email } = event.queryStringParameters || {};
      const offset = (page - 1) * limit;

      let query = supabase
        .from('orders')
        .select('*, order_items(*)', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (email) {
        query = query.eq('customer_email', email);
      }

      const { data: orders, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          orders,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        })
      };
    }

    // PATCH /api/orders/:id/status - Update order status
    if (method === 'PATCH' && path.includes('/status')) {
      const orderId = path.split('/')[1];
      const { status, trackingNumber, carrierName } = JSON.parse(event.body);

      const updateData = { status };
      
      // Add shipping info if provided
      if (status === 'shipped' && trackingNumber) {
        updateData.tracking_number = trackingNumber;
        updateData.carrier_name = carrierName || 'USPS';
        updateData.shipped_at = new Date().toISOString();
      }

      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order,
          message: `Order status updated to ${status}`
        })
      };
    }

    // PATCH /api/orders/:id/payment - Update payment status
    if (method === 'PATCH' && path.includes('/payment')) {
      const orderId = path.split('/')[1];
      const { paymentStatus, paymentIntentId } = JSON.parse(event.body);

      const updateData = { 
        payment_status: paymentStatus,
        payment_intent_id: paymentIntentId || undefined
      };

      if (paymentStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.status = 'processing'; // Auto-update order status
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order,
          message: `Payment status updated to ${paymentStatus}`
        })
      };
    }

    // DELETE /api/orders/:id - Cancel order
    if (method === 'DELETE' && path) {
      const orderId = path.substring(1);

      // Check if order can be cancelled
      const { data: order } = await supabase
        .from('orders')
        .select('status, order_items(*)')
        .eq('id', orderId)
        .single();

      if (!order) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Order not found'
          })
        };
      }

      if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: `Cannot cancel order with status: ${order.status}`
          })
        };
      }

      // Restore inventory
      for (const item of order.order_items) {
        const { data: product } = await supabase
          .from('products')
          .select('inventory_count')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ 
              inventory_count: product.inventory_count + item.quantity
            })
            .eq('id', item.product_id);
        }
      }

      // Update order status to cancelled
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Order cancelled successfully'
        })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Orders API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};