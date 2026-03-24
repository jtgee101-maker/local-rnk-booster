import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Daily nurture email sender for Foxy/legacy nurture sequences.
 * Processes active LeadNurture records and sends the next step.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const sequences = await base44.asServiceRole.entities.LeadNurture.filter({ status: 'active' });
    const dueSequences = sequences.filter(seq =>
      seq.next_email_date && new Date(seq.next_email_date) <= new Date()
    );

    console.log(`processNurtureSequences: ${dueSequences.length} due out of ${sequences.length} active`);

    const results = [];

    for (const sequence of dueSequences) {
      try {
        const nextStep = (sequence.current_step || 0) + 1;

        if (nextStep > (sequence.total_steps || 5)) {
          await base44.asServiceRole.entities.LeadNurture.update(sequence.id, { status: 'completed' });
          continue;
        }

        const leads = await base44.asServiceRole.entities.Lead.filter({ id: sequence.lead_id });
        const lead = leads[0];

        if (!lead) {
          console.warn(`Lead not found for nurture ${sequence.id}, marking completed`);
          await base44.asServiceRole.entities.LeadNurture.update(sequence.id, { status: 'completed' });
          continue;
        }

        const auditData = {
          health_score: lead.health_score || 50,
          revenue_leak: (lead.gmb_rating || 3.5) < 4.5 ? 2847 : 1500,
          annual_leak: (lead.gmb_rating || 3.5) < 4.5 ? 34164 : 18000,
          critical_issues: lead.critical_issues || [],
          business_category: lead.business_category,
          pain_point: lead.pain_point,
          business_name: lead.business_name
        };

        await base44.asServiceRole.functions.invoke('sendFoxyNurtureEmail', {
          leadId: sequence.lead_id,
          step: nextStep,
          auditData
        });

        const nextEmailDate = new Date();
        nextEmailDate.setDate(nextEmailDate.getDate() + 2);

        await base44.asServiceRole.entities.LeadNurture.update(sequence.id, {
          current_step: nextStep,
          next_email_date: nextEmailDate.toISOString(),
          emails_sent: (sequence.emails_sent || 0) + 1,
          last_email_date: new Date().toISOString()
        });

        results.push({ lead_id: sequence.lead_id, step: nextStep, status: 'sent' });

      } catch (error) {
        console.error(`Error processing nurture ${sequence.id}:`, error.message);
        results.push({ lead_id: sequence.lead_id, status: 'error', error: error.message });
      }
    }

    return Response.json({ success: true, processed: results.length, results });

  } catch (error) {
    console.error('processNurtureSequences error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});