/**
 * Payra Gateway Implementation
 * Integration with Payra (payra.com)
 */

import { 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  GatewayConfig,
  PaymentStatus
} from '../types.ts';

export class PayraGateway {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private config: GatewayConfig | null = null;
  private baseUrl = 'https://api.payra.com/v1';

  async initialize(config: GatewayConfig | undefined): Promise<void> {
    this.config = config;
    this.apiKey = Deno.env.get('PAYRA_API_KEY') || null;
    this.apiSecret = Deno.env.get('PAYRA_API_SECRET') || null;
    
    if (!this.apiKey) {
      console.warn('[Payra] No API key found, running in test mode');
    }
  }

  async createCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.apiKey) {
        return this.createMockCheckout(request);
      }

      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(request.amount * 100), // Payra uses cents
          currency: request.currency.toLowerCase(),
          description: request.items.map(i => i.name).join(', '),
          success_url: request.successUrl,
          cancel_url: request.cancelUrl,
          customer: {
            email: request.customer.email,
            name: request.customer.name
          },
          metadata: {
            ...request.metadata,
            gateway: 'payra'
          },
          payment_method_types: ['card', 'bank_transfer'],
          billing_address_collection: 'auto'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Payra API error: ${error}`);
      }

      const data = await response.json();

      return {
        success: true,
        sessionId: data.id,
        checkoutUrl: data.url,
        status: 'pending',
        gateway: 'payra',
        amount: request.amount,
        currency: request.currency,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('[Payra] Checkout creation failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'payra',
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
      if (!this.apiKey) {
        return {
          success: true,
          status: 'completed',
          gateway: 'payra',
          amount: 0,
          currency: 'USD'
        };
      }

      const response = await fetch(`${this.baseUrl}/checkout/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const data = await response.json();

      let status: PaymentStatus = 'pending';
      switch (data.status) {
        case 'complete':
        case 'paid':
          status = 'completed';
          break;
        case 'canceled':
        case 'expired':
          status = 'cancelled';
          break;
        case 'payment_failed':
          status = 'failed';
          break;
        case 'refunded':
          status = 'refunded';
          break;
      }

      return {
        success: true,
        sessionId: data.id,
        transactionId: data.payment_intent,
        status,
        gateway: 'payra',
        amount: data.amount / 100,
        currency: data.currency.toUpperCase(),
        metadata: data.metadata
      };
    } catch (error) {
      console.error('[Payra] Get status failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'payra',
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
      if (!this.apiKey) {
        return {
          success: true,
          refundId: `payra_refund_${Date.now()}`,
          amount: request.amount || 0,
          status: 'completed'
        };
      }

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_intent: request.transactionId,
          amount: request.amount ? Math.round(request.amount * 100) : undefined,
          reason: request.reason,
          metadata: request.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Refund failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        refundId: data.id,
        amount: (data.amount || 0) / 100,
        status: data.status === 'succeeded' ? 'completed' : 'pending'
      };
    } catch (error) {
      console.error('[Payra] Refund failed:', error);
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

  async createSubscription(customerId: string, priceId: string, config: any): Promise<any> {
    try {
      if (!this.apiKey) {
        return { success: true, subscriptionId: `payra_sub_${Date.now()}` };
      }

      const response = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customerId,
          items: [{ price: priceId }],
          trial_period_days: config.trialDays,
          metadata: config.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Subscription creation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        subscriptionId: data.id,
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end
      };
    } catch (error) {
      console.error('[Payra] Subscription creation failed:', error);
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
      if (!this.apiKey) {
        return { success: true };
      }

      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Cancel failed: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('[Payra] Cancel subscription failed:', error);
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
      if (!this.apiKey) {
        return { success: true };
      }

      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Pause failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status
      };
    } catch (error) {
      console.error('[Payra] Pause subscription failed:', error);
      return {
        success: false,
        error: {
          code: 'PAUSE_FAILED',
          message: error.message
        }
      };
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<any> {
    try {
      if (!this.apiKey) {
        return { success: true };
      }

      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Resume failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status
      };
    } catch (error) {
      console.error('[Payra] Resume subscription failed:', error);
      return {
        success: false,
        error: {
          code: 'RESUME_FAILED',
          message: error.message
        }
      };
    }
  }

  private createMockCheckout(request: PaymentRequest): PaymentResponse {
    const mockSessionId = `payra_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUrl = `${request.successUrl}?payra_session=${mockSessionId}&mock=true`;

    return {
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: mockUrl,
      status: 'pending',
      gateway: 'payra',
      amount: request.amount,
      currency: request.currency,
      metadata: { mock: 'true', gateway: 'payra' }
    };
  }

  async processWebhook(payload: any, signature: string): Promise<any> {
    return { received: true, event: payload };
  }
}
