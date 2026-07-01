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

## Production Binding (2026-07-01)

- Apps Script project `1Pzp6evn-Oh-hTcp6lowody9egge0k8TiChYBaWpRzKvP8IrEcWPR8yJ1` is bound to the owner Google account and the clasp login is stored at `~/.clasprc.json`.
- Google Sheet `Okdam Songbook Data` (private) is at `1VU3ad7z19J92V18DKmqVNzfpRzCKywXKxmXoD3EscgM`.
- Script Properties (`SPREADSHEET_ID`, `GOOGLE_OAUTH_CLIENT_ID`, `ALLOWED_USERS_JSON`, `ALLOWED_ORIGINS=https://devuterian.github.io`, `APP_ENV=production`, `ALLOW_CSV_IMPORT=true`) are saved; production must flip `ALLOW_CSV_IMPORT` back to `false` after import.
- Apps Script code is pushed via clasp. New server-side `cancelPerformance` handler + `/exec` route are live in the pushed source. New `db.ts` offline-queue row type now supports `performance:cancel` payloads.
- Frontend mock fallback hardened: `api.ts` now exports `mockMode` and `productionMisconfigured`. Production with `VITE_ENABLE_MOCK_API=false` and an empty `VITE_APPS_SCRIPT_API_URL` fails loudly instead of silently serving `sampleSongs`.
- AdminPage now fetches `/exec?action=publicData` when not in mock mode; `sampleSongs` is no longer the source of truth in production.
- PublicPage now wires the toast "취소" button to `cancelPerformance`, with offline-queue fallback for the cancel action.
- GitHub Actions: `VITE_GOOGLE_CLIENT_ID` is registered; `VITE_APPS_SCRIPT_API_URL` is intentionally empty until the operator completes the Apps Script Web App deploy.
- `docs/ops-checklist-2026-07-01.md` records the exact Sheet ID / Script ID / OAuth client ID / Variable state and the operator-only steps that follow.

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
- `npm run lint`: passed after production-binding mock/seed hardening (mockMode + productionMisconfigured) on 2026-07-01 KST.
- `npm run typecheck`: passed after production-binding mock/seed hardening on 2026-07-01 KST.
- `npm run test`: 32/32 passed (web 8/8 + shared 24/24) after production-binding mock/seed hardening on 2026-07-01 KST.
- `npm run build`: passed after production-binding mock/seed hardening on 2026-07-01 KST.
- Local smoke: `http://127.0.0.1:5182/okdam-songbook/` returned Vite HTML, and `sample.ts` served 115 generated songs.

## Live Production Bind (2026-07-01)

- Apps Script Web App deployed at `https://script.google.com/macros/s/AKfycbzjsFNu3vY0YSX3pTNRK5xDK3MVOwOxV76i5L52iQy2SoCxDOJsXQZ-i4IaKuBN6qz0/exec` (deployment ID `AKfycbzjsFNu3vY0YSX3pTNRK5xDK3MVOwOxV76i5L52iQy2SoCxDOJsXQZ-i4IaKuBN6qz0 @2`).
- `setupSpreadsheet()` ran in the editor; `Songs` / `Performances` / `ChangeLog` sheets exist.
- New editor-only helper `importSeedSongsOnce()` is in `apps-script/src/Code.js` and the 115-song payload is in `apps-script/src/seedSongs.gs`. Operator ran it; Logger reported `inserted=115, totalSongsAfter=115, marie+yeowool=23`, and the function flipped `ALLOW_CSV_IMPORT` to `false`.
- GitHub Actions Variable `VITE_APPS_SCRIPT_API_URL` is registered. Pages workflow sets `VITE_ENABLE_MOCK_API=false`, so the next Pages build will hit the real `/exec` URL.
- `VITE_GOOGLE_CLIENT_ID` was already registered. The owner Google account is in `ALLOWED_USERS_JSON` with `role: owner`.

