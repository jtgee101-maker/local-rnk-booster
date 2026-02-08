/**
 * Payment Processor Abstraction Layer
 * Supports multiple payment processors: Stripe, PayPal, Square
 * Allows white-label customers to use their own payment credentials
 */

/**
 * Base Payment Processor Interface
 */
class PaymentProcessor {
  constructor(config) {
    this.type = config.type;
    this.credentials = config.credentials;
    this.testMode = config.testMode || false;
  }

  /**
   * Create a payment intent/order
   * @param {Object} params - { amount, currency, metadata }
   * @returns {Promise<Object>} - Payment intent details
   */
  async createPaymentIntent(params) {
    throw new Error('createPaymentIntent must be implemented');
  }

  /**
   * Confirm/capture payment
   * @param {string} paymentId - Payment intent/order ID
   * @returns {Promise<Object>} - Confirmation details
   */
  async confirmPayment(paymentId) {
    throw new Error('confirmPayment must be implemented');
  }

  /**
   * Refund payment
   * @param {string} paymentId - Payment ID to refund
   * @param {number} amount - Amount to refund (optional, full refund if not provided)
   * @returns {Promise<Object>} - Refund details
   */
  async refundPayment(paymentId, amount) {
    throw new Error('refundPayment must be implemented');
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} - Payment status
   */
  async getPaymentStatus(paymentId) {
    throw new Error('getPaymentStatus must be implemented');
  }

  /**
   * Create customer
   * @param {Object} customerData - { email, name, metadata }
   * @returns {Promise<Object>} - Customer details
   */
  async createCustomer(customerData) {
    throw new Error('createCustomer must be implemented');
  }
}

/**
 * Stripe Payment Processor
 */
class StripeProcessor extends PaymentProcessor {
  constructor(config) {
    super(config);
    this.stripe = null;
    this.initialize();
  }

  async initialize() {
    // Dynamic import for Stripe
    const Stripe = (await import('@stripe/stripe-js')).loadStripe;
    this.stripe = await Stripe(this.credentials.publicKey);
  }

