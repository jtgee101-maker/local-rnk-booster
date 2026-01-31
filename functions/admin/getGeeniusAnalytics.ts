import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
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

    // Fetch Geenius events
    const [currentEvents, previousEvents, leads] = await Promise.all([
      base44.asServiceRole.entities.ConversionEvent.filter({
        funnel_version: 'geenius',
        created_date: { $gte: startDate }
      }),
      base44.asServiceRole.entities.ConversionEvent.filter({
        funnel_version: 'geenius',
        created_date: { $gte: previousStartDate, $lt: startDate }
      }),
      base44.asServiceRole.entities.Lead.filter({
        created_date: { $gte: startDate }
      })
    ]);

    // Calculate metrics
    const quizStarts = currentEvents.filter(e => e.event_name === 'quiz_started').length;
    const resultsViewed = currentEvents.filter(e => e.event_name === 'results_viewed').length;
    const pathway1Clicks = currentEvents.filter(e => e.event_name === 'pathway1_clicked').length;
    const pathway2Clicks = currentEvents.filter(e => e.event_name === 'pathway2_clicked').length;
    const pathway3Clicks = currentEvents.filter(e => e.event_name === 'pathway3_clicked').length;
    const pathwaySelections = pathway1Clicks + pathway2Clicks + pathway3Clicks;
    const emailCaptures = currentEvents.filter(e => e.event_name === 'email_captured').length;

    // Calculate conversion rates
    const quizToResults = quizStarts > 0 ? ((resultsViewed / quizStarts) * 100).toFixed(1) : '0.0';
    const resultsToPathway = resultsViewed > 0 ? ((pathwaySelections / resultsViewed) * 100).toFixed(1) : '0.0';
    const pathwayToConversion = pathwaySelections > 0 ? ((pathway3Clicks / pathwaySelections) * 100).toFixed(1) : '0.0';
    const overallConversion = quizStarts > 0 ? ((pathwaySelections / quizStarts) * 100).toFixed(1) : '0.0';
    const emailCaptureRate = resultsViewed > 0 ? ((emailCaptures / resultsViewed) * 100).toFixed(1) : '0.0';

    // Calculate trends
    const prevQuizStarts = previousEvents.filter(e => e.event_name === 'quiz_started').length;
    const prevPathwaySelections = previousEvents.filter(e => 
      ['pathway1_clicked', 'pathway2_clicked', 'pathway3_clicked'].includes(e.event_name)
    ).length;

    const startsTrend = prevQuizStarts > 0 ? (((quizStarts - prevQuizStarts) / prevQuizStarts) * 100) : 0;
    const pathwayTrend = prevPathwaySelections > 0 ? (((pathwaySelections - prevPathwaySelections) / prevPathwaySelections) * 100) : 0;

    // Session metrics
    const uniqueSessions = new Set(currentEvents.map(e => e.session_id)).size;
    const bounceRate = uniqueSessions > 0 
      ? ((currentEvents.filter(e => {
          const sessionEvents = currentEvents.filter(ev => ev.session_id === e.session_id);
          return sessionEvents.length === 1;
        }).length / uniqueSessions) * 100).toFixed(1)
      : 0;

    // Average session duration
    const sessionDurations = currentEvents
      .filter(e => e.properties?.time_on_step)
      .map(e => e.properties.time_on_step);
    const avgSessionDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
      : 0;

    const minutes = Math.floor(avgSessionDuration / 60);
    const seconds = avgSessionDuration % 60;

    // Health score distribution
    const healthScoreDistribution = {
      critical: leads.filter(l => l.health_score >= 0 && l.health_score <= 25).length,
      poor: leads.filter(l => l.health_score > 25 && l.health_score <= 50).length,
      fair: leads.filter(l => l.health_score > 50 && l.health_score <= 75).length,
      good: leads.filter(l => l.health_score > 75).length
    };

    // Exit points
    const exitEvents = currentEvents.filter(e => e.event_name.includes('exit') || e.event_name.includes('abandon'));
    const exitPointsMap = {};
    exitEvents.forEach(e => {
      const step = e.properties?.step || 'unknown';
      exitPointsMap[step] = (exitPointsMap[step] || 0) + 1;
    });

    const exitPoints = Object.entries(exitPointsMap).map(([step, count]) => ({
      step,
      count,
      percentage: ((count / exitEvents.length) * 100).toFixed(1)
    }));

    // Pain points
    const painPointsMap = {};
    leads.forEach(lead => {
      if (lead.pain_point) {
        painPointsMap[lead.pain_point] = (painPointsMap[lead.pain_point] || 0) + 1;
      }
    });

    const painPoints = Object.entries(painPointsMap).map(([painPoint, count]) => ({
      painPoint,
      label: painPoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }));

    // Categories
    const categoriesMap = {};
    leads.forEach(lead => {
      if (lead.business_category) {
        categoriesMap[lead.business_category] = (categoriesMap[lead.business_category] || 0) + 1;
      }
    });

    const categories = Object.entries(categoriesMap).map(([category, count]) => ({
      category,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }));

    // Avg health score
    const avgHealthScore = leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.health_score || 0), 0) / leads.length)
      : 0;

    return Response.json({
      success: true,
      metrics: {
        totalStarts: quizStarts,
        resultsViewed: resultsViewed,
        pathwaySelections: pathwaySelections,
        pathway1Clicks: pathway1Clicks,
        pathway2Clicks: pathway2Clicks,
        pathway3Clicks: pathway3Clicks,
        totalConversions: pathwaySelections,
        totalEmailCaptures: emailCaptures,
        totalLeads: leads.length,
        avgHealthScore: avgHealthScore,
        avgSessionTime: `${minutes}m ${seconds}s`
      },
      funnel: {
        startToResults: parseFloat(quizToResults),
        resultsToPathway: parseFloat(resultsToPathway),
        pathwayToConversion: parseFloat(pathwayToConversion),
        overallConversion: parseFloat(overallConversion),
        emailCaptureRate: parseFloat(emailCaptureRate)
      },
      trends: {
        starts: startsTrend,
        results: 0,
        pathways: pathwayTrend,
        conversions: pathwayTrend,
        leads: 0
      },
      sessions: {
        uniqueSessions: uniqueSessions,
        avgSessionDuration: avgSessionDuration,
        bounceRate: parseFloat(bounceRate)
      },
      exitPoints: exitPoints,
      painPoints: painPoints,
      categories: categories,
      healthScoreDistribution: healthScoreDistribution,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get Geenius analytics error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to get Geenius analytics',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'getGeeniusAnalytics' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to get Geenius analytics',
      details: error.message 
    }, { status: 500 });
  }
});