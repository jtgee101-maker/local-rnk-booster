import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Create Referral Link
 * Generate unique referral code and track referrals
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referrer_email, referrer_business, referred_email, referred_business } = await req.json();

    // Generate unique referral code
    const referralCode = generateReferralCode(referrer_email || user.email);

    // Check if referral already exists
    const existingReferrals = await base44.asServiceRole.entities.Referral.filter({
      referrer_email: referrer_email || user.email,
      referred_email: referred_email
    }, 'created_date', 1);

    if (existingReferrals.length > 0) {
      return Response.json({
        success: false,
        error: 'Referral already exists',
        referral: existingReferrals[0]
      });
    }

    // Set expiration (90 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const referral = await base44.asServiceRole.entities.Referral.create({
      referrer_email: referrer_email || user.email,
      referrer_business: referrer_business,
      referral_code: referralCode,
      referred_email: referred_email || null,
      referred_business: referred_business || null,
      status: 'pending',
      credit_amount: 100,
      credit_claimed: false,
      expires_at: expiresAt.toISOString()
    });

    // Generate referral URL
    const referralUrl = `https://${req.headers.get('host')}/quiz-v3?ref=${referralCode}`;

    return Response.json({
      success: true,
      referral: referral,
      referral_url: referralUrl,
      message: 'Share this link to earn $100 credit when they purchase!'
    });

  } catch (error) {
    console.error('Create referral error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

function generateReferralCode(email) {
  const prefix = email.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}