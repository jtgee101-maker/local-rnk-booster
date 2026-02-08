import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // Remove any potentially dangerous characters but keep spaces, letters, numbers, and common punctuation
  return input.trim().slice(0, 200).replace(/[<>{}[\]\\]/g, '');
}

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const searchQuery = sanitizeInput(body.searchQuery);

    if (!searchQuery || searchQuery.length < 2) {
      return Response.json({ 
        error: 'Search query must be at least 2 characters',
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

    // Search for businesses using Places API (New) - Text Search
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
      console.error('Google Places API (New) HTTP error:', searchResponse.status);
      return Response.json({ 
        error: 'Search service temporarily unavailable',
        code: 'MAPS_HTTP_ERROR'
      }, { status: 502 });
    }
    
    const searchData = await searchResponse.json();

    // Log the actual API response for debugging
    console.log('Google Places API (New) Response:', { places_count: searchData.places?.length || 0 });

    if (!searchData.places || searchData.places.length === 0) {
      return Response.json({ 
        success: false,
        results: [],
        error: 'No results found'
      });
    }

    // Map results to expected format
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
}));