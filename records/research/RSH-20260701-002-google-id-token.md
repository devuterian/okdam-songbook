# RSH-20260701-002: Google ID token verification

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Sources

- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- https://oauth2.googleapis.com/tokeninfo

## Findings

- A server must verify ID token signature and claims before trusting identity.
- Required checks include audience, issuer, expiration, and `email_verified`.
- Apps Script does not provide a first-party Google Auth library runtime like Node, so this implementation calls Google's token info endpoint through `UrlFetchApp` and then validates claims against Script Properties.

## Applied To

The Apps Script `verifyGoogleIdToken` helper rejects missing, expired, wrong-audience, wrong-issuer, and unverified-email tokens before allowlist lookup.

