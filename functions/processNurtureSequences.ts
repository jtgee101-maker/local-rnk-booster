import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find all active nurture sequences that are due
    const now = new Date().toISOString();
    const sequences = await base44.asServiceRole.entities.LeadNurture.filter({
      status: 'active'
    });

    const dueSequences = sequences.filter(seq => 
      seq.next_email_date && new Date(seq.next_email_date) <= new Date()
    );

    console.log(`Found ${dueSequences.length} sequences to process`);

    const results = [];

    for (const sequence of dueSequences) {
      try {
        const nextStep = sequence.current_step + 1;

        if (nextStep > sequence.total_steps) {
          // Mark sequence as completed
          await base44.asServiceRole.entities.LeadNurture.update(sequence.id, {
            status: 'completed'
          });
          console.log(`Completed sequence for lead ${sequence.lead_id}`);
          continue;
        }

        // Get lead data for personalization
        const lead = await base44.asServiceRole.entities.Lead.get(sequence.lead_id);
        
        if (!lead) {
          console.error(`Lead not found: ${sequence.lead_id}`);
          continue;
        }

        const auditData = {
          health_score: lead.health_score || 50,
          revenue_leak: Math.round((lead.gmb_rating || 3.5) < 4.5 ? 2847 : 1500),
          annual_leak: Math.round((lead.gmb_rating || 3.5) < 4.5 ? 2847 * 12 : 1500 * 12),
          critical_issues: lead.critical_issues || [],
          business_category: lead.business_category,
          pain_point: lead.pain_point,
          business_name: lead.business_name
        };

        // Send the next email
        await base44.asServiceRole.functions.invoke('sendFoxyNurtureEmail', {
          leadId: sequence.lead_id,
          step: nextStep,
          auditData
        });

        // Update sequence
        const nextEmailDate = new Date();
        nextEmailDate.setDate(nextEmailDate.getDate() + 2); // 2 days between emails

        await base44.asServiceRole.entities.LeadNurture.update(sequence.id, {
          current_step: nextStep,
          next_email_date: nextEmailDate.toISOString(),
          emails_sent: (sequence.emails_sent || 0) + 1,
          last_email_date: now
        });

        results.push({ lead_id: sequence.lead_id, step: nextStep, status: 'sent' });
        console.log(`Sent email step ${nextStep} to ${lead.email}`);

      } catch (error) {
        console.error(`Error processing sequence ${sequence.id}:`, error);
        results.push({ lead_id: sequence.lead_id, status: 'error', error: error.message });
      }
    }

    return Response.json({ 
      success: true, 
      processed: results.length,
      results 
    });

  } catch (error) {
    console.error('Nurture processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));