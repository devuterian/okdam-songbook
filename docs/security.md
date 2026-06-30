# Security

## What is protected

Writes are protected by server-side Google ID token verification and an allowlist in Apps Script Script Properties.

The frontend never bundles:

- allowed emails
- AI keys
- Sheet ID
- Script Properties

## What is not protected

The static GitHub Pages app is public. `robots.txt`, `noindex`, and unlisted URLs reduce discovery only. They are not authentication.

## Token verification

Apps Script verifies Google ID tokens through Google's token info endpoint and checks:

- audience
- issuer
- expiration
- `email_verified`
- allowlisted email and role

The server ignores client-sent role or email values.

## AI and images

AI providers are called only from Apps Script. AI output is treated as an editable candidate and must pass schema validation before save. Images are not stored in GitHub or Sheets by default.

