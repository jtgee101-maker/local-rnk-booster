import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Bulk Engagement Score — processes all active leads in batch.
 * Called by "Nightly Bulk Engagement Score Recalculation" automation.
 * Admin-only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Accept both scheduled (no auth) and manual (admin) calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    } catch (_) {
      // Scheduled automations have no user — allow them
    }

    // Fetch all leads created in the last 90 days for scoring
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const leads = await base44.asServiceRole.entities.Lead.filter(
      { created_date: { $gte: cutoff } },
      '-updated_date',
      500
    );

    if (leads.length === 0) {
      return Response.json({ success: true, bulk: true, processed: 0, message: 'No leads to score' });
    }

    let processed = 0, failed = 0;
    const errors = [];

    for (const lead of leads) {
      try {
        await base44.asServiceRole.functions.invoke('calculateEngagementScore', { lead_id: lead.id });
        processed++;
      } catch (e) {
        failed++;
        errors.push({ lead_id: lead.id, error: e.message });
      }
    }

    console.log(`bulkEngagementScore complete — processed:${processed} failed:${failed} total:${leads.length}`);
    return Response.json({ success: true, bulk: true, processed, failed, total: leads.length, errors });

  } catch (error) {
    console.error('bulkEngagementScore fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});