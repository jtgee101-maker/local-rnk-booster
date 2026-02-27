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
    const { timeRange = '7d' } = body;

    const timeRangeMap = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };

    const timeMs = timeRangeMap[timeRange] || timeRangeMap['7d'];
    const startDate = new Date(Date.now() - timeMs).toISOString();
    const previousStartDate = new Date(Date.now() - timeMs * 2).toISOString();

    // Fetch V2 events and orders
    const [currentEvents, previousEvents, orders, leads] = await Promise.all([
      base44.asServiceRole.entities.ConversionEvent.filter({
        funnel_version: 'v2',
        created_date: { $gte: startDate }
      }),
      base44.asServiceRole.entities.ConversionEvent.filter({
        funnel_version: 'v2',
        created_date: { $gte: previousStartDate, $lt: startDate }
      }),
      base44.asServiceRole.entities.Order.filter({
        created_date: { $gte: startDate }
      }),
      base44.asServiceRole.entities.Lead.filter({
        created_date: { $gte: startDate }
      })
    ]);

    // Calculate metrics
    const quizStarts = currentEvents.filter(e => e.event_name === 'quiz_started').length;
    const reachedPricing = currentEvents.filter(e => e.event_name === 'pricing_viewed').length;
    const checkoutInitiated = currentEvents.filter(e => e.event_name === 'checkout_initiated').length;
    const paidCustomers = orders.filter(o => o.status === 'completed').length;

    // Conversion rates
    const quizToPricing = quizStarts > 0 ? ((reachedPricing / quizStarts) * 100).toFixed(1) : '0.0';
    const pricingToCheckout = reachedPricing > 0 ? ((checkoutInitiated / reachedPricing) * 100).toFixed(1) : '0.0';
    const checkoutToPayment = checkoutInitiated > 0 ? ((paidCustomers / checkoutInitiated) * 100).toFixed(1) : '0.0';
    const overallConversion = quizStarts > 0 ? ((paidCustomers / quizStarts) * 100).toFixed(1) : '0.0';

    // Trends
    const prevQuizStarts = previousEvents.filter(e => e.event_name === 'quiz_started').length;
    const prevOrders = await base44.asServiceRole.entities.Order.filter({
      status: 'completed',
      created_date: { $gte: previousStartDate, $lt: startDate }
    });

    const startsTrend = prevQuizStarts > 0 ? (((quizStarts - prevQuizStarts) / prevQuizStarts) * 100) : 0;
    const customersTrend = prevOrders.length > 0 ? (((paidCustomers - prevOrders.length) / prevOrders.length) * 100) : 0;

    // Revenue
    const totalRevenue = orders.filter(o => (o as { status?: string }).status === 'completed')
      .reduce((sum, o) => sum + ((o as { total_amount?: number }).total_amount || 0), 0);

    // Session metrics
    const uniqueSessions = new Set(currentEvents.map(e => (e as { session_id?: string }).session_id)).size;
    const avgSessionDuration = Math.round(
      currentEvents.filter(e => (e as { time_on_step?: number }).time_on_step).reduce((sum, e) => sum + ((e as { time_on_step?: number }).time_on_step || 0), 0) / 
      Math.max(currentEvents.filter(e => (e as { time_on_step?: number }).time_on_step).length, 1)
    );

    const minutes = Math.floor(avgSessionDuration / 60);
    const seconds = avgSessionDuration % 60;
    const bounceRate = quizStarts > 0 ? (100 - (reachedPricing / quizStarts) * 100).toFixed(1) : '0.0';

    // Health score distribution
    const healthScoreDistribution = {
      critical: leads.filter(l => ((l as { health_score?: number }).health_score || 0) >= 0 && ((l as { health_score?: number }).health_score || 0) <= 25).length,
      poor: leads.filter(l => ((l as { health_score?: number }).health_score || 0) > 25 && ((l as { health_score?: number }).health_score || 0) <= 50).length,
      fair: leads.filter(l => ((l as { health_score?: number }).health_score || 0) > 50 && ((l as { health_score?: number }).health_score || 0) <= 75).length,
      good: leads.filter(l => ((l as { health_score?: number }).health_score || 0) > 75).length
    };

    // Pain points and categories (same as V3/Geenius)
    const painPointsMap: Record<string, number> = {};
    leads.forEach(lead => {
      const painPoint = (lead as { pain_point?: string }).pain_point;
      if (painPoint) {
        painPointsMap[painPoint] = (painPointsMap[painPoint] || 0) + 1;
      }
    });

    const painPoints = Object.entries(painPointsMap).map(([painPoint, count]) => ({
      painPoint,
      label: painPoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: leads.length > 0 ? (((count as number) / leads.length) * 100).toFixed(1) : '0.0'
    }));

    const categoriesMap: Record<string, number> = {};
    leads.forEach(lead => {
      const businessCategory = (lead as { business_category?: string }).business_category;
      if (businessCategory) {
        categoriesMap[businessCategory] = (categoriesMap[businessCategory] || 0) + 1;
      }
    });

    const categories = Object.entries(categoriesMap).map(([category, count]) => ({
      category,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: leads.length > 0 ? (((count as number) / leads.length) * 100).toFixed(1) : '0.0'
    }));

    const avgHealthScore = leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + ((l as { health_score?: number }).health_score || 0), 0) / leads.length)
      : 0;

    return Response.json({
      success: true,
      metrics: {
        totalStarts: quizStarts,
        reachedPricing: reachedPricing,
        checkoutInitiated: checkoutInitiated,
        paidCustomers: paidCustomers,
        totalRevenue: totalRevenue,
        totalLeads: leads.length,
        avgHealthScore: avgHealthScore,
        avgSessionTime: `${minutes}m ${seconds}s`
      },
      funnel: {
        startToPricing: parseFloat(quizToPricing),
        pricingToCheckout: parseFloat(pricingToCheckout),
        checkoutToPayment: parseFloat(checkoutToPayment),
        overallConversion: parseFloat(overallConversion)
      },
      trends: {
        starts: startsTrend,
        pricing: 0,
        checkout: 0,
        customers: customersTrend,
        leads: 0
      },
      sessions: {
        uniqueSessions: uniqueSessions,
        avgSessionDuration: avgSessionDuration,
        bounceRate: parseFloat(bounceRate)
      },
      exitPoints: [],
      painPoints: painPoints,
      categories: categories,
      healthScoreDistribution: healthScoreDistribution,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get V2 analytics error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to get V2 analytics',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'getV2Analytics' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to get V2 analytics',
      details: error.message 
    }, { status: 500 });
  }
}));