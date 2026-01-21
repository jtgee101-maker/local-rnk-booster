import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-Powered Referral Suggestions
 * Suggests who to refer based on network and business type
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id } = await req.json();

    // Get lead data
    const lead = lead_id 
      ? await base44.asServiceRole.entities.Lead.get(lead_id)
      : await base44.asServiceRole.entities.Lead.filter({ email: user.email }, 'created_date', 1).then(r => r[0]);

    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get all leads to analyze network
    const allLeads = await base44.asServiceRole.entities.Lead.filter({}, 'created_date', 500);

    // Generate suggestions based on:
    // 1. Same business category
    // 2. Similar health score issues
    // 3. Geographic proximity (if available)
    // 4. Not already referred

    const suggestions = [];

    // Get existing referrals to exclude
    const existingReferrals = await base44.asServiceRole.entities.Referral.filter({
      referrer_email: lead.email
    }, 'created_date', 100);
    const alreadyReferred = new Set(existingReferrals.map(r => r.referred_email));

    // Same category businesses
    const sameCategoryLeads = allLeads.filter(l => 
      l.business_category === lead.business_category &&
      l.email !== lead.email &&
      !alreadyReferred.has(l.email) &&
      l.status === 'converted' // Only suggest successful customers
    );

    sameCategoryLeads.slice(0, 3).forEach(l => {
      suggestions.push({
        type: 'category_match',
        business_name: l.business_name,
        category: l.business_category,
        reason: `Fellow ${l.business_category.replace('_', ' ')} business - they'll understand the value`,
        likelihood: 'high',
        email: l.email
      });
    });

    // Similar health score (they have similar issues)
    const similarHealthLeads = allLeads.filter(l => {
      const scoreDiff = Math.abs((l.health_score || 50) - (lead.health_score || 50));
      return scoreDiff <= 15 &&
        l.email !== lead.email &&
        !alreadyReferred.has(l.email) &&
        l.status === 'converted';
    });

    similarHealthLeads.slice(0, 2).forEach(l => {
      suggestions.push({
        type: 'similar_issues',
        business_name: l.business_name,
        health_score: l.health_score,
        reason: 'Similar GMB challenges - they need this too',
        likelihood: 'medium',
        email: l.email
      });
    });

    // AI-generated personas (businesses that typically refer each other)
    const referralPairs = {
      'home_services': ['retail', 'professional'],
      'medical': ['professional', 'retail'],
      'retail': ['home_services', 'medical'],
      'professional': ['medical', 'retail']
    };

    const complementaryCategories = referralPairs[lead.business_category] || [];
    const complementaryLeads = allLeads.filter(l =>
      complementaryCategories.includes(l.business_category) &&
      l.email !== lead.email &&
      !alreadyReferred.has(l.email) &&
      l.status === 'converted'
    );

    complementaryLeads.slice(0, 2).forEach(l => {
      suggestions.push({
        type: 'network_effect',
        business_name: l.business_name,
        category: l.business_category,
        reason: 'Complementary business - likely to be in your network',
        likelihood: 'medium',
        email: l.email
      });
    });

    // Generic suggestions if not enough specific ones
    if (suggestions.length < 5) {
      suggestions.push({
        type: 'general',
        reason: 'Any small business owner you know struggling with Google visibility',
        likelihood: 'low',
        examples: [
          'Local contractors',
          'Medical practices',
          'Restaurants & cafes',
          'Professional services',
          'Retail stores'
        ]
      });
    }

    return Response.json({
      success: true,
      suggestions: suggestions,
      referral_code: lead.email ? await generateOrGetReferralCode(base44, lead.email) : null
    });

  } catch (error) {
    console.error('Suggest referrals error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateOrGetReferralCode(base44, email) {
  const existing = await base44.asServiceRole.entities.Referral.filter({
    referrer_email: email
  }, 'created_date', 1);

  if (existing.length > 0) {
    return existing[0].referral_code;
  }

  const prefix = email.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}