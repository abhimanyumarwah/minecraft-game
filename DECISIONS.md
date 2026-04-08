# Decision Log

Every major decision, trade-off, rejected alternative, and the reasoning behind it.
This is the institutional memory of the project — consult this before re-debating anything.

Format per entry:
- **Problem** — what we were trying to solve
- **What we tried / considered**
- **What we chose and why**
- **What we rejected and why**

---

## 1. How to load JavaScript files

**Problem:** The game has 9 JS files that need to work together in the browser.

**What we tried:**
- `type="module"` with ES module imports (`import { World } from './world.js'`) — worked perfectly on localhost with Python's http.server, but broke on Vercel's CDN. The CDN served module files with wrong Content-Type headers or caching behaviour that caused silent import failures.

**What we chose:** Bundle all 9 files into a single `bundle.js` using **esbuild**.
```
npx esbuild game.js --bundle --outfile=bundle.js --format=iife --platform=browser
```

**Why esbuild over alternatives:**
- Webpack/Rollup/Vite — all work but require config files, plugins, and are slower. Overkill for this project.
- esbuild — one command, zero config, 14ms build time, outputs a single IIFE file that works everywhere.

**Rule going forward:** Never switch back to ES modules. Always rebuild bundle.js after every JS change.

---

## 2. Keyboard input — why it kept not working

**Problem:** Player couldn't move with WASD or arrow keys on Vercel (and eventually on localhost too).

**What we tried (in order):**

1. **`document.addEventListener('keydown', ...)`** — standard approach. Failed because some browsers and browser extensions intercept events at the document level before they reach our handler.

2. **Adding `e.preventDefault()` for arrow keys** — helped prevent page scroll but didn't fix WASD. The real problem wasn't preventDefault, it was event capture order.

3. **`canvas.addEventListener('keydown', ...)`** with `canvas.tabindex="0"` and `canvas.focus()` — the canvas needs focus to receive keyboard events. This worked sometimes but was fragile — clicking outside the canvas would steal focus and break input.

4. **"Click to Play" overlay** — added a fullscreen overlay that required a click before the game started, to ensure the canvas had focus. This added friction and still wasn't reliable in all browsers.

**What we chose:** `window.addEventListener('keydown', handler, true)` — the `true` means **capture phase**, which fires before ANY other handler anywhere on the page. Nothing can intercept it.

Also: removed `canvas.tabindex` and `canvas.focus()` entirely. Window-level capture doesn't need focus.

**Why this is the right answer:** The window is the root of all DOM events. Capture phase fires first — before document, before canvas, before any extension. It's unconditional.

---

## 3. The silent game loop crash (the big debugging session)

**Problem:** The game world rendered fine, but the player couldn't move at all — on both localhost and Vercel. We spent multiple sessions on this.

**What we tried:**
- Assumed it was keyboard input → tried every keyboard fix (see Decision 2) → input WAS working, keys registered correctly
- Assumed it was Vercel CDN → switched to bundle.js → still broken
- Assumed it was focus/click-to-play → tried various focus fixes → still broken
- Checked player physics in isolation → physics logic was correct

**Root cause (found via Playwright headless browser automation):**
`ui.js` line 151 called `this._drawModeButtons(ctx, W)` — a method that was **never defined anywhere**. This threw a TypeError every single animation frame, crashing the game loop silently. The world rendered (rendering happened before the crash) but physics and input processing never ran.

**Why it was invisible:** Browser consoles show errors, but the error was being swallowed inside `requestAnimationFrame` in some environments. The game appeared to load fine.

**How we found it:** Wrote a Playwright test that opened the game in headless Chrome, pressed D, and checked if `player.x` changed. It didn't. Then checked `window._game` state directly — the game loop was crashing every frame.

**Fix:** Removed the 3-line block calling `_drawModeButtons` from `ui.js`. Player movement immediately worked.

**Lesson → Why we now have automated tests:** This bug would have been caught in 30 seconds by test #1 ("game loads with no JavaScript errors"). The entire multi-session debugging ordeal was unnecessary. This is why the branch → PR → tests → merge workflow now exists.

