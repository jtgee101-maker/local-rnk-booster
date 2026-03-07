import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, businessName, orderAmount, productName } = await req.json();

    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;"><span style="font-size: 48px;">✅</span></div>
          <h2 style="color: #c8ff00; text-align: center; margin-top: 0; font-size: 26px;">Order Confirmed!</h2>
          <p style="color: #ccc; line-height: 1.6; text-align: center; font-size: 16px;">
            Hi ${businessName || 'there'}! Your order for <strong>${productName || 'GMB Optimization'}</strong> has been confirmed.
          </p>
          <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">ORDER TOTAL</p>
            <div style="font-size: 36px; color: #c8ff00; font-weight: bold;">$${orderAmount || 0}</div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
              ACCESS YOUR DASHBOARD
            </a>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center;">Questions? Contact support@localrank.ai<br>- The LocalRank Team</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `✅ Order Confirmed - ${productName || 'GMB Optimization'} - ${businessName || ''}`,
      body: emailBody
    });

    await base44.asServiceRole.entities.EmailLog.create({
      to: email,
      from: 'LocalRank.ai',
      subject: `✅ Order Confirmed - ${productName || 'GMB Optimization'}`,
      type: 'order_confirmation',
      status: 'sent',
      metadata: { business_name: businessName, amount: orderAmount, product: productName }
    });

    return Response.json({ success: true, email });
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});