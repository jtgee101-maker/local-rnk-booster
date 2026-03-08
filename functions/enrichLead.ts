import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ENRICHLAYER_KEY = Deno.env.get('ENRICHLAYER_API_KEY');
const BASE_URL = 'https://enrichlayer.com';
const REQUEST_TIMEOUT_MS = 15000;

/**
 * callEnrichLayer — backend-only, never exposed to frontend.
 * Returns { status, data, error }
 * Tolerant of added response fields per EnrichLayer documentation guidance.
 */
async function callEnrichLayer(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${ENRICHLAYER_KEY}`,
        Accept: 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    const data = res.ok ? await res.json().catch(() => null) : null;
    return { status: res.status, data };
  } catch (err) {
    clearTimeout(timer);
    return { status: 0, data: null, error: err.message };
  }
}

/**
 * logCreditFailure — PROMINENT log for 403 (out of credits).
 * Creates a critical ErrorLog record so it surfaces in admin dashboards.
 */
async function logCreditFailure(base44, email) {
  const msg = `[ENRICHLAYER OUT OF CREDITS] 403 Forbidden enriching ${email}. Refill credits at enrichlayer.com before next enrichment batch.`;
  console.error(`[CRITICAL] ${msg}`);
  await base44.asServiceRole.entities.ErrorLog.create({
    error_type: 'integration_error',
    severity: 'critical',
    message: msg,
    metadata: {
      email,
      provider: 'enrichlayer',
      error_code: 'out_of_credits',
      timestamp: new Date().toISOString()
    }
  }).catch(() => {});
}

/**
 * queueRetry — for transient failures (429, 500, 503).
 * Creates a pending JobQueue entry for later retry.
 */
async function queueRetry(base44, lead_id, email, reason) {
  await base44.asServiceRole.entities.JobQueue.create({
    job_type: 'other',
    payload: { job_name: 'enrich_lead_retry', lead_id, email, reason },
    status: 'pending',
    priority: 3
  }).catch(() => {});
}

/**
 * normalizeProfile — extracts a stable, schema-tolerant profile object.
 * Designed to tolerate future EnrichLayer response additions without breaking.
 */
function normalizeProfile(profileData) {
  const p = profileData?.profile || null;
  if (!p) return null;
  return {
    full_name: p.full_name || null,
    occupation: p.occupation || null,
    headline: p.headline || null,
    city: p.city || null,
    state: p.state || null,
    country: p.country || null,
    profile_pic_url: p.profile_pic_url || null,
    current_company: p.experiences?.[0]?.company || null,
    current_title: p.experiences?.[0]?.title || null,
    skills: (p.skills || []).slice(0, 10),
    follower_count: p.follower_count || null
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let lead_id, email, currentStatus;

    if (body.event) {
      lead_id = body.event.entity_id;
      email = body.data?.email;
      currentStatus = body.data?.enrichment_status;
    } else {
      lead_id = body.lead_id;
      email = body.email;
    }

    if (!lead_id || !email) {
      return Response.json({ error: 'lead_id and email required' }, { status: 400 });
    }

    // Skip if already enriched (unless force=true)
    if (currentStatus === 'enriched' && !body.force) {
      return Response.json({ skipped: true, reason: 'Already enriched' });
    }

    // Mark as in-progress immediately (non-blocking for lead flow)
    await base44.asServiceRole.entities.Lead.update(lead_id, { enrichment_status: 'pending' }).catch(() => {});

    // Run parallel requests to EnrichLayer
    const [disposableResult, profileResult] = await Promise.all([
      callEnrichLayer(`/api/v2/disposable-email?email=${encodeURIComponent(email)}`),
      callEnrichLayer(`/api/v2/profile/resolve/email?email=${encodeURIComponent(email)}&lookup_depth=superficial&enrich_profile=enrich`)
    ]);

    // Evaluate error statuses across both responses (worst-case wins)
    const worstStatus = [disposableResult.status, profileResult.status]
      .filter(s => s !== 200 && s !== 404 && s !== 0)
      .sort((a, b) => b - a)[0] || 200;

    if (profileResult.status === 403 || disposableResult.status === 403) {
      await logCreditFailure(base44, email);
      await base44.asServiceRole.entities.Lead.update(lead_id, {
        enrichment_status: 'failed',
        enrichment_data: { error_code: 'out_of_credits', error_at: new Date().toISOString() }
      }).catch(() => {});
      return Response.json({ error: 'EnrichLayer credits exhausted', code: 'out_of_credits' }, { status: 503 });
    }

    if (profileResult.status === 401 || disposableResult.status === 401) {
      console.error('[CRITICAL] EnrichLayer invalid API key (401) — check ENRICHLAYER_API_KEY secret');
      await base44.asServiceRole.entities.Lead.update(lead_id, { enrichment_status: 'failed' }).catch(() => {});
      return Response.json({ error: 'Invalid API key', code: 'invalid_key' }, { status: 500 });
    }

    if (profileResult.status === 400) {
      await base44.asServiceRole.entities.Lead.update(lead_id, {
        enrichment_status: 'failed',
        enrichment_data: { error_code: 'invalid_params', email, error_at: new Date().toISOString() }
      }).catch(() => {});
      return Response.json({ error: 'Invalid parameters', code: 'invalid_params' }, { status: 400 });
    }

    // 429 = rate limited, 500/503/0 = transient — queue retry, do not mark as failed
    if (profileResult.status === 429 || disposableResult.status === 429) {
      await queueRetry(base44, lead_id, email, 'rate_limited');
      await base44.asServiceRole.entities.Lead.update(lead_id, { enrichment_status: 'pending' }).catch(() => {});
      return Response.json({ queued: true, reason: 'Rate limited — queued for retry' });
    }

    if ([500, 503, 0].includes(profileResult.status) || [500, 503, 0].includes(disposableResult.status)) {
      await queueRetry(base44, lead_id, email, 'provider_error');
      await base44.asServiceRole.entities.Lead.update(lead_id, { enrichment_status: 'pending' }).catch(() => {});
      return Response.json({ queued: true, reason: 'Provider error — queued for retry' });
    }

    // Normalize response — schema-tolerant extraction
    const profileData = profileResult.data;
    const disposableData = disposableResult.data;
    const profile = normalizeProfile(profileData);
    const isDisposable = disposableData?.is_disposable_email || false;

    const enrichmentData = {
      profile,
      linkedin_url: profileData?.linkedin_profile_url || null,
      facebook_url: profileData?.facebook_profile_url || null,
      twitter_url: profileData?.twitter_profile_url || null,
      is_free_email: disposableData?.is_free_email || false,
      enriched_at: new Date().toISOString(),
      provider: 'enrichlayer',
      schema_version: 'v2'
    };

    await base44.asServiceRole.entities.Lead.update(lead_id, {
      enrichment_data: enrichmentData,
      is_disposable_email: isDisposable,
      enrichment_status: profile ? 'enriched' : 'not_found'
    });

    return Response.json({
      success: true,
      enriched: !!profile,
      is_disposable: isDisposable,
      name: profile?.full_name || null,
      company: profile?.current_company || null
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});