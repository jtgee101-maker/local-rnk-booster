import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VERIFIED_FROM = 'GeeNiusPath Team <noreply@updates.localrnk.com>';

/**
 * Abandoned GeeNiusPath Follow-up
 * Targets leads who viewed results but haven't converted (7 or 14 days later)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { daysSince = 7 } = await req.json();

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysSince);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get leads created around that date who haven't converted
    const candidateLeads = await base44.asServiceRole.entities.Lead.filter({
      created_date: { $gte: targetDate.toISOString(), $lt: nextDay.toISOString() }
    }, '-created_date', 200);

    const allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 10000);
    const convertedEmails = new Set(allOrders.map(o => o.email).filter(Boolean));
    const convertedLeadIds = new Set(allOrders.map(o => o.lead_id).filter(Boolean));

    const unconvertedLeads = candidateLeads.filter(lead =>
      lead.status !== 'converted' &&
      !convertedLeadIds.has(lead.id) &&
      !convertedEmails.has(lead.email) &&
      lead.email && lead.email.includes('@')
    );

    let sent = 0;
    const failed = [];

    for (const lead of unconvertedLeads.slice(0, 50)) {
      try {
        // Deduplicate: skip if already sent this sequence
        const existingLog = await base44.asServiceRole.entities.EmailLog.filter({
          to: lead.email,
          type: 'nurture'
        });
        const alreadySent = existingLog.some(log =>
          log.metadata?.sequence === `abandoned_geenius_${daysSince}d`
        );
        if (alreadySent) continue;

        const template = getTemplate(daysSince, lead);

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: VERIFIED_FROM,
            to: lead.email,
            subject: template.subject,
            html: template.html
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
            sequence: `abandoned_geenius_${daysSince}d`,
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
  const bridgeUrl = `https://localrank.ai/BridgeGeenius?lead_id=${lead.id}`;

  const FOOTER = `
    <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        <a href="https://localrank.ai/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
        &nbsp;·&nbsp; LocalRank.ai, support@localrank.ai
      </p>
    </div>
  `;

  if (daysSince === 7) {
    return {
      subject: `${name} — Your GMB pathways are still available`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
          <h2>Hi ${name},</h2>
          <p>You received your GMB Health Score of <strong style="color: ${scoreColor};">${score}/100</strong> but haven't chosen your growth pathway yet.</p>
          <p>Your three exclusive pathways are still available:</p>
          <div style="padding: 12px; border: 2px solid #c8ff00; border-radius: 8px; margin: 12px 0;">
            <strong>👑 Gov Tech Grant</strong> — Free infrastructure upgrade<br>
            <strong>🛠️ Done For You</strong> — We handle everything<br>
            <strong>🎓 DIY Program</strong> — $199/month, full support
          </div>
          <p style="margin: 24px 0;">
            <a href="${bridgeUrl}" style="background: #7c3aed; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Choose My Pathway →
            </a>
          </p>
          ${FOOTER}
        </div>
      `
    };
  }

  // 14 days — final push
  return {
    subject: `${name} — Final reminder about your GMB audit`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
        <h2 style="color: #dc2626;">Final Reminder, ${name}</h2>
        <p>Your score of <strong style="color: ${scoreColor};">${score}/100</strong> shows real growth opportunities. This is our last outreach.</p>
        <p>Every week without optimization is revenue going to your competitors.</p>
        <p style="margin: 24px 0;">
          <a href="${bridgeUrl}" style="background: #dc2626; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View My Options →
          </a>
        </p>
        ${FOOTER}
      </div>
    `
  };
}