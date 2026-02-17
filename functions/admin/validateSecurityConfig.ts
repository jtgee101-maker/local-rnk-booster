import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const checks = [];
    let criticalIssues = 0;
    let warnings = 0;

    // Check 1: Environment Variables
    const requiredEnvVars = ['RESEND_API_KEY', 'GOOGLE_MAPS_API_KEY', 'ADMIN_ACCESS_KEY'];
    const missingEnvVars = [];
    
    for (const envVar of requiredEnvVars) {
      const exists = Deno.env.get(envVar);
      if (!exists) {
        missingEnvVars.push(envVar);
      }
    }

    checks.push({
      name: 'Environment Variables',
      status: missingEnvVars.length === 0 ? 'pass' : 'fail',
      message: missingEnvVars.length === 0 
        ? 'All required environment variables are set'
        : `Missing: ${missingEnvVars.join(', ')}`,
      severity: 'critical'
    });

    if (missingEnvVars.length > 0) criticalIssues++;

    // Check 2: Admin Users
    const users = await base44.asServiceRole.entities.User.list();
    const adminUsers = users.filter(u => u.role === 'admin');
    
    checks.push({
      name: 'Admin Users',
      status: adminUsers.length > 0 && adminUsers.length <= 5 ? 'pass' : 'warning',
      message: `Found ${adminUsers.length} admin user(s)`,
      severity: adminUsers.length === 0 ? 'critical' : 'info'
    });

    if (adminUsers.length === 0) criticalIssues++;
    if (adminUsers.length > 5) warnings++;

    // Check 3: Recent Error Logs
    const recentErrors = await base44.asServiceRole.entities.ErrorLog.filter({
      severity: 'critical',
      created_date: { $gte: new Date(Date.now() - 24 * 3600000).toISOString() }
    });

    checks.push({
      name: 'Critical Errors (24h)',
      status: recentErrors.length === 0 ? 'pass' : 'warning',
      message: `${recentErrors.length} critical error(s) in last 24 hours`,
      severity: recentErrors.length > 10 ? 'critical' : 'warning'
    });

    if (recentErrors.length > 10) criticalIssues++;
    if (recentErrors.length > 0 && recentErrors.length <= 10) warnings++;

    // Check 4: Failed Emails
    const failedEmails = await base44.asServiceRole.entities.EmailLog.filter({
      status: 'failed',
      created_date: { $gte: new Date(Date.now() - 24 * 3600000).toISOString() }
    });

    checks.push({
      name: 'Email Deliverability (24h)',
      status: failedEmails.length < 10 ? 'pass' : 'warning',
      message: `${failedEmails.length} failed email(s) in last 24 hours`,
      severity: failedEmails.length > 50 ? 'critical' : 'warning'
    });

    if (failedEmails.length > 50) criticalIssues++;
    if (failedEmails.length >= 10 && failedEmails.length <= 50) warnings++;

    // Check 5: Unresolved Errors
    const unresolvedErrors = await base44.asServiceRole.entities.ErrorLog.filter({
      resolved: false,
      severity: { $in: ['critical', 'high'] }
    });

    checks.push({
      name: 'Unresolved Issues',
      status: unresolvedErrors.length === 0 ? 'pass' : 'warning',
      message: `${unresolvedErrors.length} unresolved high/critical error(s)`,
      severity: unresolvedErrors.length > 20 ? 'critical' : 'warning'
    });

    if (unresolvedErrors.length > 20) criticalIssues++;
    if (unresolvedErrors.length > 0 && unresolvedErrors.length <= 20) warnings++;

    // Check 6: Database Health
    const leads = await base44.asServiceRole.entities.Lead.list(undefined, 1);
    const orders = await base44.asServiceRole.entities.Order.list(undefined, 1);
    
    checks.push({
      name: 'Database Connectivity',
      status: 'pass',
      message: 'All entities accessible',
      severity: 'info'
    });

    const overallStatus = criticalIssues > 0 ? 'critical' : warnings > 0 ? 'warning' : 'healthy';

    return Response.json({
      success: true,
      overall_status: overallStatus,
      critical_issues: criticalIssues,
      warnings: warnings,
      passed: checks.filter(c => c.status === 'pass').length,
      checks: checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Security validation error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'critical',
        message: 'Security validation failed',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'validateSecurityConfig' }
      });
    } catch {}

    return Response.json({ 
      error: 'Security validation failed',
      details: error.message 
    }, { status: 500 });
  }
}));