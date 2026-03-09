import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VERIFIED_FROM = 'LocalRank.ai System <noreply@updates.localrnk.com>';

// Hot lead thresholds
const HOT_SCORE_THRESHOLD = 80;
const HOT_ENGAGEMENT_THRESHOLD = 20;
const HIGH_SCORE_ONLY_THRESHOLD = 85; // hot even without engagement

function isHotLead(lead) {
  const score = lead.lead_score || 0;
  const engagement = lead.engagement_score || 0;
  return (score >= HOT_SCORE_THRESHOLD && engagement >= HOT_ENGAGEMENT_THRESHOLD) || score >= HIGH_SCORE_ONLY_THRESHOLD;
}

function scoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

function gradeEmoji(grade) {
  const map = { 'A+': '🌟', A: '⭐', 'B+': '✅', B: '✅', 'C+': '🟡', C: '🟡', D: '🔴', F: '🔴' };
  return map[grade] || '📊';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Accept direct call OR entity automation payload
    let lead;
    if (payload.lead) {
      lead = payload.lead;
    } else if (payload.event && payload.data) {
      lead = payload.data;
    } else if (payload.lead_id) {
      const results = await base44.asServiceRole.entities.Lead.filter({ id: payload.lead_id });
      lead = results[0];
    } else {
      return Response.json({ error: 'lead, lead_id, or entity event payload required' }, { status: 400 });
    }

    if (!lead || !lead.email) {
      return Response.json({ skipped: true, reason: 'no lead data' });
    }

    // Check threshold
    if (!isHotLead(lead)) {
      return Response.json({
        skipped: true,
        reason: 'below hot lead threshold',
        lead_score: lead.lead_score,
        engagement_score: lead.engagement_score
      });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');

    // Dedup: only notify once per lead per 24h window
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentAlerts = await base44.asServiceRole.entities.EmailLog.filter({
      type: 'admin_notification',
    }, '-created_date', 50);

    const alreadySent = recentAlerts.some(log =>
      log.metadata?.lead_id === lead.id &&
      log.metadata?.alert_type === 'hot_lead' &&
      log.created_date > windowStart
    );

    if (alreadySent) {
      return Response.json({ skipped: true, reason: 'already notified within 24h', lead_id: lead.id });
    }

    // Get admin email
    let adminEmail = null;
    try {
      const settings = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'admin_email' });
      if (settings?.[0]?.setting_value?.email) adminEmail = settings[0].setting_value.email;
    } catch (e) {}

    if (!adminEmail) {
      console.warn('Admin email not configured in AppSettings');
      return Response.json({ success: false, reason: 'admin_email not set in AppSettings' });
    }

    const leadScore = lead.lead_score || 0;
    const engagementScore = lead.engagement_score || 0;
    const grade = lead.lead_grade || 'N/A';
    const adminUrl = 'https://localrank.ai/AdminControlCenter';

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); padding: 24px 28px; border-radius: 12px 12px 0 0; border-bottom: 3px solid #c8ff00;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 32px;">🔥</span>
      <div>
        <h1 style="color: #c8ff00; margin: 0; font-size: 22px; letter-spacing: -0.3px;">HOT LEAD DETECTED</h1>
        <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 13px;">LocalRank.ai · High-priority opportunity</p>
      </div>
    </div>
  </div>

  <!-- Score bar -->
  <div style="background: #111118; padding: 20px 28px; display: flex; gap: 32px; flex-wrap: wrap;">
    <div style="text-align: center;">
      <div style="font-size: 36px; font-weight: 800; color: ${scoreColor(leadScore)}; line-height: 1;">${leadScore}</div>
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Lead Score</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 36px; font-weight: 800; color: ${scoreColor(engagementScore)}; line-height: 1;">${engagementScore}</div>
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Engagement</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 36px; font-weight: 800; color: #c8ff00; line-height: 1;">${gradeEmoji(grade)} ${grade}</div>
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Grade</div>
    </div>
  </div>

  <!-- Lead Details -->
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 28px; border-radius: 0 0 12px 12px;">
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">${lead.business_name || 'Unknown Business'}</h2>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; width: 140px;">📧 Email</td>
        <td style="padding: 10px 0; color: #111827; font-weight: 500;">${lead.email}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">📞 Phone</td>
        <td style="padding: 10px 0; color: #111827;">${lead.phone || '—'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">📍 Location</td>
        <td style="padding: 10px 0; color: #111827;">${lead.address || '—'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">🏢 Category</td>
        <td style="padding: 10px 0; color: #111827;">${lead.business_category || '—'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">⏱️ Timeline</td>
        <td style="padding: 10px 0; color: ${lead.timeline === 'urgent' ? '#dc2626' : '#111827'}; font-weight: ${lead.timeline === 'urgent' ? '600' : '400'};">${lead.timeline === 'urgent' ? '🚨 URGENT' : (lead.timeline || '—')}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">🛤️ Pathway</td>
        <td style="padding: 10px 0; color: #111827;">${lead.selected_pathway ? lead.selected_pathway.toUpperCase() : 'Not selected yet'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">⭐ Reviews</td>
        <td style="padding: 10px 0; color: #111827;">${lead.gmb_rating || '—'} (${lead.gmb_reviews_count || 0} reviews)</td>
      </tr>
    </table>

    ${(lead.critical_issues || []).length > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #dc2626; font-size: 14px;">⚠️ Critical Issues (${lead.critical_issues.length})</p>
      <ul style="margin: 0; padding-left: 20px;">
        ${lead.critical_issues.slice(0, 4).map(i => `<li style="color: #374151; font-size: 14px; margin: 4px 0;">${typeof i === 'string' ? i : JSON.stringify(i)}</li>`).join('')}
      </ul>
    </div>` : ''}

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 500;">
        💡 <strong>Respond within 5 minutes</strong> for 9x higher conversion rate. This lead is ready to buy.
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${adminUrl}" style="background: #c8ff00; color: #0a0a0f; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">
        🔥 Open Lead in Admin →
      </a>
    </div>

    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
      LocalRank.ai · Hot Lead Alert · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
    </p>
  </div>

</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: VERIFIED_FROM,
        to: adminEmail,
        subject: `🔥 HOT LEAD: ${lead.business_name || lead.email} — Score ${leadScore} / Engagement ${engagementScore}`,
        html
      })
    });

    const emailResult = await emailRes.json();
    if (!emailRes.ok) throw new Error(`Resend error: ${emailResult.message || emailRes.statusText}`);

    // Log with dedup marker
    await base44.asServiceRole.entities.EmailLog.create({
      to: adminEmail,
      from: VERIFIED_FROM,
      subject: `Hot Lead Alert: ${lead.business_name || lead.email}`,
      type: 'admin_notification',
      status: 'sent',
      metadata: {
        lead_id: lead.id,
        alert_type: 'hot_lead',
        lead_score: leadScore,
        engagement_score: engagementScore,
        resend_id: emailResult.id
      }
    });

    console.log(`🔥 Hot lead alert sent for ${lead.business_name} (score: ${leadScore}, engagement: ${engagementScore})`);
    return Response.json({ success: true, lead_id: lead.id, notified: adminEmail, messageId: emailResult.id });

  } catch (error) {
    console.error('notifyAdminHotLead error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});