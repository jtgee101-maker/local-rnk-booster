import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VERIFIED_FROM = 'GeeNiusPath Team <noreply@updates.localrnk.com>';

/**
 * Abandoned GeeNiusPath Follow-up
 * 
 * Two modes:
 * 1. daysSince=1  → leads who got results but never clicked to BridgeGeenius (24h after quiz)
 * 2. daysSince=7  → leads still unconverted 7 days later
 * 3. daysSince=14 → final push 14 days later
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { daysSince = 1 } = await req.json();

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');

    const now = new Date();
    const windowStart = new Date(now.getTime() - (daysSince + 1) * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - daysSince * 24 * 60 * 60 * 1000);

    // Get leads created in this window
    const candidateLeads = await base44.asServiceRole.entities.Lead.filter({
      created_date: { $gte: windowStart.toISOString(), $lt: windowEnd.toISOString() }
    }, '-created_date', 200);

    // Get converted orders
    const allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 10000);
    const convertedEmails = new Set(allOrders.map(o => o.email).filter(Boolean));
    const convertedLeadIds = new Set(allOrders.map(o => o.lead_id).filter(Boolean));

    // Get leads who clicked to BridgeGeenius (pathway_selected_at is set)
    // We filter in JS since we already have the candidates
    const unconvertedLeads = candidateLeads.filter(lead =>
      lead.status !== 'converted' &&
      !convertedLeadIds.has(lead.id) &&
      !convertedEmails.has(lead.email) &&
      lead.email && lead.email.includes('@') &&
      // For day-1: only target leads who haven't selected a pathway
      (daysSince > 1 || !lead.pathway_selected_at)
    );

    let sent = 0;
    const failed = [];
    const sequenceKey = `abandoned_geenius_${daysSince}d`;

    for (const lead of unconvertedLeads.slice(0, 50)) {
      try {
        // Dedup: skip if already sent this specific sequence
        const existingLog = await base44.asServiceRole.entities.EmailLog.filter({
          to: lead.email,
          type: 'nurture'
        });
        const alreadySent = existingLog.some(log => log.metadata?.sequence === sequenceKey);
        if (alreadySent) continue;

        const template = getTemplate(daysSince, lead);

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: VERIFIED_FROM,
            to: lead.email,
            subject: template.subject,
            html: template.html,
            tags: [{ name: 'sequence', value: sequenceKey }]
          })
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Resend: ${err}`);
        }

        const result = await response.json();

        await base44.asServiceRole.entities.EmailLog.create({
          to: lead.email,
          from: VERIFIED_FROM,
          subject: template.subject,
          type: 'nurture',
          status: 'sent',
          metadata: {
            lead_id: lead.id,
            sequence: sequenceKey,
            health_score: lead.health_score,
            resend_id: result.id
          }
        });

        sent++;
      } catch (error) {
        console.error(`Failed for ${lead.email}:`, error.message);
        failed.push({ email: lead.email, error: error.message });
      }
    }

    console.log(`abandonedGeenius ${daysSince}d: sent=${sent} failed=${failed.length} candidates=${unconvertedLeads.length}`);
    return Response.json({ success: true, daysSince, candidates: unconvertedLeads.length, sent, failed: failed.length });

  } catch (error) {
    console.error('abandonedGeenius error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getTemplate(daysSince, lead) {
  const name = lead.business_name || 'there';
  const score = lead.health_score || 0;
  const scoreColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 70 ? 'Good' : score >= 50 ? 'Needs Work' : 'Critical';
  const bridgeUrl = `https://localrnk.com/BridgeGeenius?lead_id=${lead.id}`;
  const resultsUrl = `https://localrnk.com/ResultsGeenius?lead_id=${lead.id}`;

  const FOOTER = `
    <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        <a href="https://localrank.ai/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
        &nbsp;·&nbsp; LocalRank.ai, support@localrank.ai
      </p>
    </div>
  `;

  // Day 1 — "your report is waiting"
  if (daysSince <= 1) {
    return {
      subject: `${name} — Your GMB score: ${score}/100 (pathways waiting)`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #fff;">
          <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 16px; padding: 32px;">
            <h2 style="color: #fff; margin: 0 0 8px 0;">Hi ${name} 👋</h2>
            <p style="color: #ccc; line-height: 1.6; margin: 0 0 20px 0;">
              Your GMB audit is complete. You scored <strong style="color: ${scoreColor};">${score}/100</strong> — that's <strong style="color: ${scoreColor};">${scoreLabel}</strong>.
            </p>
            <div style="background: rgba(200,255,0,0.07); border: 1px solid rgba(200,255,0,0.2); border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
              <p style="color: #c8ff00; font-weight: 700; margin: 0 0 12px 0; font-size: 16px;">Three pathways are waiting for you:</p>
              <p style="color: #ccc; margin: 0 0 6px 0;">👑 <strong style="color: #fff;">Gov Tech Grant</strong> — Free infrastructure upgrade</p>
              <p style="color: #ccc; margin: 0 0 6px 0;">🛠️ <strong style="color: #fff;">Done For You</strong> — Our team handles everything</p>
              <p style="color: #ccc; margin: 0;">🎓 <strong style="color: #fff;">DIY Program</strong> — Guided tools from $199/month</p>
            </div>
            <div style="text-align: center; margin: 0 0 16px 0;">
              <a href="${bridgeUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
                Choose My Pathway →
              </a>
            </div>
            <p style="color: #999; font-size: 13px; text-align: center; margin: 0;">
              Or <a href="${resultsUrl}" style="color: #a78bfa; text-decoration: underline;">review your full report first</a>
            </p>
          </div>
          ${FOOTER}
        </div>
      `
    };
  }

  // Day 7 — "still available" 
  if (daysSince <= 7) {
    return {
      subject: `${name} — Your GMB pathways are still available`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
          <h2>Hi ${name},</h2>
          <p>You received your GMB Health Score of <strong style="color: ${scoreColor};">${score}/100</strong> but haven't chosen your growth pathway yet.</p>
          <p>Your three exclusive pathways are still available:</p>
          <div style="padding: 16px; border: 2px solid #c8ff00; border-radius: 8px; margin: 12px 0 20px 0;">
            <strong>👑 Gov Tech Grant</strong> — Free infrastructure upgrade<br>
            <strong>🛠️ Done For You</strong> — We handle everything<br>
            <strong>🎓 DIY Program</strong> — $199/month, full support
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${bridgeUrl}" style="background: #7c3aed; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Choose My Pathway →
            </a>
          </div>
          ${FOOTER}
        </div>
      `
    };
  }

  // Day 14 — final push
  return {
    subject: `${name} — Final reminder about your GMB audit`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
        <h2 style="color: #dc2626;">Final Reminder, ${name}</h2>
        <p>Your score of <strong style="color: ${scoreColor};">${score}/100</strong> shows real growth opportunities. This is our last outreach.</p>
        <p>Every week without optimization is revenue going to your competitors.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${bridgeUrl}" style="background: #dc2626; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
            View My Options →
          </a>
        </div>
        ${FOOTER}
      </div>
    `
  };
}