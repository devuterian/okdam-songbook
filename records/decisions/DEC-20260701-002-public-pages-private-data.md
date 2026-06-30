# DEC-20260701-002: Use a public static frontend on GitHub Free

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Decision

The GitHub Pages frontend is public and contains no private data, allowed emails, or secrets. Private data remains in Google Sheets behind Apps Script.

## Rationale

- GitHub Free Pages is suitable for a public static artifact.
- Private Pages is not assumed for this project.
- Link sharing and `noindex` reduce discovery but are not security controls.

## Consequences

- Public read APIs may expose the current non-deleted song list to anyone with the app/API URL.
- All sensitive write paths require server-side Google ID token verification and allowlist checks.

