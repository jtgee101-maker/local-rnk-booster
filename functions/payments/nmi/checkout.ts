/**
 * NMI (Network Merchants Inc) Gateway Implementation
 * Direct payment processing gateway
 */

import { 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  GatewayConfig,
  PaymentStatus
} from '../types.ts';

export class NMIGateway {
  private securityKey: string | null = null;
  private config: GatewayConfig | null = null;
  private baseUrl = 'https://secure.nmi.com/api/transact.php';

  async initialize(config: GatewayConfig | undefined): Promise<void> {
    this.config = config;
    this.securityKey = Deno.env.get('NMI_SECURITY_KEY') || null;
    
    if (!this.securityKey) {
      console.warn('[NMI] No security key found, running in test mode');
    }
  }

  async createCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.securityKey) {
        return this.createMockCheckout(request);
      }

      // NMI uses direct post or hosted payment page
      // Here we create a hosted payment page session
      const params = new URLSearchParams({
        security_key: this.securityKey,
        amount: request.amount.toFixed(2),
        currency: request.currency,
        order_description: request.items.map(i => i.name).join(', '),
        customer_receipt: 'true',
        merchant_receipt: 'true',
        redirect_url: request.successUrl,
        cancel_url: request.cancelUrl,
        email: request.customer.email || '',
        first_name: request.customer.name?.split(' ')[0] || '',
        last_name: request.customer.name?.split(' ').slice(1).join(' ') || '',
        ...request.metadata
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const text = await response.text();
      const result = this.parseResponse(text);

      if (result.response_code !== '100') {
        throw new Error(`NMI error ${result.response_code}: ${result.responsetext}`);
      }

      return {
        success: true,
        sessionId: result.session_id || result.transactionid,
        checkoutUrl: result.redirect_url || '',
        status: 'pending',
        gateway: 'nmi',
        amount: request.amount,
        currency: request.currency,
        metadata: { transaction_id: result.transactionid }
      };
    } catch (error) {
      console.error('[NMI] Checkout creation failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'nmi',
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

  async processDirectCharge(paymentData: any): Promise<PaymentResponse> {
    try {
      if (!this.securityKey) {
        return {
          success: true,
          transactionId: `nmi_mock_${Date.now()}`,
          status: 'completed',
          gateway: 'nmi',
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD'
        };
      }

      const params = new URLSearchParams({
        security_key: this.securityKey,
        type: 'sale',
        amount: paymentData.amount.toFixed(2),
        currency: paymentData.currency || 'USD',
        ccnumber: paymentData.cardNumber,
        ccexp: paymentData.cardExpiry,
        cvv: paymentData.cvv,
        email: paymentData.email,
        first_name: paymentData.firstName,
        last_name: paymentData.lastName,
        address1: paymentData.address,
        city: paymentData.city,
        state: paymentData.state,
        zip: paymentData.zip,
        country: paymentData.country,
        order_description: paymentData.description
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const text = await response.text();
      const result = this.parseResponse(text);

      if (result.response_code !== '100') {
        return {
          success: false,
          status: 'failed',
          gateway: 'nmi',
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          error: {
            code: `NMI_${result.response_code}`,
            message: result.responsetext,
            retryable: result.response_code === '200'
          }
        };
      }

      return {
        success: true,
        transactionId: result.transactionid,
        status: 'completed',
        gateway: 'nmi',
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        metadata: {
          auth_code: result.authcode,
          avs_response: result.avsresponse,
          cvv_response: result.cvvresponse
        }
      };
    } catch (error) {
      console.error('[NMI] Direct charge failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'nmi',
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        error: {
          code: 'CHARGE_FAILED',
          message: error.message,
          retryable: true
        }
      };
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      if (!this.securityKey) {
        return {
          success: true,
          status: 'completed',
          gateway: 'nmi',
          amount: 0,
          currency: 'USD'
        };
      }

      const params = new URLSearchParams({
        security_key: this.securityKey,
        transaction_id: transactionId,
        report_type: 'transaction_detail'
      });

      const response = await fetch('https://secure.nmi.com/api/query.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const xml = await response.text();
      const status = this.parseQueryResponse(xml);

      return {
        success: true,
        transactionId,
        status: status as PaymentStatus,
        gateway: 'nmi',
        amount: 0,
        currency: 'USD'
      };
    } catch (error) {
      console.error('[NMI] Get status failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'nmi',
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
      if (!this.securityKey) {
        return {
          success: true,
          refundId: `nmi_refund_${Date.now()}`,
          amount: request.amount || 0,
          status: 'completed'
        };
      }

      const params = new URLSearchParams({
        security_key: this.securityKey,
        type: 'refund',
        transactionid: request.transactionId,
        amount: request.amount?.toFixed(2)
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const text = await response.text();
      const result = this.parseResponse(text);

      if (result.response_code !== '100') {
        return {
          success: false,
          amount: request.amount || 0,
          status: 'failed',
          error: {
            code: `NMI_${result.response_code}`,
            message: result.responsetext,
            retryable: false
          }
        };
      }

      return {
        success: true,
        refundId: result.transactionid,
        amount: request.amount || 0,
        status: 'completed'
      };
    } catch (error) {
      console.error('[NMI] Refund failed:', error);
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

  async createSubscription(customerVaultId: string, plan: any): Promise<any> {
    try {
      if (!this.securityKey) {
        return { success: true, subscriptionId: `nmi_sub_${Date.now()}` };
      }

      const params = new URLSearchParams({
        security_key: this.securityKey,
        type: 'add_subscription',
        customer_vault_id: customerVaultId,
        plan_id: plan.id,
        start_date: plan.startDate,
        amount: plan.amount.toFixed(2)
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const text = await response.text();
      const result = this.parseResponse(text);

      return {
        success: result.response_code === '100',
        subscriptionId: result.subscription_id,
        error: result.response_code !== '100' ? {
          code: `NMI_${result.response_code}`,
          message: result.responsetext
        } : undefined
      };
    } catch (error) {
      console.error('[NMI] Subscription creation failed:', error);
      return {
        success: false,
        error: {
          code: 'SUBSCRIPTION_FAILED',
          message: error.message
        }
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    try {
      if (!this.securityKey) {
        return { success: true };
      }

      const params = new URLSearchParams({
        security_key: this.securityKey,
        type: 'delete_subscription',
        subscription_id: subscriptionId
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: params.toString()
      });

      const text = await response.text();
      const result = this.parseResponse(text);

      return {
        success: result.response_code === '100',
        error: result.response_code !== '100' ? {
          code: `NMI_${result.response_code}`,
          message: result.responsetext
        } : undefined
      };
    } catch (error) {
      console.error('[NMI] Cancel subscription failed:', error);
      return {
        success: false,
        error: {
          code: 'CANCEL_FAILED',
          message: error.message
        }
      };
    }
  }

  private parseResponse(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    const pairs = text.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        result[key] = decodeURIComponent(value);
      }
    }
    return result;
  }

  private parseQueryResponse(xml: string): string {
    // Simple XML parsing for status
    const statusMatch = xml.match(/<status>([^<]+)<\/status>/);
    return statusMatch ? statusMatch[1] : 'unknown';
  }

  private createMockCheckout(request: PaymentRequest): PaymentResponse {
    const mockSessionId = `nmi_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUrl = `${request.successUrl}?nmi_session=${mockSessionId}&mock=true`;

    return {
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: mockUrl,
      status: 'pending',
      gateway: 'nmi',
      amount: request.amount,
      currency: request.currency,
      metadata: { mock: 'true', gateway: 'nmi' }
    };
  }

  async processWebhook(payload: any): Promise<any> {
    return { received: true, event: payload };
  }
}
