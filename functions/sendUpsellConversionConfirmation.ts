import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';
import { upsellConversionTemplate } from './utils/emailTemplates.js';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { email, businessName, upsellProduct, amount, totalValue } = payload;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = upsellConversionTemplate(businessName, upsellProduct, amount, totalValue);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `🎉 Upsell Confirmed - Premium Service Ready to Start`,
      body: emailBody
    });

    return Response.json({ success: true, email });
  } catch (error) {
    console.error('Error sending upsell conversion confirmation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});