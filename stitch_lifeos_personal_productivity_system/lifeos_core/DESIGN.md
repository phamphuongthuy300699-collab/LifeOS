---
name: LifeOS Core
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434657'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747688'
  outline-variant: '#c4c5da'
  surface-tint: '#0046fa'
  primary: '#0035c5'
  on-primary: '#ffffff'
  primary-container: '#0047ff'
  on-primary-container: '#d4d9ff'
  inverse-primary: '#b9c3ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#8d1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b82800'
  on-tertiary-container: '#ffd1c6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001257'
  on-primary-fixed-variant: '#0033c0'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#ffb4a2'
  on-tertiary-fixed: '#3d0700'
  on-tertiary-fixed-variant: '#8a1c00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.12em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

This design system is built on the duality of **Order vs Power**. It targets high-performers who require a disciplined environment to manage the chaos of daily life. The aesthetic bridges the gap between high-end Swiss minimalism and futuristic interfaces, evoking a sense of calm control and latent energy.

The visual style is **Minimalist-Futuristic**. It utilizes expansive white space (or "black space" in dark mode) to create a high-clarity environment where data is the protagonist. Sophistication is achieved through precise alignment, mathematical rhythm, and a "light-emitting" approach to accents. The emotional response is one of surgical focus—removing the friction of decision-making through a rigorous, high-contrast visual hierarchy.

## Colors

The palette is engineered to shift from "Clarity" in light mode to "Intensity" in dark mode. 

- **Light Mode:** Focuses on an "Off-White & Indigo" aesthetic. The background uses a subtle cool gray (`#F8FAFC`) to reduce eye strain, while pure white surfaces provide elevation. The primary blue is deep and electric, providing a sharp focal point against the muted surroundings.
- **Dark Mode:** Transitions to a "Deep Charcoal & Glow" aesthetic. The base is an ultra-deep navy-black. Primary accents utilize the same hex codes but appear to "emit light" through the use of outer glows and higher saturation against dark backgrounds.
- **Russian Typography Note:** Use high contrast for Cyrillic characters (at least 7:1) to ensure legibility of complex letterforms like *ж, щ, ш*.

## Typography

The system uses **Inter** for its utilitarian precision and excellent Cyrillic support. **Space Grotesk** is introduced sparingly for labels and technical data to reinforce the futuristic, disciplined tone.

- **Cyrillic Optimization:** Line heights are increased by 10% compared to standard Latin presets to account for the vertical density of the Russian alphabet.
- **Hierarchy:** Strong contrast between bold headers and regular body text is mandatory. 
- **Letter Spacing:** Generous tracking is applied to all-caps labels (`label-caps`) to ensure they act as structural anchors rather than just text.

## Layout & Spacing

This design system utilizes a **Fixed-Fluid Hybrid Grid**. On mobile, it follows a 4-column system; on desktop/tablet, it scales to a 12-column fixed grid (max-width 1440px).

The spacing rhythm is strictly based on a **4px incremental scale**. 
- **Tap Targets:** Minimum height of 48px is enforced for all interactive elements to ensure high-velocity interaction without errors.
- **Negative Space:** Use `xl` (40px) or larger gaps between major content blocks to evoke the "premium/ordered" feel. Avoid information density; prioritize "one thought per section."

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surface Tiering:** In Dark Mode, the background is the lowest level (`#020617`). Cards sit on top at `#0F172A`. This creates a sense of physical stacking without needing blur.
- **Glassmorphism:** Reserved exclusively for navigation bars and floating action modals. Use a 20px background blur with a 10% white border (Light Mode) or 10% indigo border (Dark Mode).
- **Outlines:** Use 1px solid borders for cards. In Light Mode, use `#E2E8F0`. In Dark Mode, use `#1E293B`.

## Shapes

The shape language is **Disciplined and Geometric**. 

The base roundedness is set to `Soft` (4px). This provides just enough approachable softness to feel modern while maintaining a sharp, professional edge. 
- **Buttons:** 4px radius. 
- **Cards:** 8px radius (`rounded-lg`).
- **Input Fields:** 4px radius.
- **Large Action Containers:** 12px radius (`rounded-xl`).

Avoid pill-shapes or fully rounded circles except for notification badges and progress rings.

## Components

- **Buttons:** Primary buttons use the electric blue background with white text. In Dark Mode, add a 0 0 15px indigo outer glow on hover to simulate "powering up."
- **Inputs:** High-visibility states. When focused, the border transitions from gray to the primary accent, and the label (in Space Grotesk) shifts color. Use placeholder text in a light gray to maintain clarity.
- **Cards:** Clean, flat surfaces with 1px borders. No shadows by default; apply a subtle 10% opacity shadow only when a card is "lifted" during a drag interaction.
- **List Items:** Generous vertical padding (16px). Each item should be separated by a hairline divider.
- **Progress Bars:** Thin (4px) and high-contrast. Use gradients only for active states (Indigo to Cyan).
- **Iconography:** Use 2px stroke-based icons. Avoid filled icons unless indicating an active toggle state. Icons must be mathematically centered within 24x24px boxes.
- **Product-Specific Components:** 
    - *The Focus Timer:* A large-scale circular display with minimal ticks.
    - *Task Strips:* Ultra-slim horizontal components that stack vertically to form a "timeline" view.