import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [leads, orders, abTests, abEvents] = await Promise.all([
      base44.asServiceRole.entities.Lead.list('-created_date', 10000),
      base44.asServiceRole.entities.Order.list('-created_date', 10000),
      base44.asServiceRole.entities.ABTest.filter({ status: 'active' }),
      base44.asServiceRole.entities.ABTestEvent.list('-created_date', 10000)
    ]);

    // Calculate metrics
    const totalLeads = leads.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed');
    const conversionRate = totalLeads > 0 ? (completedOrders.length / totalLeads) * 100 : 0;
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLeads = leads.filter(l => new Date(l.created_date) >= today).length;
    const todayOrders = orders.filter(o => new Date(o.created_date) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // A/B Test results
    const abTestResults = abTests.map(test => {
      const testEvents = abEvents.filter(e => e.test_id === test.id);
      const variantStats = {};

      test.variants.forEach(variant => {
        const variantEvents = testEvents.filter(e => e.variant_id === variant.id);
        const views = variantEvents.filter(e => e.event_type === 'view').length;
        const conversions = variantEvents.filter(e => e.event_type === 'conversion').length;
        const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

        variantStats[variant.id] = {
          name: variant.name,
          views,
          conversions,
          conversionRate: conversionRate.toFixed(2)
        };
      });

      return {
        testId: test.id,
        testName: test.name,
        page: test.page,
        element: test.element,
        variants: variantStats
      };
    });

    // Revenue by day (last 30 days)
    const revenueByDay = {};
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    orders.filter(o => new Date(o.created_date) >= last30Days).forEach(order => {
      const date = new Date(order.created_date).toISOString().split('T')[0];
      revenueByDay[date] = (revenueByDay[date] || 0) + (order.total_amount || 0);
    });

    return Response.json({
      overview: {
        totalLeads,
        totalRevenue: totalRevenue.toFixed(2),
        completedOrders: completedOrders.length,
        conversionRate: conversionRate.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2)
      },
      today: {
        leads: todayLeads,
        orders: todayOrders.length,
        revenue: todayRevenue.toFixed(2)
      },
      abTests: abTestResults,
      revenueByDay
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}));