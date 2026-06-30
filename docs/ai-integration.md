# AI Integration

AI helpers are server-mediated.

## Adapters

- `mock`: returns safe deterministic placeholders.
- `unconfigured`: returns `AI_NOT_CONFIGURED` or manual fallback.
- provider adapter: calls a configured endpoint with `AI_API_KEY`.

## Supported tasks

- Korean reading generation.
- YouTube metadata candidate extraction.
- Image/song extraction contract for future UI wiring.

AI results are never auto-saved. The user reviews and edits candidate fields first.

