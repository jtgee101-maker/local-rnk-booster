/**
 * GeeniusPay Gateway Implementation
 * Integration with GeeniusPay (scan.geeniuspay.com)
 */

import { 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  GatewayConfig,
  PaymentStatus
} from '../types';

export class GeeniusPayGateway {
  private apiKey: string | null = null;
  private config: GatewayConfig | null = null;
  private baseUrl = 'https://api.geeniuspay.com/v1';

  async initialize(config: GatewayConfig | undefined): Promise<void> {
    this.config = config;
    this.apiKey = Deno.env.get('GEENIUSPAY_API_KEY') || null;
    
    if (!this.apiKey) {
      console.warn('[GeeniusPay] No API key found, running in test mode');
    }
  }

  async createCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.apiKey) {
        return this.createMockCheckout(request);
      }

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          description: request.items.map(i => i.name).join(', '),
          return_url: request.successUrl,
          cancel_url: request.cancelUrl,
          customer: {
            email: request.customer.email,
            name: request.customer.name
          },
          metadata: {
            ...request.metadata,
            gateway: 'geeniuspay'
          },
          payment_methods: ['card', 'crypto'],
          capture_method: 'automatic'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GeeniusPay API error: ${error}`);
      }

      const data = await response.json();

      return {
        success: true,
        sessionId: data.payment_id,
        checkoutUrl: data.checkout_url,
        status: 'pending',
        gateway: 'geeniuspay',
        amount: request.amount,
        currency: request.currency,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('[GeeniusPay] Checkout creation failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'geeniuspay',
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

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: true,
          status: 'completed',
          gateway: 'geeniuspay',
          amount: 0,
          currency: 'USD'
        };
      }

      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const data = await response.json();

      let status: PaymentStatus = 'pending';
      switch (data.status) {
        case 'completed':
        case 'succeeded':
          status = 'completed';
          break;
        case 'cancelled':
        case 'expired':
          status = 'cancelled';
          break;
        case 'failed':
          status = 'failed';
          break;
        case 'refunded':
          status = 'refunded';
          break;
      }

      return {
        success: true,
        sessionId: data.payment_id,
        transactionId: data.transaction_id,
        status,
        gateway: 'geeniuspay',
        amount: data.amount,
        currency: data.currency,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('[GeeniusPay] Get status failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'geeniuspay',
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
          refundId: `gp_refund_${Date.now()}`,
          amount: request.amount || 0,
          status: 'completed'
        };
      }

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: request.transactionId,
          amount: request.amount,
          reason: request.reason
        })
      });

      if (!response.ok) {
        throw new Error(`Refund failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        refundId: data.refund_id,
        amount: data.amount || request.amount || 0,
        status: data.status === 'completed' ? 'completed' : 'pending'
      };
    } catch (error) {
      console.error('[GeeniusPay] Refund failed:', error);
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

  async createSubscription(customerId: string, planId: string, config: any): Promise<any> {
    try {
      if (!this.apiKey) {
        return { success: true, subscriptionId: `gp_sub_${Date.now()}` };
      }

      const response = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_id: customerId,
          plan_id: planId,
          trial_days: config.trialDays,
          metadata: config.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Subscription creation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        subscriptionId: data.subscription_id,
        status: data.status
      };
    } catch (error) {
      console.error('[GeeniusPay] Subscription creation failed:', error);
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

      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Cancel failed: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('[GeeniusPay] Cancel subscription failed:', error);
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

  async scanToPay(request: any): Promise<any> {
    // GeeniusPay-specific scan-to-pay feature
    try {
      if (!this.apiKey) {
        return { scan_url: `https://scan.geeniuspay.com/mock/${Date.now()}` };
      }

      const response = await fetch(`${this.baseUrl}/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();
      return {
        scanUrl: data.scan_url,
        qrCode: data.qr_code,
        expiresAt: data.expires_at
      };
    } catch (error) {
      console.error('[GeeniusPay] Scan creation failed:', error);
      return { error: error.message };
    }
  }

  private createMockCheckout(request: PaymentRequest): PaymentResponse {
    const mockSessionId = `gp_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUrl = `${request.successUrl}?geenius_session=${mockSessionId}&mock=true`;

    return {
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: mockUrl,
      status: 'pending',
      gateway: 'geeniuspay',
      amount: request.amount,
      currency: request.currency,
      metadata: { mock: 'true', gateway: 'geeniuspay' }
    };
  }

  async processWebhook(payload: any, signature: string): Promise<any> {
    return { received: true, event: payload };
  }
}
