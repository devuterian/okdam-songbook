# Songbook Status

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Snapshot

- Last updated: 2026-07-01
- Overall posture: `active`
- Current focus: 115 imported OK DAM songs now use structured `performerIds` instead of legacy recommender memo text.
- Highest-priority blocker: Real Apps Script and Sheet deployment require operator-owned Google resources.
- Next operator decision needed: Provide Apps Script deployment URL, Sheet ID, and allowed user emails.
- Related decisions: DEC-20260701-001 through DEC-20260701-008

## Personal page CSV import (2026-07-01)

- Source files: `/Users/marie/Downloads/개인 페이지 & 공유된 페이지/OK DAM!! 3 56a5080d79c147c1915776897acaee2f_all.csv` (full data, 119 data rows) and the header-swapped sibling CSV (same body, different column order).
- Outcome: 115 inserted, 4 skipped (TJ number duplicates — 배불러 46528, 기억해요 16928, Tik Tak Tok 84434, NO PAIN 82200), 6 warnings (4 `남` base-mode-only rows preserved with original; `-1?-2?` and `+3<` kept as-is).
- Artifacts: `packages/shared/src/sample.ts` (auto-generated 115-song seed), `apps-script/seed/songs.json` (Apps Script payload), `apps-script/seed/import-report.json` (summary).
- Backend hook: new `importCsvSongs(payload)` in `apps-script/src/Code.js` is idempotent and dedupes by TJ number and `(title, artist)`. Production requires `ALLOW_CSV_IMPORT=true`.
- Verification: `npm run lint`, `npm run typecheck`, `npm run test` (18/18), `npm run build` all pass. Vite dev server on `http://127.0.0.1:5182/okdam-songbook/` returned 200 and served the new 115-song sample module.

## Performer migration (2026-07-01)

- Data model: `Song.performerIds` and Sheet `performerIdsJson` are now the structured source for who will sing a song.
- Built-in performers: `marie` (마리), `seongwook` (성욱), `yeowool` (여울).
- Legacy aliases: `뽀냐` imports and migrates to `marie` plus `yeowool`; `seonguk` and `yeoul` are accepted only as legacy misspellings and normalize to `seongwook` and `yeowool`.
- Seed outcome: 115/115 imported songs have performer IDs; 23 legacy `뽀냐` rows became `["marie", "yeowool"]`; 0 unknown performer names; 0 empty performer rows.
- Apps Script: `setupSpreadsheet()` appends `performerIdsJson`, `upsertSong` validates performer IDs, and `migrateRecommendersToPerformers({ dryRun })` migrates existing Sheet rows idempotently.

## Current State Summary

Repo-template 1.1.3 has been applied from `LPFchan/repo-template` commit `73f357b741854008a5fb1d61144f02bf518226a0`, and local hooks are installed. The repository now contains a React/Vite PWA workspace, shared TypeScript domain logic, Apps Script source structure, deployment workflow, and setup docs. The public GitHub repository is `https://github.com/devuterian/okdam-songbook`, and GitHub Pages is enabled at `https://devuterian.github.io/okdam-songbook/`. Google Cloud project `okdam-songbook` has an external-test OAuth configuration and web client, with the GitHub Actions `VITE_GOOGLE_CLIENT_ID` variable set. Apps Script and Sheet setup are still required for a real end-to-end production smoke test.

## Active Tracks

### Web App

- Goal: Public and admin Songbook PWA.
- Status: `complete locally`
- Current work: React/Vite PWA is implemented with mock mode, public catalog, admin shell, IndexedDB cache, offline queue, PWA manifest, and service worker generation. Production Pages uses the `/okdam-songbook/` base path.
- Exit criteria: Passed locally on 2026-07-01 KST.

### Apps Script Backend

- Goal: Sheet-backed API with server-side auth and role checks.
- Status: `source complete; external deployment pending`
- Current work: Deployable Apps Script source, manifest, clasp example, Sheet setup helper, role allowlist auth, and API docs are in place.
- Exit criteria: Operator deploys Apps Script, sets Script Properties, and runs `setupSpreadsheet()`.

### Operations

- Goal: Repo-template-compliant records and commit flow.
- Status: `published to GitHub`
- Current work: Public GitHub repository and Pages workflow are connected.
- Exit criteria: Google production settings remain before full production smoke.

## Verification

- `npm run lint`: passed on 2026-07-01 KST.
- `npm run typecheck`: passed on 2026-07-01 KST.
- `npm run test`: passed on 2026-07-01 KST.
- `npm run build`: passed on 2026-07-01 KST.
- `npm run lint`: passed after `/okdam-songbook/` base-path update on 2026-07-01 KST.
- `npm run typecheck`: passed after `/okdam-songbook/` base-path update on 2026-07-01 KST.
- `npm run test`: passed after `/okdam-songbook/` base-path update on 2026-07-01 KST.
- `npm run build`: passed after `/okdam-songbook/` base-path update on 2026-07-01 KST.
- `npm audit --omit=dev`: passed with `found 0 vulnerabilities` on 2026-07-01 KST.
- Local smoke: `/songbook/` and `/songbook/admin/` returned Vite HTML from `http://127.0.0.1:5173`.
- GitHub repository: `https://github.com/devuterian/okdam-songbook` created and pushed on 2026-07-01 KST.
- GitHub Pages: Actions-backed Pages enabled at `https://devuterian.github.io/okdam-songbook/` on 2026-07-01 KST.
- Google OAuth: Google Cloud project, external-test consent screen, web OAuth client, authorized JavaScript origins, test user, and GitHub Actions `VITE_GOOGLE_CLIENT_ID` variable configured on 2026-07-01 KST.
- UI smoke direction: Filter UI now uses a mobile bottom sheet and a centered desktop modal capped near 560px, chosen over a desktop bottom sheet because it keeps the public catalog column stable and avoids an over-wide sheet on large screens.
- `npm run lint`: passed after 115-song CSV import on 2026-07-01 KST.
- `npm run typecheck`: passed after 115-song CSV import on 2026-07-01 KST.
- `npm run test`: 18/18 passed after 115-song CSV import on 2026-07-01 KST.
- `npm run build`: passed after 115-song CSV import on 2026-07-01 KST.
- Local smoke: `http://127.0.0.1:5182/okdam-songbook/` returned Vite HTML, and `sample.ts` served 115 generated songs.

## Active Blockers And Risks

- Apps Script and Sheet deployment are still pending.
  - Effect: Production Sheet operations cannot be verified end to end yet.
  - Owner: Operator.
  - Mitigation: OAuth client, mock mode, documented setup, and Apps Script source are provided.
