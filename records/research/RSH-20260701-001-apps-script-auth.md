# RSH-20260701-001: Apps Script web app authentication and permissions

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Sources

- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/reference/properties/properties-service

## Findings

- Apps Script Web Apps expose `doGet(e)` and `doPost(e)` entry points.
- Deployment chooses who executes the app and who can access it; this must be set during Apps Script deployment, not inferred in code.
- Script Properties are the right place for `SPREADSHEET_ID`, OAuth client ID, allowed users JSON, origins, and provider keys.

## Applied To

The backend keeps a single action-based API and reads sensitive runtime configuration from Script Properties.

