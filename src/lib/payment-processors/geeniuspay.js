/**
 * GeeNiusPay Payment Processor Adapter
 * Custom payment solution for GMB Rank Booster / Local SEO businesses
 */

import { PaymentProcessor } from '../payment-processor';

export class GeeNiusPayProcessor extends PaymentProcessor {
  constructor(config) {
    super(config);
    this.apiEndpoint = config.testMode 
      ? 'https://sandbox.geeniuspay.com/api/v1'
      : 'https://api.geeniuspay.com/api/v1';
    this.apiKey = config.credentials.apiKey;
  }

  async createPaymentIntent(params) {
    const { amount, currency = 'USD', metadata = {} } = params;

    try {
      const response = await fetch(`${this.apiEndpoint}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          amount: amount / 100, // Convert cents to dollars
          currency,
          description: metadata.description || 'GMB Rank Booster Service',
          metadata,
          return_url: metadata.returnUrl,
          cancel_url: metadata.cancelUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create GeeNiusPay payment');
      }

      const data = await response.json();
      return {
        id: data.payment_id,
        amount: data.amount * 100, // Convert back to cents
        currency: data.currency,
        status: data.status,
        checkoutUrl: data.checkout_url
      };
    } catch (error) {
      console.error('GeeNiusPay payment creation error:', error);
      throw error;
    }
  }

  async confirmPayment(paymentId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/payments/${paymentId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to confirm GeeNiusPay payment');
      }

      return await response.json();
    } catch (error) {
      console.error('GeeNiusPay confirm error:', error);
      throw error;
    }
  }

  async refundPayment(paymentId, amount) {
    try {
      const response = await fetch(`${this.apiEndpoint}/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          amount: amount ? amount / 100 : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process GeeNiusPay refund');
      }

      return await response.json();
    } catch (error) {
      console.error('GeeNiusPay refund error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get GeeNiusPay payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('GeeNiusPay status error:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const response = await fetch(`${this.apiEndpoint}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error('Failed to create GeeNiusPay customer');
      }

      return await response.json();
    } catch (error) {
      console.error('GeeNiusPay customer creation error:', error);
      throw error;
    }
  }

  /**
   * Create recurring billing subscription
   */
  async createSubscription(params) {
    const { customerId, planId, metadata = {} } = params;

    try {
      const response = await fetch(`${this.apiEndpoint}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          customer_id: customerId,
          plan_id: planId,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create GeeNiusPay subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('GeeNiusPay subscription error:', error);
      throw error;
    }
  }
}

export default GeeNiusPayProcessor;
