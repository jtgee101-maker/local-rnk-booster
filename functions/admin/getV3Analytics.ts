import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * V3 Analytics Backend Function
 * Provides robust, performant analytics for the V3 funnel with:
 * - Server-side data aggregation
 * - Optimized database queries
 * - Comprehensive metrics calculation
 * - Trend analysis and comparisons
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body for time range
    let timeRange = '7d';
    try {
      const body = await req.json();
      timeRange = body.timeRange || '7d';
    } catch {
      // Default to 7d if no body
    }

    // Calculate date boundaries
    const now = new Date();
    const daysMap = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[timeRange] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch all required data in parallel for performance
    const [allEvents, allLeads] = await Promise.all([
      base44.asServiceRole.entities.ConversionEvent.filter({ funnel_version: 'v3' }),
      base44.asServiceRole.entities.Lead.list('-created_date', 5000)
    ]);

    // Filter events by date range
    const currentPeriodEvents = allEvents.filter(e => {
      const date = new Date(e.created_date);
      return date >= startDate && date <= now;
    });

    const previousPeriodEvents = allEvents.filter(e => {
      const date = new Date(e.created_date);
      return date >= previousPeriodStart && date < startDate;
    });

    // Filter leads by date range (V3 leads have pain_point)
    const currentLeads = allLeads.filter(l => {
      const date = new Date(l.created_date);
      return l.pain_point && date >= startDate && date <= now;
    });

    const previousLeads = allLeads.filter(l => {
      const date = new Date(l.created_date);
      return l.pain_point && date >= previousPeriodStart && date < startDate;
    });

    // ========== CORE METRICS ==========
    const calculateMetrics = (events, leads) => {
      const starts = events.filter(e => e.event_name === 'quizv3_started').length;
      const completions = events.filter(e => e.event_name === 'quizv3_completed').length;
      const ctaClicks = events.filter(e => e.event_name === 'quizv3_affiliate_cta_clicked').length;
      const redirects = events.filter(e => e.event_name === 'affiliate_redirect_initiated').length;
      const emailCaptures = events.filter(e => e.event_name === 'quizv3_email_captured').length;

      // Health score calculation
      const avgHealthScore = leads.length > 0
        ? Math.round(leads.reduce((sum, l) => sum + (l.health_score || 0), 0) / leads.length)
        : 0;

      // Conversion rates
      const startToComplete = starts > 0 ? ((completions / starts) * 100) : 0;
      const completeToCTA = completions > 0 ? ((ctaClicks / completions) * 100) : 0;
      const ctaToRedirect = ctaClicks > 0 ? ((redirects / ctaClicks) * 100) : 0;
      const overallConversion = starts > 0 ? ((redirects / starts) * 100) : 0;
      const emailCaptureRate = completions > 0 ? ((emailCaptures / completions) * 100) : 0;

      return {
        starts, completions, ctaClicks, redirects, emailCaptures,
        avgHealthScore, startToComplete, completeToCTA, ctaToRedirect,
        overallConversion, emailCaptureRate, totalLeads: leads.length
      };
    };

    const current = calculateMetrics(currentPeriodEvents, currentLeads);
    const previous = calculateMetrics(previousPeriodEvents, previousLeads);

    // ========== TREND CALCULATIONS ==========
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const trends = {
      starts: calculateTrend(current.starts, previous.starts),
      completions: calculateTrend(current.completions, previous.completions),
      ctaClicks: calculateTrend(current.ctaClicks, previous.ctaClicks),
      redirects: calculateTrend(current.redirects, previous.redirects),
      leads: calculateTrend(current.totalLeads, previous.totalLeads),
      conversionRate: calculateTrend(current.overallConversion, previous.overallConversion)
    };

    // ========== SESSION ANALYSIS ==========
    const sessionIds = [...new Set(currentPeriodEvents.map(e => e.session_id).filter(Boolean))];
    
    const sessionMetrics = sessionIds.map(sessionId => {
      const sessionEvents = currentPeriodEvents
        .filter(e => e.session_id === sessionId)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      if (sessionEvents.length === 0) return null;

      const firstEvent = sessionEvents[0];
      const lastEvent = sessionEvents[sessionEvents.length - 1];
      const duration = (new Date(lastEvent.created_date) - new Date(firstEvent.created_date)) / 1000;
      
      const hasStarted = sessionEvents.some(e => e.event_name === 'quizv3_started');
      const hasCompleted = sessionEvents.some(e => e.event_name === 'quizv3_completed');
      const hasRedirected = sessionEvents.some(e => e.event_name === 'affiliate_redirect_initiated');
      const hasCapturedEmail = sessionEvents.some(e => e.event_name === 'quizv3_email_captured');

      // Get last step for exit analysis
      const lastStepEvent = [...sessionEvents].reverse().find(e => e.properties?.step);
      const lastStep = lastStepEvent?.properties?.step || 'unknown';

      return {
        sessionId,
        duration,
        eventCount: sessionEvents.length,
        hasStarted,
        hasCompleted,
        hasRedirected,
        hasCapturedEmail,
        lastStep,
        isBounce: sessionEvents.length === 1
      };
    }).filter(Boolean);

    const uniqueSessions = sessionMetrics.length;
    const avgSessionDuration = uniqueSessions > 0
      ? Math.round(sessionMetrics.reduce((sum, s) => sum + s.duration, 0) / uniqueSessions)
      : 0;
    
    const bounces = sessionMetrics.filter(s => s.isBounce).length;
    const bounceRate = uniqueSessions > 0 ? ((bounces / uniqueSessions) * 100).toFixed(1) : '0.0';

    // ========== STEP ANALYSIS ==========
    const stepViews = {};
    const stepCompletions = {};
    const stepTimes = {};

    currentPeriodEvents.forEach(e => {
      const step = e.properties?.step;
      if (!step) return;

      if (e.event_name === 'quizv3_step_viewed') {
        stepViews[step] = (stepViews[step] || 0) + 1;
      }
      if (e.event_name === 'quizv3_step_completed') {
        stepCompletions[step] = (stepCompletions[step] || 0) + 1;
      }
      if (e.time_on_step) {
        if (!stepTimes[step]) stepTimes[step] = [];
        stepTimes[step].push(e.time_on_step);
      }
    });

    const avgStepTimes = Object.entries(stepTimes).reduce((acc, [step, times]) => {
      acc[step] = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
      return acc;
    }, {});

    // ========== EXIT POINTS ANALYSIS ==========
    const exitPoints = {};
    sessionMetrics.filter(s => !s.hasCompleted && s.hasStarted).forEach(session => {
      const step = session.lastStep;
      exitPoints[step] = (exitPoints[step] || 0) + 1;
    });

    // Sort and get top exit points
    const topExitPoints = Object.entries(exitPoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([step, count]) => ({
        step,
        count,
        percentage: uniqueSessions > 0 ? ((count / uniqueSessions) * 100).toFixed(1) : '0.0'
      }));

    // ========== PAIN POINT DISTRIBUTION ==========
    const painPointDist = {};
    currentLeads.forEach(lead => {
      const pp = lead.pain_point || 'unknown';
      painPointDist[pp] = (painPointDist[pp] || 0) + 1;
    });

    const painPointBreakdown = Object.entries(painPointDist)
      .sort((a, b) => b[1] - a[1])
      .map(([painPoint, count]) => ({
        painPoint,
        count,
        percentage: currentLeads.length > 0 ? ((count / currentLeads.length) * 100).toFixed(1) : '0.0',
        label: {
          not_in_map_pack: 'Not in Map Pack',
          low_reviews: 'Low Reviews',
          no_calls: 'No Calls',
          not_optimized: 'Not Optimized'
        }[painPoint] || painPoint
      }));

    // ========== BUSINESS CATEGORY DISTRIBUTION ==========
    const categoryDist = {};
    currentLeads.forEach(lead => {
      const cat = lead.business_category || 'unknown';
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryDist)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        percentage: currentLeads.length > 0 ? ((count / currentLeads.length) * 100).toFixed(1) : '0.0',
        label: {
          home_services: 'Home Services',
          medical: 'Medical',
          retail: 'Retail',
          professional: 'Professional',
          other: 'Other'
        }[category] || category
      }));

    // ========== DAILY BREAKDOWN ==========
    const dailyStats = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { starts: 0, completions: 0, redirects: 0, leads: 0 };
    }

    currentPeriodEvents.forEach(e => {
      const dateStr = new Date(e.created_date).toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        if (e.event_name === 'quizv3_started') dailyStats[dateStr].starts++;
        if (e.event_name === 'quizv3_completed') dailyStats[dateStr].completions++;
        if (e.event_name === 'affiliate_redirect_initiated') dailyStats[dateStr].redirects++;
      }
    });

    currentLeads.forEach(l => {
      const dateStr = new Date(l.created_date).toISOString().split('T')[0];
      if (dailyStats[dateStr]) dailyStats[dateStr].leads++;
    });

    const dailyBreakdown = Object.entries(dailyStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => ({ date, ...stats }));

    // ========== HEALTH SCORE DISTRIBUTION ==========
    const healthScoreBuckets = {
      critical: 0,    // 0-25
      poor: 0,        // 26-50
      fair: 0,        // 51-75
      good: 0         // 76-100
    };

    currentLeads.forEach(lead => {
      const score = lead.health_score || 0;
      if (score <= 25) healthScoreBuckets.critical++;
      else if (score <= 50) healthScoreBuckets.poor++;
      else if (score <= 75) healthScoreBuckets.fair++;
      else healthScoreBuckets.good++;
    });

    // ========== RESPONSE ==========
    return Response.json({
      success: true,
      timeRange,
      generatedAt: now.toISOString(),
      
      // Core metrics
      metrics: {
        totalStarts: current.starts,
        totalCompletions: current.completions,
        totalCTAClicks: current.ctaClicks,
        totalRedirects: current.redirects,
        totalEmailCaptures: current.emailCaptures,
        totalLeads: current.totalLeads,
        avgHealthScore: current.avgHealthScore
      },

      // Conversion funnel
      funnel: {
        startToComplete: parseFloat(current.startToComplete.toFixed(1)),
        completeToCTA: parseFloat(current.completeToCTA.toFixed(1)),
        ctaToRedirect: parseFloat(current.ctaToRedirect.toFixed(1)),
        overallConversion: parseFloat(current.overallConversion.toFixed(1)),
        emailCaptureRate: parseFloat(current.emailCaptureRate.toFixed(1))
      },

      // Trends (comparison to previous period)
      trends: {
        starts: parseFloat(trends.starts.toFixed(1)),
        completions: parseFloat(trends.completions.toFixed(1)),
        ctaClicks: parseFloat(trends.ctaClicks.toFixed(1)),
        redirects: parseFloat(trends.redirects.toFixed(1)),
        leads: parseFloat(trends.leads.toFixed(1)),
        conversionRate: parseFloat(trends.conversionRate.toFixed(1))
      },

      // Session behavior
      sessions: {
        uniqueSessions,
        avgSessionDuration,
        bounceRate: parseFloat(bounceRate)
      },

      // Step analytics
      steps: {
        views: stepViews,
        completions: stepCompletions,
        avgTimes: avgStepTimes
      },

      // Exit analysis
      exitPoints: topExitPoints,

      // Distributions
      painPoints: painPointBreakdown,
      categories: categoryBreakdown,
      healthScoreDistribution: healthScoreBuckets,

      // Daily breakdown for charts
      daily: dailyBreakdown
    });

  } catch (error) {
    console.error('V3 Analytics Error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});