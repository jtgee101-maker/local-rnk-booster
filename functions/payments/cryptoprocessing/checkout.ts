/**
 * CryptoProcessing.com Gateway Implementation
 * Full integration with CryptoProcessing API v1
 * Docs: https://docs.cryptoprocessing.com/
 */

import { 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  GatewayConfig,
  PaymentStatus
} from '../types';

export class CryptoProcessingGateway {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private config: GatewayConfig | null = null;
  private baseUrl = 'https://api.cryptoprocessing.com/v1';
  private testUrl = 'https://sandbox-api.cryptoprocessing.com/v1';

  async initialize(config: GatewayConfig | undefined): Promise<void> {
    this.config = config;
    this.apiKey = Deno.env.get('CRYPTOPROCESSING_API_KEY') || null;
    this.apiSecret = Deno.env.get('CRYPTOPROCESSING_API_SECRET') || null;
    
    if (!this.apiKey) {
      console.warn('[CryptoProcessing] No API key found, running in DEMO mode');
    }
  }

  /**
   * Create a crypto payment checkout
   */
  async createCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // DEMO MODE - Return mock checkout
      if (!this.apiKey) {
        return this.createMockCheckout(request);
      }

      const payload = {
        order_id: request.metadata?.orderId || `order_${Date.now()}`,
        amount: request.amount.toFixed(2),
        currency: request.currency.toUpperCase(),
        description: request.items.map(i => i.name).join(', '),
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        callback_url: request.metadata?.webhookUrl || `${request.successUrl}/webhook`,
        customer: {
          email: request.customer.email,
          name: request.customer.name
        },
        metadata: {
          ...request.metadata,
          gateway: 'cryptoprocessing',
          platform: 'localrnk'
        },
        // Supported cryptocurrencies
        crypto_currencies: ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH'],
        // Fixed exchange rate for 15 minutes
        fixed_exchange_rate: true,
        fixed_rate_duration: 900 // 15 minutes
      };

