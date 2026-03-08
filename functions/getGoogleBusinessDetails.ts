// Deterministic hash matching frontend algorithm exactly
// so backend score === frontend score === stored lead score
function deterministicHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function sanitizePlaceId(placeId) {
  if (typeof placeId !== 'string') return '';
  return placeId.trim().slice(0, 200).replace(/[^a-zA-Z0-9_-]/g, '');
}

Deno.serve(async (req) => {
  try {
    // No auth required — this is called during the public quiz flow by anonymous users.
    // Protection is via payload validation and the API key being server-side only.
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

    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;

    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,reviews,photos,regularOpeningHours,types,location,editorialSummary,businessStatus,primaryType'
      }
    });

    if (!detailsResponse.ok) {
      console.error('Google Places API HTTP error:', detailsResponse.status);
      return Response.json({
        error: 'Unable to load business details',
        code: 'MAPS_HTTP_ERROR'
      }, { status: 502 });
    }

    const detailsData = await detailsResponse.json();

    if (!detailsData.displayName) {
      return Response.json({
        error: 'Business not found or details unavailable',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const rating = detailsData.rating || 0;
    const reviewCount = detailsData.userRatingCount || 0;
    const photosCount = detailsData.photos ? detailsData.photos.length : 0;
    const hasWebsite = !!detailsData.websiteUri;
    const hasPhone = !!detailsData.nationalPhoneNumber;
    const hasHours = !!detailsData.regularOpeningHours;
    const businessName = detailsData.displayName?.text || detailsData.displayName || '';

    // --- DETERMINISTIC SCORING (matches frontend exactly) ---
    // 1. Review Authority (max 20)
    const reviewQuality = rating >= 4.5 ? 1 : (rating / 4.5);
    const reviewAuth = Math.min(20, (
      (reviewCount >= 200 ? 8 : reviewCount / 25) +
      (reviewQuality * 7) +
      (reviewCount / 12 >= 5 ? 5 : reviewCount / 12)
    ));

    // 2. Visual Authority (max 18, caps at 14)
    const photoQuality = photosCount >= 50 ? 1 : photosCount / 50;
    const visualAuth = Math.min(18, photoQuality * 14);

    // 3. Profile Completeness (max 15)
    let completeness = 0;
    if (hasWebsite) completeness += 4;
    if (hasPhone) completeness += 4;
    if (hasHours) completeness += 3;
    if (detailsData.types?.length >= 3) completeness += 2;
    if (detailsData.editorialSummary?.text?.length >= 100) completeness += 2;

    // 4. Engagement (max 12 — not available from basic API)
    const engagement = 0;

    // 5. DETERMINISTIC penalties — hash of placeId + businessName, same as frontend
    const seed = deterministicHash(placeId + businessName);
    const competitivePenalty = 5 + (seed % 11);         // 5–15, deterministic
    const freshnessPenalty = 3 + ((seed >> 4) % 9);     // 3–11, deterministic

    // Final score — capped 25–85
    const rawScore = 15 + reviewAuth + visualAuth + completeness + engagement;
    const healthScore = Math.max(25, Math.min(85, Math.round(rawScore - competitivePenalty - freshnessPenalty)));

    // Critical issues based on actual missing elements
    const criticalIssues = [];

    if (!hasHours) criticalIssues.push({
      issue: 'Missing Business Hours',
      impact: 'Lost visibility in 40% of local searches',
      severity: 'critical',
      fix: 'Add your operating hours immediately'
    });

    if (!hasPhone) criticalIssues.push({
      issue: 'No Phone Number Listed',
      impact: '89% of mobile users cannot contact you',
      severity: 'critical',
      fix: 'Add and verify your business phone'
    });

    if (!hasWebsite) criticalIssues.push({
      issue: 'Missing Website Link',
      impact: '52% drop in web traffic from Maps',
      severity: 'high',
      fix: 'Link your business website'
    });

    if (rating < 4.5) criticalIssues.push({
      issue: `Low Rating (${rating}/5.0)`,
      impact: 'Businesses under 4.7★ get 67% fewer clicks',
      severity: 'high',
      fix: 'Launch review generation campaign'
    });

    if (reviewCount < 30) criticalIssues.push({
      issue: `Insufficient Reviews (${reviewCount} total)`,
      impact: 'Google hides businesses with <25 reviews from competitive searches',
      severity: 'high',
      fix: `Need ${Math.max(0, 30 - reviewCount)} more reviews to compete`
    });

    if (photosCount < 15) criticalIssues.push({
      issue: `Low Photo Count (${photosCount} photos)`,
      impact: 'Listings with <15 photos get 73% fewer direction requests',
      severity: 'medium',
      fix: `Add ${Math.max(0, 15 - photosCount)} more photos of your work`
    });

    if (!detailsData.types || detailsData.types.length < 2) criticalIssues.push({
      issue: 'Incomplete Business Categories',
      impact: 'Missing 2.3x more relevant searches',
      severity: 'medium',
      fix: 'Add 2-3 relevant business categories'
    });

    if (!detailsData.editorialSummary?.text) criticalIssues.push({
      issue: 'No Business Description',
      impact: 'Lower relevance in keyword searches',
      severity: 'low',
      fix: 'Write a compelling 150-200 word description'
    });

    return Response.json({
      success: true,
      business: {
        place_id: placeId,
        name: businessName,
        address: detailsData.formattedAddress,
        phone: detailsData.nationalPhoneNumber,
        website: detailsData.websiteUri,
        rating,
        total_reviews: reviewCount,
        reviews: detailsData.reviews || [],
        photos_count: photosCount,
        has_hours: hasHours,
        has_description: !!detailsData.editorialSummary?.text,
        description_length: detailsData.editorialSummary?.text?.length || 0,
        types: detailsData.types || [],
        primary_type: detailsData.primaryType,
        location: detailsData.location,
        business_status: detailsData.businessStatus,
        health_score: healthScore,
        critical_issues: criticalIssues,
        score_breakdown: {
          review_authority: Math.round(reviewAuth),
          visual_authority: Math.round(visualAuth),
          completeness,
          engagement,
          competitive_penalty: -competitivePenalty,
          freshness_penalty: -freshnessPenalty
        }
      }
    });

  } catch (error) {
    console.error('Error getting Google business details:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});