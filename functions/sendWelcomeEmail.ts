import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendCustomerEmail } from './utils/resendEmailService.js';
import { quizSubmissionTemplate } from './utils/emailTemplates.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    let leadData;
    if (payload.leadData) {
      leadData = payload.leadData;
    } else if (payload.event && payload.data) {
      leadData = payload.data;
    } else {
      return Response.json({ error: 'Lead data required' }, { status: 400 });
    }

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data and email required' }, { status: 400 });
    }

    // Default domain for email template
    const domain = 'https://localrank.ai';
    const emailBody = quizSubmissionTemplate(leadData, domain);

    // Validate Resend API key
    if (!Deno.env.get('RESEND_API_KEY')) {
      throw new Error('RESEND_API_KEY environment variable not configured');
    }

    // Send via Resend directly
    const emailResult = await sendCustomerEmail(
      leadData.email,
      `🎯 ${leadData.business_name || 'Your Business'} - Your GMB Audit Results (Score: ${leadData.health_score}/100)`,
      emailBody,
      'LocalRank.ai'
    );

    // Log successful send
    await base44.asServiceRole.entities.EmailLog.create({
      to: leadData.email,
      from: 'LocalRank.ai',
      subject: `Your GMB Audit Results`,
      type: 'welcome',
      status: 'sent',
      metadata: {
        lead_id: leadData.id,
        health_score: leadData.health_score,
        message_id: emailResult.messageId
      }
    }).catch(err => console.error('Failed to log email:', err));

    return Response.json({ 
      success: true, 
      email: leadData.email,
      messageId: emailResult.messageId
    });
  } catch (error) {
    console.error('SendWelcomeEmail error:', error.message);

    // Log error
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'email_failure',
        severity: 'high',
        message: `Failed to send welcome email: ${error.message}`,
        stack_trace: error.stack,
        metadata: { function: 'sendWelcomeEmail', email: payload?.leadData?.email }
      });
    } catch (logErr) {
      console.error('Error logging failed:', logErr);
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});