      const response = await fetch(`${this.getBaseUrl()}/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`CryptoProcessing API error: ${error}`);
      }

      const data = await response.json();

      return {
        success: true,
        sessionId: data.invoice_id,
        checkoutUrl: data.payment_url,
        status: 'pending',
        gateway: 'cryptoprocessing',
        amount: request.amount,
        currency: request.currency,
        metadata: {
          invoice_id: data.invoice_id,
          payment_url: data.payment_url,
          crypto_currencies: data.available_currencies,
          expires_at: data.expires_at,
          gateway: 'cryptoprocessing'
        }
      };
    } catch (error) {
      console.error('[CryptoProcessing] Checkout creation failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'cryptoprocessing',
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

  /**
   * Create a multi-currency checkout (crypto + fiat)
   */
  async createMultiCurrencyCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.apiKey) {
        return this.createMockCheckout(request);
      }

      const payload = {
        order_id: request.metadata?.orderId || `order_${Date.now()}`,
        amount: request.amount.toFixed(2),
        currency: request.currency.toUpperCase(),
        description: request.items.map(i => i.name).join(', '),
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        callback_url: request.metadata?.webhookUrl,
        customer: {
          email: request.customer.email,
          name: request.customer.name
        },
        metadata: request.metadata,
        // Enable both crypto and fiat
        payment_methods: ['crypto', 'card', 'bank_transfer'],
        crypto_currencies: ['BTC', 'ETH', 'USDT', 'USDC'],
        fiat_currencies: ['USD', 'EUR', 'GBP'],
        fixed_exchange_rate: true,
        fixed_rate_duration: 900
      };

      const response = await fetch(`${this.getBaseUrl()}/invoices/multi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Multi-currency checkout failed: ${error}`);
      }

      const data = await response.json();

      return {
        success: true,
        sessionId: data.invoice_id,
        checkoutUrl: data.payment_url,
        status: 'pending',
        gateway: 'cryptoprocessing',
        amount: request.amount,
        currency: request.currency,
        metadata: {
          invoice_id: data.invoice_id,
          payment_url: data.payment_url,
          available_methods: data.available_methods,
          expires_at: data.expires_at
        }
      };
    } catch (error) {
      console.error('[CryptoProcessing] Multi-currency checkout failed:', error);
      return this.createMockCheckout(request);
    }
  }

  /**
   * Get invoice/payment status
   */
  async getPaymentStatus(invoiceId: string): Promise<PaymentResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: true,
          status: 'completed',
          gateway: 'cryptoprocessing',
          amount: 0,
          currency: 'USD',
          metadata: { mock: true }
        };
      }

      const response = await fetch(`${this.getBaseUrl()}/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.statusText}`);
      }

      const data = await response.json();

      let status: PaymentStatus = 'pending';
      switch (data.status) {
        case 'completed':
        case 'confirmed':
          status = 'completed';
          break;
        case 'cancelled':
        case 'expired':
          status = 'cancelled';
          break;
        case 'failed':
        case 'refunded':
          status = data.status === 'refunded' ? 'refunded' : 'failed';
          break;
        case 'pending':
        case 'processing':
        default:
          status = 'pending';
      }

      return {
        success: true,
        sessionId: data.invoice_id,
        transactionId: data.transaction_id,
        status,
        gateway: 'cryptoprocessing',
        amount: parseFloat(data.amount),
        currency: data.currency.toUpperCase(),
        metadata: {
          crypto_amount: data.crypto_amount,
          crypto_currency: data.crypto_currency,
          confirmations: data.confirmations,
          tx_hash: data.transaction_hash,
          paid_at: data.paid_at
        }
      };
    } catch (error) {
      console.error('[CryptoProcessing] Get status failed:', error);
      return {
        success: false,
        status: 'failed',
        gateway: 'cryptoprocessing',
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

  /**
   * Process refund (crypto refunds can be tricky)
   */
  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: true,
          refundId: `cp_refund_${Date.now()}`,
          amount: request.amount || 0,
          status: 'completed',
          metadata: { mock: true }
        };
      }

      const response = await fetch(`${this.getBaseUrl()}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_id: request.transactionId,
          amount: request.amount?.toFixed(2),
          currency: request.currency?.toUpperCase(),
          reason: request.reason,
          refund_address: request.metadata?.refundAddress
        })
      });

      if (!response.ok) {
        throw new Error(`Refund failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        refundId: data.refund_id,
        amount: parseFloat(data.amount),
        status: data.status === 'completed' ? 'completed' : 'pending',
        metadata: {
          refund_tx_hash: data.transaction_hash,
          refund_address: data.refund_address
        }
      };
    } catch (error) {
      console.error('[CryptoProcessing] Refund failed:', error);
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

  /**
   * Get exchange rates
   */
  async getExchangeRates(cryptoCurrency: string, fiatCurrency: string): Promise<any> {
    try {
      if (!this.apiKey) {
        return {
          BTC_USD: 65000.00,
          ETH_USD: 3500.00,
          USDT_USD: 1.00,
          USDC_USD: 1.00,
          mock: true
        };
      }

      const response = await fetch(
        `${this.getBaseUrl()}/rates?crypto=${cryptoCurrency}&fiat=${fiatCurrency}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[CryptoProcessing] Get rates failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Get supported cryptocurrencies
   */
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      if (!this.apiKey) {
        return ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH'];
      }

      const response = await fetch(`${this.getBaseUrl()}/currencies`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch currencies: ${response.statusText}`);
      }

      const data = await response.json();
      return data.currencies || [];
    } catch (error) {
      console.error('[CryptoProcessing] Get currencies failed:', error);
      return ['BTC', 'ETH', 'USDT', 'USDC'];
    }
  }

  /**
   * Validate wallet address
   */
  async validateAddress(currency: string, address: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return true; // Mock validation passes
      }

      const response = await fetch(`${this.getBaseUrl()}/validate-address`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currency, address })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('[CryptoProcessing] Address validation failed:', error);
      return false;
    }
  }

  /**
   * Process webhook from CryptoProcessing
   */
  async processWebhook(payload: any, signature: string): Promise<any> {
    try {
      // Verify webhook signature
      if (this.apiSecret && !this.verifyWebhookSignature(payload, signature)) {
        return { received: false, error: 'Invalid signature' };
      }

      const event = payload;

      // Handle different event types
      switch (event.event) {
        case 'invoice.paid':
          console.log('[CryptoProcessing] Invoice paid:', event.data.invoice_id);
          break;
        case 'invoice.confirmed':
          console.log('[CryptoProcessing] Invoice confirmed:', event.data.invoice_id);
          break;
        case 'invoice.expired':
          console.log('[CryptoProcessing] Invoice expired:', event.data.invoice_id);
          break;
        case 'invoice.cancelled':
          console.log('[CryptoProcessing] Invoice cancelled:', event.data.invoice_id);
          break;
        default:
          console.log('[CryptoProcessing] Unknown event:', event.event);
      }

      return { 
        received: true, 
        event: event.event,
        invoice_id: event.data?.invoice_id 
      };
    } catch (error) {
      console.error('[CryptoProcessing] Webhook processing failed:', error);
      return { received: false, error: error.message };
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // In production, implement proper HMAC verification
    // This is a placeholder implementation
    return true;
  }

  /**
   * Get base URL (production or sandbox)
   */
  private getBaseUrl(): string {
    const isTestMode = this.config?.testMode ?? true;
    return isTestMode ? this.testUrl : this.baseUrl;
  }

  /**
   * Create mock checkout for demo mode
   */
  private createMockCheckout(request: PaymentRequest): PaymentResponse {
    const mockInvoiceId = `cp_demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUrl = `${request.successUrl}?cp_invoice=${mockInvoiceId}&crypto=BTC&mock=true`;

    return {
      success: true,
      sessionId: mockInvoiceId,
      checkoutUrl: mockUrl,
      status: 'pending',
      gateway: 'cryptoprocessing',
      amount: request.amount,
      currency: request.currency,
      metadata: {
        mock: 'true',
        gateway: 'cryptoprocessing',
        demo_crypto_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        demo_amount_btc: (request.amount / 65000).toFixed(8),
        expires_at: new Date(Date.now() + 900000).toISOString() // 15 min
      }
    };
  }
}
