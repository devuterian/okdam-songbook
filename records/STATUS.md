# Songbook Status

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Snapshot

- Last updated: 2026-07-01
- Overall posture: `active`
- Current focus: Initial implementation complete; production account binding remains.
- Highest-priority blocker: Real Google OAuth, Apps Script, and Sheet deployment require operator-owned external accounts.
- Next operator decision needed: Provide production GitHub owner/repo, OAuth client ID, Apps Script deployment URL, Sheet ID, and allowed user emails.
- Related decisions: DEC-20260701-001 through DEC-20260701-008

## Current State Summary

Repo-template 1.1.3 has been applied from `LPFchan/repo-template` commit `73f357b741854008a5fb1d61144f02bf518226a0`, and local hooks are installed. The repository now contains a React/Vite PWA workspace, shared TypeScript domain logic, Apps Script source structure, deployment workflow, and setup docs. External account setup is still required for a real end-to-end production smoke test.

## Active Tracks

### Web App

- Goal: Public and admin Songbook PWA.
- Status: `complete locally`
- Current work: React/Vite PWA is implemented with mock mode, public catalog, admin shell, IndexedDB cache, offline queue, PWA manifest, and service worker generation.
- Exit criteria: Passed locally on 2026-07-01 KST.

### Apps Script Backend

- Goal: Sheet-backed API with server-side auth and role checks.
- Status: `source complete; external deployment pending`
- Current work: Deployable Apps Script source, manifest, clasp example, Sheet setup helper, role allowlist auth, and API docs are in place.
- Exit criteria: Operator deploys Apps Script, sets Script Properties, and runs `setupSpreadsheet()`.

### Operations

- Goal: Repo-template-compliant records and commit flow.
- Status: `ready for generated commit`
- Current work: SPEC, STATUS, PLANS, decisions, research, docs, workflow, and hooks are in place.
- Exit criteria: Final commit uses `scripts/new-commit-message.sh` and passes hooks.

## Verification

- `npm run lint`: passed on 2026-07-01 KST.
- `npm run typecheck`: passed on 2026-07-01 KST.
- `npm run test`: passed on 2026-07-01 KST.
- `npm run build`: passed on 2026-07-01 KST.
- `npm audit --omit=dev`: passed with `found 0 vulnerabilities` on 2026-07-01 KST.
- Local smoke: `/songbook/` and `/songbook/admin/` returned Vite HTML from `http://127.0.0.1:5173`.

## Active Blockers And Risks

- External Google deployment cannot be completed locally.
  - Effect: Production OAuth and Sheet operations cannot be verified end to end in this turn.
  - Owner: Operator.
  - Mitigation: Mock mode, documented setup, and Apps Script source are provided.
