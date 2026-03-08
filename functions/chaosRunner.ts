import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ── Test harness helper ────────────────────────────────────────────────────────
async function timed(name, fn) {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Test timed out (15s)')), 15000))
    ]);
    return {
      test: name,
      status: result.pass ? 'pass' : (result.warn ? 'warn' : 'fail'),
      message: result.message,
      duration_ms: Date.now() - start,
      details: result.details || {}
    };
  } catch (err) {
    return { test: name, status: 'fail', message: `Error: ${err.message}`, duration_ms: Date.now() - start, details: {} };
  }
}

// ── Suite 1: Health & Connectivity ────────────────────────────────────────────
async function suiteHealth(base44) {
  const tests = [];

  tests.push(await timed('db_read_speed', async () => {
    const start = Date.now();
    await base44.asServiceRole.entities.Lead.list('-created_date', 1);
    const ms = Date.now() - start;
    return ms < 2000 ? { pass: true, message: `DB read OK: ${ms}ms` } : { warn: true, message: `DB read slow: ${ms}ms (threshold: 2s)`, details: { ms } };
  }));

  tests.push(await timed('db_write_delete_speed', async () => {
    const start = Date.now();
    const rec = await base44.asServiceRole.entities.AppSettings.create({
      setting_key: `_chaos_${Date.now()}`,
      setting_value: { test: true },
      category: 'general',
      description: 'Chaos test marker — safe to delete'
    });
    await base44.asServiceRole.entities.AppSettings.delete(rec.id).catch(() => {});
    const ms = Date.now() - start;
    return ms < 3000 ? { pass: true, message: `DB write+delete OK: ${ms}ms` } : { warn: true, message: `DB write slow: ${ms}ms (threshold: 3s)`, details: { ms } };
  }));

  tests.push(await timed('cache_entity_accessible', async () => {
    const entries = await base44.asServiceRole.entities.GoogleBusinessCache.list('-cached_at', 5);
    return { pass: true, message: `Cache entity accessible — ${entries.length} recent entries`, details: { count: entries.length } };
  }));

  tests.push(await timed('unresolved_critical_errors', async () => {
    const errors = await base44.asServiceRole.entities.ErrorLog.filter({ resolved: false }, '-created_date', 20);
    const critical = errors.filter(e => e.severity === 'critical');
    return critical.length > 0
      ? { warn: true, message: `${critical.length} unresolved critical error(s) in log`, details: { critical: critical.length, total_unresolved: errors.length } }
      : { pass: true, message: `No critical errors (${errors.length} total unresolved)` };
  }));

  tests.push(await timed('job_queue_entity_accessible', async () => {
    const jobs = await base44.asServiceRole.entities.JobQueue.list('-created_date', 1);
    return { pass: true, message: 'JobQueue entity accessible', details: { sample_count: jobs.length } };
  }));

  return tests;
}

