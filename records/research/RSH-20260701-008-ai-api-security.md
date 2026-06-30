# RSH-20260701-008: AI and image analysis security structure

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Sources

- https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app
- https://developers.google.com/apps-script/guides/properties

## Findings

- External AI calls from Apps Script should use `UrlFetchApp` with provider keys stored in Script Properties.
- The frontend should not receive provider API keys.
- AI outputs need schema validation and human confirmation before saving.
- Image inputs should be resized client-side and not stored permanently by default.

## Applied To

The backend defines mock, unconfigured, and provider AI adapters. The admin UI surfaces AI output as editable candidates, not automatic writes.

