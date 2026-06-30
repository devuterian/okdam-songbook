# DEC-20260701-007: Editors publish songs immediately

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Decision

Songs added by editor users are visible immediately when saved, without owner approval.

## Rationale

- The user group is small and trusted.
- Approval would slow down the karaoke-room workflow.
- ChangeLog and soft delete provide recovery.

## Consequences

- Editor actions must still be audited.
- Owner retains hard-delete and user-management authority.

