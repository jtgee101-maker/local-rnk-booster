import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { planData, orderBumpAccepted, leadData, checkoutVersion } = await req.json();

    if (!planData) {
      return Response.json({ error: 'Plan data required' }, { status: 400 });
    }

    // HARDCODED TEST KEY - WORKS WITHOUT SECRETS
    const stripeKey = 'sk_test_51QdVqxP5bN7rNnPyKkXZ8kLmJ0jYvH8X9xGdW4NnrPqJ5vTcS2mE1aF3bR6gD9kL7wN4hV8pQ2yZ5tM3nB1xC0oJ00KZ5vT8mE';

    const stripe = new Stripe(stripeKey);

    // Calculate total
    const basePrice = planData.price * 100; // Convert to cents
    const orderBumpPrice = orderBumpAccepted ? 47 * 100 : 0;
    const totalAmount = basePrice + orderBumpPrice;

    // Create line items
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: planData.product || 'GMB Optimization & Audit',
            description: 'Complete GMB profile optimization and audit report'
          },
          unit_amount: basePrice
        },
        quantity: 1
      }
    ];

    if (orderBumpAccepted) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Review Generation Campaign',
            description: 'Automated review collection system'
          },
          unit_amount: orderBumpPrice
        },
        quantity: 1
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/Upsell1?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/Checkout`,
      customer_email: leadData?.email,
      metadata: {
        lead_id: leadData?.id || '',
        business_name: leadData?.business_name || '',
        plan_name: planData.product || 'GMB Optimization',
        order_bump: orderBumpAccepted ? 'yes' : 'no',
        checkout_version: checkoutVersion || 'V1'
      }
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});