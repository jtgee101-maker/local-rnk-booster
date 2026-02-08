import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { amount, email, metadata } = await req.json();

    if (!amount || !email) {
      return Response.json({ error: 'Amount and email required' }, { status: 400 });
    }

    // MOCK MODE - NO STRIPE CALLS, RETURN FAKE DATA FOR TESTING
    const mockClientSecret = `pi_test_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`;
    const mockPaymentIntentId = `pi_test_${Date.now()}`;

    return Response.json({ 
      clientSecret: mockClientSecret,
      paymentIntentId: mockPaymentIntentId,
      mock: true
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));