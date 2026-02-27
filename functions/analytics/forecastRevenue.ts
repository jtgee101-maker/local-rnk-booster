import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Revenue Forecasting
 * Project monthly/quarterly revenue from pipeline
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { period = 'monthly' } = await req.json();

    // Get historical data (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const [orders, leads] = await Promise.all([
      base44.asServiceRole.entities.Order.filter({
        status: 'completed',
        created_date: { $gte: ninetyDaysAgo }
      }),
      base44.asServiceRole.entities.Lead.filter({
        created_date: { $gte: ninetyDaysAgo }
      })
    ]);

    // Calculate historical metrics
    const historicalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const conversionRate = leads.length > 0 ? orders.length / leads.length : 0.05;
    const avgOrderValue = orders.length > 0 ? historicalRevenue / orders.length : 99;

    // Get current pipeline
    const pipelineLeads = await base44.asServiceRole.entities.Lead.filter({
      status: { $in: ['new', 'contacted', 'qualified'] }
    });

    // Predict conversions by lead quality
    const predictions = [];
    let expectedRevenue = 0;

    for (const lead of pipelineLeads) {
      // Simple scoring: health_score affects conversion probability
      const baseConversion = conversionRate;
      const healthMultiplier = (lead.health_score || 50) / 100;
      const leadConversionProb = baseConversion * (0.5 + healthMultiplier * 1.5);
      
      const expectedValue = avgOrderValue * leadConversionProb;
      expectedRevenue += expectedValue;

      if (leadConversionProb > 0.15) { // Only track high-probability leads
        predictions.push({
          lead_id: lead.id,
          business_name: lead.business_name,
          conversion_probability: Math.round(leadConversionProb * 100),
          expected_value: Math.round(expectedValue)
        });
      }
    }

    // Calculate monthly/quarterly forecast
    const daysInPeriod = period === 'monthly' ? 30 : 90;
    const forecastMultiplier = daysInPeriod / 90;
    
    const forecastedRevenue = Math.round(expectedRevenue + (historicalRevenue * forecastMultiplier * 0.3));
    const confidenceLow = Math.round(forecastedRevenue * 0.7);
    const confidenceHigh = Math.round(forecastedRevenue * 1.3);

    // Calculate growth rate
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const recentOrders = orders.filter(o => new Date(o.created_date) >= new Date(thirtyDaysAgo));
    const previousOrders = orders.filter(o => 
      new Date(o.created_date) >= new Date(sixtyDaysAgo) && 
      new Date(o.created_date) < new Date(thirtyDaysAgo)
    );

    const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const growthRate = previousRevenue > 0 
      ? ((recentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return Response.json({
      success: true,
      period,
      forecast: {
        expected_revenue: forecastedRevenue,
        confidence_range: {
          low: confidenceLow,
          high: confidenceHigh
        },
        based_on_leads: pipelineLeads.length,
        expected_conversions: Math.round(pipelineLeads.length * conversionRate)
      },
      historical: {
        revenue_90d: historicalRevenue,
        orders_90d: orders.length,
        leads_90d: leads.length,
        conversion_rate: Math.round(conversionRate * 100),
        avg_order_value: Math.round(avgOrderValue),
        growth_rate_30d: Math.round(growthRate * 10) / 10
      },
      top_opportunities: predictions
        .sort((a, b) => b.expected_value - a.expected_value)
        .slice(0, 10)
    });

  } catch (error) {
    console.error('Revenue forecast error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));