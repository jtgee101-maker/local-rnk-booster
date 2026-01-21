import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function sanitizePlaceId(placeId) {
  if (typeof placeId !== 'string') return '';
  // Place IDs are alphanumeric with specific characters, remove anything suspicious
  return placeId.trim().slice(0, 200).replace(/[^a-zA-Z0-9_-]/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const placeId = sanitizePlaceId(body.placeId);

    if (!placeId || placeId.length < 10) {
      return Response.json({ 
        error: 'Invalid place ID',
        code: 'INVALID_PLACE_ID'
      }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return Response.json({ 
        error: 'Business details service unavailable',
        code: 'MAPS_API_KEY_MISSING'
      }, { status: 500 });
    }

    // Get detailed business info using Place Details API
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,photos,opening_hours,types,geometry,business_status&key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    
    if (!detailsResponse.ok) {
      console.error('Google Maps API HTTP error:', detailsResponse.status);
      return Response.json({ 
        error: 'Unable to load business details',
        code: 'MAPS_HTTP_ERROR'
      }, { status: 502 });
    }
    
    const detailsData = await detailsResponse.json();
    
    if (detailsData.status === 'REQUEST_DENIED') {
      console.error('Google Maps API key denied:', detailsData.error_message);
      return Response.json({ 
        error: 'Service temporarily unavailable',
        code: 'MAPS_API_DENIED'
      }, { status: 500 });
    }
    
    if (detailsData.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded');
      return Response.json({ 
        error: 'Service at capacity. Please try again shortly.',
        code: 'MAPS_QUOTA_EXCEEDED'
      }, { status: 429 });
    }

    if (detailsData.status !== 'OK' || !detailsData.result) {
      return Response.json({ 
        error: 'Business not found or details unavailable',
        code: detailsData.status 
      }, { status: 404 });
    }

    const business = detailsData.result;

    return Response.json({
      success: true,
      business: {
        place_id: placeId,
        name: business.name,
        address: business.formatted_address,
        phone: business.formatted_phone_number,
        website: business.website,
        rating: business.rating || 0,
        total_reviews: business.user_ratings_total || 0,
        reviews: business.reviews || [],
        photos_count: business.photos ? business.photos.length : 0,
        has_hours: business.opening_hours ? true : false,
        types: business.types || [],
        business_status: business.business_status,
        location: business.geometry?.location
      }
    });

  } catch (error) {
    console.error('Error getting Google business details:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});