# RSH-20260701-007: Sheets quotas and concurrent writes

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Sources

- https://developers.google.com/apps-script/guides/services/quotas
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://developers.google.com/apps-script/reference/spreadsheet/range#getValues()
- https://developers.google.com/apps-script/reference/spreadsheet/range#setValues(Object)

## Findings

- Apps Script quotas can change and should not be treated as unlimited.
- Sheet access should batch reads and writes with `getValues()` and `setValues()`.
- Writes need `LockService` to reduce race conditions.

## Applied To

The Apps Script source reads rows in batches, maps columns by header, uses versions for conflicts, and wraps writes in a document lock.

