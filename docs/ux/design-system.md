# Design System Baseline

## Foundations
- Theme: dark premium by default.
- Surface model: layered cards (`surface`, `surface-container-low`, accent states).
- Action emphasis: rounded buttons, clear primary/secondary hierarchy.

## Components in Active Use
- Top app bar with calendar shortcut.
- Bottom navigation with 5 tabs.
- Unified cards for email/task/event/capture items.
- Status banners for mutation feedback.
- FAB and quick add sheet for capture.

## State UX Requirements
- Loading state for all async views.
- Empty state with next-step CTA.
- Error state with human-readable text.
- Success confirmation after write actions.

## Consistency Rules
- Keep one mental model per domain screen.
- Keep spacing and corner radius consistent across cards.
- Keep action labels verb-first and short.
