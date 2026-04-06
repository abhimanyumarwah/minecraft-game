import { BLOCK, BLOCK_DATA, drawBlock, drawItemIcon, getItemName, isBlockPlaceable } from './blocks.js';
import { ItemStack } from './inventory.js';

// Polyfill roundRect for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    r = Math.min(r, w/2, h/2);
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

const SLOT_SIZE = 44;
const SLOT_GAP = 4;
const HOTBAR_SLOTS = 9;

// All placeable block types for creative palette
const CREATIVE_BLOCKS = [
  BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND, BLOCK.GRAVEL,
  BLOCK.WOOD, BLOCK.LEAVES, BLOCK.PLANKS,
  BLOCK.WATER, BLOCK.GLASS, BLOCK.SNOW, BLOCK.ICE,
  BLOCK.COAL_ORE, BLOCK.IRON_ORE, BLOCK.GOLD_ORE, BLOCK.DIAMOND_ORE,
  BLOCK.BEDROCK, BLOCK.CRAFTING_TABLE, BLOCK.CHEST, BLOCK.TORCH,
];

export class UI {
  constructor(canvas, inventory, player) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.inventory = inventory;
    this.player = player;

    this.isInventoryOpen = false;
    this.isCraftingTableOpen = false;

    // Creative palette & env selector
    this.isCreativePaletteOpen = false;
    this.isEnvSelectorOpen = false;
    this.onEnvironmentChange = null; // callback(preset)

    // Drag state
    this.heldItem = null;
    this.heldFrom = null;
    this.mouseX = 0;
    this.mouseY = 0;

