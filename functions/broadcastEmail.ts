import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendEmailWithRetry } from './utils/emailRetry.js';

/**
 * Broadcast email to all confirmed leads or orders
 * Uses native Base44 email sending only
 * 
 * ADMIN ONLY - requires admin authentication
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate as admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { 
      subject, 
      bodyHtml, 
      recipientType = 'leads', // 'leads' or 'orders'
      filters = {} 
    } = await req.json();

    if (!subject || !bodyHtml) {
      return Response.json({ 
        error: 'Subject and bodyHtml required' 
      }, { status: 400 });
    }

    // Get recipients based on type
    let recipients = [];
    if (recipientType === 'leads') {
      const leads = await base44.asServiceRole.entities.Lead.filter(
        filters, 
        '-created_date', 
        1000
      );
      recipients = leads.map(l => ({
        email: l.email,
        name: l.business_name,
        id: l.id
      }));
    } else if (recipientType === 'orders') {
      const orders = await base44.asServiceRole.entities.Order.filter(
        { status: 'completed', ...filters },
        '-created_date',
        1000
      );
      recipients = orders.map(o => ({
        email: o.email,
        name: null,
        id: o.id
      }));
    }

    if (recipients.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No recipients found',
        sent: 0 
      });
    }

    // Send emails with retry logic
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const recipient of recipients) {
      try {
        // Personalize body with recipient name
        const personalizedBody = bodyHtml.replace(/\{business_name\}/g, recipient.name || 'there');

        await sendEmailWithRetry(
          (data) => base44.asServiceRole.integrations.Core.SendEmail(data),
          {
            to: recipient.email,
            from_name: 'LocalRank.ai',
            subject: subject,
            body: personalizedBody
          }
        );

        // Log successful send
        await base44.asServiceRole.entities.EmailLog.create({
          to: recipient.email,
          from: 'LocalRank.ai',
          subject: subject,
          type: 'other',
          status: 'sent',
          metadata: { 
            broadcast: true,
            recipient_id: recipient.id,
            recipient_type: recipientType
          }
        });

        results.sent++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        results.failed++;
        results.errors.push({
          email: recipient.email,
          error: error.message
        });

        // Log failure
        await base44.asServiceRole.entities.EmailLog.create({
          to: recipient.email,
          from: 'LocalRank.ai',
          subject: subject,
          type: 'other',
          status: 'failed',
          error_message: error.message,
          metadata: { 
            broadcast: true,
            recipient_id: recipient.id,
            recipient_type: recipientType
          }
        }).catch(() => {});
      }
    }

    return Response.json({ 
      success: true,
      totalRecipients: recipients.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.slice(0, 10) // Return first 10 errors only
    });
  } catch (error) {
    console.error('Broadcast email error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});