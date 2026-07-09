# Tetris

A neon-styled, fully client-side Tetris built with plain HTML/CSS/JS — no build step, no dependencies, no backend.

## Files
- `index.html` — page structure and styles
- `tetris.js` — game logic and rendering (canvas-based board, DOM-based side panels)

## Run locally
Just open `index.html` in a browser, or serve the folder with any static file server:

```
npx serve .
```

## Deploy

### GitHub Pages
1. Push this folder's contents to a repo.
2. Repo Settings → Pages → set source to the branch/root.

### Vercel
1. `vercel` from this folder, or import the repo in the Vercel dashboard.
2. No build command or framework preset needed — it's a static site (root directory containing `index.html`).

## Data & privacy
The game stores two values in the browser's `localStorage`, scoped to whatever origin it's deployed on:
- `tetris-best` — high score (integer)
- `tetris-muted` — sound preference (`'0'`/`'1'`)

No cookies, no analytics, no network calls except loading Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`) over HTTPS. No API keys or secrets anywhere in the code.
