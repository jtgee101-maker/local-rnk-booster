import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';
import Stripe from 'npm:stripe@17.5.0';

const logError = async (base44, errorType, message, metadata) => {
  try {
    await base44.functions.invoke('logError', {
      error_type: errorType,
      severity: 'high',
      message,
      metadata
    });
  } catch (e) {
    console.error('Failed to log error:', e);
  }
};

Deno.serve(withDenoErrorHandler(async (req) => {
  const base44 = createClientFromRequest(req);
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TEST_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  // TEST MODE RELAY - Allow webhook processing without Stripe key
  const isTestMode = !stripeKey || stripeKey.startsWith('sk_test_');

  if (!isTestMode && !stripeKey) {
    await logError(base44, 'stripe_webhook', 'Stripe API key not configured', {});
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;

  try {
    // TEST MODE - Accept raw JSON without signature verification
    if (isTestMode && !signature) {
      console.log('[TEST MODE] Processing webhook without signature verification');
      event = JSON.parse(body);
    } 
    // PRODUCTION MODE - Verify webhook signature
    else if (webhookSecret && signature) {
      const stripe = new Stripe(stripeKey);
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } 
    // Fallback - Parse as JSON
    else {
      event = JSON.parse(body);
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
        const metadata = session.metadata;

        try {
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
        } catch (error) {
          await logError(base44, 'stripe_webhook', `Failed to process checkout.session.completed: ${error.message}`, {
            session_id: session.id,
            metadata
          });
          throw error;
        }

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

      default:
        console.log(`Unhandled event type: ${event.type}`);
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