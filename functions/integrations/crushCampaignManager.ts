import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Crush AI Campaign Manager
 * Full MCP Composio integration for automated media buying
 * 
 * Features:
 * - Create and manage campaigns
 * - Upload and optimize creatives
 * - Automated A/B testing
 * - Performance-based budget allocation
 * - Creative rotation and scaling
 */

// Crush AI API Configuration
const CRUSH_API_BASE = 'https://api.trycrush.ai/v1';
const CRUSH_API_KEY = Deno.env.get('CRUSH_API_KEY');

/**
 * Main campaign creation endpoint
 * Creates a new Crush AI campaign with automated settings
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      campaign_name,
      objective = 'conversions', // conversions, awareness, traffic
      budget_daily = 50,
      budget_total = 500,
      target_audience = {},
      creatives = [],
      start_date,
      end_date,
      ab_test_config = {}
    } = await req.json();

    if (!campaign_name) {
      return Response.json({ error: 'Campaign name required' }, { status: 400 });
    }

    // Create campaign in Crush AI
    const campaign = await createCrushCampaign({
      name: campaign_name,
      objective,
      budget: {
        daily: budget_daily,
        total: budget_total
      },
      audience: target_audience,
      schedule: {
        start: start_date || new Date().toISOString(),
        end: end_date
      },
      ab_test: ab_test_config
    });

    // Store campaign in LocalRnk
    const localCampaign = await base44.asServiceRole.entities.CrushCampaign.create({
      crush_campaign_id: campaign.id,
      name: campaign_name,
      objective,
      budget_daily,
      budget_total,
      status: 'pending',
      target_audience,
      created_by: user.id,
      crush_data: campaign
    });

    // Upload creatives if provided
    if (creatives.length > 0) {
      const uploadedCreatives = await Promise.all(
        creatives.map(creative => uploadCreative(campaign.id, creative))
      );

      // Store creative references
      await Promise.all(
        uploadedCreatives.map((cr, index) => 
          base44.asServiceRole.entities.CrushCreative.create({
            campaign_id: localCampaign.id,
            crush_creative_id: cr.id,
            name: creatives[index].name,
            type: creatives[index].type,
            url: cr.url,
            status: 'active'
          })
        )
      );
    }

    // Launch campaign
    const launched = await launchCampaign(campaign.id);

    // Update status
    await base44.asServiceRole.entities.CrushCampaign.update(localCampaign.id, {
      status: 'active',
      launched_at: new Date().toISOString(),
      crush_data: launched
    });

    return Response.json({
      success: true,
      campaign: {
        id: localCampaign.id,
        crush_id: campaign.id,
        name: campaign_name,
        status: 'active',
        budget: { daily: budget_daily, total: budget_total }
      },
      message: 'Campaign created and launched successfully'
    });

  } catch (error) {
    console.error('Campaign creation error:', error);
    
    await logError(base44, 'campaign_creation_failed', error);
    
    return Response.json({
      error: 'Failed to create campaign',
      details: error.message
    }, { status: 500 });
  }
}));

/**
 * Create campaign in Crush AI
 */
async function createCrushCampaign(config) {
  if (!CRUSH_API_KEY) {
    throw new Error('CRUSH_API_KEY not configured');
  }

  const response = await fetch(`${CRUSH_API_BASE}/campaigns`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRUSH_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Crush AI API error: ${error}`);
  }

  return await response.json();
}

/**
 * Upload creative to Crush AI
 */
async function uploadCreative(campaignId, creative) {
  const formData = new FormData();
  formData.append('file', creative.file);
  formData.append('name', creative.name);
  formData.append('type', creative.type); // image, video
  formData.append('campaign_id', campaignId);

  const response = await fetch(`${CRUSH_API_BASE}/creatives`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRUSH_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload creative');
  }

  return await response.json();
}

/**
 * Launch campaign
 */
async function launchCampaign(campaignId) {
  const response = await fetch(`${CRUSH_API_BASE}/campaigns/${campaignId}/launch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRUSH_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
}

/**
 * Automated campaign optimization
 * Runs every hour via cron
 */
export async function optimizeCampaigns(base44) {
  // Get active campaigns
  const campaigns = await base44.asServiceRole.entities.CrushCampaign.filter({
    status: 'active'
  });

  for (const campaign of campaigns) {
    try {
      // Get performance metrics
      const metrics = await getCampaignMetrics(campaign.crush_campaign_id);
      
      // Check CPA threshold
      if (metrics.cpa > 100) {
        // Pause underperforming campaign
        await pauseCampaign(campaign.crush_campaign_id);
        
        await base44.asServiceRole.entities.CrushCampaign.update(campaign.id, {
          status: 'paused',
          pause_reason: 'high_cpa',
          metrics
        });

        // Send alert
        await base44.asServiceRole.entities.Alert.create({
          type: 'campaign_paused',
          severity: 'high',
          message: `Campaign ${campaign.name} paused - CPA $${metrics.cpa}`,
          metadata: { campaign_id: campaign.id, metrics }
        });
      }

      // Scale winners (CPA < $50)
      if (metrics.cpa < 50 && metrics.roas > 3) {
        await scaleCampaign(campaign.crush_campaign_id, 2); // 2x budget
        
        await base44.asServiceRole.entities.CrushCampaign.update(campaign.id, {
          budget_scaled: true,
          scale_factor: 2,
          metrics
        });
      }

      // Creative rotation
      if (metrics.creative_fatigue > 0.8) {
        await rotateCreatives(campaign.crush_campaign_id);
      }

    } catch (error) {
      console.error(`Optimization error for campaign ${campaign.id}:`, error);
    }
  }
}

/**
 * Get campaign metrics from Crush AI
 */
async function getCampaignMetrics(campaignId) {
  const response = await fetch(
    `${CRUSH_API_BASE}/campaigns/${campaignId}/metrics`,
    {
      headers: { 'Authorization': `Bearer ${CRUSH_API_KEY}` }
    }
  );

  return await response.json();
}

/**
 * Pause campaign
 */
async function pauseCampaign(campaignId) {
  await fetch(`${CRUSH_API_BASE}/campaigns/${campaignId}/pause`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CRUSH_API_KEY}` }
  });
}

/**
 * Scale campaign budget
 */
async function scaleCampaign(campaignId, factor) {
  await fetch(`${CRUSH_API_BASE}/campaigns/${campaignId}/scale`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRUSH_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ scale_factor: factor })
  });
}

/**
 * Rotate creatives
 */
async function rotateCreatives(campaignId) {
  await fetch(`${CRUSH_API_BASE}/campaigns/${campaignId}/rotate-creatives`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CRUSH_API_KEY}` }
  });
}

/**
 * Log error
 */
async function logError(base44, type, error) {
  try {
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type: type,
      severity: 'high',
      message: error.message,
      stack_trace: error.stack
    });
  } catch {}
}
