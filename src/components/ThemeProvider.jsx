// Dynamic Theme Provider for White-Label Support
import React, { createContext, useContext, useEffect, useState } from 'react';
import { defaultBrandConfig, generateCSSVariables } from '../config/brandConfig';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialConfig }) {
  const [config, setConfig] = useState(initialConfig || defaultBrandConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load brand config based on domain
    const domain = window.location.hostname;
    loadBrandConfig(domain).then(loadedConfig => {
      setConfig(loadedConfig);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    // Inject CSS variables
    const style = document.createElement('style');
    style.textContent = generateCSSVariables(config);
    document.head.appendChild(style);

    // Update meta tags
    document.title = config.seo.defaultTitle;
    updateMetaTag('description', config.seo.defaultDescription);
    updateMetaTag('theme-color', config.colors.primary);

    return () => {
      document.head.removeChild(style);
    };
  }, [config]);

  if (isLoading) {
    return <ThemeLoader />;
  }

  return (
    <ThemeContext.Provider value={{ config, setConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemeLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function updateMetaTag(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

async function loadBrandConfig(domain) {
  // Check if running on custom domain
  if (domain.includes('netlify.app') || domain === 'localhost') {
    return defaultBrandConfig;
  }

  try {
    const response = await fetch(`/api/brand-config?domain=${domain}`);
    if (response.ok) {
      const custom = await response.json();
      return { ...defaultBrandConfig, ...custom };
    }
  } catch (e) {
    console.warn('Failed to load custom brand config');
  }

  return defaultBrandConfig;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Feature toggle hook
export function useFeature(featureName) {
  const { config } = useTheme();
  return config.features[featureName] ?? false;
}
