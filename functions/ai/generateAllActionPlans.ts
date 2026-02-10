import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate Action Plans for All Leads Missing One
 * Admin function - runs on demand
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all leads
    const allLeads = await base44.asServiceRole.entities.Lead.list();
    
    // Check which leads already have action plans
    const existingPlans = await base44.asServiceRole.entities.ActionPlan.list();
    const leadsWithPlans = new Set(existingPlans.map(p => p.lead_id));
    
    // Filter leads that need action plans
    const leadsNeedingPlans = allLeads.filter(lead => 
      !leadsWithPlans.has(lead.id) && 
      lead.health_score !== null &&
      lead.health_score !== undefined
    );

    console.log(`Found ${leadsNeedingPlans.length} leads needing action plans out of ${allLeads.length} total`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Generate action plan for each lead
    for (const lead of leadsNeedingPlans) {
      try {
        console.log(`Generating action plan for: ${lead.business_name || lead.email}`);
        
        await base44.asServiceRole.functions.invoke('ai/generateActionPlan', {
          lead_id: lead.id
        });
        
        results.success++;
        
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error generating plan for lead ${lead.id}:`, error);
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
      total_leads: allLeads.length,
      leads_needing_plans: leadsNeedingPlans.length,
      plans_generated: results.success,
      failures: results.failed,
      errors: results.errors
    });

  } catch (error) {
    console.error('Error in generateAllActionPlans:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});