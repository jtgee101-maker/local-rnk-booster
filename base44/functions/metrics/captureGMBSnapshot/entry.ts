import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Capture GMB Metrics Snapshot
 * Records historical GMB data for tracking progress over time
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id' }, { status: 400 });
    }

    // Fetch lead with current GMB data
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get previous snapshot for comparison
    const previousSnapshots = await base44.asServiceRole.entities.GMBMetricsHistory.filter(
      { lead_id },
      '-snapshot_date',
      1
    );

    const improvements = [];
    if (previousSnapshots.length > 0) {
      const prev = previousSnapshots[0].metrics;
      const curr = {
        health_score: lead.health_score || 0,
        gmb_rating: lead.gmb_rating || 0,
        reviews_count: lead.gmb_reviews_count || 0,
        photos_count: lead.gmb_photos_count || 0
      };

      if (curr.health_score > prev.health_score) {
        improvements.push(`Health score improved from ${prev.health_score} to ${curr.health_score}`);
      }
      if (curr.reviews_count > prev.reviews_count) {
        improvements.push(`Gained ${curr.reviews_count - prev.reviews_count} new reviews`);
      }
      if (curr.photos_count > prev.photos_count) {
        improvements.push(`Added ${curr.photos_count - prev.photos_count} new photos`);
      }
    }

    // Create snapshot
    const snapshot = await base44.asServiceRole.entities.GMBMetricsHistory.create({
      lead_id,
      business_name: lead.business_name,
      snapshot_date: new Date().toISOString(),
      metrics: {
        health_score: lead.health_score || 0,
        gmb_rating: lead.gmb_rating || 0,
        reviews_count: lead.gmb_reviews_count || 0,
        photos_count: lead.gmb_photos_count || 0,
        ranking_position: null, // To be updated with actual ranking data
        profile_views: null,
        search_appearances: null,
        direction_requests: null,
        phone_calls: null
      },
      improvements
    });

    return Response.json({ 
      success: true,
      snapshot_id: snapshot.id,
      improvements_count: improvements.length
    });

  } catch (error) {
    console.error('Error capturing GMB snapshot:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});