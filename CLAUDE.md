# 2D Minecraft Game — Project Context for Claude

This file is read automatically by Claude Code at the start of every session.
It contains everything needed to continue work from any machine.

**Keep this file up to date** — after every session where features are added or decisions are made,
update this file and commit it so the MacBook (or any other machine) always has full context.

---

## What this project is

A fully functional 2D Minecraft clone that runs in the browser.
Built in pure HTML5/JavaScript — no frameworks, no backend.
Live at: https://play-minecraft-game.vercel.app
GitHub: https://github.com/abhimanyumarwah/minecraft-game

---

## About the user

- Product designer/builder, not a coder
- Always explain what you did and why in plain language after every action
- Outcome-first: lead with the benefit, not the technical detail
- Keep explanations to 2–4 sentences max

---

## Development workflow (ALWAYS follow this — never push directly to main)

```
git checkout -b feat/your-feature-name   ← always start on a branch
[write code]
npm run build                             ← rebuild bundle.js after every JS change
git add [files] && git commit -m "..."
git push origin feat/your-feature-name
gh pr create                             ← open a Pull Request
```

GitHub Actions runs 25 automated Playwright tests on every PR.
Only merge to main after all tests pass (green checkmark on the PR).
Vercel auto-deploys from main — live URL updates within ~1 minute of merge.

---

## File architecture

| File | Purpose |
|------|---------|
| `index.html` | Canvas + loading screen |
| `game.js` | Game loop, input handling, save/load |
| `world.js` | World generation: terrain, caves, ores, trees, lighting |
| `player.js` | Physics, collision, mining, placement |
| `renderer.js` | Canvas rendering: sky, blocks, player sprite, lighting overlay |
| `ui.js` | HUD: hotbar, hearts, hunger, inventory, env selector, creative palette |
| `inventory.js` | 36-slot inventory, hotbar, crafting recipes |
| `entities.js` | Zombie, Creeper, Pig with AI |
| `blocks.js` | Block/item registry + pixel-art texture drawing |
| `noise.js` | Perlin noise for terrain generation |
| `bundle.js` | **Auto-generated** — esbuild output, do not edit manually |

**World size:** 400×150 blocks. Sea level y≈90. Day length: 480 seconds.

---

## Build command

Must be run after every change to any `.js` source file:

```
npx esbuild game.js --bundle --outfile=bundle.js --format=iife --platform=browser
```

Or via npm: `npm run build`

---

## Running locally

```
python3 -m http.server 8765
```
Then open http://localhost:8765

---

## Running tests

```
npm test
```

Starts a local server automatically and runs all 25 Playwright tests in headless Chrome.
All 25 must pass before merging any PR.

---

## Controls

| Key | Action |
|-----|--------|
| A / D or ←/→ | Move left / right |
| Space / W | Jump |
| Shift | Sprint |
| Left click | Mine block |
| Right click | Place block / interact |
| E | Open / close inventory |
| 1–9 | Select hotbar slot |
| Scroll wheel | Cycle hotbar |
| N | Open world type selector (8 presets) |
| M | Toggle Survival / Creative mode |
| C | Open block palette (creative mode only) |
| ESC | Pause / resume |
| +/- | Zoom in / out |
| F | Toggle fullscreen |

---

## Features built so far

- World generation: terrain, caves, ores, trees, biomes, BFS lighting
- 8 world presets: Mixed, Grasslands, Forest, Desert, Tundra, Ocean, Cave World, Superflat
- Player: movement, sprint, jump, gravity, collision
- Mining (left click with crack animation) and block placement (right click)
- Inventory: 36 slots, hotbar, drag-and-drop, crafting grid (2×2 and 3×3)
- Creative mode: instant break, fly (double-tap Space), unlimited blocks
- Block palette: click any of 20 block types → fills hotbar slot
- Health + hunger system
- Entities: Zombie, Creeper, Pig with AI (spawn at night)
- Day/night cycle with lighting overlay
- Auto-save to localStorage every 60 seconds
- Save format version 2 (older saves auto-cleared)

---

## Infrastructure

- **GitHub:** https://github.com/abhimanyumarwah/minecraft-game
- **Live URL:** https://play-minecraft-game.vercel.app
- **CI:** `.github/workflows/pr-checks.yml` — runs on every PR
- **Tests:** `tests/game.spec.mjs` — 25 Playwright tests
- **Auto-deploy:** Vercel watches the `main` branch

---

## Key technical decisions (important context)

- **No ES modules on production** — all 9 JS files are bundled into `bundle.js` via esbuild. This fixed Vercel CDN module loading issues. Never switch back to `type="module"`.
- **Window capture-phase listeners** — keyboard uses `window.addEventListener('keydown', ..., true)`. This fires before anything can intercept it.
- **Render order matters** — player must be drawn AFTER the lighting overlay, or they're invisible underground.
- **Save versioning** — `version: 2` in localStorage save. Old saves are cleared automatically to prevent stale-state bugs.
- **rAF timing in tests** — `keyboard.press()` fires keydown+keyup in <1ms. Keys processed by the game loop (movement, jump) need `keyboard.down()` + `waitForTimeout()` + `keyboard.up()` so at least one rAF frame runs with the key held.
