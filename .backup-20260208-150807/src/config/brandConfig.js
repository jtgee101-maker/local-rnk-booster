// White-Label Configuration System
// This will be the foundation for customer-specific branding

export const defaultBrandConfig = {
  // Identity
  name: "LocalRnk",
  tagline: "Dominate Local Search",
  
  // Assets
  logo: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg",
    favicon: "/favicon.ico"
  },
  
  // Colors - CSS Custom Properties
  colors: {
    primary: "#3B82F6",
    primaryHover: "#2563EB",
    secondary: "#10B981",
    accent: "#F59E0B",
    background: "#FFFFFF",
    surface: "#F9FAFB",
    text: "#111827",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B"
  },
  
  // Typography
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    mono: "JetBrains Mono, monospace"
  },
  
  // Features - toggle system
  features: {
    // Core
    analytics: true,
    leadManagement: true,
    emailAutomation: true,
    
    // Optional
    whiteLabel: false,
    customDomain: false,
    apiAccess: false,
    affiliateProgram: false,
    advancedReporting: false,
    
    // UI
    darkMode: true,
    animations: true,
    tooltips: true
  },
  
  // Content
  content: {
    homepageTitle: "Rank #1 in Your Local Market",
    homepageSubtitle: "Get more customers from Google Maps & local search",
    ctaPrimary: "Start Free Audit",
    ctaSecondary: "Watch Demo",
    footerText: "© 2026 {{brandName}}. All rights reserved.",
    supportEmail: "support@{{domain}}",
    supportPhone: "",
    address: ""
  },
  
  // SEO
  seo: {
    titleTemplate: "%s | {{brandName}}",
    defaultTitle: "Rank #1 in Your Local Market",
    defaultDescription: "Get more customers from Google Maps and local search with {{brandName}}",
    defaultKeywords: "local seo, google maps ranking, local business marketing",
    twitterHandle: "@{{brandHandle}}",
    facebookAppId: "",
    googleAnalyticsId: "",
    gtmId: ""
  },
  
  // Integrations
  integrations: {
    stripe: {
      publishableKey: process.env.VITE_STRIPE_PK,
      pricingTable: "default"
    },
    google: {
      mapsApiKey: process.env.VITE_GOOGLE_MAPS_KEY,
      analyticsId: ""
    },
    resend: {
      fromEmail: "noreply@{{domain}}",
      fromName: "{{brandName}} Team"
    }
  },
  
  // Custom Domain
  domain: {
    custom: null, // e.g., "app.customerdomain.com"
    cnameVerified: false,
    sslActive: false
  }
};

// Customer-specific configs will be loaded from API
export async function loadBrandConfig(domain) {
  try {
    // Try to load from API
    const response = await fetch(`/api/brand-config?domain=${domain}`);
    if (response.ok) {
      const customConfig = await response.json();
      return mergeConfigs(defaultBrandConfig, customConfig);
    }
  } catch (e) {
    console.warn('Failed to load brand config, using defaults');
  }
  return defaultBrandConfig;
}

// Deep merge helper
function mergeConfigs(defaults, custom) {
  const merged = { ...defaults };
  for (const key in custom) {
    if (typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
      merged[key] = mergeConfigs(defaults[key] || {}, custom[key]);
    } else {
      merged[key] = custom[key];
    }
  }
  return merged;
}

// CSS Custom Properties generator
export function generateCSSVariables(config) {
  return `
    :root {
      --brand-primary: ${config.colors.primary};
      --brand-primary-hover: ${config.colors.primaryHover};
      --brand-secondary: ${config.colors.secondary};
      --brand-accent: ${config.colors.accent};
      --brand-bg: ${config.colors.background};
      --brand-surface: ${config.colors.surface};
      --brand-text: ${config.colors.text};
      --brand-text-muted: ${config.colors.textMuted};
      --brand-border: ${config.colors.border};
      --brand-error: ${config.colors.error};
      --brand-success: ${config.colors.success};
      --brand-warning: ${config.colors.warning};
      
      --font-heading: ${config.fonts.heading};
      --font-body: ${config.fonts.body};
    }
  `;
}
