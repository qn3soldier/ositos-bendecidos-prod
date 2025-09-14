const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'ositos-bendecidos-secret-key-2025';

// CORS Headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Helper: Verify admin token
const verifyAdminToken = async (authHeader, supabase) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'No token provided' };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', decoded.userId)
      .single();

    if (!user || user.role !== 'admin') {
      return { isValid: false, error: 'Unauthorized - Admin access required' };
    }

    return { isValid: true, userId: user.id };
  } catch (error) {
    return { isValid: false, error: 'Invalid token' };
  }
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const path = event.path.replace('/.netlify/functions/admin', '').replace('/api/admin', '');
  const method = event.httpMethod;

  // Verify admin authentication for all routes
  const authCheck = await verifyAdminToken(
    event.headers.authorization || event.headers.Authorization,
    supabase
  );

  if (!authCheck.isValid) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        message: authCheck.error
      })
    };
  }

  try {
    // GET /api/admin/stats - Dashboard statistics
    if (method === 'GET' && path === '/stats') {
      // Get various statistics
      const [
        { count: totalOrders },
        { count: totalProducts },
        { count: totalUsers },
        { count: totalPrayers },
        { data: recentOrders },
        { data: revenue }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('prayers').select('*', { count: 'exact', head: true }),
        supabase.from('orders')
          .select('id, order_number, customer_name, total, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('orders')
          .select('total, created_at')
          .eq('payment_status', 'paid')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Calculate revenue stats
      const totalRevenue = revenue.data?.reduce((sum, order) => sum + order.total, 0) || 0;
      const averageOrderValue = revenue.data?.length > 0 
        ? totalRevenue / revenue.data.length 
        : 0;

      // Get product inventory alerts (low stock)
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, inventory_count')
        .lt('inventory_count', 10)
        .order('inventory_count', { ascending: true });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          stats: {
            totalOrders,
            totalProducts,
            totalUsers,
            totalPrayers,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            recentOrders: recentOrders.data || [],
            lowStockProducts: lowStockProducts || []
          }
        })
      };
    }

    // GET /api/admin/users - Get all users
    if (method === 'GET' && path === '/users') {
      const { page = 1, limit = 20, search, role } = event.queryStringParameters || {};
      const offset = (page - 1) * limit;

      let query = supabase
        .from('users')
        .select('id, email, first_name, last_name, role, is_active, created_at, last_login', { count: 'exact' });

      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      if (role) {
        query = query.eq('role', role);
      }

      const { data: users, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          users,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        })
      };
    }

    // PUT /api/admin/users/:id - Update user
    if (method === 'PUT' && path.startsWith('/users/')) {
      const userId = path.replace('/users/', '');
      const updateData = JSON.parse(event.body);

      // Don't allow updating certain fields
      delete updateData.id;
      delete updateData.password;
      delete updateData.created_at;

      const { data: user, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user,
          message: 'User updated successfully'
        })
      };
    }

    // GET /api/admin/products - Manage products
    if (method === 'GET' && path === '/products') {
      const { page = 1, limit = 20, category, search } = event.queryStringParameters || {};
      const offset = (page - 1) * limit;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: products, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          products,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        })
      };
    }

    // PUT /api/admin/products/:id - Update product
    if (method === 'PUT' && path.startsWith('/products/')) {
      const productId = path.replace('/products/', '');
      const updateData = JSON.parse(event.body);

      // Update timestamp
      updateData.updated_at = new Date().toISOString();

      const { data: product, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          product,
          message: 'Product updated successfully'
        })
      };
    }

    // DELETE /api/admin/products/:id - Delete product
    if (method === 'DELETE' && path.startsWith('/products/')) {
      const productId = path.replace('/products/', '');

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Product deleted successfully'
        })
      };
    }

    // GET /api/admin/orders - Manage orders
    if (method === 'GET' && path === '/orders') {
      const { page = 1, limit = 20, status, dateFrom, dateTo } = event.queryStringParameters || {};
      const offset = (page - 1) * limit;

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            price,
            total
          )
        `, { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
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

    // GET /api/admin/reports/revenue - Revenue report
    if (method === 'GET' && path === '/reports/revenue') {
      const { period = '30d' } = event.queryStringParameters || {};
      
      let dateFrom;
      switch (period) {
        case '7d':
          dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, status')
        .eq('payment_status', 'paid')
        .gte('created_at', dateFrom.toISOString())
        .order('created_at', { ascending: true });

      // Group by date
      const revenueByDate = {};
      orders?.forEach(order => {
        const date = order.created_at.split('T')[0];
        if (!revenueByDate[date]) {
          revenueByDate[date] = { date, revenue: 0, orders: 0 };
        }
        revenueByDate[date].revenue += order.total;
        revenueByDate[date].orders += 1;
      });

      const chartData = Object.values(revenueByDate).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          report: {
            period,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalOrders,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            chartData
          }
        })
      };
    }

    // GET /api/admin/reports/products - Product performance report
    if (method === 'GET' && path === '/reports/products') {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, product_name, quantity, total');

      // Aggregate by product
      const productStats = {};
      orderItems?.forEach(item => {
        if (!productStats[item.product_id]) {
          productStats[item.product_id] = {
            id: item.product_id,
            name: item.product_name,
            unitsSold: 0,
            revenue: 0
          };
        }
        productStats[item.product_id].unitsSold += item.quantity;
        productStats[item.product_id].revenue += item.total;
      });

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          topProducts
        })
      };
    }

    // POST /api/admin/notifications - Send notification
    if (method === 'POST' && path === '/notifications') {
      const { type, title, message, recipients = 'all' } = JSON.parse(event.body);

      // Store notification
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([{
          type: type || 'info',
          title,
          message,
          recipients,
          created_by: authCheck.userId
        }])
        .select()
        .single();

      if (error) throw error;

      // In a real app, you'd send actual notifications here (email, push, etc.)

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          notification,
          message: 'Notification sent successfully'
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
    console.error('Admin API error:', error);
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