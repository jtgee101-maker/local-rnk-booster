// BrandConfig.js - Single Source of Truth for LocalRnk Design System
// This file centralizes all design tokens to eliminate hardcoded values

export const colors = {
  // Brand Colors - Tech Noir Standard (Neon Cyan)
  brand: {
    DEFAULT: '#00F2FF',      // Neon Cyan (Sovereign Standard)
    light: '#33F5FF',        // Light cyan
    dark: '#00C2CC',         // Dark cyan
    foreground: '#0A0B10',   // OLED Black
    glow: 'rgba(0, 242, 255, 0.3)', // Glow effect
  },
  
  // Semantic Status Colors
  status: {
    success: {
      DEFAULT: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
      foreground: '#ffffff',
    },
    warning: {
      DEFAULT: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      foreground: '#0a0a0f',
    },
    error: {
      DEFAULT: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      foreground: '#ffffff',
    },
    info: {
      DEFAULT: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      foreground: '#ffffff',
    },
    neutral: {
      DEFAULT: '#6b7280',
      light: '#9ca3af',
      dark: '#4b5563',
      foreground: '#ffffff',
    },
  },
  
  // Tech Noir Backgrounds - OLED Optimized
  background: {
    primary: '#0A0B10',         // OLED Black (main page)
    secondary: '#0F1115',       // Surface cards
    tertiary: '#14161C',        // Elevated elements
    hover: '#1A1D24',           // Hover states
    glass: 'rgba(255, 255, 255, 0.05)', // Glassmorphism surface
    glassHover: 'rgba(255, 255, 255, 0.08)',
  },
  
  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    muted: '#71717a',
    disabled: '#52525b',
  },
  
  // Border Colors - Tech Noir
  border: {
    DEFAULT: 'rgba(255, 255, 255, 0.1)',    // Subtle white
    hover: 'rgba(255, 255, 255, 0.15)',     // Hover state
    focus: '#00F2FF',                        // Neon cyan focus
    glass: '1px solid rgba(255, 255, 255, 0.1)', // Glassmorphism border
  },
};

// Spacing Scale (consistent 4px grid)
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  sizes: {
    xs: '12px',    // Captions, badges
    sm: '14px',    // Body small
    base: '16px',  // Body default
    lg: '18px',    // Lead text
    xl: '20px',    // H6
    '2xl': '24px', // H5
    '3xl': '30px', // H4
    '4xl': '36px', // H3
    '5xl': '48px', // H2
    '6xl': '60px', // H1
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// Border Radius
export const radius = {
  none: '0px',
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// Shadows - Tech Noir Elevation System
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  glow: '0 0 20px rgba(0, 242, 255, 0.3)',           // Neon cyan glow
  glowStrong: '0 0 30px rgba(0, 242, 255, 0.5)',    // Strong glow
  glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',        // Glassmorphism shadow
};

// Transitions - Tech Noir Standard (300ms cubic-bezier)
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',  // Sovereign standard
  glow: '300ms ease-in-out',
};

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
};

// Chart Colors (color-blind safe)
export const chartColors = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Yellow/Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
];

// Admin Navigation Sections (for restructuring 31 tabs)
export const adminNavigation = {
  overview: {
    label: 'Overview',
    items: ['Dashboard', 'Metrics', 'Activity Feed'],
  },
  users: {
    label: 'Users & Access',
    items: ['User Management', 'Tenants', 'Roles & Permissions'],
  },
  analytics: {
    label: 'Analytics',
    items: ['Advanced Analytics', 'Reports', 'Funnels', 'A/B Tests'],
  },
  marketing: {
    label: 'Marketing',
    items: ['Campaigns', 'Email', 'Affiliates', 'Segments'],
  },
  system: {
    label: 'System',
    items: ['Health Monitor', 'Security', 'Settings', 'Backups'],
  },
  development: {
    label: 'Development',
    items: ['Testing', 'Error Tracking', 'Logs', 'API'],
  },
};

// Breakpoints (Tailwind compatible)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Glassmorphism Utilities (Tech Noir Standard)
export const glassmorphism = {
  surface: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
  },
  elevated: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  glow: {
    boxShadow: '0 0 20px rgba(0, 242, 255, 0.3)',
    border: '1px solid rgba(0, 242, 255, 0.5)',
  },
};

// Export default for easy importing
export default {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  transitions,
  zIndex,
  chartColors,
  adminNavigation,
  breakpoints,
  glassmorphism,
};
