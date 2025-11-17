/**
 * Phase 7 Part 4: Animation System
 *
 * Beautiful, performant animations inspired by Apple's Motion design
 * Utilities for fade, slide, scale, rotate, spring physics, and gestures
 */

import { DesignTokens } from './design-tokens';

type AnimationOptions = {
  duration?: number;
  easing?: string;
  delay?: number;
  willChange?: boolean;
};

type SlideOptions = AnimationOptions & {
  distance?: number;
  gpu?: boolean;
};

type ScaleOptions = AnimationOptions & {
  from?: number;
  to?: number;
};

type RotateOptions = AnimationOptions & {
  degrees: number;
  gpu?: boolean;
};

type SpringPreset = 'gentle' | 'wobbly' | 'stiff';

type SpringOptions = {
  preset?: SpringPreset;
  stiffness?: number;
  damping?: number;
  mass?: number;
};

type SpringConfig = {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
};

type KeyframeStep = {
  offset?: number;
  [key: string]: any;
};

type AnimationSequenceItem = {
  animation: string;
  delay: number;
};

type StaggerOptions = {
  startDelay?: number;
  reverse?: boolean;
};

type HoverOptions = {
  scale?: number;
  opacity?: number;
  translateY?: number;
  translateX?: number;
};

type TransitionOptions = {
  duration?: number;
  easing?: string;
  delay?: number;
};

type PresetName = 'bounce' | 'pulse' | 'shake' | 'spin';

let keyframeCounter = 0;

/**
 * Animation System
 *
 * Utilities for creating beautiful, performant animations
 */
