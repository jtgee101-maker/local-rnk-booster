import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@3.0.0';
import { quizSubmissionTemplate } from './utils/emailTemplates.js';
import { enhancedAuditTemplate } from './utils/enhancedEmailTemplates.js';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadData, analysis } = await req.json();

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data and email required' }, { status: 400 });
    }

    // Use enhanced template if analysis provided, otherwise standard
    const emailBody = analysis ? 
      enhancedAuditTemplate(leadData, analysis) : 
      quizSubmissionTemplate(leadData);

    // Validate Resend API key
    if (!Deno.env.get('RESEND_API_KEY')) {
      throw new Error('RESEND_API_KEY environment variable not configured');
    }

    // Send via Resend directly
    const emailResult = await resend.emails.send({
      from: `LocalRank.ai <noreply@updates.localrnk.com>`,
      to: leadData.email,
      subject: `🎯 Your Lead Independence Audit Results - Score: ${leadData.health_score}/100`,
      html: emailBody
    });

    if (emailResult.error) {
      throw new Error(`Resend error: ${emailResult.error.message}`);
    }

    // Log email send to EmailLog (fire and forget)
    base44.asServiceRole.entities.EmailLog.create({
      to: leadData.email,
      from: 'LocalRank.ai',
      subject: `Your Lead Independence Audit Results`,
      type: 'welcome',
      status: 'sent',
      metadata: { 
        lead_id: leadData.id,
        enhanced: !!analysis,
        message_id: emailResult.data?.id
      }
    }).catch(err => console.error('Failed to log email:', err));

    return Response.json({ 
      success: true, 
      email: leadData.email,
      enhanced: !!analysis,
      messageId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Error sending quiz submission email:', error);

    // Log error (fire and forget)
    base44.asServiceRole.entities.ErrorLog.create({
      error_type: 'email_failure',
      severity: 'high',
      message: error.message,
      stack_trace: error.stack,
      metadata: { 
        function: 'sendQuizSubmissionEmail',
        email: leadData?.email
      }
    }).catch(err => console.error('Error logging failed:', err));

    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});