  async createPaymentIntent(params) {
    const { amount, currency = 'usd', metadata = {} } = params;

    try {
      // Call your Base44 function
      const response = await fetch('/api/createPaymentIntent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          metadata,
          processor: 'stripe'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return {
        id: data.id,
        clientSecret: data.client_secret,
        amount: data.amount,
        currency: data.currency,
        status: data.status
      };
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const response = await fetch('/api/confirmPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          processor: 'stripe'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Stripe confirm payment error:', error);
      throw error;
    }
  }

  async refundPayment(chargeId, amount) {
    try {
      const response = await fetch('/api/processRefund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chargeId,
          amount,
          processor: 'stripe'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      return await response.json();
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentIntentId) {
    try {
      const response = await fetch(`/api/paymentStatus?id=${paymentIntentId}&processor=stripe`);
      
      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Stripe payment status error:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const response = await fetch('/api/createCustomer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          processor: 'stripe'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      return await response.json();
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw error;
    }
  }
}

/**
 * PayPal Payment Processor
 */
class PayPalProcessor extends PaymentProcessor {
  constructor(config) {
    super(config);
    this.paypal = null;
    this.initialize();
  }

  async initialize() {
    // Load PayPal SDK
    if (!window.paypal) {
      await this.loadPayPalSDK();
    }
    this.paypal = window.paypal;
  }

  async loadPayPalSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const clientId = this.testMode 
        ? this.credentials.sandboxClientId 
        : this.credentials.liveClientId;
      
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async createPaymentIntent(params) {
    const { amount, currency = 'USD', metadata = {} } = params;

    try {
      const response = await fetch('/api/createPaymentIntent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: (amount / 100).toFixed(2), // PayPal uses dollars, not cents
          currency,
          metadata,
          processor: 'paypal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const data = await response.json();
      return {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status
      };
    } catch (error) {
      console.error('PayPal order creation error:', error);
      throw error;
    }
  }

  async confirmPayment(orderId) {
    try {
      const response = await fetch('/api/confirmPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          processor: 'paypal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to capture PayPal order');
      }

      return await response.json();
    } catch (error) {
      console.error('PayPal capture error:', error);
      throw error;
    }
  }

  async refundPayment(captureId, amount) {
    try {
      const response = await fetch('/api/processRefund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureId,
          amount: amount ? (amount / 100).toFixed(2) : undefined,
          processor: 'paypal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process PayPal refund');
      }

      return await response.json();
    } catch (error) {
      console.error('PayPal refund error:', error);
      throw error;
    }
  }

  async getPaymentStatus(orderId) {
    try {
      const response = await fetch(`/api/paymentStatus?id=${orderId}&processor=paypal`);
      
      if (!response.ok) {
        throw new Error('Failed to get PayPal order status');
      }

      return await response.json();
    } catch (error) {
      console.error('PayPal status error:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    // PayPal doesn't have a separate customer creation step
    // Customer data is captured during checkout
    return { success: true, note: 'PayPal handles customers during checkout' };
  }
}

/**
 * Square Payment Processor
 */
class SquareProcessor extends PaymentProcessor {
  constructor(config) {
    super(config);
    this.square = null;
    this.initialize();
  }

  async initialize() {
    // Load Square SDK
    if (!window.Square) {
      await this.loadSquareSDK();
    }
    
    const applicationId = this.testMode
      ? this.credentials.sandboxApplicationId
      : this.credentials.applicationId;
    
    this.square = await window.Square.payments(applicationId, this.credentials.locationId);
  }

  async loadSquareSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const environment = this.testMode ? 'sandbox' : 'production';
      
      script.src = `https://${environment === 'sandbox' ? 'sandbox.' : ''}web.squarecdn.com/v1/square.js`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async createPaymentIntent(params) {
    const { amount, currency = 'USD', metadata = {} } = params;

    try {
      const response = await fetch('/api/createPaymentIntent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          metadata,
          processor: 'square'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Square payment');
      }

      const data = await response.json();
      return {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status
      };
    } catch (error) {
      console.error('Square payment error:', error);
      throw error;
    }
  }

  async confirmPayment(paymentId) {
    try {
      const response = await fetch('/api/confirmPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          processor: 'square'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm Square payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Square confirm error:', error);
      throw error;
    }
  }

  async refundPayment(paymentId, amount) {
    try {
      const response = await fetch('/api/processRefund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          amount,
          processor: 'square'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process Square refund');
      }

      return await response.json();
    } catch (error) {
      console.error('Square refund error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`/api/paymentStatus?id=${paymentId}&processor=square`);
      
      if (!response.ok) {
        throw new Error('Failed to get Square payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Square status error:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const response = await fetch('/api/createCustomer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          processor: 'square'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Square customer');
      }

      return await response.json();
    } catch (error) {
      console.error('Square create customer error:', error);
      throw error;
    }
  }
}

/**
 * Payment Processor Factory
 * Creates the appropriate processor based on configuration
 */
export class PaymentProcessorFactory {
  static async create(config) {
    switch (config.type.toLowerCase()) {
      case 'stripe':
        return new StripeProcessor(config);
      case 'paypal':
        return new PayPalProcessor(config);
      case 'square':
        return new SquareProcessor(config);
      case 'geeniuspay':
        const { GeeNiusPayProcessor } = await import('./payment-processors/geeniuspay.js');
        return new GeeNiusPayProcessor(config);
      case 'whop':
        const { WhopProcessor } = await import('./payment-processors/whop.js');
        return new WhopProcessor(config);
      case 'cryptoprocessing':
      case 'crypto':
        const { CryptoProcessingAdapter } = await import('./payment-processors/crypto.js');
        return new CryptoProcessingAdapter(config);
      case 'nmi':
      case 'authorizenet':
      case 'payra':
      case 'custom-embed':
        // These require additional implementation
        throw new Error(`${config.type} processor is being configured. Contact support for setup.`);
      default:
        throw new Error(`Unsupported payment processor: ${config.type}`);
    }
  }

  /**
   * Get available processors
   */
  static getAvailableProcessors() {
    return [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Credit cards, digital wallets, and more',
        logo: '/assets/processors/stripe.svg',
        features: ['Credit Cards', 'Apple Pay', 'Google Pay', 'Bank Transfers'],
        setup: 'Easy - Get started in minutes',
        category: 'Traditional'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'PayPal and credit cards',
        logo: '/assets/processors/paypal.svg',
        features: ['PayPal', 'Credit Cards', 'Pay Later'],
        setup: 'Easy - Connect your PayPal account',
        category: 'Traditional'
      },
      {
        id: 'square',
        name: 'Square',
        description: 'Accept payments online and in-person',
        logo: '/assets/processors/square.svg',
        features: ['Credit Cards', 'Apple Pay', 'Google Pay', 'Cash App Pay'],
        setup: 'Moderate - Requires Square account',
        category: 'Traditional'
      },
      {
        id: 'geeniuspay',
        name: 'GeeNiusPay',
        description: 'Custom payment solution for local businesses',
        logo: '/assets/processors/geeniuspay.svg',
        features: ['Credit Cards', 'ACH', 'Local Payments', 'Recurring Billing'],
        setup: 'Easy - Custom integration for GMB Rank Booster',
        category: 'Custom',
        recommended: true
      },
      {
        id: 'whop',
        name: 'Whop.com',
        description: 'Checkout links for digital products',
        logo: '/assets/processors/whop.svg',
        features: ['Checkout Links', 'Digital Products', 'Subscriptions', 'Discord Integration'],
        setup: 'Easy - Generate checkout links',
        category: 'Digital Products',
        url: 'https://whop.com'
      },
      {
        id: 'payra',
        name: 'Payra.com',
        description: 'Payment processor for SaaS businesses',
        logo: '/assets/processors/payra.svg',
        features: ['Credit Cards', 'Subscriptions', 'Invoicing', 'Analytics'],
        setup: 'Moderate - SaaS-focused features',
        category: 'SaaS',
        url: 'https://payra.com'
      },
      {
        id: 'nmi',
        name: 'NMI (Network Merchants)',
        description: 'Gateway for credit card processing',
        logo: '/assets/processors/nmi.svg',
        features: ['Credit Cards', 'ACH', 'Recurring Billing', 'Tokenization'],
        setup: 'Advanced - Merchant account required',
        category: 'Gateway'
      },
      {
        id: 'authorizenet',
        name: 'Authorize.Net',
        description: 'Trusted payment gateway since 1996',
        logo: '/assets/processors/authorizenet.svg',
        features: ['Credit Cards', 'eChecks', 'Recurring Billing', 'Fraud Detection'],
        setup: 'Moderate - Merchant account required',
        category: 'Gateway'
      },
      {
        id: 'cryptoprocessing',
        name: 'Crypto Processing',
        description: 'Accept cryptocurrency payments',
        logo: '/assets/processors/cryptoprocessing.svg',
        features: ['Bitcoin', 'Ethereum', 'USDT', '150+ Cryptocurrencies'],
        setup: 'Easy - Partner integration',
        category: 'Cryptocurrency',
        url: 'https://cryptoprocessing.com',
        partner: true
      },
      {
        id: 'custom-embed',
        name: 'Custom Embed API',
        description: 'Integrate any third-party payment processor',
        logo: '/assets/processors/custom.svg',
        features: ['Custom API Integration', 'Webhook Support', 'Flexible Configuration'],
        setup: 'Advanced - Developer integration required',
        category: 'Custom Integration'
      }
    ];
  }
}

export default PaymentProcessorFactory;
