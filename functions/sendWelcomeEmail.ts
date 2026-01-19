import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { quizSubmissionTemplate } from './utils/emailTemplates.js';
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

    const emailBody = quizSubmissionTemplate(leadData);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: leadData.email,
      from_name: 'LocalRank.ai',
      subject: `🎯 ${leadData.business_name || 'Your Business'} - Your GMB Audit Results (Score: ${leadData.health_score}/100)`,
      body: emailBody
    });

    return Response.json({ success: true, email: leadData.email });
  } catch (error) {
    const errorInfo = handleFunctionError(error, {
      functionName: 'sendWelcomeEmail',
      errorType: 'email_failure',
      additionalContext: { email: error?.payload?.email }
    });

    await logError(createClientFromRequest(req), {
      type: 'email_failure',
      severity: 'high',
      message: `Failed to send welcome email: ${error.message}`,
      stackTrace: error.stack,
      metadata: { function: 'sendWelcomeEmail', errorId: errorInfo.logId }
    }).catch(() => {});

    return Response.json({ error: error.message, errorId: errorInfo.logId }, { status: 500 });
  }
});