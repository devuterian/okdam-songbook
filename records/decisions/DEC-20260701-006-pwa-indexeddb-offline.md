# DEC-20260701-006: Use PWA, IndexedDB, and offline queues

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Decision

The web app is an installable PWA. It caches the app shell through the service worker and stores song snapshots plus queued performance writes in IndexedDB.

## Rationale

- Karaoke rooms can have unreliable network.
- A first successful sync should make read access resilient.
- Performance logging is the only offline write path required for the first version.

## Consequences

- Add/edit/import remain online-only.
- Queued performance writes carry `clientRequestId` to avoid duplicate records.

