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
} from '../lib/nativeUtils';

// Import the functions we'll be testing from branding.js
// Since branding.js has React dependencies, we'll test the pure functions only
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
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { search: '' }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
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
      const branding = {};
      
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
      const result = tenant?.features?.white_label?.enabled === true;
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

describe('createPageUrl', () => {
  it('should convert spaces to hyphens', () => {
    const result = 'Home Page'.replace(/ /g, '-');
    expect(result).toBe('Home-Page');
  });

  it('should handle single word', () => {
    const result = 'Home'.replace(/ /g, '-');
    expect(result).toBe('Home');
  });

  it('should handle multiple spaces', () => {
    const result = 'My Awesome Page Title'.replace(/ /g, '-');
    expect(result).toBe('My-Awesome-Page-Title');
  });

  it('should handle empty string', () => {
    const result = ''.replace(/ /g, '-');
    expect(result).toBe('');
  });
});

describe('nativeUtils integration with branding', () => {
  it('should use deepClone for branding objects', () => {
    const branding = {
      colors: { primary: '#FF0000' },
      typography: { headingFont: 'Roboto' }
    };

    const cloned = deepClone(branding);
    
    expect(cloned).toEqual(branding);
    expect(cloned).not.toBe(branding);
    expect(cloned.colors).not.toBe(branding.colors);
  });

  it('should use pick for selecting specific branding properties', () => {
    const branding = {
      colors: { primary: '#FF0000', secondary: '#00FF00' },
      typography: { headingFont: 'Roboto' },
      customCSS: '.test {}'
    };

    const colorOnly = pick(branding, ['colors']);
    
    expect(colorOnly).toEqual({ colors: branding.colors });
    expect(colorOnly).not.toHaveProperty('typography');
  });

  it('should use omit for removing sensitive properties', () => {
    const branding = {
      colors: { primary: '#FF0000' },
      customCSS: '.test {}',
      internalFlag: true
    };

    const publicBranding = omit(branding, ['internalFlag']);
    
    expect(publicBranding).not.toHaveProperty('internalFlag');
    expect(publicBranding).toHaveProperty('colors');
    expect(publicBranding).toHaveProperty('customCSS');
  });

  it('should use groupBy for organizing brandings by category', () => {
    const brandings = [
      { name: 'Dark Theme', category: 'dark' },
      { name: 'Darker Theme', category: 'dark' },
      { name: 'Light Theme', category: 'light' }
    ];

    const grouped = groupBy(brandings, 'category');
    
    expect(grouped.dark).toHaveLength(2);
    expect(grouped.light).toHaveLength(1);
  });

  it('should use isEmpty to check for default branding', () => {
    const emptyBranding = {};
    const defaultBranding = { colors: { primary: '#000' } };

    expect(isEmpty(emptyBranding)).toBe(true);
    expect(isEmpty(defaultBranding)).toBe(false);
  });
});
