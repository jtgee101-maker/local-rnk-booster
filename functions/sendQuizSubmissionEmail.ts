import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    let leadData;
    if (payload.leadData) {
      leadData = payload.leadData;
    } else if (payload.event && payload.data) {
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
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: rgba(200, 255, 0, 0.2); border-radius: 50%; padding: 20px;">
              <span style="font-size: 48px;">🎯</span>
            </div>
          </div>
          
          <h2 style="color: #fff; text-align: center; margin-top: 0;">Quiz Complete!</h2>
          
          <p style="color: #ccc; line-height: 1.6; text-align: center;">
            Thanks for completing the LocalRank lead independence audit, ${leadData.business_name || 'valued business owner'}!
          </p>
          
          <div style="background: rgba(200, 255, 0, 0.1); border: 1px solid rgba(200, 255, 0, 0.3); border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0 0 15px 0; color: #999; font-size: 12px;">YOUR RESULTS</p>
            <div style="text-align: center;">
              <div style="font-size: 48px; color: #c8ff00; font-weight: bold; margin: 10px 0;">${leadData.health_score}</div>
              <p style="margin: 5px 0; color: #ccc;">GMB Health Score</p>
              ${leadData.thumbtack_tax ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(200,255,0,0.2);">
                  <p style="margin: 5px 0; color: #999; font-size: 12px;">ANNUAL COST OF LEAD RENTING</p>
                  <div style="font-size: 32px; color: #ef4444; font-weight: bold;">$${leadData.thumbtack_tax.toLocaleString()}</div>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${leadData.critical_issues && leadData.critical_issues.length > 0 ? `
            <h3 style="color: #fff; margin-top: 30px;">Critical Issues Identified:</h3>
            <ul style="color: #ccc; line-height: 1.8; margin: 15px 0; padding-left: 20px;">
              ${leadData.critical_issues.slice(0, 3).map(issue => 
                `<li style="margin: 8px 0;">${issue}</li>`
              ).join('')}
            </ul>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/CheckoutV2" 
               style="display: inline-block; background: #c8ff00; color: #000; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
              View Full Results & Options
            </a>
          </div>
          
          <div style="background: rgba(200, 255, 0, 0.05); border-left: 4px solid #c8ff00; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
              <strong>💡 Next Step:</strong> Review your customized audit results and let us help you escape the lead-renting cycle.
            </p>
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
      to: leadData.email,
      from_name: 'LocalRank.ai',
      subject: `🎯 Your Lead Independence Audit Results - Score: ${leadData.health_score}/100`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending quiz submission email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});