import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const VERIFIED_FROM = 'LocalRank.ai <noreply@updates.localrnk.com>';

const VALID_TRIGGERS = ['audit_submitted', 'pathway1_abandoned', 'pathway2_abandoned', 'pathway3_abandoned', 'no_selection_24h'];

const templates = {
  audit_submitted: (lead) => ({
    subject: "Your GMB Audit is Being Analyzed ✅",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Thank you, ${lead.business_name || 'there'}!</h2>
        <p>We've received your audit for <strong>${lead.business_name}</strong>. Our AI is analyzing your Google My Business profile now.</p>
        <ul>
          <li>📊 Full audit report with your health score</li>
          <li>🎯 Personalized 90-day optimization roadmap</li>
          <li>💡 Three exclusive growth pathways</li>
        </ul>
        <p><a href="https://localrank.ai/ResultsGeenius?lead_id=${lead.id}" style="background: #7c3aed; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Your Results →</a></p>
      </div>
    `
  }),
  pathway1_abandoned: (lead) => ({
    subject: "Complete Your Gov Tech Grant Pre-Qualification",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hi ${lead.business_name || 'there'},</h2>
        <p>You started the Gov Tech Grant pathway for <strong>${lead.business_name}</strong> but haven't completed it yet.</p>
        <ul>
          <li>✓ Grant eligibility check</li>
          <li>✓ Free grant writing consultation</li>
          <li>✓ Dedicated account manager</li>
        </ul>
        <p><a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=1" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Grant Application →</a></p>
      </div>
    `
  }),
  pathway2_abandoned: (lead) => ({
    subject: "Your Done-For-You GMB Optimization is Ready",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hi ${lead.business_name || 'there'},</h2>
        <p>Your Done-For-You optimization for <strong>${lead.business_name}</strong> is ready to schedule.</p>
        <ul>
          <li>✓ Complete GMB profile optimization</li>
          <li>✓ Review response strategy</li>
          <li>✓ Review generation system setup</li>
        </ul>
        <p><a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=2" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Schedule DFY Optimization →</a></p>
      </div>
    `
  }),
  pathway3_abandoned: (lead) => ({
    subject: "Your DIY GMB Program is Waiting",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hi ${lead.business_name || 'there'},</h2>
        <p>Your DIY optimization program for <strong>${lead.business_name}</strong> is ready to start.</p>
        <ul>
          <li>✓ Step-by-step optimization guide</li>
          <li>✓ Monthly group strategy calls</li>
          <li>✓ AI-powered content templates</li>
          <li>✓ Only $199/month, cancel anytime</li>
        </ul>
        <p><a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=3" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Get Started →</a></p>
      </div>
    `
  }),
  no_selection_24h: (lead) => ({
    subject: "⏰ Your Audit Results Are Still Available",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hi ${lead.business_name || 'there'},</h2>
        <p>Your GMB audit for <strong>${lead.business_name}</strong> is complete with a score of <strong>${lead.health_score || 'N/A'}/100</strong>. Your three pathways are still waiting.</p>
        <p><a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Choose My Path →</a></p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          <a href="https://localrank.ai/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #6b7280;">Unsubscribe</a>
        </p>
      </div>
    `
  })
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated users and service role calls (e.g. from orchestrator)
    const { lead_id, trigger_type } = await req.json();

    if (!lead_id || !trigger_type) {
      return Response.json({ error: 'Missing required fields: lead_id, trigger_type' }, { status: 400 });
    }

    if (!VALID_TRIGGERS.includes(trigger_type)) {
      return Response.json({ error: `Invalid trigger_type. Valid: ${VALID_TRIGGERS.join(', ')}` }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const emailData = templates[trigger_type](lead);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: VERIFIED_FROM,
        to: lead.email,
        subject: emailData.subject,
        html: emailData.html,
        tags: [{ name: 'trigger', value: trigger_type }, { name: 'funnel', value: 'geenius' }]
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
      metadata: { lead_id, business_name: lead.business_name, trigger_type, resend_id: resendData.id }
    });

    return Response.json({ success: true, email_sent: true, resend_id: resendData.id, to: lead.email, trigger: trigger_type });

  } catch (error) {
    console.error('geeniusNonConvertedFlow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});