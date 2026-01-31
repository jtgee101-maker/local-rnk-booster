import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { campaign_id, recipient_name, recipient_email, recipient_company } = body;

    if (!campaign_id || !recipient_name) {
      return Response.json({ error: 'campaign_id and recipient_name are required' }, { status: 400 });
    }

    const campaign = await base44.asServiceRole.entities.Campaign.get(campaign_id);
    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Generate unique short code
    const shortCode = Math.random().toString(36).substring(2, 8);
    
    // Generate PURL slug from name
    const purlSlug = recipient_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Build tracking URL
    const params = new URLSearchParams({
      utm_source: campaign.utm_source || 'campaign',
      utm_medium: campaign.utm_medium || 'direct',
      utm_campaign: campaign.utm_campaign || campaign.name,
      purl: purlSlug,
      sc: shortCode
    });
    
    const fullUrl = `${campaign.base_url}?${params.toString()}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(fullUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    // Create campaign link record
    const link = await base44.asServiceRole.entities.CampaignLink.create({
      campaign_id,
      purl: purlSlug,
      full_url: fullUrl,
      short_code: shortCode,
      recipient_name,
      recipient_email,
      recipient_company,
      qr_code_url: qrCodeDataUrl,
      metadata: { generated_at: new Date().toISOString() }
    });

    // Update campaign stats
    await base44.asServiceRole.entities.Campaign.update(campaign_id, {
      total_links: (campaign.total_links || 0) + 1
    });

    return Response.json({
      success: true,
      link: {
        id: link.id,
        purl: purlSlug,
        short_code: shortCode,
        full_url: fullUrl,
        qr_code_url: qrCodeDataUrl
      }
    });

  } catch (error) {
    console.error('Generate PURL error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: 'Failed to generate PURL',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'generatePURL' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to generate PURL',
      details: error.message 
    }, { status: 500 });
  }
});