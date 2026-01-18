import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TEST_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;

  try {
    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  // Initialize base44 after signature verification
  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata;

        // Create order record
        const orderData = {
          lead_id: metadata.lead_id || null,
          email: session.customer_email || session.customer_details?.email,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          status: 'completed',
          total_amount: session.amount_total / 100
        };

        // Add base offer or upsell details
        if (metadata.plan_name) {
          orderData.base_offer = {
            product: metadata.plan_name,
            price: session.amount_total / 100
          };
          orderData.order_bumps = metadata.order_bump === 'yes' ? [{
            product: 'Review Generation Campaign',
            price: 47,
            selected: true
          }] : [];
        } else if (metadata.upsell_name) {
          orderData.upsells = [{
            product: metadata.upsell_name,
            price: session.amount_total / 100,
            accepted: true
          }];
        }

        await base44.asServiceRole.entities.Order.create(orderData);

        // Send order confirmation email
        if (session.customer_email) {
          await base44.asServiceRole.functions.invoke('sendOrderConfirmation', {
            email: session.customer_email,
            businessName: metadata.business_name,
            orderAmount: session.amount_total / 100,
            productName: metadata.plan_name || metadata.upsell_name
          });
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('Payment failed:', paymentIntent.id);
        // Could send failure notification email here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});