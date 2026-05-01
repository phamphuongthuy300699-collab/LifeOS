# Master Product Spec

## Vision
LifeOS is a personal operating system for daily execution: `Inbox -> Plan -> Execute -> Review`.

## Core Domains
- Auth and identity.
- Inbox triage (email/task/capture/note/event).
- Tasks and planning.
- Calendar and deadlines.
- Workout and session tracking.
- Nutrition and daily intake.
- Projects and milestones.

## Core Flow
- Capture incoming signals.
- Triage into task/event/note actions.
- Assign due/scheduled context.
- Execute from Today.
- Review at end of day.

## Current Product Boundary
- Production-ready core is personal workflow.
- Collaboration, advanced PM, and AI automation are out of current MVP boundary.

## Hard Constraints
- All real data persists in PostgreSQL.
- OAuth providers are integrated via backend APIs only.
- No hidden demo behavior in real mode.
