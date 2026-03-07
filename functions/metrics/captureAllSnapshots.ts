import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Capture GMB Snapshots for All Converted Leads
 * Scheduled automation - runs weekly to track progress
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all converted leads
    const convertedLeads = await base44.asServiceRole.entities.Lead.filter({ 
      status: 'converted' 
    });

    console.log(`Found ${convertedLeads.length} converted leads to capture snapshots`);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Capture snapshot for each lead
    for (const lead of convertedLeads) {
      try {
        await base44.asServiceRole.functions.invoke('metrics/captureGMBSnapshot', {
          lead_id: lead.id
        });
        results.success++;
      } catch (error) {
        console.error(`Error capturing snapshot for lead ${lead.id}:`, error);
        results.failed++;
        results.errors.push({
          lead_id: lead.id,
          business_name: lead.business_name,
          error: error.message
        });
      }
    }

    return Response.json({ 
      success: true,
      total_leads: convertedLeads.length,
      snapshots_captured: results.success,
      failures: results.failed,
      errors: results.errors
    });

  } catch (error) {
    console.error('Error in captureAllSnapshots:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});