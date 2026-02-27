import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Lead Quality Scoring & Conversion Prediction
 * ML-powered scoring based on behavior, GMB health, category, timing
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id, batch_mode = false } = await req.json();

    if (batch_mode) {
      // Score all active leads
      const leads = await base44.asServiceRole.entities.Lead.filter({
        status: { $in: ['new', 'contacted', 'qualified'] }
      });

      const scoredLeads = await Promise.all(
        leads.map(lead => calculateLeadScore(base44, lead))
      );

      return Response.json({
        success: true,
        leads: scoredLeads.sort((a, b) => b.score - a.score)
      });
    } else {
      // Score single lead
      if (!lead_id) {
        return Response.json({ error: 'lead_id required' }, { status: 400 });
      }

      const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
      if (!lead) {
        return Response.json({ error: 'Lead not found' }, { status: 404 });
      }

      const scored = await calculateLeadScore(base44, lead);
      return Response.json({ success: true, lead: scored });
    }

  } catch (error) {
    console.error('Lead quality prediction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

async function calculateLeadScore(base44, lead) {
  let score = 0;
  const factors = [];

  // Factor 1: GMB Health Score (0-35 points)
  const healthScore = lead.health_score || 0;
  const healthPoints = Math.round((healthScore / 100) * 35);
  score += healthPoints;
  factors.push({
    name: 'GMB Health',
    points: healthPoints,
    max: 35,
    detail: `${healthScore}/100 health score`
  });

  // Factor 2: Business Category (0-20 points)
  const categoryScores = {
    'home_services': 20,  // Highest conversion
    'medical': 18,
    'professional': 15,
    'retail': 12,
    'other': 10
  };
  const categoryPoints = categoryScores[lead.business_category] || 10;
  score += categoryPoints;
  factors.push({
    name: 'Business Category',
    points: categoryPoints,
    max: 20,
    detail: lead.business_category?.replace(/_/g, ' ')
  });

  // Factor 3: Engagement Activity (0-25 points)
  const events = await base44.asServiceRole.entities.ConversionEvent.filter({
    lead_id: lead.id
  }, 'created_date', 100);

  const engagementPoints = Math.min(25, Math.round(events.length * 2.5));
  score += engagementPoints;
  factors.push({
    name: 'Engagement',
    points: engagementPoints,
    max: 25,
    detail: `${events.length} touchpoints`
  });

  // Factor 4: Email Responsiveness (0-10 points)
  const emails = await base44.asServiceRole.entities.EmailLog.filter({
    to: lead.email
  }, 'created_date', 50);

  const openedEmails = emails.filter(e => e.open_count > 0).length;
  const emailPoints = emails.length > 0 
    ? Math.round((openedEmails / emails.length) * 10)
    : 0;
  score += emailPoints;
  factors.push({
    name: 'Email Response',
    points: emailPoints,
    max: 10,
    detail: `${openedEmails}/${emails.length} opened`
  });

  // Factor 5: Recency (0-10 points) - newer leads score higher
  const daysSinceCreated = (Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24);
  const recencyPoints = daysSinceCreated <= 7 ? 10 :
                        daysSinceCreated <= 14 ? 8 :
                        daysSinceCreated <= 30 ? 5 : 2;
  score += recencyPoints;
  factors.push({
    name: 'Recency',
    points: recencyPoints,
    max: 10,
    detail: `${Math.round(daysSinceCreated)} days old`
  });

  // Calculate conversion probability (sigmoid function)
  const conversionProbability = 1 / (1 + Math.exp(-(score - 50) / 15));

  // Determine priority tier
  let priority = 'Low';
  if (score >= 75) priority = 'Hot';
  else if (score >= 60) priority = 'Warm';
  else if (score >= 45) priority = 'Medium';

  // Generate recommendations
  const recommendations = generateRecommendations(lead, score, factors, events, emails);

  return {
    ...lead,
    score: Math.round(score),
    conversion_probability: Math.round(conversionProbability * 100),
    priority,
    factors,
    recommendations
  };
}

function generateRecommendations(lead, score, factors, events, emails) {
  const recommendations = [];

  // Low engagement
  if (factors.find(f => f.name === 'Engagement')?.points < 10) {
    recommendations.push({
      priority: 'high',
      action: 'Increase touchpoints',
      detail: 'Send personalized follow-up email highlighting their specific GMB issues'
    });
  }

  // Poor email response
  if (factors.find(f => f.name === 'Email Response')?.points < 5) {
    recommendations.push({
      priority: 'medium',
      action: 'Try different channel',
      detail: 'Attempt phone outreach or LinkedIn connection'
    });
  }

  // Low health score
  if (lead.health_score < 50) {
    recommendations.push({
      priority: 'high',
      action: 'Emphasize urgency',
      detail: 'Show exact revenue loss calculation to create urgency'
    });
  }

  // High score but no conversion
  if (score >= 60 && lead.status !== 'converted') {
    recommendations.push({
      priority: 'urgent',
      action: 'Personal outreach NOW',
      detail: 'This lead is hot - direct call or demo offer within 24 hours'
    });
  }

  // Stale lead
  const daysSinceCreated = (Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated > 21 && lead.status === 'new') {
    recommendations.push({
      priority: 'medium',
      action: 'Re-engagement campaign',
      detail: 'Send "last chance" discount or free audit extension'
    });
  }

  return recommendations;
}