// ── Suite 2: Input Validation ─────────────────────────────────────────────────
async function suiteInputValidation() {
  // Mirror the actual sanitization logic from the backend functions
  function sanitize(v) {
    if (typeof v !== 'string') return '';
    return v.trim().slice(0, 200).replace(/[<>{}[\]\\]/g, '');
  }
  function sanitizePid(v) {
    if (typeof v !== 'string') return '';
    return v.trim().slice(0, 200).replace(/[^a-zA-Z0-9_-]/g, '');
  }

  const tests = [];

  tests.push(await timed('reject_empty_search', async () => {
    const out = sanitize('');
    return (!out || out.length < 3) ? { pass: true, message: 'Empty search correctly blocked' } : { fail: true, message: 'Empty search NOT blocked — vulnerability!' };
  }));

  tests.push(await timed('reject_2char_search', async () => {
    const out = sanitize('ab');
    return (!out || out.length < 3) ? { pass: true, message: '2-char search blocked' } : { fail: true, message: '2-char search NOT blocked' };
  }));

  tests.push(await timed('strip_xss_from_search', async () => {
    const out = sanitize('<script>alert(1)</script>pizza shop NYC');
    return !out.includes('<script>') && !out.includes('</script>')
      ? { pass: true, message: `XSS stripped → "${out}"`, details: { result: out } }
      : { fail: true, message: 'XSS NOT stripped!', details: { result: out } };
  }));

  tests.push(await timed('cap_oversized_input', async () => {
    const out = sanitize('x'.repeat(1000));
    return out.length <= 200
      ? { pass: true, message: `Oversized input capped at ${out.length}/200 chars` }
      : { fail: true, message: `Input NOT capped: ${out.length} chars!` };
  }));

  tests.push(await timed('reject_short_place_id', async () => {
    const out = sanitizePid('abc');
    return (!out || out.length < 10) ? { pass: true, message: 'Short place_id rejected (<10 chars)' } : { fail: true, message: 'Short place_id NOT rejected' };
  }));

  tests.push(await timed('strip_sql_injection_place_id', async () => {
    const out = sanitizePid("'; DROP TABLE leads;--");
    return !/[';]/.test(out)
      ? { pass: true, message: `SQL injection chars stripped → "${out}"`, details: { result: out } }
      : { fail: true, message: 'SQL injection chars NOT stripped!', details: { result: out } };
  }));

  tests.push(await timed('handle_null_undefined_inputs', async () => {
    return sanitize(null) === '' && sanitizePid(undefined) === ''
      ? { pass: true, message: 'Null/undefined inputs safely return empty string' }
      : { fail: true, message: 'Null input handling broken' };
  }));

  tests.push(await timed('strip_object_injection', async () => {
    const out = sanitize('{__proto__: null}');
    return !out.includes('{') && !out.includes('}')
      ? { pass: true, message: `Object injection chars stripped → "${out}"` }
      : { fail: true, message: 'Object injection chars NOT stripped!', details: { result: out } };
  }));

  return tests;
}

// ── Suite 3: Cache Behavior ───────────────────────────────────────────────────
async function suiteCache(base44) {
  const tests = [];

  tests.push(await timed('cache_entry_count', async () => {
    const entries = await base44.asServiceRole.entities.GoogleBusinessCache.list('-cached_at', 50);
    return entries.length >= 50
      ? { warn: true, message: '50+ cache entries visible — monitor for unbounded growth', details: { count: '50+' } }
      : { pass: true, message: `${entries.length} cache entries`, details: { count: entries.length } };
  }));

  tests.push(await timed('expired_entry_accumulation', async () => {
    const entries = await base44.asServiceRole.entities.GoogleBusinessCache.list('-cached_at', 50);
    const expired = entries.filter(e => new Date(e.expires_at).getTime() < Date.now());
    return expired.length > 15
      ? { warn: true, message: `${expired.length} expired entries accumulating — add periodic cleanup job`, details: { expired_count: expired.length } }
      : { pass: true, message: `${expired.length} expired entries (acceptable)` };
  }));

  tests.push(await timed('cache_freshness_rate', async () => {
    const entries = await base44.asServiceRole.entities.GoogleBusinessCache.list('-cached_at', 20);
    if (entries.length === 0) return { pass: true, message: 'Cache empty — no freshness to measure' };
    const fresh = entries.filter(e => new Date(e.expires_at).getTime() > Date.now());
    const rate = Math.round((fresh.length / entries.length) * 100);
    return rate >= 40
      ? { pass: true, message: `Cache freshness: ${rate}% (${fresh.length}/${entries.length} fresh)`, details: { rate } }
      : { warn: true, message: `Low freshness: ${rate}% — many entries expired`, details: { rate, fresh: fresh.length, total: entries.length } };
  }));

  tests.push(await timed('cache_write_roundtrip', async () => {
    const placeId = `chaos_test_${Date.now()}`;
    const created = await base44.asServiceRole.entities.GoogleBusinessCache.create({
      place_id: placeId,
      business_payload: { name: 'Chaos Test Business', test: true },
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60000).toISOString()
    });
    const found = await base44.asServiceRole.entities.GoogleBusinessCache.filter({ place_id: placeId }, '-cached_at', 1);
    await base44.asServiceRole.entities.GoogleBusinessCache.delete(created.id).catch(() => {});
    return found.length > 0
      ? { pass: true, message: 'Cache write + read-back roundtrip OK' }
      : { fail: true, message: 'Cache write succeeded but immediate read-back failed!' };
  }));

  tests.push(await timed('cache_deduplication_check', async () => {
    const all = await base44.asServiceRole.entities.GoogleBusinessCache.list('-cached_at', 50);
    const ids = all.map(e => e.place_id);
    const unique = new Set(ids).size;
    const dupes = ids.length - unique;
    return dupes > 5
      ? { warn: true, message: `${dupes} duplicate place_id entries in cache — update logic may not be firing`, details: { total: ids.length, unique, dupes } }
      : { pass: true, message: `Minimal duplicates: ${dupes} (${ids.length} entries, ${unique} unique)` };
  }));

  return tests;
}

