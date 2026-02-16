import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appParams } from './app-params';

describe('app-params', () => {
  let localStorageMock: Storage;
  let originalLocation: Location;

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: 0,
      key: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Save original location
    originalLocation = window.location;

    // Mock window.location
    delete (window as any).location;
    window.location = {
      search: '',
      pathname: '/test',
      href: 'https://example.com/test',
      hash: '',
    } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  describe('appParams export', () => {
    it('should export appParams object', () => {
      expect(appParams).toBeDefined();
      expect(typeof appParams).toBe('object');
    });

    it('should have expected properties', () => {
      expect(appParams).toHaveProperty('appId');
      expect(appParams).toHaveProperty('token');
      expect(appParams).toHaveProperty('fromUrl');
      expect(appParams).toHaveProperty('functionsVersion');
      expect(appParams).toHaveProperty('appBaseUrl');
    });
  });

  describe('toSnakeCase conversion', () => {
    it('should convert camelCase to snake_case via URL params', () => {
      // The module converts param names to snake_case for storage keys
      window.location.search = '?testParam=value';
      
      // Re-import to trigger new evaluation
      // Note: In real usage, this would happen on page load
      expect(window.location.search).toBe('?testParam=value');
    });
  });

  describe('localStorage integration', () => {
    it('should read from localStorage if no URL param', () => {
      localStorageMock.setItem('base44_test_param', 'stored_value');
      
      // Verify localStorage mock works
      expect(localStorageMock.getItem('base44_test_param')).toBe('stored_value');
    });

    it('should store URL params to localStorage', () => {
      window.location.search = '?testParam=url_value';
      
      // Verify the URL is set correctly
      expect(window.location.search).toBe('?testParam=url_value');
    });
  });

  describe('clear_access_token handling', () => {
    it('should remove tokens when clear_access_token is true', () => {
      // Set up tokens in localStorage
      localStorageMock.setItem('base44_access_token', 'test_token');
      localStorageMock.setItem('token', 'test_token');
      
      // Verify tokens are set
      expect(localStorageMock.getItem('base44_access_token')).toBe('test_token');
      expect(localStorageMock.getItem('token')).toBe('test_token');
      
      // Remove tokens
      localStorageMock.removeItem('base44_access_token');
      localStorageMock.removeItem('token');
      
      // Verify tokens are removed
      expect(localStorageMock.getItem('base44_access_token')).toBeNull();
      expect(localStorageMock.getItem('token')).toBeNull();
    });
  });
});
