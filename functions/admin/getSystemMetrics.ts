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
    const { period = '24h' } = body;

    const periodMap = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    };

    const timeWindow = periodMap[period] || 86400000;
    const startDate = new Date(Date.now() - timeWindow).toISOString();

    // Fetch metrics in parallel
    const [
      totalLeads,
      newLeads,
      totalOrders,
      newOrders,
      totalRevenue,
      emailsSent,
      emailsFailed,
      criticalErrors,
      activeAutomations
    ] = await Promise.all([
      base44.asServiceRole.entities.Lead.list(),
      base44.asServiceRole.entities.Lead.filter({ created_date: { $gte: startDate } }),
      base44.asServiceRole.entities.Order.list(),
      base44.asServiceRole.entities.Order.filter({ created_date: { $gte: startDate } }),
      base44.asServiceRole.entities.Order.filter({ 
        status: 'completed',
        created_date: { $gte: startDate }
      }),
      base44.asServiceRole.entities.EmailLog.filter({ 
        status: 'sent',
        created_date: { $gte: startDate }
      }),
      base44.asServiceRole.entities.EmailLog.filter({ 
        status: 'failed',
        created_date: { $gte: startDate }
      }),
      base44.asServiceRole.entities.ErrorLog.filter({ 
        severity: 'critical',
        created_date: { $gte: startDate }
      }),
      // Mock automation count
      Promise.resolve([1, 2, 3])
    ]);

    const revenue = totalRevenue.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    // Calculate conversion rate
    const conversionRate = totalLeads.length > 0 
      ? ((totalOrders.length / totalLeads.length) * 100).toFixed(2)
      : 0;

    // Calculate email success rate
    const totalEmails = emailsSent.length + emailsFailed.length;
    const emailSuccessRate = totalEmails > 0
      ? ((emailsSent.length / totalEmails) * 100).toFixed(2)
      : 100;

    // Performance score (0-100)
    let performanceScore = 100;
    if (emailSuccessRate < 95) performanceScore -= 20;
    if (criticalErrors.length > 0) performanceScore -= 30;
    if (conversionRate < 5) performanceScore -= 10;
    
    return Response.json({
      success: true,
      period: period,
      metrics: {
        leads: {
          total: totalLeads.length,
          new: newLeads.length,
          trend: newLeads.length > 0 ? 'up' : 'stable'
        },
        orders: {
          total: totalOrders.length,
          new: newOrders.length,
          revenue: revenue,
          conversion_rate: parseFloat(conversionRate),
          trend: newOrders.length > 0 ? 'up' : 'stable'
        },
        emails: {
          sent: emailsSent.length,
          failed: emailsFailed.length,
          success_rate: parseFloat(emailSuccessRate),
          trend: emailSuccessRate >= 95 ? 'up' : 'down'
        },
        errors: {
          critical: criticalErrors.length,
          trend: criticalErrors.length === 0 ? 'stable' : 'up'
        },
        automations: {
          active: activeAutomations.length,
          total: activeAutomations.length
        },
        performance_score: Math.max(0, performanceScore)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get system metrics error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to fetch system metrics',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'getSystemMetrics' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to fetch system metrics',
      details: error.message 
    }, { status: 500 });
  }
}));