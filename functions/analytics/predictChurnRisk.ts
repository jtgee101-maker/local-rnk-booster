import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Churn Risk Prediction
 * Identify customers at risk of cancellation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all converted leads (active customers)
    const convertedLeads = await base44.asServiceRole.entities.Lead.filter({
      status: 'converted'
    }, '-created_date', 500);

    const atRiskCustomers = [];

    for (const lead of convertedLeads) {
      const churnRisk = await calculateChurnRisk(base44, lead);
      
      if (churnRisk.risk_level !== 'Low') {
        atRiskCustomers.push(churnRisk);
      }
    }

    // Sort by risk score
    atRiskCustomers.sort((a, b) => b.risk_score - a.risk_score);

    return Response.json({
      success: true,
      at_risk_count: atRiskCustomers.length,
      total_customers: convertedLeads.length,
      customers: atRiskCustomers
    });

  } catch (error) {
    console.error('Churn prediction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function calculateChurnRisk(base44, lead) {
  let riskScore = 0;
  const signals = [];

  // Get orders
  const orders = await base44.asServiceRole.entities.Order.filter({
    lead_id: lead.id,
    status: 'completed'
  }, '-created_date', 10);

  if (orders.length === 0) {
    return { ...lead, risk_score: 0, risk_level: 'Unknown', signals: [] };
  }

  const firstOrder = orders[orders.length - 1];
  const daysSinceOrder = (Date.now() - new Date(firstOrder.created_date).getTime()) / (1000 * 60 * 60 * 24);

  // Signal 1: No recent engagement (20 points)
  const recentEvents = await base44.asServiceRole.entities.ConversionEvent.filter({
    lead_id: lead.id,
    created_date: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() }
  }, 'created_date', 100);

  if (recentEvents.length === 0) {
    riskScore += 20;
    signals.push({
      severity: 'high',
      signal: 'No engagement in 14 days',
      recommendation: 'Send "We miss you" email with special offer'
    });
  } else if (recentEvents.length < 3) {
    riskScore += 10;
    signals.push({
      severity: 'medium',
      signal: 'Low engagement (< 3 touches in 14 days)',
      recommendation: 'Check in with value-add content'
    });
  }

  // Signal 2: Not opening emails (15 points)
  const recentEmails = await base44.asServiceRole.entities.EmailLog.filter({
    to: lead.email,
    created_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
  }, 'created_date', 20);

  const unopenedCount = recentEmails.filter(e => e.open_count === 0).length;
  if (recentEmails.length > 0 && unopenedCount / recentEmails.length > 0.7) {
    riskScore += 15;
    signals.push({
      severity: 'high',
      signal: `${Math.round((unopenedCount / recentEmails.length) * 100)}% emails unopened`,
      recommendation: 'Try phone outreach or SMS'
    });
  }

  // Signal 3: Early in lifecycle (vulnerable) (10 points)
  if (daysSinceOrder <= 45) {
    riskScore += 10;
    signals.push({
      severity: 'medium',
      signal: `Only ${Math.round(daysSinceOrder)} days since purchase`,
      recommendation: 'Strengthen onboarding with quick wins'
    });
  }

  // Signal 4: Low initial engagement post-purchase (15 points)
  const postPurchaseEvents = await base44.asServiceRole.entities.ConversionEvent.filter({
    lead_id: lead.id,
    created_date: { $gte: firstOrder.created_date }
  }, 'created_date', 100);

  if (postPurchaseEvents.length < 5 && daysSinceOrder > 7) {
    riskScore += 15;
    signals.push({
      severity: 'high',
      signal: 'Low post-purchase engagement',
      recommendation: 'Schedule onboarding call immediately'
    });
  }

  // Signal 5: Low order value (might not see ROI) (10 points)
  if (firstOrder.total_amount < 50) {
    riskScore += 10;
    signals.push({
      severity: 'low',
      signal: 'Low initial investment',
      recommendation: 'Demonstrate quick ROI with success stories'
    });
  }

  // Signal 6: Poor GMB health despite purchase (20 points)
  if (lead.health_score < 40) {
    riskScore += 20;
    signals.push({
      severity: 'critical',
      signal: 'GMB health still poor after purchase',
      recommendation: 'Immediate intervention - offer free audit call'
    });
  }

  // Signal 7: No repeat engagement patterns (10 points)
  const eventTypes = new Set(postPurchaseEvents.map(e => e.event_name));
  if (eventTypes.size < 3) {
    riskScore += 10;
    signals.push({
      severity: 'medium',
      signal: 'Limited interaction variety',
      recommendation: 'Introduce them to more platform features'
    });
  }

  // Determine risk level
  let riskLevel = 'Low';
  if (riskScore >= 60) riskLevel = 'Critical';
  else if (riskScore >= 40) riskLevel = 'High';
  else if (riskScore >= 25) riskLevel = 'Medium';

  // Predicted churn probability
  const churnProbability = Math.min(100, Math.round(riskScore * 1.2));

  return {
    lead_id: lead.id,
    email: lead.email,
    business_name: lead.business_name,
    risk_score: riskScore,
    risk_level: riskLevel,
    churn_probability: churnProbability,
    days_since_purchase: Math.round(daysSinceOrder),
    signals,
    order_value: firstOrder.total_amount
  };
}