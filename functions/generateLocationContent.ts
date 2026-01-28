import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate location-specific landing page content and GMB posts
 * Based on weak zones from Local Ranking Grid audit
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id, weak_zones, business_location, content_types = ['gmb_post', 'landing_page'] } = await req.json();

    if (!lead_id || !weak_zones || weak_zones.length === 0) {
      return Response.json({ 
        error: 'lead_id and weak_zones array required' 
      }, { status: 400 });
    }

    // Get lead data using service role for admin operations
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    // Get user behavior for context
    let userBehavior = null;
    try {
      const behaviors = await base44.asServiceRole.entities.UserBehavior.filter({ email: lead.email });
      if (behaviors.length > 0) {
        userBehavior = behaviors[0];
      }
    } catch (error) {
      console.log('No user behavior data available');
    }

    const googleMapsKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const generatedContent = [];

    // Process each weak zone
    for (const zone of weak_zones.slice(0, 5)) { // Limit to 5 zones
      try {
        // Get local landmarks for this zone using Google Places Nearby
        const landmarks = await fetchNearbyLandmarks(zone.lat, zone.lng, googleMapsKey);
        
        // Generate content for each type requested
        for (const contentType of content_types) {
          const content = await generateContentWithAI(base44, {
            lead,
            zone,
            landmarks,
            contentType,
            userBehavior
          });

          // Store generated content
          const locationContent = await base44.asServiceRole.entities.LocationContent.create({
            lead_id: lead.id,
            business_name: lead.business_name,
            target_location: {
              name: zone.name,
              lat: zone.lat,
              lng: zone.lng,
              distance_from_business: zone.distance
            },
            weak_zone: true,
            ranking_position: zone.current_position || null,
            local_landmarks: landmarks,
            content_type: contentType,
            generated_content: content,
            gmb_post_variations: contentType === 'gmb_post' ? content.variations : null,
            status: 'generated',
            auto_generated: true
          });

          generatedContent.push(locationContent);
        }
      } catch (error) {
        console.error(`Failed to generate content for zone ${zone.name}:`, error);
      }
    }

    return Response.json({
      success: true,
      lead_id: lead.id,
      business_name: lead.business_name,
      zones_processed: weak_zones.length,
      content_generated: generatedContent.length,
      content: generatedContent
    });

  } catch (error) {
    console.error('Generate location content error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchNearbyLandmarks(lat, lng, apiKey) {
  if (!apiKey) return [];

  try {
    const radius = 2000; // 2km radius
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=point_of_interest&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status);
      return [];
    }

    return data.results.slice(0, 10).map(place => ({
      name: place.name,
      types: place.types,
      rating: place.rating,
      vicinity: place.vicinity,
      location: place.geometry.location
    }));
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    return [];
  }
}

async function generateContentWithAI(base44, context) {
  const { lead, zone, landmarks, contentType, userBehavior } = context;

  const landmarkList = landmarks.map(l => l.name).join(', ');
  const businessCategory = lead.business_category?.replace(/_/g, ' ') || 'local business';

  let prompt = '';
  let responseSchema = {};

  if (contentType === 'gmb_post') {
    prompt = `You are an expert local SEO content writer. Create 3 engaging Google My Business post variations for "${lead.business_name}", a ${businessCategory} business.

TARGET LOCATION: ${zone.name} (${zone.distance || 'nearby'})
CURRENT RANKING: Position ${zone.current_position || 'not visible'} in this area (WEAK ZONE - needs improvement)
NEARBY LANDMARKS: ${landmarkList || 'General area'}
BUSINESS RATING: ${lead.gmb_rating || 'N/A'} stars (${lead.gmb_reviews_count || 0} reviews)

${userBehavior ? `USER CONTEXT: 
- Pages viewed: ${userBehavior.pages_viewed?.join(', ') || 'Home'}
- Engagement score: ${userBehavior.engagement_score || 'N/A'}
- Traffic source: ${userBehavior.traffic_source?.utm_source || 'Direct'}` : ''}

Create posts that:
1. Mention the specific neighborhood/area name
2. Reference nearby landmarks when relevant
3. Highlight service availability in this location
4. Include a strong call-to-action
5. Are under 1500 characters
6. Use local events or seasonal context when appropriate

Each variation should have a different angle (promotional, educational, community-focused).`;

    responseSchema = {
      type: "object",
      properties: {
        variations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headline: { type: "string" },
              body: { type: "string" },
              cta: { type: "string" },
              cta_url: { type: "string" },
              image_suggestion: { type: "string" },
              best_time_to_post: { type: "string" },
              target_audience: { type: "string" }
            }
          }
        },
        keywords: {
          type: "array",
          items: { type: "string" }
        },
        posting_schedule: { type: "string" }
      }
    };
  } else if (contentType === 'landing_page') {
    prompt = `You are an expert local SEO and conversion copywriter. Create compelling landing page content for "${lead.business_name}", a ${businessCategory} business targeting the ${zone.name} area.

TARGET LOCATION: ${zone.name} (currently ranking position ${zone.current_position || 'not visible'})
NEARBY LANDMARKS: ${landmarkList || 'General area'}
BUSINESS HEALTH SCORE: ${lead.health_score}/100
CRITICAL ISSUES: ${lead.critical_issues?.length || 0} identified

${userBehavior ? `VISITOR BEHAVIOR INSIGHTS:
- Typical engagement: ${userBehavior.engagement_score || 'N/A'}/100
- Device type: ${userBehavior.device_info?.type || 'Mixed'}` : ''}

Create SEO-optimized landing page content with:
1. Compelling headline targeting "${zone.name}" specifically
2. Hero section copy (2-3 sentences)
3. Main benefits section (3-5 bullet points)
4. Local trust signals mentioning landmarks/neighborhoods
5. Strong conversion-focused CTA
6. Meta title and description

The content should feel local, mention the area naturally, and drive conversions.`;

    responseSchema = {
      type: "object",
      properties: {
        headline: { type: "string" },
        subheadline: { type: "string" },
        hero_section: { type: "string" },
        benefits: {
          type: "array",
          items: { type: "string" }
        },
        trust_signals: {
          type: "array",
          items: { type: "string" }
        },
        cta: { type: "string" },
        meta_title: { type: "string" },
        meta_description: { type: "string" },
        keywords: {
          type: "array",
          items: { type: "string" }
        },
        local_schema_suggestions: { type: "string" }
      }
    };
  }

  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: responseSchema
    });

    return result;
  } catch (error) {
    console.error('AI content generation failed:', error);
    throw error;
  }
}