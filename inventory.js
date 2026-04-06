import { BLOCK, ITEM_DATA } from './blocks.js';

export class ItemStack {
  constructor(id, count = 1) {
    this.id = id;
    this.count = count;
  }
  clone() { return new ItemStack(this.id, this.count); }
}

export class Inventory {
  constructor() {
    // slots 0-8 = hotbar, 9-35 = inventory
    this.slots = new Array(36).fill(null);
    this.selectedSlot = 0; // 0-8
    // 2x2 personal crafting grid (slots 0-3) + output slot
    this.craftGrid2 = new Array(4).fill(null);
    this.craftGrid3 = new Array(9).fill(null); // crafting table 3x3
    this.craftOutput = null;
    this.usingCraftingTable = false;
  }

  // Add item, returns leftover count
  addItem(id, count = 1) {
    // First try to stack with existing
    for (let i = 0; i < 36; i++) {
      if (this.slots[i] && this.slots[i].id === id && this.slots[i].count < 64) {
        const space = 64 - this.slots[i].count;
        const add = Math.min(space, count);
        this.slots[i].count += add;
        count -= add;
        if (count <= 0) return 0;
      }
    }
    // Then fill empty slots
    for (let i = 0; i < 36; i++) {
      if (!this.slots[i]) {
        const add = Math.min(64, count);
        this.slots[i] = new ItemStack(id, add);
        count -= add;
        if (count <= 0) return 0;
      }
    }
    return count; // leftover
  }

  removeFromSlot(slotIdx, count = 1) {
    const slot = this.slots[slotIdx];
    if (!slot) return false;
    slot.count -= count;
    if (slot.count <= 0) this.slots[slotIdx] = null;
    return true;
  }

  getHotbarSlot(i) { return this.slots[i] || null; }
  getActiveItem() { return this.slots[this.selectedSlot] || null; }

  hasItem(id, count = 1) {
    let found = 0;
    for (const s of this.slots) {
      if (s && s.id === id) found += s.count;
    }
    return found >= count;
  }

  consumeItem(id, count = 1) {
    let needed = count;
    for (let i = 0; i < 36; i++) {
      if (this.slots[i] && this.slots[i].id === id) {
        const take = Math.min(this.slots[i].count, needed);
        this.slots[i].count -= take;
        if (this.slots[i].count <= 0) this.slots[i] = null;
        needed -= take;
        if (needed <= 0) return true;
      }
    }
    return needed <= 0;
  }

  // ─── Crafting ────────────────────────────────────────────────────────────────
  computeCraftOutput(is3x3 = false) {
    const grid = is3x3 ? this.craftGrid3 : this.craftGrid2;
    const size = is3x3 ? 3 : 2;
    const result = matchRecipes(grid, size);
    this[is3x3 ? 'craftOutput3' : 'craftOutput'] = result;
    return result;
  }

  craft(is3x3 = false) {
    const grid = is3x3 ? this.craftGrid3 : this.craftGrid2;
    const output = this.computeCraftOutput(is3x3);
    if (!output) return null;
    // Consume ingredients
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) {
        grid[i].count--;
        if (grid[i].count <= 0) grid[i] = null;
      }
    }
    this[is3x3 ? 'craftOutput3' : 'craftOutput'] = null;
    return output;
  }

  serialize() {
    return {
      slots: this.slots.map(s => s ? { id: s.id, count: s.count } : null),
      selectedSlot: this.selectedSlot,
    };
  }

  static deserialize(data) {
    const inv = new Inventory();
    inv.slots = data.slots.map(s => s ? new ItemStack(s.id, s.count) : null);
    inv.selectedSlot = data.selectedSlot || 0;
    return inv;
  }
}

