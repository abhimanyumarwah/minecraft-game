import { World } from './world.js';
import { Player } from './player.js';
import { Inventory } from './inventory.js';
import { Renderer, BLOCK_SIZE } from './renderer.js';
import { UI } from './ui.js';
import { EntityManager } from './entities.js';
import { BLOCK, BLOCK_DATA } from './blocks.js';

// ─── Game States ─────────────────────────────────────────────────────────────
const STATE = { LOADING: 0, PLAYING: 1, PAUSED: 2, DEAD: 3 };

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    this.state = STATE.LOADING;
    this.gameTime = 0;
    this.dayLength = 480; // seconds per day (8 min)
    this.timeOfDay = 0; // 0=noon

    this.fpsCounter = 0;
    this.fpsTimer = 0;
    this.fps = 60;

    // Input
    this.keys = {};
    this.mouse = { x: 0, y: 0, buttons: [false, false, false], justDown: [false, false, false], justUp: [false, false, false] };
    this._setupInput();

    // Start generation
    this._startGeneration();
  }

  _resizeCanvas() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _setupInput() {
    // window-level listeners — fire unconditionally regardless of focus
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
      if (this.ui) this.ui.handleKeyDown(e);
      if (e.code === 'Escape') this._handleEsc();
      if (e.code === 'KeyF') this._toggleFullscreen();
      if (e.code === 'KeyR' && this.state === STATE.DEAD) this._respawn();
      if (e.code === 'Equal' && this.renderer) this.renderer.blockSize = Math.min(64, this.renderer.blockSize + 4);
      if (e.code === 'Minus' && this.renderer)  this.renderer.blockSize = Math.max(16, this.renderer.blockSize - 4);
    }, true); // capture phase — fires before anything else can intercept
    window.addEventListener('keyup', e => { this.keys[e.code] = false; }, true);

    this.canvas.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (this.ui) this.ui.setMouse(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mousedown', e => {
      this.mouse.buttons[e.button] = true;
      this.mouse.justDown[e.button] = true;
    });

    this.canvas.addEventListener('mouseup', e => {
      this.mouse.buttons[e.button] = false;
      this.mouse.justUp[e.button] = true;
    });

    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.canvas.addEventListener('wheel', e => {
      if (this.ui) this.ui.handleScroll(e.deltaY);
      e.preventDefault();
    }, { passive: false });
  }

  _handleEsc() {
    if (this.state === STATE.PAUSED) {
      this.state = STATE.PLAYING;
    } else if (this.state === STATE.PLAYING) {
      if (this.ui && this.ui.isInventoryOpen) {
        this.ui.toggleInventory();
      } else {
        this.state = STATE.PAUSED;
      }
    }
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // ─── World Generation ────────────────────────────────────────────────────────
  async _startGeneration() {
    const loadingEl = document.getElementById('loadingScreen');
    const progressEl = document.getElementById('progressFill');
    const statusEl   = document.getElementById('loadingStatus');

    const seed = Math.floor(Math.random() * 999999);
    this.world = new World(seed);

    const gen = this.world.generateGenerator();
    let done = false;
    while (!done) {
      const result = gen.next();
      if (result.done) { done = true; break; }
      const pct = result.value;
      if (progressEl) progressEl.style.width = `${Math.round(pct * 100)}%`;
      if (statusEl) {
        if (pct < 0.1) statusEl.textContent = 'Generating terrain…';
        else if (pct < 0.35) statusEl.textContent = 'Placing blocks…';
        else if (pct < 0.5) statusEl.textContent = 'Carving caves…';
        else if (pct < 0.65) statusEl.textContent = 'Placing ores…';
        else if (pct < 0.75) statusEl.textContent = 'Growing trees…';
        else statusEl.textContent = 'Computing lighting…';
      }
      // Yield to browser
      await new Promise(r => setTimeout(r, 0));
    }

    // Initialize game systems
    this.inventory = new Inventory();
    // Give player some starter items
    this.inventory.addItem(BLOCK.WOODEN_PICKAXE, 1);
    this.inventory.addItem(BLOCK.TORCH, 10);
    this.inventory.addItem(BLOCK.PLANKS, 20);
    this.inventory.addItem(BLOCK.DIRT, 10);

    this.player = new Player(this.world, this.inventory);
    this.renderer = new Renderer(this.canvas, this.world, this.player);
    this.ui = new UI(this.canvas, this.inventory, this.player);
    this.entityManager = new EntityManager(this.world);
    this.ui.onEnvironmentChange = (preset) => this._restartWithPreset(preset);

    // Camera starts at player
    this.renderer.camX = this.player.x;
    this.renderer.camY = this.player.y + this.player.height / 2;

    // Load saved game if available
    this._loadGame();

    // Hide loading screen
    if (loadingEl) {
      loadingEl.style.transition = 'opacity 0.5s';
      loadingEl.style.opacity = '0';
      setTimeout(() => loadingEl.style.display = 'none', 500);
    }

    this.state = STATE.PLAYING;
    this._startLoop();
  }

  // ─── Game Loop ───────────────────────────────────────────────────────────────
  _startLoop() {
    let lastTime = performance.now();
    this._saveTimer = 0;

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // FPS counter
      this.fpsTimer += dt;
      this.fpsCounter++;
      if (this.fpsTimer >= 1) {
        this.fps = this.fpsCounter;
        this.fpsCounter = 0;
        this.fpsTimer = 0;
      }

      this._update(dt);
      this._render();

      // Reset just-down/up
      this.mouse.justDown = [false, false, false];
      this.mouse.justUp   = [false, false, false];

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  _update(dt) {
    if (this.state === STATE.LOADING || this.state === STATE.PAUSED) return;
    if (this.state === STATE.DEAD) return;

    // Time
    this.gameTime += dt;
    this.timeOfDay = (this.gameTime % this.dayLength) / this.dayLength;

    // Camera
    this.renderer.updateCamera(dt);

    // Build input state
    const input = {
      left:   this.keys['KeyA'] || this.keys['ArrowLeft'],
      right:  this.keys['KeyD'] || this.keys['ArrowRight'],
      jump:   this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp'],
      sprint: this.keys['ShiftLeft'] || this.keys['ShiftRight'],
    };

    if (!this.ui.isInventoryOpen) {
      this.player.update(dt, input);
    }

    // Mouse world position
    const worldMouse = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
    const targetBlock = this.player.getTargetBlock(worldMouse.x, worldMouse.y);

    // Mining (left click)
    if (this.mouse.buttons[0] && !this.ui.isInventoryOpen) {
      if (targetBlock) {
        const bid = this.world.getBlock(targetBlock.bx, targetBlock.by);
        if (bid !== BLOCK.AIR) {
          this.player.startMining(targetBlock.bx, targetBlock.by);
        } else {
          this.player.stopMining();
        }
      } else {
        this.player.stopMining();
      }
    } else {
      this.player.stopMining();
    }

    // Mining completion particles
    if (this.player.miningBlock && this.player.miningProgress >= 1) {
      const { bx, by } = this.player.miningBlock;
      const bid = this.world.getBlock(bx, by);
      this.renderer.spawnParticles(bx, by, bid, 10);
    }

    // Block placement / interaction (right click)
    if (this.mouse.justDown[2] && !this.ui.isInventoryOpen) {
      // First check if right-clicking an interactable block
      if (targetBlock) {
        const clickedBlock = this.world.getBlock(targetBlock.bx, targetBlock.by);
        if (clickedBlock === BLOCK.CRAFTING_TABLE) {
          this.ui.openCraftingTable();
        } else {
          // Place block on the face adjacent to clicked block
          const placeFace = this.player.getPlaceFace(worldMouse.x, worldMouse.y);
          if (placeFace && this.world.getBlock(placeFace.bx, placeFace.by) === BLOCK.AIR) {
            this.player.placeBlock(placeFace.bx, placeFace.by);
          }
        }
      } else {
        // Clicking on air - place at that position
        const placeFace = this.player.getPlaceFace(worldMouse.x, worldMouse.y);
        if (placeFace && this.world.getBlock(placeFace.bx, placeFace.by) === BLOCK.AIR) {
          this.player.placeBlock(placeFace.bx, placeFace.by);
        }
      }
    }

    // UI panel interaction (inventory, env selector, creative palette)
    const uiOpen = this.ui.isInventoryOpen || this.ui.isEnvSelectorOpen || this.ui.isCreativePaletteOpen;
    if (this.mouse.justDown[0] && uiOpen) {
      this.ui.handleClick(this.mouse.x, this.mouse.y, 0);
    }
    if (this.mouse.justDown[2] && uiOpen) {
      this.ui.handleClick(this.mouse.x, this.mouse.y, 2);
    }

    // Entities
    this.entityManager.update(dt, this.player, this.timeOfDay);

    // Check death
    if (this.player.isDead()) {
      this.state = STATE.DEAD;
    }

    // Auto-save
    this._saveTimer += dt;
    if (this._saveTimer > 60) {
      this._saveTimer = 0;
      this._saveGame();
    }
  }

  _render() {
    const ctx = this.canvas.getContext('2d');
    const W = this.canvas.width, H = this.canvas.height;

    if (this.state === STATE.LOADING) {
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    // World mouse for target block
    const worldMouse = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
    const targetBlock = this.state === STATE.PLAYING && !this.ui.isInventoryOpen
      ? this.player.getTargetBlock(worldMouse.x, worldMouse.y)
      : null;

    this.renderer.render(
      this.timeOfDay,
      this.gameTime,
      targetBlock,
      this.entityManager.entities
    );

    // UI on top
    this.ui.render(this.timeOfDay, this.fps);

    // Pause screen
    if (this.state === STATE.PAUSED) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', W/2, H/2 - 40);
      ctx.font = '20px monospace';
      ctx.fillText('Press ESC to resume', W/2, H/2);
      ctx.fillText('[F] Toggle fullscreen', W/2, H/2 + 30);
      ctx.fillText('Saves automatically every minute', W/2, H/2 + 60);
      ctx.textAlign = 'left';
    }

    // Death screen
    if (this.state === STATE.DEAD) {
      ctx.fillStyle = 'rgba(60,0,0,0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOU DIED!', W/2, H/2 - 40);
      ctx.fillStyle = '#FFF';
      ctx.font = '22px monospace';
      ctx.fillText('Press [R] to respawn', W/2, H/2 + 20);
      ctx.textAlign = 'left';
    }

    // Controls hint (first 30 seconds)
    if (this.gameTime < 30 && this.state === STATE.PLAYING) {
      const alpha = this.gameTime < 25 ? 0.85 : (30 - this.gameTime) / 5 * 0.85;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(W - 230, 10, 220, 160);
      ctx.fillStyle = '#FFF';
      ctx.font = '13px monospace';
      ctx.textAlign = 'right';
      const hints = [
        'Controls:',
        'A/D or ←/→ Move',
        'Space/W Jump',
        'Shift Sprint',
        'Left Click Mine',
        'Right Click Place',
        '1-9 Select item',
        'E Inventory',
        'Scroll wheel item',
        '+/- Zoom',
      ];
      hints.forEach((h, i) => {
        ctx.fillStyle = i === 0 ? '#FFD700' : '#FFF';
        ctx.fillText(h, W - 16, 28 + i * 15);
      });
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  }

  _respawn() {
    this.player.respawn();
    this.player.inventory = this.inventory;
    this.state = STATE.PLAYING;
  }

  // ─── World Restart ───────────────────────────────────────────────────────────
  async _restartWithPreset(preset) {
    this.state = STATE.LOADING;
    localStorage.removeItem('mc2d_save');

    // Show loading screen
    const loadingEl = document.getElementById('loadingScreen');
    const progressEl = document.getElementById('progressFill');
    const statusEl   = document.getElementById('loadingStatus');
    if (loadingEl) {
      loadingEl.style.transition = '';
      loadingEl.style.opacity = '1';
      loadingEl.style.display = 'flex';
    }
    if (progressEl) progressEl.style.width = '0%';

    const seed = Math.floor(Math.random() * 999999);
    this.world = new World(seed);
    this.player.world = this.world;
    this.renderer.world = this.world;
    this.entityManager = new EntityManager(this.world);

    const gen = this.world.generateGenerator(preset);
    let done = false;
    while (!done) {
      const result = gen.next();
      if (result.done) { done = true; break; }
      const pct = result.value;
      if (progressEl) progressEl.style.width = `${Math.round(pct * 100)}%`;
      if (statusEl) {
        if (pct < 0.1) statusEl.textContent = 'Generating terrain…';
        else if (pct < 0.35) statusEl.textContent = 'Placing blocks…';
        else if (pct < 0.5) statusEl.textContent = 'Carving caves…';
        else if (pct < 0.65) statusEl.textContent = 'Placing ores…';
        else if (pct < 0.75) statusEl.textContent = 'Growing trees…';
        else statusEl.textContent = 'Computing lighting…';
      }
      await new Promise(r => setTimeout(r, 0));
    }

    this.player.respawn();
    this.renderer.camX = this.player.x;
    this.renderer.camY = this.player.y + this.player.height / 2;

    if (loadingEl) {
      loadingEl.style.transition = 'opacity 0.5s';
      loadingEl.style.opacity = '0';
      setTimeout(() => loadingEl.style.display = 'none', 500);
    }
    this.state = STATE.PLAYING;
  }

  // ─── Save / Load ─────────────────────────────────────────────────────────────
  _saveGame() {
    try {
      const data = {
        version: 2,
        world: this.world.serialize(),
        player: this.player.serialize(),
        inventory: this.inventory.serialize(),
        gameTime: this.gameTime,
      };
      // Compress world blocks via base64
      const buf = data.world.blocks;
      let binary = '';
      for (const b of buf) binary += String.fromCharCode(b);
      data.world.blocks = btoa(binary);
      localStorage.setItem('mc2d_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  _loadGame() {
    try {
      const raw = localStorage.getItem('mc2d_save');
      if (!raw) return;
      const data = JSON.parse(raw);
      // Clear saves from old versions to avoid corrupted state
      if (!data.version || data.version < 2) {
        localStorage.removeItem('mc2d_save');
        return;
      }
      // Restore world blocks
      const binary = atob(data.world.blocks);
      data.world.blocks = Array.from(binary, c => c.charCodeAt(0));

      const loadedWorld = World.deserialize(data.world);
      // Copy blocks to existing world
      this.world.blocks = loadedWorld.blocks;
      this.world.lightMap = loadedWorld.lightMap;
      this.world.heightMap = loadedWorld.heightMap;

      this.player.deserialize(data.player);
      const loadedInv = Inventory.deserialize(data.inventory);
      Object.assign(this.inventory, loadedInv);
      this.gameTime = data.gameTime || 0;

      // Mark all chunks dirty for re-render
      for (let c = 0; c < Math.ceil(400 / 16); c++) {
        this.world.dirtyChunks.add(c);
      }
      console.log('Game loaded!');
    } catch (e) {
      console.warn('Load failed, starting fresh:', e);
    }
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
// Module scripts are deferred by default — DOM is ready when this runs
window._game = new Game();
