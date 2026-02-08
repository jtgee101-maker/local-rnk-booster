import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';
import { abandonedCartTemplate } from './utils/emailTemplates.js';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { email, businessName, healthScore, discountPercent = 20 } = payload;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = abandonedCartTemplate(businessName, healthScore, discountPercent);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `⏰ You left your audit behind - here's ${discountPercent}% off`,
      body: emailBody
    });

    // Log email
    await base44.asServiceRole.entities.EmailLog.create({
      to: email,
      from: 'LocalRank.ai',
      subject: `⏰ You left your audit behind - here's ${discountPercent}% off`,
      type: 'abandoned_cart',
      status: 'sent',
      metadata: { business_name: businessName, health_score: healthScore }
    });

    return Response.json({ success: true, email });
  } catch (error) {
    console.error('Error sending abandoned cart email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));