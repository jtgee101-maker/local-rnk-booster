import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { short_code, session_id, metadata = {} } = body;

    if (!short_code) {
      return Response.json({ error: 'short_code is required' }, { status: 400 });
    }

    // Find the campaign link
    const links = await base44.asServiceRole.entities.CampaignLink.filter({ short_code });
    
    if (links.length === 0) {
      return Response.json({ error: 'Campaign link not found' }, { status: 404 });
    }

    const link = links[0];

    // Parse user agent for device info
    const userAgent = req.headers.get('user-agent') || '';
    const isMobile = /mobile|android|iphone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    // Create click record
    await base44.asServiceRole.entities.CampaignClick.create({
      campaign_id: link.campaign_id,
      link_id: link.id,
      short_code,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: userAgent,
      device_type: deviceType,
      session_id,
      referrer: req.headers.get('referer') || null,
      location: metadata.location || {}
    });

    // Update link stats
    const now = new Date().toISOString();
    const updates = {
      clicks: (link.clicks || 0) + 1,
      last_click_date: now
    };

    if (!link.first_click_date) {
      updates.first_click_date = now;
    }

    await base44.asServiceRole.entities.CampaignLink.update(link.id, updates);

    // Update campaign stats
    const campaign = await base44.asServiceRole.entities.Campaign.get(link.campaign_id);
    await base44.asServiceRole.entities.Campaign.update(link.campaign_id, {
      total_clicks: (campaign.total_clicks || 0) + 1
    });

    return Response.json({
      success: true,
      redirect_url: link.full_url,
      tracked: true
    });

  } catch (error) {
    console.error('Track click error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to track campaign click',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'trackClick' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to track click',
      details: error.message 
    }, { status: 500 });
  }
}));