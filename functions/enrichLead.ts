import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ENRICHLAYER_KEY = Deno.env.get('ENRICHLAYER_API_KEY');
const BASE_URL = 'https://enrichlayer.com';

async function callEnrichLayer(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${ENRICHLAYER_KEY}` }
  });
  if (!res.ok) return null;
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let lead_id, email, currentStatus;

    // Handle both automation payload and direct call
    if (body.event) {
      lead_id = body.event.entity_id;
      email = body.data?.email;
      currentStatus = body.data?.enrichment_status;
    } else {
      lead_id = body.lead_id;
      email = body.email;
    }

    if (!lead_id || !email) {
      return Response.json({ error: 'lead_id and email required' }, { status: 400 });
    }

    // Skip if already enriched (unless forced)
    if (currentStatus === 'enriched' && !body.force) {
      return Response.json({ skipped: true, reason: 'Already enriched' });
    }

    // Mark as in-progress
    await base44.asServiceRole.entities.Lead.update(lead_id, { enrichment_status: 'pending' });

    // Run both checks in parallel
    const [disposableData, profileData] = await Promise.all([
      callEnrichLayer(`/api/v2/disposable-email?email=${encodeURIComponent(email)}`),
      callEnrichLayer(`/api/v2/profile/resolve/email?email=${encodeURIComponent(email)}&lookup_depth=superficial&enrich_profile=enrich`)
    ]);

    const profile = profileData?.profile || null;
    const isDisposable = disposableData?.is_disposable_email || false;

    const enrichmentData = {
      profile: profile ? {
        full_name: profile.full_name,
        occupation: profile.occupation,
        headline: profile.headline,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        profile_pic_url: profile.profile_pic_url,
        current_company: profile.experiences?.[0]?.company || null,
        current_title: profile.experiences?.[0]?.title || null,
        skills: profile.skills?.slice(0, 10) || [],
        follower_count: profile.follower_count
      } : null,
      linkedin_url: profileData?.linkedin_profile_url || null,
      facebook_url: profileData?.facebook_profile_url || null,
      twitter_url: profileData?.twitter_profile_url || null,
      is_free_email: disposableData?.is_free_email || false,
      enriched_at: new Date().toISOString()
    };

    await base44.asServiceRole.entities.Lead.update(lead_id, {
      enrichment_data: enrichmentData,
      is_disposable_email: isDisposable,
      enrichment_status: profile ? 'enriched' : 'not_found'
    });

    return Response.json({
      success: true,
      enriched: !!profile,
      is_disposable: isDisposable,
      name: profile?.full_name || null,
      company: enrichmentData.profile?.current_company || null
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});