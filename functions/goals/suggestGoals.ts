import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-Powered Goal Suggestions
 * Analyzes client industry and performance to suggest SMART goals
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id' }, { status: 400 });
    }

    // Fetch lead data
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch latest metrics snapshot for current baseline
    const snapshots = await base44.asServiceRole.entities.GMBMetricsHistory.filter(
      { lead_id },
      '-snapshot_date',
      1
    );
    const latestSnapshot = snapshots[0];

    const businessName = lead.business_name || 'Business';
    const category = lead.business_category || 'general';
    const healthScore = lead.health_score || 0;
    const rating = lead.gmb_rating || 0;
    const reviewCount = lead.gmb_reviews_count || 0;

    const prompt = `You are a GMB optimization strategist. Analyze this business and suggest 4-6 SMART goals.

Business: ${businessName}
Industry: ${category}
Current Health Score: ${healthScore}/100
Rating: ${rating}/5
Reviews: ${reviewCount}
${latestSnapshot ? `Recent Metrics: ${JSON.stringify(latestSnapshot.metrics)}` : ''}

For each goal, provide:
- goal_type (phone_calls, reviews, profile_views, direction_requests, ranking, health_score)
- title (concise, actionable)
- description (SMART format: Specific, Measurable, Achievable, Relevant, Time-bound)
- baseline_value (current state)
- target_value (realistic 90-day target based on industry benchmarks)
- unit (%, calls, reviews, points, etc.)
- rationale (why this goal matters)

Focus on high-impact, achievable goals that align with industry standards.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          goals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                goal_type: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                baseline_value: { type: "number" },
                target_value: { type: "number" },
                unit: { type: "string" },
                rationale: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({ 
      success: true,
      suggested_goals: aiResponse.goals,
      business_name: businessName
    });

  } catch (error) {
    console.error('Error suggesting goals:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});