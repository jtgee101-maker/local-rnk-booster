import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const VERIFIED_FROM = 'LocalRank.ai <noreply@updates.localrnk.com>';

// Geenius sequences (inline - avoids 403 from cross-function auth)
const GEENIUS_SEQUENCES = {
  audit_submitted: (lead) => ({
    subject: "Your GMB Audit is Being Analyzed ✅",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #7c3aed;">Thank you, ${lead.business_name || 'there'}!</h2>
      <p>We've received your audit for <strong>${lead.business_name}</strong>. Our AI is analyzing your Google My Business profile now.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/ResultsGeenius?lead_id=${lead.id}" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Results →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  follow_up: (lead) => ({
    subject: `Following up on your GMB audit - ${lead.business_name}`,
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hi ${lead.business_name || 'there'},</h2>
      <p>Just checking in — your health score was <strong>${lead.health_score || 'N/A'}/100</strong>. We've found opportunities to improve your local visibility.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Pathways →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  pathway_selection_nudge_2h: (lead) => ({
    subject: "Your GMB Audit Results Are Ready 🎯",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hi ${lead.business_name || 'there'},</h2>
      <p>Your audit is complete! Health Score: <strong>${lead.health_score || 'N/A'}/100</strong></p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Choose Your Path →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  pathway_selection_urgent_12h: (lead) => ({
    subject: "⏰ Don't Miss Your GMB Growth Opportunity",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color:#dc2626;">Last reminder, ${lead.business_name || 'there'}!</h2>
      <p>Your audit results are still waiting. Health score: <strong>${lead.health_score || 'N/A'}/100</strong>. Every day without optimization is revenue left on the table.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View My Pathways →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  dfy_pathway_selected: (lead) => ({
    subject: "Let's Schedule Your Done-For-You Optimization",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Perfect choice, ${lead.business_name || 'there'}! 🎯</h2>
      <p>You've chosen our Done-For-You optimization. Here's what happens next: strategy call, deep-dive audit, full GMB optimization, monthly reviews.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=2" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Book Strategy Call (Free) →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  grant_pathway_selected: (lead) => ({
    subject: "Your Gov Tech Grant Application — Next Steps",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Exciting News, ${lead.business_name || 'there'}! 🏛️</h2>
      <p>You've selected the Gov Tech Grant pathway. We'll assess eligibility, assist with the application, and connect you with a grant specialist.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=1" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Start Grant Application →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  diy_pathway_selected: (lead) => ({
    subject: "Your DIY GMB Program — Get Started Today",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Let's Do This, ${lead.business_name || 'there'}! 💪</h2>
      <p>You're ready to optimize on your own terms. Your program includes step-by-step guides, AI content templates, monthly group calls, and email support. Only $199/month.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/Checkout?lead_id=${lead.id}&pathway=3" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Start DIY Program →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  post_purchase_day1: (lead) => ({
    subject: "Welcome to LocalRank.ai! Your Journey Starts Now 🚀",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color:#7c3aed;">Welcome, ${lead.business_name || 'there'}! 🎉</h2>
      <p>Your order is confirmed! Next steps: check email for account setup, log in to your dashboard, and schedule your kickoff call.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/ClientDashboard" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Access Your Dashboard →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  checkout_abandoned_1h: (lead) => ({
    subject: "Your GMB optimization order is waiting",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hi ${lead.business_name || 'there'},</h2>
      <p>You were about to complete your GMB optimization. Questions? 30-day money-back guarantee. No contracts. Proven results in 90 days.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Complete Your Order →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  }),
  checkout_abandoned_24h: (lead) => ({
    subject: "Still thinking about it? Here's what others say...",
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hi ${lead.business_name || 'there'},</h2>
      <p>Businesses that optimize their GMB profile see 73% more direction requests and 56% more calls within 90 days. Your results are still available.</p>
      <p style="margin: 24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${lead.id}" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View My Options →</a></p>
      ${unsubFooter(lead.email)}
    </div>`
  })
};

// Legacy sequence name mappings → geenius sequence key
const LEGACY_SEQUENCE_MAP = {
  'unconverted_followup': 'follow_up',
  'Foxy Audit Follow-up': 'follow_up',
  'foxy_audit_follow_up': 'follow_up',
  'post_conversion': 'post_purchase_day1'
};

function unsubFooter(email) {
  return `<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      <a href="https://localrank.ai/unsubscribe?email=${encodeURIComponent(email || '')}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="mailto:support@localrank.ai" style="color:#9ca3af;text-decoration:underline;">Contact Support</a>
    </p>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const nurtures = await base44.asServiceRole.entities.LeadNurture.filter(
      { status: 'active' },
      'next_email_date',
      50
    );

    const now = new Date();
    const processed = [];
    const failed = [];
    const skipped = [];

    for (const nurture of nurtures) {
      // Skip if not yet due
      if (!nurture.next_email_date || new Date(nurture.next_email_date) > now) {
        skipped.push(nurture.id);
        continue;
      }

      // Skip records with no email or lead_id
      if (!nurture.email || !nurture.lead_id) {
        console.warn(`Completing nurture ${nurture.id}: missing email or lead_id`);
        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, { status: 'completed' }).catch(() => {});
        continue;
      }

      // Resolve sequence key — strip 'geenius_' prefix, map legacy names
      let rawKey = nurture.sequence_name || '';
      if (rawKey.startsWith('geenius_')) rawKey = rawKey.slice('geenius_'.length);
      const sequence_key = LEGACY_SEQUENCE_MAP[rawKey] || rawKey;

      const template = GEENIUS_SEQUENCES[sequence_key];

      if (!template) {
        console.warn(`Completing nurture ${nurture.id}: unknown sequence "${sequence_key}"`);
        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, { status: 'completed' }).catch(() => {});
        continue;
      }

      try {
        // Fetch lead data for personalization
        const leads = await base44.asServiceRole.entities.Lead.filter({ id: nurture.lead_id });
        const lead = leads[0];

        if (!lead) {
          console.warn(`Completing nurture ${nurture.id}: lead not found`);
          await base44.asServiceRole.entities.LeadNurture.update(nurture.id, { status: 'completed' }).catch(() => {});
          continue;
        }

        const emailData = template(lead);

        // Send directly via Resend
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: VERIFIED_FROM,
            to: nurture.email,
            subject: emailData.subject,
            html: emailData.html,
            tags: [{ name: 'sequence', value: sequence_key }, { name: 'funnel', value: 'geenius' }]
          })
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          throw new Error(`Resend error ${resendRes.status}: ${errText}`);
        }

        const resendData = await resendRes.json();

        // Log & mark complete
        await base44.asServiceRole.entities.EmailLog.create({
          to: nurture.email,
          from: VERIFIED_FROM,
          subject: emailData.subject,
          type: 'nurture',
          status: 'sent',
          metadata: { lead_id: nurture.lead_id, sequence_key, nurture_id: nurture.id, resend_id: resendData.id, funnel: 'geenius' }
        }).catch(() => {});

        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, {
          status: 'completed',
          emails_sent: (nurture.emails_sent || 0) + 1,
          last_email_date: now.toISOString()
        });

        processed.push({ lead_id: nurture.lead_id, email: nurture.email, sequence: sequence_key });
        console.log(`✅ Sent ${sequence_key} to ${nurture.email}`);

      } catch (error) {
        console.error(`❌ Failed ${sequence_key} to ${nurture.email}:`, error.message);
        failed.push({ lead_id: nurture.lead_id, email: nurture.email, sequence: sequence_key, error: error.message });

        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, {
          status: 'paused',
          last_email_date: now.toISOString()
        }).catch(() => {});
      }
    }

    console.log(`processScheduledEmails: processed=${processed.length} failed=${failed.length} skipped=${skipped.length}`);

    return Response.json({
      success: true,
      processed: processed.length,
      failed: failed.length,
      skipped: skipped.length,
      details: { processed, failed }
    });

  } catch (error) {
    console.error('processScheduledEmails error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});