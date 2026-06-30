# Songbook Status

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Snapshot

- Last updated: 2026-07-01
- Overall posture: `active`
- Current focus: GitHub repository, Pages, and Google OAuth client are connected; Apps Script and Sheet production binding remain.
- Highest-priority blocker: Real Apps Script and Sheet deployment require operator-owned Google resources.
- Next operator decision needed: Provide Apps Script deployment URL, Sheet ID, and allowed user emails.
- Related decisions: DEC-20260701-001 through DEC-20260701-008

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

## Active Blockers And Risks

- Apps Script and Sheet deployment are still pending.
  - Effect: Production Sheet operations cannot be verified end to end yet.
  - Owner: Operator.
  - Mitigation: OAuth client, mock mode, documented setup, and Apps Script source are provided.
