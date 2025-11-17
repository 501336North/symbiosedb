/**
 * Phase 7 Part 2: Theme Engine
 *
 * Dark/light/auto theme switching with persistence
 * Generates CSS variables for runtime theming
 */

import { EventEmitter } from 'events';
import { DesignTokens } from './design-tokens';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Core colors
  background: string;
  surface: string;

  // Text colors
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };

  // Brand colors (inherit from design tokens)
  primary: Record<string, string>;
  neutral: Record<string, string>;
  success: Record<string, string>;
  error: Record<string, string>;
  warning: Record<string, string>;
  info: Record<string, string>;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof DesignTokens.spacing;
  typography: typeof DesignTokens.typography;
  shadows: typeof DesignTokens.shadows;
  borders: typeof DesignTokens.borders;
  animation: typeof DesignTokens.animation;
  opacity: typeof DesignTokens.opacity;
}

/**
 * Theme Engine
 *
 * Manages theme state, generation, and CSS variable output
 */
export class ThemeEngine extends EventEmitter {
  private currentMode: ThemeMode = 'light';

  constructor() {
    super();
  }

  /**
   * Set theme mode
   */
  setMode(mode: ThemeMode): void {
    // Validate mode
    if (!['light', 'dark', 'auto'].includes(mode)) {
      throw new Error(`Invalid theme mode: ${mode}`);
    }

    // Don't emit if same mode
    if (mode === this.currentMode) {
      return;
    }

    this.currentMode = mode;

    // Emit theme change event
    this.emit('themeChange', {
      mode: this.currentMode,
      theme: this.getCurrentTheme(),
    });
  }

  /**
   * Get current theme mode
   */
  getMode(): ThemeMode {
    return this.currentMode;
  }

  /**
   * Get theme for specific mode
   */
  getTheme(mode: Exclude<ThemeMode, 'auto'>): Theme {
    const colors = this.generateThemeColors(mode);

    return {
      mode,
      colors,
      spacing: DesignTokens.spacing,
      typography: DesignTokens.typography,
      shadows: DesignTokens.shadows,
      borders: DesignTokens.borders,
      animation: DesignTokens.animation,
      opacity: DesignTokens.opacity,
    };
  }

  /**
   * Get current theme based on current mode
   */
  getCurrentTheme(): Theme {
    const actualMode = this.currentMode === 'auto' ? 'light' : this.currentMode;
    return this.getTheme(actualMode);
  }

  /**
   * Generate theme-specific colors
   */
  private generateThemeColors(mode: 'light' | 'dark'): ThemeColors {
    if (mode === 'light') {
      return {
        background: '#ffffff',
        surface: '#fafafa',
        text: {
          primary: '#171717',
          secondary: '#737373',
          disabled: '#d4d4d4',
          inverse: '#ffffff',
        },
        primary: DesignTokens.colors.primary,
        neutral: DesignTokens.colors.neutral,
        success: DesignTokens.colors.success,
        error: DesignTokens.colors.error,
        warning: DesignTokens.colors.warning,
        info: DesignTokens.colors.info,
      };
    }

    // Dark theme
    return {
      background: '#0a0a0a',
      surface: '#171717',
      text: {
        primary: '#fafafa',
        secondary: '#a3a3a3',
        disabled: '#525252',
        inverse: '#171717',
      },
      primary: DesignTokens.colors.primary,
      neutral: DesignTokens.colors.neutral,
      success: DesignTokens.colors.success,
      error: DesignTokens.colors.error,
      warning: DesignTokens.colors.warning,
      info: DesignTokens.colors.info,
    };
  }

  /**
   * Generate CSS variables for current theme
   */
  getCSSVariables(): string {
    const theme = this.getCurrentTheme();
    const vars: string[] = [];

    // Color variables
    vars.push(`--color-background: ${theme.colors.background}`);
    vars.push(`--color-surface: ${theme.colors.surface}`);
    vars.push(`--color-text-primary: ${theme.colors.text.primary}`);
    vars.push(`--color-text-secondary: ${theme.colors.text.secondary}`);
    vars.push(`--color-text-disabled: ${theme.colors.text.disabled}`);
    vars.push(`--color-text-inverse: ${theme.colors.text.inverse}`);

    // Primary colors
    Object.entries(theme.colors.primary).forEach(([shade, color]) => {
      vars.push(`--color-primary-${shade}: ${color}`);
    });

    // Spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      if (key !== 'base' && typeof value === 'number') {
        vars.push(`--spacing-${key}: ${value}px`);
      }
    });

    // Typography variables
    vars.push(`--font-family-sans: ${theme.typography.fontFamily.sans}`);
    vars.push(`--font-family-mono: ${theme.typography.fontFamily.mono}`);

    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      vars.push(`--font-size-${key}: ${value}`);
    });

    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      vars.push(`--font-weight-${key}: ${value}`);
    });

    // Shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      vars.push(`--shadow-${key}: ${value}`);
    });

    // Border radius variables
    Object.entries(theme.borders.radius).forEach(([key, value]) => {
      vars.push(`--border-radius-${key}: ${value}px`);
    });

    return vars.join(';\n') + ';';
  }

  /**
   * Serialize theme to JSON
   */
  toJSON(): string {
    const theme = this.getCurrentTheme();
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Deserialize theme from JSON
   */
  fromJSON(json: string): Theme {
    return JSON.parse(json) as Theme;
  }

  /**
   * Check if current theme is dark
   */
  isDark(): boolean {
    const actualMode = this.currentMode === 'auto' ? 'light' : this.currentMode;
    return actualMode === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLight(): boolean {
    const actualMode = this.currentMode === 'auto' ? 'light' : this.currentMode;
    return actualMode === 'light';
  }

  /**
   * Toggle between light and dark
   */
  toggle(): void {
    const actualMode = this.currentMode === 'auto' ? 'light' : this.currentMode;
    this.setMode(actualMode === 'light' ? 'dark' : 'light');
  }
}
