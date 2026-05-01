# Sprint 007 — Calendar & Planning MVP

## Goal
Deliver stable planning flow:
`Inbox -> Task/Event -> Due/Scheduled -> Today/Calendar`.

## In Scope
- Internal calendar list view (`today`, `overdue`, `next 7 days`, `events`).
- Task planning actions from inbox and task detail.
- Task due/scheduled updates reflected in today/calendar slices.
- Manual Google Calendar read sync into internal events table.
- Provider-ready model for future Yandex calendar integration.

## Out of Scope
- Two-way Google Calendar writes.
- Full Yandex calendar implementation.
- Month grid, drag-and-drop.
- Recurring tasks, AI scheduling.

## Required UX Behavior
- User can plan task directly from inbox actions.
- User can set or move due/scheduled from task detail.
- Today shows overdue + scheduled + events consistently.
- Calendar screen is actionable, not decorative.

## Required Stability Behavior
- Every write action returns requestId.
- Every write action shows visible error/success.
- Every successful write refetches affected views.
- No real-mode silent fallback writes.
