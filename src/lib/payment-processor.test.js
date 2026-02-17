import { describe, it, expect, vi, beforeEach } from 'vitest';
import paymentProcessor from './payment-processor';

// Mock stripe
const mockStripeLoad = vi.fn();
const mockConfirmPayment = vi.fn();
const mockCreatePaymentMethod = vi.fn();

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: (...args) => mockStripeLoad(...args),
}));

describe('Payment Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStripeLoad.mockResolvedValue({
      confirmCardPayment: mockConfirmPayment,
      createPaymentMethod: mockCreatePaymentMethod,
    });
  });

  it('initializes Stripe with publishable key', async () => {
    const key = 'pk_test_123';
    await paymentProcessor.initialize(key);
    
    expect(mockStripeLoad).toHaveBeenCalledWith(key);
  });

  it('throws error if Stripe key is missing', async () => {
    await expect(paymentProcessor.initialize('')).rejects.toThrow();
  });

  it('creates payment method with card element', async () => {
    mockCreatePaymentMethod.mockResolvedValue({
      paymentMethod: { id: 'pm_123' },
      error: null,
    });
    
    const mockCardElement = {};
    await paymentProcessor.initialize('pk_test_123');
    const result = await paymentProcessor.createPaymentMethod(mockCardElement);
    
    expect(mockCreatePaymentMethod).toHaveBeenCalled();
    expect(result.paymentMethod.id).toBe('pm_123');
  });

  it('handles payment method creation errors', async () => {
    mockCreatePaymentMethod.mockResolvedValue({
      paymentMethod: null,
      error: { message: 'Card declined' },
    });
    
    await paymentProcessor.initialize('pk_test_123');
    const result = await paymentProcessor.createPaymentMethod({});
    
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Card declined');
  });

  it('confirms card payment with client secret', async () => {
    mockConfirmPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
      error: null,
    });
    
    await paymentProcessor.initialize('pk_test_123');
    const result = await paymentProcessor.confirmPayment('pi_123_secret', {});
    
    expect(mockConfirmPayment).toHaveBeenCalledWith('pi_123_secret', expect.any(Object));
    expect(result.paymentIntent.status).toBe('succeeded');
  });
});
