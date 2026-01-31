import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = Date.now();
    const last24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel fetch all metrics
    const [
      allLeads,
      recentLeads,
      allOrders,
      recentOrders,
      completedOrders,
      recentEmails,
      failedEmails,
      activeTests,
      activeCampaigns,
      activeSegments
    ] = await Promise.all([
      base44.asServiceRole.entities.Lead.list(),
      base44.asServiceRole.entities.Lead.filter({ created_date: { $gte: last24h } }),
      base44.asServiceRole.entities.Order.list(),
      base44.asServiceRole.entities.Order.filter({ created_date: { $gte: last24h } }),
      base44.asServiceRole.entities.Order.filter({ status: 'completed' }),
      base44.asServiceRole.entities.EmailLog.filter({ 
        status: 'sent',
        created_date: { $gte: last24h }
      }),
      base44.asServiceRole.entities.EmailLog.filter({ 
        status: 'failed',
        created_date: { $gte: last24h }
      }),
      base44.asServiceRole.entities.ABTest.filter({ status: 'active' }),
      base44.asServiceRole.entities.Campaign.filter({ status: 'active' }),
      base44.asServiceRole.entities.Segment.filter({ is_active: true })
    ]);

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const conversionRate = allLeads.length > 0 
      ? ((allOrders.length / allLeads.length) * 100).toFixed(2)
      : 0;

    const avgOrderValue = completedOrders.length > 0
      ? (totalRevenue / completedOrders.length).toFixed(2)
      : 0;

    // Calculate trends (compare to previous period)
    const prev7d = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const previousLeads = await base44.asServiceRole.entities.Lead.filter({ 
      created_date: { $gte: prev7d, $lt: last7d }
    });
    
    const leadTrend = previousLeads.length > 0
      ? (((recentLeads.length - previousLeads.length) / previousLeads.length) * 100).toFixed(1)
      : 0;

    return Response.json({
      success: true,
      metrics: {
        leads: {
          total: allLeads.length,
          recent_24h: recentLeads.length,
          trend: parseFloat(leadTrend)
        },
        orders: {
          total: allOrders.length,
          recent_24h: recentOrders.length,
          completed: completedOrders.length
        },
        revenue: {
          total: parseFloat(totalRevenue.toFixed(2)),
          avg_order_value: parseFloat(avgOrderValue),
          conversion_rate: parseFloat(conversionRate)
        },
        emails: {
          sent_24h: recentEmails.length,
          failed_24h: failedEmails.length,
          success_rate: recentEmails.length + failedEmails.length > 0
            ? ((recentEmails.length / (recentEmails.length + failedEmails.length)) * 100).toFixed(1)
            : 100
        },
        active: {
          ab_tests: activeTests.length,
          campaigns: activeCampaigns.length,
          segments: activeSegments.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get overview metrics error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: 'Failed to get overview metrics',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'getOverviewMetrics' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to get overview metrics',
      details: error.message 
    }, { status: 500 });
  }
});