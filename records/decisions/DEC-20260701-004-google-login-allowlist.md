# DEC-20260701-004: Use Google login plus server allowlist

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Decision

Admin login uses Google Identity Services ID tokens. Apps Script verifies the token and maps the verified email to a role from `ALLOWED_USERS_JSON` in Script Properties.

## Rationale

- The frontend must not ship the allowed email list.
- Client-sent email, name, or role values are not trusted.
- Every write request can be rechecked server side.

## Consequences

- The OAuth client ID must be configured both in the frontend and Apps Script Script Properties.
- Apps Script must verify issuer, audience, expiration, and `email_verified` before role lookup.

