/**
 * BrandConfig.js
 * 
 * Tech Noir Design System for God Mode Dashboard
 * Glassmorphism cards, neon cyan accents, OLED black backgrounds
 */

export const TechNoirTheme = {
  // Color Palette
  colors: {
    // Primary - Neon Cyan
    primary: '#00F2FF',
    primaryDark: '#00C4CC',
    primaryLight: '#33F5FF',
    primaryGlow: 'rgba(0, 242, 255, 0.5)',
    
    // Secondary - Acid Green
    secondary: '#c8ff00',
    secondaryDark: '#A3CC00',
    secondaryLight: '#D4FF33',
    secondaryGlow: 'rgba(200, 255, 0, 0.5)',
    
    // Background - OLED Black
    background: '#000000',
    surface: '#0a0a0a',
    surfaceElevated: '#141414',
    surfaceGlass: 'rgba(10, 10, 10, 0.8)',
    
    // Text
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    
    // Border
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(0, 242, 255, 0.3)',
    
    // Status
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Gradient
    gradientPrimary: 'linear-gradient(135deg, #00F2FF 0%, #c8ff00 100%)',
    gradientSurface: 'linear-gradient(180deg, rgba(0, 242, 255, 0.05) 0%, transparent 100%)',
    gradientGlow: 'radial-gradient(circle at top right, rgba(0, 242, 255, 0.15), transparent 70%)'
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Fira Code, monospace',
      display: 'Inter, system-ui, sans-serif'
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  
  // Border Radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
    glow: '0 0 20px rgba(0, 242, 255, 0.3)',
    glowSecondary: '0 0 20px rgba(200, 255, 0, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
  },
  
  // Blur
  blur: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px'
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  
  // Z-index scale
  zIndex: {
    hide: -1,
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

// Glassmorphism card styles
export const glassCardStyles = {
  background: 'rgba(10, 10, 10, 0.8)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '1rem',
  boxShadow: '0 4px 24px rgba(0, 242, 255, 0.05)'
};

// Neon button styles
export const neonButtonStyles = {
  primary: {
    background: '#00F2FF',
    color: '#000000',
    boxShadow: '0 0 20px rgba(0, 242, 255, 0.4)',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 600,
    transition: 'all 250ms ease'
  },
  secondary: {
    background: 'transparent',
    color: '#00F2FF',
    border: '1px solid rgba(0, 242, 255, 0.5)',
    borderRadius: '0.5rem',
    fontWeight: 500,
    transition: 'all 250ms ease'
  },
  ghost: {
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 500,
    transition: 'all 250ms ease'
  }
};

// Animation keyframes
export const animations = {
  fadeIn: `@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }`,
  
  slideUp: `@keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }`,
  
  pulse: `@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }`,
  
  glow: `@keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 242, 255, 0.3); }
    50% { box-shadow: 0 0 40px rgba(0, 242, 255, 0.6); }
  }`,
  
  spin: `@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }`
};

// Utility classes
export const utilityClasses = {
  glass: `
    bg-[#0a0a0a]/80 
    backdrop-blur-xl 
    border 
    border-white/10 
    rounded-2xl
  `,
  
  neonText: `
    text-[#00F2FF] 
    drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]
  `,
  
  neonBorder: `
    border-[#00F2FF]/50 
    shadow-[0_0_20px_rgba(0,242,255,0.1)]
  `,
  
  hoverGlow: `
    transition-all 
    duration-300 
    hover:border-[#00F2FF]/30 
    hover:shadow-[0_0_30px_rgba(0,242,255,0.1)]
  `,
  
  gradientText: `
    bg-gradient-to-r 
    from-[#00F2FF] 
    to-[#c8ff00] 
    bg-clip-text 
    text-transparent
  `
};

// Status colors mapping
export const statusColors = {
  active: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20'
  },
  pending: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20'
  },
  suspended: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20'
  },
  cancelled: {
    bg: 'bg-gray-500/20',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    glow: 'shadow-gray-500/20'
  },
  healthy: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30'
  },
  degraded: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30'
  },
  unhealthy: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30'
  }
};

// Export default theme configuration
export default TechNoirTheme;
