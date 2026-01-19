import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Handle both direct invocation and entity automation trigger
    let leadData;
    if (payload.leadData) {
      leadData = payload.leadData;
    } else if (payload.event && payload.data) {
      // Entity automation payload
      leadData = payload.data;
    } else {
      return Response.json({ error: 'Lead data required' }, { status: 400 });
    }

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data and email required' }, { status: 400 });
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #c8ff00; font-size: 32px; margin: 0;">LocalRank.ai</h1>
        </div>
        
        <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 30px;">
          <h2 style="color: #c8ff00; margin-top: 0;">🎉 Your GMB Audit is Ready, ${leadData.business_name || 'there'}!</h2>
          
          <p style="color: #ccc; line-height: 1.6;">
            We've just completed analyzing your Google Business Profile and found some interesting insights.
          </p>
          
          <div style="background: rgba(200, 255, 0, 0.1); border: 1px solid rgba(200, 255, 0, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #c8ff00; font-size: 18px; font-weight: bold;">
              Your GMB Health Score: ${leadData.health_score}/100
            </p>
          </div>
          
          <h3 style="color: #fff; margin-top: 30px;">🚨 Critical Issues Found:</h3>
          <ul style="color: #ccc; line-height: 1.8;">
            ${leadData.critical_issues?.slice(0, 3).map(issue => 
              `<li>${issue}</li>`
            ).join('') || '<li>No critical issues detected</li>'}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/pricing" 
               style="display: inline-block; background: #c8ff00; color: #000; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
              View Full Report & Fix Issues
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            Questions? Reply to this email or contact us at support@localrank.ai
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© 2026 LocalRank.ai • Privacy Policy • Unsubscribe</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: leadData.email,
      from_name: 'LocalRank.ai',
      subject: `🎯 ${leadData.business_name || 'Your Business'} - Your GMB Audit Results (Score: ${leadData.health_score}/100)`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});