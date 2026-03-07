import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Automated Health Check - runs hourly via scheduled automation.
 * Checks DB, email, payments, error rates, and data quality.
 * Sends alert to admin users if critical failures found.
 */
Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const checks = await Promise.all([
      checkDatabase(base44),
      checkEmailSystem(base44),
      checkPaymentSystem(base44),
      checkErrorRates(base44),
      checkDataQuality(base44)
    ]);

    const summary = checks.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
    const overallStatus = summary.fail > 0 ? 'critical' : summary.warn > 0 ? 'warning' : 'healthy';
    const executionTime = Date.now() - startTime;

    await base44.asServiceRole.entities.HealthCheck.create({
      overall_status: overallStatus,
      checks,
      passed: summary.pass || 0,
      warnings: summary.warn || 0,
      failures: summary.fail || 0,
      execution_time_ms: executionTime
    });

    if (overallStatus === 'critical') {
      await sendCriticalAlert(base44, checks.filter(c => c.status === 'fail'));
    }

    return Response.json({
      success: true,
      overall_status: overallStatus,
      summary: { passed: summary.pass || 0, warnings: summary.warn || 0, failures: summary.fail || 0 },
      execution_time_ms: executionTime,
      checks
    });

  } catch (error) {
    console.error('Health check error:', error);
    return Response.json({ success: false, error: error.message, execution_time_ms: Date.now() - startTime }, { status: 500 });
  }
});

async function checkDatabase(base44) {
  try {
    const start = Date.now();
    await base44.asServiceRole.entities.Lead.list('-created_date', 5);
    const duration = Date.now() - start;
    return { name: 'Database Performance', status: duration < 3000 ? 'pass' : 'warn', message: `Query time: ${duration}ms`, duration_ms: duration };
  } catch (error) {
    return { name: 'Database Performance', status: 'fail', message: 'Database error', error: error.message };
  }
}

async function checkEmailSystem(base44) {
  try {
    const recentLogs = await base44.asServiceRole.entities.EmailLog.list('-created_date', 50);
    if (recentLogs.length === 0) return { name: 'Email System', status: 'warn', message: 'No recent email activity' };
    const failureRate = recentLogs.filter(l => l.status === 'failed').length / recentLogs.length;
    return {
      name: 'Email System',
      status: failureRate < 0.1 ? 'pass' : failureRate < 0.3 ? 'warn' : 'fail',
      message: `${(failureRate * 100).toFixed(1)}% failure rate`,
      total_emails: recentLogs.length,
      failed: recentLogs.filter(l => l.status === 'failed').length
    };
  } catch (error) {
    return { name: 'Email System', status: 'fail', message: 'Email check failed', error: error.message };
  }
}

async function checkPaymentSystem(base44) {
  try {
    const recentOrders = await base44.asServiceRole.entities.Order.list('-created_date', 20);
    if (recentOrders.length === 0) return { name: 'Payment System', status: 'warn', message: 'No recent orders' };
    const failedOrders = recentOrders.filter(o => o.status === 'failed').length;
    const failureRate = failedOrders / recentOrders.length;
    return {
      name: 'Payment System',
      status: failureRate < 0.1 ? 'pass' : failureRate < 0.3 ? 'warn' : 'fail',
      message: `${(failureRate * 100).toFixed(1)}% failure rate`,
      total_orders: recentOrders.length,
      failed: failedOrders
    };
  } catch (error) {
    return { name: 'Payment System', status: 'fail', message: 'Payment check failed', error: error.message };
  }
}

async function checkErrorRates(base44) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentErrors = await base44.asServiceRole.entities.ErrorLog.filter({
      created_date: { $gte: oneHourAgo }
    }, '-created_date', 100);
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical' && !e.resolved);
    return {
      name: 'Error Monitoring',
      status: criticalErrors.length === 0 ? 'pass' : criticalErrors.length < 5 ? 'warn' : 'fail',
      message: criticalErrors.length === 0 ? 'No critical errors' : `${criticalErrors.length} unresolved critical errors`,
      total_errors_last_hour: recentErrors.length,
      critical_unresolved: criticalErrors.length
    };
  } catch (error) {
    return { name: 'Error Monitoring', status: 'warn', message: 'Error check inconclusive', error: error.message };
  }
}

async function checkDataQuality(base44) {
  try {
    const recentLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 50);
    const invalidLeads = recentLeads.filter(l => !l.email || !l.email.includes('@') || !l.business_name);
    const invalidRate = recentLeads.length > 0 ? invalidLeads.length / recentLeads.length : 0;
    return {
      name: 'Data Quality',
      status: invalidRate < 0.05 ? 'pass' : invalidRate < 0.2 ? 'warn' : 'fail',
      message: `${(invalidRate * 100).toFixed(1)}% invalid records`,
      total_checked: recentLeads.length,
      invalid: invalidLeads.length
    };
  } catch (error) {
    return { name: 'Data Quality', status: 'fail', message: 'Data quality check failed', error: error.message };
  }
}

async function sendCriticalAlert(base44, failedChecks) {
  try {
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const alertBody = `🚨 CRITICAL HEALTH CHECK ALERT\n\nFailed checks:\n${failedChecks.map(c => `❌ ${c.name}: ${c.message}`).join('\n')}\n\nTime: ${new Date().toISOString()}`;
    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: '🚨 CRITICAL: System Health Check Failed',
        body: alertBody
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Failed to send critical alert:', error);
  }
}