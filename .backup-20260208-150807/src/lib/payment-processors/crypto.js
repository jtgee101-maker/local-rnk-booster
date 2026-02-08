/**
 * Crypto Processing Payment Adapter
 * Partner integration: https://cryptoprocessing.com
 * Support for 150+ cryptocurrencies
 */

import { PaymentProcessor } from '../payment-processor';

export class CryptoProcessingAdapter extends PaymentProcessor {
  constructor(config) {
    super(config);
    this.apiEndpoint = 'https://api.cryptoprocessing.com/v2';
    this.apiKey = config.credentials.apiKey;
    this.merchantId = config.credentials.merchantId;
  }

  async createPaymentIntent(params) {
    const { amount, currency = 'USD', metadata = {} } = params;

    try {
      const response = await fetch(`${this.apiEndpoint}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId
        },
        body: JSON.stringify({
          price_amount: amount / 100, // Convert cents to dollars
          price_currency: currency,
          order_id: metadata.orderId || `order_${Date.now()}`,
          order_description: metadata.description || 'GMB Rank Booster Service',
          ipn_callback_url: metadata.callbackUrl,
          success_url: metadata.returnUrl,
          cancel_url: metadata.cancelUrl,
          // Supported cryptocurrencies
          pay_currency: metadata.preferredCrypto || 'BTC' // BTC, ETH, USDT, etc.
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create crypto payment invoice');
      }

      const data = await response.json();
      return {
        id: data.invoice_id,
        amount: data.price_amount * 100,
        currency: data.price_currency,
        cryptoCurrency: data.pay_currency,
        cryptoAmount: data.pay_amount,
        status: data.status,
        paymentUrl: data.invoice_url,
        qrCodeUrl: data.qr_code_url,
        walletAddress: data.payment_address,
        expiresAt: data.expiration_estimate_date
      };
    } catch (error) {
      console.error('Crypto payment creation error:', error);
      throw error;
    }
  }

  async confirmPayment(invoiceId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get crypto payment status');
      }

      const data = await response.json();
      
      return {
        id: data.invoice_id,
        status: data.status, // new, pending, confirming, confirmed, paid, invalid, expired
        paymentStatus: data.payment_status,
        transactionHash: data.transaction_hash,
        confirmations: data.confirmations
      };
    } catch (error) {
      console.error('Crypto payment confirmation error:', error);
      throw error;
    }
  }

  async refundPayment(invoiceId, amount) {
    try {
      const response = await fetch(`${this.apiEndpoint}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          refund_amount: amount ? amount / 100 : undefined,
          refund_address: metadata.refundAddress // Customer's crypto wallet
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process crypto refund');
      }

      return await response.json();
    } catch (error) {
      console.error('Crypto refund error:', error);
      throw error;
    }
  }

  async getPaymentStatus(invoiceId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get crypto payment status');
      }

      const data = await response.json();
      
      return {
        id: data.invoice_id,
        status: data.status,
        paymentStatus: data.payment_status,
        priceAmount: data.price_amount,
        priceCurrency: data.price_currency,
        payAmount: data.pay_amount,
        payCurrency: data.pay_currency,
        transactionHash: data.transaction_hash,
        confirmations: data.confirmations,
        requiredConfirmations: data.required_confirmations,
        paymentUrl: data.invoice_url,
        qrCodeUrl: data.qr_code_url
      };
    } catch (error) {
      console.error('Crypto status error:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    // Crypto Processing doesn't require customer creation
    // Customers send crypto directly to generated addresses
    return {
      success: true,
      note: 'Crypto payments are address-based, no customer account needed'
    };
  }

  /**
   * Get list of supported cryptocurrencies
   */
  async getSupportedCurrencies() {
    try {
      const response = await fetch(`${this.apiEndpoint}/currencies`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get supported currencies');
      }

      return await response.json();
    } catch (error) {
      console.error('Crypto currencies error:', error);
      throw error;
    }
  }

  /**
   * Get current crypto exchange rates
   */
  async getExchangeRates(fromCurrency = 'USD') {
    try {
      const response = await fetch(`${this.apiEndpoint}/rates?from=${fromCurrency}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get exchange rates');
      }

      return await response.json();
    } catch (error) {
      console.error('Crypto rates error:', error);
      throw error;
    }
  }
}

export default CryptoProcessingAdapter;
