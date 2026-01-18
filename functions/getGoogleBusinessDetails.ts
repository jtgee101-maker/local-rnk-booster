import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { placeId } = await req.json();

    if (!placeId) {
      return Response.json({ error: 'Place ID is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    // Get detailed business info using Place Details API
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,photos,opening_hours,types,geometry,business_status&key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK' || !detailsData.result) {
      return Response.json({ 
        error: 'Business details not found',
        status: detailsData.status 
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