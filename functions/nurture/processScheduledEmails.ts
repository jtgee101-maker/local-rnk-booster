import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Runs every 5 minutes to process scheduled emails
 * Checks for leads that need emails sent based on timing
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active leads with pending nurture sequences
    const nurtures = await base44.entities.LeadNurture.filter({
      status: 'active'
    });

    const now = Date.now();
    const processed = [];
    const failed = [];

    for (const nurture of nurtures) {
      const lead = await base44.entities.Lead.filter({ id: nurture.lead_id }).then(r => r[0]);

      if (!lead) continue;

      const lastEmailTime = nurture.last_email_date ? new Date(nurture.last_email_date).getTime() : 0;
      const timeSinceLastEmail = now - lastEmailTime;

      // Define intervals between emails (in milliseconds)
      const intervals = {
        audit_submitted: 0,
        pathway_selection_nudge_2h: 7200000,
        pathway_selection_urgent_12h: 43200000,
        checkout_abandoned_1h: 3600000,
        checkout_abandoned_24h: 86400000,
        post_purchase_day1: 0
      };

      // Check which email should be sent based on sequence
      let sequence_key = null;
      let should_send = false;

      if (nurture.sequence_name === 'geenius_audit' && nurture.current_step === 0) {
        sequence_key = 'audit_submitted';
        should_send = timeSinceLastEmail >= intervals.audit_submitted;
      } else if (nurture.sequence_name === 'geenius_pathway_selection' && nurture.current_step === 1) {
        sequence_key = 'pathway_selection_nudge_2h';
        should_send = timeSinceLastEmail >= intervals.pathway_selection_nudge_2h;
      } else if (nurture.sequence_name === 'geenius_pathway_selection' && nurture.current_step === 2) {
        sequence_key = 'pathway_selection_urgent_12h';
        should_send = timeSinceLastEmail >= intervals.pathway_selection_urgent_12h;
      } else if (nurture.sequence_name === 'geenius_checkout_abandoned' && nurture.current_step === 1) {
        sequence_key = 'checkout_abandoned_1h';
        should_send = timeSinceLastEmail >= intervals.checkout_abandoned_1h;
      } else if (nurture.sequence_name === 'geenius_checkout_abandoned' && nurture.current_step === 2) {
        sequence_key = 'checkout_abandoned_24h';
        should_send = timeSinceLastEmail >= intervals.checkout_abandoned_24h;
      } else if (nurture.sequence_name === 'geenius_post_purchase' && nurture.current_step === 0) {
        sequence_key = 'post_purchase_day1';
        should_send = timeSinceLastEmail >= intervals.post_purchase_day1;
      }

      if (should_send && sequence_key) {
        try {
          // Send email via sequence function
          const result = await base44.functions.invoke('nurture/geeniusEmailSequences', {
            lead_id: nurture.lead_id,
            sequence_key
          });

          // Update nurture record
          await base44.entities.LeadNurture.update(nurture.id, {
            current_step: nurture.current_step + 1,
            emails_sent: (nurture.emails_sent || 0) + 1,
            last_email_date: new Date().toISOString()
          });

          processed.push({
            lead_id: nurture.lead_id,
            sequence: sequence_key,
            status: 'sent'
          });
        } catch (error) {
          failed.push({
            lead_id: nurture.lead_id,
            sequence: sequence_key,
            error: error.message
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processed.length,
        failed: failed.length,
        details: { processed, failed }
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});