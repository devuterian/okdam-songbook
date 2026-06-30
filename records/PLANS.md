# Songbook Plans

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Approved Directions

### Initial Working Product

- Outcome: A deployable GitHub Pages PWA with typed shared logic and Apps Script backend source.
- Why this is accepted: It satisfies the GitHub Free constraint while keeping private operational data in Google Sheets.
- Expected value: Immediate local/mock usage and clear path to production deployment.
- Preconditions: Repo-template adoption and research artifacts.
- Earliest likely start: now.
- Related ids: DEC-20260701-001, DEC-20260701-002

### External Production Binding

- Outcome: Connect real OAuth client, Apps Script Web App URL, private Sheet, and allowed users.
- Why this is accepted: Real writes and admin auth require operator-owned Google resources.
- Expected value: Full end-to-end deployment.
- Preconditions: Operator creates or grants access to Google and GitHub settings.
- Earliest likely start: after initial build passes.
- Related ids: RSH-20260701-001, RSH-20260701-002

## Sequencing

### Near Term

- Initiative: Complete implementation and local verification.
  - Status: `done`
  - Why now: It removed repo-local blockers and produced a buildable GitHub Pages PWA.
  - Dependencies: complete.
  - Related ids: DEC-20260701-001 through DEC-20260701-008

### Mid Term

- Initiative: Deploy Apps Script and Pages with production env values.
  - Status: `waiting on operator-owned external settings`
  - Why later: Needs external account values.
  - Dependencies: OAuth client, Script Properties, Sheet ID, Pages settings.
  - Related ids: RSH-20260701-001 through RSH-20260701-008

### Deferred But Accepted

- Initiative: Real AI provider smoke tests.
  - Why deferred: Requires provider API key and operator acceptance of cost/privacy tradeoffs.
  - Revisit trigger: `AI_PROVIDER` and `AI_API_KEY` are configured.
  - Related ids: DEC-20260701-008
