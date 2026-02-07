import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

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

    // Fetch Geenius events - use list() then filter client-side for better compatibility
    const [allEvents, leads] = await Promise.all([
      base44.asServiceRole.entities.ConversionEvent.list('-created_date', 10000),
      base44.asServiceRole.entities.Lead.list('-created_date', 1000)
    ]);

    // Filter events client-side
    const currentEvents = allEvents.filter(e => 
      e.funnel_version === 'geenius' && 
      new Date(e.created_date) >= new Date(startDate)
    );
    
    const previousEvents = allEvents.filter(e => 
      e.funnel_version === 'geenius' && 
      new Date(e.created_date) >= new Date(previousStartDate) &&
      new Date(e.created_date) < new Date(startDate)
    );
    
    const currentLeads = leads.filter(l => new Date(l.created_date) >= new Date(startDate));

    // Calculate metrics
    const quizStarts = currentEvents.filter(e => e.event_name === 'quiz_started').length;
    const quizCompleted = currentEvents.filter(e => e.event_name === 'quiz_completed').length;
    const resultsViewed = currentEvents.filter(e => e.event_name === 'results_viewed').length;
    const bridgeViewed = currentEvents.filter(e => e.event_name === 'bridge_viewed').length;
    const pathway1Clicks = currentEvents.filter(e => e.event_name === 'pathway_govtech_grant_clicked').length;
    const pathway2Clicks = currentEvents.filter(e => e.event_name === 'pathway_done_for_you_clicked').length;
    const pathway3Clicks = currentEvents.filter(e => e.event_name === 'pathway_diy_software_clicked').length;
    const pathwaySelections = pathway1Clicks + pathway2Clicks + pathway3Clicks;
    const emailCaptures = quizCompleted; // Email captured during quiz completion

    // Calculate conversion rates
    const quizToResults = quizStarts > 0 ? ((resultsViewed / quizStarts) * 100).toFixed(1) : '0.0';
    const resultsToPathway = resultsViewed > 0 ? ((pathwaySelections / resultsViewed) * 100).toFixed(1) : '0.0';
    const pathwayToConversion = pathwaySelections > 0 ? ((pathwaySelections / pathwaySelections) * 100).toFixed(1) : '0.0';
    const overallConversion = quizStarts > 0 ? ((pathwaySelections / quizStarts) * 100).toFixed(1) : '0.0';
    const emailCaptureRate = quizStarts > 0 ? ((emailCaptures / quizStarts) * 100).toFixed(1) : '0.0';

    // Calculate trends
    const prevQuizStarts = previousEvents.filter(e => e.event_name === 'quiz_started').length;
    const prevResultsViewed = previousEvents.filter(e => e.event_name === 'results_viewed').length;
    const prevPathwaySelections = previousEvents.filter(e => 
      ['pathway_govtech_grant_clicked', 'pathway_done_for_you_clicked', 'pathway_diy_software_clicked'].includes(e.event_name)
    ).length;
    const prevLeads = leads.filter(l => 
      new Date(l.created_date) >= new Date(previousStartDate) &&
      new Date(l.created_date) < new Date(startDate)
    );

    const startsTrend = prevQuizStarts > 0 ? (((quizStarts - prevQuizStarts) / prevQuizStarts) * 100) : (quizStarts > 0 ? 100 : 0);
    const resultsTrend = prevResultsViewed > 0 ? (((resultsViewed - prevResultsViewed) / prevResultsViewed) * 100) : (resultsViewed > 0 ? 100 : 0);
    const pathwayTrend = prevPathwaySelections > 0 ? (((pathwaySelections - prevPathwaySelections) / prevPathwaySelections) * 100) : (pathwaySelections > 0 ? 100 : 0);
    const leadsTrend = prevLeads.length > 0 ? (((currentLeads.length - prevLeads.length) / prevLeads.length) * 100) : (currentLeads.length > 0 ? 100 : 0);

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
      critical: currentLeads.filter(l => l.health_score >= 0 && l.health_score <= 25).length,
      poor: currentLeads.filter(l => l.health_score > 25 && l.health_score <= 50).length,
      fair: currentLeads.filter(l => l.health_score > 50 && l.health_score <= 75).length,
      good: currentLeads.filter(l => l.health_score > 75).length
    };

    // Exit points - calculate dropout between stages
    const exitPointsMap = {
      'quiz_started_no_complete': quizStarts - quizCompleted,
      'results_no_bridge': resultsViewed - bridgeViewed,
      'bridge_no_pathway': bridgeViewed - pathwaySelections
    };

    const totalDropoffs = Object.values(exitPointsMap).reduce((sum, val) => sum + val, 0);
    const exitPoints = Object.entries(exitPointsMap)
      .filter(([step, count]) => count > 0)
      .map(([step, count]) => ({
        step,
        count,
        percentage: totalDropoffs > 0 ? ((count / totalDropoffs) * 100).toFixed(1) : '0.0'
      }));

    // Pain points
    const painPointsMap = {};
    currentLeads.forEach(lead => {
      if (lead.pain_point) {
        painPointsMap[lead.pain_point] = (painPointsMap[lead.pain_point] || 0) + 1;
      }
    });

    const painPoints = Object.entries(painPointsMap).map(([painPoint, count]) => ({
      painPoint,
      label: painPoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: currentLeads.length > 0 ? ((count / currentLeads.length) * 100).toFixed(1) : '0.0'
    }));

    // Categories
    const categoriesMap = {};
    currentLeads.forEach(lead => {
      if (lead.business_category) {
        categoriesMap[lead.business_category] = (categoriesMap[lead.business_category] || 0) + 1;
      }
    });

    const categories = Object.entries(categoriesMap).map(([category, count]) => ({
      category,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: currentLeads.length > 0 ? ((count / currentLeads.length) * 100).toFixed(1) : '0.0'
    }));

    // Avg health score
    const avgHealthScore = currentLeads.length > 0
      ? Math.round(currentLeads.reduce((sum, l) => sum + (l.health_score || 0), 0) / currentLeads.length)
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
        totalLeads: currentLeads.length,
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
        results: resultsTrend,
        pathways: pathwayTrend,
        conversions: pathwayTrend,
        leads: leadsTrend
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