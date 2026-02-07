import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';
import { paymentConfirmationTemplate } from './utils/emailTemplates.js';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { email, businessName, amount, productName, invoiceId } = payload;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = paymentConfirmationTemplate(businessName, productName, amount, invoiceId);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `💳 Payment Confirmed - Your Service Starts Now`,
      body: emailBody
    });

    return Response.json({ success: true, email });
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});