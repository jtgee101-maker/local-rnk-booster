/**
 * White-Label Configuration System
 * Handles custom domain, branding, and tenant-specific settings
 */

export class WhiteLabelConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment or tenant detection
   */
  loadConfig() {
    // Detect current domain
    const hostname = window.location.hostname;
    
    // Check if custom domain or default
    const isCustomDomain = !hostname.includes('base44.app') && 
                          !hostname.includes('localhost');

    if (isCustomDomain) {
      return this.loadTenantConfig(hostname);
    }

    // Default configuration
    return this.getDefaultConfig();
  }

  /**
   * Load tenant-specific configuration from API
   */
  async loadTenantConfig(domain) {
    try {
      // Fetch tenant config from backend
      const response = await fetch(`/api/whitelabel/config?domain=${domain}`);
      
      if (!response.ok) {
        console.warn(`No config found for domain: ${domain}`);
        return this.getDefaultConfig();
      }

      const config = await response.json();
      return this.mergeWithDefaults(config);
    } catch (error) {
      console.error('Error loading tenant config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Default platform configuration
   */
  getDefaultConfig() {
    return {
      branding: {
        name: 'GMB Rank Booster',  // Updated from live site
        logo: '/assets/logo.svg',
        favicon: '/favicon.ico',
        colors: {
          primary: '#3b82f6',      // blue-500
          secondary: '#8b5cf6',    // violet-500
          accent: '#10b981',       // emerald-500
          background: '#ffffff',
          text: '#1f2937',         // gray-800
          muted: '#6b7280',        // gray-500
        },
        fonts: {
          heading: 'Inter, sans-serif',
          body: 'Inter, sans-serif',
        }
      },
      domain: {
        primary: window.location.hostname,
        isCustom: false,
      },
      features: {
        referrals: true,
        abTesting: true,
        analytics: true,
        multiPayment: false,  // Locked to Stripe by default
      },
      payment: {
        processor: 'stripe',
        testMode: import.meta.env.MODE === 'development',
      },
      contact: {
        email: 'support@localrankbooster.com',
        phone: '',
        address: '',
      },
      seo: {
        title: 'Local Rank Booster',
        description: 'Boost your local business rankings',
        keywords: 'local seo, google my business, local ranking',
      }
    };
  }

  /**
   * Merge tenant config with defaults
   */
  mergeWithDefaults(tenantConfig) {
    const defaults = this.getDefaultConfig();
    
    return {
      ...defaults,
      ...tenantConfig,
      branding: {
        ...defaults.branding,
        ...tenantConfig.branding,
        colors: {
          ...defaults.branding.colors,
          ...tenantConfig.branding?.colors,
        },
        fonts: {
          ...defaults.branding.fonts,
          ...tenantConfig.branding?.fonts,
        }
      },
      features: {
        ...defaults.features,
        ...tenantConfig.features,
      },
      payment: {
        ...defaults.payment,
        ...tenantConfig.payment,
      },
    };
  }

  /**
   * Apply branding to document (CSS variables)
   */
  applyBranding() {
    const { colors, fonts } = this.config.branding;

    // Apply CSS variables
    const root = document.documentElement;
    
    // Colors
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Fonts
    root.style.setProperty('--font-heading', fonts.heading);
    root.style.setProperty('--font-body', fonts.body);

    // Update page title and favicon
    document.title = this.config.seo.title;
    
    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = this.config.branding.favicon;
    }
  }

  /**
   * Get current configuration
   */
  get() {
    return this.config;
  }

  /**
   * Get specific config value
   */
  getValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Update configuration (admin only)
   */
  async update(updates) {
    try {
      const response = await fetch('/api/whitelabel/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      const newConfig = await response.json();
      this.config = this.mergeWithDefaults(newConfig);
      this.applyBranding();

      return this.config;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }
}

// Singleton instance
let instance = null;

export function getWhiteLabelConfig() {
  if (!instance) {
    instance = new WhiteLabelConfig();
  }
  return instance;
}

export default WhiteLabelConfig;
