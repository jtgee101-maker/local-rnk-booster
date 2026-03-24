/**
 * Stripe Gateway Implementation
 * Enhanced version with full feature support
 */

import Stripe from 'npm:stripe@17.5.0';
import { 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  GatewayConfig,
  PaymentStatus,
  SubscriptionConfig
} from '../types.ts';

export class StripeGateway {
  private stripe: Stripe | null = null;
  private config: GatewayConfig | null = null;

  async initialize(config: GatewayConfig | undefined): Promise<void> {
    this.config = config;
    const apiKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TEST_KEY');
    
    if (!apiKey) {
      console.warn('[Stripe] No API key found, running in test mode');
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia'
    });
  }

  async createCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Test mode fallback
      if (!this.stripe) {
        return this.createMockCheckout(request);
      }

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        mode: request.transactionType === 'subscription' ? 'subscription' : 'payment',
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        customer_email: request.customer.email,
        metadata: {
          ...request.metadata,
          gateway: 'stripe'
        },
        line_items: request.items.map(item => ({
          price_data: {
            currency: request.currency.toLowerCase(),
            product_data: {
              name: item.name,
              description: item.description
            },
            unit_amount: Math.round(item.amount * 100) // Convert to cents
          },
          quantity: item.quantity
        })),
        payment_method_types: ['card'],
        billing_address_collection: 'required'
      };

      // Add saved payment method support
      if (request.savePaymentMethod && request.customer.customerId) {
        sessionConfig.customer = request.customer.customerId;
        sessionConfig.payment_intent_data = {
          setup_future_usage: 'off_session'
        };
      }

      // Subscription configuration
      if (request.transactionType === 'subscription' && request.subscriptionConfig) {
        sessionConfig.subscription_data = {
          metadata: request.metadata
        };
        
        if (request.subscriptionConfig.trialDays) {
          sessionConfig.subscription_data.trial_period_days = request.subscriptionConfig.trialDays;
        }
      }

      // Setup fee for subscriptions
      if (request.subscriptionConfig?.setupFee) {
        sessionConfig.line_items.push({
          price_data: {
            currency: request.currency.toLowerCase(),
            product_data: {
              name: 'Setup Fee'
            },
            unit_amount: Math.round(request.subscriptionConfig.setupFee * 100)
          },
          quantity: 1
        });
      }

      const session = await this.stripe!.checkout.sessions.create(sessionConfig);

      return {
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url || '',
        status: 'pending',
        gateway: 'stripe',
        amount: request.amount,
        currency: request.currency,
        metadata: {
          client_reference_id: session.client_reference_id
        }
      };
    } catch (error) {
      console.error('[Stripe] Checkout creation failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'stripe',
        amount: request.amount,
        currency: request.currency,
        error: {
          code: 'CHECKOUT_CREATION_FAILED',
          message: error.message,
          retryable: true
        }
      };
    }
  }

  async getPaymentStatus(sessionId: string): Promise<PaymentResponse> {
    try {
      if (!this.stripe) {
        return {
          success: true,
          status: 'completed',
          gateway: 'stripe',
          amount: 0,
          currency: 'USD'
        };
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      let status: PaymentStatus = 'pending';
      switch (session.payment_status) {
        case 'paid':
          status = 'completed';
          break;
        case 'unpaid':
          status = session.status === 'expired' ? 'cancelled' : 'pending';
          break;
        case 'no_payment_required':
          status = 'completed';
          break;
      }

      return {
        success: true,
        sessionId: session.id,
        transactionId: session.payment_intent as string || session.subscription as string,
        status,
        gateway: 'stripe',
        amount: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'USD',
        metadata: session.metadata
      };
    } catch (error) {
      console.error('[Stripe] Get status failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'stripe',
        amount: 0,
        currency: 'USD',
        error: {
          code: 'STATUS_CHECK_FAILED',
          message: error.message,
          retryable: true
        }
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      if (!this.stripe) {
        return {
          success: true,
          refundId: `ref_mock_${Date.now()}`,
          amount: request.amount || 0,
          status: 'completed'
        };
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: request.transactionId,
        amount: request.amount ? Math.round(request.amount * 100) : undefined,
        reason: request.reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
        metadata: request.metadata
      });

      return {
        success: true,
        refundId: refund.id,
        amount: (refund.amount || 0) / 100,
        status: refund.status === 'succeeded' ? 'completed' : 'pending'
      };
    } catch (error) {
      console.error('[Stripe] Refund failed:', error);
      return {
        success: false,
        amount: request.amount || 0,
        status: 'failed',
        error: {
          code: 'REFUND_FAILED',
          message: error.message,
          retryable: false
        }
      };
    }
  }

  async createSubscription(customerId: string, config: SubscriptionConfig): Promise<any> {
    try {
      if (!this.stripe) {
        return { success: true, subscriptionId: `sub_mock_${Date.now()}` };
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: config.planId }],
        trial_period_days: config.trialDays,
        metadata: {
          plan_id: config.planId
        }
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status
      };
    } catch (error) {
      console.error('[Stripe] Subscription creation failed:', error);
      return {
        success: false,
        error: {
          code: 'SUBSCRIPTION_FAILED',
          message: error.message,
          retryable: true
        }
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    try {
      if (!this.stripe) {
        return { success: true };
      }

      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return {
        success: true,
        status: subscription.status
      };
    } catch (error) {
      console.error('[Stripe] Cancel subscription failed:', error);
      return {
        success: false,
        error: {
          code: 'CANCEL_FAILED',
          message: error.message,
          retryable: true
        }
      };
    }
  }

  async pauseSubscription(subscriptionId: string): Promise<any> {
    try {
      if (!this.stripe) {
        return { success: true };
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        pause_collection: {
          behavior: 'void'
        }
      });

      return {
        success: true,
        status: subscription.status
      };
    } catch (error) {
      console.error('[Stripe] Pause subscription failed:', error);
      return {
        success: false,
        error: {
          code: 'PAUSE_FAILED',
          message: error.message,
          retryable: true
        }
      };
    }
  }

  private createMockCheckout(request: PaymentRequest): PaymentResponse {
    const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUrl = `${request.successUrl}?session_id=${mockSessionId}&mock=true`;

    return {
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: mockUrl,
      status: 'pending',
      gateway: 'stripe',
      amount: request.amount,
      currency: request.currency,
      metadata: { mock: 'true' }
    };
  }

  async processWebhook(payload: any, signature: string, secret: string): Promise<any> {
    try {
      if (!this.stripe) {
        return { received: true, mock: true };
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, secret);
      return { received: true, event };
    } catch (error) {
      console.error('[Stripe] Webhook verification failed:', error);
      throw error;
    }
  }
}
