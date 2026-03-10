import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const VERIFIED_FROM = 'LocalRank.ai <noreply@updates.localrnk.com>';

// Stage map: sequence_key → workflow_stage
const STAGE_MAP = {
  audit_submitted:              'audit_submitted',
  pathway_selection_nudge_2h:   'pathway_nudge_2h',
  pathway_selection_urgent_12h: 'pathway_nudge_12h',
  grant_pathway_selected:       'pathway_selected',
  dfy_pathway_selected:         'pathway_selected',
  diy_pathway_selected:         'pathway_selected',
  checkout_abandoned_1h:        'checkout_abandoned',
  checkout_abandoned_24h:       'checkout_abandoned',
  post_purchase_day1:           'converted',
  follow_up:                    'pathway_nudge_12h'
};

// Legacy sequence name → canonical key
const LEGACY_SEQUENCE_MAP = {
  unconverted_followup:       'follow_up',
  'Foxy Audit Follow-up':     'follow_up',
  foxy_audit_follow_up:       'follow_up',
  post_conversion:            'post_purchase_day1'
};

// Hardcoded fallback templates
const FALLBACK_TEMPLATES = {
  audit_submitted: (l) => ({
    subject: `Your GMB Audit is Being Analyzed ✅`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#7c3aed;">Thank you, ${l.business_name || 'there'}!</h2><p>We've received your audit for <strong>${l.business_name}</strong>. Our AI is analyzing your Google My Business profile now.</p><p style="margin:24px 0;"><a href="https://localrank.ai/ResultsGeenius?lead_id=${l.id}" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Results →</a></p>${unsubFooter(l.email)}</div>`
  }),
  follow_up: (l) => ({
    subject: `Following up on your GMB audit — ${l.business_name}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2>Hi ${l.business_name || 'there'},</h2><p>Your health score was <strong>${l.health_score || 'N/A'}/100</strong>. We've found opportunities to improve your local visibility.</p><p style="margin:24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${l.id}" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Pathways →</a></p>${unsubFooter(l.email)}</div>`
  }),
  pathway_selection_nudge_2h: (l) => ({
    subject: `⏰ ${l.business_name}, your GMB results are ready — choose your pathway`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#7c3aed;">Your results are waiting!</h2><p>GMB Health Score: <strong style="color:#7c3aed;">${l.health_score || 'N/A'}/100</strong></p><p style="margin:24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${l.id}" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Pathways →</a></p>${unsubFooter(l.email)}</div>`
  }),
  pathway_selection_urgent_12h: (l) => ({
    subject: `🚨 Final reminder: ${l.business_name}, your exclusive pathways expire soon`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#dc2626;">Your pathways are about to expire!</h2><p>Competitors in your area are claiming the spots you're leaving behind.</p><p style="margin:24px 0;"><a href="https://localrank.ai/BridgeGeenius?lead_id=${l.id}" style="background:#dc2626;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Claim Your Pathway Now →</a></p>${unsubFooter(l.email)}</div>`
  }),
  grant_pathway_selected: (l) => ({
    subject: `✅ Gov Tech Grant pathway confirmed — next steps`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#7c3aed;">Great choice, ${l.business_name || 'there'}!</h2><p>You've selected the Gov Tech Grant pathway. Our team will be in touch within 24 hours.</p>${unsubFooter(l.email)}</div>`
  }),
  dfy_pathway_selected: (l) => ({
    subject: `✅ Done-For-You pathway confirmed — next steps`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#3b82f6;">Welcome aboard, ${l.business_name || 'there'}!</h2><p>You've selected Done-For-You. Our specialists will handle everything. Expect a call within 24 hours.</p><p style="margin:24px 0;"><a href="https://localrank.ai/Checkout?lead_id=${l.id}&pathway=2" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Book Strategy Call →</a></p>${unsubFooter(l.email)}</div>`
  }),
  diy_pathway_selected: (l) => ({
    subject: `✅ DIY pathway confirmed — your access is ready`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#22c55e;">You're all set, ${l.business_name || 'there'}!</h2><p>Your DIY program is ready. Step-by-step guides, AI templates, monthly calls, and email support.</p><p style="margin:24px 0;"><a href="https://localrank.ai/Checkout?lead_id=${l.id}&pathway=3" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Start DIY Program →</a></p>${unsubFooter(l.email)}</div>`
  }),
  checkout_abandoned_1h: (l) => ({
    subject: `🛒 ${l.business_name}, you left something behind`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#7c3aed;">Still thinking?</h2><p>Your spot is still reserved. 30-day money-back guarantee. Complete your order now.</p><p style="margin:24px 0;"><a href="https://localrank.ai/Checkout" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Complete My Order →</a></p>${unsubFooter(l.email)}</div>`
  }),
  checkout_abandoned_24h: (l) => ({
    subject: `⚠️ Last chance — your discount expires today`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#dc2626;">Final reminder, ${l.business_name || 'there'}</h2><p>Your exclusive discount expires today. Don't let competitors take your ranking.</p><p style="margin:24px 0;"><a href="https://localrank.ai/Checkout" style="background:#dc2626;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Claim My Discount →</a></p>${unsubFooter(l.email)}</div>`
  }),
  post_purchase_day1: (l) => ({
    subject: `🎉 ${l.business_name}, you're in — here's what happens next`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#22c55e;">Welcome to LocalRank!</h2><p>Your order is confirmed. Our team begins optimization within 24 hours.</p><p style="margin:24px 0;"><a href="https://localrank.ai/ClientDashboard" style="background:#c8ff00;color:#0a0a0f;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Access Dashboard →</a></p>${unsubFooter(l.email)}</div>`
  })
};

