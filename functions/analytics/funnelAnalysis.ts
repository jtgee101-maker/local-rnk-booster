import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Funnel Drop-off Analysis
 * Identify exactly where users exit and why
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { funnel_version = 'v3', date_range } = await req.json();
    const startDate = date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = date_range?.end || new Date().toISOString();

    // Define funnel stages
    const stages = [
      { name: 'Page View', event: `${funnel_version}_page_viewed` },
      { name: 'Quiz Started', event: `${funnel_version}_started` },
      { name: 'Quiz Completed', event: `${funnel_version}_completed` },
      { name: 'Pricing Viewed', event: 'pricing_page_viewed' },
      { name: 'Checkout Started', event: 'checkout_started' },
      { name: 'Payment Completed', event: 'payment_completed' }
    ];

    const funnelData = [];
    let previousStageCount = 0;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      const events = await base44.asServiceRole.entities.ConversionEvent.filter({
        funnel_version,
        event_name: stage.event,
        created_date: { $gte: startDate, $lte: endDate }
      });

      const uniqueSessions = new Set(events.map(e => e.session_id)).size;
      const dropoffRate = i > 0 && previousStageCount > 0 
        ? ((previousStageCount - uniqueSessions) / previousStageCount) * 100 
        : 0;
      const conversionRate = i > 0 && funnelData[0]?.count > 0
        ? (uniqueSessions / funnelData[0].count) * 100
        : 100;

      // Get avg time on stage
      const avgTimeOnStage = await calculateAvgTimeOnStage(base44, funnel_version, stage.event, startDate, endDate);

      // Get exit reasons for this stage
      const exitReasons = await analyzeExitReasons(base44, funnel_version, stage.event, stages[i + 1]?.event, startDate, endDate);

      funnelData.push({
        stage: stage.name,
        count: uniqueSessions,
        dropoff_from_previous: i > 0 ? previousStageCount - uniqueSessions : 0,
        dropoff_rate: Math.round(dropoffRate * 10) / 10,
        conversion_rate: Math.round(conversionRate * 10) / 10,
        avg_time_seconds: avgTimeOnStage,
        exit_reasons: exitReasons
      });

      previousStageCount = uniqueSessions;
    }

    // Calculate overall funnel efficiency
    const topOfFunnel = funnelData[0]?.count || 0;
    const bottomOfFunnel = funnelData[funnelData.length - 1]?.count || 0;
    const overallConversion = topOfFunnel > 0 ? (bottomOfFunnel / topOfFunnel) * 100 : 0;

    // Get orders for revenue
    const orders = await base44.asServiceRole.entities.Order.filter({
      status: 'completed',
      created_date: { $gte: startDate, $lte: endDate }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return Response.json({
      success: true,
      funnel_version,
      date_range: { start: startDate, end: endDate },
      overall_conversion_rate: Math.round(overallConversion * 10) / 10,
      total_revenue: totalRevenue,
      revenue_per_visitor: topOfFunnel > 0 ? totalRevenue / topOfFunnel : 0,
      stages: funnelData
    });

  } catch (error) {
    console.error('Funnel analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

async function calculateAvgTimeOnStage(base44, funnelVersion, currentEvent, startDate, endDate) {
  const events = await base44.asServiceRole.entities.ConversionEvent.filter({
    funnel_version: funnelVersion,
    event_name: currentEvent,
    created_date: { $gte: startDate, $lte: endDate }
  }, 'created_date', 1000);

  if (events.length === 0) return 0;

  const timesOnStage = events
    .filter(e => e.time_on_step)
    .map(e => e.time_on_step);

  if (timesOnStage.length === 0) return 0;

  const avgTime = timesOnStage.reduce((sum, t) => sum + t, 0) / timesOnStage.length;
  return Math.round(avgTime);
}

async function analyzeExitReasons(base44, funnelVersion, currentEvent, nextEvent, startDate, endDate) {
  if (!nextEvent) return [];

  // Get sessions that reached current stage
  const currentEvents = await base44.asServiceRole.entities.ConversionEvent.filter({
    funnel_version: funnelVersion,
    event_name: currentEvent,
    created_date: { $gte: startDate, $lte: endDate }
  }, 'created_date', 1000);

  const currentSessions = new Set(currentEvents.map(e => e.session_id));

  // Get sessions that reached next stage
  const nextEvents = await base44.asServiceRole.entities.ConversionEvent.filter({
    funnel_version: funnelVersion,
    event_name: nextEvent,
    created_date: { $gte: startDate, $lte: endDate }
  }, 'created_date', 1000);

  const nextSessions = new Set(nextEvents.map(e => e.session_id));

  // Find sessions that exited
  const exitedSessions = [...currentSessions].filter(s => !nextSessions.has(s));

  // Analyze exit patterns
  const exitReasons = {
    exit_intent_triggered: 0,
    back_button_clicked: 0,
    spent_too_long: 0, // >5 min on stage
    quick_exit: 0 // <10 seconds on stage
  };

  for (const sessionId of exitedSessions.slice(0, 100)) { // Sample first 100
    const sessionEvents = await base44.asServiceRole.entities.ConversionEvent.filter({
      session_id: sessionId,
      funnel_version: funnelVersion
    }, 'created_date', 100);

    const hasExitIntent = sessionEvents.some(e => e.event_name.includes('exit_intent'));
    const hasBackClick = sessionEvents.some(e => e.event_name.includes('back_clicked'));
    
    const currentStageEvent = sessionEvents.find(e => e.event_name === currentEvent);
    const timeOnStage = currentStageEvent?.time_on_step || 0;

    if (hasExitIntent) exitReasons.exit_intent_triggered++;
    if (hasBackClick) exitReasons.back_button_clicked++;
    if (timeOnStage > 300) exitReasons.spent_too_long++; // >5 min
    if (timeOnStage < 10) exitReasons.quick_exit++; // <10 sec
  }

  return Object.entries(exitReasons)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => ({
      reason: reason.replace(/_/g, ' '),
      count,
      percentage: Math.round((count / exitedSessions.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}