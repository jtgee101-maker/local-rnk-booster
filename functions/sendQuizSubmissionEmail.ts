import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendCustomerEmail } from './utils/resendEmailService.js';
import { quizSubmissionTemplate } from './utils/emailTemplates.js';
import { enhancedAuditTemplate } from './utils/enhancedEmailTemplates.js';
import { getProductionDomain } from './utils/domainConfig.js';

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

    // Get production domain
    const domain = await getProductionDomain(base44);
    
    // Try to get enhanced analysis if available
    let analysis = null;
    if (payload.analysis) {
      analysis = payload.analysis;
    }

    // Use enhanced template if analysis available, fallback to standard
    const emailBody = analysis 
      ? enhancedAuditTemplate(leadData, analysis, domain)
      : quizSubmissionTemplate(leadData, domain);

    // Send via production-grade service
    const emailResult = await sendCustomerEmail(
      leadData.email,
      `🎯 Your Lead Independence Audit Results - Score: ${leadData.health_score}/100`,
      emailBody,
      'LocalRank.ai'
    );

    // Log email send to EmailLog
    await base44.asServiceRole.entities.EmailLog.create({
      to: leadData.email,
      from: 'LocalRank.ai',
      subject: `Your Lead Independence Audit Results`,
      type: 'welcome',
      status: 'sent',
      metadata: { 
        lead_id: leadData.id,
        enhanced: !!analysis,
        message_id: emailResult.messageId
      }
    }).catch(err => console.error('Failed to log email:', err));

    return Response.json({ 
      success: true, 
      email: leadData.email,
      enhanced: !!analysis,
      messageId: emailResult.messageId
    });
  } catch (error) {
    console.error('SendQuizSubmissionEmail error:', error);

    // Log error
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'email_failure',
        severity: 'high',
        message: `Failed to send quiz submission email: ${error.message}`,
        stack_trace: error.stack,
        metadata: { function: 'sendQuizSubmissionEmail', email: payload?.leadData?.email }
      });
    } catch (logErr) {
      console.error('Error logging failed:', logErr);
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});