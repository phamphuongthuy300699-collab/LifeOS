# Security changes — 2026-10-11

## Immediate mitigations in this branch
- Request context requires verified JWT + matching workspace membership. All x-user-id/fallback mechanisms have been removed from the resolver, including development.
- Google login uses one-time browser-bound HttpOnly, SameSite=Lax cookies for random OAuth state and PKCE S256 verifier. User-controlled `userId` / `upgrade` linking is rejected rather than relinking third-party identity to arbitrary users.
- Email HTML is rendered as inert plain text in the browser; the application no longer mounts untrusted email markup. Rich email formatting is temporarily reduced to prevent XSS.
- Unit tests cover state/PKCE generation and inert HTML transformation.

## Release blockers (verify before merging)
1. Run both unit suites and API/web typecheck via the PR CI.
2. Verify Google login end-to-end on the actual domain, including callback cookie path, HTTPS and production environment variables.
3. Run a two-user isolation test for all Growth routes and verify unauthenticated requests receive 401.
4. Verify an attacker-controlled HTML email cannot execute scripts, inline event handlers or JavaScript URLs.
5. Validate sessions and migrations against a staging database.
6. Verify the redesigned mobile and desktop navigation in browser, including keyboard focus and contrast.

## Deliberately not in scope
- Full HttpOnly refresh-token session architecture and token rotation.
- Refactoring all API transactions and sync deduplication.
- Feature additions, finance/AI modules, or migration changes.
- Automatic production deployment or merges.

The security changes are strong initial mitigations, not a substitute for a staging penetration test.
