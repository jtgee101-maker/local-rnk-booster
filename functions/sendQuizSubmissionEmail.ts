import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { quizSubmissionTemplate } from './utils/emailTemplates.js';
import { enhancedAuditTemplate } from './utils/enhancedEmailTemplates.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadData, analysis } = await req.json();

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data and email required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable not configured');
    }

    // Use enhanced template if analysis provided, otherwise standard
    const emailBody = analysis ? 
      enhancedAuditTemplate(leadData, analysis) : 
      quizSubmissionTemplate(leadData);

    // Send via Resend HTTP API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `LocalRank.ai <noreply@updates.localrnk.com>`,
        to: leadData.email,
        subject: `🎯 Your Lead Independence Audit Results - Score: ${leadData.health_score}/100`,
        html: emailBody
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
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
        message_id: result.id
      }
    }).catch(err => console.error('Failed to log email:', err));

    return Response.json({ 
      success: true, 
      email: leadData.email,
      enhanced: !!analysis,
      messageId: result.id
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