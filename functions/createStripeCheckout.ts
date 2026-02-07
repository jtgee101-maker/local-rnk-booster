import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { planData, orderBumpAccepted, leadData, checkoutVersion } = await req.json();

    if (!planData) {
      return Response.json({ error: 'Plan data required' }, { status: 400 });
    }

    // MOCK MODE - RETURN FAKE CHECKOUT URL
    const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockCheckoutUrl = `${req.headers.get('origin')}/Upsell1?session_id=${mockSessionId}`;

    return Response.json({ 
      sessionId: mockSessionId,
      url: mockCheckoutUrl,
      mock: true
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});