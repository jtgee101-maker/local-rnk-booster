import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const { date_range, channel } = await req.json();
    const startDate = date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = date_range?.end || new Date().toISOString();

    // Get all orders
    const orders = await base44.asServiceRole.entities.Order.filter({
      status: 'completed',
      created_date: { $gte: startDate, $lte: endDate }
    }, '-created_date', 1000);

    // Get all leads
    const leads = await base44.asServiceRole.entities.Lead.filter({
      created_date: { $gte: startDate, $lte: endDate }
    }, '-created_date', 1000);

    // Calculate overall metrics
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = orders.length;
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? (totalOrders / totalLeads) * 100 : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const revenuePerLead = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    // Calculate by channel (funnel version)
    const channelMetrics = await calculateChannelMetrics(base44, orders, leads, startDate, endDate);

    // Calculate daily trend
    const dailyTrend = await calculateDailyTrend(base44, startDate, endDate);

    // Calculate customer acquisition cost (CAC) - estimated
    const estimatedMarketingSpend = 0; // Would need to integrate with ad platforms
    const cac = totalOrders > 0 ? estimatedMarketingSpend / totalOrders : 0;
    const ltv = avgOrderValue; // Simplified - would need repeat purchase data
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    // Top performing segments
    const topCategories = await getTopPerformingCategories(base44, orders, startDate, endDate);

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
        estimated_cac: cac,
        ltv,
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

async function calculateChannelMetrics(base44, orders, leads, startDate, endDate) {
  const channels = {};

  for (const lead of leads) {
    // Determine channel from first event
    const events = await base44.asServiceRole.entities.ConversionEvent.filter({
      lead_id: lead.id
    }, 'created_date', 1);

    const funnelVersion = events[0]?.funnel_version || 'unknown';
    
    if (!channels[funnelVersion]) {
      channels[funnelVersion] = {
        leads: 0,
        orders: 0,
        revenue: 0
      };
    }

    channels[funnelVersion].leads++;
  }

  // Add order data
  for (const order of orders) {
    if (!order.lead_id) continue;

    const events = await base44.asServiceRole.entities.ConversionEvent.filter({
      lead_id: order.lead_id
    }, 'created_date', 1);

    const funnelVersion = events[0]?.funnel_version || 'unknown';

    if (channels[funnelVersion]) {
      channels[funnelVersion].orders++;
      channels[funnelVersion].revenue += order.total_amount || 0;
    }
  }

  return Object.entries(channels).map(([channel, data]) => ({
    channel,
    leads: data.leads,
    orders: data.orders,
    revenue: data.revenue,
    conversion_rate: data.leads > 0 ? (data.orders / data.leads) * 100 : 0,
    revenue_per_lead: data.leads > 0 ? data.revenue / data.leads : 0,
    avg_order_value: data.orders > 0 ? data.revenue / data.orders : 0
  }));
}

async function calculateDailyTrend(base44, startDate, endDate) {
  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < diffDays; i++) {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    // Get orders for this day
    const dayOrders = await base44.asServiceRole.entities.Order.filter({
      status: 'completed',
      created_date: { $gte: dayStart.toISOString(), $lt: dayEnd.toISOString() }
    }, 'created_date', 1000);

    // Get leads for this day
    const dayLeads = await base44.asServiceRole.entities.Lead.filter({
      created_date: { $gte: dayStart.toISOString(), $lt: dayEnd.toISOString() }
    }, 'created_date', 1000);

    const revenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    days.push({
      date: dayStart.toISOString().slice(0, 10),
      leads: dayLeads.length,
      orders: dayOrders.length,
      revenue,
      conversion_rate: dayLeads.length > 0 ? (dayOrders.length / dayLeads.length) * 100 : 0
    });
  }

  return days;
}

async function getTopPerformingCategories(base44, orders, startDate, endDate) {
  const categories = {};

  for (const order of orders) {
    if (!order.lead_id) continue;

    const lead = await base44.asServiceRole.entities.Lead.get(order.lead_id);
    const category = lead?.business_category || 'unknown';

    if (!categories[category]) {
      categories[category] = {
        orders: 0,
        revenue: 0
      };
    }

    categories[category].orders++;
    categories[category].revenue += order.total_amount || 0;
  }

  return Object.entries(categories)
    .map(([category, data]) => ({
      category,
      orders: data.orders,
      revenue: data.revenue,
      avg_order_value: data.revenue / data.orders
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}