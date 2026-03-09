import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VERIFIED_FROM = 'LocalRank.ai System <noreply@updates.localrnk.com>';

// ── Admin recipients ─────────────────────────────────────────────────────────
// Hardcoded fallback. Override via AppSettings:
//   setting_key = "hot_lead_recipients"  →  setting_value.emails = ["a@b.com","c@d.com"]
// or setting_key = "admin_email"  →  setting_value.email = "a@b.com"
const ADMIN_EMAILS_FALLBACK = ['jtgee101@gmail.com'];

// ── Thresholds ────────────────────────────────────────────────────────────────
const HOT_SCORE = 80;
const HOT_ENGAGEMENT = 20;
const HIGH_SCORE_ONLY = 85; // hot regardless of engagement

function isHotLead(lead) {
  const s = lead.lead_score || 0;
  const e = lead.engagement_score || 0;
  return (s >= HOT_SCORE && e >= HOT_ENGAGEMENT) || s >= HIGH_SCORE_ONLY;
}

function scoreColor(n) {
  return n >= 80 ? '#16a34a' : n >= 60 ? '#d97706' : '#dc2626';
}

function gradeEmoji(g) {
  return { 'A+': '🌟', A: '⭐', 'B+': '✅', B: '✅', 'C+': '🟡', C: '🟡', D: '🔴', F: '🔴' }[g] || '📊';
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // ── Resolve lead ──────────────────────────────────────────────────────────
    let lead;
    if (payload.lead) {
      lead = payload.lead;
    } else if (payload.event && payload.data) {
      lead = payload.data;
    } else if (payload.lead_id) {
      const rows = await base44.asServiceRole.entities.Lead.filter({ id: payload.lead_id });
      lead = rows[0];
    } else {
      return Response.json({ error: 'lead, lead_id, or entity automation payload required' }, { status: 400 });
    }

    if (!lead?.email) return Response.json({ skipped: true, reason: 'no lead data' });

    // ── Threshold check ───────────────────────────────────────────────────────
    if (!isHotLead(lead)) {
      return Response.json({
        skipped: true,
        reason: 'below hot lead threshold',
        lead_score: lead.lead_score,
        engagement_score: lead.engagement_score,
        thresholds: { score: HOT_SCORE, engagement: HOT_ENGAGEMENT, high_score_only: HIGH_SCORE_ONLY }
      });
    }

    // ── Dedup: one alert per lead, ever ───────────────────────────────────────
    if (lead.hot_lead_notified === true) {
      return Response.json({
        skipped: true,
        reason: 'already notified',
        notified_at: lead.hot_lead_notified_at,
        lead_id: lead.id
      });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');

    // ── Resolve admin recipients ──────────────────────────────────────────────
    let adminEmails = [...ADMIN_EMAILS_FALLBACK];
    try {
      const multi = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'hot_lead_recipients' });
      if (multi?.[0]?.setting_value?.emails?.length) {
        adminEmails = multi[0].setting_value.emails;
      } else {
        const single = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'admin_email' });
        if (single?.[0]?.setting_value?.email) adminEmails = [single[0].setting_value.email];
      }
    } catch (_) { /* fallback already set */ }

    const score      = lead.lead_score || 0;
    const engagement = lead.engagement_score || 0;
    const grade      = lead.lead_grade || 'N/A';
    const sentAt     = new Date().toISOString();
    const adminUrl   = 'https://localrank.ai/AdminControlCenter';

    const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">

  <div style="background:linear-gradient(135deg,#0a0a0f 0%,#1a0a2e 100%);padding:24px 28px;border-radius:12px 12px 0 0;border-bottom:3px solid #c8ff00;">
    <span style="font-size:32px;">🔥</span>
    <h1 style="color:#c8ff00;margin:8px 0 0;font-size:22px;">HOT LEAD DETECTED</h1>
    <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">LocalRank.ai · Respond within 5 min for 9× conversion rate</p>
  </div>

  <div style="background:#111118;padding:16px 28px;display:flex;gap:48px;">
    <div style="text-align:center;">
      <div style="font-size:42px;font-weight:800;color:${scoreColor(score)};line-height:1;">${score}</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Lead Score</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:42px;font-weight:800;color:${scoreColor(engagement)};line-height:1;">${engagement}</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Engagement</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:36px;font-weight:800;color:#c8ff00;line-height:1;">${gradeEmoji(grade)} ${grade}</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Grade</div>
    </div>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;padding:28px;border-radius:0 0 12px 12px;">
    <h2 style="color:#111827;margin:0 0 20px;font-size:20px;">${lead.business_name || 'Unknown Business'}</h2>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-size:14px;width:140px;">📧 Email</td><td style="padding:10px 0;color:#111827;font-weight:500;">${lead.email}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-size:14px;">📞 Phone</td><td style="padding:10px 0;color:#111827;">${lead.phone || '—'}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-size:14px;">📍 Location</td><td style="padding:10px 0;color:#111827;">${lead.address || '—'}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-size:14px;">🏢 Category</td><td style="padding:10px 0;color:#111827;">${lead.business_category || '—'}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-size:14px;">⏱️ Timeline</td><td style="padding:10px 0;color:${lead.timeline === 'urgent' ? '#dc2626' : '#111827'};font-weight:${lead.timeline === 'urgent' ? '600' : '400'};">${lead.timeline === 'urgent' ? '🚨 URGENT' : (lead.timeline || '—')}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-size:14px;">🛤️ Pathway</td><td style="padding:10px 0;color:#111827;">${lead.selected_pathway ? lead.selected_pathway.toUpperCase() : 'Not selected yet'}</td></tr>
      <tr><td style="padding:10px 0;color:#6b7280;font-size:14px;">⭐ Reviews</td><td style="padding:10px 0;color:#111827;">${lead.gmb_rating || '—'} (${lead.gmb_reviews_count || 0} reviews)</td></tr>
    </table>

    ${(lead.critical_issues || []).length > 0 ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 10px;font-weight:600;color:#dc2626;font-size:14px;">⚠️ Critical Issues</p>
      <ul style="margin:0;padding-left:20px;">
        ${(lead.critical_issues || []).slice(0, 4).map(i => `<li style="color:#374151;font-size:14px;margin:4px 0;">${typeof i === 'string' ? i : JSON.stringify(i)}</li>`).join('')}
      </ul>
    </div>` : ''}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#166534;font-size:14px;">
        💡 <strong>Respond within 5 minutes</strong> → 9× higher conversion. <strong>Within 1 hour</strong> → 60% conversion drop.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${adminUrl}" style="background:#c8ff00;color:#0a0a0f;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;display:inline-block;">
        🔥 Open Lead in Admin →
      </a>
    </div>

    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      LocalRank.ai · Hot Lead Alert · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
    </p>
  </div>
</body>
</html>`;

    // ── Send email to all admin recipients ────────────────────────────────────
    const sendResults = [];
    for (const to of adminEmails) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: VERIFIED_FROM,
          to,
          subject: `🔥 HOT LEAD: ${lead.business_name || lead.email} — Score ${score} / Engagement ${engagement}`,
          html
        })
      });
      const r = await res.json();
      if (!res.ok) {
        console.error(`Failed sending to ${to}:`, r.message);
      } else {
        sendResults.push({ email: to, id: r.id });
      }
    }

    // ── Mark lead as notified (prevents future duplicate alerts) ──────────────
    try {
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        hot_lead_notified: true,
        hot_lead_notified_at: sentAt
      });
    } catch (e) {
      console.warn('Could not mark lead as notified (may be synthetic test):', e.message);
    }

    // ── Log the alert ─────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.EmailLog.create({
      to: adminEmails.join(', '),
      from: VERIFIED_FROM,
      subject: `Hot Lead Alert: ${lead.business_name || lead.email}`,
      type: 'admin_notification',
      status: 'sent',
      metadata: {
        lead_id: lead.id,
        business_name: lead.business_name || null,
        alert_type: 'hot_lead',
        lead_score: score,
        engagement_score: engagement,
        channels_sent: ['email'],
        sent_at: sentAt,
        recipients: adminEmails
      }
    });

    console.log(`🔥 Hot lead alert sent for "${lead.business_name}" (score:${score}, engagement:${engagement}) → ${adminEmails.join(', ')}`);
    return Response.json({ success: true, lead_id: lead.id, notified: adminEmails, sent: sendResults });

  } catch (error) {
    console.error('notifyAdminHotLead error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});