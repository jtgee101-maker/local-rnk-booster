import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadData } = await req.json();

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data required' }, { status: 400 });
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #c8ff00; font-size: 32px; margin: 0;">LocalRank.ai</h1>
        </div>
        
        <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 30px;">
          <h2 style="color: #fff; margin-top: 0;">Hey ${leadData.business_name || 'there'}, you almost had it! 👀</h2>
          
          <p style="color: #ccc; line-height: 1.6;">
            You were just one step away from fixing the critical issues holding ${leadData.business_name || 'your business'} back from dominating local search.
          </p>
          
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #ef4444; font-weight: bold;">
              ⚠️ These issues are still costing you customers:
            </p>
            <ul style="color: #ccc; margin-top: 10px;">
              ${leadData.critical_issues?.slice(0, 2).map(issue => `<li>${issue}</li>`).join('') || ''}
            </ul>
          </div>
          
          <div style="background: rgba(200, 255, 0, 0.1); border: 1px solid rgba(200, 255, 0, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #c8ff00; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
              🎁 Your 82% discount is still available!
            </p>
            <p style="color: #999; font-size: 14px; margin: 0;">
              But hurry - this offer expires in 24 hours
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/pricing" 
               style="display: inline-block; background: #c8ff00; color: #000; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">
              Complete My Order Now
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center; line-height: 1.6;">
            Still have questions? Just reply to this email and our team will help you get started.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© 2026 LocalRank.ai • Privacy Policy</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: leadData.email,
      from_name: 'LocalRank.ai',
      subject: `⏰ ${leadData.business_name || 'Hey'} - Your 82% Discount Expires Soon!`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending abandoned cart email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});