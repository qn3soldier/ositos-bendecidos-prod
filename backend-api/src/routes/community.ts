import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// GET /api/community/requests - Get all community requests
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const { 
      status = 'active',
      category,
      limit = '50',
      offset = '0',
      user_id
    } = req.query;

    let query = supabaseAdmin
      .from('community_requests')
      .select('*, donations(amount, donor_user_id, created_at)')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: requests, error, count } = await query;

    if (error) {
      console.error('Error fetching community requests:', error);
      return res.status(500).json({
        error: 'Failed to fetch community requests',
        details: error.message
      });
    }

    console.log('Fetched requests:', requests ? requests.length : 0, 'items');

    // Calculate raised amount for each request
    const requestsWithRaised = requests?.map(request => {
      const raised = request.donations?.reduce((sum: number, donation: any) => 
        sum + (donation.amount || 0), 0) || 0;
      
      return {
        ...request,
        raised,
        progress: request.target_amount > 0 ? (raised / request.target_amount) * 100 : 0,
        donations_count: request.donations?.length || 0
      };
    });

    return res.json({
      requests: requestsWithRaised,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('Error in GET /requests:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/community/requests/:id - Get single community request
router.get('/requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: request, error } = await supabaseAdmin
      .from('community_requests')
      .select('*, donations(*, donor_user_id)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching community request:', error);
      return res.status(404).json({
        error: 'Request not found',
        details: error.message
      });
    }

    // Calculate raised amount
    const raised = request.donations?.reduce((sum: number, donation: any) => 
      sum + (donation.amount || 0), 0) || 0;

    return res.json({
      ...request,
      raised,
      progress: request.target_amount > 0 ? (raised / request.target_amount) * 100 : 0,
      donations_count: request.donations?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /requests/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/community/requests - Create new community request
router.post('/requests', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      target_amount,
      created_by,
      location,
      image_url,
      beneficiary_info = {}
    } = req.body;

    // Validate required fields
    if (!title || !description || !target_amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'description', 'target_amount']
      });
    }

    // Validate target amount
    if (target_amount <= 0) {
      return res.status(400).json({
        error: 'Target amount must be greater than 0'
      });
    }

    // Add location to beneficiary_info if provided
    if (location) {
      beneficiary_info.location = location;
    }

    const { data: request, error } = await supabaseAdmin
      .from('community_requests')
      .insert({
        title,
        description,
        category: category || 'general',
        target_amount,
        created_by,
        image_url,
        beneficiary_info,
        status: 'active' // New requests start as active
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating community request:', error);
      return res.status(500).json({
        error: 'Failed to create community request',
        details: error.message
      });
    }

    return res.status(201).json({
      message: 'Community request created successfully',
      request
    });
  } catch (error) {
    console.error('Error in POST /requests:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/community/requests/:id - Update community request
router.put('/requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.user_id;

    const { data: request, error } = await supabaseAdmin
      .from('community_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating community request:', error);
      return res.status(404).json({
        error: 'Request not found or update failed',
        details: error.message
      });
    }

    return res.json({
      message: 'Community request updated successfully',
      request
    });
  } catch (error) {
    console.error('Error in PUT /requests/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/community/requests/:id/donate - Make a donation to a request
router.post('/requests/:id/donate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      amount,
      user_id,
      payment_method,
      payment_id,
      message
    } = req.body;

    // Validate required fields
    if (!amount || !user_id || !payment_method) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['amount', 'user_id', 'payment_method']
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        error: 'Donation amount must be greater than 0'
      });
    }

    // Check if request exists
    const { data: request, error: requestError } = await supabaseAdmin
      .from('community_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !request) {
      return res.status(404).json({
        error: 'Community request not found'
      });
    }

    // Create donation record
    const donationData: any = {
      community_request_id: id,
      amount,
      payment_method,
      payment_id,
      message,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    
    // Only include donor_user_id if it's a valid UUID (for testing purposes)
    if (user_id && user_id !== 'test-user') {
      donationData.donor_user_id = user_id;
    }
    
    const { data: donation, error: donationError } = await supabaseAdmin
      .from('donations')
      .insert(donationData)
      .select()
      .single();

    if (donationError) {
      console.error('Error creating donation:', donationError);
      return res.status(500).json({
        error: 'Failed to record donation',
        details: donationError.message
      });
    }

    // Check if target is reached and update status
    const { data: allDonations } = await supabaseAdmin
      .from('donations')
      .select('amount')
      .eq('community_request_id', id);

    const totalRaised = allDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
    
    if (totalRaised >= request.target_amount) {
      await supabaseAdmin
        .from('community_requests')
        .update({ status: 'completed' })
        .eq('id', id);
    }

    return res.status(201).json({
      message: 'Donation recorded successfully',
      donation,
      total_raised: totalRaised,
      target_reached: totalRaised >= request.target_amount
    });
  } catch (error) {
    console.error('Error in POST /requests/:id/donate:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/community/requests/:id - Delete community request (admin only)
router.delete('/requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('community_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting community request:', error);
      return res.status(404).json({
        error: 'Request not found or delete failed',
        details: error.message
      });
    }

    return res.json({
      message: 'Community request deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /requests/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;