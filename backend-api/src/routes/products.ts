import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// GET /api/products - Get all products with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      in_stock, 
      search,
      limit = '50',
      offset = '0'
    } = req.query;

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('in_stock', true) // Only show products that are in stock by default
      .order('created_at', { ascending: false });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (in_stock !== undefined) {
      query = query.eq('in_stock', in_stock === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({
        error: 'Failed to fetch products',
        details: error.message
      });
    }

    return res.json({
      products,
      pagination: {
        total: count || products?.length || 0,
        limit: limitNum,
        offset: offsetNum
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /products:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/:id - Get specific product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Product not found'
        });
      }
      console.error('Error fetching product:', error);
      return res.status(500).json({
        error: 'Failed to fetch product',
        details: error.message
      });
    }

    return res.json(product);

  } catch (error) {
    console.error('Unexpected error in GET /products/:id:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/products - Create new product (Admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      category = 'general',
      image_url,
      inventory_count = 0,
      in_stock = true
    } = req.body;

    // Basic validation
    if (!name || !price) {
      return res.status(400).json({
        error: 'Missing required fields: name and price are required'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        error: 'Price must be non-negative'
      });
    }

    // Get user from JWT token (if authenticated)
    const authHeader = req.headers.authorization;
    let created_by = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && user) {
        // Check if user is admin
        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!userProfile || userProfile.role !== 'admin') {
          return res.status(403).json({
            error: 'Insufficient permissions. Admin access required.'
          });
        }

        created_by = user.id;
      } else {
        return res.status(401).json({
          error: 'Invalid authentication token'
        });
      }
    } else {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([{
        name,
        description,
        price: parseFloat(price),
        category,
        image_url,
        inventory_count: parseInt(inventory_count),
        in_stock: Boolean(in_stock),
        created_by
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({
        error: 'Failed to create product',
        details: error.message
      });
    }

    return res.status(201).json(product);

  } catch (error) {
    console.error('Unexpected error in POST /products:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      image_url,
      inventory_count,
      in_stock,
      rating
    } = req.body;

    // Authentication check (same as POST)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid authentication token'
      });
    }

    // Check if user is admin
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions. Admin access required.'
      });
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (priceNum < 0) {
        return res.status(400).json({ error: 'Price must be non-negative' });
      }
      updateData.price = priceNum;
    }
    if (category !== undefined) updateData.category = category;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (inventory_count !== undefined) updateData.inventory_count = parseInt(inventory_count);
    if (in_stock !== undefined) updateData.in_stock = Boolean(in_stock);
    if (rating !== undefined) {
      const ratingNum = parseFloat(rating);
      if (ratingNum < 0 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be between 0 and 5' });
      }
      updateData.rating = ratingNum;
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Product not found'
        });
      }
      console.error('Error updating product:', error);
      return res.status(500).json({
        error: 'Failed to update product',
        details: error.message
      });
    }

    return res.json(product);

  } catch (error) {
    console.error('Unexpected error in PUT /products/:id:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Authentication check (same as POST)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid authentication token'
      });
    }

    // Check if user is admin
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions. Admin access required.'
      });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({
        error: 'Failed to delete product',
        details: error.message
      });
    }

    return res.status(204).send();

  } catch (error) {
    console.error('Unexpected error in DELETE /products/:id:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/categories - Get all product categories
router.get('/meta/categories', async (req: Request, res: Response) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({
        error: 'Failed to fetch categories',
        details: error.message
      });
    }

    // Extract unique categories
    const uniqueCategories = [...new Set(categories.map(item => item.category))];
    
    return res.json({
      categories: uniqueCategories
    });

  } catch (error) {
    console.error('Unexpected error in GET /products/categories:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;