/**
 * Whop.com Payment Adapter
 * Checkout links for digital products and subscriptions
 * https://whop.com
 */

import { PaymentProcessor } from '../payment-processor';

export class WhopProcessor extends PaymentProcessor {
  constructor(config) {
    super(config);
    this.apiEndpoint = 'https://api.whop.com/v2';
    this.apiKey = config.credentials.apiKey;
    this.companyId = config.credentials.companyId;
  }

  async createPaymentIntent(params) {
    const { amount, currency = 'USD', metadata = {} } = params;

    try {
      // Whop uses checkout links instead of traditional payment intents
      const response = await fetch(`${this.apiEndpoint}/checkout/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          company_id: this.companyId,
          product_id: metadata.productId,
          price_amount: amount / 100,
          price_currency: currency,
          success_url: metadata.returnUrl,
          cancel_url: metadata.cancelUrl,
          metadata: {
            order_id: metadata.orderId,
            customer_email: metadata.customerEmail,
            ...metadata
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Whop checkout link');
      }

      const data = await response.json();
      return {
        id: data.checkout_id,
        checkoutUrl: data.checkout_url,
        amount: amount,
        currency: currency,
        status: 'pending',
        expiresAt: data.expires_at
      };
    } catch (error) {
      console.error('Whop checkout creation error:', error);
      throw error;
    }
  }

  async confirmPayment(checkoutId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/checkout/${checkoutId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get Whop checkout status');
      }

      const data = await response.json();
      return {
        id: data.checkout_id,
        status: data.status, // pending, completed, cancelled, expired
        membershipId: data.membership_id,
        customerId: data.customer_id
      };
    } catch (error) {
      console.error('Whop confirmation error:', error);
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
        throw new Error('Failed to process Whop refund');
      }

      return await response.json();
    } catch (error) {
      console.error('Whop refund error:', error);
      throw error;
    }
  }

  async getPaymentStatus(checkoutId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/checkout/${checkoutId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get Whop payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Whop status error:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    // Whop creates customers automatically during checkout
    return {
      success: true,
      note: 'Whop creates customers during checkout process'
    };
  }

  /**
   * Create a subscription for recurring billing
   */
  async createSubscription(params) {
    const { productId, planId, metadata = {} } = params;

    try {
      const response = await fetch(`${this.apiEndpoint}/memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          company_id: this.companyId,
          product_id: productId,
          plan_id: planId,
          customer_email: metadata.customerEmail,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Whop membership');
      }

      return await response.json();
    } catch (error) {
      console.error('Whop subscription error:', error);
      throw error;
    }
  }

  /**
   * Generate simple checkout link (no API call needed)
   */
  static generateCheckoutLink(companyId, productId, metadata = {}) {
    const params = new URLSearchParams({
      product: productId,
      ...metadata
    });
    
    return `https://whop.com/checkout/${companyId}?${params.toString()}`;
  }
}

export default WhopProcessor;
