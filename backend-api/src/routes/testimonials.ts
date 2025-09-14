import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// GET /api/testimonials - Get all testimonials
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      status = 'approved',
      category,
      featured,
      limit = '50',
      offset = '0',
      user_id
    } = req.query;

    let query = supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (featured !== undefined) {
      query = query.eq('is_featured', featured === 'true');
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: testimonials, error, count } = await query;

    if (error) {
      console.error('Error fetching testimonials:', error);
      return res.status(500).json({
        error: 'Failed to fetch testimonials',
        details: error.message
      });
    }

    return res.json({
      testimonials,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('Error in GET /testimonials:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/testimonials/:id - Get single testimonial
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: testimonial, error } = await supabaseAdmin
      .from('testimonials')
      .select('*, users(name, avatar_url, email)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching testimonial:', error);
      return res.status(404).json({
        error: 'Testimonial not found',
        details: error.message
      });
    }

    return res.json(testimonial);
  } catch (error) {
    console.error('Error in GET /testimonials/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/testimonials - Create new testimonial
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      name,
      story,
      location,
      image_url,
      tags = []
    } = req.body;

    // Validate required fields
    if (!name || !story) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'story']
      });
    }

    const { data: testimonial, error } = await supabaseAdmin
      .from('testimonials')
      .insert({
        user_id,
        name,
        story,
        location,
        image_url,
        tags,
        status: 'approved', // Auto-approve for demo
        is_featured: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating testimonial:', error);
      return res.status(500).json({
        error: 'Failed to create testimonial',
        details: error.message
      });
    }

    return res.status(201).json({
      message: 'Testimonial submitted successfully. It will be reviewed before publishing.',
      testimonial
    });
  } catch (error) {
    console.error('Error in POST /testimonials:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/testimonials/:id - Update testimonial
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.user_id;

    // Validate rating if provided
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    const { data: testimonial, error } = await supabaseAdmin
      .from('testimonials')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating testimonial:', error);
      return res.status(404).json({
        error: 'Testimonial not found or update failed',
        details: error.message
      });
    }

    return res.json({
      message: 'Testimonial updated successfully',
      testimonial
    });
  } catch (error) {
    console.error('Error in PUT /testimonials/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/testimonials/:id/approve - Approve testimonial (admin only)
router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: testimonial, error } = await supabaseAdmin
      .from('testimonials')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving testimonial:', error);
      return res.status(404).json({
        error: 'Testimonial not found or approval failed',
        details: error.message
      });
    }

    return res.json({
      message: 'Testimonial approved successfully',
      testimonial
    });
  } catch (error) {
    console.error('Error in PUT /testimonials/:id/approve:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/testimonials/:id/reject - Reject testimonial (admin only)
router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: testimonial, error } = await supabaseAdmin
      .from('testimonials')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting testimonial:', error);
      return res.status(404).json({
        error: 'Testimonial not found or rejection failed',
        details: error.message
      });
    }

    return res.json({
      message: 'Testimonial rejected',
      testimonial
    });
  } catch (error) {
    console.error('Error in PUT /testimonials/:id/reject:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/testimonials/:id/feature - Toggle featured status (admin only)
router.put('/:id/feature', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { featured = true } = req.body;

    const { data: testimonial, error } = await supabaseAdmin
      .from('testimonials')
      .update({
        is_featured: featured,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating featured status:', error);
      return res.status(404).json({
        error: 'Testimonial not found or update failed',
        details: error.message
      });
    }

    return res.json({
      message: `Testimonial ${featured ? 'featured' : 'unfeatured'} successfully`,
      testimonial
    });
  } catch (error) {
    console.error('Error in PUT /testimonials/:id/feature:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/testimonials/:id - Delete testimonial
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting testimonial:', error);
      return res.status(404).json({
        error: 'Testimonial not found or delete failed',
        details: error.message
      });
    }

    return res.json({
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /testimonials/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/testimonials/stats - Get testimonials statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    // Get total counts
    const { count: totalCount } = await supabaseAdmin
      .from('testimonials')
      .select('*', { count: 'exact', head: true });

    const { count: approvedCount } = await supabaseAdmin
      .from('testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: pendingCount } = await supabaseAdmin
      .from('testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: featuredCount } = await supabaseAdmin
      .from('testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true);

    // Get average rating
    const { data: testimonials } = await supabaseAdmin
      .from('testimonials')
      .select('rating')
      .eq('status', 'approved');

    const averageRating = testimonials && testimonials.length > 0
      ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
      : 0;

    // Get category distribution
    const { data: categories } = await supabaseAdmin
      .from('testimonials')
      .select('category')
      .eq('status', 'approved');

    const categoryDistribution = categories?.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      stats: {
        total: totalCount || 0,
        approved: approvedCount || 0,
        pending: pendingCount || 0,
        featured: featuredCount || 0,
        average_rating: averageRating.toFixed(2),
        category_distribution: categoryDistribution || {}
      }
    });
  } catch (error) {
    console.error('Error in GET /testimonials/stats/overview:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;