import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Runs every 5 minutes via scheduled automation to process due email sequences.
 * Processes in batches to handle scale.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch active nurtures in batches of 50 to prevent timeouts at scale
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

      // Extract sequence key
      const sequence_key = nurture.metadata?.sequence_key || nurture.sequence_name?.replace('geenius_', '');

      if (!sequence_key || !nurture.lead_id) {
        console.warn(`Skipping nurture ${nurture.id}: missing sequence_key or lead_id`);
        // Mark as completed to avoid infinite retry loop
        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, { status: 'completed' }).catch(() => {});
        continue;
      }

      try {
        await base44.asServiceRole.functions.invoke('nurture/geeniusEmailSequences', {
          lead_id: nurture.lead_id,
          sequence_key
        });

        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, {
          status: 'completed',
          emails_sent: (nurture.emails_sent || 0) + 1,
          last_email_date: new Date().toISOString()
        });

        processed.push({ lead_id: nurture.lead_id, email: nurture.email, sequence: sequence_key });
        console.log(`✅ Sent ${sequence_key} to ${nurture.email}`);

      } catch (error) {
        console.error(`❌ Failed ${sequence_key} to ${nurture.email}:`, error.message);

        failed.push({ lead_id: nurture.lead_id, email: nurture.email, sequence: sequence_key, error: error.message });

        // Mark as paused after failure so it doesn't retry in a loop
        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, { 
          status: 'paused',
          last_email_date: new Date().toISOString()
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