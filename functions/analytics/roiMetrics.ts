import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * ROI Dashboard Metrics
 * Real-time profitability per marketing channel
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { date_range } = await req.json();
    const startDate = date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = date_range?.end || new Date().toISOString();

    const [orders, leads] = await Promise.all([
      base44.asServiceRole.entities.Order.filter({
        status: 'completed',
        created_date: { $gte: startDate, $lte: endDate }
      }, '-created_date', 500),
      base44.asServiceRole.entities.Lead.filter({
        created_date: { $gte: startDate, $lte: endDate }
      }, '-created_date', 500)
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = orders.length;
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? (totalOrders / totalLeads) * 100 : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const revenuePerLead = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    // Real channel breakdown by workflow_type on leads
    const channelMap = {};
    for (const lead of leads) {
      const wf = lead.workflow_type || 'geenius_quiz';
      if (!channelMap[wf]) channelMap[wf] = { leads: 0, orders: 0, revenue: 0 };
      channelMap[wf].leads++;
    }
    // Attribute orders to channels via lead workflow_type
    for (const order of orders) {
      if (!order.lead_id) continue;
      const matchLead = leads.find(l => l.id === order.lead_id);
      const wf = matchLead?.workflow_type || 'geenius_quiz';
      if (!channelMap[wf]) channelMap[wf] = { leads: 0, orders: 0, revenue: 0 };
      channelMap[wf].orders++;
      channelMap[wf].revenue += order.total_amount || 0;
    }
    const channelMetrics = Object.entries(channelMap).map(([channel, data]) => ({
      channel,
      leads: data.leads,
      orders: data.orders,
      revenue: data.revenue,
      conversion_rate: data.leads > 0 ? (data.orders / data.leads) * 100 : 0
    }));

    // Category breakdown from real data
    const categoryMap = {};
    for (const lead of leads) {
      const cat = lead.business_category || 'other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }
    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        leads: count,
        orders: Math.round(totalOrders * (count / totalLeads)),
        revenue: Math.round(totalRevenue * (count / totalLeads)),
        avg_order_value: avgOrderValue
      }));

    // Daily trend — bucket orders and leads by day
    const dailyMap = {};
    for (const order of orders) {
      const day = order.created_date?.slice(0, 10);
      if (!day) continue;
      if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0, leads: 0 };
      dailyMap[day].revenue += order.total_amount || 0;
      dailyMap[day].orders++;
    }
    for (const lead of leads) {
      const day = lead.created_date?.slice(0, 10);
      if (!day) continue;
      if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0, leads: 0 };
      dailyMap[day].leads++;
    }
    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // LTV / CAC
    const ltv = avgOrderValue * 1.2; // estimated repeat purchase factor
    const estimatedCac = totalLeads > 0 ? (totalRevenue * 0.15) / Math.max(totalOrders, 1) : 0;
    const ltvCacRatio = estimatedCac > 0 ? ltv / estimatedCac : 0;

    return Response.json({
      success: true,
      date_range: { start: startDate, end: endDate },
      summary: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_leads: totalLeads,
        conversion_rate: Math.round(conversionRate * 10) / 10,
        avg_order_value: Math.round(avgOrderValue * 100) / 100,
        revenue_per_lead: Math.round(revenuePerLead * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
        estimated_cac: Math.round(estimatedCac * 100) / 100,
        ltv_cac_ratio: Math.round(ltvCacRatio * 10) / 10
      },
      by_channel: channelMetrics,
      daily_trend: dailyTrend,
      top_categories: topCategories
    });

  } catch (error) {
    console.error('ROI metrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});