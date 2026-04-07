import { test, expect } from '@playwright/test';

// STATE constants mirror game.js
const STATE = { LOADING: 0, PLAYING: 1, PAUSED: 2, DEAD: 3 };

// Wait until the game finishes world generation and is in PLAYING state
async function waitForGame(page, timeout = 25_000) {
  await page.waitForFunction(
    () => window._game?.state === 1,
    { timeout }
  );
  // Give physics one tick to settle (player lands on ground)
  await page.waitForTimeout(600);
}

// ─── Setup ────────────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  // Capture JS errors for every test
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message);
  });
  await page.goto('/');
  await waitForGame(page);
});

// ─── 1. Load checks ───────────────────────────────────────────────────────────
test('game loads with no JavaScript errors', async ({ page }) => {
  const errors = [];
  // Re-navigate with error capture active from the start
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await waitForGame(page);
  expect(errors).toHaveLength(0);
});

test('game is in PLAYING state after load', async ({ page }) => {
  const state = await page.evaluate(() => window._game.state);
  expect(state).toBe(STATE.PLAYING);
});

test('loading screen is hidden after game starts', async ({ page }) => {
  const display = await page.evaluate(
    () => document.getElementById('loadingScreen')?.style?.display
  );
  expect(display).toBe('none');
});

// ─── 2. Player movement ───────────────────────────────────────────────────────
test('player moves right when D key is held', async ({ page }) => {
  const xBefore = await page.evaluate(() => window._game.player.x);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyD');
  const xAfter = await page.evaluate(() => window._game.player.x);
  expect(xAfter).toBeGreaterThan(xBefore);
});

test('player moves left when A key is held', async ({ page }) => {
  const xBefore = await page.evaluate(() => window._game.player.x);
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyA');
  const xAfter = await page.evaluate(() => window._game.player.x);
  expect(xAfter).toBeLessThan(xBefore);
});

test('player jumps when Space is pressed', async ({ page }) => {
  // Let player settle on the ground first
  await page.waitForTimeout(300);
  // Hold Space so at least one rAF frame (16ms) processes the key
  await page.keyboard.down('Space');
  await page.waitForTimeout(150); // mid-jump: vy ≈ -12 + 30*0.15 = -7.5
  const vy = await page.evaluate(() => window._game.player.vy);
  await page.keyboard.up('Space');
  expect(vy).toBeLessThan(0);
});

test('arrow keys also move the player', async ({ page }) => {
  const xBefore = await page.evaluate(() => window._game.player.x);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  const xAfter = await page.evaluate(() => window._game.player.x);
  expect(xAfter).toBeGreaterThan(xBefore);
});

// ─── 3. Inventory ────────────────────────────────────────────────────────────
test('E key opens inventory', async ({ page }) => {
  await page.keyboard.press('KeyE');
  const isOpen = await page.evaluate(() => window._game.ui.isInventoryOpen);
  expect(isOpen).toBe(true);
});

test('E key closes inventory when open', async ({ page }) => {
  await page.keyboard.press('KeyE'); // open
  await page.keyboard.press('KeyE'); // close
  const isOpen = await page.evaluate(() => window._game.ui.isInventoryOpen);
  expect(isOpen).toBe(false);
});

test('ESC closes inventory', async ({ page }) => {
  await page.keyboard.press('KeyE'); // open inventory
  await page.keyboard.press('Escape'); // ESC should close it
  const isOpen = await page.evaluate(() => window._game.ui.isInventoryOpen);
  expect(isOpen).toBe(false);
});

test('player cannot move while inventory is open', async ({ page }) => {
  await page.keyboard.press('KeyE'); // open inventory
  const xBefore = await page.evaluate(() => window._game.player.x);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyD');
  const xAfter = await page.evaluate(() => window._game.player.x);
  expect(xAfter).toBe(xBefore);
});

// ─── 4. Hotbar ────────────────────────────────────────────────────────────────
test('number keys 1-9 select hotbar slots', async ({ page }) => {
  await page.keyboard.press('5');
  const slot = await page.evaluate(() => window._game.inventory.selectedSlot);
  expect(slot).toBe(4); // 0-indexed

  await page.keyboard.press('1');
  const slot1 = await page.evaluate(() => window._game.inventory.selectedSlot);
  expect(slot1).toBe(0);
});

// ─── 5. Game states ───────────────────────────────────────────────────────────
test('ESC pauses the game', async ({ page }) => {
  await page.keyboard.press('Escape');
  const state = await page.evaluate(() => window._game.state);
  expect(state).toBe(STATE.PAUSED);
});