## Active Blockers And Risks

- Live `/exec?action=publicData` is wired end-to-end; remaining work is browser-side smoke (network shape, owner login, create/cancel performance, song add/restore) which the operator will run from the deployed site after the Pages rebuild.

## Auth state unification (2026-07-01)

- `apps/web/src/lib/auth/AuthContext.tsx` now owns the Google ID credential
  in memory only. The provider re-authenticates on every write call so the
  public "오늘 불렀습니다" flow no longer reuses an expired or missing token.
- All write APIs (`upsertSong`, `createPerformance`, `cancelPerformance`,
  `analyzeYouTube`, `generateReading`) flow through `requireValidCredential()`.
  When the server returns `UNAUTHORIZED` / `FORBIDDEN`, the cached credential
  is dropped and the next write forces a re-auth.
- `apps/web/src/lib/googleIdentity.ts` loads the GIS script exactly once and
  shares the singleton with the admin login button. `AdminPage` and
  `PublicPage` mount inside a single `AuthProvider` at the app root.
- `api.ts` exposes `isApiAuthError()` so React pages can branch on
  UNAUTHORIZED without parsing server messages.
- Display-only data (email + name) is persisted in `sessionStorage` and
  surfaces a "다시 로그인 필요" pill in the public header so we never imply
  the user is signed in without a fresh credential.
- Shared helpers `isJwtExpired` / `jwtExpiresAt` / `decodeJwtPayload` live in
  `packages/shared/src/auth/jwt.ts` and are reused by the AuthProvider.
- Vitest setup forces `VITE_ENABLE_MOCK_API=false` so `apps/web/src/lib/api.ts`
  is exercised against the mocked fetch surface. PublicPage/AdminPage tests
  re-enable the mock branch for backwards-compatible assertions.
- Verification: `npm run lint` clean, `npm run typecheck` clean,
  `npm run test` 53/53 (web 15/15 + shared 38/38), `npm run build` produces
  a fresh `index-Doi1asXn.js` PWA bundle.

## ChatGPT Action OAuth integration (2026-07-01)

- Cloudflare Worker `songbook-chatgpt-proxy` is deployed at `https://songbook-chatgpt-proxy.iam-marierie.workers.dev`.
- Worker OAuth endpoints are live: `/authorize` redirects to Google OAuth, `/token` returns ChatGPT Action bearer credentials, and `/api/gptSearchSongs`, `/api/gptCheckDuplicate`, `/api/gptAddSong` forward only allowlisted Google users to Apps Script.
- Custom GPT `Okdam Songbook Assistant` is saved at `https://chatgpt.com/g/g-6a451de53b6c819196b0060d51bbe18e-okdam-songbook-assistant` with link-only sharing, OAuth auth, the public privacy policy, and the three Songbook actions.
- Actual ChatGPT OAuth callback IDs observed during preview are allowlisted in Worker vars for both `chatgpt.com` and `chat.openai.com`.
- Apps Script deployment `AKfycbzjsFNu3vY0YSX3pTNRK5xDK3MVOwOxV76i5L52iQy2SoCxDOJsXQZ-i4IaKuBN6qz0` is updated to version 9 and web app access is `Anyone`; internal writes still require `INTERNAL_PROXY_SECRET` and actor metadata from the Worker.
- E2E preview smoke passed: `searchSongs` returned 92 matches for `a`; `checkDuplicate` returned no duplicate for the smoke title; `addSong` inserted `Codex OAuth Smoke Test 20260701 2318` with id `1636081d-ea78-4cca-aa6c-b6be7f952ed1`, allowlisted owner actor, `sourceType=chatgpt`, and `sourceReference=chatgpt-action`.
- Sheet verification: `/exec?action=publicData` returned 116 songs including the smoke song with `performerIds=["marie"]`; the `ChangeLog` sheet contains the smoke song afterJson with the ChatGPT Action source and actor metadata.
