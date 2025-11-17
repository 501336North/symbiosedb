# @symbiosedb/design-system

**Apple-inspired minimalist design system for building beautiful SymbioseDB interfaces.**

A complete design system with tokens, themes, components, and animations inspired by the world's best designed products: Apple, Linear, Stripe, Arc Browser, and Vercel.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://www.npmjs.com/package/@symbiosedb/design-system)
[![Tests](https://img.shields.io/badge/tests-123%20passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

---

## Why @symbiosedb/design-system?

**Beautiful UI in Minutes, Not Weeks.**

```typescript
import { DesignTokens, ThemeEngine, ComponentStyles } from '@symbiosedb/design-system';

// Get design tokens
const primaryColor = DesignTokens.getColor('primary', '500');
const spacing = DesignTokens.getSpacing(4); // 16px

// Apply theme
const theme = new ThemeEngine();
theme.setMode('dark');
const cssVars = theme.getCSSVariables();

// Use component styles
const buttonCSS = ComponentStyles.button('primary', { size: 'md' });
```

No need to build a design system from scratch. Just import and build.

---

## ✨ Features

### Design Philosophy
- ✨ **Whitespace = Luxury** - Generous spacing creates elegance
- 🎨 **Subtle Animations** - 150ms/250ms/350ms timing for polish
- 📏 **Consistent Spacing** - 4px base unit creates rhythm
- 🔤 **System Fonts** - SF Pro / Inter for clarity
- 💫 **Blur & Transparency** - Depth through layers
- 🎯 **Micro-Interactions** - Delight in details

### Core Features
- 🎨 **Design Tokens** - Colors, spacing, typography, shadows
- 🌗 **Theme Engine** - Dark/light/auto modes with event system
- 🧩 **Component Library** - Buttons, inputs, cards, modals, typography
- 🎬 **Animation System** - Fade, slide, scale, rotate with spring physics
- 📱 **Responsive** - Mobile-first with consistent breakpoints
- ♿ **Accessible** - WCAG AAA high contrast support

### Technical Features
- 🎯 **CSS-in-JS** - Generate CSS strings from tokens
- 📦 **Zero Dependencies** - Pure TypeScript implementation
- 🔧 **Type-Safe** - Full TypeScript definitions
- 🎨 **CSS Variables** - Runtime theming support
- 🚀 **Tree-Shakeable** - Import only what you need
- 📖 **Well Documented** - Comprehensive JSDoc comments

---

## 📦 Installation

```bash
# npm
npm install @symbiosedb/design-system

# yarn
yarn add @symbiosedb/design-system

# pnpm
pnpm add @symbiosedb/design-system
```

**Requirements:**
- TypeScript >= 5.0.0
- Zero runtime dependencies

---

## 🚀 Quick Start

### 1. Design Tokens

```typescript
import { DesignTokens } from '@symbiosedb/design-system';

// Colors
const primary = DesignTokens.getColor('primary', '500'); // #3b82f6
const text = DesignTokens.getColor('neutral', '900');   // #171717

// Spacing (4px base unit)
const padding = DesignTokens.getSpacing(4);  // 16px
const margin = DesignTokens.getSpacing(8);   // 32px

// Typography
const baseFont = DesignTokens.fonts.sans;         // SF Pro, Inter, system-ui...
const fontSize = DesignTokens.fontSizes.base;     // 1rem
const fontWeight = DesignTokens.fontWeights.medium; // 500

// Shadows (Apple-style subtle)
const shadow = DesignTokens.shadows.sm; // 0 1px 2px rgba(0, 0, 0, 0.05)

// Border radius
const radius = DesignTokens.borderRadius.md; // 0.375rem (6px)
```

### 2. Theme Engine

```typescript
import { ThemeEngine } from '@symbiosedb/design-system';

// Create theme engine
const theme = new ThemeEngine();

// Set mode (dark/light/auto)
theme.setMode('dark');

// Get current theme
const currentTheme = theme.getCurrentTheme();
console.log(currentTheme.colors.background); // #0a0a0a (true black for OLED)
console.log(currentTheme.colors.text.primary); // #fafafa (off-white)

// Generate CSS variables
const cssVars = theme.getCSSVariables();
/*
  --color-background: #0a0a0a;
  --color-surface: #171717;
  --color-text-primary: #fafafa;
  --spacing-4: 16px;
  --font-size-base: 1rem;
*/

// Listen for theme changes
theme.on('themeChange', ({ mode, theme }) => {
  console.log(`Theme changed to ${mode}`);
  document.documentElement.style.cssText = Object.entries(cssVars)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
});

// Toggle theme
theme.toggle(); // dark → light → dark
```

### 3. Component Styles

```typescript
import { ComponentStyles } from '@symbiosedb/design-system';

// Button
const primaryButton = ComponentStyles.button('primary', { size: 'md' });
/*
  backgroundColor: #3b82f6
  color: #ffffff
  padding: 0.625rem 1.25rem
  borderRadius: 0.375rem
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1)
*/

// Input
const input = ComponentStyles.input({ error: false, focus: false });

// Card
const card = ComponentStyles.card({ variant: 'elevated', hoverable: true });

// Typography
const heading = ComponentStyles.heading(1); // H1 styling
const text = ComponentStyles.text({ variant: 'primary' });

// Layout
const flexRow = ComponentStyles.flex({
  direction: 'row',
  align: 'center',
  justify: 'space-between'
});
```

### 4. Animation System

```typescript
import { AnimationSystem } from '@symbiosedb/design-system';

// Fade animation
const fade = AnimationSystem.fadeIn({ duration: 250, easing: 'ease-out' });
/*
  animation: fadeIn 250ms ease-out
  opacity: 0 → 1
  will-change: opacity
*/

// Slide with GPU acceleration
const slide = AnimationSystem.slideUp({ distance: 20, gpu: true });
/*
  transform: translate3d(0, 20px, 0) → translate3d(0, 0, 0)
  backface-visibility: hidden (smoother animation)
*/

// Spring physics (Apple-like)
const spring = AnimationSystem.spring({ preset: 'gentle' });
// { stiffness: 120, damping: 14, mass: 1 }

// Stagger animations (Linear/Stripe style)
const delays = AnimationSystem.stagger(5, 50); // [0, 50, 100, 150, 200]ms

// Hover effect
const hover = AnimationSystem.hover({ scale: 1.05, translateY: -2 });

// Preset animations
const bounce = AnimationSystem.preset('bounce');
const pulse = AnimationSystem.preset('pulse');
```

---

## 🎨 Design Tokens Reference

### Colors

**10-shade palettes for maximum flexibility:**

```typescript
// Primary (Sophisticated Blue)
DesignTokens.colors.primary[50]   // #eff6ff (lightest)
DesignTokens.colors.primary[500]  // #3b82f6 (brand color)
DesignTokens.colors.primary[900]  // #1e3a8a (darkest)

// Neutral (Refined Grays)
DesignTokens.colors.neutral[50]   // #fafafa
DesignTokens.colors.neutral[500]  // #737373
DesignTokens.colors.neutral[900]  // #171717

// Semantic Colors
DesignTokens.colors.success[500]  // #10b981 (green)
DesignTokens.colors.error[500]    // #ef4444 (red)
DesignTokens.colors.warning[500]  // #f59e0b (orange)
DesignTokens.colors.info[500]     // #3b82f6 (blue)
```

### Spacing

**4px base unit with consistent scale (0-64):**

```typescript
DesignTokens.getSpacing(0)   // 0px
DesignTokens.getSpacing(1)   // 4px
DesignTokens.getSpacing(2)   // 8px
DesignTokens.getSpacing(4)   // 16px
DesignTokens.getSpacing(8)   // 32px
DesignTokens.getSpacing(16)  // 64px
```

### Typography

```typescript
// Font Families
DesignTokens.fonts.sans      // -apple-system, SF Pro, Inter, system-ui...
DesignTokens.fonts.mono      // SF Mono, Monaco, monospace

// Font Sizes
DesignTokens.fontSizes.xs    // 0.75rem (12px)
DesignTokens.fontSizes.sm    // 0.875rem (14px)
DesignTokens.fontSizes.base  // 1rem (16px)
DesignTokens.fontSizes.lg    // 1.125rem (18px)
DesignTokens.fontSizes.xl    // 1.25rem (20px)
DesignTokens.fontSizes['2xl'] // 1.5rem (24px)
DesignTokens.fontSizes['4xl'] // 2.25rem (36px)

// Font Weights
DesignTokens.fontWeights.normal   // 400
DesignTokens.fontWeights.medium   // 500
DesignTokens.fontWeights.semibold // 600
DesignTokens.fontWeights.bold     // 700
```

### Shadows

**Apple/Linear-style subtle elevations:**

```typescript
DesignTokens.shadows.sm  // 0 1px 2px rgba(0, 0, 0, 0.05)
DesignTokens.shadows.md  // 0 4px 6px rgba(0, 0, 0, 0.07)
DesignTokens.shadows.lg  // 0 10px 15px rgba(0, 0, 0, 0.1)
DesignTokens.shadows.xl  // 0 20px 25px rgba(0, 0, 0, 0.15)
```

---

## 💡 Examples

### Example 1: Complete Button Component

```typescript
import { DesignTokens, ComponentStyles, AnimationSystem } from '@symbiosedb/design-system';

function Button({ variant = 'primary', size = 'md', children, disabled = false }) {
  const baseStyles = ComponentStyles.button(variant, { size, disabled });
  const hoverAnimation = AnimationSystem.hover({ scale: disabled ? 1 : 1.02 });

  return (
    <button
      style={{
        ...baseStyles,
        ...hoverAnimation,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: DesignTokens.fonts.sans,
        fontWeight: DesignTokens.fontWeights.medium,
      }}
    >
      {children}
    </button>
  );
}
```

### Example 2: Dark Mode Toggle

```typescript
import { ThemeEngine } from '@symbiosedb/design-system';

function App() {
  const [theme] = useState(() => new ThemeEngine());

  useEffect(() => {
    // Apply theme on mount
    applyTheme(theme);

    // Listen for changes
    const handleChange = ({ mode, theme: currentTheme }) => {
      applyTheme(theme);
    };

    theme.on('themeChange', handleChange);
    return () => theme.removeListener('themeChange', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    theme.toggle();
  };

  return (
    <div>
      <button onClick={toggleTheme}>
        Toggle Theme (Current: {theme.getMode()})
      </button>
    </div>
  );
}

function applyTheme(theme: ThemeEngine) {
  const cssVars = theme.getCSSVariables();
  Object.entries(cssVars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}
```

### Example 3: Animated Card Grid

```typescript
import { ComponentStyles, AnimationSystem, DesignTokens } from '@symbiosedb/design-system';

function CardGrid({ items }) {
  const cardStyles = ComponentStyles.card({ variant: 'elevated', hoverable: true });
  const gridStyles = ComponentStyles.grid({ columns: 3, gap: 'lg' });

  return (
    <div style={gridStyles}>
      {items.map((item, index) => {
        const fadeIn = AnimationSystem.fadeIn({ delay: index * 50 });
        const slideUp = AnimationSystem.slideUp({ distance: 10 });

        return (
          <div
            key={item.id}
            style={{
              ...cardStyles,
              ...fadeIn,
              animation: `${fadeIn.animation}, ${slideUp.animation}`,
            }}
          >
            <h3 style={ComponentStyles.heading(3)}>{item.title}</h3>
            <p style={ComponentStyles.text({ variant: 'secondary' })}>
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
```

### Example 4: Form with Design System

```typescript
import { ComponentStyles, DesignTokens } from '@symbiosedb/design-system';

function LoginForm() {
  const [errors, setErrors] = useState({});

  const inputStyle = (hasError) => ComponentStyles.input({
    error: hasError,
    focus: false
  });

  const labelStyle = ComponentStyles.formLabel();
  const buttonStyle = ComponentStyles.button('primary', { size: 'lg' });

  return (
    <form style={ComponentStyles.formGroup()}>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          style={inputStyle(errors.email)}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p style={ComponentStyles.formHelperText({ error: true })}>
            {errors.email}
          </p>
        )}
      </div>

      <div style={{ marginTop: DesignTokens.getSpacing(4) }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          style={inputStyle(errors.password)}
        />
      </div>

      <button
        type="submit"
        style={{
          ...buttonStyle,
          marginTop: DesignTokens.getSpacing(6),
          width: '100%'
        }}
      >
        Sign In
      </button>
    </form>
  );
}
```

### Example 5: Staggered List Animation

```typescript
import { AnimationSystem, ComponentStyles } from '@symbiosedb/design-system';

function NotificationList({ notifications }) {
  const delays = AnimationSystem.stagger(notifications.length, 75);

  return (
    <div>
      {notifications.map((notification, index) => {
        const fadeIn = AnimationSystem.fadeIn({ delay: delays[index] });
        const slideRight = AnimationSystem.slideRight({ distance: 20, delay: delays[index] });

        return (
          <div
            key={notification.id}
            style={{
              ...ComponentStyles.card({ variant: 'outlined' }),
              marginBottom: '12px',
              opacity: 0,
              animation: `${fadeIn.animation}, ${slideRight.animation}`,
              animationFillMode: 'forwards'
            }}
          >
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 📚 API Reference

### DesignTokens

Static utility class for accessing design tokens.

**Methods:**
- `getColor(palette, shade)` - Get color from palette
- `getSpacing(multiplier)` - Calculate spacing (multiplier × 4px)
- `getBreakpoint(size)` - Get responsive breakpoint

**Properties:**
- `colors` - Color palettes (primary, neutral, success, error, warning, info)
- `spacing` - Spacing scale object
- `fonts` - Font family definitions
- `fontSizes` - Font size scale
- `fontWeights` - Font weight values
- `shadows` - Shadow definitions
- `borderRadius` - Border radius values
- `breakpoints` - Responsive breakpoints
- `zIndex` - Z-index layers

### ThemeEngine

Manages theme switching and CSS variable generation.

**Constructor:**
```typescript
new ThemeEngine(mode?: 'light' | 'dark' | 'auto')
```

**Methods:**
- `setMode(mode)` - Set theme mode
- `getMode()` - Get current mode
- `toggle()` - Toggle between light/dark
- `getCurrentTheme()` - Get current theme object
- `getCSSVariables()` - Generate CSS custom properties
- `isDark()` / `isLight()` - Check current mode
- `toJSON()` / `fromJSON(json)` - Serialize/deserialize

**Events:**
- `themeChange` - Emitted when theme changes

### ComponentStyles

Static utility class for component CSS-in-JS.

**Methods:**
- `button(variant, options)` - Button styles
- `input(options)` - Input field styles
- `card(options)` - Card container styles
- `modal` - Modal styles (overlay, content)
- `heading(level)` - Typography heading styles
- `text(options)` - Typography paragraph styles
- `flex(options)` - Flexbox layout
- `grid(options)` - Grid layout
- `spacing(options)` - Margin/padding utilities

### AnimationSystem

Static utility class for animations.

**Methods:**
- `fadeIn/fadeOut(options)` - Fade animations
- `slideUp/slideDown/slideLeft/slideRight(options)` - Slide animations
- `scaleIn/scaleOut(options)` - Scale animations
- `rotate(options)` - Rotation animation
- `spring(options)` - Spring physics config
- `stagger(count, delay, options)` - Stagger delays
- `hover/tap(options)` - Gesture animations
- `keyframes(frames)` - Custom keyframes
- `preset(name)` - Preset animations (bounce, pulse, shake, spin)

---

## 🐛 Troubleshooting

### Issue 1: Colors Not Updating on Theme Change

**Problem:**
Colors remain the same after calling `theme.setMode()`.

**Solution:**
Apply CSS variables to DOM:

```typescript
theme.on('themeChange', () => {
  const cssVars = theme.getCSSVariables();
  Object.entries(cssVars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
});
```

### Issue 2: Animations Not Working

**Problem:**
Animations don't play in browser.

**Solution:**
Ensure animation CSS is applied and keyframes are injected:

```typescript
const animation = AnimationSystem.fadeIn();

// ✅ Apply animation property
element.style.animation = animation.animation;

// ✅ Inject keyframes if using custom animations
const keyframesCSS = AnimationSystem.keyframes([...]);
const style = document.createElement('style');
style.textContent = keyframesCSS;
document.head.appendChild(style);
```

### Issue 3: TypeScript Errors with Component Styles

**Problem:**
```
Type 'string' is not assignable to type 'CSSProperties'
```

**Solution:**
ComponentStyles returns CSS strings, not React style objects:

```typescript
// ❌ Wrong (React inline styles)
<div style={ComponentStyles.button('primary')}>

// ✅ Correct (Apply as CSS string)
<div style={{ ...JSON.parse(ComponentStyles.button('primary')) }}>

// ✅ Better (Use with styled-components or emotion)
const Button = styled.button`
  ${ComponentStyles.button('primary')}
`;
```

---

## 🔗 Related Packages

- **[@symbiosedb/studio-ui](../studio-ui)** - Uses this design system
- **[@symbiosedb/core](../core)** - Core database functionality

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test design-tokens.test.ts
npm test theme-engine.test.ts
npm test component-library.test.ts
npm test animation-system.test.ts
```

**Test Coverage:** 123/123 tests passing (100%)

---

## 📄 License

MIT © [SymbioseDB](https://github.com/symbiosedb/symbiosedb)

---

**Built with ❤️ by the SymbioseDB team**
