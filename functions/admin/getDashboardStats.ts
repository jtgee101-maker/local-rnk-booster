import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Real admin dashboard stats - reads from actual entities, no fake fallback data.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [leads, orders, errorLogs] = await Promise.all([
      base44.asServiceRole.entities.Lead.list('-created_date', 5000),
      base44.asServiceRole.entities.Order.list('-created_date', 5000),
      base44.asServiceRole.entities.ErrorLog.filter({ created_date: { $gte: oneHourAgo } }, '-created_date', 100)
    ]);

    const completedOrders = orders.filter(o => o.status === 'completed');
    const thisMonthOrders = completedOrders.filter(o => o.created_date >= monthStart);
    const lastMonthOrders = completedOrders.filter(o => o.created_date >= lastMonthStart && o.created_date < monthStart);

    const totalRevenue = completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const monthRevenue = thisMonthOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const revenueChange = lastMonthRevenue > 0 ? (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : '0';

    const thisMonthLeads = leads.filter(l => l.created_date >= monthStart).length;
    const lastMonthLeads = leads.filter(l => l.created_date >= lastMonthStart && l.created_date < monthStart).length;
    const leadsChange = lastMonthLeads > 0 ? (((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100).toFixed(1) : '0';

    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const conversionRate = leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : '0';

    const criticalErrors = errorLogs.filter(e => e.severity === 'critical' && !e.resolved).length;

    const recentLeads = leads.filter(l => l.created_date >= oneDayAgo).length;

    return Response.json({
      totalLeads: leads.length,
      leadsThisMonth: thisMonthLeads,
      leadsChange: `${Number(leadsChange) >= 0 ? '+' : ''}${leadsChange}%`,
      totalRevenue: totalRevenue.toFixed(2),
      monthRevenue: monthRevenue.toFixed(2),
      revenueChange: `${Number(revenueChange) >= 0 ? '+' : ''}${revenueChange}%`,
      completedOrders: completedOrders.length,
      conversionRate: `${conversionRate}%`,
      convertedLeads,
      criticalErrors,
      recentLeads,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('getDashboardStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});