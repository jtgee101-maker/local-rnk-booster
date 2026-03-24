import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { status_filter = 'failed', max_retries = 3, hours_ago = 24 } = await req.json();
    const cutoffDate = new Date(Date.now() - hours_ago * 3600000).toISOString();

    const failedEmails = await base44.asServiceRole.entities.EmailLog.filter({
      status: status_filter,
      created_date: { $gte: cutoffDate }
    });

    const eligibleEmails = failedEmails.filter(e => (e.resend_count || 0) < max_retries);

    if (eligibleEmails.length === 0) {
      return Response.json({
        success: true,
        message: 'No eligible emails to retry',
        total_failed: failedEmails.length,
        already_retried: failedEmails.length
      });
    }

    let successCount = 0;
    let failCount = 0;

    for (const emailLog of eligibleEmails.slice(0, 50)) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: emailLog.to,
          from_name: emailLog.from || 'LocalRank.ai',
          subject: emailLog.subject,
          body: emailLog.metadata?.body || 'Email content not available'
        });

        await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
          status: 'sent',
          resend_count: (emailLog.resend_count || 0) + 1,
          last_resent_at: new Date().toISOString(),
          error_message: null
        });

        successCount++;
      } catch (err) {
        await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
          resend_count: (emailLog.resend_count || 0) + 1,
          last_resent_at: new Date().toISOString(),
          error_message: err.message
        });
        failCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return Response.json({
      success: true,
      message: 'Bulk retry completed',
      total_eligible: eligibleEmails.length,
      success_count: successCount,
      fail_count: failCount,
      processed: successCount + failCount
    });

  } catch (error) {
    console.error('Bulk retry error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});