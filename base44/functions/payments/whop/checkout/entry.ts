/**
 * Whop Gateway Implementation
 * Integration with Whop (whop.com) payment platform
 */

import { 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  GatewayConfig,
  PaymentStatus
} from '../types.ts';

export class WhopGateway {
  private apiKey: string | null = null;
  private config: GatewayConfig | null = null;
  private baseUrl = 'https://api.whop.com/v2';

  async initialize(config: GatewayConfig | undefined): Promise<void> {
    this.config = config;
    this.apiKey = Deno.env.get('WHOP_API_KEY') || null;
    
    if (!this.apiKey) {
      console.warn('[Whop] No API key found, running in test mode');
    }
  }

  async createCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Test mode
      if (!this.apiKey) {
        return this.createMockCheckout(request);
      }

      const response = await fetch(`${this.baseUrl}/checkout_sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: request.metadata?.whop_product_id,
          price: request.amount,
          currency: request.currency,
          success_url: request.successUrl,
          cancel_url: request.cancelUrl,
          customer_email: request.customer.email,
          metadata: {
            ...request.metadata,
            gateway: 'whop'
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Whop API error: ${error}`);
      }

      const data = await response.json();

      return {
        success: true,
        sessionId: data.id,
        checkoutUrl: data.url,
        status: 'pending',
        gateway: 'whop',
        amount: request.amount,
        currency: request.currency,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('[Whop] Checkout creation failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'whop',
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
          gateway: 'whop',
          amount: 0,
          currency: 'USD'
        };
      }

      const response = await fetch(`${this.baseUrl}/checkout_sessions/${sessionId}`, {
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
        case 'paid':
          status = 'completed';
          break;
        case 'cancelled':
        case 'expired':
          status = 'cancelled';
          break;
        case 'failed':
          status = 'failed';
          break;
      }

      return {
        success: true,
        sessionId: data.id,
        transactionId: data.payment_intent_id,
        status,
        gateway: 'whop',
        amount: data.amount,
        currency: data.currency,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('[Whop] Get status failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'whop',
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
          refundId: `whop_refund_${Date.now()}`,
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
          payment_intent_id: request.transactionId,
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
        refundId: data.id,
        amount: data.amount || request.amount || 0,
        status: data.status === 'succeeded' ? 'completed' : 'pending'
      };
    } catch (error) {
      console.error('[Whop] Refund failed:', error);
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

  async createMembership(customerId: string, productId: string): Promise<any> {
    try {
      if (!this.apiKey) {
        return { success: true, membershipId: `mem_${Date.now()}` };
      }

      const response = await fetch(`${this.baseUrl}/memberships`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId
        })
      });

      if (!response.ok) {
        throw new Error(`Membership creation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        membershipId: data.id,
        status: data.status
      };
    } catch (error) {
      console.error('[Whop] Membership creation failed:', error);
      return {
        success: false,
        error: {
          code: 'MEMBERSHIP_FAILED',
          message: error.message,
          retryable: true
        }
      };
    }
  }

  async cancelMembership(membershipId: string): Promise<any> {
    try {
      if (!this.apiKey) {
        return { success: true };
      }

      const response = await fetch(`${this.baseUrl}/memberships/${membershipId}/cancel`, {
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
      console.error('[Whop] Cancel membership failed:', error);
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

  async validateLicense(licenseKey: string): Promise<any> {
    try {
      if (!this.apiKey) {
        return { valid: true, mock: true };
      }

      const response = await fetch(`${this.baseUrl}/licenses/${licenseKey}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const data = await response.json();
      return {
        valid: data.valid,
        license: data.license
      };
    } catch (error) {
      console.error('[Whop] License validation failed:', error);
      return { valid: false, error: error.message };
    }
  }

  private createMockCheckout(request: PaymentRequest): PaymentResponse {
    const mockSessionId = `whop_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUrl = `${request.successUrl}?whop_session=${mockSessionId}&mock=true`;

    return {
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: mockUrl,
      status: 'pending',
      gateway: 'whop',
      amount: request.amount,
      currency: request.currency,
      metadata: { mock: 'true', gateway: 'whop' }
    };
  }

  async processWebhook(payload: any, signature: string): Promise<any> {
    // Whop webhook processing
    // Verify signature if needed
    return { received: true, event: payload };
  }
}
