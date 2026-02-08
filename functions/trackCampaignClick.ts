import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { short_code, session_id } = await req.json();

    if (!short_code) {
      return Response.json({ error: 'Short code required' }, { status: 400 });
    }

    // Find the campaign link
    const links = await base44.asServiceRole.entities.CampaignLink.filter({
      short_code
    });

    if (links.length === 0) {
      return Response.json({ error: 'Link not found' }, { status: 404 });
    }

    const link = links[0];

    // Parse user agent for device detection
    const userAgent = req.headers.get('user-agent') || '';
    const deviceType = /mobile/i.test(userAgent) ? 'mobile' : 
                       /tablet/i.test(userAgent) ? 'tablet' : 'desktop';

    // Record click
    await base44.asServiceRole.entities.CampaignClick.create({
      campaign_id: link.campaign_id,
      link_id: link.id,
      short_code,
      user_agent: userAgent,
      device_type: deviceType,
      session_id: session_id || `anon_${Date.now()}`,
      referrer: req.headers.get('referer') || 'direct'
    });

    // Update link stats
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.CampaignLink.update(link.id, {
      clicks: (link.clicks || 0) + 1,
      last_click_date: now,
      first_click_date: link.first_click_date || now
    });

    // Update campaign stats
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({
      id: link.campaign_id
    });

    if (campaigns.length > 0) {
      await base44.asServiceRole.entities.Campaign.update(link.campaign_id, {
        total_clicks: (campaigns[0].total_clicks || 0) + 1
      });
    }

    return Response.json({ 
      success: true,
      redirect_url: link.full_url
    });

  } catch (error) {
    console.error('Error tracking campaign click:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}));