import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Bulk score all (or filtered) leads. Admin-only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_ids, filter_status } = await req.json();

    let leadsToScore = [];

    if (lead_ids && lead_ids.length > 0) {
      const results = await Promise.all(lead_ids.map(id => 
        base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null)
      ));
      leadsToScore = results.filter(Boolean);
    } else if (filter_status) {
      leadsToScore = await base44.asServiceRole.entities.Lead.filter({ status: filter_status });
    } else {
      // Filtered fetch — only unscored leads, hard cap at 100. No full-table scan.
      leadsToScore = await base44.asServiceRole.entities.Lead.filter(
        { lead_score: null },
        '-created_date',
        100
      );
    }

    let processed = 0;
    let failed = 0;

    for (const lead of leadsToScore.slice(0, 100)) {
      try {
        await base44.asServiceRole.functions.invoke('scoring/calculateLeadScore', { lead_id: lead.id });
        processed++;
      } catch (error) {
        console.error(`Failed to score lead ${lead.id}:`, error.message);
        failed++;
      }
    }

    return Response.json({ success: true, processed, failed, total: leadsToScore.length });

  } catch (error) {
    console.error('bulkScoreLeads error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});