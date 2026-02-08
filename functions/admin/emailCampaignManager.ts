import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler } from './utils/errorHandler.js';

/**
 * Email Campaign Manager - Advanced Broadcast & Sequencing
 * Enhanced with WOMP framework and meta ad image integration
 * Part of Admin Super Control Console
 */

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action, payload } = await req.json();

    switch (action) {
      case 'broadcast':
        return await handleBroadcast(base44, payload);
      case 'add_to_sequence':
        return await handleAddToSequence(base44, payload);
      case 'create_campaign':
        return await handleCreateCampaign(base44, payload);
      case 'get_campaigns':
        return await handleGetCampaigns(base44);
      case 'get_sequences':
        return await handleGetSequences(base44);
      case 'get_workflows':
        return await handleGetWorkflows(base44);
      case 'update_campaign':
        return await handleUpdateCampaign(base44, payload);
      case 'pause_campaign':
        return await handlePauseCampaign(base44, payload);
      case 'resume_campaign':
        return await handleResumeCampaign(base44, payload);
      case 'get_analytics':
        return await handleGetAnalytics(base44, payload);
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Email campaign manager error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

/**
 * Broadcast Email to Target Audience
 */
async function handleBroadcast(base44, payload) {
  const { 
    segment = 'all', 
    template_id, 
    subject, 
    body,
    variant = 'A',
    schedule_at = null,
    test_mode = false
  } = payload;

  // Build audience query
  let audienceQuery = {};
  
  switch (segment) {
    case 'all_leads':
      audienceQuery = { email: { $exists: true } };
      break;
    case 'active_nurture':
      audienceQuery = { status: 'active', email: { $exists: true } };
      break;
    case 'abandoned_cart':
      audienceQuery = { cart_abandoned: true, email: { $exists: true } };
      break;
    case 'completed_quiz':
      audienceQuery = { quiz_completed: true, email: { $exists: true } };
      break;
    case 'paid_customers':
      audienceQuery = { payment_status: 'paid', email: { $exists: true } };
      break;
    case 'custom':
      audienceQuery = payload.custom_query || {};
      break;
  }

  // Get target audience
  const leads = await base44.asServiceRole.entities.Lead.filter(audienceQuery, '-created_date', 1000);
  
  if (test_mode) {
    return Response.json({
      success: true,
      mode: 'test',
      audience_size: leads.length,
      segment,
      variant,
      would_send_to: leads.slice(0, 5).map(l => ({ email: l.email, name: l.business_name }))
    });
  }

  // Send emails with rate limiting
  let sent = 0;
  let failed = 0;
  const batchId = crypto.randomUUID();

  for (const lead of leads) {
    try {
      // Get personalized content based on WOMP framework
      const emailContent = generateBroadcastContent(lead, template_id, variant);
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        from_name: 'Foxy from LocalRank.ai',
        subject: emailContent.subject,
        body: emailContent.html
      });

      // Log broadcast
      await base44.asServiceRole.entities.EmailLog.create({
        to: lead.email,
        from: 'Foxy from LocalRank.ai',
        subject: emailContent.subject,
        type: 'broadcast',
        status: 'sent',
        variant,
        batch_id: batchId,
        metadata: {
          lead_id: lead.id,
          segment,
          template_id,
          campaign_type: 'broadcast'
        }
      });

      sent++;
      
      // Rate limit: 10 emails per second
      if (sent % 10 === 0) {
        await new Promise(r => setTimeout(r, 1000));
      }

    } catch (error) {
      console.error(`Failed to send to ${lead.email}:`, error);
      failed++;
    }
  }

  // Create campaign record
  await base44.asServiceRole.entities.EmailCampaign.create({
    name: `Broadcast_${segment}_${new Date().toISOString().split('T')[0]}`,
    type: 'broadcast',
    segment,
    template_id,
    variant,
    batch_id,
    total_recipients: leads.length,
    sent_count: sent,
    failed_count: failed,
    status: 'completed',
    created_by: (await base44.auth.me())?.id
  });

  return Response.json({
    success: true,
    batch_id,
    segment,
    total_recipients: leads.length,
    sent,
    failed,
    completion_rate: ((sent / leads.length) * 100).toFixed(2) + '%'
  });
}

/**
 * Add Lead to Email Sequence
 */
