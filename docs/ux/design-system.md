# LifeOS — Editorial neo-brutalism (October 2026)

## Creative direction
LifeOS is a modern editorial utility for designers and makers, not a school dashboard.
Dynamic large headlines, asymmetric page grids, substantial borders, offset shadows,
precise microtype and accessible motion. Preserve the existing functionality.

## Design tokens
- Ink: `#111111`
- Paper: `#F5F5F0`
- Acid lime (primary action): `#D7FF3F`
- Electric blue (navigation / planning): `#4763FF`
- Bright coral (attention / highlights): `#FF6863`

## Typography
- Body: **Manrope** (Cyrillic + Latin), with system font fallback.
- Display: **Unbounded** (Cyrillic + Latin), with system fallback.
- Display headings may be uppercase, tight tracked, and 2–6rem on desktop.
- Editorial micro-labels are compact, uppercase, heavy, and letter-spaced.

## Components
- Panels: 2px high-contrast border; 14–20px radius; 4–6px offset shadow.
- Buttons: pill silhouette, 2px border; acid lime primary, outline secondary.
- Navigation: bold wordmark and concise desktop links; dark mobile dock with lime active tab.
- Interactive states: hover translation, clear keyboard focus ring; reduced-motion support.
- Data content: readable left-aligned Manrope; don't squeeze dense forms into display typography.

## Accessibility and safety
- Maintain focus indicators and semantic labels; do not use visual icon as only label.
- All motion respects `prefers-reduced-motion`.
- Dynamic dates are computed on the client to avoid static or stale header labels.
- Never mount untrusted email HTML inside the app DOM.

## Rollout
Shared tokens and shell update all routes. Today has an editorial dashboard layout;
Inbox, Calendar, Workout and Nutrition use refreshed headings, colors and controls.
Remaining secondary pages inherit the design tokens and component styling.
