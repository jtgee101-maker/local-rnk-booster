import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Calculate a lead quality score (0-100) and grade.
 * Admin-only. Updates the lead record with score + grade.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id } = await req.json();
    if (!lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    let score = 0;
    const factors = [];

    // Health Score (0-30 pts)
    if (lead.health_score !== undefined) {
      const pts = Math.round((lead.health_score / 100) * 30);
      score += pts;
      factors.push({ factor: 'GMB Health Score', points: pts, max: 30 });
    }

    // Business Category (0-15 pts)
    const highValueCategories = ['medical', 'professional', 'home_services'];
    const categoryPts = highValueCategories.includes(lead.business_category) ? 15 : lead.business_category ? 8 : 0;
    score += categoryPts;
    if (categoryPts > 0) factors.push({ factor: 'Business Category', points: categoryPts, max: 15 });

    // Timeline Urgency (0-20 pts)
    const timelinePts = { urgent: 20, '30_days': 15, '60_days': 10, planning: 5 }[lead.timeline] || 0;
    score += timelinePts;
    factors.push({ factor: 'Timeline Urgency', points: timelinePts, max: 20 });

    // Reviews & Rating (0-15 pts)
    if (lead.gmb_rating && lead.gmb_reviews_count) {
      const ratingPts = Math.round((lead.gmb_rating / 5) * 10);
      const reviewPts = lead.gmb_reviews_count > 50 ? 5 : lead.gmb_reviews_count > 20 ? 3 : 1;
      const reviewScore = ratingPts + reviewPts;
      score += reviewScore;
      factors.push({ factor: 'Reviews & Rating', points: reviewScore, max: 15 });
    }

    // Engagement from UserBehavior (0-20 pts)
    try {
      const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ email: lead.email });
      if (behaviors.length > 0) {
        const engagementPts = Math.min(20, Math.round((behaviors[0].engagement_score || 0) / 5));
        score += engagementPts;
        factors.push({ factor: 'User Engagement', points: engagementPts, max: 20 });
      }
    } catch (_) { /* UserBehavior optional */ }

    score = Math.min(100, score);
    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

    await base44.asServiceRole.entities.Lead.update(lead_id, { lead_score: score, lead_grade: grade });

    // Trigger hot lead notification check (fire-and-forget)
    base44.asServiceRole.functions.invoke('notifyAdminHotLead', { lead_id }).catch(e => console.warn('hot lead check skipped:', e.message));

    return Response.json({ success: true, lead_id, score, grade, factors });

  } catch (error) {
    console.error('calculateLeadScore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});