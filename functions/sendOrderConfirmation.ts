import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { orderConfirmationTemplate } from './utils/emailTemplates.js';
import { logError, handleFunctionError } from './utils/errorLogging.js';
import { sendEmailWithRetry } from './utils/emailRetry.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, businessName, orderAmount, productName } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = orderConfirmationTemplate(businessName, productName, orderAmount);

    await sendEmailWithRetry(
      (data) => base44.asServiceRole.integrations.Core.SendEmail(data),
      {
        to: email,
        from_name: 'LocalRank.ai',
        subject: `✅ Order Confirmed - ${productName || 'GMB Optimization'} - ${businessName || ''}`,
        body: emailBody
      }
    );

    return Response.json({ success: true, email });
  } catch (error) {
    const errorInfo = handleFunctionError(error, {
      functionName: 'sendOrderConfirmation',
      errorType: 'email_failure',
      additionalContext: { email: error?.payload?.email }
    });

    await logError(createClientFromRequest(req), {
      type: 'email_failure',
      severity: 'high',
      message: `Failed to send order confirmation: ${error.message}`,
      stackTrace: error.stack,
      metadata: { function: 'sendOrderConfirmation', errorId: errorInfo.logId }
    }).catch(() => {});

    return Response.json({ error: error.message, errorId: errorInfo.logId }, { status: 500 });
  }
});