async function handleAddToSequence(base44, payload) {
  const { lead_id, sequence_type = 'abandoned_quiz', start_step = 0 } = payload;

  const sequences = {
    abandoned_quiz: {
      name: 'Abandoned Quiz Recovery',
      total_steps: 5,
      step_intervals: [0, 2, 4, 7, 10], // days
      templates: ['womp_pain', 'womp_objection', 'womp_easy', 'womp_proof', 'womp_urgency']
    },
    abandoned_cart: {
      name: 'Abandoned Cart Recovery',
      total_steps: 4,
      step_intervals: [0, 1, 3, 7],
      templates: ['cart_reminder_1', 'cart_reminder_2', 'cart_discount', 'cart_final']
    },
    post_purchase: {
      name: 'Post-Purchase Nurture',
      total_steps: 5,
      step_intervals: [0, 2, 5, 10, 14],
      templates: ['welcome', 'onboarding', 'tips', 'social_proof', 'upsell']
    },
    re_engagement: {
      name: 'Re-engagement Campaign',
      total_steps: 3,
      step_intervals: [0, 7, 14],
      templates: ['we_miss_you', 'special_offer', 'last_chance']
    }
  };

  const sequence = sequences[sequence_type];
  if (!sequence) {
    return Response.json({ error: 'Invalid sequence type' }, { status: 400 });
  }

  // Check if lead exists
  const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
  if (leads.length === 0) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  const lead = leads[0];

  // Check if already in sequence
  const existing = await base44.asServiceRole.entities.LeadNurture.filter({
    lead_id,
    sequence_type,
    status: { $in: ['active', 'pending'] }
  });

  if (existing.length > 0) {
    return Response.json({ 
      error: 'Lead already in this sequence',
      existing_nurture_id: existing[0].id
    }, { status: 409 });
  }

  // Create nurture record
  const nextEmailDate = new Date();
  nextEmailDate.setDate(nextEmailDate.getDate() + sequence.step_intervals[start_step]);

  const nurture = await base44.asServiceRole.entities.LeadNurture.create({
    lead_id,
    sequence_type,
    current_step: start_step,
    total_steps: sequence.total_steps,
    emails_sent: 0,
    status: 'active',
    next_email_date: nextEmailDate.toISOString(),
    template_sequence: sequence.templates,
    metadata: {
      lead_email: lead.email,
      lead_name: lead.business_name,
      added_by: 'admin_console',
      added_at: new Date().toISOString()
    }
  });

  // Trigger first email immediately if start_step is 0
  if (start_step === 0) {
    try {
      await fetch('https://api.localrnk.com/functions/sendFoxyNurtureEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurtureId: nurture.id })
      });
    } catch (error) {
      console.error('Failed to trigger first email:', error);
    }
  }

  return Response.json({
    success: true,
    nurture_id: nurture.id,
    lead_id,
    sequence_type,
    sequence_name: sequence.name,
    current_step: start_step,
    total_steps: sequence.total_steps,
    next_email_date: nextEmailDate.toISOString(),
    message: start_step === 0 ? 'First email triggered' : 'Scheduled for next step'
  });
}

/**
 * Create New Email Campaign
 */
async function handleCreateCampaign(base44, payload) {
  const {
    name,
    type = 'broadcast',
    segment,
    template_id,
    variant = 'A',
    schedule_at,
    ab_test = false,
    variants = ['A', 'B']
  } = payload;

  const campaign = await base44.asServiceRole.entities.EmailCampaign.create({
    name,
    type,
    segment,
    template_id,
    variant,
    ab_test,
    variants: ab_test ? variants : ['A'],
    schedule_at: schedule_at || new Date().toISOString(),
    status: schedule_at ? 'scheduled' : 'draft',
    created_by: (await base44.auth.me())?.id,
    created_at: new Date().toISOString()
  });

  return Response.json({
    success: true,
    campaign_id: campaign.id,
    name,
    type,
    status: campaign.status,
    message: schedule_at ? 'Campaign scheduled' : 'Campaign created as draft'
  });
}

/**
 * Get All Campaigns
 */
async function handleGetCampaigns(base44) {
  const campaigns = await base44.asServiceRole.entities.EmailCampaign.filter(
    {},
    '-created_at',
    100
  );

  // Get stats for each campaign
  const campaignsWithStats = await Promise.all(
    campaigns.map(async (campaign) => {
      const logs = await base44.asServiceRole.entities.EmailLog.filter({
        batch_id: campaign.batch_id
      });

      const opens = logs.filter(l => l.opened_at).length;
      const clicks = logs.filter(l => l.clicked_at).length;

      return {
        ...campaign,
        stats: {
          total_sent: logs.length,
          opens,
          clicks,
          open_rate: logs.length > 0 ? ((opens / logs.length) * 100).toFixed(2) + '%' : '0%',
          click_rate: logs.length > 0 ? ((clicks / logs.length) * 100).toFixed(2) + '%' : '0%'
        }
      };
    })
  );

  return Response.json({
    success: true,
    campaigns: campaignsWithStats,
    total: campaigns.length
  });
}

