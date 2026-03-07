import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Generate AI-Powered Action Plan
 * Analyzes GMB audit data and creates personalized optimization roadmap
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

    const businessName = lead.business_name || 'Business';
    const healthScore = lead.health_score || 0;
    const criticalIssues = lead.critical_issues || [];

    // Prepare prompt for AI analysis
    const prompt = `You are a Google My Business optimization expert. Analyze this business and create a detailed action plan.

Business: ${businessName}
Category: ${lead.business_category || 'Not specified'}
Current Health Score: ${healthScore}/100
GMB Rating: ${lead.gmb_rating || 'N/A'}/5
Review Count: ${lead.gmb_reviews_count || 0}
Photos: ${lead.gmb_photos_count || 0}
Has Business Hours: ${lead.gmb_has_hours ? 'Yes' : 'No'}

Critical Issues Identified:
${criticalIssues.join('\n')}

Goals: ${(lead.goals || []).join(', ')}
Timeline: ${lead.timeline || 'Not specified'}

Generate a comprehensive action plan with:
1. Executive summary of findings
2. Priority level (urgent/high/medium/low)
3. Estimated impact of optimizations
4. 10-15 specific, actionable recommendations categorized by: SEO, Content, Reviews, Photos, Citations, Technical
5. For each action: priority (1-5), estimated effort (hours), expected impact (low/medium/high)
6. A 90-day roadmap broken into 3 phases: Week 1-4, Week 5-8, Week 9-12

Be specific, actionable, and data-driven.`;

    // Call AI to generate action plan
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          priority_level: { type: "string", enum: ["urgent", "high", "medium", "low"] },
          estimated_impact: { type: "string" },
          recommended_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                action: { type: "string" },
                priority: { type: "number" },
                estimated_effort: { type: "string" },
                expected_impact: { type: "string" }
              }
            }
          },
          roadmap: {
            type: "object",
            properties: {
              week_1_4: { type: "array", items: { type: "string" } },
              week_5_8: { type: "array", items: { type: "string" } },
              week_9_12: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    });

    // Add status to each action
    const actionsWithStatus = aiResponse.recommended_actions.map(action => ({
      ...action,
      status: 'pending'
    }));

    // Create ActionPlan entity
    const actionPlan = await base44.asServiceRole.entities.ActionPlan.create({
      lead_id,
      business_name: businessName,
      health_score: healthScore,
      critical_issues: criticalIssues,
      ai_analysis: {
        summary: aiResponse.summary,
        priority_level: aiResponse.priority_level,
        estimated_impact: aiResponse.estimated_impact
      },
      recommended_actions: actionsWithStatus,
      roadmap: aiResponse.roadmap,
      status: 'active'
    });

    // Update lead with action plan reference
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      admin_notes: (lead.admin_notes || '') + `\n[${new Date().toISOString()}] AI Action Plan generated (ID: ${actionPlan.id})`
    });

    return Response.json({ 
      success: true, 
      action_plan_id: actionPlan.id,
      summary: aiResponse.summary,
      total_actions: actionsWithStatus.length
    });

  } catch (error) {
    console.error('Error generating action plan:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});