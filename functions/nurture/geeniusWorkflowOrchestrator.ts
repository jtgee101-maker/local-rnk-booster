import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Orchestrates all GeeNius email workflows based on lead/order events.
 * Wired via entity automations:
 *   - Lead create → sends audit_submitted + schedules 2h + 12h nudges
 *   - Lead update → checks for pathway selection in admin_notes
 *   - Order create → sends post_purchase_day1
 */

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
        // Send immediate confirmation (fire and forget)
        base44.asServiceRole.functions.invoke('nurture/geeniusEmailSequences', {
          lead_id: lead.id || lead_id,
          sequence_key: 'audit_submitted'
        }).catch(e => console.error('audit_submitted send failed:', e));

        // Schedule follow-up nudges
        await scheduleEmail(base44, { id: lead.id || lead_id, email: lead.email }, 'pathway_selection_nudge_2h', 2);
        await scheduleEmail(base44, { id: lead.id || lead_id, email: lead.email }, 'pathway_selection_urgent_12h', 12);
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
          base44.asServiceRole.functions.invoke('nurture/geeniusEmailSequences', {
            lead_id: lead.id || lead_id,
            sequence_key
          }).catch(e => console.error(`${sequence_key} send failed:`, e));

          // Schedule abandoned checkout follow-ups
          await scheduleEmail(base44, { id: lead.id || lead_id, email: lead.email }, 'checkout_abandoned_1h', 1);
          await scheduleEmail(base44, { id: lead.id || lead_id, email: lead.email }, 'checkout_abandoned_24h', 24);
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
          base44.asServiceRole.functions.invoke('nurture/geeniusEmailSequences', {
            lead_id: lead.id,
            sequence_key: 'post_purchase_day1'
          }).catch(e => console.error('post_purchase_day1 send failed:', e));
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