function unsubFooter(email) {
  return `<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:12px;margin:0;"><a href="https://localrank.ai/unsubscribe?email=${encodeURIComponent(email || '')}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>&nbsp;·&nbsp;<a href="mailto:support@localrank.ai" style="color:#9ca3af;text-decoration:underline;">Contact Support</a></p></div>`;
}

function interpolate(str, vars) {
  if (!str) return '';
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

// DB-first template loader, hardcoded fallback
async function loadTemplate(base44, templateKey, lead) {
  try {
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
      template_key: templateKey,
      status: 'active'
    }, '-version', 1);
    if (templates.length > 0) {
      const t = templates[0];
      const vars = { business_name: lead.business_name || 'there', health_score: lead.health_score || '', lead_id: lead.id, email: lead.email };
      return { subject: interpolate(t.subject_line, vars), html: interpolate(t.body_html, vars) };
    }
  } catch (e) {
    console.warn(`DB template load failed for ${templateKey}:`, e.message);
  }
  const fallback = FALLBACK_TEMPLATES[templateKey];
  return fallback ? fallback(lead) : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const nurtures = await base44.asServiceRole.entities.LeadNurture.filter(
      { status: 'active' }, 'next_email_date', 50
    );

    const now = new Date();
    const processed = [];
    const failed = [];
    const skipped = [];

    for (const nurture of nurtures) {
      if (!nurture.next_email_date || new Date(nurture.next_email_date) > now) {
        skipped.push(nurture.id);
        continue;
      }
      if (!nurture.email || !nurture.lead_id) {
        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, { status: 'completed' }).catch(() => {});
        continue;
      }

      let rawKey = nurture.sequence_name || '';
      if (rawKey.startsWith('geenius_')) rawKey = rawKey.slice('geenius_'.length);
      const sequence_key = LEGACY_SEQUENCE_MAP[rawKey] || rawKey;

      try {
        const leads = await base44.asServiceRole.entities.Lead.filter({ id: nurture.lead_id });
        const lead = leads[0];

        if (!lead) {
          await base44.asServiceRole.entities.LeadNurture.update(nurture.id, { status: 'completed' }).catch(() => {});
          continue;
        }

        const emailData = await loadTemplate(base44, sequence_key, lead);

        if (!emailData) {
          console.warn(`No template found for "${sequence_key}" — completing nurture ${nurture.id}`);
          await base44.asServiceRole.entities.LeadNurture.update(nurture.id, { status: 'completed' }).catch(() => {});
          continue;
        }

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: VERIFIED_FROM,
            to: nurture.email,
            subject: emailData.subject,
            html: emailData.html,
            tags: [{ name: 'sequence', value: sequence_key }, { name: 'funnel', value: 'geenius' }]
          })
        });

        if (!resendRes.ok) throw new Error(`Resend error ${resendRes.status}: ${await resendRes.text()}`);
        const resendData = await resendRes.json();

        const stage = STAGE_MAP[sequence_key] || sequence_key;

        // Write structured EmailLog
        await base44.asServiceRole.entities.EmailLog.create({
          to: nurture.email,
          from: VERIFIED_FROM,
          subject: emailData.subject,
          type: 'nurture',
          status: 'sent',
          template_key: sequence_key,
          workflow_type: 'geenius_quiz',
          stage,
          provider_id: resendData.id,
          sent_at: now.toISOString(),
          metadata: { lead_id: nurture.lead_id, nurture_id: nurture.id, resend_id: resendData.id, funnel: 'geenius' }
        }).catch(() => {});

        // Update lead workflow_stage
        base44.asServiceRole.entities.Lead.update(nurture.lead_id, { workflow_stage: stage }).catch(() => {});

        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, {
          status: 'completed',
          emails_sent: (nurture.emails_sent || 0) + 1,
          last_email_date: now.toISOString()
        });

        processed.push({ lead_id: nurture.lead_id, email: nurture.email, sequence: sequence_key });
        console.log(`✅ Sent ${sequence_key} → ${nurture.email} (stage: ${stage})`);

      } catch (error) {
        console.error(`❌ Failed ${sequence_key} → ${nurture.email}:`, error.message);
        failed.push({ lead_id: nurture.lead_id, email: nurture.email, sequence: sequence_key, error: error.message });
        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, {
          status: 'paused',
          last_email_date: now.toISOString()
        }).catch(() => {});
      }
    }

    console.log(`processScheduledEmails: processed=${processed.length} failed=${failed.length} skipped=${skipped.length}`);
    return Response.json({ success: true, processed: processed.length, failed: failed.length, skipped: skipped.length, details: { processed, failed } });

  } catch (error) {
    console.error('processScheduledEmails error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});