test('ESC resumes from pause', async ({ page }) => {
  await page.keyboard.press('Escape'); // pause
  await page.keyboard.press('Escape'); // resume
  const state = await page.evaluate(() => window._game.state);
  expect(state).toBe(STATE.PLAYING);
});

// ─── 6. Environment selector ─────────────────────────────────────────────────
test('N key opens environment selector', async ({ page }) => {
  await page.keyboard.press('KeyN');
  const isOpen = await page.evaluate(() => window._game.ui.isEnvSelectorOpen);
  expect(isOpen).toBe(true);
});

test('N key closes environment selector when open', async ({ page }) => {
  await page.keyboard.press('KeyN');
  await page.keyboard.press('KeyN');
  const isOpen = await page.evaluate(() => window._game.ui.isEnvSelectorOpen);
  expect(isOpen).toBe(false);
});

test('opening env selector closes inventory if open', async ({ page }) => {
  await page.keyboard.press('KeyE'); // open inventory
  await page.keyboard.press('KeyN'); // open env selector
  const invOpen = await page.evaluate(() => window._game.ui.isInventoryOpen);
  const envOpen = await page.evaluate(() => window._game.ui.isEnvSelectorOpen);
  expect(invOpen).toBe(false);
  expect(envOpen).toBe(true);
});

// ─── 7. Creative mode ─────────────────────────────────────────────────────────
test('M key toggles creative mode on', async ({ page }) => {
  const before = await page.evaluate(() => window._game.player.creativeMode);
  expect(before).toBe(false); // starts in survival

  await page.keyboard.press('KeyM');
  const after = await page.evaluate(() => window._game.player.creativeMode);
  expect(after).toBe(true);
});

test('M key toggles creative mode off', async ({ page }) => {
  await page.keyboard.press('KeyM'); // on
  await page.keyboard.press('KeyM'); // off
  const mode = await page.evaluate(() => window._game.player.creativeMode);
  expect(mode).toBe(false);
});

// ─── 8. Block palette (creative only) ────────────────────────────────────────
test('C key opens block palette in creative mode', async ({ page }) => {
  await page.keyboard.press('KeyM'); // switch to creative
  await page.keyboard.press('KeyC');
  const isOpen = await page.evaluate(() => window._game.ui.isCreativePaletteOpen);
  expect(isOpen).toBe(true);
});

test('C key does NOT open block palette in survival mode', async ({ page }) => {
  // Make sure we are in survival (default)
  const mode = await page.evaluate(() => window._game.player.creativeMode);
  if (mode) await page.keyboard.press('KeyM');

  await page.keyboard.press('KeyC');
  const isOpen = await page.evaluate(() => window._game.ui.isCreativePaletteOpen);
  expect(isOpen).toBe(false);
});

test('C key closes block palette when open', async ({ page }) => {
  await page.keyboard.press('KeyM'); // creative
  await page.keyboard.press('KeyC'); // open
  await page.keyboard.press('KeyC'); // close
  const isOpen = await page.evaluate(() => window._game.ui.isCreativePaletteOpen);
  expect(isOpen).toBe(false);
});

// ─── 9. Build integrity ───────────────────────────────────────────────────────
test('all required game systems are initialised', async ({ page }) => {
  const check = await page.evaluate(() => ({
    world:         !!window._game.world,
    player:        !!window._game.player,
    renderer:      !!window._game.renderer,
    ui:            !!window._game.ui,
    inventory:     !!window._game.inventory,
    entityManager: !!window._game.entityManager,
  }));
  expect(check.world).toBe(true);
  expect(check.player).toBe(true);
  expect(check.renderer).toBe(true);
  expect(check.ui).toBe(true);
  expect(check.inventory).toBe(true);
  expect(check.entityManager).toBe(true);
});

test('player has health and hunger', async ({ page }) => {
  const hp = await page.evaluate(() => window._game.player.health);
  const hunger = await page.evaluate(() => window._game.player.hunger);
  expect(hp).toBeGreaterThan(0);
  expect(hunger).toBeGreaterThan(0);
});

test('world has blocks at sea level', async ({ page }) => {
  // Check that the world generated solid blocks near surface (y ~85-95)
  const hasGround = await page.evaluate(() => {
    const w = window._game.world;
    const cx = Math.floor(w.width / 2);
    for (let y = 80; y < 100; y++) {
      if (w.getBlock(cx, y) !== 0) return true; // 0 = AIR
    }
    return false;
  });
  expect(hasGround).toBe(true);
});
