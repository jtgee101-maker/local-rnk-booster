import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    let churnScore = 0;
    const riskFactors = [];

    // Factor 1: Order Age (older orders = higher risk)
    const daysSinceOrder = (Date.now() - new Date(order.created_date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceOrder > 90) {
      churnScore += 30;
      riskFactors.push({ factor: 'No recent activity (90+ days)', impact: 'high' });
    } else if (daysSinceOrder > 60) {
      churnScore += 20;
      riskFactors.push({ factor: 'Limited recent activity (60+ days)', impact: 'medium' });
    }

    // Factor 2: Email Engagement
    const emailLogs = await base44.asServiceRole.entities.EmailLog.filter({
      to: order.email,
      created_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
    });

    const openRate = emailLogs.length > 0
      ? emailLogs.filter(e => e.open_count > 0).length / emailLogs.length
      : 0;

    if (openRate < 0.1 && emailLogs.length > 3) {
      churnScore += 25;
      riskFactors.push({ factor: 'Very low email engagement (<10%)', impact: 'high' });
    } else if (openRate < 0.3) {
      churnScore += 15;
      riskFactors.push({ factor: 'Low email engagement (<30%)', impact: 'medium' });
    }

    // Factor 3: Order Value (lower value = higher churn risk)
    if (order.total_amount < 100) {
      churnScore += 15;
      riskFactors.push({ factor: 'Low order value (<$100)', impact: 'medium' });
    }

    // Factor 4: Support Issues
    const errorLogs = await base44.asServiceRole.entities.ErrorLog.filter({
      'metadata.order_id': order_id,
      severity: { $in: ['high', 'critical'] }
    });

    if (errorLogs.length > 0) {
      churnScore += 20;
      riskFactors.push({ factor: `${errorLogs.length} support issue(s)`, impact: 'high' });
    }

    // Factor 5: Refund Status
    if (order.status === 'refunded') {
      churnScore += 40;
      riskFactors.push({ factor: 'Order was refunded', impact: 'critical' });
    }

    // Normalize to 0-100
    churnScore = Math.min(100, churnScore);

    // Determine risk level
    let riskLevel = 'low';
    if (churnScore >= 70) riskLevel = 'critical';
    else if (churnScore >= 50) riskLevel = 'high';
    else if (churnScore >= 30) riskLevel = 'medium';

    return Response.json({
      success: true,
      order_id,
      email: order.email,
      churn_score: churnScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      recommendations: churnScore >= 50 
        ? ['Send re-engagement email', 'Offer exclusive discount', 'Schedule check-in call']
        : ['Continue normal nurture sequence']
    });

  } catch (error) {
    console.error('Predict churn error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to predict churn risk',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'predictChurnRisk' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to predict churn risk',
      details: error.message 
    }, { status: 500 });
  }
});