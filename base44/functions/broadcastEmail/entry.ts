import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Broadcast email to all confirmed leads or orders — Admin only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { subject, bodyHtml, recipientType = 'leads', filters = {} } = await req.json();
    if (!subject || !bodyHtml) return Response.json({ error: 'Subject and bodyHtml required' }, { status: 400 });

    let recipients = [];
    if (recipientType === 'leads') {
      const leads = await base44.asServiceRole.entities.Lead.filter(filters, '-created_date', 1000);
      recipients = leads.map(l => ({ email: l.email, name: l.business_name, id: l.id }));
    } else if (recipientType === 'orders') {
      const orders = await base44.asServiceRole.entities.Order.filter({ status: 'completed', ...filters }, '-created_date', 1000);
      recipients = orders.map(o => ({ email: o.email, name: null, id: o.id }));
    }

    if (recipients.length === 0) return Response.json({ success: true, message: 'No recipients found', sent: 0 });

    const results = { sent: 0, failed: 0, errors: [] };

    for (const recipient of recipients) {
      try {
        const personalizedBody = bodyHtml.replace(/\{business_name\}/g, recipient.name || 'there');

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipient.email,
          from_name: 'LocalRank.ai',
          subject,
          body: personalizedBody
        });

        await base44.asServiceRole.entities.EmailLog.create({
          to: recipient.email,
          from: 'LocalRank.ai',
          subject,
          type: 'other',
          status: 'sent',
          metadata: { broadcast: true, recipient_id: recipient.id, recipient_type: recipientType }
        });

        results.sent++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        results.failed++;
        results.errors.push({ email: recipient.email, error: error.message });

        await base44.asServiceRole.entities.EmailLog.create({
          to: recipient.email,
          from: 'LocalRank.ai',
          subject,
          type: 'other',
          status: 'failed',
          error_message: error.message,
          metadata: { broadcast: true, recipient_id: recipient.id, recipient_type: recipientType }
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      totalRecipients: recipients.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Broadcast email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});