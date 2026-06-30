# RSH-20260701-006: PWA service worker and subpath

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Sources

- https://vite-pwa-org.netlify.app/
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest

## Findings

- Manifest `scope` and `start_url` must match the deployment subpath.
- Service worker registration must be generated relative to the Vite base path.
- Runtime app data should live in IndexedDB rather than the service worker cache.

## Applied To

`vite-plugin-pwa` is configured with `/songbook/` scope/start URL and the app stores song snapshots and offline queue entries via Dexie.

