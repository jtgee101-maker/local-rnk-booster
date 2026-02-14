/**
 * Test Setup for 200X Testing Framework
 * 
 * Configures testing environment with proper mocks and utilities
 * @200x-optimized
 */

import { expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// ============================================
// Global Test Configuration
// ============================================

// Mock Deno runtime for function tests
global.Deno = {
  serve: vi.fn((handler) => {
    // Return mock server
    return {
      shutdown: vi.fn()
    };
  }),
  env: {
    get: vi.fn((name: string) => process.env[name])
  }
} as unknown as typeof Deno;

// ============================================
// Mock Base44 SDK
// ============================================

export const createMockBase44Client = (overrides = {}) => ({
  auth: {
    me: vi.fn().mockResolvedValue({
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'admin'
    }),
    getUser: vi.fn().mockResolvedValue({
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'admin'
    })
  },
  asServiceRole: {
    entities: {
      ABTest: {
        create: vi.fn().mockResolvedValue({ id: 'test-123', name: 'Test' }),
        get: vi.fn().mockResolvedValue({ id: 'test-123', name: 'Test' }),
        filter: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({ id: 'test-123' }),
        delete: vi.fn().mockResolvedValue(undefined)
      },
      ABTestEvent: {
        create: vi.fn().mockResolvedValue({ id: 'event-123' }),
        get: vi.fn().mockResolvedValue({ id: 'event-123' }),
        filter: vi.fn().mockResolvedValue([])
      },
      ErrorLog: {
        create: vi.fn().mockResolvedValue({ id: 'error-123' })
      }
    }
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ success: true })
  },
  ...overrides
});

// ============================================
// Mock Request/Response Helpers
// ============================================

export const createMockRequest = (body: unknown, headers = {}): Request => {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(headers),
    method: 'POST',
    url: 'http://localhost/test'
  } as unknown as Request;
};

export const createMockResponse = () => {
  return {
    json: vi.fn().mockReturnThis(),
    status: 200,
    headers: new Headers()
  } as unknown as Response;
};

// ============================================
// Test Utilities
// ============================================

/**
 * Creates a mock fetch response
 */
export const mockFetchResponse = (data: unknown, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  } as Response);
};

/**
 * Waits for async operations to complete
 */
export const waitForAsync = (ms = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Resets all mocks between tests
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();
};

// ============================================
// Performance Testing Utilities
// ============================================

/**
 * Measures execution time of a function
 */
export const measurePerformance = async <T>(
  fn: () => Promise<T>,
  iterations = 1
): Promise<{ result: T; avgTime: number; minTime: number; maxTime: number }> => {
  const times: number[] = [];
  let result: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = await fn();
    const end = performance.now();
    times.push(end - start);
  }

  return {
    result: result!,
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times)
  };
};

/**
 * Asserts that a function executes within a time limit
 */
export const expectExecutionTime = async <T>(
  fn: () => Promise<T>,
  maxMs: number,
  description = 'Operation'
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(maxMs);
  console.log(`${description}: ${duration.toFixed(2)}ms (max: ${maxMs}ms)`);
  
  return result;
};

// ============================================
// Console Mocking (for testing console.log cleanup)
// ============================================

const originalConsole = { ...console };

export const mockConsole = () => {
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
  console.info = vi.fn();
};

export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
};

// ============================================
// Jest DOM Matchers Setup
// ============================================

// Extend expect with custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// ============================================
// Global Test Lifecycle
// ============================================

beforeAll(() => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
  process.env.VITE_BASE44_PROJECT_ID = 'test-project';
  process.env.VITE_BASE44_API_KEY = 'test-api-key';
});

afterAll(() => {
  // Cleanup global test environment
  delete process.env.VITE_BASE44_PROJECT_ID;
  delete process.env.VITE_BASE44_API_KEY;
});

beforeEach(() => {
  // Reset mocks before each test
  resetAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  restoreConsole();
});
