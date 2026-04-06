import { BLOCK, BLOCK_DATA, ITEM_DATA } from './blocks.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './world.js';
import { ItemStack } from './inventory.js';

const GRAVITY      = 30;
const JUMP_VEL     = -12;
const WALK_SPEED   = 4.5;
const SPRINT_SPEED = 7.0;
const SWIM_SPEED   = 2.5;
const MAX_FALL     = 55;
const MINING_RANGE = 5;

export class Player {
  constructor(world, inventory) {
    this.world = world;
    this.inventory = inventory;

    // Position (feet center)
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.inWater = false;

    // Dimensions
    this.width  = 0.6;
    this.height = 1.8;

    // Health / hunger
    this.health  = 20;
    this.maxHealth = 20;
    this.hunger  = 20;
    this.maxHunger = 20;
    this._hungerTimer = 0;
    this._healthRegen = 0;

    // Mining
    this.miningBlock    = null; // {bx, by}
    this.miningProgress = 0;
    this.miningTime     = 0;

    // Creative mode
    this.creativeMode = false;
    this.flying = false;
    this._jumpPressTime = -1; // for double-tap detection
    this._flyVy = 0;

    // Animation
    this.walkCycle  = 0;
    this.facingLeft = false;
    this.isMoving   = false;

    // Spawn
    this._spawn();
  }

