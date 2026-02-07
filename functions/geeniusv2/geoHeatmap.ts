import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { placeId, businessName, location, keyword, radiusMiles = 5 } = body;

    console.log('🗺️ Heatmap request received:', JSON.stringify({ placeId, businessName, location, keyword, radiusMiles }));

    // Validate required fields
    if (!businessName) {
      throw new Error('Business name is required');
    }

    if (!keyword) {
      throw new Error('Keyword is required');
    }

    // Handle location - support both {lat, lng} and {latitude, longitude}
    let lat, lng;
    if (location) {
      lat = location.lat || location.latitude;
      lng = location.lng || location.longitude;
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('❌ Invalid location:', location);
      throw new Error('Valid location coordinates (lat, lng) are required');
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    console.log(`✅ Valid coordinates: ${lat}, ${lng}`);

    // Generate fewer nodes for faster processing (25 nodes = 5x5 grid)
    const radius = radiusMiles * 1609.34; // Convert miles to meters
    const gridNodes = generateGridNodes(lat, lng, radius, 5); // 5x5 grid
    
    console.log(`✅ Generated ${gridNodes.length} grid nodes for ${radiusMiles} mile radius`);

    // Check ranking at each node with rate limiting
    const heatmapData = [];
    let successfulChecks = 0;
    
    for (let i = 0; i < gridNodes.length; i++) {
      const node = gridNodes[i];
      
      const rank = await checkRankingAtLocation(
        apiKey,
        placeId,
        node.lat,
        node.lng,
        keyword,
        businessName
      );

      if (rank !== null) {
        successfulChecks++;
      }

      heatmapData.push({
        lat: node.lat,
        lng: node.lng,
        rank,
        color: getRankColor(rank),
        label: node.label,
        distance: node.distanceFromCenter
      });

      // Rate limiting - wait 100ms between requests
      if (i < gridNodes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Completed ${successfulChecks}/${gridNodes.length} ranking checks`);

    // Calculate visibility metrics
    const visibilityScore = calculateVisibilityScore(heatmapData);
    const weakZones = heatmapData.filter(node => node.rank > 10 || node.rank === null);
    const strongZones = heatmapData.filter(node => node.rank <= 3);
    const avgRank = calculateAverageRank(heatmapData);

    const results = {
      gridSize: gridNodes.length,
      radiusMiles,
      centerLocation: { lat, lng },
      heatmapData,
      visibilityScore,
      averageRank: avgRank || 0,
      strongZones: strongZones.length,
      weakZones: weakZones.length,
      recommendations: generateGeoRecommendations(heatmapData, weakZones, { lat, lng })
    };

    console.log('📊 Final heatmap results:', {
      gridSize: results.gridSize,
      visibilityScore: results.visibilityScore,
      avgRank: results.averageRank,
      strongZones: results.strongZones,
      weakZones: results.weakZones,
      successfulChecks
    });

    return Response.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Geo heatmap generation failed:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({
      success: false,
      error: error.message,
      message: 'Heatmap analysis failed. Please try again.'
    }, { status: 500 });
  }
});

function generateGridNodes(centerLat, centerLng, radiusMeters, gridSize = 5) {
  const nodes = [];
  const step = (radiusMeters * 2) / (gridSize - 1);

  // Convert radius to approximate degrees
  const latDegreePerMeter = 1 / 111320;
  const lngDegreePerMeter = 1 / (111320 * Math.cos(centerLat * Math.PI / 180));

  const radiusLat = radiusMeters * latDegreePerMeter;
  const radiusLng = radiusMeters * lngDegreePerMeter;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat - radiusLat + (i * step * latDegreePerMeter);
      const lng = centerLng - radiusLng + (j * step * lngDegreePerMeter);

      // Only include nodes within the circular radius
      const distance = getDistance(centerLat, centerLng, lat, lng);
      if (distance <= radiusMeters) {
        nodes.push({
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          label: `Zone ${i}-${j}`,
          distanceFromCenter: Math.round(distance / 1609.34 * 10) / 10 // miles
        });
      }
    }
  }

  return nodes;
}

async function checkRankingAtLocation(apiKey, targetPlaceId, lat, lng, keyword, businessName) {
  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const requestBody = {
      textQuery: keyword,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 500.0 // 500m proximity focus
        }
      },
      maxResultCount: 20
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Places API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const places = data.places || [];

    console.log(`🔍 Checked location (${lat.toFixed(4)}, ${lng.toFixed(4)}): Found ${places.length} results`);

    // Find rank of target business
    for (let i = 0; i < places.length; i++) {
      if (places[i].id === targetPlaceId || 
          places[i].displayName?.text?.toLowerCase().includes(businessName.toLowerCase())) {
        console.log(`✅ Found business "${businessName}" at rank ${i + 1}`);
        return i + 1; // Rank (1-indexed)
      }
    }

    console.log(`⚠️ Business "${businessName}" not found in top ${places.length} results`);
    return null; // Not found in top 20
  } catch (error) {
    console.error('❌ Ranking check failed:', error);
    return null;
  }
}

function getRankColor(rank) {
  if (rank === null) return 'red'; // Not found
  if (rank <= 3) return 'green';   // Top 3
  if (rank <= 10) return 'orange'; // Map pack
  return 'red';                     // Below map pack
}

function calculateVisibilityScore(heatmapData) {
  const validNodes = heatmapData.filter(node => node.rank !== null);
  if (validNodes.length === 0) return 0;

  const totalScore = validNodes.reduce((sum, node) => {
    if (node.rank <= 3) return sum + 100;
    if (node.rank <= 10) return sum + 50;
    return sum + 10;
  }, 0);

  const maxPossibleScore = heatmapData.length * 100;
  return Math.round((totalScore / maxPossibleScore) * 100);
}

function calculateAverageRank(heatmapData) {
  const validNodes = heatmapData.filter(node => node.rank !== null && node.rank > 0);
  if (validNodes.length === 0) return 0;

  const sum = validNodes.reduce((acc, node) => acc + node.rank, 0);
  return parseFloat((sum / validNodes.length).toFixed(1));
}

function generateGeoRecommendations(heatmapData, weakZones, centerLocation) {
  const recommendations = [];

  if (weakZones.length > heatmapData.length * 0.5) {
    recommendations.push({
      priority: 'critical',
      issue: 'Low visibility across service area',
      suggestion: 'Create location-specific landing pages and GMB posts for weak zones. Focus on local landmarks and neighborhood names.',
      weakZoneCount: weakZones.length
    });
  }

  // Identify directional patterns
  const centerLat = centerLocation.lat;
  const centerLng = centerLocation.lng;
  
  const north = weakZones.filter(z => z.lat > centerLat).length;
  const south = weakZones.filter(z => z.lat < centerLat).length;
  const east = weakZones.filter(z => z.lng > centerLng).length;
  const west = weakZones.filter(z => z.lng < centerLng).length;

  const maxWeak = Math.max(north, south, east, west);
  if (maxWeak > 3) {
    const direction = maxWeak === north ? 'North' : maxWeak === south ? 'South' : maxWeak === east ? 'East' : 'West';
    recommendations.push({
      priority: 'high',
      issue: `Weak visibility in ${direction} direction`,
      suggestion: `Create GMB posts mentioning neighborhoods/landmarks ${direction} of your location. Update "Service Area" settings.`,
      weakZoneCount: maxWeak
    });
  }

  // Always provide at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'medium',
      issue: 'Geographic visibility optimization needed',
      suggestion: 'Add neighborhood-specific keywords to your GMB description and create posts targeting different service areas.',
      weakZoneCount: weakZones.length
    });
  }

  return recommendations;
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}