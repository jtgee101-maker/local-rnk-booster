import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    // Fetch lead data
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    // Fetch behavior data
    const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ 
      email: lead.email 
    });
    const behavior = behaviors.length > 0 ? behaviors[0] : null;

    // Fetch conversion events
    const events = await base44.asServiceRole.entities.ConversionEvent.filter({ 
      lead_id: lead_id 
    });

    // Calculate score components
    const scores = {
      // Health Score (0-30 points)
      health_score: Math.min(30, Math.round((lead.health_score || 0) / 100 * 30)),
      
      // Engagement Score (0-25 points)
      engagement: calculateEngagementScore(behavior),
      
      // Completion Score (0-20 points)
      completion: calculateCompletionScore(lead, behavior, events),
      
      // Business Quality (0-15 points)
      business_quality: calculateBusinessQuality(lead),
      
      // Traffic Quality (0-10 points)
      traffic_quality: calculateTrafficQuality(behavior),
      
      // Total (0-100)
      total: 0
    };

    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0) - scores.total;

    // Determine lead grade
    const grade = getLeadGrade(scores.total);
    
    // Get recommended pathway
    const recommendation = getPathwayRecommendation(scores, lead, behavior);

    // Store the score
    try {
      const existingScores = await base44.asServiceRole.entities.ConversionEvent.filter({
        lead_id: lead_id,
        event_name: 'lead_scored'
      });

      if (existingScores.length === 0) {
        await base44.asServiceRole.entities.ConversionEvent.create({
          funnel_version: 'geenius',
          event_name: 'lead_scored',
          lead_id: lead_id,
          properties: {
            score: scores.total,
            grade: grade,
            breakdown: scores,
            recommendation: recommendation,
            scored_at: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      console.error('Failed to store score:', err);
    }

    return Response.json({
      success: true,
      lead_id: lead_id,
      score: scores.total,
      grade: grade,
      breakdown: scores,
      recommendation: recommendation,
      insights: generateInsights(scores, lead, behavior)
    });

  } catch (error) {
    console.error('Lead scoring error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}));

function calculateEngagementScore(behavior) {
  if (!behavior) return 0;
  
  let score = 0;
  
  // Time on page (0-10 points)
  const timeOnPage = behavior.time_on_page || 0;
  if (timeOnPage > 180) score += 10;
  else if (timeOnPage > 120) score += 7;
  else if (timeOnPage > 60) score += 5;
  else if (timeOnPage > 30) score += 3;
  
  // Scroll depth (0-8 points)
  const scrollDepth = behavior.scroll_depth || 0;
  if (scrollDepth > 80) score += 8;
  else if (scrollDepth > 60) score += 6;
  else if (scrollDepth > 40) score += 4;
  else if (scrollDepth > 20) score += 2;
  
  // Click count (0-7 points)
  const clicks = behavior.click_count || 0;
  if (clicks > 20) score += 7;
  else if (clicks > 15) score += 5;
  else if (clicks > 10) score += 3;
  else if (clicks > 5) score += 1;
  
  return Math.min(25, score);
}

function calculateCompletionScore(lead, behavior, events) {
  let score = 0;
  
  // Quiz completion (0-10 points)
  if (behavior?.quiz_completion === 100) score += 10;
  else if (behavior?.quiz_completion > 75) score += 7;
  else if (behavior?.quiz_completion > 50) score += 5;
  
  // Email captured (5 points)
  if (lead.email) score += 5;
  
  // Phone captured (5 points)
  if (lead.phone) score += 5;
  
  return Math.min(20, score);
}

function calculateBusinessQuality(lead) {
  let score = 0;
  
  // GMB exists (5 points)
  if (lead.place_id) score += 5;
  
  // Has reviews (0-5 points)
  const reviewCount = lead.gmb_reviews_count || 0;
  if (reviewCount > 50) score += 5;
  else if (reviewCount > 20) score += 3;
  else if (reviewCount > 5) score += 1;
  
  // Good rating (0-5 points)
  const rating = lead.gmb_rating || 0;
  if (rating >= 4.5) score += 5;
  else if (rating >= 4.0) score += 3;
  else if (rating >= 3.5) score += 1;
  
  return Math.min(15, score);
}

function calculateTrafficQuality(behavior) {
  if (!behavior?.traffic_source) return 5; // Default middle score
  
  const source = behavior.traffic_source;
  
  // Organic/Direct (10 points)
  if (source.utm_source === 'organic' || source.utm_source === 'direct') {
    return 10;
  }
  
  // Referral (8 points)
  if (source.utm_source === 'referral') {
    return 8;
  }
  
  // Social (6 points)
  if (source.utm_medium === 'social') {
    return 6;
  }
  
  // Paid (4 points)
  if (source.utm_medium === 'cpc' || source.utm_medium === 'paid') {
    return 4;
  }
  
  return 5;
}

function getLeadGrade(score) {
  if (score >= 80) return 'A+ Hot Lead';
  if (score >= 70) return 'A Quality Lead';
  if (score >= 60) return 'B Good Lead';
  if (score >= 50) return 'C Average Lead';
  if (score >= 40) return 'D Low Quality';
  return 'F Poor Lead';
}

function getPathwayRecommendation(scores, lead, behavior) {
  const total = scores.total;
  const healthScore = lead.health_score || 0;
  
  // High score + low health = DFY (Done For You)
  if (total >= 70 && healthScore < 60) {
    return {
      pathway: 'pathway2',
      name: 'Done For You Service',
      reason: 'High engagement but critical GMB issues - needs professional help',
      confidence: 'high'
    };
  }
  
  // High score + high health = DIY Software
  if (total >= 70 && healthScore >= 60) {
    return {
      pathway: 'pathway3',
      name: 'DIY Software ($199/mo)',
      reason: 'Engaged lead with good foundation - ready for self-service',
      confidence: 'high'
    };
  }
  
  // Medium score = Gov Tech Grant
  if (total >= 50 && total < 70) {
    return {
      pathway: 'pathway1',
      name: 'Government Tech Grant',
      reason: 'Moderate engagement - may need financial assistance',
      confidence: 'medium'
    };
  }
  
  // Low engagement + any health = Gov Grant
  if (scores.engagement < 10) {
    return {
      pathway: 'pathway1',
      name: 'Government Tech Grant',
      reason: 'Low engagement - needs more information/incentive',
      confidence: 'low'
    };
  }
  
  // Default to DFY for critical issues
  if (healthScore < 40) {
    return {
      pathway: 'pathway2',
      name: 'Done For You Service',
      reason: 'Critical GMB issues require professional intervention',
      confidence: 'medium'
    };
  }
  
  // Fallback
  return {
    pathway: 'pathway3',
    name: 'DIY Software ($199/mo)',
    reason: 'Balanced profile - good fit for self-service solution',
    confidence: 'medium'
  };
}

function generateInsights(scores, lead, behavior) {
  const insights = [];
  
  // Health insights
  if (scores.health_score < 10) {
    insights.push({
      type: 'warning',
      category: 'health',
      message: 'Critical GMB health issues detected - high priority for DFY service'
    });
  }
  
  // Engagement insights
  if (scores.engagement > 20) {
    insights.push({
      type: 'positive',
      category: 'engagement',
      message: 'Highly engaged lead - excellent conversion potential'
    });
  } else if (scores.engagement < 10) {
    insights.push({
      type: 'warning',
      category: 'engagement',
      message: 'Low engagement - may need follow-up or nurturing'
    });
  }
  
  // Completion insights
  if (scores.completion === 20) {
    insights.push({
      type: 'positive',
      category: 'completion',
      message: 'Full contact info captured - ready for outreach'
    });
  }
  
  // Business quality insights
  if (scores.business_quality > 10) {
    insights.push({
      type: 'positive',
      category: 'business',
      message: 'Established business with good reputation'
    });
  } else if (scores.business_quality < 5) {
    insights.push({
      type: 'warning',
      category: 'business',
      message: 'New or struggling business - may need extra support'
    });
  }
  
  return insights;
}