import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { paymentIntentId, leadData, planData, orderBumpAccepted } = await req.json();

    if (!paymentIntentId) {
      return Response.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    // HARDCODED TEST KEY - WORKS WITHOUT SECRETS
    const stripeKey = 'sk_test_51QdVqxP5bN7rNnPyKkXZ8kLmJ0jYvH8X9xGdW4NnrPqJ5vTcS2mE1aF3bR6gD9kL7wN4hV8pQ2yZ5tM3nB1xC0oJ00KZ5vT8mE';

    const stripe = new Stripe(stripeKey);

    // Retrieve payment intent to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Create order record
      const orderData = {
        lead_id: leadData?.id || null,
        email: leadData?.email,
        stripe_payment_intent: paymentIntentId,
        status: 'completed',
        total_amount: paymentIntent.amount / 100,
        base_offer: {
          product: planData?.product || 'GMB Optimization & Audit',
          price: planData?.price || 99
        },
        order_bumps: orderBumpAccepted ? [{
          product: '5 Geo-Tagged Photos',
          price: 49,
          selected: true
        }] : []
      };

      await base44.asServiceRole.entities.Order.create(orderData);

      // Send order confirmation email
      try {
        await base44.asServiceRole.functions.invoke('sendOrderConfirmation', {
          email: leadData?.email,
          businessName: leadData?.business_name,
          orderAmount: paymentIntent.amount / 100,
          productName: planData?.product || 'GMB Optimization & Audit'
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      return Response.json({ 
        success: true,
        orderId: orderData.id 
      });
    } else {
      return Response.json({ 
        success: false,
        status: paymentIntent.status 
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});