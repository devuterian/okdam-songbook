# DEC-20260701-008: Use soft delete and ChangeLog recovery

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Decision

Song removal defaults to deletion candidate or soft delete. Owner-only hard delete is explicit and logged. ChangeLog records before/after payloads for undo and recovery.

## Rationale

- Karaoke data is small and human-curated.
- Mistakes are more likely than storage pressure.
- Editors should not permanently delete data.

## Consequences

- Public lists exclude deletion candidates and deleted songs.
- Admin lists can expose deletion candidates and recovery controls by role.

