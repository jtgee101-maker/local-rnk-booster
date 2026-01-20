/**
 * Stripe Test Mode Relay
 * 
 * Detects whether to run in TEST or PRODUCTION mode.
 * TEST MODE: No Stripe secrets required, returns mock data
 * PRODUCTION MODE: Real Stripe API calls with live keys
 */

export const isStripeTestMode = () => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  return !stripeKey || stripeKey.startsWith('sk_test_');
};

export const getStripeConfig = () => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const isTestMode = isStripeTestMode();

  return {
    stripeKey,
    webhookSecret,
    isTestMode,
    mode: isTestMode ? 'TEST' : 'PRODUCTION'
  };
};

export const mockRefund = (orderId, amount) => {
  console.log(`[TEST MODE] Simulating refund for order: ${orderId}, amount: ${amount}`);
  return {
    id: `re_test_${Date.now()}`,
    amount: amount,
    status: 'succeeded',
    test_mode: true,
    created: Math.floor(Date.now() / 1000)
  };
};

export const mockPaymentIntent = (amount, email) => {
  console.log(`[TEST MODE] Creating mock payment intent for ${email}, amount: ${amount}`);
  return {
    id: `pi_test_${Date.now()}`,
    client_secret: `pi_test_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
    amount: Math.round(amount * 100),
    currency: 'usd',
    status: 'succeeded',
    test_mode: true
  };
};

export const mockCheckoutSession = (metadata, amount) => {
  console.log(`[TEST MODE] Creating mock checkout session, amount: ${amount}`);
  return {
    id: `cs_test_${Date.now()}`,
    url: `https://checkout.stripe.com/test/${Date.now()}`,
    amount_total: Math.round(amount * 100),
    metadata,
    test_mode: true
  };
};