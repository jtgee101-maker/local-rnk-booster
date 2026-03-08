import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ── In-memory rate stores (per isolate instance, best-effort) ─────────────────
// Layer 1: 10 req/min per IP
const minuteStore = new Map();
// Layer 2: 25 req/hour per IP
const hourStore = new Map();
// Layer 3: auto-block if > 50 req/min (blocked 15 min)
const autoBlockStore = new Map();

const RATE_LIMIT_PER_MIN   = 10;
const RATE_LIMIT_PER_HOUR  = 25;
const ABUSE_THRESHOLD      = 50;
const BLOCK_DURATION_MS    = 15 * 60 * 1000; // 15 minutes

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

function checkAllLimits(ip) {
  const now = Date.now();

  // Check hard block first (db-persisted blocks are checked via entity lookup below)
  const inMemBlock = autoBlockStore.get(ip);
  if (inMemBlock && now < inMemBlock.blockedUntil) {
    return { allowed: false, code: 'BLOCKED', retryAfter: Math.ceil((inMemBlock.blockedUntil - now) / 1000) };
  }

  // Layer 3: abuse detection (50/min → 15 min block)
  const abuseEntry = getWindow(new Map(minuteStore), ip, 60_000);
  const rawMinEntry = minuteStore.get(ip);
  const rawMinCount = rawMinEntry ? rawMinEntry.count : 0;
  if (rawMinCount >= ABUSE_THRESHOLD) {
    autoBlockStore.set(ip, { blockedUntil: now + BLOCK_DURATION_MS });
    return { allowed: false, code: 'ABUSE_BLOCKED', retryAfter: BLOCK_DURATION_MS / 1000 };
  }

  // Layer 1: 10/min
  const minEntry = getWindow(minuteStore, ip, 60_000);
  if (minEntry.count > RATE_LIMIT_PER_MIN) {
    return { allowed: false, code: 'RATE_LIMITED_MINUTE', retryAfter: 60 };
  }

  // Layer 2: 25/hour
  const hourEntry = getWindow(hourStore, ip, 3_600_000);
  if (hourEntry.count > RATE_LIMIT_PER_HOUR) {
    return { allowed: false, code: 'RATE_LIMITED_HOUR', retryAfter: 3600 };
  }

  return { allowed: true };
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 200).replace(/[<>{}[\]\\]/g, '');
}

Deno.serve(async (req) => {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Multi-layer rate limit check
    const limitResult = checkAllLimits(ip);
    if (!limitResult.allowed) {
      console.warn(`[RATE LIMIT] ip=${ip} code=${limitResult.code}`);

      // Persist abuse blocks to DB (non-blocking, best-effort)
      if (limitResult.code === 'ABUSE_BLOCKED') {
        try {
          const base44 = createClientFromRequest(req);
          const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS).toISOString();
          base44.asServiceRole.entities.ApiAbuseBlocklist.create({
            ip,
            blocked_until: blockedUntil,
            reason: 'Exceeded 50 requests per minute',
            auto_blocked: true,
          }).catch(() => {});
        } catch {}
      }

      return Response.json(
        {
          error: limitResult.code === 'ABUSE_BLOCKED'
            ? 'Access temporarily blocked due to excessive requests. Try again in 15 minutes.'
            : 'Too many search requests. Please wait a moment and try again.',
          code: limitResult.code,
          retry_after: limitResult.retryAfter
        },
        { status: 429, headers: { 'Retry-After': String(limitResult.retryAfter) } }
      );
    }

    const body = await req.json();
    const searchQuery = sanitizeInput(body.searchQuery);

    if (!searchQuery || searchQuery.length < 3) {
      return Response.json({ error: 'Search query must be at least 3 characters', code: 'INVALID_QUERY' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Search service temporarily unavailable.', code: 'MAPS_API_KEY_MISSING' }, { status: 500 });
    }

    // ── Fetch with 8-second timeout to prevent indefinite hangs ──────────────
    const searchController = new AbortController();
    const searchTimeoutId = setTimeout(() => searchController.abort(), 8000);
    let searchResponse;
    try {
      searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        signal: searchController.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location'
        },
        body: JSON.stringify({ textQuery: searchQuery, maxResultCount: 5 })
      });
    } catch (fetchErr) {
      clearTimeout(searchTimeoutId);
      if (fetchErr.name === 'AbortError') {
        console.warn(`[TIMEOUT] Google Places search timed out for query="${searchQuery}"`);
        return Response.json({ error: 'Search timed out. Please try again.', code: 'TIMEOUT' }, { status: 504 });
      }
      throw fetchErr;
    }
    clearTimeout(searchTimeoutId);

    if (!searchResponse.ok) {
      const gStatus = searchResponse.status;
      const code = gStatus === 429 ? 'QUOTA_EXCEEDED' : 'MAPS_HTTP_ERROR';
      const errMsg = gStatus === 429 ? 'Google API quota exceeded. Please try again later.' : 'Search service temporarily unavailable';
      console.error(`Google Places API HTTP error: ${gStatus}`);
      return Response.json({ error: errMsg, code }, { status: 502 });
    }

    const searchData = await searchResponse.json();

    if (!searchData.places || searchData.places.length === 0) {
      return Response.json({ success: false, results: [], error: 'No results found' });
    }

    const businesses = searchData.places.map(place => ({
      place_id: place.id,
      name: place.displayName?.text || place.displayName,
      address: place.formattedAddress,
      rating: place.rating || 0,
      user_ratings_total: place.userRatingCount || 0,
      types: place.types || [],
      geometry: { location: place.location }
    }));

    return Response.json({ success: true, results: businesses });

  } catch (error) {
    console.error('Error searching Google business:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});