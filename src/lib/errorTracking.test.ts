import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initErrorTracking,
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  withErrorTracking,
  createErrorBoundary,
  errorTracking,
} from './errorTracking';

describe('Error Tracking', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Reset error tracking state
    if (errorTracking) {
      errorTracking.isInitialized = false;
      errorTracking.userContext = null;
      errorTracking.breadcrumbs = [];
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initErrorTracking', () => {
    it('should initialize error tracking', () => {
      initErrorTracking({
        dsn: 'https://test@example.com/1',
        environment: 'test',
      });
      
      expect(errorTracking.isInitialized).toBe(true);
    });

    it('should set configuration options', () => {
      initErrorTracking({
        dsn: 'https://test@example.com/1',
        environment: 'production',
        release: '1.0.0',
      });
      
      expect(errorTracking.config.environment).toBe('production');
      expect(errorTracking.config.release).toBe('1.0.0');
    });

    it('should not initialize twice', () => {
      initErrorTracking({ dsn: 'https://test@example.com/1' });
      const firstInit = errorTracking.isInitialized;
      
      initErrorTracking({ dsn: 'https://test@example.com/2' });
      
      expect(errorTracking.isInitialized).toBe(firstInit);
    });
  });

  describe('captureError', () => {
    it('should capture Error objects', () => {
      const error = new Error('Test error');
      captureError(error);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should capture errors with custom context', () => {
      const error = new Error('Test error');
      captureError(error, { 
        tags: { component: 'TestComponent' },
        extra: { userId: '123' },
      });
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle string errors', () => {
      captureError('String error message');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle errors without stack traces', () => {
      const error = { message: 'Error without stack' };
      captureError(error);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('captureMessage', () => {
    it('should capture info messages', () => {
      captureMessage('Test info message', 'info');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should capture warning messages', () => {
      captureMessage('Test warning message', 'warning');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should capture error messages', () => {
      captureMessage('Test error message', 'error');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should default to info level', () => {
      captureMessage('Test message');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('setUserContext', () => {
    it('should set user context', () => {
      setUserContext({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });
      
      expect(errorTracking.userContext).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('should merge with existing context', () => {
      setUserContext({ id: 'user-123' });
      setUserContext({ email: 'test@example.com' });
      
      expect(errorTracking.userContext).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
    });
  });

  describe('clearUserContext', () => {
    it('should clear user context', () => {
      setUserContext({ id: 'user-123' });
      clearUserContext();
      
      expect(errorTracking.userContext).toBeNull();
    });

    it('should handle clearing when no context exists', () => {
      clearUserContext();
      
      expect(errorTracking.userContext).toBeNull();
    });
  });

  describe('withErrorTracking', () => {
    it('should track synchronous function errors', () => {
      const fn = () => {
        throw new Error('Sync error');
      };
      
      const wrappedFn = withErrorTracking(fn, { component: 'Test' });
      
      expect(() => wrappedFn()).toThrow('Sync error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should track async function errors', async () => {
      const fn = async () => {
        throw new Error('Async error');
      };
      
      const wrappedFn = withErrorTracking(fn, { component: 'Test' });
      
      await expect(wrappedFn()).rejects.toThrow('Async error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should return successful results', async () => {
      const fn = async () => 'success';
      const wrappedFn = withErrorTracking(fn);
      
      const result = await wrappedFn();
      expect(result).toBe('success');
    });

    it('should pass arguments to wrapped function', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const wrappedFn = withErrorTracking(fn);
      
      const result = wrappedFn(2, 3);
      
      expect(result).toBe(5);
      expect(fn).toHaveBeenCalledWith(2, 3);
    });
  });

  describe('createErrorBoundary', () => {
    it('should create error boundary handler', () => {
      const handler = createErrorBoundary('TestComponent');
      
      expect(typeof handler).toBe('function');
    });

    it('should capture errors with component info', () => {
      const handler = createErrorBoundary('TestComponent');
      const error = new Error('Boundary error');
      const errorInfo = { componentStack: 'Test stack' };
      
      handler(error, errorInfo);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('errorTracking object', () => {
    it('should expose required properties', () => {
      expect(errorTracking).toHaveProperty('isInitialized');
      expect(errorTracking).toHaveProperty('config');
      expect(errorTracking).toHaveProperty('userContext');
      expect(errorTracking).toHaveProperty('breadcrumbs');
    });

    it('should have empty breadcrumbs initially', () => {
      expect(errorTracking.breadcrumbs).toEqual([]);
    });

    it('should have null userContext initially', () => {
      expect(errorTracking.userContext).toBeNull();
    });

    it('should be uninitialized initially', () => {
      expect(errorTracking.isInitialized).toBe(false);
    });
  });
});
