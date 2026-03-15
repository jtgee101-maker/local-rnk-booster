import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const VERIFIED_FROM = 'LocalRank.ai <noreply@updates.localrnk.com>';

// ── Stage map: sequence_key → workflow_stage value ─────────────────────────────
const STAGE_MAP = {
  audit_submitted:              'audit_submitted',
  pathway_selection_nudge_2h:   'pathway_nudge_2h',
  pathway_selection_urgent_12h: 'pathway_nudge_12h',
  grant_pathway_selected:       'pathway_selected',
  dfy_pathway_selected:         'pathway_selected',
  diy_pathway_selected:         'pathway_selected',
  checkout_abandoned_1h:        'checkout_abandoned',
  checkout_abandoned_24h:       'checkout_abandoned',
  post_purchase_day1:           'converted'
};

// ── Token interpolation ────────────────────────────────────────────────────────
function interpolate(str, vars) {
  if (!str) return '';
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

// ── Unsubscribe footer ─────────────────────────────────────────────────────────
const UNSUBSCRIBE_FOOTER = (email) => `
  <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      <a href="https://localrank.ai/unsubscribe?email=${encodeURIComponent(email || '')}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="mailto:support@localrank.ai" style="color:#9ca3af;text-decoration:underline;">Contact Support</a>
    </p>
  </div>`;

// ── Hardcoded fallback templates (used when no DB template found) ──────────────
const FALLBACK_TEMPLATES = {
  audit_submitted: (l) => ({
    subject: `Your GMB Audit is Being Analyzed ✅`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#7c3aed;">Thank you, ${l.business_name || 'there'}!</h2>
      <p>We've received your audit for <strong>${l.business_name}</strong>. Our AI is analyzing your Google My Business profile now.</p>
      <p style="margin:24px 0;"><a href="https://localrank.ai/ResultsGeenius?lead_id=${l.id}" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Results →</a></p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  }),
  pathway_selection_nudge_2h: (l) => ({
    subject: `⏰ Your GMB results are ready — choose your pathway`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#7c3aed;">Your results are waiting, ${l.business_name || 'there'}!</h2>
      <p>Your GMB Health Score: <strong style="color:#7c3aed;">${l.health_score || '—'}/100</strong></p>
      <p>Choose your growth pathway now to start improving your local rankings.</p>
      <p style="margin:24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${l.id}" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Pathways →</a></p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  }),
  pathway_selection_urgent_12h: (l) => ({
    subject: `🚨 Final reminder: Your exclusive pathways expire soon`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#dc2626;">Your pathways are about to expire, ${l.business_name || 'there'}</h2>
      <p>Competitors in your area are claiming the spots you're leaving behind.</p>
      <p style="margin:24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${l.id}" style="background:#dc2626;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Claim Your Pathway Now →</a></p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  }),
  grant_pathway_selected: (l) => ({
    subject: `✅ Gov Tech Grant pathway confirmed — next steps`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#7c3aed;">Great choice, ${l.business_name || 'there'}!</h2>
      <p>You've selected the Gov Tech Grant pathway. Our team will be in touch within 24 hours to walk you through the qualification process.</p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  }),
  dfy_pathway_selected: (l) => ({
    subject: `✅ Done-For-You pathway confirmed — next steps`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#3b82f6;">Welcome aboard, ${l.business_name || 'there'}!</h2>
      <p>You've selected the Done-For-You pathway. Our specialists will handle everything for you. Expect a call within 24 hours.</p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  }),
  diy_pathway_selected: (l) => ({
    subject: `✅ DIY pathway confirmed — your access is ready`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#22c55e;">You're all set, ${l.business_name || 'there'}!</h2>
      <p>You've selected the DIY Software pathway. Your training resources and guides are ready to access.</p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  }),
  checkout_abandoned_1h: (l) => ({
    subject: `🛒 You left something behind — complete your order`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#7c3aed;">Still thinking, ${l.business_name || 'there'}?</h2>
      <p>Your spot is still reserved. Complete your order now before it expires.</p>
      <p style="margin:24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${l.id}" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Complete My Order →</a></p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  }),
  checkout_abandoned_24h: (l) => ({
    subject: `⚠️ Last chance — your discount expires today`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#dc2626;">This is your final reminder, ${l.business_name || 'there'}</h2>
      <p>Your exclusive discount and reserved spot expire today. Don't let competitors take your ranking.</p>
      <p style="margin:24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${l.id}" style="background:#dc2626;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Claim My Discount →</a></p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  }),
  post_purchase_day1: (l) => ({
    subject: `🎉 You're in — here's what happens next`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#22c55e;">Welcome to LocalRank, ${l.business_name || 'there'}!</h2>
      <p>Your order is confirmed. Our team is reviewing your profile and will begin optimization within 24 hours.</p>
      ${UNSUBSCRIBE_FOOTER(l.email)}</div>`
  })
};

// ── Template loader: DB-first, hardcoded fallback ──────────────────────────────
async function loadTemplate(base44, templateKey, lead) {
  try {
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
      template_key: templateKey,
      status: 'active'
    }, '-version', 1);

    if (templates.length > 0) {
      const t = templates[0];
      const vars = {
        business_name: lead.business_name || 'there',
        health_score: lead.health_score || '',
        lead_id: lead.id,
        email: lead.email
      };
      return { subject: interpolate(t.subject_line, vars), html: interpolate(t.body_html, vars) };
    }
  } catch (e) {
    console.warn(`Template DB load failed for ${templateKey}:`, e.message);
  }

  const fallback = FALLBACK_TEMPLATES[templateKey];
  return fallback ? fallback(lead) : null;
}

// ── Dedup check ────────────────────────────────────────────────────────────────
async function isDuplicateEmail(base44, leadId, templateKey) {
  try {
    const logs = await base44.asServiceRole.entities.EmailLog.filter({
      template_key: templateKey,
      'metadata.lead_id': leadId
    }, '-created_date', 1);
    return logs.length > 0;
  } catch (_) {
    return false; // fail open
  }
}

// ── Core send ──────────────────────────────────────────────────────────────────
async function sendEmail(base44, lead, templateKey, subject, html) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  const alreadySent = await isDuplicateEmail(base44, lead.id, templateKey);
  if (alreadySent) {
    console.log(`[DEDUP] Skipping ${templateKey} for lead ${lead.id} — already sent`);
    return null;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: VERIFIED_FROM,
      to: lead.email,
      subject,
      html,
      tags: [{ name: 'sequence', value: templateKey }, { name: 'funnel', value: 'geenius' }]
    })
  });

  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  const resendData = await res.json();
  const stage = STAGE_MAP[templateKey] || templateKey;
  const now = new Date().toISOString();

  // Write EmailLog with full structured fields + backward-compat metadata
  base44.asServiceRole.entities.EmailLog.create({
    to: lead.email,
    from: VERIFIED_FROM,
    subject,
    type: 'nurture',
    status: 'sent',
    template_key: templateKey,
    workflow_type: 'geenius_quiz',
    stage,
    provider_id: resendData.id,
    sent_at: now,
    metadata: { lead_id: lead.id, sequence_key: templateKey, resend_id: resendData.id, funnel: 'geenius' }
  }).catch(() => {});

  // Update lead workflow_stage (fire and forget)
  base44.asServiceRole.entities.Lead.update(lead.id, { workflow_stage: stage }).catch(() => {});

  console.log(`[SENT] ${templateKey} → ${lead.email} (stage: ${stage}, resend_id: ${resendData.id})`);
  return resendData.id;
}

// ── Main handler ───────────────────────────────────────────────────────────────
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

        const tmpl = await loadTemplate(base44, 'audit_submitted', leadObj);
        if (tmpl) {
          sendEmail(base44, leadObj, 'audit_submitted', tmpl.subject, tmpl.html)
            .catch(e => console.error('audit_submitted send failed:', e.message));
        }

        await scheduleEmail(base44, leadObj, 'pathway_selection_nudge_2h', 2);
        await scheduleEmail(base44, leadObj, 'pathway_selection_urgent_12h', 12);
      }

      return Response.json({ success: true, event: 'lead_created_workflow_started', lead_id });
    }

    // ── LEAD UPDATED ──────────────────────────────────────────────────────────
    if (event.type === 'update' && event.entity_name === 'Lead') {
      const lead_id = event.entity_id || data?.id;
      const lead = data || (lead_id ? await base44.asServiceRole.entities.Lead.filter({ id: lead_id }).then(r => r[0]) : null);

      if (lead && lead.email) {
        let sequence_key = null;

        if (lead.selected_pathway) {
          const pathwayMap = { grant: 'grant_pathway_selected', dfy: 'dfy_pathway_selected', diy: 'diy_pathway_selected' };
          sequence_key = pathwayMap[lead.selected_pathway] || null;
        }

        if (!sequence_key && lead.admin_notes) {
          const notes = lead.admin_notes.toLowerCase();
          if (notes.includes('pathway 1') || notes.includes('grant')) sequence_key = 'grant_pathway_selected';
          else if (notes.includes('pathway 2') || notes.includes('done for you') || notes.includes('dfy')) sequence_key = 'dfy_pathway_selected';
          else if (notes.includes('pathway 3') || notes.includes('diy')) sequence_key = 'diy_pathway_selected';
        }

        if (sequence_key) {
          const leadObj = { id: lead.id || lead_id, email: lead.email, business_name: lead.business_name, health_score: lead.health_score };
          await scheduleEmail(base44, leadObj, sequence_key, 0);
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

// ── Schedule helper — dedup via EmailLog (already-sent check) + existence check ─
async function scheduleEmail(base44, lead, sequence_key, delay_hours) {
  try {
    const delayMs = delay_hours > 0 ? delay_hours * 60 * 60 * 1000 : 60 * 1000;
    const next_email_date = new Date(Date.now() + delayMs).toISOString();
    const seq_name = `geenius_${sequence_key}`;

    // Check if already sent via EmailLog (strongest dedup signal)
    const sentLogs = await base44.asServiceRole.entities.EmailLog.filter({
      template_key: sequence_key,
      'metadata.lead_id': lead.id
    }, '-created_date', 1).catch(() => []);
    if (sentLogs.length > 0) {
      console.log(`[DEDUP-LOG] ${sequence_key} already sent to lead ${lead.id} — skipping`);
      return true;
    }

    // Check if a nurture record already exists (active or completed)
    const existing = await base44.asServiceRole.entities.LeadNurture.filter({
      lead_id: lead.id,
      sequence_name: seq_name
    }).catch(() => []);

    if (existing.length > 0) {
      console.log(`[DEDUP-NURTURE] ${seq_name} already exists for lead ${lead.id} — skipping`);
      return true;
    }

    await base44.asServiceRole.entities.LeadNurture.create({
      lead_id: lead.id,
      email: lead.email,
      sequence_name: seq_name,
      current_step: 0,
      total_steps: 1,
      status: 'active',
      next_email_date,
      emails_sent: 0
    });
    console.log(`Scheduled ${sequence_key} for lead ${lead.id} at ${next_email_date}`);
    return true;
  } catch (error) {
    console.error(`Failed to schedule ${sequence_key}:`, error);
    return false;
  }
}