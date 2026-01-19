import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { quizSubmissionTemplate } from './utils/emailTemplates.js';
import { enhancedAuditTemplate } from './utils/enhancedEmailTemplates.js';
import { logError, handleFunctionError } from './utils/errorLogging.js';

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

    // Try to get enhanced analysis if available
    let analysis = null;
    if (payload.analysis) {
      analysis = payload.analysis;
    }

    // Use enhanced template if analysis available, fallback to standard
    const emailBody = analysis 
      ? enhancedAuditTemplate(leadData, analysis)
      : quizSubmissionTemplate(leadData);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: leadData.email,
      from_name: 'LocalRank.ai',
      subject: `🎯 Your Lead Independence Audit Results - Score: ${leadData.health_score}/100`,
      body: emailBody
    });

    // Log email send to EmailLog
    await base44.asServiceRole.entities.EmailLog.create({
      to: leadData.email,
      from: 'LocalRank.ai',
      subject: `🎯 Your Lead Independence Audit Results - Score: ${leadData.health_score}/100`,
      type: 'welcome',
      status: 'sent',
      metadata: { lead_id: leadData.id }
    });

    return Response.json({ 
      success: true, 
      email: leadData.email,
      enhanced: !!analysis 
    });
  } catch (error) {
    const errorInfo = handleFunctionError(error, {
      functionName: 'sendQuizSubmissionEmail',
      errorType: 'email_failure',
      additionalContext: { email: error?.payload?.email }
    });

    await logError(createClientFromRequest(req), {
      type: 'email_failure',
      severity: 'high',
      message: `Failed to send quiz submission email: ${error.message}`,
      stackTrace: error.stack,
      metadata: { function: 'sendQuizSubmissionEmail', errorId: errorInfo.logId }
    }).catch(() => {});

    return Response.json({ error: error.message, errorId: errorInfo.logId }, { status: 500 });
  }
});