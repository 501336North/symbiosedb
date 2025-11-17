/**
 * Phase 7: Design Tokens
 *
 * Foundation of the SymbioseDB Design System
 * Inspired by: Linear, Stripe, Arc Browser, Vercel
 * Philosophy: Apple-inspired minimalism - whitespace, subtlety, precision
 */

/**
 * Color System
 *
 * Primary: Sophisticated blue (trust, technology)
 * Neutral: Refined grays (luxury through subtlety)
 * Semantic: Clear, accessible colors for states
 */
const colors = {
  // Primary palette - Sophisticated blue
  primary: {
    '50': '#eff6ff',
    '100': '#dbeafe',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '500': '#3b82f6', // Main brand color
    '600': '#2563eb',
    '700': '#1d4ed8',
    '800': '#1e40af',
    '900': '#1e3a8a',
  },

  // Neutral palette - Refined grays
  neutral: {
    '50': '#fafafa',
    '100': '#f5f5f5',
    '200': '#e5e5e5',
    '300': '#d4d4d4',
    '400': '#a3a3a3',
    '500': '#737373',
    '600': '#525252',
    '700': '#404040',
    '800': '#262626',
    '900': '#171717',
  },

  // Semantic colors
  success: {
    '50': '#f0fdf4',
    '100': '#dcfce7',
    '200': '#bbf7d0',
    '300': '#86efac',
    '400': '#4ade80',
    '500': '#22c55e',
    '600': '#16a34a',
    '700': '#15803d',
    '800': '#166534',
    '900': '#14532d',
  },

  error: {
    '50': '#fef2f2',
    '100': '#fee2e2',
    '200': '#fecaca',
    '300': '#fca5a5',
    '400': '#f87171',
    '500': '#ef4444',
    '600': '#dc2626',
    '700': '#b91c1c',
    '800': '#991b1b',
    '900': '#7f1d1d',
  },

  warning: {
    '50': '#fffbeb',
    '100': '#fef3c7',
    '200': '#fde68a',
    '300': '#fcd34d',
    '400': '#fbbf24',
    '500': '#f59e0b',
    '600': '#d97706',
    '700': '#b45309',
    '800': '#92400e',
    '900': '#78350f',
  },

  info: {
    '50': '#eff6ff',
    '100': '#dbeafe',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '500': '#3b82f6',
    '600': '#2563eb',
    '700': '#1d4ed8',
    '800': '#1e40af',
    '900': '#1e3a8a',
  },

  // Surface colors
  background: '#ffffff',
  surface: '#fafafa',

  // Text colors
  text: {
    primary: '#171717',
    secondary: '#737373',
    disabled: '#d4d4d4',
    inverse: '#ffffff',
  },
};

/**
 * Spacing System
 *
 * Base unit: 4px (consistent, predictable rhythm)
 * Scale: 0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64
 */
const spacing = {
  base: 4,
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '6': 24,
  '8': 32,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
  '32': 128,
  '40': 160,
  '48': 192,
  '64': 256,

  // Semantic aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

/**
 * Typography System
 *
 * Fonts: System fonts for optimal performance and native feel
 * SF Pro (Apple), Inter (fallback), system-ui
 */
const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Menlo", "Monaco", "Courier New", monospace',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
};

/**
 * Shadow System
 *
 * Elevation: Subtle shadows for depth (Apple/Linear style)
 * No harsh shadows - soft, diffused lighting
 */
const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

/**
 * Border System
 *
 * Radius: Soft, approachable curves
 * Width: Subtle borders
 */
const borders = {
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  width: {
    none: 0,
    thin: 1,
    normal: 2,
    thick: 4,
  },
};

/**
 * Breakpoints
 *
 * Mobile-first responsive design
 */
const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Z-Index System
 *
 * Stacking context for layered UI
 */
const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
};

/**
 * Animation System
 *
 * Timing: Apple-like - fast, responsive, never sluggish
 * Easing: Natural, physics-based curves
 */
const animation = {
  duration: {
    instant: 0,
    fast: 150, // Quick interactions
    normal: 250, // Standard transitions
    slow: 350, // Emphasis
    slower: 500, // Dramatic reveals
  },

  easing: {
    linear: 'cubic-bezier(0, 0, 1, 1)',
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce effect
  },
};

/**
 * Opacity Scale
 *
 * For overlays, disabled states, hover effects
 */
const opacity = {
  '0': 0,
  '10': 0.1,
  '20': 0.2,
  '30': 0.3,
  '40': 0.4,
  '50': 0.5,
  '60': 0.6,
  '70': 0.7,
  '80': 0.8,
  '90': 0.9,
  '100': 1,
};

/**
 * Helper Functions
 */
function getColor(palette: string, shade: string): string {
  return (colors as any)[palette][shade];
}

function getSpacing(multiplier: number): number {
  return spacing.base * multiplier;
}

function getBreakpoint(size: string): number {
  return (breakpoints as any)[size];
}

/**
 * Design Tokens Export
 *
 * Single source of truth for all design decisions
 */
export const DesignTokens = {
  colors,
  spacing,
  typography,
  shadows,
  borders,
  breakpoints,
  zIndex,
  animation,
  opacity,

  // Helper functions
  getColor,
  getSpacing,
  getBreakpoint,
};

/**
 * TypeScript Types
 */
export type ColorPalette = typeof colors.primary;
export type SpacingScale = keyof typeof spacing;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type Shadow = keyof typeof shadows;
export type BorderRadius = keyof typeof borders.radius;
export type Breakpoint = keyof typeof breakpoints;
export type ZIndex = keyof typeof zIndex;
export type AnimationDuration = keyof typeof animation.duration;
export type AnimationEasing = keyof typeof animation.easing;
export type Opacity = keyof typeof opacity;
