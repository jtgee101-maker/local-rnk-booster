import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Returns real-time system status and health metrics for admin dashboard
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    let user;
    try {
      user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch (authError) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch critical metrics
    const [leads, orders, errors, emailLogs, automations] = await Promise.all([
      base44.asServiceRole.entities.Lead.filter({}).catch(() => []),
      base44.asServiceRole.entities.Order.filter({}).catch(() => []),
      base44.asServiceRole.entities.ErrorLog.filter({ resolved: false }).catch(() => []),
      base44.asServiceRole.entities.EmailLog.filter({}).catch(() => []),
      base44.asServiceRole.entities.LeadNurture.filter({ status: 'active' }).catch(() => [])
    ]);

    // Calculate health score
    const unresolvedErrors = errors.length;
    const failedEmails = emailLogs.filter(e => e.status === 'failed').length;
    const activeAutomations = automations.length;
    
    let healthScore = 100;
    if (unresolvedErrors > 10) healthScore -= 30;
    else if (unresolvedErrors > 5) healthScore -= 15;
    else if (unresolvedErrors > 0) healthScore -= 5;
    
    if (failedEmails > 20) healthScore -= 20;
    else if (failedEmails > 10) healthScore -= 10;
    
    const healthStatus = healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'warning' : 'critical';

    // Recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentLeads = leads.filter(l => l.created_date >= oneDayAgo).length;
    const recentOrders = orders.filter(o => o.created_date >= oneDayAgo).length;

    return Response.json({
      success: true,
      health: {
        score: healthScore,
        status: healthStatus
      },
      metrics: {
        total_leads: leads.length,
        total_orders: orders.length,
        unresolved_errors: unresolvedErrors,
        failed_emails: failedEmails,
        active_automations: activeAutomations,
        recent_leads_24h: recentLeads,
        recent_orders_24h: recentOrders
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching system status:', error);
    return Response.json({ 
      error: 'Failed to fetch system status',
      details: error.message 
    }, { status: 500 });
  }
});