# DEC-20260701-003: Separate public and admin screens

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Decision

Public read workflows live under `/songbook/`; authenticated management workflows live under `/songbook/admin/`.

## Rationale

- Public karaoke lookup should stay fast and low-friction.
- Admin controls need login, role feedback, forms, conflict handling, and audit history.
- Separation keeps accidental write controls out of the public lookup flow.

## Consequences

- The SPA and GitHub Pages fallback must support both routes.
- Admin UI still cannot be treated as security by hiding controls; the server remains the authority.

