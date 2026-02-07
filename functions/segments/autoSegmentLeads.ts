import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allLeads = await base44.asServiceRole.entities.Lead.list();
    const segments = await base44.asServiceRole.entities.Segment.list();

    const segmentUpdates = [];

    for (const segment of segments.filter(s => s.type === 'dynamic' && s.is_active)) {
      const criteria = segment.criteria || {};
      const matchingLeads = [];

      for (const lead of allLeads) {
        let matches = true;

        // Check each criterion
        if (criteria.min_health_score && lead.health_score < criteria.min_health_score) {
          matches = false;
        }
        if (criteria.max_health_score && lead.health_score > criteria.max_health_score) {
          matches = false;
        }
        if (criteria.status && !criteria.status.includes(lead.status)) {
          matches = false;
        }
        if (criteria.business_category && !criteria.business_category.includes(lead.business_category)) {
          matches = false;
        }
        if (criteria.timeline && !criteria.timeline.includes(lead.timeline)) {
          matches = false;
        }
        if (criteria.min_lead_score && (!lead.lead_score || lead.lead_score < criteria.min_lead_score)) {
          matches = false;
        }

        if (matches) {
          matchingLeads.push(lead.id);
        }
      }

      // Update segment
      await base44.asServiceRole.entities.Segment.update(segment.id, {
        lead_ids: matchingLeads,
        member_count: matchingLeads.length,
        last_updated: new Date().toISOString()
      });

      segmentUpdates.push({
        segment_name: segment.name,
        member_count: matchingLeads.length
      });
    }

    return Response.json({
      success: true,
      segments_updated: segmentUpdates.length,
      updates: segmentUpdates
    });

  } catch (error) {
    console.error('Auto segment leads error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to auto-segment leads',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'autoSegmentLeads' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to auto-segment leads',
      details: error.message 
    }, { status: 500 });
  }
});