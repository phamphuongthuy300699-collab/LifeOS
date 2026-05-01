# Sprint 007 Tasks

## 1. Internal calendar list view
- Implement `/calendar` segmented view: today, overdue, 7 days, events.
- Consume `/api/v1/calendar/today`, `/upcoming`, `/overdue`, `/events`.

## 2. Task planning actions
- Inbox task quick actions: `Plan Today`, `Due +1d`, `Set Due Date`, `Complete`.
- Ensure query invalidation for inbox/today/calendar/tasks.

## 3. Task detail due/scheduled
- Task detail supports editing `dueAt`, `scheduledStartAt`, `scheduledEndAt`.
- Reschedule and complete actions show clear feedback.

## 4. Today integration
- Today shows overdue tasks, due today tasks, scheduled tasks, and day events.
- Completed tasks disappear from active buckets.

## 5. Google Calendar read sync
- Add `POST /api/v1/calendar/google/sync` manual sync.
- Import/update events in DB without duplicates.

## 6. Provider-ready Yandex abstraction
- Keep provider abstraction in contracts and domain model.
- Avoid Google-only UX branching.

## 7. Analyze pass
- Fill `analyze.md` with requirement-to-implementation mapping.
- Mark gaps and remaining acceptance items.
