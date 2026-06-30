# DEC-20260701-005: Use Google Sheets as operational storage

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Decision

The private Google Sheet is the operational source of truth for `Songs`, `Performances`, and `ChangeLog`.

## Rationale

- Current scale is below 100 songs.
- Non-engineers can inspect and recover data in Sheets.
- Apps Script can batch read/write with `getValues()` and `setValues()`.

## Consequences

- The code validates headers and parses JSON cells defensively.
- Write operations use `LockService`, versions, and `clientRequestId` idempotency.

