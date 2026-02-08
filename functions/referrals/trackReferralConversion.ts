import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Track Referral Conversion
 * Called when referred user makes a purchase
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { order_id, referral_code } = await req.json();

    if (!order_id || !referral_code) {
      return Response.json({ error: 'order_id and referral_code required' }, { status: 400 });
    }

    // Get order
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Find referral
    const referrals = await base44.asServiceRole.entities.Referral.filter({
      referral_code: referral_code,
      status: 'pending'
    }, 'created_date', 1);

    if (referrals.length === 0) {
      return Response.json({ error: 'Referral not found or already converted' }, { status: 404 });
    }

    const referral = referrals[0];

    // Check if expired
    if (new Date(referral.expires_at) < new Date()) {
      await base44.asServiceRole.entities.Referral.update(referral.id, {
        status: 'expired'
      });
      return Response.json({ error: 'Referral link expired' }, { status: 400 });
    }

    // Mark as converted
    await base44.asServiceRole.entities.Referral.update(referral.id, {
      status: 'converted',
      referred_email: order.email,
      converted_date: new Date().toISOString()
    });

    // Check if referrer is an affiliate (gets commission) or regular user (gets credit)
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({
      email: referral.referrer_email,
      status: 'active'
    }, 'created_date', 1);

    if (affiliates.length > 0) {
      // Affiliate - give commission
      const affiliate = affiliates[0];
      const commission = order.total_amount * (affiliate.commission_rate / 100);

      await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
        total_referrals: (affiliate.total_referrals || 0) + 1,
        successful_conversions: (affiliate.successful_conversions || 0) + 1,
        total_commission_earned: (affiliate.total_commission_earned || 0) + commission,
        pending_commission: (affiliate.pending_commission || 0) + commission
      });

      // Update tier based on performance
      const newTier = calculateAffiliateTier(affiliate.successful_conversions + 1);
      if (newTier !== affiliate.tier) {
        await base44.asServiceRole.entities.Affiliate.update(affiliate.id, { tier: newTier });
      }

      // Send commission notification
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: affiliate.email,
        from_name: 'LocalRank Affiliates',
        subject: `🎉 You earned $${commission.toFixed(2)} commission!`,
        body: `Congratulations! Your referral just converted.\n\nCommission: $${commission.toFixed(2)}\nTotal Earned: $${(affiliate.total_commission_earned + commission).toFixed(2)}\n\nKeep sharing to earn more!`
      });
    } else {
      // Regular referral - give credit to both parties
      // Referrer gets $100 credit
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: referral.referrer_email,
        from_name: 'LocalRank',
        subject: '🎉 You earned $100 referral credit!',
        body: `Great news! Your referral just purchased.\n\nYou've earned $100 in account credit. Use code REF${referral.referral_code} at checkout.\n\nKeep referring to earn more!`
      });

      // Referred user gets $100 discount
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: order.email,
        from_name: 'LocalRank',
        subject: '🎁 Thanks for using a referral! Here\'s $100 off',
        body: `Welcome! Since you used a referral link, enjoy $100 off your next purchase.\n\nUse code REFERRED${referral.referral_code} at checkout.\n\nP.S. Refer your own friends to earn credits too!`
      });
    }

    return Response.json({
      success: true,
      message: 'Referral conversion tracked successfully'
    });

  } catch (error) {
    console.error('Track referral conversion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

function calculateAffiliateTier(conversions) {
  if (conversions >= 50) return 'platinum';
  if (conversions >= 20) return 'gold';
  if (conversions >= 10) return 'silver';
  return 'bronze';
}