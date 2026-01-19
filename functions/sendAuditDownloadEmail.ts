import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { email, businessName, pdfUrl } = payload;

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
            <div style="display: inline-block; background: rgba(200, 255, 0, 0.2); border-radius: 50%; padding: 20px;">
              <span style="font-size: 48px;">📄</span>
            </div>
          </div>
          
          <h2 style="color: #fff; text-align: center; margin-top: 0;">Your Audit Report is Ready</h2>
          
          <p style="color: #ccc; line-height: 1.6; text-align: center;">
            ${businessName ? `Thanks ${businessName}!` : 'Thank you!'} Your detailed GMB audit report has been generated and is ready for download.
          </p>
          
          <div style="background: rgba(200, 255, 0, 0.1); border: 1px solid rgba(200, 255, 0, 0.3); border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #999; font-size: 12px;">COMPLETE ANALYSIS INCLUDED</p>
            <ul style="color: #ccc; line-height: 2; text-align: left; display: inline-block; margin: 0; padding: 0;">
              <li>✅ GMB Health Score</li>
              <li>✅ Profile Statistics</li>
              <li>✅ Critical Issues Found</li>
              <li>✅ Optimization Roadmap</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/ThankYou" 
               style="display: inline-block; background: #c8ff00; color: #000; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
              Download Your Report
            </a>
          </div>
          
          <div style="background: rgba(200, 255, 0, 0.05); border-left: 4px solid #c8ff00; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
              <strong>🚀 What's Next?</strong> Review your report and book a free consultation with our team to discuss your personalized optimization plan.
            </p>
          </div>
          
          <div style="border-top: 1px solid #333; margin-top: 30px; padding-top: 20px;">
            <p style="color: #999; font-size: 14px; text-align: center; line-height: 1.6;">
              Questions about your report? Reply to this email or contact support@localrank.ai
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
      subject: `📄 Your GMB Audit Report - ${businessName || 'Ready for Download'}`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending audit download email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});