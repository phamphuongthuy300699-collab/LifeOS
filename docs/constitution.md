# LifeOS Constitution

## 1. Product and Platform
- `PWA-first`: every core flow must work in web PWA on mobile and desktop.
- `Modular monolith`: one deployable API, domain modules separated by boundaries, shared DB.
- `Single-user first, multi-user ready`: UX optimized for personal use, data model keeps team extension path.

## 2. Data and Scope
- `PostgreSQL is source of truth` for real mode.
- Every user-owned record is `workspace-scoped`.
- Real mode must not silently fall back to demo/localStorage writes.
- Demo fallback is allowed only when `NEXT_PUBLIC_DEMO_MODE=true`.

## 3. Security and Integrations
- OAuth/integration tokens are stored only encrypted.
- AI/Speech access is allowed only through backend gateway APIs.
- Integrations must be provider-ready:
- Google is implemented first.
- Yandex is planned via same provider abstraction, not separate UX model.

## 4. Product Semantics
- `Inbox` is a unified triage stream across sources.
- `Today` is the execution dashboard for current day decisions.
- `Email` is an input source for actions/tasks, not a full mail client replacement.

## 5. API and Mutations
- Every write action must return or expose `requestId`.
- Every write action must show user-visible `error` and `success` state.
- Every successful write action must trigger `refetch/invalidate` of affected queries.
- Every API route declared in code must be mounted in `apps/api/src/app.ts` and smoke-verified.

## 6. Delivery and Acceptance
- A sprint cannot be marked complete without explicit acceptance verification.
- Acceptance verification requires:
- working UI flow;
- persisted PostgreSQL state after refresh;
- failure mode with visible error and requestId.
