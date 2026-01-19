import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { upsellTemplate } from './utils/emailTemplates.js';
import { logError, handleFunctionError } from './utils/errorLogging.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { email, businessName, selectedPlan, amount } = payload;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = upsellTemplate(businessName, selectedPlan, amount);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `🚀 Welcome to ${selectedPlan || 'Premium'} - Your Journey Starts Now`,
      body: emailBody
    });

    return Response.json({ success: true, email });
  } catch (error) {
    const errorInfo = handleFunctionError(error, {
      functionName: 'sendUpsellEmail',
      errorType: 'email_failure',
      additionalContext: { email: payload?.email }
    });

    await logError(createClientFromRequest(req), {
      type: 'email_failure',
      severity: 'high',
      message: `Failed to send upsell email: ${error.message}`,
      stackTrace: error.stack,
      metadata: { function: 'sendUpsellEmail', errorId: errorInfo.logId }
    }).catch(() => {});

    return Response.json({ error: error.message, errorId: errorInfo.logId }, { status: 500 });
  }
});