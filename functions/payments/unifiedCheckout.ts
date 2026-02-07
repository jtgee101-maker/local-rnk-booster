/**
 * Unified Checkout API
 * Single endpoint for all payment gateways
 * Standardized request/response format
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError, logErrorAsync } from '../utils/errorHandler.ts';
import { gatewayRouter } from './gatewayRouter.ts';
import { 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  PaymentGateway,
  TransactionType,
  PaymentStatus
} from './types.ts';

// Import gateway implementations
import { StripeGateway } from './stripe/checkout.ts';
import { WhopGateway } from './whop/checkout.ts';
import { GeeniusPayGateway } from './geeniuspay/checkout.ts';
import { NMIGateway } from './nmi/checkout.ts';
import { PayraGateway } from './payra/checkout.ts';
import { AuthorizeGateway } from './authorize/checkout.ts';
import { CryptoGateway } from './crypto/checkout.ts';
import { PayPalGateway } from './paypal/checkout.ts';

// Gateway instances
const gateways: Record<PaymentGateway, any> = {
  stripe: new StripeGateway(),
  whop: new WhopGateway(),
  geeniuspay: new GeeniusPayGateway(),
  nmi: new NMIGateway(),
  payra: new PayraGateway(),
  authorize: new AuthorizeGateway(),
  crypto: new CryptoGateway(),
  paypal: new PayPalGateway()
};

interface UnifiedRequest {
  action: 'create_checkout' | 'confirm_payment' | 'refund' | 'get_status' | 'split_payment';
  data?: any;
}

Deno.serve(withDenoErrorHandler(async (req) => {
  const base44 = createClientFromRequest(req);
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    // Parse request
    const body: UnifiedRequest = await req.json();
    const origin = req.headers.get('origin') || '';
    
    console.log(`[${requestId}] Processing ${body.action} request`);

    switch (body.action) {
      case 'create_checkout':
        return await handleCreateCheckout(body.data, origin, base44, requestId);
      
      case 'confirm_payment':
        return await handleConfirmPayment(body.data, base44, requestId);
      
      case 'refund':
        return await handleRefund(body.data, base44, requestId);
      
      case 'get_status':
        return await handleGetStatus(body.data, base44, requestId);
      
      case 'split_payment':
        return await handleSplitPayment(body.data, origin, base44, requestId);
      
      default:
        throw new FunctionError(`Unknown action: ${body.action}`, 400, 'BAD_REQUEST');
    }
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    await logErrorAsync(base44, 'unified_checkout', error.message, {
      request_id: requestId,
      action: body?.action,
      error_stack: error.stack
    });
    throw error;
  }
}));

/**
 * Handle checkout session creation
 */
async function handleCreateCheckout(
  data: any, 
  origin: string, 
  base44: any, 
  requestId: string
): Promise<Response> {
  // Build payment request
  const paymentRequest: PaymentRequest = {
    amount: data.amount,
    currency: data.currency || 'USD',
    gateway: data.gateway,
    transactionType: data.transactionType || 'one_time',
    customer: {
      email: data.email,
      name: data.customerName,
      country: data.country,
      customerId: data.customerId
    },
    items: data.items || [{
      name: data.productName || 'Product',
      amount: data.amount,
      quantity: 1
    }],
    metadata: {
      ...data.metadata,
      request_id: requestId,
      lead_id: data.leadId,
      order_bump: data.orderBumpAccepted ? 'yes' : 'no'
    },
    successUrl: data.successUrl || `${origin}/thank-you`,
    cancelUrl: data.cancelUrl || `${origin}/checkout`,
    subscriptionConfig: data.subscriptionConfig,
    savePaymentMethod: data.savePaymentMethod
  };

  // Route to appropriate gateway
  const routing = gatewayRouter.routePayment(paymentRequest);
  console.log(`[${requestId}] Routed to ${routing.gateway}`, routing.fallback ? `(fallback: ${routing.fallback})` : '');

  // Validate gateway supports this request
  gatewayRouter.validateGatewaySupport(routing.gateway, paymentRequest);

  // Get gateway instance
  const gateway = gateways[routing.gateway];
  if (!gateway) {
    throw new FunctionError(`Gateway ${routing.gateway} not implemented`, 501, 'NOT_IMPLEMENTED');
  }

  // Initialize gateway with config
  await gateway.initialize(gatewayRouter.getGateway(routing.gateway));

  // Create checkout session
  const response = await gateway.createCheckout(paymentRequest);

  // Log transaction
  try {
    await base44.asServiceRole.entities.Transaction.create({
      request_id: requestId,
      gateway: routing.gateway,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      status: response.status,
      customer_email: paymentRequest.customer.email,
      session_id: response.sessionId,
      metadata: paymentRequest.metadata
    });
  } catch (e) {
    console.error('Failed to log transaction:', e);
  }

  return Response.json({
    success: response.success,
    requestId,
    gateway: routing.gateway,
    checkoutUrl: response.checkoutUrl,
    sessionId: response.sessionId,
    transactionId: response.transactionId,
    status: response.status,
    amount: response.amount,
    currency: response.currency,
    error: response.error
  });
}

/**
 * Handle payment confirmation
 */
