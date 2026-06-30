# RSH-20260701-005: SPA refresh behavior on GitHub Pages

Opened: 2026-07-01 00-00-00 KST
Recorded by agent: codex-orchestrator

## Sources

- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages

## Findings

- GitHub Pages can serve a custom `404.html`.
- Static SPA direct refresh under nested routes can otherwise resolve to 404.
- A copied `404.html` fallback is the simplest route-preserving approach for `/songbook/admin/`.

## Applied To

The build script copies `dist/index.html` to `dist/404.html` after Vite build.

