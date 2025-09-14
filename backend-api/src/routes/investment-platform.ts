import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// GET /api/investment-platform/opportunities - Get all investment opportunities
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const { 
      category,
      status = 'active',
      min_amount,
      max_amount,
      location,
      limit = '50',
      offset = '0',
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('investment_opportunities')
      .select(`
        *,
        investments(amount, created_at),
        investment_updates(id, title, created_at, update_type, completion_percentage)
      `)
      .order(sort as string, { ascending: order === 'asc' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (min_amount) {
      query = query.gte('target_amount', parseFloat(min_amount as string));
    }

    if (max_amount) {
      query = query.lte('target_amount', parseFloat(max_amount as string));
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: opportunities, error, count } = await query;

    if (error) {
      console.error('Error fetching investment opportunities:', error);
      return res.status(500).json({
        error: 'Failed to fetch investment opportunities',
        details: error.message
      });
    }

    // Calculate derived fields for each opportunity
    const enrichedOpportunities = opportunities?.map(opp => {
      const totalInvested = opp.investments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0) || 0;
      const fundingProgress = opp.target_amount > 0 ? (totalInvested / opp.target_amount) * 100 : 0;
      const investorCount = opp.investments?.length || 0;
      const daysLeft = opp.funding_deadline ? 
        Math.max(0, Math.ceil((new Date(opp.funding_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
      
      return {
        ...opp,
        current_funded: totalInvested,
        funding_progress: Math.round(fundingProgress * 100) / 100,
        investor_count: investorCount,
        days_left: daysLeft,
        is_funded: fundingProgress >= 100,
        recent_updates: opp.investment_updates?.slice(0, 3) || []
      };
    });

    return res.json({
      opportunities: enrichedOpportunities,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum,
        has_more: count ? offsetNum + limitNum < count : false
      }
    });
  } catch (error) {
    console.error('Error in GET /opportunities:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/investment-platform/opportunities/:id - Get single opportunity with details
router.get('/opportunities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: opportunity, error } = await supabaseAdmin
      .from('investment_opportunities')
      .select(`
        *,
        investments(*, investor_id, investor_name, investor_email, is_anonymous),
        investment_updates(*)
      `)
      .eq('id', id)
      .single();

    if (error || !opportunity) {
      return res.status(404).json({
        error: 'Investment opportunity not found',
        details: error?.message
      });
    }

    // Calculate financial metrics
    const totalInvested = opportunity.investments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0) || 0;
    const fundingProgress = opportunity.target_amount > 0 ? (totalInvested / opportunity.target_amount) * 100 : 0;
    const investorCount = opportunity.investments?.length || 0;
    const daysLeft = opportunity.funding_deadline ? 
      Math.max(0, Math.ceil((new Date(opportunity.funding_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

    // Calculate investment statistics
    const investmentAmounts = opportunity.investments?.map((inv: any) => parseFloat(inv.amount)) || [];
    const avgInvestment = investmentAmounts.length > 0 ? 
      investmentAmounts.reduce((a: number, b: number) => a + b, 0) / investmentAmounts.length : 0;
    const maxInvestment = investmentAmounts.length > 0 ? Math.max(...investmentAmounts) : 0;
    const minInvestment = investmentAmounts.length > 0 ? Math.min(...investmentAmounts) : 0;

    // Anonymize investments based on is_anonymous flag
    const publicInvestments = opportunity.investments?.map((inv: any) => ({
      id: inv.id,
      amount: inv.amount,
      created_at: inv.created_at,
      investor_name: inv.is_anonymous ? 'Anonymous' : inv.investor_name,
      investment_type: inv.investment_type
    })) || [];

    return res.json({
      ...opportunity,
      current_funded: totalInvested,
      funding_progress: Math.round(fundingProgress * 100) / 100,
      investor_count: investorCount,
      days_left: daysLeft,
      is_funded: fundingProgress >= 100,
      investment_stats: {
        total_invested: totalInvested,
        average_investment: Math.round(avgInvestment * 100) / 100,
        max_investment: maxInvestment,
        min_investment: minInvestment,
        investor_count: investorCount
      },
      investments: publicInvestments,
      updates: opportunity.investment_updates || []
    });
  } catch (error) {
    console.error('Error in GET /opportunities/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/investment-platform/opportunities - Create new investment opportunity (Admin)
router.post('/opportunities', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      long_description,
      category,
      target_amount,
      minimum_investment = 100,
      location,
      expected_jobs = 0,
      expected_roi_percentage,
      timeline_months,
      beneficiaries_count = 0,
      community_impact,
      funding_deadline,
      project_start_date,
      project_end_date,
      images = [],
      documents = []
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !target_amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'description', 'category', 'target_amount']
      });
    }

    if (target_amount <= 0 || minimum_investment <= 0) {
      return res.status(400).json({
        error: 'Target amount and minimum investment must be greater than 0'
      });
    }

    const { data: opportunity, error } = await supabaseAdmin
      .from('investment_opportunities')
      .insert({
        title,
        description,
        long_description,
        category,
        target_amount,
        minimum_investment,
        location,
        expected_jobs,
        expected_roi_percentage,
        timeline_months,
        beneficiaries_count,
        community_impact,
        funding_deadline: funding_deadline ? new Date(funding_deadline).toISOString() : null,
        project_start_date: project_start_date ? new Date(project_start_date).toISOString() : null,
        project_end_date: project_end_date ? new Date(project_end_date).toISOString() : null,
        images,
        documents,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating investment opportunity:', error);
      return res.status(500).json({
        error: 'Failed to create investment opportunity',
        details: error.message
      });
    }

    return res.status(201).json({
      message: 'Investment opportunity created successfully',
      opportunity
    });
  } catch (error) {
    console.error('Error in POST /opportunities:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/investment-platform/opportunities/:id/invest - Make an investment
router.post('/opportunities/:id/invest', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      amount,
      investment_type = 'donation',
      investor_id,
      investor_name,
      investor_email,
      is_anonymous = false,
      payment_method,
      payment_id,
      expected_return_percentage,
      return_period_months,
      notes
    } = req.body;

    // Validate required fields
    if (!amount || !payment_method) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['amount', 'payment_method']
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Investment amount must be greater than 0'
      });
    }

    // Check if opportunity exists and is active
    const { data: opportunity, error: oppError } = await supabaseAdmin
      .from('investment_opportunities')
      .select('*')
      .eq('id', id)
      .single();

    if (oppError || !opportunity) {
      return res.status(404).json({
        error: 'Investment opportunity not found'
      });
    }

    if (opportunity.status !== 'active') {
      return res.status(400).json({
        error: 'Investment opportunity is not accepting investments'
      });
    }

    // Check minimum investment requirement
    if (amount < opportunity.minimum_investment) {
      return res.status(400).json({
        error: `Minimum investment amount is $${opportunity.minimum_investment}`
      });
    }

    // Check funding deadline
    if (opportunity.funding_deadline && new Date(opportunity.funding_deadline) < new Date()) {
      return res.status(400).json({
        error: 'Funding deadline has passed'
      });
    }

    // Calculate expected return amount for loans
    let expected_return_amount = 0;
    if (investment_type === 'loan' && expected_return_percentage) {
      expected_return_amount = amount * (1 + expected_return_percentage / 100);
    }

    // Create investment record
    const { data: investment, error: investError } = await supabaseAdmin
      .from('investments')
      .insert({
        opportunity_id: id,
        investor_id,
        amount,
        investment_type,
        expected_return_percentage,
        return_period_months,
        expected_return_amount,
        payment_method,
        payment_id,
        payment_status: 'completed', // Assume payment is processed externally
        investor_name: is_anonymous ? null : investor_name,
        investor_email,
        is_anonymous,
        status: 'active',
        notes
      })
      .select()
      .single();

    if (investError) {
      console.error('Error creating investment:', investError);
      return res.status(500).json({
        error: 'Failed to process investment',
        details: investError.message
      });
    }

    // Update opportunity's current funded amount
    const { data: allInvestments } = await supabaseAdmin
      .from('investments')
      .select('amount')
      .eq('opportunity_id', id)
      .eq('payment_status', 'completed');

    const totalFunded = allInvestments?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;

    // Update opportunity status if fully funded
    if (totalFunded >= opportunity.target_amount) {
      await supabaseAdmin
        .from('investment_opportunities')
        .update({ status: 'funded' })
        .eq('id', id);
    }

    return res.status(201).json({
      message: 'Investment processed successfully',
      investment,
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        total_funded: totalFunded,
        funding_progress: (totalFunded / opportunity.target_amount) * 100,
        is_fully_funded: totalFunded >= opportunity.target_amount
      }
    });
  } catch (error) {
    console.error('Error in POST /opportunities/:id/invest:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/investment-platform/opportunities/:id/updates - Add progress update
router.post('/opportunities/:id/updates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      update_type = 'progress',
      completion_percentage,
      funds_used,
      remaining_funds,
      images = [],
      documents = [],
      is_public = true
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'content']
      });
    }

    const { data: update, error } = await supabaseAdmin
      .from('investment_updates')
      .insert({
        opportunity_id: id,
        title,
        content,
        update_type,
        completion_percentage,
        funds_used,
        remaining_funds,
        images,
        documents,
        is_public
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating investment update:', error);
      return res.status(500).json({
        error: 'Failed to create update',
        details: error.message
      });
    }

    return res.status(201).json({
      message: 'Investment update created successfully',
      update
    });
  } catch (error) {
    console.error('Error in POST /opportunities/:id/updates:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/investment-platform/categories - Get investment categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('investment_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({
        error: 'Failed to fetch categories',
        details: error.message
      });
    }

    return res.json({ categories });
  } catch (error) {
    console.error('Error in GET /categories:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/investment-platform/stats - Get platform statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get total opportunities
    const { count: totalOpportunities } = await supabaseAdmin
      .from('investment_opportunities')
      .select('*', { count: 'exact', head: true });

    const { count: activeOpportunities } = await supabaseAdmin
      .from('investment_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: fundedOpportunities } = await supabaseAdmin
      .from('investment_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'funded');

    // Get investment statistics
    const { data: investments } = await supabaseAdmin
      .from('investments')
      .select('amount, investment_type, created_at')
      .eq('payment_status', 'completed');

    const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
    const totalInvestors = investments?.length || 0;
    const avgInvestment = totalInvestors > 0 ? totalInvested / totalInvestors : 0;

    // Get investment types breakdown
    const investmentTypes = investments?.reduce((acc: any, inv) => {
      acc[inv.investment_type] = (acc[inv.investment_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get monthly investment trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyInvestments = investments?.filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate >= monthStart && invDate <= monthEnd;
      }) || [];

      const monthlyAmount = monthlyInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

      monthlyTrends.push({
        month: date.toISOString().substring(0, 7), // YYYY-MM format
        amount: monthlyAmount,
        count: monthlyInvestments.length
      });
    }

    return res.json({
      platform_stats: {
        total_opportunities: totalOpportunities || 0,
        active_opportunities: activeOpportunities || 0,
        funded_opportunities: fundedOpportunities || 0,
        success_rate: totalOpportunities ? ((fundedOpportunities || 0) / totalOpportunities * 100).toFixed(2) : '0.00'
      },
      investment_stats: {
        total_invested: totalInvested,
        total_investors: totalInvestors,
        average_investment: Math.round(avgInvestment * 100) / 100,
        investment_types: investmentTypes
      },
      trends: {
        monthly: monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error in GET /stats:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;