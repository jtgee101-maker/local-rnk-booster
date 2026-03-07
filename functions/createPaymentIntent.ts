import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const { amount, email, metadata } = await req.json();

    if (!amount || !email) return Response.json({ error: 'Amount and email required' }, { status: 400 });

    // MOCK MODE - return fake data for testing
    const mockClientSecret = `pi_test_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`;
    const mockPaymentIntentId = `pi_test_${Date.now()}`;

    return Response.json({ clientSecret: mockClientSecret, paymentIntentId: mockPaymentIntentId, mock: true });
  } catch (error) {
    console.error('Payment intent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});