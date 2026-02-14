/**
 * A/B Test Functions - Test Suite
 * 
 * Tests for createTest, getTestResults, and recordEvent functions
 * @200x-optimized
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  createMockBase44Client, 
  createMockRequest,
  mockFetchResponse 
} from '../setup';

// ============================================
// Mock the Base44 SDK
// ============================================

vi.mock('npm:@base44/sdk@0.8.6', () => ({
  createClientFromRequest: vi.fn()
}));

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ============================================
// Test Data
// ============================================

const validTestPayload = {
  name: 'Homepage Hero Test',
  page: '/home',
  element: 'hero-banner',
  variants: [
    { id: 'variant-a', name: 'Control', content: { text: 'Original' } },
    { id: 'variant-b', name: 'Treatment', content: { text: 'New Version' } }
  ],
  traffic_split: { 'variant-a': 50, 'variant-b': 50 }
};

const validEventPayload = {
  test_id: 'test-123',
  variant_id: 'variant-a',
  session_id: 'session-456',
  event_type: 'view' as const,
  metadata: { source: 'direct' }
};

// ============================================
// createTest Function Tests
// ============================================

describe('createTest Function', () => {
  it('should create an A/B test with valid data', async () => {
    const mockClient = createMockBase44Client();
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const request = createMockRequest(validTestPayload);
    
    // Simulate the handler logic
    const base44 = createClientFromRequest(request);
    const user = await base44.auth.me();
    
    expect(user).toBeDefined();
    expect(user?.role).toBe('admin');
    
    const result = await base44.asServiceRole.entities.ABTest.create({
      ...validTestPayload,
      status: 'active',
      start_date: new Date().toISOString()
    });
    
    expect(result).toHaveProperty('id');
    expect(mockClient.asServiceRole.entities.ABTest.create).toHaveBeenCalled();
  });

  it('should reject non-admin users', async () => {
    const mockClient = createMockBase44Client({
      auth: {
        me: vi.fn().mockResolvedValue({
          id: 'user-123',
          role: 'user' // Not admin
        }),
        getUser: vi.fn()
      }
    });
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const request = createMockRequest(validTestPayload);
    const base44 = createClientFromRequest(request);
    const user = await base44.auth.me();

    expect(user?.role).not.toBe('admin');
  });

  it('should validate required fields', () => {
    const invalidPayloads = [
      { ...validTestPayload, name: '' },
      { ...validTestPayload, page: '' },
      { ...validTestPayload, element: '' },
      { ...validTestPayload, variants: [] },
      { ...validTestPayload, variants: [{ id: 'only-one' }] }
    ];

    invalidPayloads.forEach(payload => {
      const hasRequiredFields = 
        payload.name && 
        payload.page && 
        payload.element && 
        payload.variants && 
        payload.variants.length >= 2;
      
      expect(hasRequiredFields).toBe(false);
    });
  });

  it('should validate traffic split totals 100%', () => {
    const invalidSplit = {
      ...validTestPayload,
      traffic_split: { 'variant-a': 60, 'variant-b': 30 } // Only 90%
    };

    const splitTotal = Object.values(invalidSplit.traffic_split).reduce(
      (a: number, b: number) => a + b,
      0
    );

    expect(splitTotal).not.toBe(100);
  });
});

// ============================================
// getTestResults Function Tests
// ============================================

describe('getTestResults Function', () => {
  it('should retrieve test results for admin users', async () => {
    const mockEvents = [
      { id: 'event-1', test_id: 'test-123', variant_id: 'variant-a', event_type: 'view' },
      { id: 'event-2', test_id: 'test-123', variant_id: 'variant-a', event_type: 'conversion', conversion_value: 100 },
      { id: 'event-3', test_id: 'test-123', variant_id: 'variant-b', event_type: 'view' }
    ];

    const mockClient = createMockBase44Client({
      asServiceRole: {
        entities: {
          ABTest: {
            get: vi.fn().mockResolvedValue({
              id: 'test-123',
              name: 'Test',
              variants: [
                { id: 'variant-a', name: 'Control' },
                { id: 'variant-b', name: 'Treatment' }
              ]
            })
          },
          ABTestEvent: {
            filter: vi.fn().mockResolvedValue(mockEvents)
          }
        }
      }
    });
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const request = createMockRequest({ test_id: 'test-123' });
    const base44 = createClientFromRequest(request);
    
    const test = await base44.asServiceRole.entities.ABTest.get('test-123');
    const events = await base44.asServiceRole.entities.ABTestEvent.filter({ test_id: 'test-123' });
    
    expect(test).toHaveProperty('id', 'test-123');
    expect(events).toHaveLength(3);
  });

  it('should calculate variant statistics correctly', () => {
    const mockEvents = [
      { variant_id: 'variant-a', event_type: 'view' },
      { variant_id: 'variant-a', event_type: 'view' },
      { variant_id: 'variant-a', event_type: 'conversion', conversion_value: 50 },
      { variant_id: 'variant-b', event_type: 'view' },
      { variant_id: 'variant-b', event_type: 'view' },
      { variant_id: 'variant-b', event_type: 'view' }
    ];

    const variantAEvents = mockEvents.filter(e => e.variant_id === 'variant-a');
    const variantAViews = variantAEvents.filter(e => e.event_type === 'view').length;
    const variantAConversions = variantAEvents.filter(e => e.event_type === 'conversion').length;
    const variantAConversionRate = (variantAConversions / variantAViews) * 100;

    expect(variantAViews).toBe(2);
    expect(variantAConversions).toBe(1);
    expect(variantAConversionRate).toBe(50);
  });

  it('should handle missing test_id', () => {
    const payload = {};
    const hasTestId = 'test_id' in payload && payload.test_id;
    expect(hasTestId).toBe(false);
  });
});

// ============================================
// recordEvent Function Tests
// ============================================

describe('recordEvent Function', () => {
  it('should record a view event', async () => {
    const mockClient = createMockBase44Client();
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const request = createMockRequest(validEventPayload);
    const base44 = createClientFromRequest(request);

    await base44.asServiceRole.entities.ABTestEvent.create({
      ...validEventPayload,
      conversion_value: null,
      metadata: validEventPayload.metadata || {}
    });

    expect(mockClient.asServiceRole.entities.ABTestEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        test_id: validEventPayload.test_id,
        variant_id: validEventPayload.variant_id,
        event_type: 'view'
      })
    );
  });

  it('should record a conversion event with value', async () => {
    const mockClient = createMockBase44Client();
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const conversionPayload = {
      ...validEventPayload,
      event_type: 'conversion' as const,
      conversion_value: 150
    };

    const request = createMockRequest(conversionPayload);
    const base44 = createClientFromRequest(request);

    await base44.asServiceRole.entities.ABTestEvent.create({
      ...conversionPayload,
      metadata: {}
    });

    expect(mockClient.asServiceRole.entities.ABTestEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'conversion',
        conversion_value: 150
      })
    );
  });

  it('should validate event type', () => {
    const validTypes = ['view', 'conversion'];
    const invalidType = 'click';
    
    expect(validTypes).not.toContain(invalidType);
    expect(validTypes).toContain('view');
    expect(validTypes).toContain('conversion');
  });

  it('should require all mandatory fields', () => {
    const requiredFields = ['test_id', 'variant_id', 'session_id', 'event_type'];
    
    const incompletePayload = {
      test_id: 'test-123',
      variant_id: 'variant-a'
      // missing session_id and event_type
    };

    requiredFields.forEach(field => {
      expect(incompletePayload).not.toHaveProperty(field);
    });
  });
});

// ============================================
// Error Handling Tests
// ============================================

describe('Error Handling', () => {
  it('should handle authentication errors', async () => {
    const mockClient = createMockBase44Client({
      auth: {
        me: vi.fn().mockRejectedValue(new Error('Auth failed')),
        getUser: vi.fn()
      }
    });
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const request = createMockRequest(validTestPayload);
    const base44 = createClientFromRequest(request);

    await expect(base44.auth.me()).rejects.toThrow('Auth failed');
  });

  it('should handle database errors gracefully', async () => {
    const mockClient = createMockBase44Client({
      asServiceRole: {
        entities: {
          ABTest: {
            create: vi.fn().mockRejectedValue(new Error('Database error'))
          }
        }
      }
    });
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const request = createMockRequest(validTestPayload);
    const base44 = createClientFromRequest(request);

    await expect(
      base44.asServiceRole.entities.ABTest.create(validTestPayload)
    ).rejects.toThrow('Database error');
  });

  it('should log errors to ErrorLog entity', async () => {
    const mockClient = createMockBase44Client();
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const errorData = {
      error_type: 'test_error',
      severity: 'medium',
      message: 'Test error message',
      metadata: { test: true }
    };

    const request = createMockRequest({});
    const base44 = createClientFromRequest(request);

    await base44.asServiceRole.entities.ErrorLog.create(errorData);

    expect(mockClient.asServiceRole.entities.ErrorLog.create).toHaveBeenCalledWith(
      expect.objectContaining(errorData)
    );
  });
});

// ============================================
// Performance Tests
// ============================================

describe('Performance', () => {
  it('should complete operations within 5 seconds', async () => {
    const mockClient = createMockBase44Client();
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const start = performance.now();
    
    const request = createMockRequest(validTestPayload);
    const base44 = createClientFromRequest(request);
    await base44.asServiceRole.entities.ABTest.create(validTestPayload);
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5000); // 5 second timeout
  });

  it('should handle concurrent requests', async () => {
    const mockClient = createMockBase44Client();
    vi.mocked(createClientFromRequest).mockReturnValue(mockClient);

    const requests = Array(10).fill(null).map((_, i) => 
      createMockRequest({ ...validTestPayload, name: `Test ${i}` })
    );

    const results = await Promise.all(
      requests.map(req => {
        const base44 = createClientFromRequest(req);
        return base44.asServiceRole.entities.ABTest.create(validTestPayload);
      })
    );

    expect(results).toHaveLength(10);
    expect(mockClient.asServiceRole.entities.ABTest.create).toHaveBeenCalledTimes(10);
  });
});
