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
    const { lead_id } = body;

    if (!lead_id) {
      return Response.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    let score = 0;
    const factors = [];

    // Health Score Factor (0-30 points)
    if (lead.health_score !== undefined) {
      const healthPoints = Math.round((lead.health_score / 100) * 30);
      score += healthPoints;
      factors.push({ factor: 'GMB Health Score', points: healthPoints, max: 30 });
    }

    // Business Category (0-15 points)
    const highValueCategories = ['medical', 'professional', 'home_services'];
    if (highValueCategories.includes(lead.business_category)) {
      score += 15;
      factors.push({ factor: 'High-Value Category', points: 15, max: 15 });
    } else if (lead.business_category) {
      score += 8;
      factors.push({ factor: 'Standard Category', points: 8, max: 15 });
    }

    // Timeline Urgency (0-20 points)
    const timelinePoints = {
      urgent: 20,
      '30_days': 15,
      '60_days': 10,
      planning: 5
    };
    const timelineScore = timelinePoints[lead.timeline] || 0;
    score += timelineScore;
    factors.push({ factor: 'Timeline Urgency', points: timelineScore, max: 20 });

    // Reviews & Rating (0-15 points)
    if (lead.gmb_rating && lead.gmb_reviews_count) {
      const ratingPoints = Math.round((lead.gmb_rating / 5) * 10);
      const reviewPoints = lead.gmb_reviews_count > 50 ? 5 : lead.gmb_reviews_count > 20 ? 3 : 1;
      const reviewScore = ratingPoints + reviewPoints;
      score += reviewScore;
      factors.push({ factor: 'Reviews & Rating', points: reviewScore, max: 15 });
    }

    // Engagement (0-20 points)
    const userBehavior = await base44.asServiceRole.entities.UserBehavior.filter({ 
      email: lead.email 
    });
    
    if (userBehavior.length > 0) {
      const behavior = userBehavior[0];
      const engagementScore = Math.min(20, Math.round((behavior.engagement_score || 0) / 5));
      score += engagementScore;
      factors.push({ factor: 'User Engagement', points: engagementScore, max: 20 });
    }

    // Normalize to 0-100
    score = Math.min(100, score);

    // Determine grade
    let grade = 'D';
    if (score >= 80) grade = 'A';
    else if (score >= 60) grade = 'B';
    else if (score >= 40) grade = 'C';

    // Update lead with score
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      lead_score: score,
      lead_grade: grade,
      score_calculated_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      lead_id,
      score,
      grade,
      factors
    });

  } catch (error) {
    console.error('Calculate lead score error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to calculate lead score',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'calculateLeadScore' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to calculate lead score',
      details: error.message 
    }, { status: 500 });
  }
});