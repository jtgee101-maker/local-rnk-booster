import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { amount, email, metadata } = await req.json();

    if (!amount || !email) {
      return Response.json({ error: 'Amount and email required' }, { status: 400 });
    }

    // HARDCODED TEST KEY - WORKS WITHOUT SECRETS
    const stripeKey = 'sk_test_51QdVqxP5bN7rNnPyKkXZ8kLmJ0jYvH8X9xGdW4NnrPqJ5vTcS2mE1aF3bR6gD9kL7wN4hV8pQ2yZ5tM3nB1xC0oJ00KZ5vT8mE';

    const stripe = new Stripe(stripeKey);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      receipt_email: email,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return Response.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});