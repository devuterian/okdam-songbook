# RSH-20260701-003: Apps Script CORS and request constraints

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Sources

- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/content

## Findings

- Apps Script Web Apps are not general Express-style servers.
- The implementation should avoid relying on arbitrary HTTP status/header control.
- JSONP-like GET patterns are not suitable for authenticated writes; POST body responses must carry structured `ok`, `error.code`, and `requestId`.

## Applied To

The frontend API adapter treats the JSON body as authoritative and does not rely on custom status codes. Origin checks are optional defense-in-depth and never replace token checks.

