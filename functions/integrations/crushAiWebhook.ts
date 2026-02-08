import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Crush AI Webhook Handler
 * Receives conversion data from Crush AI campaigns
 * Integrates with LocalRnk lead pipeline
 * 
 * Crush AI sends webhooks when:
 * - Ad is clicked
 * - Lead converts
 * - Campaign metrics update
 */

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    // Verify webhook signature (if Crush AI provides one)
    const signature = req.headers.get('x-crush-signature');
    
    const body = await req.json();
    const { 
      event_type,  // 'ad_click', 'lead_conversion', 'campaign_update'
      campaign_id,
      creative_id,
      lead_data,
      metrics,
      timestamp
    } = body;

    const base44 = createClientFromRequest(req);

    // Log the webhook event
    await base44.asServiceRole.entities.CrushWebhookLog.create({
      event_type,
      campaign_id,
      creative_id,
      payload: body,
      received_at: new Date().toISOString()
    });

    // Handle different event types
    switch (event_type) {
      case 'ad_click':
        await handleAdClick(base44, body);
        break;
        
      case 'lead_conversion':
        await handleLeadConversion(base44, body);
        break;
        
      case 'campaign_update':
        await handleCampaignUpdate(base44, body);
        break;
        
      default:
        console.log('Unknown Crush AI event type:', event_type);
    }

    // Update real-time analytics
    await updateCrushAnalytics(base44, event_type, metrics);

    return Response.json({
      success: true,
      event_received: event_type,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Crush AI webhook error:', error);
    
    // Log error
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'crush_webhook_error',
        severity: 'high',
        message: error.message,
        stack_trace: error.stack,
        metadata: { endpoint: 'crushAiWebhook' }
      });
    } catch {}

    return Response.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
}));

/**
 * Handle ad click event
 */
async function handleAdClick(base44, data) {
  const { lead_data, creative_id, campaign_id, utm_params } = data;
  
  // Create or update lead with attribution
  const lead = await base44.asServiceRole.entities.Lead.create({
    email: lead_data.email,
    business_name: lead_data.business_name,
    business_category: lead_data.category,
    source: 'crush_ai',
    campaign_id,
    creative_id,
    utm_source: utm_params?.source,
    utm_medium: utm_params?.medium,
    utm_campaign: utm_params?.campaign,
    status: 'ad_clicked',
    click_timestamp: new Date().toISOString()
  });

  // Track creative performance
  await base44.asServiceRole.entities.CreativePerformance.updateOrCreate(
    { creative_id },
    {
      $inc: { clicks: 1 },
      last_click_at: new Date().toISOString()
    }
  );

  // Start tracking session
  await base44.asServiceRole.entities.UTMSession.create({
    lead_id: lead.id,
    session_id: data.session_id,
    source: 'crush_ai',
    campaign_id,
    creative_id,
    landing_page: data.landing_page,
    referrer: data.referrer
  });

  console.log(`Ad click tracked: ${lead.id} from campaign ${campaign_id}`);
}

/**
 * Handle lead conversion event
 */
async function handleLeadConversion(base44, data) {
  const { lead_data, conversion_value, creative_id, campaign_id } = data;
  
  // Find existing lead
  const leads = await base44.asServiceRole.entities.Lead.filter({
    email: lead_data.email
  }, '-created_date', 1);

  if (leads && leads.length > 0) {
    const lead = leads[0];
    
    // Update lead status
    await base44.asServiceRole.entities.Lead.update(lead.id, {
      status: 'converted',
      conversion_value,
      converted_at: new Date().toISOString(),
      converted_from_creative: creative_id,
      converted_from_campaign: campaign_id
    });

    // Track conversion in creative performance
    await base44.asServiceRole.entities.CreativePerformance.updateOrCreate(
      { creative_id },
      {
        $inc: { 
          conversions: 1,
          revenue: conversion_value || 0
        },
        last_conversion_at: new Date().toISOString()
      }
    );

    // Update UTM session
    await base44.asServiceRole.entities.UTMSession.updateMany(
      { lead_id: lead.id },
      {
        converted: true,
        conversion_value,
        converted_at: new Date().toISOString()
      }
    );

    // Trigger post-conversion nurture
    await base44.asServiceRole.functions.invoke('nurture/postPurchase', {
      leadId: lead.id,
      conversionValue: conversion_value
    });

    console.log(`Lead converted: ${lead.id}, value: $${conversion_value}`);
  }
}

/**
 * Handle campaign update event
 */
async function handleCampaignUpdate(base44, data) {
  const { campaign_id, metrics, budget, status } = data;
  
  // Update campaign performance
  await base44.asServiceRole.entities.CrushCampaign.updateOrCreate(
    { campaign_id },
    {
      ...metrics,
      budget_remaining: budget?.remaining,
      status,
      last_updated: new Date().toISOString()
    }
  );

  // Check if campaign needs optimization
  if (metrics.cpa > 100) { // Cost per acquisition too high
    await base44.asServiceRole.entities.Alert.create({
      type: 'campaign_optimization',
      severity: 'medium',
      message: `Campaign ${campaign_id} CPA ($${metrics.cpa}) exceeds threshold`,
      metadata: { campaign_id, metrics }
    });
  }
}

/**
 * Update real-time analytics dashboard
 */
async function updateCrushAnalytics(base44, eventType, metrics) {
  const today = new Date().toISOString().split('T')[0];
  
  const analyticsUpdate = {
    date: today,
    $inc: {}
  };

  switch (eventType) {
    case 'ad_click':
      analyticsUpdate.$inc.total_clicks = 1;
      break;
    case 'lead_conversion':
      analyticsUpdate.$inc.total_conversions = 1;
      analyticsUpdate.$inc.total_revenue = metrics.conversion_value || 0;
      break;
  }

  await base44.asServiceRole.entities.DailyAnalytics.updateOrCreate(
    { date: today, source: 'crush_ai' },
    analyticsUpdate
  );
}