    // Tooltip
    this.tooltipText = '';
    this.tooltipX = 0;
    this.tooltipY = 0;
  }

  setMouse(x, y) { this.mouseX = x; this.mouseY = y; }

  toggleInventory() {
    this.isEnvSelectorOpen = false;
    this.isInventoryOpen = !this.isInventoryOpen;
    if (!this.isInventoryOpen) {
      this.isCraftingTableOpen = false;
      this._returnHeld();
    }
  }

  openCraftingTable() {
    this.isInventoryOpen = true;
    this.isCraftingTableOpen = true;
  }

  closeCraftingTable() {
    this.isCraftingTableOpen = false;
  }

  toggleCreativePalette() {
    this.isCreativePaletteOpen = !this.isCreativePaletteOpen;
    this.isEnvSelectorOpen = false;
    this.isInventoryOpen = false;
  }

  toggleEnvSelector() {
    this.isEnvSelectorOpen = !this.isEnvSelectorOpen;
    this.isCreativePaletteOpen = false;
    this.isInventoryOpen = false;
  }

  closeAll() {
    this.isInventoryOpen = false;
    this.isCraftingTableOpen = false;
    this.isCreativePaletteOpen = false;
    this.isEnvSelectorOpen = false;
    this._returnHeld();
  }

  _returnHeld() {
    if (this.heldItem) {
      this.inventory.addItem(this.heldItem.id, this.heldItem.count);
      this.heldItem = null;
      this.heldFrom = null;
    }
  }

  // ─── Rendering ──────────────────────────────────────────────────────────────
  render(timeOfDay, fps) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    this.tooltipText = '';

    // ── Crosshair ──────────────────────────────────────────────────────────
    const cx = W / 2, cy = H / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── Hotbar ─────────────────────────────────────────────────────────────
    this._drawHotbar(ctx, W, H);

    // ── Health & Hunger ────────────────────────────────────────────────────
    this._drawHealthHunger(ctx, W, H);

    // ── Debug / HUD info ───────────────────────────────────────────────────
    const debugH = this.player.creativeMode ? 72 : 56;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(4, 4, 220, debugH);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px monospace';
    ctx.fillText(`X: ${this.player.x.toFixed(1)}  Y: ${this.player.y.toFixed(1)}`, 10, 20);
    ctx.fillText(`FPS: ${fps}`, 10, 36);
    const tod = timeOfDay < 0.25 || timeOfDay > 0.75 ? 'Day' :
                (timeOfDay > 0.3 && timeOfDay < 0.7) ? 'Night' : 'Dusk/Dawn';
    ctx.fillText(`Time: ${tod}`, 10, 52);
    if (this.player.creativeMode) {
      ctx.fillStyle = '#7AFF4A';
      ctx.fillText(this.player.flying ? '✦ CREATIVE · FLYING' : '✦ CREATIVE MODE', 10, 68);
    }

    // ── Mode buttons (top-right) ───────────────────────────────────────────
    this._drawModeButtons(ctx, W);

    // ── Inventory screen ───────────────────────────────────────────────────
    if (this.isInventoryOpen) {
      this._drawInventory(ctx, W, H);
    }

    // ── Creative palette ───────────────────────────────────────────────────
    if (this.isCreativePaletteOpen) {
      this._drawCreativePalette(ctx, W, H);
    }

    // ── Environment selector ───────────────────────────────────────────────
    if (this.isEnvSelectorOpen) {
      this._drawEnvSelector(ctx, W, H);
    }

    // ── Held item (dragging) ───────────────────────────────────────────────
    if (this.heldItem) {
      this._drawSlotItem(ctx, this.heldItem, this.mouseX - SLOT_SIZE / 2, this.mouseY - SLOT_SIZE / 2, SLOT_SIZE, false);
    }

    // ── Tooltip ────────────────────────────────────────────────────────────
    if (this.tooltipText) {
      ctx.font = '13px monospace';
      const tw = ctx.measureText(this.tooltipText).width + 12;
      const tx = Math.min(this.tooltipX, W - tw - 4);
      const ty = Math.max(20, this.tooltipY - 24);
      ctx.fillStyle = 'rgba(20,10,30,0.88)';
      ctx.fillRect(tx, ty, tw, 20);
      ctx.strokeStyle = '#8B5FBF';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, tw, 20);
      ctx.fillStyle = '#FFF';
      ctx.fillText(this.tooltipText, tx + 6, ty + 14);
    }
  }

  _drawHotbar(ctx, W, H) {
    const inv = this.inventory;
    const totalW = HOTBAR_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const startX = (W - totalW) / 2;
    const startY = H - SLOT_SIZE - 10;

    // Background panel
    ctx.fillStyle = 'rgba(80,80,80,0.85)';
    ctx.strokeStyle = '#373737';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(startX - 6, startY - 4, totalW + 12, SLOT_SIZE + 8, 4);
    ctx.fill(); ctx.stroke();

    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const sx = startX + i * (SLOT_SIZE + SLOT_GAP);
      const sy = startY;
      const isActive = i === inv.selectedSlot;

      // Slot background
      ctx.fillStyle = isActive ? 'rgba(220,220,220,0.3)' : 'rgba(40,40,40,0.7)';
      ctx.strokeStyle = isActive ? '#FFFFFF' : '#555';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 2);
      ctx.fill(); ctx.stroke();

      const slot = inv.getHotbarSlot(i);
      if (slot) {
        this._drawSlotItem(ctx, slot, sx, sy, SLOT_SIZE, true);
        // Tooltip on hover
        if (this.mouseX >= sx && this.mouseX < sx + SLOT_SIZE &&
            this.mouseY >= sy && this.mouseY < sy + SLOT_SIZE) {
          this.tooltipText = getItemName(slot.id);
          this.tooltipX = sx; this.tooltipY = sy;
        }
      }

      // Number key label
      ctx.fillStyle = isActive ? '#FFF' : '#AAA';
      ctx.font = '10px monospace';
      ctx.fillText(`${i + 1}`, sx + 3, sy + 12);
    }
  }

  _drawHealthHunger(ctx, W, H) {
    const startY = H - SLOT_SIZE - 10 - 28;
    const totalW = HOTBAR_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const startX = (W - totalW) / 2;

    // Health hearts (left side)
    const maxHearts = 10;
    for (let i = 0; i < maxHearts; i++) {
      const hx = startX + i * 18;
      const filled = this.player.health / this.player.maxHealth * maxHearts;
      const isFull = i < Math.floor(filled);
      const isHalf = !isFull && i < filled;
      this._drawHeart(ctx, hx, startY, isFull ? 1 : (isHalf ? 0.5 : 0));
    }

    // Hunger icons (right side)
    const hungerStartX = startX + totalW - maxHearts * 18;
    for (let i = 0; i < maxHearts; i++) {
      const hx = hungerStartX + i * 18;
      const filled = this.player.hunger / this.player.maxHunger * maxHearts;
      const isFull = i < Math.floor(filled);
      const isHalf = !isFull && i < filled;
      this._drawHunger(ctx, hx, startY, isFull ? 1 : (isHalf ? 0.5 : 0));
    }
  }

  _drawHeart(ctx, x, y, fill) {
    // Heart shape using simple rects (pixel art)
    const heartPixels = [
      [1,0,3,2], [5,0,3,2], // top bumps
      [0,1,8,5], // main body
      [1,5,6,1], [2,6,4,1], [3,7,2,1], // bottom point
    ];
    const emptyColor = '#373737';
    const fillColor = '#E31C1C';
    const halfColor = '#E31C1C';
    const s = 2;

    // Empty base
    ctx.fillStyle = emptyColor;
    for (const [hx, hy, hw, hh] of heartPixels) {
      ctx.fillRect(x + hx*s, y + hy*s, hw*s, hh*s);
    }

    if (fill > 0) {
      ctx.fillStyle = fill >= 1 ? fillColor : halfColor;
      const clipW = fill >= 1 ? 16 : 8;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, clipW, 16);
      ctx.clip();
      for (const [hx, hy, hw, hh] of heartPixels) {
        ctx.fillRect(x + hx*s, y + hy*s, hw*s, hh*s);
      }
      ctx.restore();
    }
  }

  _drawHunger(ctx, x, y, fill) {
    // Drumstick shape
    const emptyColor = '#373737';
    const fullColor = '#C87137';
    ctx.fillStyle = fill > 0 ? fullColor : emptyColor;
    ctx.beginPath();
    ctx.ellipse(x + 6, y + 4, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill > 0 ? '#A05A2A' : '#222';
    ctx.fillRect(x + 3, y + 6, 2, 8);
    if (fill < 1 && fill > 0) {
      // half: clip right side
      ctx.fillStyle = emptyColor;
      ctx.fillRect(x + 7, y, 10, 16);
    }
  }

  _drawSlotItem(ctx, item, sx, sy, size, showCount) {
    if (!item || !item.id) return;
    const isBlock = item.id > 0 && item.id <= 20 && BLOCK_DATA[item.id];
    if (isBlock) {
      drawBlock(ctx, item.id, sx + 4, sy + 4, size - 8, 0);
    } else {
      drawItemIcon(ctx, item.id, sx + 4, sy + 4, size - 8);
    }
    if (showCount && item.count > 1) {
      ctx.fillStyle = '#FFF';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 11px monospace';
      const countText = item.count.toString();
      const tx = sx + size - 3 - ctx.measureText(countText).width;
      ctx.strokeText(countText, tx, sy + size - 3);
      ctx.fillText(countText, tx, sy + size - 3);
    }
  }

  _drawInventory(ctx, W, H) {
    const is3x3 = this.isCraftingTableOpen;
    const gridSize = is3x3 ? 3 : 2;
    const craftCols = gridSize;
    const craftW = craftCols * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const invW = 9 * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const panelW = Math.max(craftW + 20 + SLOT_SIZE + 80, invW) + 40;
    const panelH = 40 + gridSize * (SLOT_SIZE + SLOT_GAP) + 10 + 3 * (SLOT_SIZE + SLOT_GAP) + 30 + SLOT_SIZE + 20;
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2;

    // Background
    ctx.fillStyle = 'rgba(30,30,30,0.95)';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, panelH, 6);
    ctx.fill(); ctx.stroke();

    // Title
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(is3x3 ? 'Crafting Table' : 'Inventory', px + 16, py + 26);

    // Crafting grid
    const craftStartX = px + 16;
    const craftStartY = py + 36;
    const craftGrid = is3x3 ? this.inventory.craftGrid3 : this.inventory.craftGrid2;
    for (let i = 0; i < gridSize * gridSize; i++) {
      const gx = craftStartX + (i % gridSize) * (SLOT_SIZE + SLOT_GAP);
      const gy = craftStartY + Math.floor(i / gridSize) * (SLOT_SIZE + SLOT_GAP);
      this._drawSlot(ctx, gx, gy, craftGrid[i], 'craft', i, is3x3);
    }

    // Arrow →
    const arrowX = craftStartX + craftW + 8;
    const arrowY = craftStartY + (gridSize * (SLOT_SIZE + SLOT_GAP)) / 2 - SLOT_SIZE / 2;
    ctx.fillStyle = '#AAA';
    ctx.font = '24px sans-serif';
    ctx.fillText('→', arrowX, arrowY + SLOT_SIZE * 0.65);

    // Output slot
    const outX = arrowX + 36;
    const outY = arrowY;
    const craftOutput = this.inventory.computeCraftOutput(is3x3);
    this._drawSlot(ctx, outX, outY, craftOutput, 'output', 0, is3x3, true);

    // Main inventory (3 rows, 9 cols)
    const mainStartY = craftStartY + gridSize * (SLOT_SIZE + SLOT_GAP) + 16;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 9; col++) {
        const si = 9 + row * 9 + col; // slots 9-35
        const gx = px + 16 + col * (SLOT_SIZE + SLOT_GAP);
        const gy = mainStartY + row * (SLOT_SIZE + SLOT_GAP);
        this._drawSlot(ctx, gx, gy, this.inventory.slots[si], 'main', si, is3x3);
      }
    }

    // Hotbar row
    const hotbarY = mainStartY + 3 * (SLOT_SIZE + SLOT_GAP) + 8;
    for (let col = 0; col < 9; col++) {
      const gx = px + 16 + col * (SLOT_SIZE + SLOT_GAP);
      this._drawSlot(ctx, gx, hotbarY, this.inventory.slots[col], 'main', col, is3x3);
    }

    // Close hint
    ctx.fillStyle = '#888';
    ctx.font = '11px monospace';
    ctx.fillText('[E] Close', px + panelW - 70, py + panelH - 8);
  }

  _drawSlot(ctx, sx, sy, item, type, index, is3x3, isOutput = false) {
    const hover = this.mouseX >= sx && this.mouseX < sx + SLOT_SIZE &&
                  this.mouseY >= sy && this.mouseY < sy + SLOT_SIZE;
    ctx.fillStyle = isOutput ? 'rgba(60,30,60,0.6)' : 'rgba(40,40,40,0.7)';
    ctx.strokeStyle = hover ? '#FFD700' : '#555';
    ctx.lineWidth = hover ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 2);
    ctx.fill(); ctx.stroke();

    if (item) {
      this._drawSlotItem(ctx, item, sx, sy, SLOT_SIZE, true);
      if (hover) {
        this.tooltipText = getItemName(item.id);
        this.tooltipX = sx; this.tooltipY = sy;
      }
    }
  }

  // ─── Input Handling ──────────────────────────────────────────────────────────
  handleClick(screenX, screenY, button) {
    if (!this.isInventoryOpen) return false;

    const is3x3 = this.isCraftingTableOpen;
    const gridSize = is3x3 ? 3 : 2;
    const W = this.canvas.width, H = this.canvas.height;
    const craftW = gridSize * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const invW = 9 * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const panelW = Math.max(craftW + 20 + SLOT_SIZE + 80, invW) + 40;
    const panelH = 40 + gridSize * (SLOT_SIZE + SLOT_GAP) + 10 + 3 * (SLOT_SIZE + SLOT_GAP) + 30 + SLOT_SIZE + 20;
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2;

    const craftStartX = px + 16;
    const craftStartY = py + 36;
    const craftGrid = is3x3 ? this.inventory.craftGrid3 : this.inventory.craftGrid2;

    // Check crafting grid
    for (let i = 0; i < gridSize * gridSize; i++) {
      const gx = craftStartX + (i % gridSize) * (SLOT_SIZE + SLOT_GAP);
      const gy = craftStartY + Math.floor(i / gridSize) * (SLOT_SIZE + SLOT_GAP);
      if (screenX >= gx && screenX < gx + SLOT_SIZE && screenY >= gy && screenY < gy + SLOT_SIZE) {
        this._swapSlot(craftGrid, i, button);
        return true;
      }
    }

    // Check output slot
    const arrowX = craftStartX + craftW + 8;
    const arrowY = craftStartY + (gridSize * (SLOT_SIZE + SLOT_GAP)) / 2 - SLOT_SIZE / 2;
    const outX = arrowX + 36, outY = arrowY;
    if (screenX >= outX && screenX < outX + SLOT_SIZE && screenY >= outY && screenY < outY + SLOT_SIZE) {
      const result = this.inventory.craft(is3x3);
      if (result) {
        if (this.heldItem && this.heldItem.id === result.id && this.heldItem.count < 64) {
          this.heldItem.count = Math.min(64, this.heldItem.count + result.count);
        } else {
          if (this.heldItem) this.inventory.addItem(this.heldItem.id, this.heldItem.count);
          this.heldItem = result.clone();
        }
      }
      return true;
    }

    // Check main inventory
    const mainStartY = craftStartY + gridSize * (SLOT_SIZE + SLOT_GAP) + 16;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 9; col++) {
        const si = 9 + row * 9 + col;
        const gx = px + 16 + col * (SLOT_SIZE + SLOT_GAP);
        const gy = mainStartY + row * (SLOT_SIZE + SLOT_GAP);
        if (screenX >= gx && screenX < gx + SLOT_SIZE && screenY >= gy && screenY < gy + SLOT_SIZE) {
          this._swapSlot(this.inventory.slots, si, button);
          return true;
        }
      }
    }

    // Check hotbar row
    const hotbarY = mainStartY + 3 * (SLOT_SIZE + SLOT_GAP) + 8;
    for (let col = 0; col < 9; col++) {
      const gx = px + 16 + col * (SLOT_SIZE + SLOT_GAP);
      if (screenX >= gx && screenX < gx + SLOT_SIZE && screenY >= hotbarY && screenY < hotbarY + SLOT_SIZE) {
        this._swapSlot(this.inventory.slots, col, button);
        return true;
      }
    }

    // Clicked outside panel - drop held
    if (screenX < px || screenX > px + panelW || screenY < py || screenY > py + panelH) {
      // Keep held item
    }
    return false;
  }

  _swapSlot(arr, index, button) {
    if (button === 2 && !this.heldItem && arr[index]) {
      // Right-click: pick up half
      const slot = arr[index];
      const half = Math.ceil(slot.count / 2);
      this.heldItem = new ItemStack(slot.id, half);
      slot.count -= half;
      if (slot.count <= 0) arr[index] = null;
      return;
    }
    if (button === 2 && this.heldItem && arr[index] === null) {
      // Right-click place 1
      arr[index] = new ItemStack(this.heldItem.id, 1);
      this.heldItem.count--;
      if (this.heldItem.count <= 0) this.heldItem = null;
      return;
    }
    if (button === 2 && this.heldItem && arr[index] && arr[index].id === this.heldItem.id) {
      // Right-click: add 1 to stack
      if (arr[index].count < 64) {
        arr[index].count++;
        this.heldItem.count--;
        if (this.heldItem.count <= 0) this.heldItem = null;
      }
      return;
    }
    // Left-click: full swap
    const tmp = arr[index] ? arr[index].clone() : null;
    arr[index] = this.heldItem ? this.heldItem.clone() : null;
    this.heldItem = tmp;
  }

  handleKeyDown(e) {
    const key = e.key;
    if (key >= '1' && key <= '9') {
      this.inventory.selectedSlot = parseInt(key) - 1;
    }
    if (e.code === 'KeyE') this.toggleInventory();
  }

  handleScroll(delta) {
    if (this.isInventoryOpen) return;
    this.inventory.selectedSlot = (this.inventory.selectedSlot + (delta > 0 ? 1 : -1) + 9) % 9;
  }
}
