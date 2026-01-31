import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { test_id } = body;

    if (!test_id) {
      return Response.json({ error: 'test_id is required' }, { status: 400 });
    }

    const test = await base44.asServiceRole.entities.ABTest.get(test_id);
    if (!test) {
      return Response.json({ error: 'Test not found' }, { status: 404 });
    }

    const events = await base44.asServiceRole.entities.ABTestEvent.filter({ test_id });

    const variantStats = {};
    
    for (const variant of test.variants) {
      const variantEvents = events.filter(e => e.variant_id === variant.id);
      const views = variantEvents.filter(e => e.event_type === 'view').length;
      const conversions = variantEvents.filter(e => e.event_type === 'conversion').length;
      const conversionRate = views > 0 ? (conversions / views) * 100 : 0;
      
      const totalValue = variantEvents
        .filter(e => e.event_type === 'conversion' && e.conversion_value)
        .reduce((sum, e) => sum + (e.conversion_value || 0), 0);

      variantStats[variant.id] = {
        name: variant.name,
        views,
        conversions,
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
        total_value: totalValue,
        avg_value: conversions > 0 ? parseFloat((totalValue / conversions).toFixed(2)) : 0
      };
    }

    // Determine winner
    const sortedVariants = Object.entries(variantStats).sort(
      (a, b) => b[1].conversion_rate - a[1].conversion_rate
    );
    
    const winner = sortedVariants.length > 0 ? sortedVariants[0][0] : null;
    const winnerStats = winner ? variantStats[winner] : null;

    // Calculate statistical significance (simplified)
    const hasSignificance = sortedVariants[0]?.[1].views >= 100 && 
                           sortedVariants[0]?.[1].conversions >= 10;

    return Response.json({
      success: true,
      test,
      variant_stats: variantStats,
      winner: winner ? {
        variant_id: winner,
        stats: winnerStats,
        is_significant: hasSignificance
      } : null,
      total_events: events.length
    });

  } catch (error) {
    console.error('Get test results error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to get A/B test results',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'getTestResults' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to get test results',
      details: error.message 
    }, { status: 500 });
  }
});