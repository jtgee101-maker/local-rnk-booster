import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Pathway-level funnel analytics:
 * - Drop-off at each stage per pathway (grant / dfy / diy)
 * - Conversion rate & AOV per pathway
 * - A/B variant performance if variant data exists in event properties
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [allEvents, leads, orders] = await Promise.all([
      base44.asServiceRole.entities.ConversionEvent.filter(
        { funnel_version: 'geenius' }, '-created_date', 10000
      ),
      base44.asServiceRole.entities.Lead.list('-created_date', 5000),
      base44.asServiceRole.entities.Order.filter({ status: 'completed' }, '-created_date', 5000),
    ]);

    // Funnel stages in order
    const STAGES = [
      { key: 'quiz_started',       label: 'Quiz Started' },
      { key: 'quiz_completed',     label: 'Quiz Completed' },
      { key: 'results_viewed',     label: 'Results Viewed' },
      { key: 'bridge_viewed',      label: 'Bridge Viewed' },
      { key: 'pathway_clicked',    label: 'Pathway Clicked' },
      { key: 'order_completed',    label: 'Converted' },
    ];

    // Count global funnel stages
    const stageCounts = {};
    STAGES.forEach(s => { stageCounts[s.key] = 0; });

    allEvents.forEach(e => {
      if (e.event_name === 'quiz_started')   stageCounts.quiz_started++;
      if (e.event_name === 'quiz_completed') stageCounts.quiz_completed++;
      if (e.event_name === 'results_viewed') stageCounts.results_viewed++;
      if (e.event_name === 'bridge_viewed')  stageCounts.bridge_viewed++;
      if (['pathway_govtech_grant_clicked','pathway_done_for_you_clicked','pathway_diy_software_clicked'].includes(e.event_name)) {
        stageCounts.pathway_clicked++;
      }
    });
    stageCounts.order_completed = orders.length;

    // Build funnel with drop-off
    const globalFunnel = STAGES.map((stage, i) => {
      const count = stageCounts[stage.key] || 0;
      const prev = i === 0 ? count : (stageCounts[STAGES[i - 1].key] || 1);
      const dropOffPct = i === 0 ? 0 : (100 - Math.round((count / Math.max(prev, 1)) * 100));
      return { ...stage, count, dropOffPct };
    });

    // Per-pathway breakdown
    const PATHWAY_EVENTS = {
      grant: 'pathway_govtech_grant_clicked',
      dfy:   'pathway_done_for_you_clicked',
      diy:   'pathway_diy_software_clicked',
    };

    const pathwayStats = {};
    for (const [key, eventName] of Object.entries(PATHWAY_EVENTS)) {
      const clicks = allEvents.filter(e => e.event_name === eventName);
      const clicksThisMonth = clicks.filter(e => e.created_date >= monthStart);
      const clicksLastMonth = clicks.filter(e => e.created_date >= lastMonthStart && e.created_date < monthStart);

      // Match orders to pathway by lead's selected_pathway
      const pathwayLeads = leads.filter(l => l.selected_pathway === key);
      const pathwayLeadIds = new Set(pathwayLeads.map(l => l.id));
      const convertedLeads = pathwayLeads.filter(l => l.status === 'converted');
      
      const pathwayOrders = orders.filter(o => pathwayLeadIds.has(o.lead_id));
      const pathwayRevenue = pathwayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const aov = pathwayOrders.length > 0 ? (pathwayRevenue / pathwayOrders.length) : 0;
      const convRate = clicks.length > 0 ? ((convertedLeads.length / clicks.length) * 100).toFixed(1) : '0';
      const bridgeViews = allEvents.filter(e => e.event_name === 'bridge_viewed').length;
      const clickThroughRate = bridgeViews > 0 ? ((clicks.length / bridgeViews) * 100).toFixed(1) : '0';

      // A/B variant breakdown (stored in event properties.variant)
      const variantMap = {};
      clicks.forEach(e => {
        const v = e.properties?.variant || 'default';
        if (!variantMap[v]) variantMap[v] = { clicks: 0, conversions: 0 };
        variantMap[v].clicks++;
      });
      convertedLeads.forEach(l => {
        const variant = 'default'; // extend when variant tracking is added
        if (variantMap[variant]) variantMap[variant].conversions++;
      });

      const variants = Object.entries(variantMap).map(([name, data]) => ({
        name,
        clicks: data.clicks,
        conversions: data.conversions,
        convRate: data.clicks > 0 ? ((data.conversions / data.clicks) * 100).toFixed(1) : '0',
      }));

      const mom = clicksLastMonth.length > 0
        ? (((clicksThisMonth.length - clicksLastMonth.length) / clicksLastMonth.length) * 100).toFixed(1)
        : '0';

      pathwayStats[key] = {
        totalClicks: clicks.length,
        thisMonth: clicksThisMonth.length,
        lastMonth: clicksLastMonth.length,
        mom: `${Number(mom) >= 0 ? '+' : ''}${mom}%`,
        totalLeads: pathwayLeads.length,
        convertedLeads: convertedLeads.length,
        convRate: `${convRate}%`,
        clickThroughRate: `${clickThroughRate}%`,
        revenue: pathwayRevenue.toFixed(2),
        aov: aov.toFixed(2),
        orders: pathwayOrders.length,
        variants,
      };
    }

    // Nurture sequences config per pathway (read from AppSettings)
    let nurtureConfig = {};
    try {
      const settings = await base44.asServiceRole.entities.AppSettings.filter({
        setting_key: 'pathway_nurture_config'
      });
      if (settings.length > 0) nurtureConfig = settings[0].setting_value;
    } catch (_) {}

    return Response.json({
      globalFunnel,
      pathwayStats,
      nurtureConfig,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + (o.total_amount || 0), 0).toFixed(2),
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});