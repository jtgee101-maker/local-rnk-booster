import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Revenue Attribution
 * Track which sources, campaigns, AB variants generate revenue
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

    // Get all completed orders in range
    const orders = await base44.asServiceRole.entities.Order.filter({
      status: 'completed',
      created_date: { $gte: startDate, $lte: endDate }
    }, '-created_date', 1000);

    // Attribution by funnel version
    const funnelAttribution = await attributeByFunnel(base44, orders);

    // Attribution by traffic source
    const sourceAttribution = await attributeBySource(base44, orders);

    // Attribution by AB test variant
    const variantAttribution = await attributeByVariant(base44, orders);

    // Attribution by business category
    const categoryAttribution = await attributeByCategory(base44, orders);

    // Calculate overall metrics
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return Response.json({
      success: true,
      date_range: { start: startDate, end: endDate },
      total_revenue: totalRevenue,
      total_orders: orders.length,
      average_order_value: averageOrderValue,
      attribution: {
        by_funnel: funnelAttribution,
        by_source: sourceAttribution,
        by_variant: variantAttribution,
        by_category: categoryAttribution
      }
    });

  } catch (error) {
    console.error('Revenue attribution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function attributeByFunnel(base44, orders) {
  const attribution = {};

  for (const order of orders) {
    if (!order.lead_id) continue;

    // Find first funnel event for this lead
    const events = await base44.asServiceRole.entities.ConversionEvent.filter({
      lead_id: order.lead_id,
      event_name: { $in: ['quizv3_started', 'quizv2_started', 'quiz_started'] }
    }, 'created_date', 1);

    const funnel = events[0]?.funnel_version || 'unknown';
    
    if (!attribution[funnel]) {
      attribution[funnel] = {
        orders: 0,
        revenue: 0,
        leads: new Set()
      };
    }

    attribution[funnel].orders++;
    attribution[funnel].revenue += order.total_amount || 0;
    attribution[funnel].leads.add(order.lead_id);
  }

  // Convert to array and calculate percentages
  return Object.entries(attribution).map(([funnel, data]) => ({
    funnel,
    orders: data.orders,
    revenue: data.revenue,
    unique_leads: data.leads.size,
    avg_order_value: data.revenue / data.orders
  }));
}

async function attributeBySource(base44, orders) {
  const attribution = {};

  for (const order of orders) {
    if (!order.lead_id) continue;

    const events = await base44.asServiceRole.entities.ConversionEvent.filter({
      lead_id: order.lead_id
    }, 'created_date', 1);

    const source = events[0]?.properties?.utm_source || 
                   events[0]?.properties?.referrer || 
                   'direct';

    if (!attribution[source]) {
      attribution[source] = {
        orders: 0,
        revenue: 0
      };
    }

    attribution[source].orders++;
    attribution[source].revenue += order.total_amount || 0;
  }

  return Object.entries(attribution).map(([source, data]) => ({
    source,
    orders: data.orders,
    revenue: data.revenue,
    avg_order_value: data.revenue / data.orders
  }));
}

async function attributeByVariant(base44, orders) {
  const attribution = {};

  for (const order of orders) {
    if (!order.lead_id) continue;

    // Get AB test events
    const abEvents = await base44.asServiceRole.entities.ABTestEvent.filter({
      lead_id: order.lead_id,
      event_type: 'view'
    }, 'created_date', 100);

    if (abEvents.length === 0) continue;

    for (const event of abEvents) {
      const key = `${event.test_id}_${event.variant_id}`;
      
      if (!attribution[key]) {
        attribution[key] = {
          test_id: event.test_id,
          variant_id: event.variant_id,
          orders: 0,
          revenue: 0
        };
      }

      attribution[key].orders++;
      attribution[key].revenue += order.total_amount || 0;
    }
  }

  return Object.values(attribution).map(data => ({
    test_id: data.test_id,
    variant_id: data.variant_id,
    orders: data.orders,
    revenue: data.revenue,
    avg_order_value: data.revenue / data.orders
  }));
}

async function attributeByCategory(base44, orders) {
  const attribution = {};

  for (const order of orders) {
    if (!order.lead_id) continue;

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: order.lead_id });
    const lead = leads[0];
    const category = lead?.business_category || 'unknown';

    if (!attribution[category]) {
      attribution[category] = {
        orders: 0,
        revenue: 0,
        leads: new Set()
      };
    }

    attribution[category].orders++;
    attribution[category].revenue += order.total_amount || 0;
    attribution[category].leads.add(order.lead_id);
  }

  return Object.entries(attribution).map(([category, data]) => ({
    category,
    orders: data.orders,
    revenue: data.revenue,
    unique_leads: data.leads.size,
    conversion_rate: data.orders / data.leads.size,
    avg_order_value: data.revenue / data.orders
  }));
}