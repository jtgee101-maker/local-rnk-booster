import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const VERIFIED_FROM = 'LocalRank.ai <noreply@updates.localrnk.com>';

const UNSUBSCRIBE_FOOTER = (email) => `
  <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      <a href="https://localrank.ai/unsubscribe?email=${encodeURIComponent(email || '')}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="mailto:support@localrank.ai" style="color:#9ca3af;text-decoration:underline;">Contact Support</a>
    </p>
  </div>`;

async function sendEmail(base44, lead, sequenceKey, subject, html) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: VERIFIED_FROM,
      to: lead.email,
      subject,
      html,
      tags: [{ name: 'sequence', value: sequenceKey }, { name: 'funnel', value: 'geenius' }]
    })
  });

  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  const data = await res.json();

  base44.asServiceRole.entities.EmailLog.create({
    to: lead.email, from: VERIFIED_FROM, subject,
    type: 'nurture', status: 'sent',
    metadata: { lead_id: lead.id, sequence_key: sequenceKey, resend_id: data.id, funnel: 'geenius' }
  }).catch(() => {});

  return data.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!event || !event.type || !event.entity_name) {
      return Response.json({ error: 'Invalid event structure', received: { event } }, { status: 400 });
    }

    // ── LEAD CREATED ──────────────────────────────────────────────────────────
    if (event.type === 'create' && event.entity_name === 'Lead') {
      const lead_id = event.entity_id || data?.id;
      const lead = data || (lead_id ? await base44.asServiceRole.entities.Lead.filter({ id: lead_id }).then(r => r[0]) : null);

      if (lead && lead.email) {
        const leadObj = { id: lead.id || lead_id, email: lead.email, business_name: lead.business_name, health_score: lead.health_score };

        // Send immediate confirmation inline (avoids service-role 403)
        sendEmail(base44, leadObj, 'audit_submitted',
          'Your GMB Audit is Being Analyzed ✅',
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#7c3aed;">Thank you, ${leadObj.business_name || 'there'}!</h2>
            <p>We've received your audit for <strong>${leadObj.business_name}</strong>. Our AI is analyzing your Google My Business profile now.</p>
            <p style="margin:24px 0;"><a href="https://localrank.ai/ResultsGeenius?lead_id=${leadObj.id}" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Results →</a></p>
            ${UNSUBSCRIBE_FOOTER(leadObj.email)}
          </div>`
        ).catch(e => console.error('audit_submitted send failed:', e.message));

        // Schedule follow-up nudges
        await scheduleEmail(base44, leadObj, 'pathway_selection_nudge_2h', 2);
        await scheduleEmail(base44, leadObj, 'pathway_selection_urgent_12h', 12);
      }

      return Response.json({ success: true, event: 'lead_created_workflow_started', lead_id });
    }

    // ── LEAD UPDATED ──────────────────────────────────────────────────────────
    if (event.type === 'update' && event.entity_name === 'Lead') {
      const lead_id = event.entity_id || data?.id;
      const lead = data || (lead_id ? await base44.asServiceRole.entities.Lead.filter({ id: lead_id }).then(r => r[0]) : null);

      if (lead && lead.email && lead.admin_notes) {
        const notes = lead.admin_notes.toLowerCase();
        let sequence_key = null;

        if (notes.includes('pathway 1') || notes.includes('grant')) {
          sequence_key = 'grant_pathway_selected';
        } else if (notes.includes('pathway 2') || notes.includes('done for you') || notes.includes('dfy')) {
          sequence_key = 'dfy_pathway_selected';
        } else if (notes.includes('pathway 3') || notes.includes('diy')) {
          sequence_key = 'diy_pathway_selected';
        }

        if (sequence_key) {
          const leadObj = { id: lead.id || lead_id, email: lead.email, business_name: lead.business_name, health_score: lead.health_score };

          // Re-invoke processScheduledEmails handles these via LeadNurture records
          // Schedule immediately (0h delay) for the pathway confirmation
          await scheduleEmail(base44, leadObj, sequence_key, 0);

          // Schedule abandoned checkout follow-ups
          await scheduleEmail(base44, leadObj, 'checkout_abandoned_1h', 1);
          await scheduleEmail(base44, leadObj, 'checkout_abandoned_24h', 24);
        }
      }

      return Response.json({ success: true, event: 'lead_updated_workflow_processed' });
    }

    // ── ORDER CREATED ─────────────────────────────────────────────────────────
    if (event.type === 'create' && event.entity_name === 'Order') {
      const order = data;

      if (order && order.email) {
        const leads = await base44.asServiceRole.entities.Lead.filter({ email: order.email });
        const lead = leads[0];

        if (lead) {
          const leadObj = { id: lead.id, email: lead.email, business_name: lead.business_name, health_score: lead.health_score };
          await scheduleEmail(base44, leadObj, 'post_purchase_day1', 0);
        }
      }

      return Response.json({ success: true, event: 'order_completed_workflow_started' });
    }

    return Response.json({ 
      success: true,
      message: 'No matching workflow for this event',
      event_type: event.type,
      entity_name: event.entity_name
    });

  } catch (error) {
    console.error('Orchestrator error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function scheduleEmail(base44, lead, sequence_key, delay_hours) {
  try {
    const next_email_date = new Date(Date.now() + delay_hours * 60 * 60 * 1000).toISOString();

    const existing = await base44.asServiceRole.entities.LeadNurture.filter({
      lead_id: lead.id,
      sequence_name: `geenius_${sequence_key}`
    });

    if (existing.length === 0) {
      await base44.asServiceRole.entities.LeadNurture.create({
        lead_id: lead.id,
        email: lead.email,
        sequence_name: `geenius_${sequence_key}`,
        current_step: 0,
        total_steps: 1,
        status: 'active',
        next_email_date,
        emails_sent: 0
      });
      console.log(`Scheduled ${sequence_key} for lead ${lead.id} at ${next_email_date}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to schedule ${sequence_key}:`, error);
    return false;
  }
}