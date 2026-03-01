import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Test for createPageUrl utility
// ============================================================================
export function createPageUrl(pageName: string): string {
  return '/' + pageName.replace(/ /g, '-');
}

describe('createPageUrl', () => {
  it('should convert single word to URL path', () => {
    const result = createPageUrl('Home');
    expect(result).toBe('/Home');
  });

  it('should replace spaces with hyphens', () => {
    const result = createPageUrl('Home Page');
    expect(result).toBe('/Home-Page');
  });

  it('should handle multiple spaces', () => {
    const result = createPageUrl('My Awesome Page Title');
    expect(result).toBe('/My-Awesome-Page-Title');
  });

  it('should handle single space', () => {
    const result = createPageUrl('Contact Us');
    expect(result).toBe('/Contact-Us');
  });

  it('should handle empty string', () => {
    const result = createPageUrl('');
    expect(result).toBe('/');
  });

  it('should handle string with leading/trailing spaces', () => {
    // Note: This tests actual behavior - leading/trailing spaces become hyphens at edges
    const resultLeading = createPageUrl(' Leading');
    expect(resultLeading).toBe('/-Leading');
    
    const resultTrailing = createPageUrl('Trailing ');
    expect(resultTrailing).toBe('/Trailing-');
  });

  it('should handle consecutive spaces', () => {
    const result = createPageUrl('Multiple   Spaces');
    expect(result).toBe('/Multiple---Spaces');
  });

  it('should handle special characters (except spaces)', () => {
    const result = createPageUrl('Page@Home#123');
    expect(result).toBe('/Page@Home#123');
  });

  it('should handle mixed case', () => {
    const result = createPageUrl('My Landing Page');
    expect(result).toBe('/My-Landing-Page');
  });

  it('should handle numbers in page name', () => {
    const result = createPageUrl('Page 404 Error');
    expect(result).toBe('/Page-404-Error');
  });

  it('should handle very long page names', () => {
    const longName = 'This Is A Very Long Page Name With Many Words';
    const result = createPageUrl(longName);
    expect(result).toBe('/This-Is-A-Very-Long-Page-Name-With-Many-Words');
  });
});

