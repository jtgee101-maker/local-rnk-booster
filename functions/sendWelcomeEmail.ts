import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const { leadData } = await req.json();

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data and email required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable not configured');
    }

    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #c8ff00; font-size: 32px; margin: 0; font-weight: 800;">LocalRank.ai</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 48px;">🎯</span>
          </div>
          
          <h2 style="color: #fff; text-align: center; margin-top: 0; font-size: 24px;">Quiz Complete!</h2>
          
          <p style="color: #ccc; line-height: 1.6; text-align: center; font-size: 16px;">
            Hi ${leadData.business_name ? '<strong>' + leadData.business_name + '</strong>' : 'there'}! 👋<br>
            Your LocalRank audit just revealed exactly why you're losing customers to aggregators.
          </p>
          
          <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="margin: 0 0 15px 0; color: #999; font-size: 12px;">YOUR RESULTS</p>
            <div style="text-align: center;">
              <div style="font-size: 48px; color: #c8ff00; font-weight: bold; margin: 10px 0;">${leadData.health_score || 0}</div>
              <p style="margin: 5px 0; color: #ccc;">GMB Health Score</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/CheckoutV2" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
              🚀 Get Your Plan Now
            </a>
          </div>
          
          <div style="border-top: 1px solid #333; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #999; font-size: 14px; line-height: 1.6;">
              Questions? Reply to this email or contact us at support@localrank.ai
            </p>
          </div>
        </div>
      </div>
    `;

    // Send via Resend HTTP API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `LocalRank.ai <noreply@updates.localrnk.com>`,
        to: leadData.email,
        subject: `🎯 ${leadData.business_name || 'Your Business'} - Your GMB Audit Results (Score: ${leadData.health_score}/100)`,
        html: emailBody
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
    }

    console.log('✅ Welcome email sent successfully:', result.id);

    return Response.json({ 
      success: true, 
      email: leadData.email,
      messageId: result.id
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});