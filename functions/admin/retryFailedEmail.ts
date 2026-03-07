import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email_log_id } = await req.json();
    if (!email_log_id) return Response.json({ error: 'email_log_id is required' }, { status: 400 });

    const emailLogs = await base44.asServiceRole.entities.EmailLog.filter({ id: email_log_id });
    const emailLog = emailLogs[0];

    if (!emailLog) return Response.json({ error: 'Email log not found' }, { status: 404 });

    if (emailLog.status !== 'failed' && emailLog.status !== 'bounced') {
      return Response.json({ error: 'Can only retry failed or bounced emails', current_status: emailLog.status }, { status: 400 });
    }

    if ((emailLog.resend_count || 0) >= 3) {
      return Response.json({ error: 'Maximum retry attempts reached (3)', resend_count: emailLog.resend_count }, { status: 400 });
    }

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: emailLog.to,
        from_name: emailLog.from || 'LocalRank.ai',
        subject: emailLog.subject,
        body: emailLog.metadata?.body || 'Email content not available'
      });

      await base44.asServiceRole.entities.EmailLog.update(email_log_id, {
        status: 'sent',
        resend_count: (emailLog.resend_count || 0) + 1,
        last_resent_at: new Date().toISOString(),
        error_message: null
      });

      return Response.json({ success: true, message: 'Email resent successfully', resend_count: (emailLog.resend_count || 0) + 1 });

    } catch (sendError) {
      await base44.asServiceRole.entities.EmailLog.update(email_log_id, {
        resend_count: (emailLog.resend_count || 0) + 1,
        last_resent_at: new Date().toISOString(),
        error_message: sendError.message
      });
      throw sendError;
    }

  } catch (error) {
    console.error('Retry failed email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});