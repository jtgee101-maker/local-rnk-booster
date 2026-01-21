import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { searchQuery } = await req.json();

    if (!searchQuery) {
      return Response.json({ error: 'Search query is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return Response.json({ 
        error: 'Search service temporarily unavailable. Please contact support.',
        code: 'MAPS_API_KEY_MISSING'
      }, { status: 500 });
    }

    // Search for businesses using Places API Text Search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error('Google Maps API HTTP error:', searchResponse.status);
      return Response.json({ 
        error: 'Search service temporarily unavailable',
        code: 'MAPS_HTTP_ERROR'
      }, { status: 502 });
    }
    
    const searchData = await searchResponse.json();

    // Log the actual API response for debugging
    console.log('Google API Response:', { status: searchData.status, error_message: searchData.error_message, results_count: searchData.results?.length || 0 });

    if (searchData.status === 'REQUEST_DENIED') {
      console.error('Google Maps API key denied:', searchData.error_message);
      return Response.json({ 
        error: 'Search temporarily unavailable',
        code: 'MAPS_API_DENIED'
      }, { status: 500 });
    }
    
    if (searchData.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded');
      return Response.json({ 
        error: 'Service at capacity. Please try again in a moment.',
        code: 'MAPS_QUOTA_EXCEEDED'
      }, { status: 429 });
    }

    if (searchData.status !== 'OK') {
      console.error('Google Places API Error:', searchData.error_message || 'Unknown error');
      return Response.json({ 
        error: searchData.error_message || 'Unable to search businesses',
        code: searchData.status
      }, { status: 400 });
    }

    if (!searchData.results || searchData.results.length === 0) {
      return Response.json({ 
        success: false,
        results: [],
        error: 'No results found'
      });
    }

    // Get top 5 results
    const businesses = searchData.results.slice(0, 5).map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || 0,
      user_ratings_total: place.user_ratings_total || 0,
      types: place.types || [],
      geometry: place.geometry
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