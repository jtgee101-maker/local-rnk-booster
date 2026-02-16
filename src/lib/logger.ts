/**
 * Production-safe logger utility
 * 
 * Automatically strips console statements in production builds
 * while maintaining full debugging capability in development.
 */

const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development';

/**
 * Logger utility that only outputs in development mode
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
  
  // Always allow errors in production
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  
  // Group methods
  group: (label: string) => {
    if (isDev) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },
  
  // Performance timing
  time: (label: string) => {
    if (isDev) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },
  
  // Table output
  table: (data: unknown) => {
    if (isDev) {
      console.table(data);
    }
  }
};

/**
 * Create a namespaced logger for a specific module
 */
export const createLogger = (namespace: string) => ({
  log: (...args: unknown[]) => logger.log(`[${namespace}]`, ...args),
  warn: (...args: unknown[]) => logger.warn(`[${namespace}]`, ...args),
  info: (...args: unknown[]) => logger.info(`[${namespace}]`, ...args),
  debug: (...args: unknown[]) => logger.debug(`[${namespace}]`, ...args),
  error: (...args: unknown[]) => logger.error(`[${namespace}]`, ...args),
});

export default logger;
