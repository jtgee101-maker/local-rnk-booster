import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

const logError = async (base44, errorType, message, metadata) => {
  try {
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type: errorType,
      severity: 'high',
      message,
      metadata
    });
  } catch (e) {
    console.error('Failed to log error:', e);
  }
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TEST_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeKey) {
    console.warn('Stripe key not configured - webhook processing disabled');
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const isTestMode = stripeKey.startsWith('sk_test_');
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;

  try {
    if (webhookSecret && signature) {
      const stripe = new Stripe(stripeKey);
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else if (isTestMode && !signature) {
      // Only allow unsigned in explicit test mode AND no webhook secret configured
      console.log('[TEST MODE] Processing webhook without signature - set STRIPE_WEBHOOK_SECRET for production');
      event = JSON.parse(body);
    } else {
      return Response.json({ error: 'Webhook signature required' }, { status: 400 });
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    await logError(base44, 'stripe_webhook', `Webhook verification failed: ${err.message}`, {});
    return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const customerEmail = session.customer_email || session.customer_details?.email;

        const orderData = {
          lead_id: metadata.lead_id || null,
          email: customerEmail,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          status: 'completed',
          total_amount: (session.amount_total || 0) / 100
        };

        if (metadata.plan_name) {
          orderData.base_offer = { product: metadata.plan_name, price: orderData.total_amount };
          orderData.order_bumps = metadata.order_bump === 'yes' ? [{ product: 'Review Generation Campaign', price: 47, selected: true }] : [];
        } else if (metadata.upsell_name) {
          orderData.upsells = [{ product: metadata.upsell_name, price: orderData.total_amount, accepted: true }];
        }

        await base44.asServiceRole.entities.Order.create(orderData);

        // Update lead status to converted
        if (metadata.lead_id) {
          await base44.asServiceRole.entities.Lead.update(metadata.lead_id, { status: 'converted' }).catch(() => {});
        } else if (customerEmail) {
          const leads = await base44.asServiceRole.entities.Lead.filter({ email: customerEmail });
          if (leads.length > 0) {
            await base44.asServiceRole.entities.Lead.update(leads[0].id, { status: 'converted' }).catch(() => {});
          }
        }

        // Send order confirmation (fire and forget)
        if (customerEmail) {
          base44.asServiceRole.functions.invoke('sendOrderConfirmation', {
            email: customerEmail,
            businessName: metadata.business_name,
            orderAmount: orderData.total_amount,
            productName: metadata.plan_name || metadata.upsell_name
          }).catch(e => console.error('Order confirmation email failed:', e));
        }

        console.log('✅ checkout.session.completed processed:', session.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('Payment failed:', paymentIntent.id);
        await logError(base44, 'payment_failure', 'Payment failed', {
          payment_intent_id: paymentIntent.id,
          failure_message: paymentIntent.last_payment_error?.message,
          customer: paymentIntent.customer
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const orders = await base44.asServiceRole.entities.Order.filter({ stripe_payment_intent: charge.payment_intent });
        if (orders.length > 0) {
          await base44.asServiceRole.entities.Order.update(orders[0].id, {
            status: 'refunded',
            refund_amount: charge.amount_refunded / 100,
            refund_date: new Date().toISOString()
          });
        }
        console.log('✅ charge.refunded processed:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    await logError(base44, 'stripe_webhook', `Webhook processing failed: ${error.message}`, {
      event_type: event?.type,
      error_stack: error.stack
    });
    return Response.json({ error: error.message }, { status: 500 });
  }
});