export class AnimationSystem {
  /**
   * Fade in animation
   */
  static fadeIn(options: AnimationOptions = {}): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.ease,
      delay = 0,
      willChange = false,
    } = options;

    let css = `
      opacity: 0;
      animation: fadeIn ${duration}ms ${easing} ${delay}ms forwards;
    `;

    if (willChange) {
      css += `will-change: opacity;`;
    }

    css += `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;

    return css;
  }

  /**
   * Fade out animation
   */
  static fadeOut(options: AnimationOptions = {}): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.ease,
      delay = 0,
      willChange = false,
    } = options;

    let css = `
      opacity: 1;
      animation: fadeOut ${duration}ms ${easing} ${delay}ms forwards;
    `;

    if (willChange) {
      css += `will-change: opacity;`;
    }

    css += `
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;

    return css;
  }

  /**
   * Slide up animation
   */
  static slideUp(options: SlideOptions = {}): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.easeOut,
      delay = 0,
      distance = 20,
      gpu = false,
    } = options;

    const transform = gpu
      ? `translate3d(0, ${distance}px, 0)`
      : `translateY(${distance}px)`;

    const transformEnd = gpu ? 'translate3d(0, 0, 0)' : 'translateY(0)';

    let css = `
      transform: ${transform};
      transition: transform ${duration}ms ${easing} ${delay}ms;
    `;

    if (gpu) {
      css += `backface-visibility: hidden;`;
    }

    css += `
      @keyframes slideUp {
        from { transform: ${transform}; }
        to { transform: ${transformEnd}; }
      }
    `;

    return css;
  }

  /**
   * Slide down animation
   */
  static slideDown(options: SlideOptions = {}): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.easeOut,
      delay = 0,
      distance = 20,
      gpu = false,
    } = options;

    const transform = gpu
      ? `translate3d(0, -${distance}px, 0)`
      : `translateY(-${distance}px)`;

    const transformEnd = gpu ? 'translate3d(0, 0, 0)' : 'translateY(0)';

    let css = `
      transform: ${transform};
      transition: transform ${duration}ms ${easing} ${delay}ms;
    `;

    if (gpu) {
      css += `backface-visibility: hidden;`;
    }

    css += `
      @keyframes slideDown {
        from { transform: ${transform}; }
        to { transform: ${transformEnd}; }
      }
    `;

    return css;
  }

  /**
   * Slide left animation
   */
  static slideLeft(options: SlideOptions = {}): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.easeOut,
      delay = 0,
      distance = 20,
      gpu = false,
    } = options;

    const transform = gpu
      ? `translate3d(${distance}px, 0, 0)`
      : `translateX(${distance}px)`;

    const transformEnd = gpu ? 'translate3d(0, 0, 0)' : 'translateX(0)';

    let css = `
      transform: ${transform};
      transition: transform ${duration}ms ${easing} ${delay}ms;
    `;

    if (gpu) {
      css += `backface-visibility: hidden;`;
    }

    css += `
      @keyframes slideLeft {
        from { transform: ${transform}; }
        to { transform: ${transformEnd}; }
      }
    `;

    return css;
  }

  /**
   * Slide right animation
   */
  static slideRight(options: SlideOptions = {}): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.easeOut,
      delay = 0,
      distance = 20,
      gpu = false,
    } = options;

    const transform = gpu
      ? `translate3d(-${distance}px, 0, 0)`
      : `translateX(-${distance}px)`;

    const transformEnd = gpu ? 'translate3d(0, 0, 0)' : 'translateX(0)';

    let css = `
      transform: ${transform};
      transition: transform ${duration}ms ${easing} ${delay}ms;
    `;

    if (gpu) {
      css += `backface-visibility: hidden;`;
    }

    css += `
      @keyframes slideRight {
        from { transform: ${transform}; }
        to { transform: ${transformEnd}; }
      }
    `;

    return css;
  }

  /**
   * Scale in animation
   */
  static scaleIn(options: ScaleOptions = {}): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.easeOut,
      delay = 0,
      from = 0,
      to = 1,
    } = options;

    const css = `
      transform: scale(${from});
      transition: transform ${duration}ms ${easing} ${delay}ms;
      @keyframes scaleIn {
        from { transform: scale(${from}); }
        to { transform: scale(${to}); }
      }
    `;

    return css;
  }

  /**
   * Scale out animation
   */
  static scaleOut(options: ScaleOptions = {}): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.easeIn,
      delay = 0,
      from = 1,
      to = 0,
    } = options;

    const css = `
      transform: scale(${from});
      transition: transform ${duration}ms ${easing} ${delay}ms;
      @keyframes scaleOut {
        from { transform: scale(${from}); }
        to { transform: scale(${to}); }
      }
    `;

    return css;
  }

  /**
   * Rotate animation
   */
  static rotate(options: RotateOptions): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.ease,
      delay = 0,
      degrees,
      gpu = false,
    } = options;

    let css = `
      transform: rotate(${degrees}deg);
      transition: transform ${duration}ms ${easing} ${delay}ms;
    `;

    if (gpu) {
      css += `backface-visibility: hidden;`;
    }

    css += `
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(${degrees}deg); }
      }
    `;

    return css;
  }

  /**
   * Spring physics configuration
   */
  static spring(options: SpringOptions = {}): SpringConfig {
    const { preset, stiffness, damping, mass } = options;

    if (preset) {
      const presets = {
        gentle: { stiffness: 120, damping: 14, mass: 1 },
        wobbly: { stiffness: 180, damping: 12, mass: 1 },
        stiff: { stiffness: 210, damping: 20, mass: 1 },
      };
      return {
        type: 'spring',
        ...presets[preset],
      };
    }

    return {
      type: 'spring',
      stiffness: stiffness ?? 170,
      damping: damping ?? 26,
      mass: mass ?? 1,
    };
  }

  /**
   * Generate keyframe animation
   */
  static keyframes(steps: KeyframeStep[]): string {
    const animationName = `anim_${keyframeCounter++}`;
    let keyframesCSS = `@keyframes ${animationName} {`;

    steps.forEach((step, index) => {
      const offset = step.offset !== undefined ? step.offset : index / (steps.length - 1);
      const percentage = Math.round(offset * 100);

      keyframesCSS += `${percentage}% {`;

      Object.entries(step).forEach(([key, value]) => {
        if (key !== 'offset') {
          keyframesCSS += `${key}: ${value};`;
        }
      });

      keyframesCSS += `}`;
    });

    keyframesCSS += `}`;
    return keyframesCSS;
  }

  /**
   * Combine multiple animations
   */
  static combine(animations: string[]): string {
    return animations.join('\n');
  }

  /**
   * Sequence animations with delays
   */
  static sequence(items: AnimationSequenceItem[]): AnimationSequenceItem[] {
    return items;
  }

  /**
   * Generate stagger delays for list animations
   */
  static stagger(
    count: number,
    delayBetween: number,
    options: StaggerOptions = {}
  ): number[] {
    const { startDelay = 0, reverse = false } = options;
    const delays: number[] = [];

    for (let i = 0; i < count; i++) {
      const delay = startDelay + i * delayBetween;
      delays.push(delay);
    }

    return reverse ? delays.reverse() : delays;
  }

  /**
   * Hover animation
   */
  static hover(options: HoverOptions): string {
    const { scale, opacity, translateY, translateX } = options;
    const transforms: string[] = [];

    if (scale !== undefined) {
      transforms.push(`scale(${scale})`);
    }
    if (translateX !== undefined) {
      transforms.push(`translateX(${translateX}px)`);
    }
    if (translateY !== undefined) {
      transforms.push(`translateY(${translateY}px)`);
    }

    let css = `
      transition: all ${DesignTokens.animation.duration.fast}ms ${DesignTokens.animation.easing.ease};
    `;

    if (transforms.length > 0) {
      css += `transform: ${transforms.join(' ')};`;
    }

    if (opacity !== undefined) {
      css += `opacity: ${opacity};`;
    }

    return css;
  }

  /**
   * Tap/active animation
   */
  static tap(options: HoverOptions): string {
    const { scale } = options;
    const transforms: string[] = [];

    if (scale !== undefined) {
      transforms.push(`scale(${scale})`);
    }

    let css = `
      transition: transform ${DesignTokens.animation.duration.fast}ms ${DesignTokens.animation.easing.ease};
    `;

    if (transforms.length > 0) {
      css += `transform: ${transforms.join(' ')};`;
    }

    return css;
  }

  /**
   * Transition utility
   */
  static transition(
    properties: string | string[],
    options: TransitionOptions = {}
  ): string {
    const {
      duration = DesignTokens.animation.duration.normal,
      easing = DesignTokens.animation.easing.ease,
      delay = 0,
    } = options;

    const props = Array.isArray(properties) ? properties : [properties];
    const transitionString = props
      .map((prop) => `${prop} ${duration}ms ${easing} ${delay}ms`)
      .join(', ');

    return `transition: ${transitionString};`;
  }

  /**
   * Animation presets
   */
  static preset(name: PresetName): string {
    const presets = {
      bounce: `
        transform: scale(1);
        animation: bounce 0.6s ease-in-out;
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `,
      pulse: `
        transform: scale(1);
        animation: pulse 2s ease-in-out infinite;
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `,
      shake: `
        transform: translateX(0);
        animation: shake 0.5s ease-in-out;
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `,
      spin: `
        transform: rotate(0deg);
        animation: spin 1s linear infinite;
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `,
    };

    return presets[name];
  }
}
