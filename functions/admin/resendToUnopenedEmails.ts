import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { emailType, hoursDelay = 24, limit = 100 } = await req.json();

    const cutoffTime = new Date(Date.now() - hoursDelay * 60 * 60 * 1000).toISOString();

    const allLogs = await base44.asServiceRole.entities.EmailLog.list('-created_date', 10000);

    const unopenedEmails = allLogs.filter(log =>
      log.type === emailType &&
      (log.status === 'sent' || log.status !== 'opened') &&
      new Date(log.created_date) < new Date(cutoffTime) &&
      !log.is_unsubscribed &&
      (log.resend_count || 0) < 2
    ).slice(0, limit);

    let resent = 0;
    let errors = 0;

    for (const emailLog of unopenedEmails) {
      try {
        const leadId = emailLog.metadata?.lead_id;
        if (!leadId) continue;

        let emailBody = '';
        const subject = `[REMINDER] ${emailLog.subject}`;

        if (emailLog.type === 'abandoned_cart') {
          const leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
          const lead = leads[0];
          if (!lead) continue;

          const monthlyLoss = Math.round((100 - (lead.health_score || 50)) * 150);
          emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background: #0a0a0f; color: #fff;">
              <p>Hi ${lead.business_name || 'there'},</p>
              <p style="color: #ef4444; font-weight: bold;">⚠️ Your GMB optimization opportunity expires in 24 hours!</p>
              <p>Your audit showed critical issues costing you:</p>
              <p style="font-size: 28px; color: #c8ff00; font-weight: bold; text-align: center;">$${monthlyLoss}/month</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://localrank.ai/Pricing" style="display: inline-block; background: #c8ff00; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Your Order - 30% OFF</a>
              </div>
              <p style="color: #666; font-size: 12px; text-align: center;">Offer expires in 24 hours.</p>
            </div>
          `;
        }

        if (!emailBody) continue;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: emailLog.to,
          from_name: 'LocalRank.ai',
          subject,
          body: emailBody
        });

        await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
          resend_count: (emailLog.resend_count || 0) + 1,
          last_resent_at: new Date().toISOString()
        });

        resent++;
      } catch (err) {
        console.error(`Error resending to ${emailLog.to}:`, err);
        errors++;
      }
    }

    return Response.json({ success: true, resent, errors, total: unopenedEmails.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});