---

## 4. Rendering order — player invisible underground

**Problem:** After fixing the game loop, the player was visible on the surface but disappeared when going underground. The world was rendering correctly.

**What we investigated:** The lighting system draws a dark overlay over the screen to simulate caves being dark. If the player sprite is drawn BEFORE this overlay, the overlay paints over the player.

**Original (broken) render order:**
1. Sky gradient
2. Blocks
3. Player ← drawn here, then covered up
4. Entities
5. Lighting overlay ← this painted over the player

**Fixed render order:**
1. Sky gradient
2. Blocks
3. Entities
4. Lighting overlay
5. Player ← drawn last, always on top

**Rule:** Player must always be drawn last (or after the lighting overlay). Never move this.

---

## 5. Player spawning underground (stale save bug)

**Problem:** After some sessions, the player would spawn underground or in a wall — immediately dying or stuck.

**Root cause:** The game auto-saves to `localStorage` every 60 seconds. When the world generation code was updated (changing terrain height, biome distribution, etc.), the old save had player coordinates that now pointed inside solid blocks in the newly shaped world. The load code trusted those coordinates blindly.

**What we tried:**
- Clearing localStorage manually — worked but users lose their progress every time we update the game.

**What we chose:** Save format versioning. Every save includes `version: 2`. The load code checks this:
```js
if (!data.version || data.version < 2) {
  localStorage.removeItem('mc2d_save');
  return; // start fresh
}
```

**Why version 2 specifically:** Version 1 saves existed before this system was added. Any save without a version field (or with version < 2) is old and potentially corrupted — clear it.

**Rule:** If world generation logic ever changes significantly in a way that would break existing save coordinates, bump the version number.

---

## 6. Deployment — ES modules on Vercel

**Problem:** Game worked on localhost (`python3 -m http.server`) but was completely broken on Vercel.

**What Vercel does differently:** Vercel's CDN caches aggressively and serves files from edge nodes. ES module imports (`import './world.js'`) require the browser to make separate HTTP requests for each file. On Vercel, some of these requests returned cached responses with incorrect headers, causing module parsing to fail silently.

**What we tried:**
- Adding `vercel.json` with custom headers for JS files — partially helped but unreliable
- Different import paths — no difference

**What we chose:** esbuild bundle (see Decision 1). One file, no imports, no CDN module issues.

**Side benefit:** The bundle is also faster to load (one HTTP request instead of 9).

---

## 7. Live URL — Vercel alias management

**Problem:** Every Vercel deployment gets a unique URL (e.g. `minecraft-game-abc123.vercel.app`). We wanted a stable URL: `play-minecraft-game.vercel.app`.

**What we tried:**
- `vercel alias set [deployment-url] play-minecraft-game.vercel.app` — worked but had to be run manually after every deployment.
- Adding `{"alias": ["play-minecraft-game.vercel.app"]}` to `vercel.json` — Vercel respects this during deployment but the alias still needed initial setup.

**What we chose:** Connected the GitHub repo to Vercel with auto-deploy on `main`. Vercel now deploys automatically on every push to main and maintains the alias. No manual steps needed after initial setup.

**Attempted URL:** `minecraft-game.vercel.app` — already taken by someone else.
**Final URL:** `play-minecraft-game.vercel.app` ✓

---

## 8. GitHub Actions — automated testing on PRs

**Problem:** We kept shipping broken code to the live URL because there was no safety net between "write code" and "players see it".

