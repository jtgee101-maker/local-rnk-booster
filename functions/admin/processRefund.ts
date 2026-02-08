import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';
import Stripe from 'npm:stripe';
import { isStripeTestMode, mockRefund } from './utils/stripeTestRelay.js';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { orderId, amount, reason } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Get order
    const order = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    if (!order || order.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = order[0];

    // TEST MODE RELAY
    const isTestMode = isStripeTestMode();
    let refundData;

    if (isTestMode) {
      // MOCK REFUND - No Stripe API calls
      refundData = mockRefund(orderId, amount || orderData.total_amount);
    } else {
      // PRODUCTION MODE - Real Stripe API call
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });

      const refund = await stripe.refunds.create({
        payment_intent: orderData.stripe_payment_intent,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason || 'requested_by_customer'
      });

      refundData = {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        test_mode: false
      };
    }

    // Update order status
    await base44.asServiceRole.entities.Order.update(orderId, {
      status: 'refunded',
      refund_id: refundData.id,
      refund_amount: refundData.amount,
      refund_date: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      refund: refundData
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}));