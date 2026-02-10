import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Email Open Tracking Handler
 * Triggered via Resend webhook when client opens welcome email
 * Adds "newsletter_subscriber" tag to trigger client newsletter workflow
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Extract email ID and recipient from webhook
    const { type, data } = payload;

    if (type !== 'email.opened') {
      return Response.json({ message: 'Not an open event, ignored' }, { status: 200 });
    }

    const emailId = data.email_id;
    const recipientEmail = data.to;

    // Find the email log
    const emailLogs = await base44.asServiceRole.entities.EmailLog.filter({
      metadata: { resend_id: emailId }
    });

    if (emailLogs.length === 0) {
      console.log(`No email log found for resend_id: ${emailId}`);
      return Response.json({ message: 'Email log not found' }, { status: 200 });
    }

    const emailLog = emailLogs[0];

    // Update email log with open tracking
    await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
      status: 'opened',
      open_count: (emailLog.open_count || 0) + 1,
      first_opened_at: emailLog.first_opened_at || new Date().toISOString()
    });

    // Check if this is a closed deal welcome email
    const isClosedDealWelcome = emailLog.metadata?.email_category === 'closed_deal_welcome';

    if (isClosedDealWelcome && emailLog.metadata?.lead_id) {
      const leadId = emailLog.metadata.lead_id;

      // Find the lead
      const lead = await base44.asServiceRole.entities.Lead.filter({ id: leadId }).then(r => r[0]);

      if (lead) {
        // Add newsletter tag to lead
        const currentTags = lead.tags || [];
        if (!currentTags.includes('newsletter_subscriber')) {
          await base44.asServiceRole.entities.Lead.update(leadId, {
            tags: [...currentTags, 'newsletter_subscriber', 'onboarded_client'],
            admin_notes: (lead.admin_notes || '') + `\n[${new Date().toISOString()}] Client opened welcome email - Added to newsletter list`
          });

          console.log(`Added newsletter_subscriber tag to lead ${leadId}`);
        }

        // Create newsletter subscription record
        const existingNewsletterSub = await base44.asServiceRole.entities.LeadNurture.filter({
          lead_id: leadId,
          sequence_name: 'client_newsletter'
        });

        if (existingNewsletterSub.length === 0) {
          await base44.asServiceRole.entities.LeadNurture.create({
            lead_id: leadId,
            email: lead.email,
            sequence_name: 'client_newsletter',
            current_step: 0,
            status: 'active',
            emails_sent: 0,
            metadata: {
              subscribed_via: 'welcome_email_open',
              business_name: lead.business_name,
              onboarded_date: new Date().toISOString()
            }
          });

          console.log(`Created client_newsletter subscription for lead ${leadId}`);
        }
      }
    }

    return Response.json({ 
      success: true, 
      email_id: emailId,
      recipient: recipientEmail,
      opens: (emailLog.open_count || 0) + 1,
      newsletter_added: isClosedDealWelcome
    });

  } catch (error) {
    console.error('Error in trackEmailOpen:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});