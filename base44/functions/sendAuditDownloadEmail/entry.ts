import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { auditDownloadTemplate } from './utils/emailTemplates.js';
import { logError, handleFunctionError } from './utils/errorLogging.js';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { email, businessName } = payload;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = auditDownloadTemplate(businessName);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `📄 Your GMB Audit Report - ${businessName || 'Ready for Download'}`,
      body: emailBody
    });

    return Response.json({ success: true, email });
  } catch (error) {
    const errorInfo = handleFunctionError(error, {
      functionName: 'sendAuditDownloadEmail',
      errorType: 'email_failure',
      additionalContext: { email: error?.payload?.email }
    });

    await logError(createClientFromRequest(req), {
      type: 'email_failure',
      severity: 'high',
      message: `Failed to send audit download email: ${error.message}`,
      stackTrace: error.stack,
      metadata: { function: 'sendAuditDownloadEmail', errorId: errorInfo.logId }
    }).catch(() => {});

    return Response.json({ error: error.message, errorId: errorInfo.logId }, { status: 500 });
  }
});