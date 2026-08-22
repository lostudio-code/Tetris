# Tetris — by Lo Studio

A retro 8-bit Tetris built with vanilla HTML, CSS, and Canvas. No build step, no dependencies (fonts load from Google Fonts).

## Play locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Controls

| Key | Action |
| --- | --- |
| ← → | Move |
| ↓ | Soft drop |
| Space | Hard drop |
| Z / X | Rotate |
| C | Hold |
| P | Pause |
| R | Restart |
| M | Sound effects on/off |
| N | Music on/off |

On touch devices an on-screen control row appears automatically.

## Features

- Standard 10×20 field, 7-bag randomizer, ghost piece, hold, next queue
- Level-based speed curve; score, lines, and persistent best score
- Chiptune background music (Korobeiniki, traditional melody) that speeds up with level
- Responsive: board scales to viewport, panels reflow on phones, safe-area aware
- Best score and audio preferences saved to localStorage

## Deploy

### GitHub Pages

1. Push this folder's contents to the repository root (or to `/docs`).
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)` or `/docs`.
3. The site publishes at `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so GitHub serves the files as-is.

### Vercel

`vercel.json` is included for zero-config static hosting — import the repo and deploy, no settings needed.

## Files

- `index.html` — markup, styles, responsive rules
- `tetris.js` — game loop, rendering, input, audio
- `vercel.json` — static hosting config
- `.nojekyll` — GitHub Pages passthrough
