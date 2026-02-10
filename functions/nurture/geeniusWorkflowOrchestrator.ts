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
    if (event?.type === 'create' && event?.entity_name === 'Lead') {
      const lead_id = event.entity_id || data?.id;
      const lead = data || await base44.asServiceRole.entities.Lead.filter({ id: lead_id }).then(r => r[0]);

      if (lead && lead.email) {
        // Send audit confirmation email immediately
        await base44.asServiceRole.functions.invoke('nurture/geeniusEmailSequences', {
          lead_id,
          sequence_key: 'audit_submitted'
        }).catch(e => console.error('Failed to send audit_submitted:', e));

        // Create scheduled email records in LeadNurture entity
        await scheduleEmail(base44, lead, 'pathway_selection_nudge_2h', 2);
        await scheduleEmail(base44, lead, 'pathway_selection_urgent_12h', 12);
      }

      return new Response(JSON.stringify({ success: true, event: 'lead_created_workflow_started' }), { status: 200 });
    }

    // Handle lead status change - triggered by conversion toggle or pathway selection
    if (event?.type === 'update' && event?.entity_name === 'Lead') {
      const lead_id = event.entity_id || data?.id;
      const lead = data || await base44.asServiceRole.entities.Lead.filter({ id: lead_id }).then(r => r[0]);

      // Check if admin_notes contains pathway selection trigger
      if (lead && lead.email && lead.admin_notes) {
        let sequence_key;
        let pathway;

        // Parse pathway from admin_notes (e.g., "Selected Pathway 1 - Grant")
        if (lead.admin_notes.includes('Pathway 1') || lead.admin_notes.includes('Grant')) {
          sequence_key = 'grant_pathway_selected';
          pathway = 1;
        } else if (lead.admin_notes.includes('Pathway 2') || lead.admin_notes.includes('Done For You') || lead.admin_notes.includes('DFY')) {
          sequence_key = 'dfy_pathway_selected';
          pathway = 2;
        } else if (lead.admin_notes.includes('Pathway 3') || lead.admin_notes.includes('DIY')) {
          sequence_key = 'diy_pathway_selected';
          pathway = 3;
        }

        if (sequence_key) {
          await base44.asServiceRole.functions.invoke('nurture/geeniusEmailSequences', {
            lead_id,
            sequence_key
          }).catch(e => console.error(`Failed to send ${sequence_key}:`, e));

          // Schedule checkout abandoned emails
          await scheduleEmail(base44, lead, 'checkout_abandoned_1h', 1);
          await scheduleEmail(base44, lead, 'checkout_abandoned_24h', 24);
        }
      }

      return new Response(JSON.stringify({ success: true, event: 'lead_updated_workflow_processed' }), { status: 200 });
    }

    // Handle post-purchase (Order entity creation)
    if (event?.type === 'create' && event?.entity_name === 'Order') {
      const order = data;
      
      if (order && order.email) {
        // Find the lead by email
        const leads = await base44.asServiceRole.entities.Lead.filter({ email: order.email });
        const lead = leads[0];

        if (lead) {
          // Send welcome email immediately
          await base44.asServiceRole.functions.invoke('nurture/geeniusEmailSequences', {
            lead_id: lead.id,
            sequence_key: 'post_purchase_day1'
          }).catch(e => console.error('Failed to send post_purchase_day1:', e));
        }
      }

      return new Response(JSON.stringify({ success: true, event: 'order_completed_workflow_started' }), { status: 200 });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid event structure',
      received: { event, data_keys: data ? Object.keys(data) : [] }
    }), { status: 400 });
  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// Helper to schedule email with delay using LeadNurture entity
async function scheduleEmail(base44, lead, sequence_key, delay_hours) {
  try {
    const next_email_date = new Date(Date.now() + delay_hours * 60 * 60 * 1000).toISOString();

    // Check if nurture record already exists
    const existing = await base44.asServiceRole.entities.LeadNurture.filter({
      lead_id: lead.id,
      sequence_name: `geenius_${sequence_key}`
    });

    if (existing.length === 0) {
      // Create new nurture record
      await base44.asServiceRole.entities.LeadNurture.create({
        lead_id: lead.id,
        email: lead.email,
        sequence_name: `geenius_${sequence_key}`,
        current_step: 0,
        total_steps: 1,
        status: 'active',
        next_email_date,
        metadata: {
          sequence_key,
          delay_hours,
          scheduled_at: new Date().toISOString()
        }
      });
      
      console.log(`Scheduled email: ${sequence_key} for lead ${lead.id} at ${next_email_date}`);
    } else {
      console.log(`Nurture record already exists for ${sequence_key}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to schedule ${sequence_key}:`, error);
    return false;
  }
}