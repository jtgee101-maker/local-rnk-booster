Deno.serve(async (req) => {
  try {
    const { leadData, analysis } = await req.json();

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data and email required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');

    const healthScore = leadData.health_score || 0;
    const businessName = leadData.business_name || 'Your Business';
    const criticalIssues = leadData.critical_issues || [];

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #c8ff00; font-size: 28px; margin: 0;">LocalRank.ai</h1>
            <p style="color: #999; margin: 8px 0 0 0;">Your GMB Audit Results</p>
          </div>

          <h2 style="color: #fff; text-align: center;">Hi ${businessName}! 👋</h2>
          <p style="color: #ccc; line-height: 1.6; text-align: center;">Your audit revealed exactly why you may be losing customers to competitors.</p>

          <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">YOUR GMB HEALTH SCORE</p>
            <div style="font-size: 56px; color: #c8ff00; font-weight: bold;">${healthScore}</div>
            <p style="margin: 5px 0 0 0; color: #ccc; font-size: 14px;">out of 100</p>
          </div>

          ${criticalIssues.length > 0 ? `
          <div style="margin: 25px 0;">
            <h3 style="color: #ef4444; margin: 0 0 15px 0;">🔴 Critical Issues Found:</h3>
            <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${criticalIssues.slice(0, 3).map(issue => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${analysis ? `
          <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 18px; margin: 25px 0; border-radius: 8px;">
            <h4 style="color: #10b981; margin: 0 0 10px 0;">📊 Key Insight</h4>
            <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.6;">
              Estimated monthly revenue loss: <strong style="color: #ef4444;">$${analysis.revenue_loss || Math.round((100 - healthScore) * 150)}</strong>
            </p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://localrank.ai/Pricing" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
              🚀 Get Your Fix Plan Now
            </a>
          </div>

          <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
            Questions? Reply to this email — we're here to help!<br>
            - The LocalRank Team
          </p>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LocalRank.ai <noreply@updates.localrnk.com>',
        to: leadData.email,
        subject: `🎯 Your Lead Independence Audit Results - Score: ${healthScore}/100`,
        html: emailBody
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(`Resend API error: ${result.message || response.statusText}`);

    console.log('Quiz submission email sent:', result.id);
    return Response.json({ success: true, email: leadData.email, enhanced: !!analysis, messageId: result.id });

  } catch (error) {
    console.error('Error sending quiz submission email:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});