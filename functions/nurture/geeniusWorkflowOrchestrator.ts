import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Orchestrates all GeeNius email workflows based on lead conversion status
 * Triggers sequences, manages intervals, and respects conversion toggles
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { event, data } = await req.json();

    // Handle lead creation - send audit_submitted email immediately
    if (event === 'lead_created') {
      const { lead_id } = data;
      const lead = await base44.entities.Lead.filter({ id: lead_id }).then(r => r[0]);

      if (lead && lead.email) {
        // Send audit confirmation email
        await base44.functions.invoke('nurture/geeniusEmailSequences', {
          lead_id,
          sequence_key: 'audit_submitted'
        }).catch(e => console.error('Failed to send audit_submitted:', e));

        // Schedule pathway selection nudge (2 hours later)
        scheduleEmail(lead_id, 'pathway_selection_nudge_2h', 2 * 60 * 60 * 1000);

        // Schedule urgent reminder (12 hours later)
        scheduleEmail(lead_id, 'pathway_selection_urgent_12h', 12 * 60 * 60 * 1000);
      }

      return new Response(JSON.stringify({ success: true, event: 'lead_created_workflow_started' }), { status: 200 });
    }

    // Handle lead status change - triggered by conversion toggle
    if (event === 'lead_converted') {
      const { lead_id, pathway } = data;
      const lead = await base44.entities.Lead.filter({ id: lead_id }).then(r => r[0]);

      if (lead && lead.email) {
        let sequence_key;

        // Trigger based on selected pathway
        if (pathway === 1) {
          sequence_key = 'grant_pathway_selected';
        } else if (pathway === 2) {
          sequence_key = 'dfy_pathway_selected';
        } else if (pathway === 3) {
          sequence_key = 'diy_pathway_selected';
        }

        if (sequence_key) {
          await base44.functions.invoke('nurture/geeniusEmailSequences', {
            lead_id,
            sequence_key
          }).catch(e => console.error(`Failed to send ${sequence_key}:`, e));

          // Schedule checkout follow-up
          scheduleEmail(lead_id, 'checkout_abandoned_1h', 1 * 60 * 60 * 1000);
          scheduleEmail(lead_id, 'checkout_abandoned_24h', 24 * 60 * 60 * 1000);
        }
      }

      return new Response(JSON.stringify({ success: true, event: 'lead_converted_workflow_started' }), { status: 200 });
    }

    // Handle post-purchase
    if (event === 'order_completed') {
      const { lead_id } = data;
      const lead = await base44.entities.Lead.filter({ id: lead_id }).then(r => r[0]);

      if (lead && lead.email) {
        // Send welcome email immediately
        await base44.functions.invoke('nurture/geeniusEmailSequences', {
          lead_id,
          sequence_key: 'post_purchase_day1'
        }).catch(e => console.error('Failed to send post_purchase_day1:', e));
      }

      return new Response(JSON.stringify({ success: true, event: 'order_completed_workflow_started' }), { status: 200 });
    }

    // Handle checkout abandonment
    if (event === 'checkout_abandoned') {
      const { lead_id } = data;

      // Schedule abandoned cart emails
      scheduleEmail(lead_id, 'checkout_abandoned_1h', 1 * 60 * 60 * 1000);
      scheduleEmail(lead_id, 'checkout_abandoned_24h', 24 * 60 * 60 * 1000);

      return new Response(JSON.stringify({ success: true, event: 'checkout_abandoned_workflow_started' }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid event' }), { status: 400 });
  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// Helper to schedule email with delay
async function scheduleEmail(lead_id, sequence_key, delay_ms) {
  const delay_seconds = Math.floor(delay_ms / 1000);

  try {
    // In a real implementation, you'd use a task queue or scheduled automation
    // For now, we'll create a simple scheduling record that can be processed by a cron job
    console.log(`Scheduled email: ${sequence_key} for lead ${lead_id} in ${delay_seconds}s`);
    
    // TODO: Implement persistent scheduling via AppSettings or dedicated ScheduledTask entity
    return true;
  } catch (error) {
    console.error(`Failed to schedule ${sequence_key}:`, error);
    return false;
  }
}