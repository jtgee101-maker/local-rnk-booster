import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// Single verified sending domain - all emails must come from here
const VERIFIED_FROM = 'LocalRank.ai <noreply@updates.localrnk.com>';

const UNSUBSCRIBE_FOOTER = (email) => `
  <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
      You received this email because you completed a GMB audit at LocalRank.ai
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      <a href="https://localrank.ai/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="mailto:support@localrank.ai" style="color: #9ca3af; text-decoration: underline;">Contact Support</a>
    </p>
  </div>
`;

const sequences = {
  // Immediately after audit submission
  audit_submitted: {
    template: (lead) => ({
      subject: "Your GMB Audit is Being Analyzed ✅",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2 style="color: #7c3aed;">Thank you, ${lead.business_name || 'there'}!</h2>
          <p>We've received your audit submission for <strong>${lead.business_name}</strong>.</p>
          <p>Our AI is analyzing your Google My Business profile now. You'll get:</p>
          <ul>
            <li>📊 Full audit report with your health score</li>
            <li>🎯 Personalized optimization roadmap</li>
            <li>💡 Three exclusive growth pathways</li>
          </ul>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/ResultsGeenius?lead_id=${lead.id}" style="background: #7c3aed; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Your Results →
            </a>
          </p>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // Manual follow-up sequence (geenius_follow_up from admin modal)
  follow_up: {
    template: (lead) => ({
      subject: `Following up on your GMB audit - ${lead.business_name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2>Hi ${lead.business_name || 'there'},</h2>
          <p>Just checking in — have you had a chance to review your GMB audit results?</p>
          <p>Your health score was <strong>${lead.health_score || 'N/A'}/100</strong>. We've identified several opportunities to improve your local visibility.</p>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Your Pathways →
            </a>
          </p>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // 2 hours after audit - no pathway selection
  pathway_selection_nudge_2h: {
    template: (lead) => ({
      subject: "Your GMB Audit Results Are Ready 🎯",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2>Hi ${lead.business_name || 'there'},</h2>
          <p>Your GMB audit for <strong>${lead.business_name}</strong> is complete! Health Score: <strong>${lead.health_score || 'N/A'}/100</strong></p>
          <p>Now it's time to pick your path forward:</p>
          <div style="margin: 20px 0; space-y: 12px;">
            <div style="padding: 15px; border: 2px solid #c8ff00; border-radius: 8px; margin-bottom: 12px;">
              <strong>👑 Gov Tech Grant</strong> — Check your eligibility for free infrastructure<br>
              <a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}&pathway=1" style="color: #7c3aed; font-weight: bold; text-decoration: none;">Choose This Path →</a>
            </div>
            <div style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
              <strong>💼 Done-For-You</strong> — Full optimization service, hands-off<br>
              <a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}&pathway=2" style="color: #7c3aed; font-weight: bold; text-decoration: none;">Choose This Path →</a>
            </div>
            <div style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px;">
              <strong>🎓 DIY Program</strong> — $199/month, self-guided with support<br>
              <a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}&pathway=3" style="color: #7c3aed; font-weight: bold; text-decoration: none;">Choose This Path →</a>
            </div>
          </div>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // 12 hours after audit - urgent
  pathway_selection_urgent_12h: {
    template: (lead) => ({
      subject: "⏰ Don't Miss Your GMB Growth Opportunity",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2 style="color: #dc2626;">Last reminder, ${lead.business_name || 'there'}!</h2>
          <p>Your audit results for <strong>${lead.business_name}</strong> are still waiting. Your health score of <strong>${lead.health_score || 'N/A'}/100</strong> shows real opportunities for growth.</p>
          <p>Every day without optimization is revenue left on the table. Choose your path now:</p>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View My Pathways →
            </a>
          </p>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // After pathway selection - DFY pathway
  dfy_pathway_selected: {
    template: (lead) => ({
      subject: "Let's Schedule Your Done-For-You Optimization",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2 style="color: #c8ff00; background: #0a0a0f; padding: 16px; border-radius: 8px;">Perfect choice, ${lead.business_name || 'there'}! 🎯</h2>
          <p>You've chosen our Done-For-You optimization for <strong>${lead.business_name}</strong>.</p>
          <p><strong>Here's what happens next:</strong></p>
          <ol>
            <li>📅 Schedule your free 15-min strategy call</li>
            <li>📊 We conduct a deep-dive audit</li>
            <li>🔧 Full GMB optimization completed for you</li>
            <li>📈 Monthly progress reviews</li>
          </ol>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=2" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Book Strategy Call (Free) →</a>
          </p>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // After pathway selection - Grant pathway
  grant_pathway_selected: {
    template: (lead) => ({
      subject: "Your Gov Tech Grant Application — Next Steps",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2>Exciting News, ${lead.business_name || 'there'}! 🏛️</h2>
          <p>You've selected the Gov Tech Grant pathway for <strong>${lead.business_name}</strong>.</p>
          <p><strong>Your pre-qualification includes:</strong></p>
          <ul>
            <li>✅ Grant eligibility assessment</li>
            <li>✅ Free grant writing consultation</li>
            <li>✅ Complete application support</li>
            <li>✅ Dedicated grant specialist</li>
          </ul>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=1" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start Grant Application →</a>
          </p>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // After pathway selection - DIY pathway
  diy_pathway_selected: {
    template: (lead) => ({
      subject: "Your DIY GMB Program — Get Started Today",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2>Let's Do This, ${lead.business_name || 'there'}! 💪</h2>
          <p>You're ready to optimize <strong>${lead.business_name}</strong> on your own terms.</p>
          <p><strong>Your DIY Program Includes:</strong></p>
          <ul>
            <li>✓ Step-by-step optimization guide</li>
            <li>✓ AI-powered content templates</li>
            <li>✓ Monthly group strategy calls</li>
            <li>✓ Email support from the team</li>
            <li>✓ Only $199/month (cancel anytime)</li>
          </ul>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=3" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start DIY Program →</a>
          </p>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // Post-purchase Day 1
  post_purchase_day1: {
    template: (lead) => ({
      subject: "Welcome to LocalRank.ai! Your Journey Starts Now 🚀",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2 style="color: #7c3aed;">Welcome to LocalRank.ai, ${lead.business_name || 'there'}! 🎉</h2>
          <p>Your order is confirmed! We're excited to help <strong>${lead.business_name}</strong> dominate local search.</p>
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>📧 Check your email for account setup instructions</li>
            <li>🔑 Log in to your dashboard</li>
            <li>📞 Schedule your kickoff call with your specialist</li>
          </ol>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/ClientDashboard" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Your Dashboard →</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">Questions? Reply to this email or contact <a href="mailto:support@localrank.ai">support@localrank.ai</a></p>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // Checkout abandoned - 1 hour
  checkout_abandoned_1h: {
    template: (lead) => ({
      subject: "Your GMB optimization order is waiting",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2>Hi ${lead.business_name || 'there'},</h2>
          <p>You were about to complete your GMB optimization for <strong>${lead.business_name}</strong>. Questions? We're here to help!</p>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Your Order →</a>
          </p>
          <p><strong>Common questions:</strong></p>
          <ul>
            <li>✓ 30-day money-back guarantee</li>
            <li>✓ No contracts, cancel anytime (DIY)</li>
            <li>✓ Proven results in 90 days</li>
          </ul>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  },

  // Checkout abandoned - 24 hours
  checkout_abandoned_24h: {
    template: (lead) => ({
      subject: "Still thinking about it? Here's what others say...",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2>Hi ${lead.business_name || 'there'},</h2>
          <p>No pressure — but businesses like <strong>${lead.business_name}</strong> that optimize their GMB profile see an average of 73% more direction requests and 56% more calls within 90 days.</p>
          <p>Your audit results are still available. Whenever you're ready:</p>
          <p style="margin: 24px 0;">
            <a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View My Options →</a>
          </p>
          ${UNSUBSCRIBE_FOOTER(lead.email)}
        </div>
      `
    })
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, sequence_key } = await req.json();

    if (!lead_id || !sequence_key) {
      return Response.json({ error: 'Missing lead_id or sequence_key' }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) {
      return Response.json({ error: `Lead not found: ${lead_id}` }, { status: 404 });
    }

    const sequence = sequences[sequence_key];
    if (!sequence) {
      return Response.json({ error: `Invalid sequence key: ${sequence_key}. Valid keys: ${Object.keys(sequences).join(', ')}` }, { status: 400 });
    }

    const emailData = sequence.template(lead);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: VERIFIED_FROM,
        to: lead.email,
        subject: emailData.subject,
        html: emailData.html,
        tags: [
          { name: 'sequence', value: sequence_key },
          { name: 'funnel', value: 'geenius' }
        ]
      })
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.text();
      throw new Error(`Resend API error: ${err}`);
    }

    const resendData = await emailResponse.json();

    await base44.asServiceRole.entities.EmailLog.create({
      to: lead.email,
      from: VERIFIED_FROM,
      subject: emailData.subject,
      type: 'nurture',
      status: 'sent',
      metadata: { lead_id, sequence_key, business_name: lead.business_name, resend_id: resendData.id, funnel: 'geenius' }
    });

    return Response.json({ success: true, resend_id: resendData.id, lead_email: lead.email, sequence_key });
  } catch (error) {
    console.error('geeniusEmailSequences error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});