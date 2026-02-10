import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-Powered Performance Insights Generator
 * Analyzes GMB metrics, detects anomalies, and forecasts future performance
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, report_type = 'weekly' } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id' }, { status: 400 });
    }

    // Fetch lead data
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch metrics history
    const snapshots = await base44.asServiceRole.entities.GMBMetricsHistory.filter(
      { lead_id },
      '-snapshot_date',
      30
    );

    // Fetch goals
    const goals = await base44.asServiceRole.entities.ClientGoal.filter({ lead_id });

    // Fetch action plan
    const actionPlans = await base44.asServiceRole.entities.ActionPlan.filter({ lead_id });
    const actionPlan = actionPlans[0];

    if (snapshots.length < 2) {
      return Response.json({ 
        error: 'Insufficient data for insights. Need at least 2 metric snapshots.',
        message: 'Please wait for more data to be collected.'
      }, { status: 400 });
    }

    const businessName = lead.business_name || 'Business';
    const currentSnapshot = snapshots[0];
    const previousSnapshot = snapshots[1];
    const oldestSnapshot = snapshots[snapshots.length - 1];

    // Calculate metric changes
    const healthScoreChange = currentSnapshot.metrics.health_score - previousSnapshot.metrics.health_score;
    const reviewsGained = currentSnapshot.metrics.reviews_count - oldestSnapshot.metrics.reviews_count;
    const ratingChange = currentSnapshot.metrics.gmb_rating - oldestSnapshot.metrics.gmb_rating;
    const photosAdded = currentSnapshot.metrics.photos_count - oldestSnapshot.metrics.photos_count;

    // Prepare data for AI
    const metricsData = snapshots.map(s => ({
      date: s.snapshot_date,
      health_score: s.metrics.health_score,
      rating: s.metrics.gmb_rating,
      reviews: s.metrics.reviews_count,
      photos: s.metrics.photos_count,
      views: s.metrics.profile_views,
      calls: s.metrics.phone_calls,
      directions: s.metrics.direction_requests
    }));

    const prompt = `You are a GMB optimization analyst. Analyze this business's performance data and generate comprehensive insights.

Business: ${businessName}
Report Type: ${report_type}
Data Points: ${metricsData.length} snapshots

Current Metrics:
- Health Score: ${currentSnapshot.metrics.health_score}/100
- Rating: ${currentSnapshot.metrics.gmb_rating}/5
- Reviews: ${currentSnapshot.metrics.reviews_count}
- Photos: ${currentSnapshot.metrics.photos_count}
- Views: ${currentSnapshot.metrics.profile_views || 'N/A'}
- Calls: ${currentSnapshot.metrics.phone_calls || 'N/A'}

Recent Changes:
- Health Score: ${healthScoreChange > 0 ? '+' : ''}${healthScoreChange.toFixed(1)} points
- Reviews: ${reviewsGained > 0 ? '+' : ''}${reviewsGained} reviews
- Rating: ${ratingChange > 0 ? '+' : ''}${ratingChange.toFixed(2)} stars
- Photos: ${photosAdded > 0 ? '+' : ''}${photosAdded} photos

Historical Data:
${JSON.stringify(metricsData, null, 2)}

Active Goals:
${goals.map(g => `- ${g.title}: ${g.progress_percentage}% complete`).join('\n')}

${actionPlan ? `Action Plan Progress: ${actionPlan.recommended_actions.filter(a => a.status === 'completed').length}/${actionPlan.recommended_actions.length} actions completed` : ''}

Generate insights including:
1. narrative_summary: Engaging 2-3 paragraph narrative about performance trends and what they mean for the business
2. anomalies: Array of detected unusual changes or issues (metric, description, severity: high/medium/low, recommendation)
3. forecasts: Array of predictions for key metrics at 30/60/90 days (metric, current_value, predicted_value_30d/60d/90d, confidence: high/medium/low)
4. highlights: Array of 3-5 positive wins or achievements
5. alerts: Array of 2-4 important items requiring attention

Focus on actionable insights, specific numbers, and clear recommendations.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          narrative_summary: { type: "string" },
          anomalies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                metric: { type: "string" },
                description: { type: "string" },
                severity: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          forecasts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                metric: { type: "string" },
                current_value: { type: "number" },
                predicted_value_30d: { type: "number" },
                predicted_value_60d: { type: "number" },
                predicted_value_90d: { type: "number" },
                confidence: { type: "string" }
              }
            }
          },
          highlights: {
            type: "array",
            items: { type: "string" }
          },
          alerts: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Calculate period dates
    const periodEnd = new Date();
    const periodStart = new Date();
    if (report_type === 'weekly') {
      periodStart.setDate(periodStart.getDate() - 7);
    } else {
      periodStart.setMonth(periodStart.getMonth() - 1);
    }

    // Create insight record
    const insight = await base44.asServiceRole.entities.AIInsight.create({
      lead_id,
      business_name: businessName,
      report_type,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      narrative_summary: aiResponse.narrative_summary,
      key_metrics: {
        health_score_change: healthScoreChange,
        reviews_gained: reviewsGained,
        rating_change: ratingChange,
        photos_added: photosAdded
      },
      anomalies: aiResponse.anomalies || [],
      forecasts: aiResponse.forecasts || [],
      highlights: aiResponse.highlights || [],
      alerts: aiResponse.alerts || []
    });

    return Response.json({ 
      success: true,
      insight_id: insight.id,
      insight: aiResponse
    });

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});