/**
 * Get Active Sequences
 */
async function handleGetSequences(base44) {
  const nurtures = await base44.asServiceRole.entities.LeadNurture.filter(
    { status: { $in: ['active', 'pending'] } },
    '-created_date',
    200
  );

  // Group by sequence type
  const grouped = nurtures.reduce((acc, nurture) => {
    const type = nurture.sequence_type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(nurture);
    return acc;
  }, {});

  return Response.json({
    success: true,
    sequences: grouped,
    total_active: nurtures.length,
    by_type: Object.keys(grouped).map(type => ({
      type,
      count: grouped[type].length
    }))
  });
}

/**
 * Get Workflows
 */
async function handleGetWorkflows(base44) {
  const workflows = [
    {
      id: 'abandoned_quiz',
      name: 'Abandoned Quiz Recovery',
      status: 'active',
      triggers: ['quiz_started', 'quiz_not_completed_24h'],
      steps: 5,
      conversion_rate: '12.4%'
    },
    {
      id: 'abandoned_cart',
      name: 'Abandoned Cart Recovery',
      status: 'active',
      triggers: ['checkout_started', 'payment_not_completed'],
      steps: 4,
      conversion_rate: '18.7%'
    },
    {
      id: 'post_purchase',
      name: 'Post-Purchase Nurture',
      status: 'active',
      triggers: ['payment_completed'],
      steps: 5,
      conversion_rate: '23.1%'
    },
    {
      id: 'win_back',
      name: 'Win-Back Campaign',
      status: 'active',
      triggers: ['no_activity_30d'],
      steps: 3,
      conversion_rate: '8.3%'
    }
  ];

  return Response.json({
    success: true,
    workflows,
    total: workflows.length
  });
}

/**
 * Update Campaign
 */
async function handleUpdateCampaign(base44, payload) {
  const { campaign_id, updates } = payload;
  
  await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
    ...updates,
    updated_at: new Date().toISOString()
  });

  return Response.json({
    success: true,
    campaign_id,
    message: 'Campaign updated'
  });
}

/**
 * Pause Campaign
 */
async function handlePauseCampaign(base44, payload) {
  const { campaign_id } = payload;
  
  await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
    status: 'paused',
    paused_at: new Date().toISOString()
  });

  return Response.json({
    success: true,
    campaign_id,
    status: 'paused',
    message: 'Campaign paused'
  });
}

/**
 * Resume Campaign
 */
async function handleResumeCampaign(base44, payload) {
  const { campaign_id } = payload;
  
  await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
    status: 'active',
    resumed_at: new Date().toISOString()
  });

  return Response.json({
    success: true,
    campaign_id,
    status: 'active',
    message: 'Campaign resumed'
  });
}

/**
 * Get Campaign Analytics
 */
async function handleGetAnalytics(base44, payload) {
  const { campaign_id, days = 30 } = require(payload);
  
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const logs = await base44.asServiceRole.entities.EmailLog.filter({
    created_date: { $gte: since },
    ...(campaign_id && { batch_id: campaign_id })
  });

  // Calculate metrics
  const total = logs.length;
  const sent = logs.filter(l => l.status === 'sent').length;
  const opened = logs.filter(l => l.opened_at).length;
  const clicked = logs.filter(l => l.clicked_at).length;
  const bounced = logs.filter(l => l.status === 'bounced').length;
  const complained = logs.filter(l => l.status === 'complained').length;

  // Variant performance (A/B test)
  const variantStats = {};
  logs.forEach(log => {
    const v = log.variant || 'A';
    if (!variantStats[v]) {
      variantStats[v] = { sent: 0, opened: 0, clicked: 0 };
    }
    variantStats[v].sent++;
    if (log.opened_at) variantStats[v].opened++;
    if (log.clicked_at) variantStats[v].clicked++;
  });

  // Calculate rates for variants
  Object.keys(variantStats).forEach(v => {
    const stats = variantStats[v];
    stats.open_rate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(2) : 0;
    stats.click_rate = stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(2) : 0;
  });

  return Response.json({
    success: true,
    period: `${days} days`,
    overall: {
      total,
      sent,
      opened,
      clicked,
      bounced,
      complained,
      open_rate: sent > 0 ? ((opened / sent) * 100).toFixed(2) + '%' : '0%',
      click_rate: sent > 0 ? ((clicked / sent) * 100).toFixed(2) + '%' : '0%',
      bounce_rate: sent > 0 ? ((bounced / sent) * 100).toFixed(2) + '%' : '0%'
    },
    variants: variantStats,
    daily_breakdown: getDailyBreakdown(logs)
  });
}

