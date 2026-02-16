import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createLogger } from './logger';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;
  let consoleTimeSpy: ReturnType<typeof vi.spyOn>;
  let consoleTimeEndSpy: ReturnType<typeof vi.spyOn>;
  let consoleTableSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    consoleTimeSpy = vi.spyOn(console, 'time').mockImplementation(() => {});
    consoleTimeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => {});
    consoleTableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('in development mode', () => {
    it('should call console.log when logger.log is invoked', () => {
      logger.log('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('test message');
    });

    it('should call console.log with multiple arguments', () => {
      logger.log('message', 123, { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith('message', 123, { key: 'value' });
    });

    it('should call console.warn when logger.warn is invoked', () => {
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('warning message');
    });

    it('should call console.info when logger.info is invoked', () => {
      logger.info('info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('info message');
    });

    it('should call console.debug when logger.debug is invoked', () => {
      logger.debug('debug message');
      expect(consoleDebugSpy).toHaveBeenCalledWith('debug message');
    });

    it('should call console.error when logger.error is invoked', () => {
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
    });

    it('should call console.group when logger.group is invoked', () => {
      logger.group('group label');
      expect(consoleGroupSpy).toHaveBeenCalledWith('group label');
    });

    it('should call console.groupEnd when logger.groupEnd is invoked', () => {
      logger.groupEnd();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('should call console.time when logger.time is invoked', () => {
      logger.time('timer label');
      expect(consoleTimeSpy).toHaveBeenCalledWith('timer label');
    });

    it('should call console.timeEnd when logger.timeEnd is invoked', () => {
      logger.timeEnd('timer label');
      expect(consoleTimeEndSpy).toHaveBeenCalledWith('timer label');
    });

    it('should call console.table when logger.table is invoked', () => {
      const data = { name: 'test', value: 123 };
      logger.table(data);
      expect(consoleTableSpy).toHaveBeenCalledWith(data);
    });

    it('should handle null and undefined values', () => {
      logger.log(null, undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith(null, undefined);
    });

    it('should handle object and array values', () => {
      const obj = { key: 'value' };
      const arr = [1, 2, 3];
      logger.log(obj, arr);
      expect(consoleLogSpy).toHaveBeenCalledWith(obj, arr);
    });
  });

  describe('createLogger', () => {
    it('should create a namespaced logger', () => {
      const namespacedLogger = createLogger('TestModule');
      expect(namespacedLogger).toHaveProperty('log');
      expect(namespacedLogger).toHaveProperty('warn');
      expect(namespacedLogger).toHaveProperty('info');
      expect(namespacedLogger).toHaveProperty('debug');
      expect(namespacedLogger).toHaveProperty('error');
    });

    it('should prefix log messages with namespace', () => {
      const namespacedLogger = createLogger('TestModule');
      namespacedLogger.log('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[TestModule]', 'test message');
    });

    it('should prefix warn messages with namespace', () => {
      const namespacedLogger = createLogger('TestModule');
      namespacedLogger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TestModule]', 'warning message');
    });

    it('should prefix info messages with namespace', () => {
      const namespacedLogger = createLogger('TestModule');
      namespacedLogger.info('info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[TestModule]', 'info message');
    });

    it('should prefix debug messages with namespace', () => {
      const namespacedLogger = createLogger('TestModule');
      namespacedLogger.debug('debug message');
      expect(consoleDebugSpy).toHaveBeenCalledWith('[TestModule]', 'debug message');
    });

    it('should prefix error messages with namespace', () => {
      const namespacedLogger = createLogger('TestModule');
      namespacedLogger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TestModule]', 'error message');
    });

    it('should handle multiple arguments with namespace prefix', () => {
      const namespacedLogger = createLogger('TestModule');
      namespacedLogger.log('message', 123, { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith('[TestModule]', 'message', 123, { key: 'value' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      logger.log('');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    it('should handle special characters', () => {
      logger.log('special chars: !@#$%^&*()');
      expect(consoleLogSpy).toHaveBeenCalledWith('special chars: !@#$%^&*()');
    });

    it('should handle Error objects', () => {
      const error = new Error('test error');
      logger.error(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should handle nested objects', () => {
      const nested = { level1: { level2: { level3: 'deep' } } };
      logger.log(nested);
      expect(consoleLogSpy).toHaveBeenCalledWith(nested);
    });

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;
      logger.log(obj);
      expect(consoleLogSpy).toHaveBeenCalledWith(obj);
    });
  });
});
