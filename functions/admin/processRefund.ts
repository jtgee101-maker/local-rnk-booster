import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { orderId, amount, reason } = await req.json();
    if (!orderId) return Response.json({ error: 'Order ID required' }, { status: 400 });

    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    if (!orders || orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orders[0];
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const isTestMode = !stripeKey || stripeKey.startsWith('sk_test_');

    let refundData;

    if (isTestMode) {
      // Mock refund - no Stripe API call needed
      refundData = {
        id: `re_test_${Date.now()}`,
        amount: amount || orderData.total_amount,
        status: 'succeeded',
        test_mode: true
      };
      console.log(`[TEST MODE] Mock refund for order ${orderId}, amount: ${refundData.amount}`);
    } else {
      const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
      const refund = await stripe.refunds.create({
        payment_intent: orderData.stripe_payment_intent,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason || 'requested_by_customer'
      });
      refundData = { id: refund.id, amount: refund.amount / 100, status: refund.status, test_mode: false };
    }

    await base44.asServiceRole.entities.Order.update(orderId, {
      status: 'refunded',
      refund_id: refundData.id,
      refund_amount: refundData.amount,
      refund_date: new Date().toISOString()
    });

    return Response.json({ success: true, refund: refundData });

  } catch (error) {
    console.error('processRefund error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});