async function handleConfirmPayment(
  data: any, 
  base44: any, 
  requestId: string
): Promise<Response> {
  const { sessionId, transactionId, gateway: gatewayId } = data;

  if (!sessionId && !transactionId) {
    throw new FunctionError('Session ID or Transaction ID required', 400, 'BAD_REQUEST');
  }

  const gatewayName = gatewayId || 'stripe';
  const gateway = gateways[gatewayName as PaymentGateway];
  
  if (!gateway) {
    throw new FunctionError(`Gateway ${gatewayName} not found`, 404, 'NOT_FOUND');
  }

  await gateway.initialize(gatewayRouter.getGateway(gatewayName as PaymentGateway));

  const status = await gateway.getPaymentStatus(sessionId || transactionId);

  // Update transaction record
  try {
    const transactions = await base44.asServiceRole.entities.Transaction.list({
      filter: { session_id: sessionId }
    });
    if (transactions.data?.length > 0) {
      await base44.asServiceRole.entities.Transaction.update(transactions.data[0]._id, {
        status: status.status,
        confirmed_at: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error('Failed to update transaction:', e);
  }

  return Response.json({
    success: status.success,
    requestId,
    status: status.status,
    transactionId: status.transactionId,
    amount: status.amount,
    error: status.error
  });
}

/**
 * Handle refund
 */
async function handleRefund(
  data: any, 
  base44: any, 
  requestId: string
): Promise<Response> {
  const { transactionId, amount, reason, gateway: gatewayId } = data;

  if (!transactionId) {
    throw new FunctionError('Transaction ID required', 400, 'BAD_REQUEST');
  }

  // Get transaction details
  let transaction;
  try {
    const transactions = await base44.asServiceRole.entities.Transaction.list({
      filter: { transaction_id: transactionId }
    });
    transaction = transactions.data?.[0];
  } catch (e) {
    console.error('Failed to fetch transaction:', e);
  }

  const gatewayName = gatewayId || transaction?.gateway || 'stripe';
  const gateway = gateways[gatewayName as PaymentGateway];

  if (!gateway) {
    throw new FunctionError(`Gateway ${gatewayName} not found`, 404, 'NOT_FOUND');
  }

  await gateway.initialize(gatewayRouter.getGateway(gatewayName as PaymentGateway));

  const refundRequest: RefundRequest = {
    transactionId,
    amount,
    reason,
    metadata: { request_id: requestId }
  };

  const response = await gateway.processRefund(refundRequest);

  // Log refund
  try {
    await base44.asServiceRole.entities.Refund.create({
      request_id: requestId,
      transaction_id: transactionId,
      gateway: gatewayName,
      amount: amount || transaction?.amount,
      reason,
      status: response.status,
      refund_id: response.refundId
    });
  } catch (e) {
    console.error('Failed to log refund:', e);
  }

  return Response.json({
    success: response.success,
    requestId,
    refundId: response.refundId,
    amount: response.amount,
    status: response.status,
    error: response.error
  });
}

/**
 * Handle get status
 */
async function handleGetStatus(
  data: any, 
  base44: any, 
  requestId: string
): Promise<Response> {
  const { sessionId, transactionId } = data;

  // Get from database
  try {
    const transactions = await base44.asServiceRole.entities.Transaction.list({
      filter: sessionId ? { session_id: sessionId } : { transaction_id: transactionId }
    });

    if (transactions.data?.length === 0) {
      return Response.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      requestId,
      transaction: transactions.data[0]
    });
  } catch (e) {
    throw new FunctionError('Failed to fetch status', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Handle split payment
 */
async function handleSplitPayment(
  data: any, 
  origin: string, 
  base44: any, 
  requestId: string
): Promise<Response> {
  const { amount, splits, currency, email, customerName, successUrl, cancelUrl } = data;

  if (!splits || !Array.isArray(splits) || splits.length < 2) {
    throw new FunctionError('At least 2 payment splits required', 400, 'BAD_REQUEST');
  }

  const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new FunctionError('Split percentages must total 100%', 400, 'BAD_REQUEST');
  }

  const results = [];
  const errors = [];

  // Process each split
  for (const split of splits) {
    const splitAmount = (amount * split.percentage) / 100;
    
    const paymentRequest: PaymentRequest = {
      amount: splitAmount,
      currency: currency || 'USD',
      gateway: split.gateway,
      transactionType: 'one_time',
      customer: { email, name: customerName },
      items: [{
        name: `Split Payment (${split.percentage}%)`,
        amount: splitAmount,
        quantity: 1
      }],
      metadata: {
        request_id: requestId,
        split_id: `${requestId}_${split.gateway}`,
        split_percentage: split.percentage.toString()
      },
      successUrl,
      cancelUrl
    };

    try {
      const gateway = gateways[split.gateway];
      if (!gateway) {
        throw new Error(`Gateway ${split.gateway} not implemented`);
      }

      await gateway.initialize(gatewayRouter.getGateway(split.gateway));
      const response = await gateway.createCheckout(paymentRequest);
      
      results.push({
        gateway: split.gateway,
        percentage: split.percentage,
        amount: splitAmount,
        success: response.success,
        sessionId: response.sessionId,
        checkoutUrl: response.checkoutUrl
      });
    } catch (error) {
      errors.push({
        gateway: split.gateway,
        error: error.message
      });
    }
  }

  // Create split payment record
  try {
    await base44.asServiceRole.entities.SplitPayment.create({
      request_id: requestId,
      total_amount: amount,
      currency: currency || 'USD',
      customer_email: email,
      splits: results,
      status: errors.length === 0 ? 'created' : 'partial'
    });
  } catch (e) {
    console.error('Failed to log split payment:', e);
  }

  return Response.json({
    success: errors.length === 0,
    requestId,
    splits: results,
    errors: errors.length > 0 ? errors : undefined
  });
}
