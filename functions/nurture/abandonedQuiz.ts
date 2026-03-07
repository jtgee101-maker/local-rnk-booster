import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Abandoned Quiz Follow-up
 * Triggers when someone starts quiz but doesn't complete
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const [quizStarts, completions] = await Promise.all([
      base44.asServiceRole.entities.ConversionEvent.filter({
        funnel_version: 'v3',
        event_name: 'quizv3_started',
        created_date: { $gte: twoDaysAgo, $lte: oneDayAgo }
      }, '-created_date', 100),
      base44.asServiceRole.entities.ConversionEvent.filter({
        funnel_version: 'v3',
        event_name: 'quizv3_completed',
        created_date: { $gte: twoDaysAgo }
      }, '-created_date', 100)
    ]);

    const completedSessions = new Set(completions.map(c => c.session_id));
    const abandonedSessions = quizStarts.filter(s => !completedSessions.has(s.session_id));

    let sent = 0;

    for (const session of abandonedSessions.slice(0, 50)) {
      try {
        const existing = await base44.asServiceRole.entities.EmailLog.filter({
          metadata: { session_id: session.session_id, sequence: 'abandoned_quiz' }
        }, '-created_date', 1);
        if (existing.length > 0) continue;

        const email = session.properties?.email || session.properties?.contact_email;
        if (!email) continue;

        const emailBody = getAbandonedTemplate(session.properties?.business_name);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          from_name: 'LocalRank.ai',
          subject: '⏰ Your GMB Audit is Almost Done (2 Minutes Left)',
          body: emailBody
        });

        await base44.asServiceRole.entities.EmailLog.create({
          to: email,
          from: 'LocalRank.ai',
          subject: '⏰ Your GMB Audit is Almost Done',
          type: 'nurture',
          status: 'sent',
          metadata: { session_id: session.session_id, sequence: 'abandoned_quiz' }
        });

        sent++;
      } catch (error) {
        console.error('Failed to send abandoned email:', error);
      }
    }

    return Response.json({ success: true, abandoned: abandonedSessions.length, sent });
  } catch (error) {
    console.error('Abandoned quiz error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getAbandonedTemplate(businessName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 20px;"><span style="font-size: 48px;">⏰</span></div>
        <h2 style="color: #fff; text-align: center; font-size: 24px; margin: 0 0 15px 0;">You Were So Close!</h2>
        <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center;">
          Hi ${businessName || 'there'}! You started your free GMB audit but didn't finish.
          <strong style="color: #c8ff00;">It only takes 2 more minutes.</strong>
        </p>
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #c8ff00; margin: 0 0 15px 0; text-align: center;">What You'll Get:</h3>
          <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Your exact GMB health score (0-100)</li>
            <li>3 critical issues costing you leads RIGHT NOW</li>
            <li>Estimated monthly revenue loss</li>
            <li>Custom roadmap to fix everything</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/QuizV3" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">FINISH MY AUDIT (2 MIN)</a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">See you on the other side,<br>- The LocalRank Team</p>
      </div>
    </div>
  `;
}