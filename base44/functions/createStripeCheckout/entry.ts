import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const { planData, orderBumpAccepted, leadData, checkoutVersion } = await req.json();

    if (!planData) return Response.json({ error: 'Plan data required' }, { status: 400 });

    // MOCK MODE - return fake checkout URL
    const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockCheckoutUrl = `${req.headers.get('origin')}/Upsell1?session_id=${mockSessionId}`;

    return Response.json({ sessionId: mockSessionId, url: mockCheckoutUrl, mock: true });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});