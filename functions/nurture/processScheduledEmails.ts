import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Runs every 5 minutes to process scheduled emails
 * Checks for leads that need emails sent based on timing
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active nurture sequences that are due
    const now = new Date().toISOString();
    const nurtures = await base44.asServiceRole.entities.LeadNurture.filter({
      status: 'active'
    });

    const processed = [];
    const failed = [];

    for (const nurture of nurtures) {
      // Check if email is due based on next_email_date
      if (!nurture.next_email_date || new Date(nurture.next_email_date) > new Date()) {
        continue; // Not due yet
      }

      // Extract sequence_key from metadata or sequence_name
      const sequence_key = nurture.metadata?.sequence_key || nurture.sequence_name?.replace('geenius_', '');

      if (!sequence_key) {
        console.warn(`No sequence_key found for nurture ${nurture.id}`);
        continue;
      }

      try {
        // Send email via sequence function using service role
        const result = await base44.asServiceRole.functions.invoke('nurture/geeniusEmailSequences', {
          lead_id: nurture.lead_id,
          sequence_key
        });

        // Mark nurture as completed after sending
        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, {
          status: 'completed',
          emails_sent: (nurture.emails_sent || 0) + 1,
          last_email_date: new Date().toISOString()
        });

        processed.push({
          lead_id: nurture.lead_id,
          email: nurture.email,
          sequence: sequence_key,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to send ${sequence_key} to ${nurture.email}:`, error);
        
        failed.push({
          lead_id: nurture.lead_id,
          email: nurture.email,
          sequence: sequence_key,
          error: error.message
        });
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