import express from 'express';
import Joi from 'joi';

const router = express.Router();

// In-memory storage for orders (replace with database in production)
const orders: any[] = [];

// Validation schemas
const createOrderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    image: Joi.string().optional(),
    category: Joi.string().optional()
  })).min(1).required(),
  
  customerInfo: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required()
  }).required(),
  
  shippingInfo: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('US'),
    shippingMethod: Joi.string().valid('standard', 'express', 'overnight').required()
  }).required(),
  
  totals: Joi.object({
    subtotal: Joi.number().positive().required(),
    tax: Joi.number().min(0).required(),
    shipping: Joi.number().min(0).required(),
    total: Joi.number().positive().required()
  }).required(),
  
  paymentMethod: Joi.string().valid('card', 'paypal').required()
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details
      });
    }

    // Generate order ID
    const orderId = `OB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create order object
    const order = {
      orderId,
      ...value,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store order (in production, save to database)
    orders.push(order);

    console.log('📦 New order created:', orderId);

    return res.status(201).json({
      success: true,
      orderId,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV !== 'production' ? error : undefined
    });
  }
});

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find order (in production, query database)
    const order = orders.find(o => o.orderId === orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find and update order (in production, update database)
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();

    console.log(`📋 Order ${orderId} status updated to: ${status}`);

    return res.json({
      success: true,
      message: 'Order status updated successfully',
      order: orders[orderIndex]
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Get all orders (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let filteredOrders = orders;
    
    // Filter by status if provided
    if (status) {
      filteredOrders = orders.filter(order => order.status === status);
    }

    // Sort by creation date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return res.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(filteredOrders.length / Number(limit)),
        totalOrders: filteredOrders.length,
        hasNext: endIndex < filteredOrders.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

export default router;
