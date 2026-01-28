import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { placeId, businessName, location, keyword, radiusMiles } = await req.json();

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Generate geo-grid nodes in a circular pattern
    const radius = (radiusMiles || 5) * 1609.34; // Convert miles to meters
    const gridNodes = generateGridNodes(location.lat, location.lng, radius);

    // Check ranking at each node
    const heatmapData = [];
    
    for (const node of gridNodes) {
      const rank = await checkRankingAtLocation(
        apiKey,
        placeId,
        node.lat,
        node.lng,
        keyword,
        businessName
      );

      heatmapData.push({
        lat: node.lat,
        lng: node.lng,
        rank,
        color: getRankColor(rank),
        label: node.label
      });

      // Rate limiting - 50ms delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Calculate visibility metrics
    const visibilityScore = calculateVisibilityScore(heatmapData);
    const weakZones = heatmapData.filter(node => node.rank > 10 || node.rank === null);
    const strongZones = heatmapData.filter(node => node.rank <= 3);

    return Response.json({
      success: true,
      data: {
        gridSize: gridNodes.length,
        radiusMiles,
        centerLocation: location,
        heatmapData,
        visibilityScore,
        averageRank: calculateAverageRank(heatmapData),
        strongZones: strongZones.length,
        weakZones: weakZones.length,
        recommendations: generateGeoRecommendations(heatmapData, weakZones)
      }
    });

  } catch (error) {
    console.error('Geo heatmap generation failed:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});

function generateGridNodes(centerLat, centerLng, radiusMeters) {
  const nodes = [];
  const gridSize = 7; // 7x7 = 49 nodes
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
          lat,
          lng,
          label: `Node ${i}-${j}`,
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
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName'
      },
      body: JSON.stringify({
        textQuery: keyword,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 500.0 // 500m proximity focus
          }
        },
        maxResultCount: 20
      })
    });

    if (!response.ok) {
      console.error('Places API error:', response.status);
      return null;
    }

    const data = await response.json();
    const places = data.places || [];

    // Find rank of target business
    for (let i = 0; i < places.length; i++) {
      if (places[i].id === targetPlaceId || 
          places[i].displayName?.text?.toLowerCase().includes(businessName.toLowerCase())) {
        return i + 1; // Rank (1-indexed)
      }
    }

    return null; // Not found in top 20
  } catch (error) {
    console.error('Ranking check failed:', error);
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
  const validNodes = heatmapData.filter(node => node.rank !== null);
  if (validNodes.length === 0) return null;

  const sum = validNodes.reduce((acc, node) => acc + node.rank, 0);
  return (sum / validNodes.length).toFixed(1);
}

function generateGeoRecommendations(heatmapData, weakZones) {
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
  const north = weakZones.filter(z => z.lat > heatmapData[0].lat).length;
  const south = weakZones.filter(z => z.lat < heatmapData[0].lat).length;
  const east = weakZones.filter(z => z.lng > heatmapData[0].lng).length;
  const west = weakZones.filter(z => z.lng < heatmapData[0].lng).length;

  const maxWeak = Math.max(north, south, east, west);
  if (maxWeak > 5) {
    const direction = maxWeak === north ? 'North' : maxWeak === south ? 'South' : maxWeak === east ? 'East' : 'West';
    recommendations.push({
      priority: 'high',
      issue: `Weak visibility in ${direction} direction`,
      suggestion: `Create GMB posts mentioning neighborhoods/landmarks ${direction} of your location. Update "Service Area" settings.`
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