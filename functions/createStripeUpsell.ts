import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { upsellData, leadData, upsellNumber } = await req.json();

    if (!upsellData) {
      return Response.json({ error: 'Upsell data required' }, { status: 400 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TEST_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);

    // Determine next page
    const nextPage = upsellNumber === 1 ? 'Upsell' : 'ThankYou';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: upsellData.name || upsellData.product,
              description: upsellData.description || 'Premium service upgrade'
            },
            unit_amount: upsellData.price * 100
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/${nextPage}?upsell_accepted=true`,
      cancel_url: `${req.headers.get('origin')}/${nextPage}?upsell_declined=true`,
      customer_email: leadData?.email,
      metadata: {
        lead_id: leadData?.id || '',
        business_name: leadData?.business_name || '',
        upsell_name: upsellData.name || upsellData.product,
        upsell_number: upsellNumber?.toString() || '1'
      }
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe upsell error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});