**What we considered:**
- Manual testing before every push — unreliable, easy to forget, doesn't scale
- Linting only — catches syntax errors but not runtime behaviour (like Decision 3's silent crash)
- Jest unit tests — would test individual functions but not the game running in a real browser
- Playwright end-to-end tests — tests the actual game in a real headless Chrome browser

**What we chose:** Playwright + GitHub Actions.
- 25 tests covering every feature
- Runs on every PR automatically
- Tests the REAL game in a REAL browser (catches the kind of silent crash from Decision 3)
- Results visible directly on the PR as a green ✓ or red ✗

**Key Playwright lesson:** `keyboard.press('Space')` fires keydown + keyup in <1ms. The game's `requestAnimationFrame` loop runs at 16ms intervals. So `press()` completes before any game frame runs — the key is never seen. For keys processed by the game loop (movement, jump), you must use `keyboard.down()` + `waitForTimeout(150)` + `keyboard.up()`.

Keys handled directly in the `keydown` event handler (E, N, M, C, ESC) work fine with `keyboard.press()` because they execute synchronously in the event, not in rAF.

---

## 9. Creative mode implementation

**Problem:** Needed a way to let users place any block freely without worrying about inventory or survival mechanics.

**What we considered:**
- Separate "creative world" — rejected because it would mean losing your survival world to try creative
- Item cheats / give commands — rejected because there's no text input in the game
- Toggle button — simple, reversible, non-destructive

**What we chose:** M key toggles between Survival and Creative in the same world. In creative:
- Instant block breaking (no mining timer)
- Double-tap Space to fly
- Block palette (C key) gives 64 of any block type into the selected hotbar slot
- Health and hunger don't deplete

**Why this over a separate creative world:** The user can explore their survival world in creative mode (fly around, build freely) and switch back to survival without losing anything.

---

## 10. World preset selector

**Problem:** Users were stuck with whatever world generated randomly on first load. No way to choose a different terrain style without clearing localStorage manually.

**What we considered:**
- Pre-game screen (choose before world generates) — rejected because it adds friction before first play
- Settings menu — rejected as overkill for now
- In-game panel accessible anytime — chosen

**What we chose:** N key opens an 8-card panel showing all world presets. Clicking a preset:
1. Clears the saved game (localStorage)
2. Shows the loading screen again
3. Regenerates the entire world with the chosen preset
4. Respawns the player at the surface

**Warning shown to user:** "Starting a new world resets your current world" — intentional, so they don't accidentally lose progress.

**The 8 presets** (defined in `world.js` as `World.ENVIRONMENTS`): Mixed, Grasslands, Forest, Desert, Tundra, Ocean, Cave World, Superflat.

---

## 11. Documentation strategy — CLAUDE.md vs DECISIONS.md

**Problem:** Context needed to be available on any machine (iMac at office, MacBook at home). Claude's memory system is machine-local — it doesn't travel with the repo.

**What we considered:**
- Everything in one big CLAUDE.md — gets unwieldy, mixes "how to work" with "why it's this way"
- Wiki on GitHub — not auto-read by Claude Code
- README.md — typically user-facing, not Claude-facing

**What we chose:** Two files, both committed to the repo:
- `CLAUDE.md` — operational context. What Claude needs at session start: workflow, architecture, commands, hard rules. Lean and scannable.
- `DECISIONS.md` — this file. Full history of every decision, what was tried, what was rejected, and why.

**Why this pattern:** Borrowed from engineering "ADR" (Architecture Decision Records) used by Netflix, Spotify, Amazon. The "why not" is just as important as the "why" — it prevents re-debating settled questions.

**Rule:** Update both files at the end of every session where something significant was built or decided. Commit and push so GitHub always has the latest.

---

## 12. Features considered but not yet built

The following were discussed and are on the radar — not rejected, just deferred:

| Feature | Notes |
|---------|-------|
| Sound effects | Web Audio API (generated tones, no files). High value, no external deps needed. |
| Minimap | Small corner map with terrain + player position. |
| Furnace smelting | Place furnace, add ore + fuel → get ingots over time |
| Chest storage | 27-slot storage UI |
| More mobs | Skeleton (arrows), Cow (leather/beef), Chicken |
| Weather system | Rain, snow, lightning |
| Achievements | "First block broken", "Survive the night", etc. |
| Mobile touch controls | On-screen joystick for phones/tablets |
| Screen shake | On creeper explosion or damage |
| Day counter | Show current day, warn at sunset |

These were listed in the feature plan at `/Users/abhimanyusinghmarwah/.claude/plans/rippling-baking-shell.md`.
