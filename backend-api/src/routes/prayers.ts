import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// GET /api/prayers - Get all prayers with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      status = 'active',
      tags,
      limit = '50',
      offset = '0',
      user_id
    } = req.query;

    let query = supabaseAdmin
      .from('prayers')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    // Apply filters
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      query = query.overlaps('tags', tagsArray);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: prayers, error, count } = await query;

    if (error) {
      console.error('Error fetching prayers:', error);
      return res.status(500).json({
        error: 'Failed to fetch prayers',
        details: error.message
      });
    }

    return res.json({
      prayers,
      pagination: {
        total: count || prayers?.length || 0,
        limit: limitNum,
        offset: offsetNum
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /prayers:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/prayers/:id - Get specific prayer
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: prayer, error } = await supabaseAdmin
      .from('prayers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Prayer not found'
        });
      }
      console.error('Error fetching prayer:', error);
      return res.status(500).json({
        error: 'Failed to fetch prayer',
        details: error.message
      });
    }

    return res.json(prayer);

  } catch (error) {
    console.error('Unexpected error in GET /prayers/:id:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/prayers - Create new prayer
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      content,
      user_name,
      is_anonymous = false,
      tags = []
    } = req.body;

    // Basic validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Prayer content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        error: 'Prayer content must be less than 1000 characters'
      });
    }

    // Get user from JWT token (if authenticated)
    const authHeader = req.headers.authorization;
    let user_id = null;
    let displayName = user_name || 'Anonymous';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && user) {
        user_id = user.id;
        
        // Get user profile for display name
        if (!is_anonymous) {
          const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

          if (userProfile) {
            displayName = `${userProfile.first_name} ${userProfile.last_name.charAt(0)}.`;
          }
        }
      }
    }

    // Create prayer
    const prayerData = {
      content: content.trim(),
      user_id: is_anonymous ? null : user_id,
      user_name: is_anonymous ? 'Anonymous' : displayName,
      is_anonymous,
      tags: Array.isArray(tags) ? tags : [],
      prayer_count: 0,
      comment_count: 0,
      status: 'active'
    };

    const { data: prayer, error } = await supabaseAdmin
      .from('prayers')
      .insert([prayerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating prayer:', error);
      return res.status(500).json({
        error: 'Failed to create prayer',
        details: error.message
      });
    }

    return res.status(201).json(prayer);

  } catch (error) {
    console.error('Unexpected error in POST /prayers:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/prayers/:id/pray - Add prayer support
router.post('/:id/pray', async (req: Request, res: Response) => {
  try {
    const { id: prayerId } = req.params;

    // Get user from JWT token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required to pray for someone'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid authentication token'
      });
    }

    // Check if prayer exists
    const { data: prayer, error: prayerError } = await supabaseAdmin
      .from('prayers')
      .select('id')
      .eq('id', prayerId)
      .single();

    if (prayerError || !prayer) {
      return res.status(404).json({
        error: 'Prayer not found'
      });
    }

    // Add prayer interaction (will trigger prayer count update via database trigger)
    const { data: interaction, error: interactionError } = await supabaseAdmin
      .from('prayer_interactions')
      .insert([{
        prayer_id: prayerId,
        user_id: user.id,
        interaction_type: 'pray'
      }])
      .select()
      .single();

    if (interactionError) {
      if (interactionError.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          error: 'You have already prayed for this request'
        });
      }
      console.error('Error creating prayer interaction:', interactionError);
      return res.status(500).json({
        error: 'Failed to record prayer',
        details: interactionError.message
      });
    }

    // Get updated prayer count
    const { data: updatedPrayer } = await supabaseAdmin
      .from('prayers')
      .select('prayer_count')
      .eq('id', prayerId)
      .single();

    return res.status(201).json({
      message: 'Prayer recorded successfully',
      prayer_count: updatedPrayer?.prayer_count || 1
    });

  } catch (error) {
    console.error('Unexpected error in POST /prayers/:id/pray:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/prayers/:id/comment - Add comment to prayer
router.post('/:id/comment', async (req: Request, res: Response) => {
  try {
    const { id: prayerId } = req.params;
    const { comment_text } = req.body;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({
        error: 'Comment text is required'
      });
    }

    if (comment_text.length > 500) {
      return res.status(400).json({
        error: 'Comment must be less than 500 characters'
      });
    }

    // Get user from JWT token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required to comment'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid authentication token'
      });
    }

    // Check if prayer exists
    const { data: prayer, error: prayerError } = await supabaseAdmin
      .from('prayers')
      .select('id')
      .eq('id', prayerId)
      .single();

    if (prayerError || !prayer) {
      return res.status(404).json({
        error: 'Prayer not found'
      });
    }

    // Add comment interaction (will trigger comment count update via database trigger)
    const { data: interaction, error: interactionError } = await supabaseAdmin
      .from('prayer_interactions')
      .insert([{
        prayer_id: prayerId,
        user_id: user.id,
        interaction_type: 'comment',
        comment_text: comment_text.trim()
      }])
      .select()
      .single();

    if (interactionError) {
      console.error('Error creating comment:', interactionError);
      return res.status(500).json({
        error: 'Failed to add comment',
        details: interactionError.message
      });
    }

    // Get updated comment count
    const { data: updatedPrayer } = await supabaseAdmin
      .from('prayers')
      .select('comment_count')
      .eq('id', prayerId)
      .single();

    return res.status(201).json({
      message: 'Comment added successfully',
      comment_count: updatedPrayer?.comment_count || 1
    });

  } catch (error) {
    console.error('Unexpected error in POST /prayers/:id/comment:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/prayers/:id/interactions - Get prayer interactions (comments)
router.get('/:id/interactions', async (req: Request, res: Response) => {
  try {
    const { id: prayerId } = req.params;
    const { type = 'comment' } = req.query;

    const { data: interactions, error } = await supabaseAdmin
      .from('prayer_interactions')
      .select(`
        id,
        interaction_type,
        comment_text,
        created_at,
        user_id,
        users!inner(first_name, last_name)
      `)
      .eq('prayer_id', prayerId)
      .eq('interaction_type', type)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching prayer interactions:', error);
      return res.status(500).json({
        error: 'Failed to fetch interactions',
        details: error.message
      });
    }

    // Format interactions for response
    const formattedInteractions = interactions?.map(interaction => {
      const user = interaction.users as any; // Type assertion for Supabase join
      return {
        id: interaction.id,
        type: interaction.interaction_type,
        text: interaction.comment_text,
        created_at: interaction.created_at,
        user_name: user ? `${user.first_name} ${user.last_name?.charAt(0) || ''}.` : 'Anonymous'
      };
    }) || [];

    return res.json({
      interactions: formattedInteractions
    });

  } catch (error) {
    console.error('Unexpected error in GET /prayers/:id/interactions:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/prayers/tags - Get all available prayer tags
router.get('/meta/tags', async (req: Request, res: Response) => {
  try {
    const { data: prayers, error } = await supabaseAdmin
      .from('prayers')
      .select('tags')
      .not('tags', 'is', null)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching prayer tags:', error);
      return res.status(500).json({
        error: 'Failed to fetch tags',
        details: error.message
      });
    }

    // Extract unique tags from all prayers
    const allTags = prayers?.reduce((tags: string[], prayer) => {
      if (prayer.tags && Array.isArray(prayer.tags)) {
        tags.push(...prayer.tags);
      }
      return tags;
    }, []) || [];

    const uniqueTags = [...new Set(allTags)].sort();
    
    return res.json({
      tags: uniqueTags
    });

  } catch (error) {
    console.error('Unexpected error in GET /prayers/meta/tags:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;