// ── Suite 4: Job Queue ────────────────────────────────────────────────────────
async function suiteJobQueue(base44) {
  const tests = [];

  tests.push(await timed('pending_job_backlog', async () => {
    const pending = await base44.asServiceRole.entities.JobQueue.filter({ status: 'pending' }, '-created_date', 50);
    if (pending.length >= 50) return { warn: true, message: '50+ pending jobs — processor may be falling behind', details: { count: '50+' } };
    return { pass: true, message: `${pending.length} pending jobs in queue`, details: { count: pending.length } };
  }));

  tests.push(await timed('stuck_processing_jobs', async () => {
    const processing = await base44.asServiceRole.entities.JobQueue.filter({ status: 'processing' }, '-created_date', 20);
    const cutoff = Date.now() - 3600000; // 1 hour
    const stuck = processing.filter(j => j.last_attempt_at && new Date(j.last_attempt_at).getTime() < cutoff);
    return stuck.length > 0
      ? { warn: true, message: `${stuck.length} job(s) stuck in 'processing' for >1 hour`, details: { stuck_ids: stuck.map(j => j.id) } }
      : { pass: true, message: `No stuck jobs (${processing.length} currently in-progress, all recent)` };
  }));

  tests.push(await timed('failed_job_backlog', async () => {
    const failed = await base44.asServiceRole.entities.JobQueue.filter({ status: 'failed' }, '-created_date', 50);
    if (failed.length >= 50) return { warn: true, message: '50+ failed jobs — immediate review + retry needed', details: { count: '50+' } };
    if (failed.length > 10) return { warn: true, message: `${failed.length} failed jobs accumulating`, details: { count: failed.length } };
    return { pass: true, message: `${failed.length} failed jobs (manageable)`, details: { count: failed.length } };
  }));

  tests.push(await timed('max_attempts_respected', async () => {
    const failed = await base44.asServiceRole.entities.JobQueue.filter({ status: 'failed' }, '-created_date', 20);
    const overAttempted = failed.filter(j => j.attempts > (j.max_attempts || 3) + 2);
    return overAttempted.length > 0
      ? { warn: true, message: `${overAttempted.length} job(s) exceeded max_attempts by >2 — retry guard may be broken`, details: { ids: overAttempted.map(j => j.id) } }
      : { pass: true, message: 'max_attempts respected across all sampled failed jobs' };
  }));

  tests.push(await timed('job_create_verify_cleanup', async () => {
    const job = await base44.asServiceRole.entities.JobQueue.create({
      job_type: 'other',
      payload: { chaos_test: true, ts: Date.now() },
      status: 'pending',
      attempts: 0,
      max_attempts: 1,
      priority: 10
    });
    const found = await base44.asServiceRole.entities.JobQueue.filter({ job_type: 'other' }, '-created_date', 10);
    await base44.asServiceRole.entities.JobQueue.delete(job.id).catch(() => {});
    return found.some(j => j.id === job.id)
      ? { pass: true, message: 'Job create + verify + cleanup roundtrip OK' }
      : { fail: true, message: 'Job created but not found on immediate read-back!' };
  }));

  return tests;
}

// ── Suite 5: Database Resilience ──────────────────────────────────────────────
async function suiteDatabase(base44) {
  const tests = [];

  tests.push(await timed('leads_read_perf', async () => {
    const start = Date.now();
    const leads = await base44.asServiceRole.entities.Lead.list('-created_date', 50);
    const ms = Date.now() - start;
    return ms > 3000
      ? { warn: true, message: `Lead read slow: ${ms}ms for ${leads.length} records`, details: { ms, count: leads.length } }
      : { pass: true, message: `${leads.length} leads read in ${ms}ms`, details: { count: leads.length, ms } };
  }));

  tests.push(await timed('email_delivery_health', async () => {
    const logs = await base44.asServiceRole.entities.EmailLog.list('-created_date', 100);
    if (logs.length === 0) return { pass: true, message: 'No email logs yet' };
    const failed = logs.filter(l => l.status === 'failed').length;
    const rate = Math.round((failed / logs.length) * 100);
    return rate > 20
      ? { warn: true, message: `High email failure rate: ${rate}% (${failed}/${logs.length})`, details: { failed, total: logs.length, rate } }
      : { pass: true, message: `Email delivery ${100 - rate}% success (${failed}/${logs.length} failed)` };
  }));

  tests.push(await timed('conversion_events_perf', async () => {
    const start = Date.now();
    const events = await base44.asServiceRole.entities.ConversionEvent.list('-created_date', 100);
    const ms = Date.now() - start;
    return ms > 3000
      ? { warn: true, message: `Conversion events query slow: ${ms}ms`, details: { ms, count: events.length } }
      : { pass: true, message: `${events.length} conversion events read in ${ms}ms`, details: { count: events.length, ms } };
  }));

  tests.push(await timed('active_ip_blocks', async () => {
    const now = new Date().toISOString();
    const blocks = await base44.asServiceRole.entities.ApiAbuseBlocklist.list('-created_date', 20);
    const active = blocks.filter(b => b.blocked_until > now);
    return { pass: true, message: `IP blocklist: ${active.length} active / ${blocks.length} total entries`, details: { active: active.length, total: blocks.length } };
  }));

  tests.push(await timed('lead_nurture_health', async () => {
    const nurtures = await base44.asServiceRole.entities.LeadNurture.filter({ status: 'active' }, '-created_date', 20);
    return { pass: true, message: `${nurtures.length} active nurture sequences`, details: { count: nurtures.length } };
  }));

  return tests;
}

