import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, businessName, healthScore, discountPercent = 20 } = await req.json();

    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;"><span style="font-size: 48px;">⏰</span></div>
          <h2 style="color: #fff; text-align: center; margin-top: 0; font-size: 24px;">You Left Your Audit Behind</h2>
          <p style="color: #ccc; line-height: 1.6; text-align: center;">
            Hi ${businessName || 'there'}! Your GMB score of <strong style="color: #c8ff00;">${healthScore || 'N/A'}/100</strong> revealed real issues.<br>
            We're holding a <strong style="color: #c8ff00;">${discountPercent}% discount</strong> for you — but it expires soon.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/Pricing" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
              Claim ${discountPercent}% Off Now
            </a>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center;">Questions? Reply to this email.<br>- The LocalRank Team</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `⏰ You left your audit behind - here's ${discountPercent}% off`,
      body: emailBody
    });

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
});