/**
 * Branding Injection System
 * 
 * Dynamically applies tenant-specific branding to the application.
 * Includes CSS variable overrides, logo injection, and theme switching.
 */

import { useEffect, useState } from 'react';

// Default branding configuration
export const DEFAULT_BRANDING = {
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

// Apply branding to document
export function applyBranding(branding = DEFAULT_BRANDING) {
  const root = document.documentElement;
  
  // Apply colors
  if (branding.colors) {
    Object.entries(branding.colors).forEach(([key, value]) => {
      root.style.setProperty(`--tenant-${key}`, value);
    });
  }
  
  // Apply typography
  if (branding.typography) {
    root.style.setProperty('--tenant-heading-font', branding.typography.headingFont);
    root.style.setProperty('--tenant-body-font', branding.typography.bodyFont);
    
    // Apply font family to document
    if (branding.typography.bodyFont) {
      document.body.style.fontFamily = branding.typography.bodyFont + ', system-ui, sans-serif';
    }
  }
  
  // Apply custom CSS
  if (branding.customCSS) {
    injectCustomCSS(branding.customCSS);
  }
  
  // Update favicon
  if (branding.logo?.favicon) {
    updateFavicon(branding.logo.favicon);
  }
  
  // Store branding in session for persistence
  try {
    sessionStorage.setItem('tenant_branding', JSON.stringify(branding));
  } catch {
    // Ignore storage errors
  }
}

// Inject custom CSS
function injectCustomCSS(css) {
  const id = 'tenant-custom-css';
  let styleEl = document.getElementById(id);
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = id;
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = css;
}

// Update favicon
function updateFavicon(url) {
  const id = 'tenant-favicon';
  let linkEl = document.getElementById(id) || document.querySelector('link[rel="shortcut icon"]');
  
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = id;
    linkEl.rel = 'shortcut icon';
    document.head.appendChild(linkEl);
  }
  
  linkEl.href = url;
}

// Load branding from session
export function loadStoredBranding() {
  try {
    const stored = sessionStorage.getItem('tenant_branding');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

// React hook for branding
export function useTenantBranding(tenantId) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBranding = async () => {
      if (!tenantId) {
        // Try to load from storage or apply default
        const stored = loadStoredBranding();
        if (stored) {
          setBranding(stored);
          applyBranding(stored);
        } else {
          applyBranding(DEFAULT_BRANDING);
        }
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/tenants/${tenantId}/branding`);
        
        if (response.ok) {
          const data = await response.json();
          const mergedBranding = {
            ...DEFAULT_BRANDING,
            ...data.branding,
            colors: { ...DEFAULT_BRANDING.colors, ...data.branding?.colors },
            typography: { ...DEFAULT_BRANDING.typography, ...data.branding?.typography },
            logo: { ...DEFAULT_BRANDING.logo, ...data.branding?.logo }
          };
          
          setBranding(mergedBranding);
          applyBranding(mergedBranding);
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
        // Fall back to stored or default
        const stored = loadStoredBranding();
        if (stored) {
          setBranding(stored);
          applyBranding(stored);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBranding();
    
    // Listen for tenant changes
    const handleTenantChange = (event) => {
      if (event.detail?.tenantId) {
        fetchBranding();
      }
    };
    
    window.addEventListener('tenantchange', handleTenantChange);
    
    return () => {
      window.removeEventListener('tenantchange', handleTenantChange);
    };
  }, [tenantId]);
  
  return { branding, loading, applyBranding };
}

// Get CSS variable value
export function getBrandingVar(name, fallback = '') {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--tenant-${name}`)
    .trim() || fallback;
}

// Generate branded styles object
export function generateBrandedStyles(branding = DEFAULT_BRANDING) {
  return {
    primaryColor: branding.colors?.primary || DEFAULT_BRANDING.colors.primary,
    secondaryColor: branding.colors?.secondary || DEFAULT_BRANDING.colors.secondary,
    backgroundColor: branding.colors?.background || DEFAULT_BRANDING.colors.background,
    surfaceColor: branding.colors?.surface || DEFAULT_BRANDING.colors.surface,
    textColor: branding.colors?.text || DEFAULT_BRANDING.colors.text,
    accentColor: branding.colors?.accent || DEFAULT_BRANDING.colors.accent,
    headingFont: branding.typography?.headingFont || DEFAULT_BRANDING.typography.headingFont,
    bodyFont: branding.typography?.bodyFont || DEFAULT_BRANDING.typography.bodyFont,
    logoUrl: branding.logo?.url || null,
    logoDarkUrl: branding.logo?.darkUrl || null
  };
}

// Logo component with fallback
export function TenantLogo({ 
  branding, 
  className = '', 
  fallback = 'LocalRNK',
  dark = false 
}) {
  const logoUrl = dark ? branding?.logo?.darkUrl : branding?.logo?.url;
  
  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt={branding?.name || 'Tenant Logo'}
        className={className}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }
  
  return (
    <span className={className}>
      {fallback}
    </span>
  );
}

// White-label detection
export function isWhiteLabeled(tenant) {
  return tenant?.features?.white_label?.enabled === true;
}

// Remove branding (for admin/preview)
export function clearBranding() {
  const root = document.documentElement;
  
  // Clear CSS variables
  Object.keys(DEFAULT_BRANDING.colors).forEach(key => {
    root.style.removeProperty(`--tenant-${key}`);
  });
  
  root.style.removeProperty('--tenant-heading-font');
  root.style.removeProperty('--tenant-body-font');
  
  // Remove custom CSS
  const styleEl = document.getElementById('tenant-custom-css');
  if (styleEl) {
    styleEl.remove();
  }
  
  // Clear storage
  try {
    sessionStorage.removeItem('tenant_branding');
  } catch {
    // Ignore
  }
}

// Initialize branding from URL params (for preview)
export function initPreviewBranding() {
  const params = new URLSearchParams(window.location.search);
  const previewBranding = params.get('__branding');
  
  if (previewBranding) {
    try {
      const branding = JSON.parse(atob(previewBranding));
      applyBranding(branding);
      return branding;
    } catch (error) {
      console.error('Invalid preview branding:', error);
    }
  }
  
  return null;
}

// Export default
export default {
  DEFAULT_BRANDING,
  applyBranding,
  loadStoredBranding,
  useTenantBranding,
  getBrandingVar,
  generateBrandedStyles,
  TenantLogo,
  isWhiteLabeled,
  clearBranding,
  initPreviewBranding
};
