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

    // Get detailed business info using Place Details API (New)
    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    
    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,reviews,photos,regularOpeningHours,types,location'
      }
    });
    
    if (!detailsResponse.ok) {
      console.error('Google Places API (New) HTTP error:', detailsResponse.status);
      return Response.json({ 
        error: 'Unable to load business details',
        code: 'MAPS_HTTP_ERROR'
      }, { status: 502 });
    }
    
    const detailsData = await detailsResponse.json();
    
    // New API doesn't use status codes the same way
    if (!detailsData.displayName) {
      return Response.json({ 
        error: 'Business not found or details unavailable',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Calculate normalized health score using the provided formula
    const rating = detailsData.rating || 0;
    const reviewCount = detailsData.userRatingCount || 0;
    const photosCount = detailsData.photos ? detailsData.photos.length : 0;
    const hasWebsite = !!detailsData.websiteUri;
    const hasPhone = !!detailsData.nationalPhoneNumber;
    const hasHours = !!detailsData.regularOpeningHours;

    // Review Strength (R) - Max 25 pts
    const rScore = Math.min(25, ((rating * Math.log10(reviewCount + 1)) / (5 * Math.log10(201))) * 25);
    
    // Visual Authority (V) - Max 20 pts
    const vScore = (photosCount / 10) * 20;
    
    // Optimization (O) - Max 30 pts
    let oScore = 0;
    if (hasWebsite) oScore += 10;
    if (hasPhone) oScore += 10;
    if (hasHours) oScore += 10;
    
    // Baseline 25 + calculated scores
    const healthScore = Math.round(Math.min(100, 25 + rScore + vScore + oScore));

    return Response.json({
      success: true,
      business: {
        place_id: placeId,
        name: detailsData.displayName?.text || detailsData.displayName,
        address: detailsData.formattedAddress,
        phone: detailsData.nationalPhoneNumber,
        website: detailsData.websiteUri,
        rating: rating,
        total_reviews: reviewCount,
        reviews: detailsData.reviews || [],
        photos_count: photosCount,
        has_hours: hasHours,
        types: detailsData.types || [],
        location: detailsData.location,
        health_score: healthScore,
        score_breakdown: {
          review_strength: Math.round(rScore),
          visual_authority: Math.round(vScore),
          optimization: oScore,
          baseline: 25
        }
      }
    });

  } catch (error) {
    console.error('Error getting Google business details:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});