// ─── Recipes ─────────────────────────────────────────────────────────────────
const RECIPES = [
  // Shapeless
  { type: 'shapeless', inputs: [{ id: BLOCK.WOOD, count: 1 }], output: { id: BLOCK.PLANKS, count: 4 } },
  { type: 'shapeless', inputs: [{ id: BLOCK.PLANKS, count: 2 }], output: { id: BLOCK.STICK, count: 4 } },
  { type: 'shapeless', inputs: [{ id: BLOCK.WOOD, count: 1 }, { id: BLOCK.WOOD, count: 1 }], output: { id: BLOCK.PLANKS, count: 8 } },

  // Shaped 2x2
  {
    type: 'shaped', size: 2,
    pattern: [[BLOCK.PLANKS, BLOCK.PLANKS], [BLOCK.PLANKS, BLOCK.PLANKS]],
    output: { id: BLOCK.CRAFTING_TABLE, count: 1 }
  },

  // Shaped 3x3 — Wooden Pickaxe
  {
    type: 'shaped', size: 3,
    pattern: [
      [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
      [null, BLOCK.STICK, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.WOODEN_PICKAXE, count: 1 }
  },
  // Stone Pickaxe
  {
    type: 'shaped', size: 3,
    pattern: [
      [BLOCK.STONE, BLOCK.STONE, BLOCK.STONE],
      [null, BLOCK.STICK, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.STONE_PICKAXE, count: 1 }
  },
  // Iron Pickaxe
  {
    type: 'shaped', size: 3,
    pattern: [
      [BLOCK.IRON_INGOT, BLOCK.IRON_INGOT, BLOCK.IRON_INGOT],
      [null, BLOCK.STICK, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.IRON_PICKAXE, count: 1 }
  },
  // Wooden Axe
  {
    type: 'shaped', size: 3,
    pattern: [
      [BLOCK.PLANKS, BLOCK.PLANKS, null],
      [BLOCK.PLANKS, BLOCK.STICK, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.WOODEN_AXE, count: 1 }
  },
  // Stone Axe
  {
    type: 'shaped', size: 3,
    pattern: [
      [BLOCK.STONE, BLOCK.STONE, null],
      [BLOCK.STONE, BLOCK.STICK, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.STONE_AXE, count: 1 }
  },
  // Wooden Shovel
  {
    type: 'shaped', size: 3,
    pattern: [
      [null, BLOCK.PLANKS, null],
      [null, BLOCK.STICK, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.WOODEN_SHOVEL, count: 1 }
  },
  // Wooden Sword
  {
    type: 'shaped', size: 3,
    pattern: [
      [null, BLOCK.PLANKS, null],
      [null, BLOCK.PLANKS, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.WOODEN_SWORD, count: 1 }
  },
  // Stone Sword
  {
    type: 'shaped', size: 3,
    pattern: [
      [null, BLOCK.STONE, null],
      [null, BLOCK.STONE, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.STONE_SWORD, count: 1 }
  },
  // Iron Sword
  {
    type: 'shaped', size: 3,
    pattern: [
      [null, BLOCK.IRON_INGOT, null],
      [null, BLOCK.IRON_INGOT, null],
      [null, BLOCK.STICK, null],
    ],
    output: { id: BLOCK.IRON_SWORD, count: 1 }
  },
  // Torch (4 torches from 1 coal + 1 stick)
  {
    type: 'shaped', size: 2,
    pattern: [
      [BLOCK.COAL, null],
      [BLOCK.STICK, null],
    ],
    output: { id: BLOCK.TORCH, count: 4 }
  },
  {
    type: 'shaped', size: 3,
    pattern: [
      [null, BLOCK.COAL, null],
      [null, BLOCK.STICK, null],
      [null, null, null],
    ],
    output: { id: BLOCK.TORCH, count: 4 }
  },
  // Glass (would need furnace, skip for now - just allow direct)
  // Planks to chest
  {
    type: 'shaped', size: 3,
    pattern: [
      [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
      [BLOCK.PLANKS, null, BLOCK.PLANKS],
      [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
    ],
    output: { id: BLOCK.CHEST, count: 1 }
  },
];

function matchRecipes(grid, size) {
  for (const recipe of RECIPES) {
    if (recipe.type === 'shapeless') {
      const result = tryShapeless(grid, recipe);
      if (result) return new ItemStack(result.id, result.count);
    } else if (recipe.type === 'shaped') {
      const result = tryShaped(grid, size, recipe);
      if (result) return new ItemStack(result.id, result.count);
    }
  }
  return null;
}

function tryShapeless(grid, recipe) {
  // Count available items in grid
  const available = {};
  for (const slot of grid) {
    if (slot) available[slot.id] = (available[slot.id] || 0) + slot.count;
  }
  // Check all inputs
  const needed = {};
  for (const inp of recipe.inputs) {
    needed[inp.id] = (needed[inp.id] || 0) + inp.count;
  }
  // Total grid items must equal needed items exactly
  let totalGrid = 0;
  for (const slot of grid) { if (slot) totalGrid += 1; }
  let totalNeeded = recipe.inputs.length;
  if (totalGrid !== totalNeeded) return null;

  for (const [id, cnt] of Object.entries(needed)) {
    if ((available[id] || 0) < cnt) return null;
  }
  return recipe.output;
}

function tryShaped(grid, gridSize, recipe) {
  const patSize = recipe.size;
  // Try to match pattern in grid (allowing offset within the grid)
  const maxOffX = gridSize - patSize;
  const maxOffY = gridSize - patSize;
  for (let oy = 0; oy <= maxOffY; oy++) {
    for (let ox = 0; ox <= maxOffX; ox++) {
      if (matchPatternAt(grid, gridSize, recipe.pattern, patSize, ox, oy)) {
        return recipe.output;
      }
    }
  }
  return null;
}

function matchPatternAt(grid, gridSize, pattern, patSize, ox, oy) {
  // Check that cells OUTSIDE the pattern offset are empty
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const slot = grid[y * gridSize + x];
      const px = x - ox, py = y - oy;
      if (px < 0 || px >= patSize || py < 0 || py >= patSize) {
        if (slot !== null) return false;
      } else {
        const expected = pattern[py][px];
        if (expected === null) {
          if (slot !== null) return false;
        } else {
          if (!slot || slot.id !== expected) return false;
        }
      }
    }
  }
  return true;
}
