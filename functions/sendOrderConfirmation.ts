import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, businessName, orderAmount, productName } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #c8ff00; font-size: 32px; margin: 0;">LocalRank.ai</h1>
        </div>
        
        <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: rgba(16, 185, 129, 0.2); border-radius: 50%; padding: 20px;">
              <span style="font-size: 48px;">✅</span>
            </div>
          </div>
          
          <h2 style="color: #fff; text-align: center; margin-top: 0;">Order Confirmed!</h2>
          
          <p style="color: #ccc; line-height: 1.6; text-align: center;">
            Thank you for your purchase, ${businessName || 'valued customer'}! Your order has been confirmed.
          </p>
          
          <div style="background: rgba(200, 255, 0, 0.1); border: 1px solid rgba(200, 255, 0, 0.3); border-radius: 8px; padding: 20px; margin: 30px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #999;">Product:</td>
                <td style="padding: 8px 0; color: #fff; text-align: right; font-weight: bold;">${productName || 'GMB Optimization'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999;">Amount Paid:</td>
                <td style="padding: 8px 0; color: #c8ff00; text-align: right; font-size: 20px; font-weight: bold;">$${orderAmount || '0'}</td>
              </tr>
            </table>
          </div>
          
          <h3 style="color: #fff; margin-top: 30px;">What Happens Next?</h3>
          <div style="color: #ccc; line-height: 1.8;">
            <p>✅ Our team will begin your GMB optimization within 24 hours</p>
            <p>✅ You'll receive a detailed action plan via email</p>
            <p>✅ A dedicated specialist will reach out to schedule your strategy call</p>
            <p>✅ Access your dashboard to track progress in real-time</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/Dashboard" 
               style="display: inline-block; background: #c8ff00; color: #000; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
              View Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #333; margin-top: 30px; padding-top: 20px;">
            <p style="color: #999; font-size: 14px; text-align: center; line-height: 1.6;">
              Questions? Reply to this email or contact us at support@localrank.ai
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© 2026 LocalRank.ai • Privacy Policy</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `✅ Order Confirmed - ${productName || 'GMB Optimization'} - ${businessName || ''}`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});