import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VERIFIED_FROM = 'GeeNiusPath Team <noreply@updates.localrnk.com>';
const UNSUBSCRIBE_FOOTER = `
  <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(147, 51, 234, 0.2);">
    <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">Questions? Reply to this email or contact <a href="mailto:support@localrank.ai" style="color: #9333ea;">support@localrank.ai</a></p>
    <p style="color: #6b7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} GeeNiusPath. All rights reserved.</p>
    <p style="color: #6b7280; font-size: 11px; margin: 8px 0 0 0;">
      <a href="https://localrank.ai/unsubscribe?email={{email}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
    </p>
  </div>
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadData, sessionId, utmParams = {}, campaignData = {}, behaviorData = {} } = await req.json();

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data and email required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    let productionDomain = 'https://localrank.ai';
    try {
      const domainConfig = await base44.asServiceRole.entities.AppConfig.filter({ 
        config_key: 'production_domain' 
      });
      if (domainConfig.length > 0) {
        productionDomain = domainConfig[0].config_value;
      }
    } catch (error) {
      console.log('Using default domain');
    }

    const bridgeUrl = `${productionDomain}/BridgeGeenius?lead_id=${leadData.id}`;
    const unsubscribeFooter = UNSUBSCRIBE_FOOTER.replace('{{email}}', encodeURIComponent(leadData.email));

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 36px; font-weight: bold; margin-bottom: 10px; color: #9333ea;">
              ✨ GeeNiusPath
            </div>
            <p style="color: #9ca3af; font-size: 16px; margin: 0;">Your Exclusive Business Growth Pathways</p>
          </div>

          <div style="background: #1f2937; border: 1px solid rgba(147, 51, 234, 0.3); border-radius: 16px; padding: 32px;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0; font-weight: bold;">
              Hi ${leadData.business_name ? leadData.business_name + ' Team' : 'there'}! 👋
            </h1>
            
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Thank you for completing your GeeNiusPath assessment! We've analyzed your business and prepared three exclusive pathways tailored specifically for you.
            </p>

            ${leadData.health_score ? `
            <div style="background: rgba(147, 51, 234, 0.15); border: 1px solid rgba(147, 51, 234, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">Your GMB Health Score</div>
              <div style="color: #ffffff; font-size: 48px; font-weight: bold; margin-bottom: 8px;">${leadData.health_score}/100</div>
              <div style="color: #d1d5db; font-size: 14px;">
                ${leadData.health_score >= 80 ? 'Excellent foundation! Ready for optimization.' : 
                  leadData.health_score >= 60 ? 'Good start! Room for significant improvement.' :
                  'Critical opportunities for growth ahead.'}
              </div>
            </div>
            ` : ''}

            ${leadData.critical_issues && leadData.critical_issues.length > 0 ? `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #ff6b6b; margin: 0 0 16px 0; font-size: 18px;">🚨 Critical Issues Found:</h3>
              ${leadData.critical_issues.slice(0, 3).map(issue => {
                const text = typeof issue === 'string' ? issue : (issue.issue || JSON.stringify(issue));
                return `<div style="margin: 8px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; color: #f3f4f6; font-size: 14px;">${text}</div>`;
              }).join('')}
            </div>
            ` : ''}

            <div style="margin-bottom: 32px;">
              <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 20px 0;">Your Exclusive Pathways:</h2>
              <div style="background: rgba(147, 51, 234, 0.1); border-left: 4px solid #9333ea; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <div style="color: #9333ea; font-weight: bold; margin-bottom: 8px;">👑 GeeNius Gov Tech Grant</div>
                <p style="color: #d1d5db; font-size: 14px; margin: 0;">Check if you qualify for free infrastructure upgrades through your payment processor.</p>
              </div>
              <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <div style="color: #3b82f6; font-weight: bold; margin-bottom: 8px;">🛠️ Done For You Service</div>
                <p style="color: #d1d5db; font-size: 14px; margin: 0;">Hand-picked verified provider handles everything for you.</p>
              </div>
              <div style="background: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px;">
                <div style="color: #22c55e; font-weight: bold; margin-bottom: 8px;">🎓 DIY Software License - $199/mo</div>
                <p style="color: #d1d5db; font-size: 14px; margin: 0;">Full training, guides, and email support for DIY implementation.</p>
              </div>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${bridgeUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                View My Pathways →
              </a>
            </div>

            <div style="border-top: 1px solid rgba(147, 51, 234, 0.2); padding-top: 24px; margin-top: 24px;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 16px 0;">What happens next:</p>
              <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Review your three exclusive pathways</li>
                <li>Choose the option that fits your business best</li>
                <li>Get started immediately - no waiting</li>
                <li>Transform your local business presence</li>
              </ul>
            </div>
          </div>

          ${unsubscribeFooter}
        </div>
      </body>
      </html>
    `;

    console.log('Sending GeeNius email to:', leadData.email);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: VERIFIED_FROM,
        to: leadData.email,
        subject: `✨ ${leadData.business_name || 'Your'} - Choose Your Exclusive Pathway`,
        html: emailBody
      })
    });

    const result = await response.json();
    console.log('Resend response:', result);

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
    }

    // Log email (fire and forget)
    base44.asServiceRole.entities.EmailLog.create({
      to: leadData.email,
      from: VERIFIED_FROM,
      subject: `✨ ${leadData.business_name || 'Your'} - Choose Your Exclusive Pathway`,
      type: 'welcome',
      status: 'sent',
      metadata: { lead_id: leadData.id, resend_id: result.id, funnel: 'geenius', session_id: sessionId }
    }).catch(() => {});

    console.log('✅ GeeNiusEmail sent successfully:', result.id);

    return Response.json({ 
      success: true, 
      email: leadData.email,
      bridge_url: bridgeUrl,
      messageId: result.id
    });

  } catch (error) {
    console.error('SendGeeniusEmail error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});