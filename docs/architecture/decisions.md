# Architecture Decisions

## AD-001 Modular Monolith
- API is one deployable service (`Hono`) with domain route modules.
- Decision reason: fast delivery with clear boundaries and lower ops overhead.

## AD-002 Strict Request Context
- Real routes resolve user/workspace from JWT.
- Header auth/fallback is restricted and not used for production user flows.

## AD-003 PostgreSQL as Source of Truth
- Real mode reads and writes through DB-backed APIs.
- Local/demo storage is only optional fallback in demo mode.

## AD-004 Unified Inbox Projection
- `/api/v1/inbox` aggregates across domains into one triage stream.
- Avoid separate user mental models per source.

## AD-005 Provider-ready Integrations
- External integrations follow provider abstraction.
- Google first implementation, Yandex-ready schema/logic path.

## AD-006 Mutation Observability
- Write endpoints include `requestId` for support/debug.
- Frontend surfaces error and success explicitly.

## AD-007 Sprint Completion Rule
- Sprint completion requires acceptance verification evidence, not code presence only.
