import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Admin analytics endpoint - returns leads, revenue, A/B test results.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [leads, orders, abTests, abEvents] = await Promise.all([
      base44.asServiceRole.entities.Lead.list('-created_date', 10000),
      base44.asServiceRole.entities.Order.list('-created_date', 10000),
      base44.asServiceRole.entities.ABTest.filter({ status: 'active' }),
      base44.asServiceRole.entities.ABTestEvent.list('-created_date', 10000)
    ]);

    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const conversionRate = leads.length > 0 ? (completedOrders.length / leads.length) * 100 : 0;
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayLeads = leads.filter(l => new Date(l.created_date) >= today).length;
    const todayOrders = orders.filter(o => new Date(o.created_date) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // A/B test breakdown
    const abTestResults = abTests.map(test => {
      const testEvents = abEvents.filter(e => e.test_id === test.id);
      const variantStats = {};
      (test.variants || []).forEach(variant => {
        const vEvents = testEvents.filter(e => e.variant_id === variant.id);
        const views = vEvents.filter(e => e.event_type === 'view').length;
        const conversions = vEvents.filter(e => e.event_type === 'conversion').length;
        variantStats[variant.id] = {
          name: variant.name,
          views,
          conversions,
          conversionRate: views > 0 ? ((conversions / views) * 100).toFixed(2) : '0.00'
        };
      });
      return { testId: test.id, testName: test.name, page: test.page, element: test.element, variants: variantStats };
    });

    // Revenue by day (last 30 days)
    const last30Days = new Date(); last30Days.setDate(last30Days.getDate() - 30);
    const revenueByDay = {};
    orders.filter(o => new Date(o.created_date) >= last30Days).forEach(order => {
      const date = new Date(order.created_date).toISOString().split('T')[0];
      revenueByDay[date] = (revenueByDay[date] || 0) + (order.total_amount || 0);
    });

    return Response.json({
      overview: {
        totalLeads: leads.length,
        totalRevenue: totalRevenue.toFixed(2),
        completedOrders: completedOrders.length,
        conversionRate: conversionRate.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2)
      },
      today: { leads: todayLeads, orders: todayOrders.length, revenue: todayRevenue.toFixed(2) },
      abTests: abTestResults,
      revenueByDay
    });

  } catch (error) {
    console.error('getAnalytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});