/**
 * Native ES6+ Utility Functions
 * 
 * This module provides native JavaScript alternatives to common lodash functions.
 * Use these instead of importing the entire lodash library (~70KB).
 * 
 * Benefits:
 * - Zero dependencies
 * - Tree-shakeable
 * - Better performance
 * - Native browser support
 */

/**
 * Debounce function - Delays invoking func until after wait milliseconds
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to delay
 * @param {boolean} immediate - Trigger on leading edge
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function - Limits func to once per wait milliseconds
 * @param {Function} func - Function to throttle
 * @param {number} limit - Milliseconds to throttle
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object (alternative to _.cloneDeep)
 * Note: Does not handle circular references
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, deepClone(value)])
  );
}

/**
 * Pick properties from object (alternative to _.pick)
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to pick
 * @returns {Object} New object with picked keys
 */
export function pick(obj, keys) {
  return Object.fromEntries(
    keys.filter(key => key in obj).map(key => [key, obj[key]])
  );
}

/**
 * Omit properties from object (alternative to _.omit)
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to omit
 * @returns {Object} New object without omitted keys
 */
export function omit(obj, keys) {
  const keysSet = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysSet.has(key))
  );
}

/**
 * Group array by key (alternative to _.groupBy)
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key or function to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sort by multiple criteria (alternative to _.orderBy)
 * @param {Array} array - Array to sort
 * @param {string[]} keys - Keys to sort by
 * @param {string[]} orders - 'asc' or 'desc' for each key
 * @returns {Array} Sorted array
 */
export function orderBy(array, keys, orders) {
  return [...array].sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const order = orders[i] || 'asc';
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Check if value is empty (alternative to _.isEmpty)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Get unique values from array (alternative to _.uniq)
 * @param {Array} array - Array to process
 * @returns {Array} Array of unique values
 */
export function uniq(array) {
  return [...new Set(array)];
}

/**
 * Flatten array one level (alternative to _.flatten)
 * @param {Array} array - Array to flatten
 * @returns {Array} Flattened array
 */
export function flatten(array) {
  return array.flat();
}

/**
 * Flatten array deeply (alternative to _.flattenDeep)
 * @param {Array} array - Array to flatten
 * @returns {Array} Deeply flattened array
 */
export function flattenDeep(array) {
  return array.flat(Infinity);
}

/**
 * Chunk array into smaller arrays (alternative to _.chunk)
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
export function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Sample random element from array (alternative to _.sample)
 * @param {Array} array - Array to sample from
 * @returns {*} Random element
 */
export function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Delay execution (alternative to _.delay)
 * @param {Function} func - Function to delay
 * @param {number} wait - Milliseconds to wait
 * @param {...*} args - Arguments to pass to function
 */
export function delay(func, wait, ...args) {
  setTimeout(() => func(...args), wait);
}

// Default export for convenience
export default {
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
  delay,
};
