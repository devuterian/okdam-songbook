# Design

## Design System

The app uses a restrained product UI. Scene: a phone held in a dim karaoke room, needing crisp song lookup without visual noise.

## Color Palette

```css
:root {
  --color-bg: oklch(1 0 0);
  --color-surface: oklch(0.975 0.006 255.9);
  --color-surface-strong: oklch(0.94 0.012 255.9);
  --color-ink: oklch(0.19 0.018 255.9);
  --color-muted: oklch(0.45 0.024 255.9);
  --color-primary: oklch(0.48 0.135 255.9);
  --color-primary-strong: oklch(0.38 0.13 255.9);
  --color-accent: oklch(0.62 0.16 155);
  --color-danger: oklch(0.55 0.17 28);
  --color-warning: oklch(0.72 0.14 82);
  --color-success: oklch(0.57 0.13 152);
}
```

Dark mode uses a pure near-black base with cobalt as the main action color and green only for success/status accents.

## Typography

Use the platform sans stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Keep product headings fixed-size, not fluid. Use numeric tabular alignment for TJ numbers.

## Components

- Sticky search header with compact controls.
- Dense song cards with TJ number, title, artist, country, key, status, and recent performance state.
- Bottom sheets for details and filters.
- Admin forms use native inputs, segmented controls, and clear disabled/loading states.
- Snackbar for undo and sync feedback.

## Layout

Mobile first, max content width 760px for public views and 1040px for admin. Avoid nested cards. The primary list is scrollable content under a sticky header.

## Motion

Use 150-220ms transitions for sheets, snackbars, and state feedback. Respect `prefers-reduced-motion`.

