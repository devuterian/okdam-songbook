# Songbook Spec

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

- Project: Songbook
- Project id: `songbook`
- Canonical repo: https://github.com/devuterian/okdam-songbook
- Operator: Marie
- Last updated: 2026-07-01
- Related decisions: DEC-20260701-001 through DEC-20260701-008

## Project Thesis

Songbook is a mobile-first karaoke favorite-song manager. It helps a small trusted group quickly search TJ karaoke numbers, titles, artists, Korean readings for Japanese songs, recommended keys, notes, and recent singing history.

## Main Surfaces

- Public GitHub Pages PWA under `/okdam-songbook/`.
- Authenticated admin route under `/okdam-songbook/admin/`.
- Google Apps Script Web App API.
- Private Google Sheets workbook with `Songs`, `Performances`, and `ChangeLog` sheets.
- Repo-local docs and records for deployment, security, data model, and operations.

## Core Capabilities

- Dense mobile song list with TJ number priority and no album art.
- Search by TJ number, title, artist, aliases, Korean reading, romanization, genre, country, original work, and memo.
- Filter and sort by common karaoke workflows.
- Bottom sheet song details with performance history and `오늘 불렀습니다!`.
- Offline first read cache with IndexedDB and queued performance writes.
- Google Identity Services login for admin UI, with server-side token and allowlist checks.
- Owner/editor role matrix enforced by Apps Script.
- Song CRUD, deletion candidate, soft delete, restore, owner hard delete, ChangeLog, undo, CSV import/export, JSON backup.
- AI helper adapters for Korean reading generation, image extraction, and YouTube analysis, with safe manual fallback.

## Invariants

- The Google Sheet is the operational source of truth.
- GitHub repo JSON is not the production data store.
- Secrets and allowed emails are never bundled into the frontend.
- Frontend email comparison is never the authority for writes.
- ID tokens are verified server side before authenticated operations.
- `noindex` and link obscurity are documented as discoverability reduction, not access control.
- Apps Script and GitHub Pages constraints are documented in research records before architecture decisions rely on them.
