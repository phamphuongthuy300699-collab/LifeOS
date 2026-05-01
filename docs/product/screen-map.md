# Screen Map

## Main Navigation
- `/today`: execution dashboard.
- `/inbox`: unified triage center.
- `/workout`: workout plans and preview.
- `/nutrition`: goals, meals, daily summary.
- `/more`: settings, integrations, secondary modules.

## Supporting Screens
- `/mail`: technical mail route (detail and sync support).
- `/mail/:id` or `/mail/[id]`: email detail and triage actions.
- `/tasks/:id`: task detail, scheduling, subtasks, milestone links.
- `/calendar`: today/overdue/7d/events planning view.
- `/workout/session/:id`: active workout mode.
- `/projects`: projects list.

## Auth Screens
- `/auth/google/callback`: web token finalization after API OAuth callback.

## Notes
- User-facing inbox entry point is `/inbox`.
- Calendar icon from top app bar routes to `/calendar`.
