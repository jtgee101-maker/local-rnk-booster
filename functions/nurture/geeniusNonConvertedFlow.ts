import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const emailTemplates = {
  pathway1_abandoned: {
    subject: "Complete Your Gov Tech Grant Pre-Qualification",
    from: "LocalRank.ai <nurture@localrank.ai>",
    html: (name, businessName) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>You started the GMB audit for <strong>${businessName}</strong> but didn't complete your Gov Tech Grant pathway.</p>
        <p>Here's what you're missing:</p>
        <ul>
          <li>✓ $25K-$50K Gov Tech Grant eligibility check</li>
          <li>✓ Free grant writing consultation</li>
          <li>✓ Dedicated account manager</li>
        </ul>
        <p><a href="https://localrank.ai/QuizGeenius?email=${encodeURIComponent(businessName)}&pathway=1" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Gov Tech Grant Review</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">You have 24 hours to complete this before your audit results expire.</p>
      </div>
    `
  },
  pathway2_abandoned: {
    subject: "Your Done-For-You GMB Optimization is Ready to Schedule",
    from: "LocalRank.ai <nurture@localrank.ai>",
    html: (name, businessName) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>Your audit for <strong>${businessName}</strong> is complete, but you haven't scheduled your Done-For-You optimization yet.</p>
        <p><strong>What we'll do for you:</strong></p>
        <ul>
          <li>✓ Complete GMB profile optimization</li>
          <li>✓ Review response strategy</li>
          <li>✓ Set up review generation system</li>
        </ul>
        <p><a href="https://localrank.ai/QuizGeenius?email=${encodeURIComponent(businessName)}&pathway=2" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Schedule DFY Optimization</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Limited slots available this week.</p>
      </div>
    `
  },
  pathway3_abandoned: {
    subject: "Start Your DIY GMB Optimization Today – $97/month",
    from: "LocalRank.ai <nurture@localrank.ai>",
    html: (name, businessName) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>You're ready to optimize <strong>${businessName}</strong> on your own terms.</p>
        <p><strong>DIY Program Includes:</strong></p>
        <ul>
          <li>✓ Step-by-step optimization guide</li>
          <li>✓ Monthly strategy calls</li>
          <li>✓ AI-powered content templates</li>
          <li>✓ Only $97/month</li>
        </ul>
        <p><a href="https://localrank.ai/QuizGeenius?email=${encodeURIComponent(businessName)}&pathway=3" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Get Started with DIY – $97/month</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Cancel anytime, no commitment.</p>
      </div>
    `
  },
  audit_submitted: {
    subject: "Your GMB Audit is Being Analyzed",
    from: "LocalRank.ai <support@localrank.ai>",
    html: (name) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you, ${name}!</h2>
        <p>We've received your audit submission. Our AI is analyzing your Google My Business profile now.</p>
        <p><strong>What's next:</strong></p>
        <ul>
          <li>📊 Full audit report (within 2 hours)</li>
          <li>🎯 Personalized optimization roadmap</li>
          <li>💡 AI-powered recommendations</li>
        </ul>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Check your inbox for your custom audit report soon!</p>
      </div>
    `
  },
  no_selection_24h: {
    subject: "Your Audit Results Expire Soon – Choose Your Path",
    from: "LocalRank.ai <support@localrank.ai>",
    html: (name, businessName) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>⏰ Last Chance, ${name}</h2>
        <p>Your audit for <strong>${businessName}</strong> expires in 24 hours.</p>
        <p><strong>Choose your path:</strong></p>
        <table style="width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">
              <strong>Gov Tech Grant</strong><br>$25K-$50K funding<br>
              <a href="https://localrank.ai/QuizGeenius?email=${encodeURIComponent(businessName)}&pathway=1">Review →</a>
            </td>
            <td style="padding: 10px; border: 1px solid #ddd;">
              <strong>Done-For-You</strong><br>Full optimization<br>
              <a href="https://localrank.ai/QuizGeenius?email=${encodeURIComponent(businessName)}&pathway=2">Schedule →</a>
            </td>
            <td style="padding: 10px; border: 1px solid #ddd;">
              <strong>DIY Plan</strong><br>$97/month<br>
              <a href="https://localrank.ai/QuizGeenius?email=${encodeURIComponent(businessName)}&pathway=3">Start →</a>
            </td>
          </tr>
        </table>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Results will be archived after 24 hours.</p>
      </div>
    `
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { lead_id, trigger_type } = await req.json();

    if (!lead_id || !trigger_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: lead_id, trigger_type' }),
        { status: 400 }
      );
    }

    // Fetch lead data
    const lead = await base44.entities.Lead.filter({ id: lead_id }).then(r => r[0]);

    if (!lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404 });
    }

    // Determine template and pathway
    let template;
    let pathway = null;

    if (trigger_type === 'audit_submitted') {
      template = emailTemplates.audit_submitted;
    } else if (trigger_type === 'pathway1_abandoned') {
      template = emailTemplates.pathway1_abandoned;
      pathway = 1;
    } else if (trigger_type === 'pathway2_abandoned') {
      template = emailTemplates.pathway2_abandoned;
      pathway = 2;
    } else if (trigger_type === 'pathway3_abandoned') {
      template = emailTemplates.pathway3_abandoned;
      pathway = 3;
    } else if (trigger_type === 'no_selection_24h') {
      template = emailTemplates.no_selection_24h;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid trigger type' }), { status: 400 });
    }

    // Generate email HTML
    const html = trigger_type === 'audit_submitted'
      ? template.html(lead.contact_name || lead.business_name || 'there')
      : trigger_type === 'no_selection_24h'
      ? template.html(lead.contact_name || lead.business_name || 'there', lead.business_name)
      : template.html(lead.contact_name || lead.business_name || 'there', lead.business_name);

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: template.from,
        to: lead.email,
        subject: template.subject,
        html: html,
        tags: [
          { name: 'trigger', value: trigger_type },
          { name: 'funnel', value: 'geenius' },
          { name: 'pathway', value: String(pathway || 'none') }
        ]
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const resendData = await emailResponse.json();

    // Log email send in database
    await base44.entities.EmailLog.create({
      to: lead.email,
      from: template.from,
      subject: template.subject,
      type: trigger_type,
      status: 'sent',
      metadata: {
        lead_id: lead_id,
        business_name: lead.business_name,
        trigger_type: trigger_type,
        pathway: pathway,
        resend_id: resendData.id
      }
    });

    // Update lead nurture status
    const existingNurture = await base44.entities.LeadNurture.filter({
      lead_id: lead_id
    }).then(r => r[0]);

    if (existingNurture) {
      await base44.entities.LeadNurture.update(existingNurture.id, {
        last_email_date: new Date().toISOString(),
        emails_sent: (existingNurture.emails_sent || 0) + 1
      });
    } else {
      await base44.entities.LeadNurture.create({
        lead_id: lead_id,
        email: lead.email,
        sequence_name: `geenius_${trigger_type}`,
        current_step: 1,
        total_steps: 5,
        status: 'active',
        emails_sent: 1,
        last_email_date: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: true,
        resend_id: resendData.id,
        to: lead.email,
        trigger: trigger_type
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in geeniusNonConvertedFlow:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { status: 500 }
    );
  }
});