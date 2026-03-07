import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Lead Quality Scoring & Conversion Prediction
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id, batch_mode = false } = await req.json();

    if (batch_mode) {
      const leads = await base44.asServiceRole.entities.Lead.filter({
        status: { $in: ['new', 'contacted', 'qualified'] }
      }, '-created_date', 500);

      const scoredLeads = await Promise.all(leads.map(lead => calculateLeadScore(base44, lead)));
      return Response.json({ success: true, leads: scoredLeads.sort((a, b) => b.score - a.score) });
    }

    if (!lead_id) return Response.json({ error: 'lead_id required' }, { status: 400 });

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const scored = await calculateLeadScore(base44, lead);
    return Response.json({ success: true, lead: scored });

  } catch (error) {
    console.error('Lead quality prediction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function calculateLeadScore(base44, lead) {
  let score = 0;
  const factors = [];

  // GMB Health Score (0-35 pts)
  const healthScore = lead.health_score || 0;
  const healthPoints = Math.round((healthScore / 100) * 35);
  score += healthPoints;
  factors.push({ name: 'GMB Health', points: healthPoints, max: 35, detail: `${healthScore}/100` });

  // Business Category (0-20 pts)
  const categoryScores = { home_services: 20, medical: 18, professional: 15, retail: 12, other: 10 };
  const categoryPoints = categoryScores[lead.business_category] || 10;
  score += categoryPoints;
  factors.push({ name: 'Business Category', points: categoryPoints, max: 20, detail: lead.business_category?.replace(/_/g, ' ') });

  // Engagement Activity (0-25 pts)
  const events = await base44.asServiceRole.entities.ConversionEvent.filter({ lead_id: lead.id }, 'created_date', 100);
  const engagementPoints = Math.min(25, Math.round(events.length * 2.5));
  score += engagementPoints;
  factors.push({ name: 'Engagement', points: engagementPoints, max: 25, detail: `${events.length} touchpoints` });

  // Email Responsiveness (0-10 pts)
  const emails = await base44.asServiceRole.entities.EmailLog.filter({ to: lead.email }, 'created_date', 50);
  const openedEmails = emails.filter(e => e.open_count > 0).length;
  const emailPoints = emails.length > 0 ? Math.round((openedEmails / emails.length) * 10) : 0;
  score += emailPoints;
  factors.push({ name: 'Email Response', points: emailPoints, max: 10, detail: `${openedEmails}/${emails.length} opened` });

  // Recency (0-10 pts)
  const daysSinceCreated = (Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24);
  const recencyPoints = daysSinceCreated <= 7 ? 10 : daysSinceCreated <= 14 ? 8 : daysSinceCreated <= 30 ? 5 : 2;
  score += recencyPoints;
  factors.push({ name: 'Recency', points: recencyPoints, max: 10, detail: `${Math.round(daysSinceCreated)} days old` });

  const conversionProbability = 1 / (1 + Math.exp(-(score - 50) / 15));
  const priority = score >= 75 ? 'Hot' : score >= 60 ? 'Warm' : score >= 45 ? 'Medium' : 'Low';
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

  if (factors.find(f => f.name === 'Engagement')?.points < 10) {
    recommendations.push({ priority: 'high', action: 'Increase touchpoints', detail: 'Send personalized follow-up email highlighting their specific GMB issues' });
  }
  if (factors.find(f => f.name === 'Email Response')?.points < 5) {
    recommendations.push({ priority: 'medium', action: 'Try different channel', detail: 'Attempt phone outreach or LinkedIn connection' });
  }
  if (lead.health_score < 50) {
    recommendations.push({ priority: 'high', action: 'Emphasize urgency', detail: 'Show exact revenue loss calculation to create urgency' });
  }
  if (score >= 60 && lead.status !== 'converted') {
    recommendations.push({ priority: 'urgent', action: 'Personal outreach NOW', detail: 'This lead is hot - direct call or demo offer within 24 hours' });
  }
  const daysSinceCreated = (Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated > 21 && lead.status === 'new') {
    recommendations.push({ priority: 'medium', action: 'Re-engagement campaign', detail: 'Send "last chance" discount or free audit extension' });
  }

  return recommendations;
}