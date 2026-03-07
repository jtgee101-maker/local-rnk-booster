import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VERIFIED_FROM = 'LocalRank.ai System <noreply@updates.localrnk.com>';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    let leadData;
    if (payload.leadData) {
      leadData = payload.leadData;
    } else if (payload.event && payload.data) {
      leadData = payload.data;
    } else {
      return Response.json({ error: 'Lead data required' }, { status: 400 });
    }

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data with email required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Get admin email from AppSettings
    let adminEmail = null;
    try {
      const settings = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'admin_email' });
      if (settings && settings.length > 0 && settings[0].setting_value?.email) {
        adminEmail = settings[0].setting_value.email;
      }
    } catch (e) {
      console.warn('Could not load admin email from AppSettings');
    }

    if (!adminEmail) {
      console.warn('Admin email not configured in AppSettings - skipping admin notification');
      return Response.json({ success: false, reason: 'Admin email not configured' });
    }

    const issuesList = (leadData.critical_issues || []).slice(0, 3).map(i => 
      `<li style="margin: 4px 0; color: #374151;">${typeof i === 'string' ? i : i.issue || JSON.stringify(i)}</li>`
    ).join('');

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: #1f2937; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h2 style="color: #c8ff00; margin: 0;">🆕 New Lead Alert</h2>
          <p style="color: #9ca3af; margin: 4px 0 0 0;">LocalRank.ai Admin Notification</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
          <h3 style="color: #111827; margin: 0 0 16px 0;">${leadData.business_name || 'Unknown Business'}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Email</td><td style="padding: 8px 0; color: #111827; font-weight: 500;">${leadData.email}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0; color: #111827;">${leadData.phone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Health Score</td><td style="padding: 8px 0; font-weight: bold; color: ${(leadData.health_score || 0) >= 70 ? '#16a34a' : (leadData.health_score || 0) >= 50 ? '#d97706' : '#dc2626'};">${leadData.health_score || 0}/100</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Category</td><td style="padding: 8px 0; color: #111827;">${leadData.business_category || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Timeline</td><td style="padding: 8px 0; color: #111827;">${leadData.timeline || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Rating</td><td style="padding: 8px 0; color: #111827;">⭐ ${leadData.gmb_rating || 'N/A'} (${leadData.gmb_reviews_count || 0} reviews)</td></tr>
          </table>
          ${issuesList ? `
          <div style="margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #dc2626;">Critical Issues:</p>
            <ul style="margin: 0; padding-left: 20px;">${issuesList}</ul>
          </div>` : ''}
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://localrank.ai/AdminControlCenter" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Admin →</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: VERIFIED_FROM,
        to: adminEmail,
        subject: `🆕 New Lead: ${leadData.business_name || 'New Business'} (Score: ${leadData.health_score || 'N/A'}/100)`,
        html: emailBody
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
    }

    // Log (fire and forget)
    base44.asServiceRole.entities.EmailLog.create({
      to: adminEmail,
      from: VERIFIED_FROM,
      subject: `New Lead: ${leadData.business_name || 'New Business'}`,
      type: 'admin_notification',
      status: 'sent',
      metadata: { lead_id: leadData.id, business_name: leadData.business_name, health_score: leadData.health_score, resend_id: result.id }
    }).catch(() => {});

    return Response.json({ success: true, notifiedEmail: adminEmail, messageId: result.id });

  } catch (error) {
    console.error('notifyAdminNewLead error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});