/**
 * Unified Checkout API - Stub
 * 
 * NOTE: The multi-file payment gateway architecture (gatewayRouter, types, gateway subfiles)
 * cannot be deployed in Base44 because local imports between function files are not supported.
 * 
 * Active payment processing is handled by:
 *   - functions/createStripeCheckout  (Stripe)
 *   - functions/createPaymentIntent   (Stripe intents)
 *   - functions/stripeWebhook         (Stripe webhooks)
 * 
 * This stub exists so the file deploys without errors.
 * Replace with a fully self-contained implementation if multi-gateway routing is needed.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    success: false,
    error: 'unifiedCheckout is not yet active. Use createStripeCheckout or createPaymentIntent instead.',
    code: 'NOT_IMPLEMENTED'
  }, { status: 501 });
});