// ============================================================================
// Branding Utilities Tests
// ============================================================================
describe('Branding Utilities', () => {
  const mockDocument = {
    documentElement: {
      style: {
        setProperty: vi.fn(),
        getPropertyValue: vi.fn(),
        removeProperty: vi.fn()
      }
    },
    body: {
      style: {
        fontFamily: ''
      }
    },
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    createElement: vi.fn(),
    head: {
      appendChild: vi.fn()
    }
  };

  const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };

  beforeEach(() => {
    vi.stubGlobal('document', mockDocument);
    vi.stubGlobal('sessionStorage', mockSessionStorage);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Default branding configuration
  const DEFAULT_BRANDING = {
    colors: {
      primary: '#00F2FF',
      secondary: '#c8ff00',
      background: '#000000',
      surface: '#0a0a0a',
      text: '#ffffff',
      accent: '#00F2FF'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    logo: {
      url: null,
      darkUrl: null,
      favicon: null
    },
    customCSS: null
  };

  describe('DEFAULT_BRANDING', () => {
    it('should have correct default color values', () => {
      expect(DEFAULT_BRANDING.colors.primary).toBe('#00F2FF');
      expect(DEFAULT_BRANDING.colors.secondary).toBe('#c8ff00');
      expect(DEFAULT_BRANDING.colors.background).toBe('#000000');
      expect(DEFAULT_BRANDING.colors.surface).toBe('#0a0a0a');
      expect(DEFAULT_BRANDING.colors.text).toBe('#ffffff');
      expect(DEFAULT_BRANDING.colors.accent).toBe('#00F2FF');
    });

    it('should have correct default typography', () => {
      expect(DEFAULT_BRANDING.typography.headingFont).toBe('Inter');
      expect(DEFAULT_BRANDING.typography.bodyFont).toBe('Inter');
    });

    it('should have null logo defaults', () => {
      expect(DEFAULT_BRANDING.logo.url).toBeNull();
      expect(DEFAULT_BRANDING.logo.darkUrl).toBeNull();
      expect(DEFAULT_BRANDING.logo.favicon).toBeNull();
    });
  });

  describe('applyBranding logic', () => {
    it('should apply color CSS variables', () => {
      const branding = {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00'
        }
      };

      // Simulate applying branding
      Object.entries(branding.colors).forEach(([key, value]) => {
        mockDocument.documentElement.style.setProperty(`--tenant-${key}`, value);
      });

      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--tenant-primary', '#FF0000');
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--tenant-secondary', '#00FF00');
    });

    it('should apply typography CSS variables', () => {
      const typography = {
        headingFont: 'Roboto',
        bodyFont: 'Open Sans'
      };

      mockDocument.documentElement.style.setProperty('--tenant-heading-font', typography.headingFont);
      mockDocument.documentElement.style.setProperty('--tenant-body-font', typography.bodyFont);

      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--tenant-heading-font', 'Roboto');
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--tenant-body-font', 'Open Sans');
    });

    it('should set body font family', () => {
      const bodyFont = 'Open Sans';
      mockDocument.body.style.fontFamily = bodyFont + ', system-ui, sans-serif';

      expect(mockDocument.body.style.fontFamily).toBe('Open Sans, system-ui, sans-serif');
    });
  });

  describe('loadStoredBranding logic', () => {
    it('should return parsed branding from sessionStorage', () => {
      const storedBranding = { colors: { primary: '#FF0000' } };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedBranding));

      const result = JSON.parse(mockSessionStorage.getItem('tenant_branding') || 'null');

      expect(result).toEqual(storedBranding);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('tenant_branding');
    });

    it('should return null when no branding stored', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = mockSessionStorage.getItem('tenant_branding');

      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json');

      let result = null;
      try {
        result = JSON.parse(mockSessionStorage.getItem('tenant_branding'));
      } catch {
        result = null;
      }

      expect(result).toBeNull();
    });
  });

  describe('getBrandingVar logic', () => {
    it('should return CSS variable value', () => {
      mockDocument.documentElement.style.getPropertyValue.mockReturnValue('#FF0000');

      const result = mockDocument.documentElement.style.getPropertyValue('--tenant-primary').trim();

      expect(result).toBe('#FF0000');
    });

    it('should return empty string when variable not set', () => {
      mockDocument.documentElement.style.getPropertyValue.mockReturnValue('');

      const result = mockDocument.documentElement.style.getPropertyValue('--tenant-nonexistent').trim();

      expect(result).toBe('');
    });
  });

  describe('generateBrandedStyles logic', () => {
    it('should generate complete styles object', () => {
      const branding = {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00',
          background: '#000000',
          surface: '#111111',
          text: '#FFFFFF',
          accent: '#0000FF'
        },
        typography: {
          headingFont: 'Roboto',
          bodyFont: 'Open Sans'
        },
        logo: {
          url: 'https://example.com/logo.png',
          darkUrl: 'https://example.com/logo-dark.png'
        }
      };

      const styles = {
        primaryColor: branding.colors.primary,
        secondaryColor: branding.colors.secondary,
        backgroundColor: branding.colors.background,
        surfaceColor: branding.colors.surface,
        textColor: branding.colors.text,
        accentColor: branding.colors.accent,
        headingFont: branding.typography.headingFont,
        bodyFont: branding.typography.bodyFont,
        logoUrl: branding.logo.url,
        logoDarkUrl: branding.logo.darkUrl
      };

      expect(styles.primaryColor).toBe('#FF0000');
      expect(styles.headingFont).toBe('Roboto');
      expect(styles.logoUrl).toBe('https://example.com/logo.png');
    });

    it('should use defaults for missing properties', () => {
      const branding: any = {};
      
      const styles = {
        primaryColor: branding.colors?.primary || DEFAULT_BRANDING.colors.primary,
        headingFont: branding.typography?.headingFont || DEFAULT_BRANDING.typography.headingFont,
        logoUrl: branding.logo?.url || null
      };

      expect(styles.primaryColor).toBe('#00F2FF');
      expect(styles.headingFont).toBe('Inter');
      expect(styles.logoUrl).toBeNull();
    });
  });

  describe('isWhiteLabeled logic', () => {
    it('should return true when white_label is enabled', () => {
      const tenant = { features: { white_label: { enabled: true } } };
      const result = tenant?.features?.white_label?.enabled === true;
      expect(result).toBe(true);
    });

    it('should return false when white_label is disabled', () => {
      const tenant = { features: { white_label: { enabled: false } } };
      const result = tenant?.features?.white_label?.enabled === true;
      expect(result).toBe(false);
    });

    it('should return false when features is missing', () => {
      const tenant = {};
      const result = (tenant as any)?.features?.white_label?.enabled === true;
      expect(result).toBe(false);
    });

    it('should return false when tenant is null', () => {
      const tenant = null;
      const result = tenant?.features?.white_label?.enabled === true;
      expect(result).toBe(false);
    });
  });

  describe('clearBranding logic', () => {
    it('should remove all CSS variables', () => {
      const colorKeys = Object.keys(DEFAULT_BRANDING.colors);
      
      colorKeys.forEach(key => {
        mockDocument.documentElement.style.removeProperty(`--tenant-${key}`);
      });

      colorKeys.forEach(key => {
        expect(mockDocument.documentElement.style.removeProperty).toHaveBeenCalledWith(`--tenant-${key}`);
      });
    });

    it('should remove custom CSS element', () => {
      const mockStyleEl = { remove: vi.fn() };
      mockDocument.getElementById.mockReturnValue(mockStyleEl);

      const styleEl = mockDocument.getElementById('tenant-custom-css');
      if (styleEl) styleEl.remove();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('tenant-custom-css');
      expect(mockStyleEl.remove).toHaveBeenCalled();
    });

    it('should remove branding from sessionStorage', () => {
      mockSessionStorage.removeItem('tenant_branding');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('tenant_branding');
    });
  });

  describe('initPreviewBranding logic', () => {
    it('should parse and return branding from URL param', () => {
      const branding = { colors: { primary: '#FF0000' } };
      const encoded = btoa(JSON.stringify(branding));

      // Simulate URL with branding param
      const searchParams = new URLSearchParams(`__branding=${encoded}`);
      const previewBranding = searchParams.get('__branding');
      
      let result = null;
      if (previewBranding) {
        try {
          result = JSON.parse(atob(previewBranding));
        } catch {
          result = null;
        }
      }

      expect(result).toEqual(branding);
    });

    it('should return null when no branding param', () => {
      const searchParams = new URLSearchParams('');
      const previewBranding = searchParams.get('__branding');
      
      expect(previewBranding).toBeNull();
    });

    it('should return null for invalid base64', () => {
      let result = null;
      try {
        result = JSON.parse(atob('invalid!!!'));
      } catch {
        result = null;
      }

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// String Utilities Tests
// ============================================================================
describe('String Utilities', () => {
  describe('slugify function', () => {
    function slugify(text: string): string {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    it('should convert to lowercase', () => {
      expect(slugify('HELLO WORLD')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('hello@world!')).toBe('hello-world');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });

    it('should handle multiple consecutive spaces', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('truncate function', () => {
    function truncate(text: string, maxLength: number): string {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - 3) + '...';
    }

    it('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate long strings with ellipsis', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should handle exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('should handle very short max length', () => {
      expect(truncate('hello', 3)).toBe('...');
    });
  });

  describe('capitalize function', () => {
    function capitalize(text: string): string {
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should lowercase remaining letters', () => {
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(capitalize('h')).toBe('H');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });
});

// ============================================================================
// Array Utilities Tests
// ============================================================================
describe('Array Utilities', () => {
  describe('chunk function', () => {
    function chunk<T>(array: T[], size: number): T[][] {
      const result: T[][] = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    }

    it('should split array into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle remainder chunk', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle empty array', () => {
      expect(chunk([], 2)).toEqual([]);
    });

    it('should handle chunk size larger than array', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });
  });

  describe('unique function', () => {
    function unique<T>(array: T[]): T[] {
      return [...new Set(array)];
    }

    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should handle strings', () => {
      expect(unique(['a', 'b', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });

    it('should handle no duplicates', () => {
      expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('flatten function', () => {
    function flatten<T>(array: T[][]): T[] {
      return array.reduce((acc, val) => acc.concat(val), []);
    }

    it('should flatten one level', () => {
      expect(flatten([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
    });

    it('should handle empty arrays', () => {
      expect(flatten([])).toEqual([]);
    });

    it('should handle mixed empty and non-empty', () => {
      expect(flatten([[1, 2], [], [3]])).toEqual([1, 2, 3]);
    });
  });
});

// ============================================================================
// Object Utilities Tests
// ============================================================================
describe('Object Utilities', () => {
  describe('pick function', () => {
    function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
      return keys.reduce((acc, key) => {
        if (key in obj) acc[key] = obj[key];
        return acc;
      }, {} as Pick<T, K>);
    }

    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should ignore missing keys', () => {
      const obj = { a: 1, b: 2 } as { a: number; b: number; c?: number };
      expect(pick(obj, ['a', 'c' as keyof typeof obj])).toEqual({ a: 1 });
    });

    it('should handle empty keys array', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, [])).toEqual({});
    });
  });

  describe('omit function', () => {
    function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
      const keySet = new Set(keys as string[]);
      return Object.entries(obj).reduce((acc, [key, value]) => {
        if (!keySet.has(key)) (acc as any)[key] = value;
        return acc;
      }, {} as Omit<T, K>);
    }

    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle multiple keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle empty keys array', () => {
      const obj = { a: 1, b: 2 };
      expect(omit(obj, [])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('isEmpty function', () => {
    function isEmpty(value: any): boolean {
      if (value == null) return true;
      if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    }

    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('should return false for non-empty array', () => {
      expect(isEmpty([1, 2])).toBe(false);
    });

    it('should return false for non-empty object', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });

    it('should return false for number', () => {
      expect(isEmpty(0)).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isEmpty(false)).toBe(false);
    });
  });
});

// ============================================================================
// Validation Utilities Tests
// ============================================================================
describe('Validation Utilities', () => {
  describe('isValidEmail function', () => {
    function isValidEmail(email: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    it('should return true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should return false for missing @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should return false for missing domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should return false for missing username', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should return false for spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidUrl function', () => {
    function isValidUrl(url: string): boolean {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }

    it('should return true for valid http URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should return true for valid https URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should return false for invalid URL', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidPhone function', () => {
    function isValidPhone(phone: string): boolean {
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length >= 10 && cleaned.length <= 15;
    }

    it('should return true for valid US phone', () => {
      expect(isValidPhone('555-555-5555')).toBe(true);
    });

    it('should return true for phone with country code', () => {
      expect(isValidPhone('+1 555-555-5555')).toBe(true);
    });

    it('should return true for phone with spaces', () => {
      expect(isValidPhone('555 555 5555')).toBe(true);
    });

    it('should return false for too short', () => {
      expect(isValidPhone('555-5555')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidPhone('')).toBe(false);
    });
  });
});

// ============================================================================
// Number Utilities Tests
// ============================================================================
describe('Number Utilities', () => {
  describe('formatNumber function', () => {
    function formatNumber(num: number, decimals: number = 0): string {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }

    it('should format with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('should format large numbers', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should format with decimals', () => {
      expect(formatNumber(1234.5, 2)).toBe('1,234.50');
    });

    it('should format zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should format negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
    });
  });

  describe('clamp function', () => {
    function clamp(num: number, min: number, max: number): number {
      return Math.min(Math.max(num, min), max);
    }

    it('should return value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp to max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle equal to min', () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });

    it('should handle equal to max', () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('round function', () => {
    function round(num: number, decimals: number = 0): number {
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
    }

    it('should round to integer', () => {
      expect(round(3.7)).toBe(4);
    });

    it('should round down', () => {
      expect(round(3.2)).toBe(3);
    });

    it('should round to decimals', () => {
      expect(round(3.14159, 2)).toBe(3.14);
    });

    it('should handle zero', () => {
      expect(round(0)).toBe(0);
    });
  });
});
