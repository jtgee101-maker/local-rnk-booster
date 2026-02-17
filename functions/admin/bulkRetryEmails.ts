import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { status_filter = 'failed', max_retries = 3, hours_ago = 24 } = body;

    const cutoffDate = new Date(Date.now() - hours_ago * 3600000).toISOString();

    const failedEmails = await base44.asServiceRole.entities.EmailLog.filter({
      status: status_filter,
      created_date: { $gte: cutoffDate }
    });

    const eligibleEmails = failedEmails.filter(email => 
      (email.resend_count || 0) < max_retries
    );

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
      } catch (error) {
        await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
          resend_count: (emailLog.resend_count || 0) + 1,
          last_resent_at: new Date().toISOString(),
          error_message: error.message
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
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'email_failure',
        severity: 'high',
        message: 'Failed to bulk retry emails',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'bulkRetryEmails' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to bulk retry emails',
      details: error.message 
    }, { status: 500 });
  }
}));