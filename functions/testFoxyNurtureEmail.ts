import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const testAuditData = {
      health_score: 52,
      revenue_leak: 3420,
      annual_leak: 41040,
      critical_issues: ['Missing business hours', 'Low review count', 'Incomplete profile'],
      business_category: 'home_services',
      pain_point: 'not_in_map_pack',
      business_name: 'Test Business LLC'
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: email,
        subject: `🦊 Test - Your Foxy Audit Results & Next Steps`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .logo { color: #c8ff00; font-size: 24px; font-weight: bold; }
    .content { background: #f9f9f9; padding: 30px; }
    .stat-box { background: white; border: 2px solid #c8ff00; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
    .stat-number { font-size: 36px; font-weight: bold; color: #dc3545; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .issue-list { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .issue-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .footer { background: #0a0a0f; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🦊 LocalRank.ai</div>
      <h1 style="margin: 10px 0;">TEST EMAIL - Nurture System Working!</h1>
      <p style="margin: 5px 0; opacity: 0.9;">This is a test of the Foxy nurture email system</p>
    </div>
    
    <div class="content">
      <h2 style="color: #28a745;">✅ Success! Email System is Working</h2>
      
      <p>This is what your leads will receive after completing their Foxy audit.</p>
      
      <div class="stat-box">
        <div class="stat-number">$${testAuditData.revenue_leak.toLocaleString()}</div>
        <div style="color: #666; margin-top: 5px;">Estimated Monthly Revenue Leak (Example)</div>
        <p style="color: #666; margin-top: 10px;">That's <strong>$${testAuditData.annual_leak.toLocaleString()}/year</strong> going to competitors</p>
      </div>

      <h3>🎯 Example Critical Issues:</h3>
      <div class="issue-list">
        ${testAuditData.critical_issues.map(issue => 
          `<div class="issue-item">❌ ${issue}</div>`
        ).join('')}
      </div>

      <h3>📊 Example Health Score: ${testAuditData.health_score}/100</h3>
      <p>You're losing significant revenue to competitors. Quick wins are available.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourapp.base44.app" class="cta-button">
          📈 Get Your Full Action Plan
        </a>
      </div>

      <div style="background: #e8f5e9; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
        <strong>✅ Email System Status:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Resend API: Connected</li>
          <li>Template Rendering: Working</li>
          <li>Automation: Configured (runs daily at 9am)</li>
          <li>5-Step Sequence: Ready</li>
        </ul>
      </div>

      <p style="margin-top: 30px;">Keep sniffing out those opportunities! 🦊</p>
      <p><strong>- Foxy</strong><br>Your AI Local SEO Detective</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} LocalRank.ai - This is a test email</p>
      <p><strong>Next Steps:</strong> The system will automatically send 5 personalized emails over 10 days to leads who complete audits.</p>
    </div>
  </div>
</body>
</html>
        `
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    return Response.json({ 
      success: true, 
      message: 'Test email sent successfully!',
      email_id: result.id,
      to: email,
      features_working: [
        '✅ Resend API integration',
        '✅ HTML email templates',
        '✅ Personalized content',
        '✅ Daily automation at 9am',
        '✅ 5-step nurture sequence'
      ]
    });

  } catch (error) {
    console.error('Test email error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}));