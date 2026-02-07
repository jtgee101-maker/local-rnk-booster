import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { lead_ids, filter_status } = body;

    let leadsToScore = [];

    if (lead_ids && lead_ids.length > 0) {
      // Score specific leads
      for (const id of lead_ids) {
        const lead = await base44.asServiceRole.entities.Lead.get(id);
        if (lead) leadsToScore.push(lead);
      }
    } else if (filter_status) {
      // Score leads by status
      leadsToScore = await base44.asServiceRole.entities.Lead.filter({ status: filter_status });
    } else {
      // Score all leads without scores
      const allLeads = await base44.asServiceRole.entities.Lead.list();
      leadsToScore = allLeads.filter(l => !l.lead_score);
    }

    let processed = 0;
    let failed = 0;

    for (const lead of leadsToScore.slice(0, 100)) {
      try {
        await base44.asServiceRole.functions.invoke('scoring/calculateLeadScore', {
          lead_id: lead.id
        });
        processed++;
      } catch (error) {
        console.error(`Failed to score lead ${lead.id}:`, error);
        failed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return Response.json({
      success: true,
      processed,
      failed,
      total: leadsToScore.length,
      message: `Scored ${processed} leads, ${failed} failed`
    });

  } catch (error) {
    console.error('Bulk score leads error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: 'Failed to bulk score leads',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'bulkScoreLeads' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to bulk score leads',
      details: error.message 
    }, { status: 500 });
  }
});