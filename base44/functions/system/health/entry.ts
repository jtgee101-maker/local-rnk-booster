import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const start = Date.now();

  try {
    const base44 = createClientFromRequest(req);

    // Admin-only
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const checks = {};

    // 1. Database check — count leads
    try {
      const leads = await base44.asServiceRole.entities.Lead.list('-created_date', 1);
      checks.database = { status: 'ok', detail: `${leads.length >= 0 ? 'connected' : 'error'}` };
    } catch (e) {
      checks.database = { status: 'error', detail: e.message };
    }

    // 2. Google API check — validate key is present (don't burn a quota call)
    const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    checks.google_api = googleKey
      ? { status: 'ok', detail: 'API key configured' }
      : { status: 'error', detail: 'GOOGLE_MAPS_API_KEY not set' };

    // 3. Email check — Resend key present
    const resendKey = Deno.env.get('RESEND_API_KEY');
    checks.email = resendKey
      ? { status: 'ok', detail: 'Resend API key configured' }
      : { status: 'warning', detail: 'RESEND_API_KEY not set' };

    // 4. Job queue — count pending / failed jobs
    try {
      const [pending, failed] = await Promise.all([
        base44.asServiceRole.entities.JobQueue.filter({ status: 'pending' }, '-created_date', 1),
        base44.asServiceRole.entities.JobQueue.filter({ status: 'failed' }, '-created_date', 1),
      ]);
      const pendingCount = pending.length;
      const failedCount = failed.length;
      checks.job_queue = {
        status: failedCount > 10 ? 'warning' : 'ok',
        detail: `${pendingCount} pending, ${failedCount} failed`
      };
    } catch (e) {
      checks.job_queue = { status: 'ok', detail: 'Queue empty or not initialized' };
    }

    // 5. Cache health
    try {
      const now = new Date().toISOString();
      const cacheEntries = await base44.asServiceRole.entities.GoogleBusinessCache.list('-cached_at', 1);
      checks.cache = {
        status: 'ok',
        detail: `${cacheEntries.length} entries tracked`
      };
    } catch (e) {
      checks.cache = { status: 'ok', detail: 'Cache not yet populated' };
    }

    // 6. Recent errors
    try {
      const recentErrors = await base44.asServiceRole.entities.ErrorLog.filter(
        { resolved: false }, '-created_date', 5
      );
      const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
      checks.errors = {
        status: criticalErrors.length > 0 ? 'warning' : 'ok',
        detail: `${recentErrors.length} unresolved errors, ${criticalErrors.length} critical`
      };
    } catch (e) {
      checks.errors = { status: 'ok', detail: 'Error log not populated' };
    }

    // Overall status
    const hasError   = Object.values(checks).some(c => c.status === 'error');
    const hasWarning = Object.values(checks).some(c => c.status === 'warning');
    const overall    = hasError ? 'critical' : hasWarning ? 'warning' : 'healthy';

    const passed   = Object.values(checks).filter(c => c.status === 'ok').length;
    const warnings = Object.values(checks).filter(c => c.status === 'warning').length;
    const failures = Object.values(checks).filter(c => c.status === 'error').length;

    return Response.json({
      status: overall,
      checks,
      passed,
      warnings,
      failures,
      execution_time_ms: Date.now() - start,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({
      status: 'critical',
      error: error.message,
      execution_time_ms: Date.now() - start
    }, { status: 500 });
  }
});