import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Mid-Quiz Abandonment Recovery
 *
 * Targets leads created via partial save (on ContactInfoStep completion) that:
 * - Have an email
 * - Were created within the lookback window
 * - Never had a quiz_completed ConversionEvent
 * - Have not already received this recovery email
 *
 * Call with: { hoursAgo: 1 } (default) — catches people who gave email, then bailed during processing
 */

const FROM = 'GeeNiusPath Team <noreply@updates.localrnk.com>';
const BRAND_URL = 'https://localrnk.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const hoursAgo = body.hoursAgo || 1;
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY not set');

    const now = Date.now();
    const windowEnd   = new Date(now - hoursAgo * 3600000).toISOString();
    const windowStart = new Date(now - (hoursAgo + 2) * 3600000).toISOString(); // 2-hour window

    // Partial leads: created in this window, have email, health_score is 0/null (processing never finished)
    const candidates = await base44.asServiceRole.entities.Lead.filter({
      created_date: { $gte: windowStart, $lt: windowEnd }
    }, '-created_date', 100);

    // Only leads where health_score was never set (quiz never completed processing)
    const partialLeads = candidates.filter(l =>
      l.email && l.email.includes('@') &&
      (!l.health_score || l.health_score === 0) &&
      l.status === 'new'
    );

    if (partialLeads.length === 0) {
      console.log('[abandonedMidQuiz] No partial leads in window');
      return Response.json({ success: true, sent: 0, candidates: 0, message: 'No partial leads found' });
    }

    // Cross-check: exclude any lead whose email appears in a quiz_completed ConversionEvent
    const completedEvents = await base44.asServiceRole.entities.ConversionEvent.filter({
      event_name: 'quiz_completed'
    }, '-created_date', 1000);
    const completedLeadIds = new Set(completedEvents.map(e => e.lead_id).filter(Boolean));
    const completedSessionEmails = new Set();
    // Also grab by session correlation — any quiz_completed lead from same period
    completedEvents
      .filter(e => e.created_date >= windowStart)
      .forEach(e => { if (e.properties?.email) completedSessionEmails.add(e.properties.email); });

    const recoverableLeads = partialLeads.filter(l =>
      !completedLeadIds.has(l.id) &&
      !completedSessionEmails.has(l.email)
    );

    let sent = 0;
    const failed = [];
    const SEQUENCE_KEY = `mid_quiz_recovery_${hoursAgo}h`;

    for (const lead of recoverableLeads.slice(0, 30)) {
      // Dedup: only send once per lead per sequence
      const existing = await base44.asServiceRole.entities.EmailLog.filter({ to: lead.email, type: 'nurture' }, '-created_date', 20);
      if (existing.some(e => e.metadata?.sequence === SEQUENCE_KEY)) continue;

      const quizUrl = `${BRAND_URL}/QuizGeenius`;
      const name = lead.business_name || 'there';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #fff;">
          <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 16px; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 900; color: #c8ff00;">GeeNius<span style="color: #fff;">Path</span></span>
            </div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 22px;">Hey ${name} — you were almost there 👋</h2>
            <p style="color: #ccc; line-height: 1.6; margin: 0 0 20px 0;">
              You started your free GMB audit and made it through all the questions — but it looks like something interrupted the final step.
            </p>
            <p style="color: #ccc; line-height: 1.6; margin: 0 0 24px 0;">
              Your answers are saved. Just click below and we'll pick up where you left off and generate your personalized growth report.
            </p>
            <div style="text-align: center; margin: 0 0 20px 0;">
              <a href="${quizUrl}" style="display: inline-block; background: linear-gradient(135deg, #c8ff00, #a8d400); color: #0a0a0f; padding: 16px 36px; text-decoration: none; border-radius: 50px; font-weight: 900; font-size: 16px;">
                Complete My Audit →
              </a>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              Takes less than 60 seconds to finish.
            </p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #555; font-size: 11px; margin: 0;">
              <a href="${BRAND_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #555; text-decoration: underline;">Unsubscribe</a>
              &nbsp;·&nbsp; LocalRank.ai
            </p>
          </div>
        </div>
      `;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: lead.email,
          subject: `${name} — your GMB audit was almost done`,
          html,
          tags: [{ name: 'sequence', value: SEQUENCE_KEY }]
        })
      });

      if (!res.ok) {
        const err = await res.text();
        failed.push({ email: lead.email, error: err });
        continue;
      }

      const result = await res.json();
      await base44.asServiceRole.entities.EmailLog.create({
        to: lead.email,
        from: FROM,
        subject: `${name} — your GMB audit was almost done`,
        type: 'nurture',
        status: 'sent',
        metadata: { lead_id: lead.id, sequence: SEQUENCE_KEY, resend_id: result.id }
      });

      sent++;
    }

    console.log(`[abandonedMidQuiz] hoursAgo=${hoursAgo} candidates=${recoverableLeads.length} sent=${sent} failed=${failed.length}`);
    return Response.json({ success: true, hoursAgo, candidates: recoverableLeads.length, sent, failed: failed.length });

  } catch (err) {
    console.error('[abandonedMidQuiz] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});