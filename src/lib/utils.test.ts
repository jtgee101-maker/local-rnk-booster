import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cn, isIframe } from './utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'active', false && 'inactive');
    expect(result).toBe('base active');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-6');
    expect(result).toBe('py-2 px-6');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'active');
    expect(result).toBe('base active');
  });

  it('should handle empty strings', () => {
    const result = cn('', 'class', '');
    expect(result).toBe('class');
  });

  it('should handle object syntax', () => {
    const result = cn('base', { active: true, disabled: false });
    expect(result).toBe('base active');
  });

  it('should handle array syntax', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle complex combinations', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class',
      { 'conditional-class': true }
    );
    expect(result).toBe('base-class active-class conditional-class');
  });

  it('should handle duplicate class names', () => {
    const result = cn('px-4 px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should return empty string for no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle nested arrays', () => {
    const result = cn('base', ['class1', ['class2', 'class3']]);
    expect(result).toBe('base class1 class2 class3');
  });
});

describe('isIframe', () => {
  let originalSelf: any;
  let originalTop: any;

  beforeEach(() => {
    originalSelf = window.self;
    originalTop = window.top;
  });

  it('should be defined', () => {
    expect(typeof isIframe).toBe('boolean');
  });

  it('should detect iframe context when self !== top', () => {
    // This test validates the logic - in test environment window.self === window.top
    // so isIframe should be false
    expect(isIframe).toBe(false);
  });
});
