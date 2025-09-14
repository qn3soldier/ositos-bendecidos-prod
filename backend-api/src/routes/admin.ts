import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// GET /api/admin/stats/overview - Get overview statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    // Get user statistics
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Get product statistics
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: inStockProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('in_stock', true);

    // Get prayer statistics
    const { count: totalPrayers } = await supabaseAdmin
      .from('prayers')
      .select('*', { count: 'exact', head: true });

    const { count: activePrayers } = await supabaseAdmin
      .from('prayers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get community request statistics
    const { count: totalRequests } = await supabaseAdmin
      .from('community_requests')
      .select('*', { count: 'exact', head: true });

    const { count: openRequests } = await supabaseAdmin
      .from('community_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Get donation statistics
    const { data: donations } = await supabaseAdmin
      .from('donations')
      .select('amount');

    const totalDonations = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const donationCount = donations?.length || 0;

    // Get testimonial statistics
    const { count: totalTestimonials } = await supabaseAdmin
      .from('testimonials')
      .select('*', { count: 'exact', head: true });

    const { count: approvedTestimonials } = await supabaseAdmin
      .from('testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: pendingTestimonials } = await supabaseAdmin
      .from('testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return res.json({
      stats: {
        users: {
          total: totalUsers || 0,
          active_last_7_days: activeUsers || 0
        },
        products: {
          total: totalProducts || 0,
          in_stock: inStockProducts || 0,
          out_of_stock: (totalProducts || 0) - (inStockProducts || 0)
        },
        prayers: {
          total: totalPrayers || 0,
          active: activePrayers || 0,
          answered: (totalPrayers || 0) - (activePrayers || 0)
        },
        community: {
          total_requests: totalRequests || 0,
          open_requests: openRequests || 0,
          completed_requests: (totalRequests || 0) - (openRequests || 0)
        },
        donations: {
          total_amount: totalDonations,
          total_count: donationCount,
          average_donation: donationCount > 0 ? (totalDonations / donationCount).toFixed(2) : 0
        },
        testimonials: {
          total: totalTestimonials || 0,
          approved: approvedTestimonials || 0,
          pending: pendingTestimonials || 0
        }
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /admin/stats/overview:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/users - Get all users with pagination and filters
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { 
      role,
      status,
      search,
      limit = '50',
      offset = '0',
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order(sort as string, { ascending: order === 'asc' });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        error: 'Failed to fetch users',
        details: error.message
      });
    }

    // Remove sensitive data
    const sanitizedUsers = users?.map(user => {
      const { password_hash, ...safeUser } = user;
      return safeUser;
    });

    return res.json({
      users: sanitizedUsers,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/users:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/users/:id - Update user details
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.password_hash;
    delete updates.email; // Email changes should go through verification

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(404).json({
        error: 'User not found or update failed',
        details: error.message
      });
    }

    // Remove sensitive data
    const { password_hash, ...safeUser } = user;

    return res.json({
      message: 'User updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Error in PUT /admin/users/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/users/:id/ban - Ban or unban user
router.put('/users/:id/ban', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { banned = true, reason } = req.body;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        status: banned ? 'banned' : 'active',
        ban_reason: banned ? reason : null,
        banned_at: banned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error banning/unbanning user:', error);
      return res.status(404).json({
        error: 'User not found or update failed',
        details: error.message
      });
    }

    return res.json({
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error in PUT /admin/users/:id/ban:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/moderation/pending - Get all pending content for moderation
router.get('/moderation/pending', async (req: Request, res: Response) => {
  try {
    // Get pending prayers
    const { data: pendingPrayers } = await supabaseAdmin
      .from('prayers')
      .select('*, users(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get pending testimonials
    const { data: pendingTestimonials } = await supabaseAdmin
      .from('testimonials')
      .select('*, users(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get pending community requests
    const { data: pendingRequests } = await supabaseAdmin
      .from('community_requests')
      .select('*, users(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    return res.json({
      moderation: {
        prayers: pendingPrayers || [],
        testimonials: pendingTestimonials || [],
        community_requests: pendingRequests || []
      },
      counts: {
        prayers: pendingPrayers?.length || 0,
        testimonials: pendingTestimonials?.length || 0,
        community_requests: pendingRequests?.length || 0,
        total: (pendingPrayers?.length || 0) + (pendingTestimonials?.length || 0) + (pendingRequests?.length || 0)
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/moderation/pending:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/moderation/approve - Approve content
router.post('/moderation/approve', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'id']
      });
    }

    let table: string;
    switch (type) {
      case 'prayer':
        table = 'prayers';
        break;
      case 'testimonial':
        table = 'testimonials';
        break;
      case 'community_request':
        table = 'community_requests';
        break;
      default:
        return res.status(400).json({
          error: 'Invalid content type',
          valid_types: ['prayer', 'testimonial', 'community_request']
        });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving content:', error);
      return res.status(404).json({
        error: 'Content not found or approval failed',
        details: error.message
      });
    }

    return res.json({
      message: `${type} approved successfully`,
      data
    });
  } catch (error) {
    console.error('Error in POST /admin/moderation/approve:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/moderation/reject - Reject content
router.post('/moderation/reject', async (req: Request, res: Response) => {
  try {
    const { type, id, reason } = req.body;

    if (!type || !id) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'id']
      });
    }

    let table: string;
    switch (type) {
      case 'prayer':
        table = 'prayers';
        break;
      case 'testimonial':
        table = 'testimonials';
        break;
      case 'community_request':
        table = 'community_requests';
        break;
      default:
        return res.status(400).json({
          error: 'Invalid content type',
          valid_types: ['prayer', 'testimonial', 'community_request']
        });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting content:', error);
      return res.status(404).json({
        error: 'Content not found or rejection failed',
        details: error.message
      });
    }

    return res.json({
      message: `${type} rejected successfully`,
      data
    });
  } catch (error) {
    console.error('Error in POST /admin/moderation/reject:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/activity/recent - Get recent activity logs
router.get('/activity/recent', async (req: Request, res: Response) => {
  try {
    const { limit = '100' } = req.query;
    const limitNum = parseInt(limit as string);

    // Get recent prayers
    const { data: recentPrayers } = await supabaseAdmin
      .from('prayers')
      .select('id, title, created_at, user_id, users(name)')
      .order('created_at', { ascending: false })
      .limit(limitNum / 4);

    // Get recent donations
    const { data: recentDonations } = await supabaseAdmin
      .from('donations')
      .select('id, amount, created_at, user_id, users(name), community_requests(title)')
      .order('created_at', { ascending: false })
      .limit(limitNum / 4);

    // Get recent testimonials
    const { data: recentTestimonials } = await supabaseAdmin
      .from('testimonials')
      .select('id, title, created_at, user_id, users(name)')
      .order('created_at', { ascending: false })
      .limit(limitNum / 4);

    // Get recent user registrations
    const { data: recentUsers } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(limitNum / 4);

    // Combine and sort all activities
    const activities = [
      ...(recentPrayers || []).map(p => ({
        type: 'prayer',
        title: `New prayer: ${p.title}`,
        user: (p.users as any)?.name || 'Unknown',
        created_at: p.created_at
      })),
      ...(recentDonations || []).map(d => ({
        type: 'donation',
        title: `Donation $${d.amount} to ${(d.community_requests as any)?.title}`,
        user: (d.users as any)?.name || 'Unknown',
        created_at: d.created_at
      })),
      ...(recentTestimonials || []).map(t => ({
        type: 'testimonial',
        title: `New testimonial: ${t.title}`,
        user: (t.users as any)?.name || 'Unknown',
        created_at: t.created_at
      })),
      ...(recentUsers || []).map(u => ({
        type: 'user_registration',
        title: `New user registered: ${u.name}`,
        user: u.email,
        created_at: u.created_at
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, limitNum);

    return res.json({
      activities,
      total: activities.length
    });
  } catch (error) {
    console.error('Error in GET /admin/activity/recent:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/reports/revenue - Get revenue report
router.get('/reports/revenue', async (req: Request, res: Response) => {
  try {
    const { 
      start_date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date = new Date().toISOString()
    } = req.query;

    // Get donations in the period
    const { data: donations } = await supabaseAdmin
      .from('donations')
      .select('amount, created_at, payment_method')
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    // Calculate totals
    const totalRevenue = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const transactionCount = donations?.length || 0;

    // Group by payment method
    const byPaymentMethod = donations?.reduce((acc: any, d) => {
      acc[d.payment_method] = (acc[d.payment_method] || 0) + d.amount;
      return acc;
    }, {});

    // Group by day
    const byDay = donations?.reduce((acc: any, d) => {
      const day = d.created_at.split('T')[0];
      acc[day] = (acc[day] || 0) + d.amount;
      return acc;
    }, {});

    return res.json({
      report: {
        period: {
          start: start_date,
          end: end_date
        },
        summary: {
          total_revenue: totalRevenue,
          transaction_count: transactionCount,
          average_transaction: transactionCount > 0 ? (totalRevenue / transactionCount).toFixed(2) : 0
        },
        breakdown: {
          by_payment_method: byPaymentMethod || {},
          by_day: byDay || {}
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/reports/revenue:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;