  _spawn() {
    const cx = Math.floor(WORLD_WIDTH / 2);
    // Find surface
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const b = this.world.getBlock(cx, y);
      if (b !== BLOCK.AIR && b !== BLOCK.WATER && BLOCK_DATA[b] && BLOCK_DATA[b].solid) {
        this.x = cx + 0.5;
        this.y = y - this.height;
        return;
      }
    }
    this.x = cx + 0.5;
    this.y = 60;
  }

  // ─── Physics Update ─────────────────────────────────────────────────────────
  update(dt, input) {
    // Hunger/health ticks (skip in creative)
    if (!this.creativeMode) {
      this._hungerTimer += dt;
      if (this._hungerTimer > 4) {
        this._hungerTimer = 0;
        if (this.isMoving && this.hunger > 0) this.hunger = Math.max(0, this.hunger - 0.5);
        if (this.hunger >= 18 && this.health < this.maxHealth) this.health = Math.min(this.maxHealth, this.health + 1);
        else if (this.hunger === 0) this.health = Math.max(1, this.health - 1);
      }
    } else {
      this.health = this.maxHealth;
      this.hunger = this.maxHunger;
    }

    // Determine if in water
    const centerX = this.x;
    const feetY = this.y + this.height - 0.1;
    this.inWater = this.world.getBlock(Math.floor(centerX), Math.floor(feetY)) === BLOCK.WATER ||
                   this.world.getBlock(Math.floor(centerX), Math.floor(this.y + 0.5)) === BLOCK.WATER;

    // ── Creative flying ──────────────────────────────────────────────────────
    if (this.creativeMode) {
      // Double-tap Space to toggle fly
      if (input.jumpJustPressed) {
        const now = performance.now();
        if (now - this._jumpPressTime < 300) {
          this.flying = !this.flying;
          this._flyVy = 0;
        }
        this._jumpPressTime = now;
      }

      if (this.flying) {
        const flySpeed = input.sprint ? 14 : 8;
        const hspd = input.sprint ? flySpeed : WALK_SPEED * 1.5;
        if (input.left)       { this.vx = -hspd; this.facingLeft = true;  this.isMoving = true; }
        else if (input.right) { this.vx =  hspd; this.facingLeft = false; this.isMoving = true; }
        else                  { this.vx = 0; this.isMoving = false; }
        if (input.jump)       this._flyVy = -flySpeed;
        else if (input.sneak) this._flyVy =  flySpeed;
        else                  this._flyVy *= 0.8;

        const nx2 = this.x + this.vx * dt;
        if (!this._collidesAt(nx2, this.y)) this.x = nx2; else this.vx = 0;
        const ny2 = this.y + this._flyVy * dt;
        if (!this._collidesAt(this.x, ny2)) this.y = ny2;
        else { this._flyVy = 0; if (this._flyVy > 0) { this.flying = false; } }
        this.vy = 0; this.onGround = false;
        this.x = Math.max(this.width/2, Math.min(WORLD_WIDTH - this.width/2, this.x));
        this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.y));
        if (this.isMoving) this.walkCycle += dt * 6;
        else this.walkCycle *= 0.85;
        this._miningTick(dt);
        return;
      }
    }

    // ── Normal physics ───────────────────────────────────────────────────────
    const baseSpeed = this.creativeMode ? WALK_SPEED * 1.4 : WALK_SPEED;
    const speed = input.sprint && !this.inWater ? (this.creativeMode ? baseSpeed * 1.6 : SPRINT_SPEED)
                : this.inWater ? SWIM_SPEED : baseSpeed;

    if (input.left)       { this.vx = -speed; this.facingLeft = true;  this.isMoving = true; }
    else if (input.right) { this.vx =  speed; this.facingLeft = false; this.isMoving = true; }
    else                  { this.vx = 0; this.isMoving = false; }

    // Jump / swim
    if (input.jump) {
      if (this.inWater) {
        this.vy = -SWIM_SPEED;
      } else if (this.onGround) {
        this.vy = JUMP_VEL;
        this.onGround = false;
      }
    }

    // Gravity
    if (this.inWater) {
      this.vy += 6 * dt;
      this.vy = Math.min(this.vy, 3);
    } else {
      this.vy += GRAVITY * dt;
      this.vy = Math.min(this.vy, MAX_FALL);
    }

    // Move X
    const nx = this.x + this.vx * dt;
    if (!this._collidesAt(nx, this.y)) this.x = nx;
    else this.vx = 0;

    // Move Y
    const ny = this.y + this.vy * dt;
    this.onGround = false;
    if (!this._collidesAt(this.x, ny)) {
      this.y = ny;
    } else {
      if (this.vy > 0) {
        this.y = Math.floor(this.y + this.height) - this.height;
        this.onGround = true;
        if (this.creativeMode) this.flying = false;
      } else {
        this.y = Math.floor(this.y - 0.01) + 1;
      }
      this.vy = 0;
    }

    // Clamp to world
    this.x = Math.max(this.width / 2, Math.min(WORLD_WIDTH - this.width / 2, this.x));
    this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.y));

    // Walking animation
    if (this.isMoving && this.onGround) this.walkCycle += dt * 8;
    else this.walkCycle *= 0.8;

    this._miningTick(dt);
  }

  _miningTick(dt) {
    // Mining
    if (this.miningBlock) {
      const blockId = this.world.getBlock(this.miningBlock.bx, this.miningBlock.by);
      const hardness = BLOCK_DATA[blockId]?.hardness ?? 1;
      if (hardness === Infinity) {
        // Bedrock - can't mine even in creative
      } else if (this.creativeMode) {
        // Instant break in creative
        this._breakBlock(this.miningBlock.bx, this.miningBlock.by, true);
        this.miningBlock = null; this.miningProgress = 0; this.miningTime = 0;
      } else {
        const toolMult = this._getToolMultiplier(this.miningBlock.bx, this.miningBlock.by);
        this.miningTime += dt;
        this.miningProgress = Math.min(1, this.miningTime / (hardness / toolMult));
        if (this.miningProgress >= 1) {
          this._breakBlock(this.miningBlock.bx, this.miningBlock.by, false);
          this.miningBlock = null; this.miningProgress = 0; this.miningTime = 0;
        }
      }
    }
  }

  _collidesAt(px, py) {
    const bx1 = Math.floor(px - this.width / 2);
    const bx2 = Math.floor(px + this.width / 2 - 0.001);
    const by1 = Math.floor(py);
    const by2 = Math.floor(py + this.height - 0.001);
    for (let ty = by1; ty <= by2; ty++) {
      for (let tx = bx1; tx <= bx2; tx++) {
        if (this.world.isSolid(tx, ty)) return true;
      }
    }
    return false;
  }

  _getToolMultiplier(bx, by) {
    const blockId = this.world.getBlock(bx, by);
    const blockData = BLOCK_DATA[blockId];
    if (!blockData) return 1;
    const item = this.inventory.getActiveItem();
    if (!item) return 1;
    const itemData = ITEM_DATA[item.id];
    if (!itemData || !itemData.tool) return 1;
    if (blockData.tool === itemData.tool || blockData.tool === 'any') {
      return itemData.speed || 2;
    }
    return 1;
  }

  _breakBlock(bx, by, creative = false) {
    const blockId = this.world.getBlock(bx, by);
    const blockData = BLOCK_DATA[blockId];
    if (!blockData) return;
    // Add drops to inventory (skip in creative to avoid clutter)
    if (!creative) {
      for (const drop of blockData.drops) {
        this.inventory.addItem(drop.id, drop.count);
      }
    }
    this.world.setBlock(bx, by, BLOCK.AIR);
  }

  startMining(bx, by) {
    if (this.miningBlock && this.miningBlock.bx === bx && this.miningBlock.by === by) return;
    const dist = Math.hypot(bx + 0.5 - this.x, by + 0.5 - (this.y + this.height / 2));
    if (dist > MINING_RANGE) return;
    const blockId = this.world.getBlock(bx, by);
    if (blockId === BLOCK.AIR) return;
    const blockData = BLOCK_DATA[blockId];
    if (!blockData || blockData.hardness === Infinity) return;
    this.miningBlock = { bx, by };
    this.miningProgress = 0;
    this.miningTime = 0;
  }

  stopMining() {
    this.miningBlock = null;
    this.miningProgress = 0;
    this.miningTime = 0;
  }

  placeBlock(bx, by) {
    const dist = Math.hypot(bx + 0.5 - this.x, by + 0.5 - (this.y + this.height / 2));
    if (dist > MINING_RANGE) return false;
    if (this.world.getBlock(bx, by) !== BLOCK.AIR) return false;
    // Check not overlapping player
    const px1 = this.x - this.width / 2, px2 = this.x + this.width / 2;
    const py1 = this.y, py2 = this.y + this.height;
    if (bx + 1 > px1 && bx < px2 && by + 1 > py1 && by < py2) return false;

    const item = this.inventory.getActiveItem();
    if (!item) return false;
    const blockId = item.id;
    if (blockId <= 0 || blockId > 20) return false;
    const data = BLOCK_DATA[blockId];
    if (!data || blockId === BLOCK.WATER) return false;

    this.world.setBlock(bx, by, blockId);
    // In creative mode, don't consume items
    if (!this.creativeMode) {
      this.inventory.removeFromSlot(this.inventory.selectedSlot, 1);
    }
    return true;
  }

  getTargetBlock(mouseWorldX, mouseWorldY) {
    const bx = Math.floor(mouseWorldX);
    const by = Math.floor(mouseWorldY);
    if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return null;
    const dist = Math.hypot(bx + 0.5 - this.x, by + 0.5 - (this.y + this.height / 2));
    if (dist > MINING_RANGE) return null;
    // Return block position - AIR blocks are included for right-click placement context
    return { bx, by };
  }

  getPlaceFace(mouseWorldX, mouseWorldY) {
    // Return adjacent block position to place in
    const bx = Math.floor(mouseWorldX);
    const by = Math.floor(mouseWorldY);
    if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return null;
    const dist = Math.hypot(bx + 0.5 - this.x, by + 0.5 - (this.y + this.height / 2));
    if (dist > MINING_RANGE) return null;

    // Find which face of existing block is clicked
    const fx = mouseWorldX - bx - 0.5;
    const fy = mouseWorldY - by - 0.5;
    let ax = 0, ay = 0;
    if (Math.abs(fx) > Math.abs(fy)) ax = fx > 0 ? 1 : -1;
    else ay = fy > 0 ? 1 : -1;

    // If clicking on solid block, place on adjacent face
    const clickedBlock = this.world.getBlock(bx, by);
    if (clickedBlock !== BLOCK.AIR && clickedBlock !== BLOCK.WATER) {
      return { bx: bx + ax, by: by + ay };
    }
    // If clicking on air, place at clicked position
    return { bx, by };
  }

  takeDamage(amount) {
    if (this.creativeMode) return; // invincible in creative
    this.health = Math.max(0, this.health - amount);
  }

  eat(foodValue) {
    this.hunger = Math.min(this.maxHunger, this.hunger + foodValue);
  }

  isDead() { return !this.creativeMode && this.health <= 0; }

  // Set a hotbar slot to a specific block (used by creative palette)
  setHotbarBlock(slot, blockId) {
    this.inventory.slots[slot] = blockId > 0 ? new ItemStack(blockId, 64) : null;
  }

  respawn() {
    this.health = 20;
    this.hunger = 20;
    this._spawn();
  }

  getBoundingBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y,
      w: this.width,
      h: this.height
    };
  }

  serialize() {
    return { x: this.x, y: this.y, vx: this.vx, vy: this.vy, health: this.health, hunger: this.hunger };
  }

  deserialize(data) {
    this.x = data.x; this.y = data.y;
    this.vx = data.vx || 0; this.vy = data.vy || 0;
    this.health = data.health || 20;
    this.hunger = data.hunger || 20;
  }
}