/**
 * Generate WOMP-Framework Broadcast Content
 */
function generateBroadcastContent(lead, template_id, variant) {
  const businessName = lead.business_name || 'Your Business';
  const healthScore = lead.health_score || 50;
  
  // Calculate revenue leak
  const avgOrderValue = 350;
  const searchVolume = 1200;
  const currentRank = healthScore < 70 ? 9 : healthScore < 85 ? 5 : 3;
  const currentCTR = currentRank >= 9 ? 0.02 : currentRank >= 5 ? 0.06 : 0.15;
  const targetCTR = 0.25;
  const monthlyLeak = Math.round(searchVolume * (targetCTR - currentCTR) * avgOrderValue * 0.3);

  // Variant A: Pain-focused
  if (variant === 'A') {
    return {
      subject: `🚨 ${businessName}: $${monthlyLeak.toLocaleString()}/month leaking to competitors`,
      html: getPainFocusedHTML(businessName, monthlyLeak, healthScore)
    };
  }
  
  // Variant B: Urgency-focused
  return {
    subject: `⏰ 3 customers just chose your competitor instead of ${businessName}`,
    html: getUrgencyFocusedHTML(businessName, monthlyLeak, healthScore)
  };
}

function getPainFocusedHTML(businessName, monthlyLeak, healthScore) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <h2 style="color: #ef4444; font-size: 28px; margin: 0 0 15px 0; text-align: center;">
          What would an extra $${monthlyLeak.toLocaleString()}/month do for ${businessName}?
        </h2>
        
        <p style="color: #ccc; font-size: 16px; line-height: 1.6; text-align: center;">
          That's what you're <strong style="color: #fff;">currently losing</strong> to competitors who show up in the Map Pack when you don't.
        </p>
        
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #ef4444; text-align: center;">$${(monthlyLeak * 12).toLocaleString()}/year</p>
          <p style="margin: 10px 0 0 0; color: #aaa; text-align: center;">Going to your competitors</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://gmb-rank-booster-f0798aa4.base44.app/QuizGeeniusV2?business=${encodeURIComponent(businessName)}" 
             style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a8e000 100%); color: #0a0a0f; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            ⚡ Get My Free Audit (2 Minutes)
          </a>
        </div>
        
      </div>
    </div>
  `;
}

function getUrgencyFocusedHTML(businessName, monthlyLeak, healthScore) {
  const dailyLoss = Math.round(monthlyLeak / 30);
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <div style="background: rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px;">
          <span style="color: #ef4444; font-size: 14px; font-weight: bold;">⏰ WHILE YOU READ THIS...</span>
        </div>
        
        <h2 style="color: #fff; font-size: 24px; margin: 0 0 15px 0; text-align: center;">
          3 potential customers searched for "${businessName}"
        </h2>
        
        <p style="color: #ef4444; font-size: 20px; text-align: center; font-weight: bold; margin: 20px 0;">
          They chose your competitor.
        </p>
        
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; color: #aaa; font-size: 14px; text-align: center;">That's</p>
          <p style="margin: 10px 0; font-size: 36px; font-weight: bold; color: #ef4444; text-align: center;">$${dailyLoss}</p>
          <p style="margin: 0; color: #aaa; font-size: 14px; text-align: center;">lost today alone</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://gmb-rank-booster-f0798aa4.base44.app/QuizGeeniusV2?business=${encodeURIComponent(businessName)}" 
             style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
            🚨 Stop The Bleeding Now
          </a>
        </div>
        
      </div>
    </div>
  `;
}

function getDailyBreakdown(logs) {
  const days = {};
  
  logs.forEach(log => {
    const date = log.created_date.split('T')[0];
    if (!days[date]) {
      days[date] = { sent: 0, opened: 0, clicked: 0 };
    }
    days[date].sent++;
    if (log.opened_at) days[date].opened++;
    if (log.clicked_at) days[date].clicked++;
  });

  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, stats]) => ({
      date,
      ...stats
    }));
}
