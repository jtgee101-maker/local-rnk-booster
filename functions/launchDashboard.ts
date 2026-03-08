import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Launch Command Center — unified metrics endpoint.
 * Returns funnel, UTM attribution, system health, and security in one call.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const range = body.range || '7d';
    const rangeMs = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }[range] || 604800000;
    const since = new Date(Date.now() - rangeMs).toISOString();

    // Parallel fetch everything
    const [allEvents, allLeads, pendingJobs, failedJobs, unresolvedErrors, cacheEntries, ipBlocks, emailLogs] = await Promise.all([
      base44.asServiceRole.entities.ConversionEvent.list('-created_date', 5000),
      base44.asServiceRole.entities.Lead.list('-created_date', 500),
      base44.asServiceRole.entities.JobQueue.filter({ status: 'pending' }, '-created_date', 50),
      base44.asServiceRole.entities.JobQueue.filter({ status: 'failed' }, '-created_date', 50),
      base44.asServiceRole.entities.ErrorLog.filter({ resolved: false }, '-created_date', 50),
      base44.asServiceRole.entities.GoogleBusinessCache.list('-cached_at', 50),
      base44.asServiceRole.entities.ApiAbuseBlocklist.list('-created_date', 50),
      base44.asServiceRole.entities.EmailLog.list('-created_date', 200),
    ]);

    // Filter to time window
    const events = allEvents.filter(e => e.funnel_version === 'geenius' && e.created_date >= since);
    const leads = allLeads.filter(l => l.created_date >= since);

    // ── Funnel metrics ────────────────────────────────────────────────────────
    const starts      = events.filter(e => e.event_name === 'quiz_started').length;
    const completions = events.filter(e => e.event_name === 'quiz_completed').length;
    const results     = events.filter(e => e.event_name === 'results_viewed').length;
    const bridge      = events.filter(e => e.event_name === 'bridge_viewed').length;
    const pathways    = events.filter(e =>
      ['pathway_govtech_grant_clicked', 'pathway_done_for_you_clicked', 'pathway_diy_software_clicked'].includes(e.event_name)
    ).length;
    const govtech = events.filter(e => e.event_name === 'pathway_govtech_grant_clicked').length;
    const dfy     = events.filter(e => e.event_name === 'pathway_done_for_you_clicked').length;
    const diy     = events.filter(e => e.event_name === 'pathway_diy_software_clicked').length;

    const pct = (n, d) => d > 0 ? +((n / d) * 100).toFixed(1) : 0;

    // ── UTM Attribution ───────────────────────────────────────────────────────
    function tally(arr, key) {
      const map = {};
      arr.forEach(e => {
        const v = e.properties?.[key] || 'direct';
        map[v] = (map[v] || 0) + 1;
      });
      return Object.entries(map)
        .map(([value, count]) => ({ value, count, pct: pct(count, arr.length) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }

    const startEvents  = events.filter(e => e.event_name === 'quiz_started');
    const convertedEvts = events.filter(e =>
      ['pathway_govtech_grant_clicked', 'pathway_done_for_you_clicked', 'pathway_diy_software_clicked'].includes(e.event_name)
    );

    // UTM conversion: among quiz_started sessions, which utm_source led to a pathway click?
    const startSessions = new Map(startEvents.map(e => [e.session_id, e.properties?.utm_source || 'direct']));
    const convertedSessions = new Set(convertedEvts.map(e => e.session_id));
    const utmConvMap = {};
    startSessions.forEach((src, sid) => {
      if (!utmConvMap[src]) utmConvMap[src] = { starts: 0, conversions: 0 };
      utmConvMap[src].starts++;
      if (convertedSessions.has(sid)) utmConvMap[src].conversions++;
    });
    const utmConversion = Object.entries(utmConvMap)
      .map(([source, d]) => ({ source, starts: d.starts, conversions: d.conversions, rate: pct(d.conversions, d.starts) }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 8);

    const utmSources  = tally(startEvents, 'utm_source');
    const utmMediums  = tally(startEvents, 'utm_medium');
    const utmCampaigns = tally(startEvents, 'utm_campaign');
    const devices     = tally(startEvents, 'device_type');

    // ── System Health ─────────────────────────────────────────────────────────
    const now = Date.now();
    const freshCache = cacheEntries.filter(e => new Date(e.expires_at).getTime() > now).length;
    const cacheHitRate = cacheEntries.length > 0 ? pct(freshCache, cacheEntries.length) : 0;

    const criticalErrors = unresolvedErrors.filter(e => e.severity === 'critical').length;
    const highErrors     = unresolvedErrors.filter(e => e.severity === 'high').length;

    const stuckJobs = failedJobs.filter(j =>
      j.attempts >= (j.max_attempts || 3)
    ).length;

    const activeBlocks = ipBlocks.filter(b => b.blocked_until > new Date().toISOString()).length;

    // Email delivery health (last 200)
    const recentEmails = emailLogs.filter(e => e.created_date >= since);
    const emailFailed  = recentEmails.filter(e => e.status === 'failed').length;
    const emailSuccessRate = recentEmails.length > 0 ? pct(recentEmails.length - emailFailed, recentEmails.length) : 100;

    // ── Recent leads (last 5) ─────────────────────────────────────────────────
    const recentLeads = leads.slice(0, 5).map(l => ({
      id: l.id,
      business_name: l.business_name || '—',
      email: l.email ? `${l.email.slice(0, 3)}***@${l.email.split('@')[1] || '?'}` : '—',
      health_score: l.health_score || 0,
      status: l.status || 'new',
      pathway: l.selected_pathway || null,
      created: l.created_date,
      category: l.business_category || '—'
    }));

    // ── Avg health score ──────────────────────────────────────────────────────
    const avgScore = leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + (l.health_score || 0), 0) / leads.length)
      : 0;

    return Response.json({
      success: true,
      range,
      generated_at: new Date().toISOString(),
      funnel: {
        starts, completions, results, bridge, pathways,
        govtech, dfy, diy,
        rates: {
          start_to_complete:   pct(completions, starts),
          complete_to_results: pct(results, completions),
          results_to_bridge:   pct(bridge, results),
          bridge_to_pathway:   pct(pathways, bridge),
          overall:             pct(pathways, starts),
        },
        dropoffs: {
          abandoned_mid_quiz:    starts - completions,
          lost_at_results:       completions - results,
          lost_at_bridge:        bridge > 0 ? bridge - pathways : results - pathways,
        }
      },
      leads: {
        total: leads.length,
        avg_score: avgScore,
        recent: recentLeads,
      },
      attribution: {
        utm_sources:   utmSources,
        utm_mediums:   utmMediums,
        utm_campaigns: utmCampaigns,
        devices,
        conversion_by_source: utmConversion,
      },
      system: {
        jobs: {
          pending:   pendingJobs.length,
          failed:    failedJobs.length,
          stuck:     stuckJobs,
        },
        errors: {
          unresolved: unresolvedErrors.length,
          critical:   criticalErrors,
          high:       highErrors,
        },
        cache: {
          total:     cacheEntries.length,
          fresh:     freshCache,
          hit_rate:  cacheHitRate,
        },
        email: {
          recent_sent:    recentEmails.length,
          failed:         emailFailed,
          success_rate:   emailSuccessRate,
        }
      },
      security: {
        active_blocks:  activeBlocks,
        total_blocks:   ipBlocks.length,
        recent_blocks:  ipBlocks.filter(b => b.created_date >= since).length,
      }
    });

  } catch (err) {
    console.error('[launchDashboard] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});