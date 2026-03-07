import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Auto-segment all leads into dynamic segments based on criteria.
 * Admin-only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [allLeads, segments] = await Promise.all([
      base44.asServiceRole.entities.Lead.list('-created_date', 1000),
      base44.asServiceRole.entities.Segment.list()
    ]);

    const dynamicSegments = segments.filter(s => s.type === 'dynamic' && s.is_active !== false);
    const segmentUpdates = [];

    for (const segment of dynamicSegments) {
      const criteria = segment.criteria || {};
      const matchingLeads = allLeads.filter(lead => {
        if (criteria.min_health_score && (lead.health_score || 0) < criteria.min_health_score) return false;
        if (criteria.max_health_score && (lead.health_score || 0) > criteria.max_health_score) return false;
        if (criteria.status && !criteria.status.includes(lead.status)) return false;
        if (criteria.business_category && !criteria.business_category.includes(lead.business_category)) return false;
        if (criteria.timeline && !criteria.timeline.includes(lead.timeline)) return false;
        if (criteria.min_lead_score && (lead.lead_score || 0) < criteria.min_lead_score) return false;
        return true;
      }).map(l => l.id);

      await base44.asServiceRole.entities.Segment.update(segment.id, {
        lead_ids: matchingLeads,
        member_count: matchingLeads.length,
        last_updated: new Date().toISOString()
      });

      segmentUpdates.push({ segment_name: segment.name, member_count: matchingLeads.length });
    }

    return Response.json({ success: true, segments_updated: segmentUpdates.length, updates: segmentUpdates });

  } catch (error) {
    console.error('autoSegmentLeads error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});