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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Only fetch last 30 days data — avoids full-table scans at scale
    const [leads, orders, errorLogs, bridgeViews, pathwayClicks] = await Promise.all([
      base44.asServiceRole.entities.Lead.filter({ created_date: { $gte: thirtyDaysAgo } }, '-created_date', 200),
      base44.asServiceRole.entities.Order.filter({ created_date: { $gte: thirtyDaysAgo } }, '-created_date', 200),
      base44.asServiceRole.entities.ErrorLog.filter({ created_date: { $gte: oneHourAgo } }, '-created_date', 100),
      base44.asServiceRole.entities.ConversionEvent.filter({ funnel_version: 'geenius', event_name: 'bridge_viewed', created_date: { $gte: thirtyDaysAgo } }, '-created_date', 500),
      base44.asServiceRole.entities.ConversionEvent.filter({ funnel_version: 'geenius', event_name: { $in: ['pathway_govtech_grant_clicked', 'pathway_done_for_you_clicked', 'pathway_diy_software_clicked'] }, created_date: { $gte: thirtyDaysAgo } }, '-created_date', 500)
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

    // Bridge pathway split
    const totalBridgeViews = bridgeViews.length;
    const grantClicks = pathwayClicks.filter(e => e.event_name === 'pathway_govtech_grant_clicked').length;
    const dfyClicks = pathwayClicks.filter(e => e.event_name === 'pathway_done_for_you_clicked').length;
    const diyClicks = pathwayClicks.filter(e => e.event_name === 'pathway_diy_software_clicked').length;
    const totalPathwayClicks = grantClicks + dfyClicks + diyClicks;
    const bridgeCTR = totalBridgeViews > 0 ? ((totalPathwayClicks / totalBridgeViews) * 100).toFixed(1) : '0';

    // This-month pathway breakdown
    const thisMonthPathways = pathwayClicks.filter(e => e.created_date >= monthStart);
    const grantClicksMonth = thisMonthPathways.filter(e => e.event_name === 'pathway_govtech_grant_clicked').length;
    const dfyClicksMonth = thisMonthPathways.filter(e => e.event_name === 'pathway_done_for_you_clicked').length;
    const diyClicksMonth = thisMonthPathways.filter(e => e.event_name === 'pathway_diy_software_clicked').length;

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
      bridge: {
        totalViews: totalBridgeViews,
        totalClicks: totalPathwayClicks,
        ctr: `${bridgeCTR}%`,
        pathways: {
          grant: { total: grantClicks, thisMonth: grantClicksMonth, pct: totalPathwayClicks > 0 ? ((grantClicks / totalPathwayClicks) * 100).toFixed(1) : '0' },
          dfy:   { total: dfyClicks,   thisMonth: dfyClicksMonth,   pct: totalPathwayClicks > 0 ? ((dfyClicks   / totalPathwayClicks) * 100).toFixed(1) : '0' },
          diy:   { total: diyClicks,   thisMonth: diyClicksMonth,   pct: totalPathwayClicks > 0 ? ((diyClicks   / totalPathwayClicks) * 100).toFixed(1) : '0' }
        }
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('getDashboardStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});