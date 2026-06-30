# RSH-20260701-004: GitHub Pages `/songbook/` subpath deployment

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Sources

- https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Findings

- Project Pages are served under `https://<owner>.github.io/<repo>/`.
- GitHub Actions can upload and deploy a built static artifact to Pages with constrained permissions and concurrency.
- Vite must be configured with `base: "/songbook/"` for script, CSS, manifest, and service worker URLs.

## Applied To

The Vite config uses `VITE_APP_BASE_PATH` defaulting to `/songbook/`, and the GitHub workflow builds `apps/web/dist`.

