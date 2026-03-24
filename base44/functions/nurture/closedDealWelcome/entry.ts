import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

/**
 * Closed Deal Welcome Email
 * Triggered when admin marks lead as "converted" or "closed" 
 * Sends welcome email with onboarding instructions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id' }, { status: 400 });
    }

    // Fetch lead
    const lead = await base44.asServiceRole.entities.Lead.filter({ id: lead_id }).then(r => r[0]);
    
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const businessName = lead.business_name || 'there';
    const contactName = lead.contact_name || businessName;

    // Welcome email template
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 40px;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a855f7 100%); border-radius: 50%; padding: 25px;">
              <span style="font-size: 60px;">🎉</span>
            </div>
          </div>
          
          <h1 style="color: #c8ff00; text-align: center; font-size: 32px; margin: 0 0 10px 0;">Welcome to GeeNius Pathway!</h1>
          <h2 style="color: #fff; text-align: center; font-size: 20px; margin: 0 0 30px 0; font-weight: normal;">We're Excited to Transform ${businessName}</h2>
          
          <p style="color: #ccc; line-height: 1.8; font-size: 16px; margin-bottom: 30px;">
            Hi ${contactName},<br><br>
            Congratulations on taking the first step toward dominating your local market! Your GeeNius Pathway journey officially begins now.
          </p>

          <!-- What's Next Section -->
          <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #c8ff00; margin: 0 0 20px 0; font-size: 20px;">📋 What Happens Next:</h3>
            
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
              <div style="display: flex; align-items: start; gap: 12px;">
                <div style="background: #c8ff00; color: #0a0a0f; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">Check Your Inbox Daily</h4>
                  <p style="color: #aaa; margin: 0; font-size: 14px; line-height: 1.6;">Watch for onboarding emails with setup instructions and resources.</p>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
              <div style="display: flex; align-items: start; gap: 12px;">
                <div style="background: #c8ff00; color: #0a0a0f; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">Meet Your Account Manager</h4>
                  <p style="color: #aaa; margin: 0; font-size: 14px; line-height: 1.6;">Your dedicated account manager will reach out within 24-48 hours to schedule your kickoff call.</p>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
              <div style="display: flex; align-items: start; gap: 12px;">
                <div style="background: #c8ff00; color: #0a0a0f; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">GeeNius Pathway Setup</h4>
                  <p style="color: #aaa; margin: 0; font-size: 14px; line-height: 1.6;">We'll integrate all your tools, set up tracking, and configure your custom optimization roadmap.</p>
                </div>
              </div>
            </div>

            <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
              <div style="display: flex; align-items: start; gap: 12px;">
                <div style="background: #c8ff00; color: #0a0a0f; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">4</div>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">Your Custom Roadmap</h4>
                  <p style="color: #aaa; margin: 0; font-size: 14px; line-height: 1.6;">You'll receive your personalized 90-day action plan tailored to ${businessName}.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Start Resources -->
          <div style="background: rgba(168, 85, 247, 0.1); border: 2px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #a855f7; margin: 0 0 15px 0; font-size: 18px;">🚀 Quick Start Resources:</h3>
            <ul style="color: #ccc; margin: 0; padding-left: 20px; line-height: 2;">
              <li>Access to your private client portal</li>
              <li>GeeNius Pathway training library</li>
              <li>Direct Slack channel with your team</li>
              <li>Monthly strategy call calendar</li>
            </ul>
          </div>

          <!-- Support Section -->
          <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <h4 style="color: #10b981; margin: 0 0 10px 0; font-size: 16px;">💬 Need Help?</h4>
            <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.6;">
              Reply to this email anytime or reach out via:<br>
              📧 <a href="mailto:support@localrank.ai" style="color: #c8ff00; text-decoration: none;">support@localrank.ai</a><br>
              📞 1-800-GEENIUS
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 40px 0 30px;">
            <a href="https://localrank.ai/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a855f7 100%); color: #0a0a0f; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
              ACCESS YOUR DASHBOARD →
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 25px; margin-top: 30px;">
            <p style="color: #666; font-size: 13px; text-align: center; line-height: 1.6; margin: 0;">
              Welcome to the GeeNius Ecosystem 🏆<br>
              Together, we'll make ${businessName} the #1 choice in your market.
            </p>
          </div>
        </div>
      </div>
    `;

    const recipientEmail = lead.email;
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GeeNius Team <noreply@updates.localrnk.com>',
        to: recipientEmail,
        subject: `🎉 Welcome to GeeNius Pathway, ${businessName}!`,
        html: emailHtml,
        tags: [
          { name: 'type', value: 'closed_deal_welcome' },
          { name: 'funnel', value: 'geenius' }
        ]
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const resendData = await emailResponse.json();

    // Log email
    await base44.asServiceRole.entities.EmailLog.create({
      to: lead.email,
      from: 'GeeNius Team <onboarding@resend.dev>',
      subject: `🎉 Welcome to GeeNius Pathway, ${businessName}!`,
      type: 'welcome',
      status: 'sent',
      metadata: {
        lead_id,
        business_name: businessName,
        resend_id: resendData.id,
        funnel: 'geenius',
        email_category: 'closed_deal_welcome'
      }
    });

    // Update lead with welcome email sent flag
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      admin_notes: (lead.admin_notes || '') + `\n[${new Date().toISOString()}] Closed deal welcome email sent`
    });

    // Trigger background workflows (non-blocking)
    Promise.all([
      base44.asServiceRole.functions.invoke('onboarding/initializeOnboarding', { lead_id }).catch(e => console.error('Onboarding error:', e)),
      base44.asServiceRole.functions.invoke('ai/generateActionPlan', { lead_id }).catch(e => console.error('Action plan error:', e)),
      base44.asServiceRole.functions.invoke('metrics/captureGMBSnapshot', { lead_id }).catch(e => console.error('Snapshot error:', e))
    ]).catch(() => {});

    return Response.json({ 
      success: true, 
      resend_id: resendData.id,
      email_sent: true,
      to: lead.email,
      workflows_triggered: ['onboarding', 'action_plan', 'metrics_snapshot']
    });

  } catch (error) {
    console.error('Error in closedDealWelcome:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});