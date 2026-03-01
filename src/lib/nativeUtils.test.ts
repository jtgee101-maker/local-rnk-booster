import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  deepClone,
  pick,
  omit,
  groupBy,
  orderBy,
  isEmpty,
  uniq,
  flatten,
  flattenDeep,
  chunk,
  sample,
  delay
} from './nativeUtils';

describe('nativeUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // Debounce Tests
  // ============================================================================
  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn();
      vi.advanceTimersByTime(200);
      debouncedFn();
      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call immediately when immediate is true', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300, true);

      debouncedFn();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the function', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn('arg1', 'arg2', 123);
      vi.advanceTimersByTime(300);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should handle multiple arguments correctly', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn(1);
      debouncedFn(2);
      debouncedFn(3);
      vi.advanceTimersByTime(100);

      // Should only call with last arguments
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
    });
  });

  // ============================================================================
  // Throttle Tests
  // ============================================================================
  describe('throttle', () => {
    it('should limit function execution rate', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 300);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      throttledFn();
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(300);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to the function', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 300);

      throttledFn('test', 42);
      expect(fn).toHaveBeenCalledWith('test', 42);
    });

    it('should ignore calls during throttle period', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      // Call multiple times rapidly
      for (let i = 0; i < 10; i++) {
        throttledFn(i);
      }

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(0);

      vi.advanceTimersByTime(100);

      // After throttle period, can call again
      throttledFn('next');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('next');
    });
  });

  // ============================================================================
  // Deep Clone Tests
  // ============================================================================
  describe('deepClone', () => {
    it('should clone a simple object', () => {
      const obj = { a: 1, b: 2 };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    it('should clone nested objects', () => {
      const obj = { a: { b: { c: 3 } } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned.a).not.toBe(obj.a);
      expect(cloned.a.b).not.toBe(obj.a.b);
    });

    it('should clone arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should clone Date objects', () => {
      const date = new Date('2024-01-01');
      const cloned = deepClone(date);

      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });

    it('should handle null values', () => {
      expect(deepClone(null)).toBe(null);
    });

    it('should handle primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
    });

    it('should handle empty objects and arrays', () => {
      expect(deepClone({})).toEqual({});
      expect(deepClone([])).toEqual([]);
    });

    it('should handle complex nested structures', () => {
      const obj = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'user'] },
          { id: 2, name: 'Bob', tags: ['user'] }
        ],
        settings: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false
          }
        }
      };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned.users).not.toBe(obj.users);
      expect(cloned.users[0]).not.toBe(obj.users[0]);
      expect(cloned.settings.notifications).not.toBe(obj.settings.notifications);
    });
  });

  // ============================================================================
  // Pick Tests
  // ============================================================================
  describe('pick', () => {
    it('should pick specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = pick(obj, ['a', 'c']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should return empty object for no matching keys', () => {
      const obj = { a: 1, b: 2 };
      const result = pick(obj, ['x', 'y']);

      expect(result).toEqual({});
    });

    it('should handle partial key matches', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, ['a', 'x']);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle empty key array', () => {
      const obj = { a: 1, b: 2 };
      const result = pick(obj, []);

      expect(result).toEqual({});
    });

    it('should handle empty object', () => {
      const result = pick({}, ['a']);
      expect(result).toEqual({});
    });
  });

  // ============================================================================
  // Omit Tests
  // ============================================================================
  describe('omit', () => {
    it('should omit specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = omit(obj, ['b', 'd']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should return full object for no matching keys', () => {
      const obj = { a: 1, b: 2 };
      const result = omit(obj, ['x', 'y']);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should handle partial key matches', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, ['b', 'x']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should handle empty key array', () => {
      const obj = { a: 1, b: 2 };
      const result = omit(obj, []);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should handle empty object', () => {
      const result = omit({}, ['a']);
      expect(result).toEqual({});
    });

    it('should not mutate original object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, ['b']);

      expect(obj).toEqual({ a: 1, b: 2, c: 3 });
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  // ============================================================================
  // Group By Tests
  // ============================================================================
  describe('groupBy', () => {
    it('should group array by string key', () => {
      const arr = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 }
      ];
      const result = groupBy(arr, 'type');

      expect(result).toEqual({
        a: [{ type: 'a', value: 1 }, { type: 'a', value: 3 }],
        b: [{ type: 'b', value: 2 }]
      });
    });

    it('should group array by function', () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const result = groupBy(arr, (n) => n % 2 === 0 ? 'even' : 'odd');

      expect(result).toEqual({
        odd: [1, 3, 5],
        even: [2, 4, 6]
      });
    });

    it('should handle empty array', () => {
      const result = groupBy([], 'key');
      expect(result).toEqual({});
    });

    it('should handle single item array', () => {
      const result = groupBy([{ type: 'a' }], 'type');
      expect(result).toEqual({ a: [{ type: 'a' }] });
    });

    it('should handle null/undefined values in key', () => {
      const arr = [
        { type: 'a' },
        { type: null },
        { type: 'a' },
        { type: undefined }
      ];
      const result = groupBy(arr, 'type');

      expect(result.a).toHaveLength(2);
      expect(result.null).toHaveLength(1);
      expect(result.undefined).toHaveLength(1);
    });
  });

  // ============================================================================
  // Order By Tests
  // ============================================================================
  describe('orderBy', () => {
    it('should sort by single key ascending', () => {
      const arr = [{ age: 30 }, { age: 20 }, { age: 40 }];
      const result = orderBy(arr, ['age'], ['asc']);

      expect(result).toEqual([{ age: 20 }, { age: 30 }, { age: 40 }]);
    });

    it('should sort by single key descending', () => {
      const arr = [{ age: 30 }, { age: 20 }, { age: 40 }];
      const result = orderBy(arr, ['age'], ['desc']);

      expect(result).toEqual([{ age: 40 }, { age: 30 }, { age: 20 }]);
    });

    it('should sort by multiple keys', () => {
      const arr = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 25 }
      ];
      const result = orderBy(arr, ['name', 'age'], ['asc', 'asc']);

      expect(result).toEqual([
        { name: 'Alice', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
    });

    it('should not mutate original array', () => {
      const arr = [{ age: 30 }, { age: 20 }];
      const result = orderBy(arr, ['age'], ['asc']);

      expect(arr).toEqual([{ age: 30 }, { age: 20 }]);
      expect(result).toEqual([{ age: 20 }, { age: 30 }]);
    });

    it('should handle empty array', () => {
      const result = orderBy([], ['key'], ['asc']);
      expect(result).toEqual([]);
    });

    it('should handle string sorting', () => {
      const arr = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      const result = orderBy(arr, ['name'], ['asc']);

      expect(result.map(i => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });
  });

  // ============================================================================
  // Is Empty Tests
  // ============================================================================
  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should return false for non-empty array', () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
    });

    it('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty object', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });

    it('should return false for number zero', () => {
      expect(isEmpty(0)).toBe(false);
    });

    it('should return false for boolean false', () => {
      expect(isEmpty(false)).toBe(false);
    });
  });

  // ============================================================================
  // Uniq Tests
  // ============================================================================
  describe('uniq', () => {
    it('should remove duplicate primitives', () => {
      const arr = [1, 2, 2, 3, 3, 3, 4];
      const result = uniq(arr);

      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should handle string array', () => {
      const arr = ['a', 'b', 'b', 'c'];
      const result = uniq(arr);

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      const result = uniq([]);
      expect(result).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const arr = [1, 2, 3];
      const result = uniq(arr);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 2, 3];
      uniq(arr);

      expect(arr).toEqual([1, 2, 2, 3]);
    });
  });

  // ============================================================================
  // Flatten Tests
  // ============================================================================
  describe('flatten', () => {
    it('should flatten one level deep', () => {
      const arr = [1, [2, 3], [4, [5, 6]]];
      const result = flatten(arr);

      expect(result).toEqual([1, 2, 3, 4, [5, 6]]);
    });

    it('should handle empty arrays', () => {
      const result = flatten([]);
      expect(result).toEqual([]);
    });

    it('should handle already flat array', () => {
      const arr = [1, 2, 3];
      const result = flatten(arr);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle array with empty nested arrays', () => {
      const arr = [1, [], [2, []], 3];
      const result = flatten(arr);

      expect(result).toEqual([1, 2, [], 3]);
    });
  });

  // ============================================================================
  // Flatten Deep Tests
  // ============================================================================
  describe('flattenDeep', () => {
    it('should flatten deeply nested arrays', () => {
      const arr = [1, [2, [3, [4, [5]]]]];
      const result = flattenDeep(arr);

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty arrays', () => {
      const result = flattenDeep([]);
      expect(result).toEqual([]);
    });

    it('should handle already flat array', () => {
      const arr = [1, 2, 3];
      const result = flattenDeep(arr);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle mixed nesting levels', () => {
      const arr = [1, [2], [[3]], [[[4]]]];
      const result = flattenDeep(arr);

      expect(result).toEqual([1, 2, 3, 4]);
    });
  });

  // ============================================================================
  // Chunk Tests
  // ============================================================================
  describe('chunk', () => {
    it('should split array into chunks', () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const result = chunk(arr, 2);

      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle remainder chunk', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = chunk(arr, 2);

      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle chunk size larger than array', () => {
      const arr = [1, 2, 3];
      const result = chunk(arr, 5);

      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle empty array', () => {
      const result = chunk([], 2);
      expect(result).toEqual([]);
    });

    it('should handle chunk size of 1', () => {
      const arr = [1, 2, 3];
      const result = chunk(arr, 1);

      expect(result).toEqual([[1], [2], [3]]);
    });
  });

  // ============================================================================
  // Sample Tests
  // ============================================================================
  describe('sample', () => {
    it('should return an element from array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = sample(arr);

      expect(arr).toContain(result);
    });

    it('should return single element for single item array', () => {
      const arr = ['only'];
      const result = sample(arr);

      expect(result).toBe('only');
    });

    it('should handle different types', () => {
      const arr = ['a', 1, true, null];
      const result = sample(arr);

      expect(arr).toContain(result);
    });

    // Note: Can't test randomness reliably, but can verify distribution
    it('should return different values over multiple calls', () => {
      const arr = [1, 2, 3];
      const results = new Set();

      for (let i = 0; i < 20; i++) {
        results.add(sample(arr));
      }

      // Should have seen at least 2 different values in 20 tries
      expect(results.size).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // Delay Tests
  // ============================================================================
  describe('delay', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      delay(fn, 100);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to function', () => {
      const fn = vi.fn();
      delay(fn, 100, 'arg1', 'arg2', 123);

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should handle multiple delayed functions', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      delay(fn1, 100);
      delay(fn2, 200);

      vi.advanceTimersByTime(100);
      expect(fn1).toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn2).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Edge Cases and Integration Tests
  // ============================================================================
  describe('edge cases and integration', () => {
    it('should handle pick and omit together', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = pick(obj, ['a', 'b', 'c']);
      const omitted = omit(picked, ['b']);

      expect(omitted).toEqual({ a: 1, c: 3 });
    });

    it('should handle complex data transformation pipeline', () => {
      const data = [
        { category: 'a', value: 10 },
        { category: 'b', value: 5 },
        { category: 'a', value: 20 },
        { category: 'b', value: 15 }
      ];

      // Group, sort, and transform
      const grouped = groupBy(data, 'category');
      const sortedA = orderBy(grouped.a, ['value'], ['asc']);
      const values = sortedA.map(item => item.value);
      const unique = uniq([...values, 10, 20]); // add duplicates

      expect(unique).toEqual([10, 20]);
    });

    it('should handle debounced and throttled functions together', () => {
      const debouncedFn = vi.fn();
      const throttledFn = vi.fn();

      const debounced = debounce(debouncedFn, 100);
      const throttled = throttle(throttledFn, 100);

      // Call both rapidly
      for (let i = 0; i < 5; i++) {
        debounced();
        throttled();
      }

      // Throttled should have fired once
      expect(throttledFn).toHaveBeenCalledTimes(1);

      // Debounced should not have fired yet
      expect(debouncedFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      // Now debounced should have fired once
      expect(debouncedFn).toHaveBeenCalledTimes(1);
    });
  });
});
