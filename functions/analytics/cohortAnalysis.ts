import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Cohort Analysis
 * Compare lead quality by month, traffic source, business category
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { cohort_type = 'monthly', months = 6 } = await req.json();

    if (cohort_type === 'monthly') {
      return Response.json(await getMonthlyCohorts(base44, months));
    } else if (cohort_type === 'category') {
      return Response.json(await getCategoryCohorts(base44));
    } else if (cohort_type === 'source') {
      return Response.json(await getSourceCohorts(base44));
    }

    return Response.json({ error: 'Invalid cohort_type' }, { status: 400 });

  } catch (error) {
    console.error('Cohort analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getMonthlyCohorts(base44, months) {
  const cohorts = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const startDate = cohortDate.toISOString();
    const endDate = nextMonth.toISOString();

    // Get leads created in this month
    const leads = await base44.asServiceRole.entities.Lead.filter({
      created_date: { $gte: startDate, $lt: endDate }
    }, '-created_date', 1000);

    // Get orders for these leads
    const leadIds = leads.map(l => l.id);
    const orders = await base44.asServiceRole.entities.Order.filter({
      lead_id: { $in: leadIds },
      status: 'completed'
    }, 'created_date', 1000);

    // Calculate cohort metrics
    const totalLeads = leads.length;
    const convertedLeads = new Set(orders.map(o => o.lead_id)).size;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgHealthScore = leads.reduce((sum, l) => sum + (l.health_score || 0), 0) / totalLeads || 0;

    // Calculate retention (leads that returned/purchased in subsequent months)
    const retentionData = await calculateRetention(base44, leadIds, endDate);

    cohorts.push({
      cohort: cohortDate.toISOString().slice(0, 7), // YYYY-MM
      total_leads: totalLeads,
      converted_leads: convertedLeads,
      conversion_rate: totalLeads > 0 ? convertedLeads / totalLeads : 0,
      total_revenue: totalRevenue,
      avg_health_score: Math.round(avgHealthScore),
      avg_ltv: convertedLeads > 0 ? totalRevenue / convertedLeads : 0,
      retention: retentionData
    });
  }

  return {
    success: true,
    cohort_type: 'monthly',
    cohorts: cohorts.reverse() // Oldest first
  };
}

async function getCategoryCohorts(base44) {
  const categories = ['home_services', 'medical', 'retail', 'professional', 'other'];
  const cohorts = [];

  for (const category of categories) {
    const leads = await base44.asServiceRole.entities.Lead.filter({
      business_category: category
    }, '-created_date', 1000);

    const leadIds = leads.map(l => l.id);
    const orders = await base44.asServiceRole.entities.Order.filter({
      lead_id: { $in: leadIds },
      status: 'completed'
    }, 'created_date', 1000);

    const totalLeads = leads.length;
    const convertedLeads = new Set(orders.map(o => o.lead_id)).size;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgHealthScore = leads.reduce((sum, l) => sum + (l.health_score || 0), 0) / totalLeads || 0;

    cohorts.push({
      category,
      total_leads: totalLeads,
      converted_leads: convertedLeads,
      conversion_rate: totalLeads > 0 ? convertedLeads / totalLeads : 0,
      total_revenue: totalRevenue,
      avg_health_score: Math.round(avgHealthScore),
      avg_ltv: convertedLeads > 0 ? totalRevenue / convertedLeads : 0
    });
  }

  return {
    success: true,
    cohort_type: 'category',
    cohorts
  };
}

async function getSourceCohorts(base44) {
  const leads = await base44.asServiceRole.entities.Lead.filter({}, '-created_date', 1000);
  const sourceGroups = {};

  for (const lead of leads) {
    // Get first event to determine source
    const events = await base44.asServiceRole.entities.ConversionEvent.filter({
      lead_id: lead.id
    }, 'created_date', 1);

    const source = events[0]?.properties?.utm_source || 
                   events[0]?.properties?.referrer || 
                   'direct';

    if (!sourceGroups[source]) {
      sourceGroups[source] = {
        leads: [],
        orders: []
      };
    }

    sourceGroups[source].leads.push(lead);
  }

  // Get orders for each source
  const cohorts = [];
  for (const [source, data] of Object.entries(sourceGroups)) {
    const leadIds = data.leads.map(l => l.id);
    const orders = await base44.asServiceRole.entities.Order.filter({
      lead_id: { $in: leadIds },
      status: 'completed'
    }, 'created_date', 1000);

    const totalLeads = data.leads.length;
    const convertedLeads = new Set(orders.map(o => o.lead_id)).size;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgHealthScore = data.leads.reduce((sum, l) => sum + (l.health_score || 0), 0) / totalLeads || 0;

    cohorts.push({
      source,
      total_leads: totalLeads,
      converted_leads: convertedLeads,
      conversion_rate: totalLeads > 0 ? convertedLeads / totalLeads : 0,
      total_revenue: totalRevenue,
      avg_health_score: Math.round(avgHealthScore),
      avg_ltv: convertedLeads > 0 ? totalRevenue / convertedLeads : 0
    });
  }

  return {
    success: true,
    cohort_type: 'source',
    cohorts: cohorts.sort((a, b) => b.total_revenue - a.total_revenue)
  };
}

async function calculateRetention(base44, leadIds, cohortEndDate) {
  // Check how many leads had activity in Month 1, 2, 3 after cohort
  const retentionMonths = 3;
  const retention = {};

  for (let month = 1; month <= retentionMonths; month++) {
    const monthStart = new Date(new Date(cohortEndDate).setMonth(new Date(cohortEndDate).getMonth() + month - 1));
    const monthEnd = new Date(new Date(cohortEndDate).setMonth(new Date(cohortEndDate).getMonth() + month));

    const activeLeads = await base44.asServiceRole.entities.ConversionEvent.filter({
      lead_id: { $in: leadIds },
      created_date: { $gte: monthStart.toISOString(), $lt: monthEnd.toISOString() }
    }, 'created_date', 1000);

    const uniqueActiveLeads = new Set(activeLeads.map(e => e.lead_id)).size;
    retention[`month_${month}`] = {
      active_leads: uniqueActiveLeads,
      retention_rate: leadIds.length > 0 ? uniqueActiveLeads / leadIds.length : 0
    };
  }

  return retention;
}