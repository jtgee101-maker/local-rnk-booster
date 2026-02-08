import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Dynamic Segment Creation & Management
 * Auto-creates and updates audience segments based on ML predictions
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action = 'refresh_all' } = await req.json();

    if (action === 'refresh_all') {
      // Get ML predictions
      const [leadQuality, churnRisk] = await Promise.all([
        base44.asServiceRole.functions.invoke('analytics/predictLeadQuality', { batch_mode: true }),
        base44.asServiceRole.functions.invoke('analytics/predictChurnRisk', {})
      ]);

      const leads = leadQuality.data.leads || [];
      const atRiskCustomers = churnRisk.data.customers || [];

      // Define segment definitions
      const segmentDefinitions = [
        {
          name: 'Hot Leads - Urgent Action',
          description: 'Leads with 75+ quality score, ready to convert',
          type: 'dynamic',
          criteria: { lead_score_min: 75, status: ['new', 'contacted', 'qualified'] },
          filterFn: (lead) => lead.score >= 75 && lead.priority === 'Hot',
          sourceData: leads,
          email_personalization: {
            subject_prefix: '⚡ URGENT: ',
            cta_urgency: 'high',
            include_case_studies: true,
            show_live_calendar: true
          },
          optimal_send_times: ['09:00', '14:00', '16:00']
        },
        {
          name: 'Warm Prospects',
          description: 'Leads with 60-74 score, need nurturing',
          type: 'dynamic',
          criteria: { lead_score_min: 60, lead_score_max: 74 },
          filterFn: (lead) => lead.score >= 60 && lead.score < 75,
          sourceData: leads,
          email_personalization: {
            subject_prefix: '',
            cta_urgency: 'medium',
            include_testimonials: true,
            show_roi_calculator: true
          },
          optimal_send_times: ['10:00', '15:00']
        },
        {
          name: 'High Health Score Leads',
          description: 'Leads with good GMB (70+), may not realize need',
          type: 'dynamic',
          criteria: { health_score_min: 70 },
          filterFn: (lead) => (lead.health_score || 0) >= 70,
          sourceData: leads,
          email_personalization: {
            focus: 'untapped_potential',
            show_competitor_comparison: true,
            emphasize_ranking_improvement: true
          },
          optimal_send_times: ['11:00', '16:00']
        },
        {
          name: 'Low Health Score Leads',
          description: 'Critical GMB issues (<40), high urgency',
          type: 'dynamic',
          criteria: { health_score_max: 40 },
          filterFn: (lead) => (lead.health_score || 0) < 40,
          sourceData: leads,
          email_personalization: {
            focus: 'critical_issues',
            show_revenue_loss: true,
            emphasize_quick_wins: true,
            cta_urgency: 'critical'
          },
          optimal_send_times: ['09:00', '13:00']
        },
        {
          name: 'Critical Churn Risk',
          description: 'Customers at high risk of cancellation',
          type: 'dynamic',
          criteria: { risk_level: ['Critical', 'High'] },
          filterFn: (customer) => ['Critical', 'High'].includes(customer.risk_level),
          sourceData: atRiskCustomers,
          email_personalization: {
            focus: 'retention',
            include_special_offer: true,
            show_success_stories: true,
            personal_outreach: true
          },
          optimal_send_times: ['10:00', '15:00']
        },
        {
          name: 'Home Services - Priority',
          description: 'Home services businesses (highest conversion)',
          type: 'dynamic',
          criteria: { category: 'home_services' },
          filterFn: (lead) => lead.business_category === 'home_services',
          sourceData: leads,
          email_personalization: {
            industry_specific: true,
            show_home_services_case_studies: true
          },
          optimal_send_times: ['08:00', '17:00']
        },
        {
          name: 'Recent Abandoners',
          description: 'Started quiz but did not complete in last 7 days',
          type: 'dynamic',
          criteria: { abandoned_quiz: true, days_since_start: 7 },
          filterFn: (lead) => {
            const daysSince = (Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24);
            return lead.status === 'new' && daysSince <= 7 && !lead.email;
          },
          sourceData: leads,
          email_personalization: {
            focus: 'completion_incentive',
            offer_discount: true
          },
          optimal_send_times: ['10:00', '19:00']
        }
      ];

      // Create or update segments
      const updatedSegments = [];

      for (const segDef of segmentDefinitions) {
        const matchingLeads = segDef.sourceData.filter(segDef.filterFn);
        const leadIds = matchingLeads.map(l => l.lead_id || l.id);

        // Calculate segment metrics
        const conversionRate = await calculateSegmentConversionRate(base44, leadIds);
        const avgLTV = await calculateSegmentLTV(base44, leadIds);

        // Check if segment exists
        const existingSegments = await base44.asServiceRole.entities.Segment.filter({
          name: segDef.name
        }, 'created_date', 1);

        const segmentData = {
          ...segDef,
          lead_ids: leadIds,
          member_count: leadIds.length,
          conversion_rate: conversionRate,
          avg_ltv: avgLTV,
          last_updated: new Date().toISOString(),
          is_active: true
        };

        delete segmentData.filterFn;
        delete segmentData.sourceData;

        let segment;
        if (existingSegments.length > 0) {
          segment = await base44.asServiceRole.entities.Segment.update(
            existingSegments[0].id,
            segmentData
          );
        } else {
          segment = await base44.asServiceRole.entities.Segment.create(segmentData);
        }

        updatedSegments.push(segment);
      }

      return Response.json({
        success: true,
        segments_updated: updatedSegments.length,
        segments: updatedSegments
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Segment creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

async function calculateSegmentConversionRate(base44, leadIds) {
  if (leadIds.length === 0) return 0;

  const convertedCount = await base44.asServiceRole.entities.Lead.filter({
    id: { $in: leadIds },
    status: 'converted'
  }, 'created_date', 1000);

  return Math.round((convertedCount.length / leadIds.length) * 100);
}

async function calculateSegmentLTV(base44, leadIds) {
  if (leadIds.length === 0) return 0;

  const orders = await base44.asServiceRole.entities.Order.filter({
    lead_id: { $in: leadIds },
    status: 'completed'
  }, 'created_date', 1000);

  if (orders.length === 0) return 0;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  return Math.round(totalRevenue / leadIds.length);
}