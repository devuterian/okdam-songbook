# DEC-20260701-001: Use GitHub Pages, Google Sheets, and Apps Script

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Decision

Songbook uses GitHub Pages for the static frontend, private Google Sheets for operational data, and Google Apps Script as the backend API.

## Rationale

- The app needs no always-on server.
- Google Sheets matches the existing data-management habit.
- Apps Script can read/write the private Sheet while keeping secrets out of the frontend.
- GitHub Pages fits the GitHub Free hosting constraint for a static PWA.

## Consequences

- The API must be shaped around Apps Script `doGet`/`doPost` constraints.
- Production setup requires operator-owned Google OAuth, Script Properties, Sheet ID, and Apps Script deployment.

