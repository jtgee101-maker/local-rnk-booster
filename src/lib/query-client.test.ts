import { describe, it, expect } from 'vitest';
import { queryClientInstance } from './query-client';

describe('query-client', () => {
  it('should export queryClientInstance', () => {
    expect(queryClientInstance).toBeDefined();
  });

  it('should be a QueryClient instance', () => {
    expect(queryClientInstance).toHaveProperty('fetchQuery');
    expect(queryClientInstance).toHaveProperty('prefetchQuery');
    expect(queryClientInstance).toHaveProperty('invalidateQueries');
    expect(queryClientInstance).toHaveProperty('getQueryData');
    expect(queryClientInstance).toHaveProperty('setQueryData');
    expect(queryClientInstance).toHaveProperty('removeQueries');
    expect(queryClientInstance).toHaveProperty('clear');
  });

  it('should have default query options configured', () => {
    // The QueryClient is configured with defaultOptions
    // We can verify this by checking the default options are applied
    expect(queryClientInstance.getDefaultOptions()).toBeDefined();
  });

  it('should have refetchOnWindowFocus set to false', () => {
    const defaultOptions = queryClientInstance.getDefaultOptions();
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('should have retry set to 1', () => {
    const defaultOptions = queryClientInstance.getDefaultOptions();
    expect(defaultOptions.queries?.retry).toBe(1);
  });

  it('should be a singleton', () => {
    // Import again to verify it's the same instance
    const { queryClientInstance: secondInstance } = require('./query-client');
    expect(queryClientInstance).toBe(secondInstance);
  });
});
