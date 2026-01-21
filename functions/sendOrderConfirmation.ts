import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { orderConfirmationTemplate } from './utils/emailTemplates.js';
import { logError, handleFunctionError } from './utils/errorLogging.js';

async function sendEmailWithRetry(base44, emailData, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail(emailData);
      if (attempt > 1) console.log(`Email sent on attempt ${attempt}`);
      return { success: true, attempts: attempt };
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error.message);
      if (attempt < maxAttempts) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, businessName, orderAmount, productName } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = orderConfirmationTemplate(businessName, productName, orderAmount);

    await sendEmailWithRetry(base44, {
      to: email,
      from_name: 'LocalRank.ai',
      subject: `✅ Order Confirmed - ${productName || 'GMB Optimization'} - ${businessName || ''}`,
      body: emailBody
    });

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