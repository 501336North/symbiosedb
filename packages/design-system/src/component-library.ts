/**
 * Phase 7 Part 3: Component Library
 *
 * CSS-in-JS style utilities for component styling
 * Generates CSS strings for beautiful, consistent UI components
 */

import { DesignTokens } from './design-tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type CardVariant = 'elevated' | 'outlined' | 'flat';
type TextVariant = 'primary' | 'secondary' | 'disabled';
type FlexDirection = 'row' | 'column';
type AlignItems = 'start' | 'center' | 'end' | 'stretch';
type JustifyContent = 'start' | 'center' | 'end' | 'space-between' | 'space-around';

interface ButtonOptions {
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

interface InputOptions {
  size?: ButtonSize;
  error?: boolean;
  disabled?: boolean;
  focus?: boolean;
}

interface CardOptions {
  variant?: CardVariant;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

interface ModalOptions {
  size?: 'sm' | 'md' | 'lg';
}

interface TextOptions {
  variant?: TextVariant;
}

interface FlexOptions {
  direction?: FlexDirection;
  align?: AlignItems;
  justify?: JustifyContent;
  gap?: number;
}

interface GridOptions {
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
}

interface SpacingOptions {
  m?: number | 'auto';
  mt?: number | 'auto';
  mr?: number | 'auto';
  mb?: number | 'auto';
  ml?: number | 'auto';
  mx?: number | 'auto';
  my?: number | 'auto';
  p?: number;
  pt?: number;
  pr?: number;
  pb?: number;
  pl?: number;
  px?: number;
  py?: number;
}

/**
 * Component Styles Generator
 *
 * Generates CSS strings for consistent, beautiful UI components
 */
export class ComponentStyles {
  /**
   * Button styles
   */
  static button(variant: ButtonVariant, options: ButtonOptions = {}): string {
    const {
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
    } = options;

    const baseStyles = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: ${DesignTokens.typography.fontFamily.sans};
      font-weight: ${DesignTokens.typography.fontWeight.medium};
      border: none;
      border-radius: ${DesignTokens.borders.radius.md}px;
      cursor: pointer;
      transition: all ${DesignTokens.animation.duration.fast}ms ${DesignTokens.animation.easing.ease};
    `;

    const sizeStyles = {
      sm: `
        padding: ${DesignTokens.spacing['1']}px ${DesignTokens.spacing['3']}px;
        font-size: ${DesignTokens.typography.fontSize.sm};
      `,
      md: `
        padding: ${DesignTokens.spacing['2']}px ${DesignTokens.spacing['4']}px;
        font-size: ${DesignTokens.typography.fontSize.base};
      `,
      lg: `
        padding: ${DesignTokens.spacing['3']}px ${DesignTokens.spacing['6']}px;
        font-size: ${DesignTokens.typography.fontSize.lg};
      `,
    };

    const variantStyles = {
      primary: `
        background: ${DesignTokens.colors.primary['500']};
        color: #ffffff;
      `,
      secondary: `
        background: ${DesignTokens.colors.neutral['100']};
        color: ${DesignTokens.colors.text.primary};
        border: ${DesignTokens.borders.width.thin}px solid ${DesignTokens.colors.neutral['300']};
      `,
      ghost: `
        background: transparent;
        color: ${DesignTokens.colors.primary['500']};
      `,
    };

    const stateStyles = [];
    if (disabled) {
      stateStyles.push(`
        opacity: ${DesignTokens.opacity['50']};
        cursor: not-allowed;
      `);
    }

    if (loading) {
      stateStyles.push(`
        cursor: wait;
      `);
    }

    if (fullWidth) {
      stateStyles.push(`
        width: 100%;
      `);
    }

    return `${baseStyles}${sizeStyles[size]}${variantStyles[variant]}${stateStyles.join('')}`;
  }

  /**
   * Input styles
   */
  static input(options: InputOptions = {}): string {
    const { size = 'md', error = false, disabled = false, focus = false } = options;

    const baseStyles = `
      display: block;
      width: 100%;
      font-family: ${DesignTokens.typography.fontFamily.sans};
      border: ${DesignTokens.borders.width.thin}px solid ${DesignTokens.colors.neutral['300']};
      border-radius: ${DesignTokens.borders.radius.md}px;
      transition: all ${DesignTokens.animation.duration.fast}ms ${DesignTokens.animation.easing.ease};
    `;

    const sizeStyles = {
      sm: `
        padding: ${DesignTokens.spacing['1']}px ${DesignTokens.spacing['2']}px;
        font-size: ${DesignTokens.typography.fontSize.sm};
      `,
      md: `
        padding: ${DesignTokens.spacing['2']}px ${DesignTokens.spacing['3']}px;
        font-size: ${DesignTokens.typography.fontSize.base};
      `,
      lg: `
        padding: ${DesignTokens.spacing['3']}px ${DesignTokens.spacing['4']}px;
        font-size: ${DesignTokens.typography.fontSize.lg};
      `,
    };

    const stateStyles = [];

    if (error) {
      stateStyles.push(`
        border-color: ${DesignTokens.colors.error['500']};
      `);
    }

    if (disabled) {
      stateStyles.push(`
        opacity: ${DesignTokens.opacity['50']};
        cursor: not-allowed;
      `);
    }

    if (focus) {
      stateStyles.push(`
        outline: ${DesignTokens.borders.width.normal}px solid ${DesignTokens.colors.primary['500']};
        outline-offset: ${DesignTokens.borders.width.thin}px;
        border-color: ${DesignTokens.colors.primary['500']};
      `);
    }

    return `${baseStyles}${sizeStyles[size]}${stateStyles.join('')}`;
  }

  /**
   * Card styles
   */
  static card(options: CardOptions = {}): string {
    const { variant = 'elevated', hoverable = false, padding = 'md' } = options;

    const baseStyles = `
      background: ${DesignTokens.colors.surface};
      border-radius: ${DesignTokens.borders.radius.lg}px;
      transition: all ${DesignTokens.animation.duration.normal}ms ${DesignTokens.animation.easing.ease};
    `;

    const paddingStyles = {
      sm: `padding: ${DesignTokens.spacing['3']}px;`,
      md: `padding: ${DesignTokens.spacing['4']}px;`,
      lg: `padding: ${DesignTokens.spacing['6']}px;`,
    };

    const variantStyles = {
      elevated: `
        box-shadow: ${DesignTokens.shadows.md};
      `,
      outlined: `
        border: ${DesignTokens.borders.width.thin}px solid ${DesignTokens.colors.neutral['200']};
      `,
      flat: ``,
    };

    const hoverableStyles = hoverable
      ? `
      cursor: pointer;
      transition: transform ${DesignTokens.animation.duration.fast}ms ${DesignTokens.animation.easing.ease};
    `
      : '';

    return `${baseStyles}${paddingStyles[padding]}${variantStyles[variant]}${hoverableStyles}`;
  }

  /**
   * Modal overlay styles
   */
  static modalOverlay(): string {
    return `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, ${DesignTokens.opacity['50']});
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${DesignTokens.zIndex.modal};
    `;
  }

  /**
   * Modal content styles
   */
  static modalContent(options: ModalOptions = {}): string {
    const { size = 'md' } = options;

    const sizeStyles = {
      sm: `max-width: 400px;`,
      md: `max-width: 600px;`,
      lg: `max-width: 800px;`,
    };

    return `
      background: ${DesignTokens.colors.background};
      border-radius: ${DesignTokens.borders.radius.xl}px;
      padding: ${DesignTokens.spacing['6']}px;
      box-shadow: ${DesignTokens.shadows.xl};
      margin: ${DesignTokens.spacing['4']}px;
      width: 100%;
      ${sizeStyles[size]}
    `;
  }

  /**
   * Heading styles
   */
  static heading(level: 1 | 2 | 3 | 4 | 5 | 6): string {
    const sizes = {
      1: DesignTokens.typography.fontSize['4xl'],
      2: DesignTokens.typography.fontSize['3xl'],
      3: DesignTokens.typography.fontSize['2xl'],
      4: DesignTokens.typography.fontSize.xl,
      5: DesignTokens.typography.fontSize.lg,
      6: DesignTokens.typography.fontSize.base,
    };

    return `
      font-family: ${DesignTokens.typography.fontFamily.sans};
      font-size: ${sizes[level]};
      font-weight: ${DesignTokens.typography.fontWeight.bold};
      line-height: ${DesignTokens.typography.lineHeight.tight};
      color: ${DesignTokens.colors.text.primary};
      margin: 0;
    `;
  }

  /**
   * Paragraph styles
   */
  static paragraph(): string {
    return `
      font-family: ${DesignTokens.typography.fontFamily.sans};
      font-size: ${DesignTokens.typography.fontSize.base};
      line-height: ${DesignTokens.typography.lineHeight.relaxed};
      color: ${DesignTokens.colors.text.primary};
      margin: 0;
    `;
  }

  /**
   * Text variant styles
   */
  static text(options: TextOptions = {}): string {
    const { variant = 'primary' } = options;

    const variantStyles = {
      primary: `color: ${DesignTokens.colors.text.primary};`,
      secondary: `color: ${DesignTokens.colors.text.secondary};`,
      disabled: `color: ${DesignTokens.colors.text.disabled};`,
    };

    return `
      font-family: ${DesignTokens.typography.fontFamily.sans};
      ${variantStyles[variant]}
    `;
  }

  /**
   * Form group styles
   */
  static formGroup(): string {
    return `
      display: flex;
      flex-direction: column;
      margin-bottom: ${DesignTokens.spacing['4']}px;
    `;
  }

  /**
   * Label styles
   */
  static label(): string {
    return `
      font-family: ${DesignTokens.typography.fontFamily.sans};
      font-size: ${DesignTokens.typography.fontSize.sm};
      font-weight: ${DesignTokens.typography.fontWeight.medium};
      color: ${DesignTokens.colors.text.primary};
      margin-bottom: ${DesignTokens.spacing['1']}px;
    `;
  }

  /**
   * Helper text styles
   */
  static helperText(): string {
    return `
      font-family: ${DesignTokens.typography.fontFamily.sans};
      font-size: ${DesignTokens.typography.fontSize.sm};
      color: ${DesignTokens.colors.text.secondary};
      margin-top: ${DesignTokens.spacing['1']}px;
    `;
  }

  /**
   * Error message styles
   */
  static errorMessage(): string {
    return `
      font-family: ${DesignTokens.typography.fontFamily.sans};
      font-size: ${DesignTokens.typography.fontSize.sm};
      color: ${DesignTokens.colors.error['500']};
      margin-top: ${DesignTokens.spacing['1']}px;
    `;
  }

  /**
   * Helper to get spacing value
   */
  private static getSpacingValue(value: number): number {
    return DesignTokens.getSpacing(value);
  }

  /**
   * Flex container styles
   */
  static flex(options: FlexOptions = {}): string {
    const {
      direction = 'row',
      align = 'stretch',
      justify = 'start',
      gap = 0,
    } = options;

    return `
      display: flex;
      flex-direction: ${direction};
      align-items: ${align};
      justify-content: ${justify};
      ${gap > 0 ? `gap: ${this.getSpacingValue(gap)}px;` : ''}
    `;
  }

  /**
   * Grid container styles
   */
  static grid(options: GridOptions = {}): string {
    const { columns = 1, gap = 'md' } = options;

    const gapSize = {
      sm: DesignTokens.spacing['2'],
      md: DesignTokens.spacing['4'],
      lg: DesignTokens.spacing['6'],
    };

    return `
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: ${gapSize[gap]}px;
    `;
  }

  /**
   * Spacing utility styles
   */
  static spacing(options: SpacingOptions = {}): string {
    const styles: string[] = [];

    // Margin
    if (options.m !== undefined) {
      const value = options.m === 'auto' ? 'auto' : `${this.getSpacingValue(options.m)}px`;
      styles.push(`margin: ${value};`);
    }
    if (options.mt !== undefined) {
      const value = options.mt === 'auto' ? 'auto' : `${this.getSpacingValue(options.mt)}px`;
      styles.push(`margin-top: ${value};`);
    }
    if (options.mr !== undefined) {
      const value = options.mr === 'auto' ? 'auto' : `${this.getSpacingValue(options.mr)}px`;
      styles.push(`margin-right: ${value};`);
    }
    if (options.mb !== undefined) {
      const value = options.mb === 'auto' ? 'auto' : `${this.getSpacingValue(options.mb)}px`;
      styles.push(`margin-bottom: ${value};`);
    }
    if (options.ml !== undefined) {
      const value = options.ml === 'auto' ? 'auto' : `${this.getSpacingValue(options.ml)}px`;
      styles.push(`margin-left: ${value};`);
    }
    if (options.mx !== undefined) {
      const value = options.mx === 'auto' ? 'auto' : `${this.getSpacingValue(options.mx)}px`;
      styles.push(`margin-left: ${value}; margin-right: ${value};`);
    }
    if (options.my !== undefined) {
      const value = options.my === 'auto' ? 'auto' : `${this.getSpacingValue(options.my)}px`;
      styles.push(`margin-top: ${value}; margin-bottom: ${value};`);
    }

    // Padding
    if (options.p !== undefined) {
      styles.push(`padding: ${this.getSpacingValue(options.p)}px;`);
    }
    if (options.pt !== undefined) {
      styles.push(`padding-top: ${this.getSpacingValue(options.pt)}px;`);
    }
    if (options.pr !== undefined) {
      styles.push(`padding-right: ${this.getSpacingValue(options.pr)}px;`);
    }
    if (options.pb !== undefined) {
      styles.push(`padding-bottom: ${this.getSpacingValue(options.pb)}px;`);
    }
    if (options.pl !== undefined) {
      styles.push(`padding-left: ${this.getSpacingValue(options.pl)}px;`);
    }
    if (options.px !== undefined) {
      const val = this.getSpacingValue(options.px);
      styles.push(`padding-left: ${val}px; padding-right: ${val}px;`);
    }
    if (options.py !== undefined) {
      const val = this.getSpacingValue(options.py);
      styles.push(`padding-top: ${val}px; padding-bottom: ${val}px;`);
    }

    return styles.join('\n');
  }
}
