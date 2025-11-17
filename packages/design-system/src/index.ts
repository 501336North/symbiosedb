/**
 * SymbioseDB Design System
 *
 * Beautiful, minimalist design system inspired by Apple
 * Study: Linear, Stripe, Arc Browser, Vercel, Railway
 *
 * Philosophy:
 * - Whitespace = luxury
 * - Subtle animations = polish
 * - Consistent spacing = rhythm
 * - System fonts = clarity
 * - Blur/transparency = depth
 * - Micro-interactions = delight
 */

// Phase 7 Part 1: Design Tokens
export { DesignTokens } from './design-tokens';
export type {
  ColorPalette,
  SpacingScale,
  FontSize,
  FontWeight,
  Shadow,
  BorderRadius,
  Breakpoint,
  ZIndex,
  AnimationDuration,
  AnimationEasing,
  Opacity,
} from './design-tokens';

// Phase 7 Part 2: Theme Engine
export { ThemeEngine } from './theme-engine';
export type {
  ThemeMode,
  ThemeColors,
  Theme,
} from './theme-engine';

// Phase 7 Part 3: Component Library
export { ComponentStyles } from './component-library';

// Phase 7 Part 4: Animation System
export { AnimationSystem } from './animation-system';
