/**
 * Authorize.net Gateway Implementation
 * Integration with Authorize.net payment gateway
 */

import { 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  GatewayConfig,
  PaymentStatus
} from '../types.ts';

export class AuthorizeGateway {
  private apiLoginId: string | null = null;
  private transactionKey: string | null = null;
  private config: GatewayConfig | null = null;
  private sandboxUrl = 'https://apitest.authorize.net/xml/v1/request.api';
  private productionUrl = 'https://api.authorize.net/xml/v1/request.api';

  async initialize(config: GatewayConfig | undefined): Promise<void> {
    this.config = config;
    this.apiLoginId = Deno.env.get('AUTHORIZE_API_LOGIN_ID') || null;
    this.transactionKey = Deno.env.get('AUTHORIZE_TRANSACTION_KEY') || null;
    
    if (!this.apiLoginId || !this.transactionKey) {
      console.warn('[Authorize.net] Missing credentials, running in test mode');
    }
  }

  private getApiUrl(): string {
    return this.config?.testMode ? this.sandboxUrl : this.productionUrl;
  }

  async createCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.apiLoginId || !this.transactionKey) {
        return this.createMockCheckout(request);
      }

      // Authorize.net uses hosted payment forms or Accept.js
      // Here we create a hosted payment page token
      const payload = {
        getHostedPaymentPageRequest: {
          merchantAuthentication: {
            name: this.apiLoginId,
            transactionKey: this.transactionKey
          },
          transactionRequest: {
            transactionType: 'authCaptureTransaction',
            amount: request.amount.toFixed(2),
            currencyCode: request.currency,
            order: {
              invoiceNumber: request.metadata?.invoice_number || `INV-${Date.now()}`,
              description: request.items.map(i => i.name).join(', ')
            },
            customer: {
              email: request.customer.email
            },
            billTo: {
              firstName: request.customer.name?.split(' ')[0] || '',
              lastName: request.customer.name?.split(' ').slice(1).join(' ') || ''
            }
          },
          hostedPaymentSettings: {
            setting: [
              { settingName: 'hostedPaymentReturnOptions', settingValue: JSON.stringify({ showReceipt: false, url: request.successUrl }) },
              { settingName: 'hostedPaymentButtonOptions', settingValue: JSON.stringify({ text: 'Pay Now' }) },
              { settingName: 'hostedPaymentStyleOptions', settingValue: JSON.stringify({ bgColor: '#ffffff' }) }
            ]
          }
        }
      };

      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.messages?.resultCode !== 'Ok') {
        const error = data.messages?.message?.[0];
        throw new Error(`Authorize.net error: ${error?.code} - ${error?.text}`);
      }

      const token = data.token;
      const hostedUrl = `https://accept.authorize.net/payment/Payment?token=${token}`;

      return {
        success: true,
        sessionId: token,
        checkoutUrl: hostedUrl,
        status: 'pending',
        gateway: 'authorize',
        amount: request.amount,
        currency: request.currency,
        metadata: { token }
      };
    } catch (error) {
      console.error('[Authorize.net] Checkout creation failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'authorize',
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

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      if (!this.apiLoginId || !this.transactionKey) {
        return {
          success: true,
          status: 'completed',
          gateway: 'authorize',
          amount: 0,
          currency: 'USD'
        };
      }

      const payload = {
        getTransactionDetailsRequest: {
          merchantAuthentication: {
            name: this.apiLoginId,
            transactionKey: this.transactionKey
          },
          transId: transactionId
        }
      };

      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.messages?.resultCode !== 'Ok') {
        throw new Error('Failed to fetch transaction details');
      }

      const transaction = data.transaction;
      let status: PaymentStatus = 'pending';

      switch (transaction.transactionStatus) {
        case 'settledSuccessfully':
        case 'capturedPendingSettlement':
          status = 'completed';
          break;
        case 'declined':
        case 'expired':
          status = 'failed';
          break;
        case 'refundSettledSuccessfully':
          status = 'refunded';
          break;
        case 'voided':
          status = 'cancelled';
          break;
      }

      return {
        success: true,
        transactionId: transaction.transId,
        status,
        gateway: 'authorize',
        amount: parseFloat(transaction.authAmount),
        currency: 'USD',
        metadata: {
          auth_code: transaction.authCode,
          account_type: transaction.accountType
        }
      };
    } catch (error) {
      console.error('[Authorize.net] Get status failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'authorize',
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
      if (!this.apiLoginId || !this.transactionKey) {
        return {
          success: true,
          refundId: `auth_refund_${Date.now()}`,
          amount: request.amount || 0,
          status: 'completed'
        };
      }

      const payload = {
        createTransactionRequest: {
          merchantAuthentication: {
            name: this.apiLoginId,
            transactionKey: this.transactionKey
          },
          transactionRequest: {
            transactionType: 'refundTransaction',
            amount: (request.amount || 0).toFixed(2),
            refTransId: request.transactionId
          }
        }
      };

      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.messages?.resultCode !== 'Ok') {
        const error = data.messages?.message?.[0];
        return {
          success: false,
          amount: request.amount || 0,
          status: 'failed',
          error: {
            code: error?.code || 'REFUND_FAILED',
            message: error?.text || 'Refund failed',
            retryable: false
          }
        };
      }

      const transactionResponse = data.transactionResponse;
      return {
        success: transactionResponse?.responseCode === '1',
        refundId: transactionResponse?.transId,
        amount: request.amount || 0,
        status: transactionResponse?.responseCode === '1' ? 'completed' : 'failed'
      };
    } catch (error) {
      console.error('[Authorize.net] Refund failed:', error);
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

  async createSubscription(paymentProfileId: string, plan: any): Promise<any> {
    try {
      if (!this.apiLoginId || !this.transactionKey) {
        return { success: true, subscriptionId: `auth_sub_${Date.now()}` };
      }

      const payload = {
        ARBCreateSubscriptionRequest: {
          merchantAuthentication: {
            name: this.apiLoginId,
            transactionKey: this.transactionKey
          },
          subscription: {
            name: plan.name,
            paymentSchedule: {
              interval: {
                length: plan.intervalCount,
                unit: plan.interval === 'month' ? 'months' : plan.interval === 'day' ? 'days' : 'years'
              },
              startDate: plan.startDate,
              totalOccurrences: plan.totalOccurrences || '9999',
              trialOccurrences: plan.trialOccurrences || '0'
            },
            amount: plan.amount.toFixed(2),
            trialAmount: plan.trialAmount ? plan.trialAmount.toFixed(2) : '0.00',
            payment: {
              creditCard: plan.creditCard
            },
            billTo: plan.billTo
          }
        }
      };

      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      return {
        success: data.messages?.resultCode === 'Ok',
        subscriptionId: data.subscriptionId,
        error: data.messages?.resultCode !== 'Ok' ? {
          code: data.messages?.message?.[0]?.code,
          message: data.messages?.message?.[0]?.text
        } : undefined
      };
    } catch (error) {
      console.error('[Authorize.net] Subscription creation failed:', error);
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
      if (!this.apiLoginId || !this.transactionKey) {
        return { success: true };
      }

      const payload = {
        ARBCancelSubscriptionRequest: {
          merchantAuthentication: {
            name: this.apiLoginId,
            transactionKey: this.transactionKey
          },
          subscriptionId
        }
      };

      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      return {
        success: data.messages?.resultCode === 'Ok',
        error: data.messages?.resultCode !== 'Ok' ? {
          code: data.messages?.message?.[0]?.code,
          message: data.messages?.message?.[0]?.text
        } : undefined
      };
    } catch (error) {
      console.error('[Authorize.net] Cancel subscription failed:', error);
      return {
        success: false,
        error: {
          code: 'CANCEL_FAILED',
          message: error.message
        }
      };
    }
  }

  private createMockCheckout(request: PaymentRequest): PaymentResponse {
    const mockSessionId = `auth_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUrl = `${request.successUrl}?authorize_session=${mockSessionId}&mock=true`;

    return {
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: mockUrl,
      status: 'pending',
      gateway: 'authorize',
      amount: request.amount,
      currency: request.currency,
      metadata: { mock: 'true', gateway: 'authorize' }
    };
  }

  async processWebhook(payload: any): Promise<any> {
    // Authorize.net webhook processing
    return { received: true, event: payload };
  }
}
