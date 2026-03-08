// In-memory rate limiter — best-effort within a Deno isolate instance
// Limits: 10 requests per IP per 60 seconds
const rateLimitStore = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return false;
  }

  entry.count++;
  return true;
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 200).replace(/[<>{}[\]\\]/g, '');
}

Deno.serve(async (req) => {
  try {
    // Extract IP from headers (Deno Deploy / reverse proxy)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return Response.json({
        error: 'Too many search requests. Please wait a moment and try again.',
        code: 'RATE_LIMITED'
      }, { status: 429 });
    }

    const body = await req.json();
    const searchQuery = sanitizeInput(body.searchQuery);

    // Minimum 3 characters to prevent trivial enumeration
    if (!searchQuery || searchQuery.length < 3) {
      return Response.json({
        error: 'Search query must be at least 3 characters',
        code: 'INVALID_QUERY'
      }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return Response.json({
        error: 'Search service temporarily unavailable. Please contact support.',
        code: 'MAPS_API_KEY_MISSING'
      }, { status: 500 });
    }

    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location'
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        maxResultCount: 5
      })
    });

    if (!searchResponse.ok) {
      console.error('Google Places API HTTP error:', searchResponse.status);
      return Response.json({
        error: 'Search service temporarily unavailable',
        code: 'MAPS_HTTP_ERROR'
      }, { status: 502 });
    }

    const searchData = await searchResponse.json();

    console.log('Google Places API Response:', { places_count: searchData.places?.length || 0 });

    if (!searchData.places || searchData.places.length === 0) {
      return Response.json({
        success: false,
        results: [],
        error: 'No results found'
      });
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

    return Response.json({
      success: true,
      results: businesses
    });

  } catch (error) {
    console.error('Error searching Google business:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});