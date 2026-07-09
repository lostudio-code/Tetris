(() => {
  'use strict';

  const COLS = 10, ROWS = 22, HIDDEN = 2, CELL = 32;

  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]]
  };
  const COLORS = { I:'#00E5FF', O:'#FFE14D', T:'#E24DFF', S:'#4DFF88', Z:'#FF4D6D', J:'#5C7CFF', L:'#FF9E3D' };
  const KICKS = {
    '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]]
  };
  const I_KICKS = {
    '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
    '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
    '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
    '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
    '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
    '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
    '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
    '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
  };

  class Game {
    constructor() {
      this.boardEl = document.getElementById('board');
      this.holdEl = document.getElementById('hold');
      this.nextEl = document.getElementById('next');
      this.levelEl = document.getElementById('levelVal');
      this.scoreEl = document.getElementById('scoreVal');
      this.linesEl = document.getElementById('linesVal');
      this.bestEl = document.getElementById('bestVal');
      this.muteBtn = document.getElementById('muteBtn');
      this.pauseOverlay = document.getElementById('pauseOverlay');
      this.overOverlay = document.getElementById('overOverlay');
      this.finalScoreEl = document.getElementById('finalScore');
      this.bestTagEl = document.getElementById('bestTag');

      this.audioCtx = null;
      this.dasDir = 0; this.dasTime = 0; this.arrTime = 0;
      this.trail = null;
      this.clearing = null;
      this.lockTimer = -1; this.lockResets = 0;
      this.gravAcc = 0;
      this.softHeld = false;
      this.vis = { x: 3, y: 0 };
      this.rotPulse = 0;
      this.shake = 0;
      this.last = performance.now();
      this.paused = false;
      this.gameOver = false;
      this.started = false;

      this.best = 0;
      this.muted = false;
      try {
        this.best = parseInt(localStorage.getItem('tetris-best') || '0', 10) || 0;
        this.muted = localStorage.getItem('tetris-muted') === '1';
      } catch (e) {}
      this.updateMuteLabel();
      this.bestEl.textContent = this.best;

      this.bindInput();
      this.newGame();
      this.raf = requestAnimationFrame((t) => this.loop(t));
    }

    // ---------- setup ----------
    newGame() {
      this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      this.bag = [];
      this.queue = [];
      while (this.queue.length < 5) this.queue.push(this.drawBag());
      this.hold = null; this.holdUsed = false;
      this.trail = null; this.clearing = null;
      this.gravAcc = 0; this.lockTimer = -1; this.lockResets = 0;
      this.started = true;
      this.paused = false;
      this.gameOver = false;
      this.score = 0; this.level = 1; this.lines = 0;
      this.overOverlay.classList.remove('show');
      this.pauseOverlay.classList.remove('show');
      this.bestTagEl.classList.remove('show');
      this.updateStats();
      this.spawn();
    }
    drawBag() {
      if (this.bag.length === 0) {
        this.bag = ['I','O','T','S','Z','J','L'];
        for (let i = this.bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
      }
      return this.bag.pop();
    }
    spawn(type) {
      const t = type || this.queue.shift();
      while (this.queue.length < 5) this.queue.push(this.drawBag());
      const shape = SHAPES[t].map(r => r.slice());
      const p = { type: t, shape, rot: 0, x: t === 'O' ? 4 : 3, y: 0 };
      this.active = p;
      this.holdUsed = type ? this.holdUsed : false;
      this.lockTimer = -1; this.lockResets = 0; this.gravAcc = 0;
      if (this.collides(p.shape, p.x, p.y)) {
        p.y = -1;
        if (this.collides(p.shape, p.x, p.y)) this.endGame();
      }
      this.vis = { x: p.x, y: p.y - 0.6 };
    }
    endGame() {
      this.started = false;
      this.gameOver = true;
      const nb = this.score > this.best;
      if (nb) {
        this.best = this.score;
        try { localStorage.setItem('tetris-best', String(this.best)); } catch (e) {}
      }
      this.finalScoreEl.textContent = this.score;
      this.bestTagEl.classList.toggle('show', nb);
      this.overOverlay.classList.add('show');
      this.bestEl.textContent = this.best;
      this.sfx('gameover');
    }

    // ---------- mechanics ----------
    collides(shape, px, py) {
      for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const gx = px + x, gy = py + y;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
        if (gy >= 0 && this.grid[gy][gx]) return true;
      }
      return false;
    }
    tryMove(dx, dy) {
      const p = this.active;
      if (!p || this.clearing) return false;
      if (!this.collides(p.shape, p.x + dx, p.y + dy)) {
        p.x += dx; p.y += dy;
        if (dx !== 0 && this.lockTimer >= 0 && this.lockResets < 15) { this.lockTimer = 0; this.lockResets++; }
        return true;
      }
      return false;
    }
    rotate(dir) {
      const p = this.active;
      if (!p || p.type === 'O' || this.clearing) return;
      const n = p.shape.length;
      const rotated = Array.from({ length: n }, () => Array(n).fill(0));
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (dir === 1) rotated[x][n - 1 - y] = p.shape[y][x];
        else rotated[n - 1 - x][y] = p.shape[y][x];
      }
      const from = p.rot, to = (p.rot + dir + 4) % 4;
      const table = p.type === 'I' ? I_KICKS : KICKS;
      const kicks = table[from + '>' + to] || [[0,0]];
      for (const [kx, ky] of kicks) {
        if (!this.collides(rotated, p.x + kx, p.y + ky)) {
          p.shape = rotated; p.rot = to; p.x += kx; p.y += ky;
          if (this.lockTimer >= 0 && this.lockResets < 15) { this.lockTimer = 0; this.lockResets++; }
          this.rotPulse = 140;
          this.sfx('rotate');
          return;
        }
      }
    }
    ghostY() {
      const p = this.active;
      if (!p) return 0;
      let y = p.y;
      while (!this.collides(p.shape, p.x, y + 1)) y++;
      return y;
    }
    hardDrop() {
      const p = this.active;
      if (!p || this.clearing) return;
      const gy = this.ghostY();
      const dist = gy - p.y;
      if (dist > 0) {
        this.trail = { x: p.x, fromY: Math.min(this.vis.y, p.y), toY: gy, shape: p.shape.map(r => r.slice()), color: COLORS[p.type], t: 0 };
      }
      p.y = gy;
      this.vis.x = p.x; this.vis.y = gy;
      this.shake = 120;
      this.addScore(dist * 2);
      this.sfx('harddrop');
      this.lockPiece();
    }
    doHold() {
      if (this.holdUsed || this.clearing || !this.active) return;
      const cur = this.active.type;
      const prev = this.hold;
      this.hold = cur;
      this.holdUsed = true;
      if (prev) this.spawn(prev); else this.spawn();
      this.sfx('move');
    }
    lockPiece() {
      const p = this.active;
      for (let y = 0; y < p.shape.length; y++) for (let x = 0; x < p.shape[y].length; x++) {
        if (p.shape[y][x]) {
          const gy = p.y + y, gx = p.x + x;
          if (gy >= 0) this.grid[gy][gx] = p.type;
        }
      }
      this.active = null;
      let anyVisible = false;
      for (let y = 0; y < p.shape.length; y++) for (let x = 0; x < p.shape[y].length; x++) {
        if (p.shape[y][x] && p.y + y >= HIDDEN) anyVisible = true;
      }
      if (!anyVisible) { this.endGame(); return; }
      const rows = [];
      for (let y = 0; y < ROWS; y++) if (this.grid[y].every(c => c)) rows.push(y);
      if (rows.length) {
        this.clearing = { rows, t: 0 };
        this.sfx('clear', rows.length);
      } else {
        this.sfx('lock');
        this.spawn();
      }
    }
    finishClear() {
      const rows = this.clearing.rows;
      this.clearing = null;
      for (const r of rows) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(COLS).fill(null));
      }
      const pts = [0, 100, 300, 500, 800][rows.length] * this.level;
      const newLines = this.lines + rows.length;
      const newLevel = Math.max(1, Math.floor(newLines / 10) + 1);
      const leveled = newLevel > this.level;
      this.lines = newLines;
      this.level = newLevel;
      this.addScore(pts);
      this.updateStats();
      if (leveled) {
        this.sfx('levelup');
        const el = this.levelEl;
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'lvlpulse 0.55s ease-out';
      }
      this.spawn();
    }
    addScore(n) {
      if (n <= 0) return;
      this.score += n;
      this.updateStats();
    }
    gravityMs() {
      const l = this.level;
      return Math.max(16, Math.pow(0.8 - (l - 1) * 0.007, l - 1) * 1000);
    }
    updateStats() {
      this.scoreEl.textContent = this.score;
      this.levelEl.textContent = this.level;
      this.linesEl.textContent = this.lines;
      this.bestEl.textContent = Math.max(this.best, this.score);
    }

    // ---------- input ----------
    bindInput() {
      window.addEventListener('keydown', (e) => this.keyDown(e));
      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowDown') this.softHeld = false;
        if (e.code === 'ArrowLeft' && this.dasDir === -1) this.dasDir = 0;
        if (e.code === 'ArrowRight' && this.dasDir === 1) this.dasDir = 0;
      });
      window.addEventListener('blur', () => {
        if (!this.gameOver && !this.paused && this.started) this.setPaused(true);
      });
      this.muteBtn.addEventListener('click', () => this.toggleMute());
      document.getElementById('playAgainBtn').addEventListener('click', () => this.newGame());

      const showTouch = window.matchMedia('(pointer: coarse)').matches;
      if (showTouch) document.getElementById('touchRow').classList.add('show');
      const guard = (fn) => () => { if (!this.paused && !this.gameOver) fn(); };
      document.getElementById('tLeft').addEventListener('click', guard(() => { if (this.tryMove(-1, 0)) this.sfx('move'); }));
      document.getElementById('tRight').addEventListener('click', guard(() => { if (this.tryMove(1, 0)) this.sfx('move'); }));
      document.getElementById('tDown').addEventListener('click', guard(() => { if (this.tryMove(0, 1)) this.addScore(1); }));
      document.getElementById('tRotate').addEventListener('click', guard(() => this.rotate(1)));
      document.getElementById('tHold').addEventListener('click', guard(() => this.doHold()));
      document.getElementById('tDrop').addEventListener('click', guard(() => this.hardDrop()));
    }
    setPaused(v) {
      this.paused = v;
      this.pauseOverlay.classList.toggle('show', v);
    }
    keyDown(e) {
      const code = e.code;
      if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space'].includes(code)) e.preventDefault();
      if (code === 'KeyR') { this.newGame(); return; }
      if (code === 'KeyM') { this.toggleMute(); return; }
      if (code === 'KeyP') {
        if (!this.gameOver) this.setPaused(!this.paused);
        return;
      }
      if (e.repeat) return;
      if (this.paused || this.gameOver) return;
      switch (code) {
        case 'ArrowLeft':
          if (this.tryMove(-1, 0)) this.sfx('move');
          this.dasDir = -1; this.dasTime = 0; this.arrTime = 0;
          break;
        case 'ArrowRight':
          if (this.tryMove(1, 0)) this.sfx('move');
          this.dasDir = 1; this.dasTime = 0; this.arrTime = 0;
          break;
        case 'ArrowDown':
          this.softHeld = true;
          break;
        case 'Space':
          this.hardDrop();
          break;
        case 'KeyZ':
          this.rotate(-1);
          break;
        case 'KeyX':
        case 'ArrowUp':
          this.rotate(1);
          break;
        case 'KeyC':
          this.doHold();
          break;
      }
    }

    // ---------- loop ----------
    loop(t) {
      this.raf = requestAnimationFrame((tt) => this.loop(tt));
      const dt = Math.min(50, t - this.last);
      this.last = t;
      const playing = this.started && !this.paused && !this.gameOver;

      if (playing && this.clearing) {
        this.clearing.t += dt;
        if (this.clearing.t >= 300) this.finishClear();
      } else if (playing && this.active) {
        if (this.dasDir !== 0) {
          this.dasTime += dt;
          if (this.dasTime > 150) {
            this.arrTime += dt;
            while (this.arrTime > 40) {
              this.arrTime -= 40;
              if (this.tryMove(this.dasDir, 0)) this.sfx('move');
            }
          }
        }
        const base = this.gravityMs();
        const interval = this.softHeld ? Math.min(40, base / 20) : base;
        this.gravAcc += dt;
        while (this.gravAcc >= interval) {
          this.gravAcc -= interval;
          if (!this.collides(this.active.shape, this.active.x, this.active.y + 1)) {
            this.active.y++;
            if (this.softHeld) this.addScore(1);
            this.lockTimer = -1;
          } else {
            if (this.lockTimer < 0) this.lockTimer = 0;
          }
        }
        if (this.active && this.collides(this.active.shape, this.active.x, this.active.y + 1)) {
          if (this.lockTimer < 0) this.lockTimer = 0;
          this.lockTimer += dt;
          if (this.lockTimer >= 500) this.lockPiece();
        } else if (this.lockTimer >= 0 && this.active) {
          this.lockTimer = -1;
        }
      }
      if (this.active) {
        const p = this.active;
        const kx = 1 - Math.exp(-dt / 38);
        const ky = 1 - Math.exp(-dt / 55);
        this.vis.x += (p.x - this.vis.x) * kx;
        this.vis.y += (p.y - this.vis.y) * ky;
        if (Math.abs(p.x - this.vis.x) < 0.01) this.vis.x = p.x;
        if (Math.abs(p.y - this.vis.y) < 0.01) this.vis.y = p.y;
      }
      if (this.rotPulse > 0) this.rotPulse = Math.max(0, this.rotPulse - dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
      if (this.trail) {
        this.trail.t += dt;
        if (this.trail.t > 220) this.trail = null;
      }
      this.draw();
    }

    // ---------- rendering ----------
    draw() {
      const cv = this.boardEl;
      const ctx = cv.getContext('2d');
      const C = CELL, H = HIDDEN;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 320, 640);
      ctx.fillStyle = '#090C13';
      ctx.fillRect(0, 0, 320, 640);
      if (this.shake > 0) {
        const k = this.shake / 120;
        ctx.setTransform(1, 0, 0, 1, 0, Math.sin(this.shake * 0.25) * 3 * k);
      }
      ctx.strokeStyle = 'rgba(0,229,255,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < COLS; x++) { ctx.moveTo(x * C + 0.5, 0); ctx.lineTo(x * C + 0.5, 640); }
      for (let y = 1; y < 20; y++) { ctx.moveTo(0, y * C + 0.5); ctx.lineTo(320, y * C + 0.5); }
      ctx.stroke();

      if (this.trail) {
        const tr = this.trail;
        const k = 1 - tr.t / 220;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let x = 0; x < tr.shape[0].length; x++) {
          let has = false;
          for (let y = 0; y < tr.shape.length; y++) if (tr.shape[y][x]) has = true;
          if (!has) continue;
          const gx = (tr.x + x) * C;
          const y0 = Math.max(0, (tr.fromY - H)) * C;
          const y1 = (tr.toY - H + tr.shape.length) * C;
          const g = ctx.createLinearGradient(0, y0, 0, y1);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, tr.color);
          ctx.globalAlpha = 0.4 * k;
          ctx.fillStyle = g;
          ctx.fillRect(gx + 5, y0, C - 10, Math.max(0, y1 - y0));
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      const clearingRows = this.clearing ? this.clearing.rows : [];
      for (let y = H; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = this.grid[y][x];
          if (!c) continue;
          if (clearingRows.includes(y)) continue;
          this.cell(ctx, x * C, (y - H) * C, COLORS[c], C, 7);
        }
      }

      if (this.clearing) {
        const k = this.clearing.t / 300;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const r of clearingRows) {
          const py = (r - H) * C;
          if (k < 0.4) {
            ctx.shadowColor = '#00E5FF';
            ctx.shadowBlur = 26;
            ctx.fillStyle = 'rgba(255,255,255,' + (0.95 - k) + ')';
            ctx.fillRect(0, py, 320, C);
          } else {
            const s = 1 - (k - 0.4) / 0.6;
            ctx.shadowColor = '#00E5FF';
            ctx.shadowBlur = 30 * s;
            ctx.fillStyle = 'rgba(190,245,255,' + (0.8 * s) + ')';
            const h = C * s;
            ctx.fillRect(0, py + (C - h) / 2, 320, h);
          }
        }
        ctx.restore();
      }

      const p = this.active;
      if (p && !this.clearing) {
        const col = COLORS[p.type];
        const gy = this.ghostY();
        ctx.save();
        ctx.strokeStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        for (let y = 0; y < p.shape.length; y++) for (let x = 0; x < p.shape[y].length; x++) {
          if (!p.shape[y][x]) continue;
          const vy = gy + y - H;
          if (vy < 0) continue;
          this.roundRectPath(ctx, (p.x + x) * C + 3, vy * C + 3, C - 6, C - 6, 6);
          ctx.stroke();
        }
        ctx.restore();

        let scale = 1;
        if (this.rotPulse > 0) {
          const q = this.rotPulse / 140;
          scale = 1 + 0.09 * Math.sin(q * Math.PI);
        }
        const cxp = (this.vis.x + p.shape.length / 2) * C;
        const cyp = (this.vis.y + p.shape.length / 2 - H) * C;
        ctx.save();
        if (scale !== 1) {
          ctx.translate(cxp, cyp);
          ctx.scale(scale, scale);
          ctx.translate(-cxp, -cyp);
        }
        for (let y = 0; y < p.shape.length; y++) for (let x = 0; x < p.shape[y].length; x++) {
          if (!p.shape[y][x]) continue;
          const vy = this.vis.y + y - H;
          if (vy < -1) continue;
          this.cell(ctx, (this.vis.x + x) * C, vy * C, col, C, 15);
        }
        ctx.restore();
      }
      this.drawHold();
      this.drawNext();
    }
    roundRectPath(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    cell(ctx, px, py, color, size, glow) {
      const C = size || CELL;
      const inset = Math.max(1, Math.round(C * 0.045));
      ctx.save();
      if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
      this.roundRectPath(ctx, px + inset, py + inset, C - inset * 2, C - inset * 2, Math.round(C * 0.19));
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
      const g = ctx.createLinearGradient(0, py, 0, py + C);
      g.addColorStop(0, 'rgba(255,255,255,0.35)');
      g.addColorStop(0.45, 'rgba(255,255,255,0.02)');
      g.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = g;
      this.roundRectPath(ctx, px + inset, py + inset, C - inset * 2, C - inset * 2, Math.round(C * 0.19));
      ctx.fill();
    }
    drawMini(ctx, type, cx, cy, cellSize, glow) {
      if (!type) return;
      const shape = SHAPES[type];
      let minX = 9, maxX = -1, minY = 9, maxY = -1;
      for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
      }
      const w = (maxX - minX + 1) * cellSize, h = (maxY - minY + 1) * cellSize;
      const ox = cx - w / 2, oy = cy - h / 2;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        if (shape[y][x]) this.cell(ctx, ox + (x - minX) * cellSize, oy + (y - minY) * cellSize, COLORS[type], cellSize, glow || 8);
      }
    }
    drawHold() {
      const cv = this.holdEl;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 140, 70);
      if (this.hold) {
        if (this.holdUsed) ctx.globalAlpha = 0.35;
        this.drawMini(ctx, this.hold, 70, 35, 16, 10);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = 'rgba(95,217,236,0.35)';
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EMPTY', 70, 39);
      }
    }
    drawNext() {
      const cv = this.nextEl;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 140, 330);
      for (let i = 0; i < Math.min(5, this.queue.length); i++) {
        ctx.globalAlpha = i === 0 ? 1 : 0.65;
        this.drawMini(ctx, this.queue[i], 70, 34 + i * 66, i === 0 ? 17 : 14, i === 0 ? 12 : 6);
      }
      ctx.globalAlpha = 1;
    }

    // ---------- audio ----------
    ac() {
      if (!this.audioCtx) {
        try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return this.audioCtx;
    }
    beep(freq, dur, type, vol, when, slide) {
      const ctx = this.ac();
      if (!ctx || this.muted) return;
      const t0 = ctx.currentTime + (when || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
      g.gain.setValueAtTime(vol || 0.08, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }
    sfx(name, n) {
      switch (name) {
        case 'move': this.beep(220, 0.04, 'square', 0.04); break;
        case 'rotate': this.beep(330, 0.05, 'square', 0.05); break;
        case 'lock': this.beep(140, 0.08, 'triangle', 0.1); break;
        case 'harddrop': this.beep(420, 0.09, 'sawtooth', 0.07, 0, 110); break;
        case 'clear': {
          const notes = [392, 494, 587, 784];
          for (let i = 0; i < Math.min(n || 1, 4); i++) this.beep(notes[i], 0.12, 'square', 0.07, i * 0.06);
          if ((n || 1) >= 4) this.beep(1046, 0.25, 'square', 0.08, 0.26);
          break;
        }
        case 'levelup':
          this.beep(523, 0.1, 'square', 0.07);
          this.beep(659, 0.1, 'square', 0.07, 0.09);
          this.beep(784, 0.18, 'square', 0.08, 0.18);
          break;
        case 'gameover':
          this.beep(392, 0.18, 'triangle', 0.1);
          this.beep(311, 0.18, 'triangle', 0.1, 0.16);
          this.beep(233, 0.34, 'triangle', 0.1, 0.32);
          break;
      }
    }
    toggleMute() {
      this.muted = !this.muted;
      try { localStorage.setItem('tetris-muted', this.muted ? '1' : '0'); } catch (e) {}
      this.updateMuteLabel();
    }
    updateMuteLabel() {
      this.muteBtn.textContent = this.muted ? 'SOUND: OFF (M)' : 'SOUND: ON (M)';
    }
  }

  window.addEventListener('DOMContentLoaded', () => new Game());
})();
