# Tetris Browser Game — Product & Design Specification

**Version:** 1.0  
**Platform:** Modern Web Browsers (Desktop First)

## Overview

Create a polished browser-based implementation of Tetris with responsive controls, smooth animations, and faithful gameplay.

## Core Gameplay

- 10×20 visible board with 2 hidden spawn rows (10×22 internal grid)
- Seven standard tetrominoes (I, O, T, S, Z, J, L)
- Super Rotation System (SRS)
- 7-bag randomizer
- Hold piece
- Ghost piece
- Next queue (5 pieces)
- Soft drop / hard drop
- Pause and restart

## Board

| Property | Value |
|---|---|
| Width | 10 columns |
| Visible Height | 20 rows |
| Hidden Rows | 2 |
| Internal Grid | 10 × 22 |

## Controls

| Key | Action |
|---|---|
| ← / → | Move |
| ↓ | Soft Drop |
| Space | Hard Drop |
| Z | Rotate CCW |
| X | Rotate CW |
| C | Hold |
| P | Pause |
| R | Restart |

## Scoring

| Action | Points |
|---|---:|
| Single | 100 |
| Double | 300 |
| Triple | 500 |
| Tetris | 800 |
| Soft Drop | 1 / cell |
| Hard Drop | 2 / cell |

Multiply all line-clear scores by the current level.

## Levels

- Increase level every 10 cleared lines.
- Increase gravity with each level.

## UI Layout

```text
+-------------------------------------------+
 Hold        Score

             Level
             Lines

+--------- Game Board ---------+

Next

Controls
+-------------------------------------------+
```

## Visual Design

- Background: `#0F1115`
- Board: `#161A22`
- Grid: `#242B36`
- Text: `#F4F4F4`
- Accent: `#4FC3F7`
- Rounded corners: 12px
- Modern flat design

## Animations

- Smooth movement
- Hard-drop trail
- Line clear flash/shrink/fade
- Level-up pulse
- Game-over fade

## Audio

- Move
- Rotate
- Lock
- Hard Drop
- Line Clear
- Level Up
- Game Over
- Mute toggle

## Architecture

```text
Game Engine
 ├── Board
 ├── Piece Manager
 ├── Collision
 ├── Rotation
 ├── Gravity
 ├── Scoring
 ├── Renderer
 ├── Input
 └── UI
```

## Suggested Structure

```text
src/
  game/
  render/
  ui/
  input/
  audio/
  assets/
  styles/
```

## Game State

```ts
interface GameState {
  board: number[][];
  activePiece: Piece;
  holdPiece?: Piece;
  nextQueue: Piece[];
  score: number;
  level: number;
  lines: number;
  paused: boolean;
  gameOver: boolean;
}
```

## Accessibility

- Full keyboard support
- Colorblind palette
- High contrast mode
- Screen reader announcements
- Visible focus states

## Performance

- 60 FPS target
- HTML5 Canvas renderer
- `requestAnimationFrame`
- TypeScript
- Local storage for settings and high scores

## Acceptance Criteria

- Accurate SRS implementation
- Correct 7-bag randomizer
- Hold, ghost piece, next queue, scoring, and gravity function correctly
- Responsive desktop and mobile layouts
- Stable 60 FPS gameplay