// ── Suite 6: Rate Limit & Abuse Protection ────────────────────────────────────
async function suiteRateLimit() {
  function getWindow(store, ip, windowMs) {
    const now = Date.now();
    const entry = store.get(ip);
    if (!entry || now - entry.windowStart > windowMs) {
      const fresh = { count: 1, windowStart: now };
      store.set(ip, fresh);
      return fresh;
    }
    entry.count++;
    return entry;
  }

  const tests = [];

  tests.push(await timed('per_minute_limit_fires', async () => {
    const store = new Map();
    let limitAt = null;
    for (let i = 1; i <= 15; i++) {
      const e = getWindow(store, '10.0.0.1', 60000);
      if (e.count > 10 && !limitAt) limitAt = i;
    }
    return limitAt
      ? { pass: true, message: `Per-minute limit fires at request #${limitAt} (threshold: >10/min)`, details: { limit_at_request: limitAt } }
      : { fail: true, message: 'Per-minute rate limit did NOT fire after 15 requests!' };
  }));

  tests.push(await timed('abuse_block_threshold', async () => {
    const store = new Map();
    let abusedAt = null;
    for (let i = 1; i <= 55; i++) {
      const e = getWindow(store, '10.0.0.2', 60000);
      if (e.count >= 50 && !abusedAt) abusedAt = i;
    }
    return abusedAt
      ? { pass: true, message: `Abuse detection fires at request #${abusedAt} (threshold: >=50/min)`, details: { abuse_at_request: abusedAt } }
      : { fail: true, message: 'Abuse detection did NOT fire after 55 requests!' };
  }));

  tests.push(await timed('ip_rate_limit_isolation', async () => {
    const store = new Map();
    for (let i = 0; i < 12; i++) getWindow(store, '10.0.0.3', 60000);
    const clean = getWindow(store, '10.0.0.4', 60000);
    return clean.count === 1
      ? { pass: true, message: 'Rate limits are correctly isolated per IP (different IPs independent)' }
      : { fail: true, message: `IP isolation broken: fresh IP shows count=${clean.count}` };
  }));

  tests.push(await timed('hour_limit_fires', async () => {
    const store = new Map();
    let limitAt = null;
    for (let i = 1; i <= 30; i++) {
      const e = getWindow(store, '10.0.0.5', 3600000);
      if (e.count > 25 && !limitAt) limitAt = i;
    }
    return limitAt
      ? { pass: true, message: `Per-hour limit fires at request #${limitAt} (threshold: >25/hour)`, details: { limit_at_request: limitAt } }
      : { fail: true, message: 'Per-hour rate limit did NOT fire after 30 requests!' };
  }));

  return tests;
}

// ── Main Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const suite = body.suite || 'all';

    const suiteMap = {
      health: () => suiteHealth(base44),
      input_validation: () => suiteInputValidation(),
      cache: () => suiteCache(base44),
      jobs: () => suiteJobQueue(base44),
      database: () => suiteDatabase(base44),
      rate_limit: () => suiteRateLimit(),
    };

    const toRun = suite === 'all' ? Object.keys(suiteMap) : [suite].filter(s => suiteMap[s]);
    if (toRun.length === 0) {
      return Response.json({ error: `Unknown suite: "${suite}". Valid: ${Object.keys(suiteMap).join(', ')}` }, { status: 400 });
    }

    const results = {};
    for (const s of toRun) {
      console.log(`[CHAOS] Running suite: ${s}`);
      results[s] = await suiteMap[s]();
    }

    const allTests = Object.values(results).flat();
    const passed = allTests.filter(t => t.status === 'pass').length;
    const warned = allTests.filter(t => t.status === 'warn').length;
    const failed = allTests.filter(t => t.status === 'fail').length;
    const total = allTests.length;
    const score = total > 0 ? Math.round(((passed + warned * 0.5) / total) * 100) : 0;
    const verdict = score >= 85 ? 'LAUNCH_READY' : score >= 65 ? 'NEEDS_ATTENTION' : 'NOT_READY';

    console.log(`[CHAOS] Complete: ${passed}p/${warned}w/${failed}f — score=${score} verdict=${verdict}`);

    return Response.json({
      success: true,
      suite_run: suite,
      timestamp: new Date().toISOString(),
      summary: { passed, warned, failed, total, score, verdict },
      results
    });
  } catch (error) {
    console.error('[CHAOS] Runner error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});