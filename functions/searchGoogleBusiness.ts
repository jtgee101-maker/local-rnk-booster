import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { searchQuery } = await req.json();

    if (!searchQuery) {
      return Response.json({ error: 'Search query is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    // Search for businesses using Places API Text Search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    // Log the actual API response for debugging
    console.log('Google API Response:', { status: searchData.status, error_message: searchData.error_message, results_count: searchData.results?.length || 0 });

    if (searchData.status !== 'OK') {
      console.error('Google Places API Error:', searchData.error_message || 'Unknown error');
      return Response.json({ 
        success: false,
        results: [],
        error: searchData.error_message || `API returned status: ${searchData.status}`
      });
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