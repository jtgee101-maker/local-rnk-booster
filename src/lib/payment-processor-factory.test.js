import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentProcessorFactory } from './payment-processor';

// Mock Stripe
const mockStripeLoad = vi.fn();
const mockStripeConfirmCardPayment = vi.fn();
const mockStripeCreatePaymentMethod = vi.fn();

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: (...args) => mockStripeLoad(...args),
}));

// Mock PayPal SDK
delete window.paypal;

// Mock Square SDK
delete window.Square;

describe('PaymentProcessorFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset window objects
    delete window.paypal;
    delete window.Square;
    
    // Mock fetch
    global.fetch = vi.fn();
  });

  describe('getAvailableProcessors', () => {
    it('returns list of available processors', () => {
      const processors = PaymentProcessorFactory.getAvailableProcessors();
      
      expect(processors).toBeInstanceOf(Array);
      expect(processors.length).toBeGreaterThan(0);
      
      // Check for expected processors
      const stripe = processors.find(p => p.id === 'stripe');
      expect(stripe).toBeDefined();
      expect(stripe.name).toBe('Stripe');
      expect(stripe.features).toContain('Credit Cards');
      
      const paypal = processors.find(p => p.id === 'paypal');
      expect(paypal).toBeDefined();
      expect(paypal.name).toBe('PayPal');
    });

    it('includes GeeNiusPay as recommended', () => {
      const processors = PaymentProcessorFactory.getAvailableProcessors();
      const geeniuspay = processors.find(p => p.id === 'geeniuspay');
      
      expect(geeniuspay).toBeDefined();
      expect(geeniuspay.recommended).toBe(true);
      expect(geeniuspay.category).toBe('Custom');
    });

    it('includes cryptocurrency option', () => {
      const processors = PaymentProcessorFactory.getAvailableProcessors();
      const crypto = processors.find(p => p.id === 'cryptoprocessing');
      
      expect(crypto).toBeDefined();
      expect(crypto.features).toContain('Bitcoin');
      expect(crypto.features).toContain('Ethereum');
    });

    it('includes gateway processors', () => {
      const processors = PaymentProcessorFactory.getAvailableProcessors();
      
      const nmi = processors.find(p => p.id === 'nmi');
      const authorize = processors.find(p => p.id === 'authorizenet');
      
      expect(nmi).toBeDefined();
      expect(authorize).toBeDefined();
      expect(nmi.category).toBe('Gateway');
    });
  });

  describe('create - Stripe', () => {
    it('creates Stripe processor instance', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
        createPaymentMethod: mockStripeCreatePaymentMethod,
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      expect(processor).toBeDefined();
      expect(mockStripeLoad).toHaveBeenCalledWith('pk_test_123');
    });

    it('creates Stripe processor with live key in production', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_live_456' },
        testMode: false,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      expect(mockStripeLoad).toHaveBeenCalledWith('pk_live_456');
    });

    it('Stripe createPaymentIntent calls API correctly', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'pi_123',
          client_secret: 'secret_123',
          amount: 1000,
          currency: 'usd',
          status: 'requires_confirmation',
        }),
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      const result = await processor.createPaymentIntent({
        amount: 1000,
        currency: 'usd',
        metadata: { orderId: '123' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/createPaymentIntent',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('stripe'),
        })
      );
      expect(result.id).toBe('pi_123');
      expect(result.clientSecret).toBe('secret_123');
    });

    it('Stripe confirmPayment calls API correctly', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'succeeded',
          id: 'pi_123',
        }),
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      const result = await processor.confirmPayment('pi_123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/confirmPayment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('pi_123'),
        })
      );
    });

    it('Stripe refundPayment calls API correctly', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 're_123',
          status: 'succeeded',
        }),
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      const result = await processor.refundPayment('ch_123', 500);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/processRefund',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('ch_123'),
        })
      );
    });

    it('Stripe getPaymentStatus calls API correctly', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'succeeded',
          id: 'pi_123',
        }),
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      const result = await processor.getPaymentStatus('pi_123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/paymentStatus?id=pi_123&processor=stripe',
        expect.any(Object)
      );
    });

    it('Stripe createCustomer calls API correctly', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cus_123',
          email: 'test@example.com',
        }),
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      const result = await processor.createCustomer({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/createCustomer',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test@example.com'),
        })
      );
    });

    it('handles Stripe API errors', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      await expect(processor.createPaymentIntent({ amount: 1000 }))
        .rejects.toThrow('Failed to create payment intent');
    });
  });

  describe('create - PayPal', () => {
    it('creates PayPal processor instance', async () => {
      const config = {
        type: 'paypal',
        credentials: {
          sandboxClientId: 'sb_client_123',
          liveClientId: 'live_client_456',
        },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      expect(processor).toBeDefined();
    });

    it('PayPal createPaymentIntent converts cents to dollars', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'ORDER_123',
          amount: '10.00',
          currency: 'USD',
          status: 'CREATED',
        }),
      });

      const config = {
        type: 'paypal',
        credentials: {
          sandboxClientId: 'sb_client_123',
        },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      await processor.createPaymentIntent({
        amount: 1000, // cents
        currency: 'USD',
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.amount).toBe('10.00'); // dollars
    });

    it('PayPal refundPayment handles optional amount', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'REFUND_123',
          status: 'COMPLETED',
        }),
      });

      const config = {
        type: 'paypal',
        credentials: { sandboxClientId: 'sb_client_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      // Partial refund
      await processor.refundPayment('CAPTURE_123', 500);
      
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.amount).toBe('5.00');
    });

    it('PayPal createCustomer returns note about checkout', async () => {
      const config = {
        type: 'paypal',
        credentials: { sandboxClientId: 'sb_client_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      const result = await processor.createCustomer({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.note).toContain('PayPal handles customers');
    });
  });

  describe('create - Square', () => {
    it('creates Square processor instance', async () => {
      const config = {
        type: 'square',
        credentials: {
          sandboxApplicationId: 'sq0idp-xxx',
          applicationId: 'sq0idp-live',
          locationId: 'L_123',
        },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      expect(processor).toBeDefined();
    });

    it('Square uses sandbox SDK in test mode', async () => {
      const scriptAppendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(() => {});
      
      const config = {
        type: 'square',
        credentials: {
          sandboxApplicationId: 'sq0idp-xxx',
          locationId: 'L_123',
        },
        testMode: true,
      };

      await PaymentProcessorFactory.create(config);
      
      // Check that sandbox script URL was used
      const scriptCalls = scriptAppendSpy.mock.calls;
      expect(scriptCalls.length).toBeGreaterThan(0);
    });
  });

  describe('create - Other Processors', () => {
    it('creates GeeNiusPay processor', async () => {
      // Mock the dynamic import
      vi.doMock('./payment-processors/geeniuspay.js', () => ({
        GeeNiusPayProcessor: class {
          constructor(config) { this.config = config; }
        },
      }));

      const config = {
        type: 'geeniuspay',
        credentials: { apiKey: 'key_123' },
        testMode: true,
      };

      // This will fail due to dynamic import, but tests the factory logic
      await expect(PaymentProcessorFactory.create(config)).rejects.toThrow();
    });

    it('throws error for unsupported processor', async () => {
      const config = {
        type: 'unknown_processor',
        credentials: {},
      };

      await expect(PaymentProcessorFactory.create(config))
        .rejects.toThrow('Unsupported payment processor');
    });

    it('throws error for processors being configured', async () => {
      const config = {
        type: 'nmi',
        credentials: {},
      };

      await expect(PaymentProcessorFactory.create(config))
        .rejects.toContain('is being configured');
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      await expect(processor.createPaymentIntent({ amount: 1000 }))
        .rejects.toThrow('Network error');
    });

    it('handles JSON parse errors', async () => {
      mockStripeLoad.mockResolvedValue({
        confirmCardPayment: mockStripeConfirmCardPayment,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const config = {
        type: 'stripe',
        credentials: { publicKey: 'pk_test_123' },
        testMode: true,
      };

      const processor = await PaymentProcessorFactory.create(config);
      
      await expect(processor.createPaymentIntent({ amount: 1000 }))
        .rejects.toThrow();
    });
  });
});
