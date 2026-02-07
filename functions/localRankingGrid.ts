import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

/**
 * LOCAL RANKING GRID AUDIT
 * Checks business visibility from multiple locations in service area
 * Simulates "ranking grid" - tests if business appears in searches from different points
 */

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { placeId, businessName, location } = await req.json();

    if (!placeId || !location) {
      return Response.json({ error: 'Missing placeId or location' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Define ranking grid points (5 locations around business in 5-mile radius)
    const gridPoints = generateGridPoints(location.lat, location.lng, 5);
    
    // Test ranking at each grid point
    const rankingResults = await Promise.all(
      gridPoints.map(point => checkRankingAtLocation(point, businessName, placeId, apiKey))
    );

    // Calculate grid visibility score
    const visibilityScore = calculateGridScore(rankingResults);
    const avgRank = rankingResults.filter(r => r.found).reduce((sum, r) => sum + r.rank, 0) / 
                    Math.max(1, rankingResults.filter(r => r.found).length);

    // Identify weak zones with full location data
    const weakZones = rankingResults
      .filter(r => !r.found || r.rank > 3)
      .map((r, idx) => ({
        name: `${r.direction} Zone`,
        direction: r.direction,
        lat: gridPoints[idx].lat,
        lng: gridPoints[idx].lng,
        found: r.found,
        current_position: r.rank,
        distance: '5 miles from center'
      }));

    return Response.json({
      success: true,
      visibilityScore,
      averageRank: avgRank || null,
      gridResults: rankingResults,
      weakZones,
      weakZonesList: weakZones.map(z => z.direction),
      recommendations: generateRecommendations(visibilityScore, weakZones.map(z => z.direction))
    });

  } catch (error) {
    console.error('Ranking grid error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateGridPoints(lat, lng, radiusMiles) {
  const radiusKm = radiusMiles * 1.60934;
  const earthRadius = 6371; // km
  
  // 5 points: North, South, East, West, Center
  const directions = [
    { name: 'North', bearing: 0 },
    { name: 'South', bearing: 180 },
    { name: 'East', bearing: 90 },
    { name: 'West', bearing: 270 },
    { name: 'Center', bearing: null }
  ];

  return directions.map(dir => {
    if (dir.bearing === null) {
      return { lat, lng, direction: 'Center' };
    }

    const bearingRad = (dir.bearing * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(radiusKm / earthRadius) +
      Math.cos(latRad) * Math.sin(radiusKm / earthRadius) * Math.cos(bearingRad)
    );
    
    const newLngRad = lngRad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(radiusKm / earthRadius) * Math.cos(latRad),
      Math.cos(radiusKm / earthRadius) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    return {
      lat: (newLatRad * 180) / Math.PI,
      lng: (newLngRad * 180) / Math.PI,
      direction: dir.name
    };
  });
}

async function checkRankingAtLocation(point, businessName, placeId, apiKey) {
  try {
    // Search for business category near this point
    const searchQuery = businessName.toLowerCase().includes('plumb') ? 'plumber' :
                       businessName.toLowerCase().includes('hvac') ? 'hvac' :
                       businessName.toLowerCase().includes('dent') ? 'dentist' :
                       businessName.toLowerCase().includes('chiro') ? 'chiropractor' :
                       'service';

    const response = await fetch(
      `https://places.googleapis.com/v1/places:searchNearby`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName'
        },
        body: JSON.stringify({
          includedTypes: [searchQuery],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: point.lat, longitude: point.lng },
              radius: 8000
            }
          }
        })
      }
    );

    if (!response.ok) {
      return { direction: point.direction, found: false, rank: null };
    }

    const data = await response.json();
    const places = data.places || [];
    
    // Find business in results
    const rank = places.findIndex(p => p.id === placeId) + 1;
    
    return {
      direction: point.direction,
      found: rank > 0,
      rank: rank > 0 ? rank : null
    };

  } catch (error) {
    console.error(`Grid check failed for ${point.direction}:`, error);
    return { direction: point.direction, found: false, rank: null };
  }
}

function calculateGridScore(results) {
  const foundCount = results.filter(r => r.found).length;
  const avgRank = results.filter(r => r.found).reduce((sum, r) => sum + (r.rank || 20), 0) / results.length;
  
  // Score: 0-100 based on presence and rank
  const presenceScore = (foundCount / results.length) * 60;
  const rankScore = Math.max(0, (20 - avgRank) / 20) * 40;
  
  return Math.round(presenceScore + rankScore);
}

function generateRecommendations(score, weakZones) {
  const recs = [];
  
  if (score < 40) {
    recs.push('CRITICAL: Your business is invisible in most local searches');
    recs.push('Immediate action: Optimize service area settings in GMB');
  } else if (score < 60) {
    recs.push('Your visibility is inconsistent across your service area');
    recs.push('Focus on improving Map Pack rankings in weak zones');
  } else if (score < 80) {
    recs.push('Good local presence, but gaps remain');
    recs.push('Target specific geographic keywords to dominate all zones');
  }
  
  if (weakZones.length > 0) {
    recs.push(`Weak zones detected: ${weakZones.join(', ')}`);
    recs.push('Add location-specific content and citations for these areas');
  }
  
  return recs;
}