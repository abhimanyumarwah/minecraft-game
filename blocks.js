// Block IDs
export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  WOOD: 6,
  LEAVES: 7,
  COAL_ORE: 8,
  IRON_ORE: 9,
  GOLD_ORE: 10,
  DIAMOND_ORE: 11,
  GRAVEL: 12,
  BEDROCK: 13,
  PLANKS: 14,
  CRAFTING_TABLE: 15,
  CHEST: 16,
  TORCH: 17,
  GLASS: 18,
  SNOW: 19,
  ICE: 20,
  COAL: 21,
  IRON_INGOT: 22,
  GOLD_INGOT: 23,
  DIAMOND: 24,
  STICK: 25,
  APPLE: 26,
  WOODEN_PICKAXE: 30,
  STONE_PICKAXE: 31,
  IRON_PICKAXE: 32,
  WOODEN_AXE: 33,
  STONE_AXE: 34,
  WOODEN_SHOVEL: 35,
  STONE_SHOVEL: 36,
  WOODEN_SWORD: 37,
  STONE_SWORD: 38,
  IRON_SWORD: 39,
  COOKED_PORKCHOP: 40,
  RAW_PORKCHOP: 41,
};

// Hardness in seconds to mine with bare hands
export const BLOCK_DATA = {
  [BLOCK.AIR]:            { name: 'Air',           hardness: 0,        transparent: true,  solid: false, lightEmission: 0,  tool: null,      drops: [] },
  [BLOCK.GRASS]:          { name: 'Grass',          hardness: 0.6,      transparent: false, solid: true,  lightEmission: 0,  tool: 'shovel',  drops: [{ id: BLOCK.DIRT, count: 1 }] },
  [BLOCK.DIRT]:           { name: 'Dirt',           hardness: 0.5,      transparent: false, solid: true,  lightEmission: 0,  tool: 'shovel',  drops: [{ id: BLOCK.DIRT, count: 1 }] },
  [BLOCK.STONE]:          { name: 'Stone',          hardness: 1.5,      transparent: false, solid: true,  lightEmission: 0,  tool: 'pickaxe', drops: [{ id: BLOCK.STONE, count: 1 }] },
  [BLOCK.SAND]:           { name: 'Sand',           hardness: 0.5,      transparent: false, solid: true,  lightEmission: 0,  tool: 'shovel',  drops: [{ id: BLOCK.SAND, count: 1 }] },
  [BLOCK.WATER]:          { name: 'Water',          hardness: Infinity, transparent: true,  solid: false, lightEmission: 0,  tool: null,      drops: [] },
  [BLOCK.WOOD]:           { name: 'Wood',           hardness: 2.0,      transparent: false, solid: true,  lightEmission: 0,  tool: 'axe',     drops: [{ id: BLOCK.WOOD, count: 1 }] },
  [BLOCK.LEAVES]:         { name: 'Leaves',         hardness: 0.2,      transparent: true,  solid: true,  lightEmission: 0,  tool: 'any',     drops: [] },
  [BLOCK.COAL_ORE]:       { name: 'Coal Ore',       hardness: 3.0,      transparent: false, solid: true,  lightEmission: 0,  tool: 'pickaxe', drops: [{ id: BLOCK.COAL, count: 1 }] },
  [BLOCK.IRON_ORE]:       { name: 'Iron Ore',       hardness: 3.0,      transparent: false, solid: true,  lightEmission: 0,  tool: 'pickaxe', drops: [{ id: BLOCK.IRON_ORE, count: 1 }] },
  [BLOCK.GOLD_ORE]:       { name: 'Gold Ore',       hardness: 3.0,      transparent: false, solid: true,  lightEmission: 0,  tool: 'pickaxe', drops: [{ id: BLOCK.GOLD_ORE, count: 1 }] },
  [BLOCK.DIAMOND_ORE]:    { name: 'Diamond Ore',    hardness: 3.0,      transparent: false, solid: true,  lightEmission: 0,  tool: 'pickaxe', drops: [{ id: BLOCK.DIAMOND, count: 1 }] },
  [BLOCK.GRAVEL]:         { name: 'Gravel',         hardness: 0.6,      transparent: false, solid: true,  lightEmission: 0,  tool: 'shovel',  drops: [{ id: BLOCK.GRAVEL, count: 1 }] },
  [BLOCK.BEDROCK]:        { name: 'Bedrock',        hardness: Infinity, transparent: false, solid: true,  lightEmission: 0,  tool: null,      drops: [] },
  [BLOCK.PLANKS]:         { name: 'Planks',         hardness: 2.0,      transparent: false, solid: true,  lightEmission: 0,  tool: 'axe',     drops: [{ id: BLOCK.PLANKS, count: 1 }] },
  [BLOCK.CRAFTING_TABLE]: { name: 'Crafting Table', hardness: 2.5,      transparent: false, solid: true,  lightEmission: 0,  tool: 'axe',     drops: [{ id: BLOCK.CRAFTING_TABLE, count: 1 }] },
  [BLOCK.CHEST]:          { name: 'Chest',          hardness: 2.5,      transparent: false, solid: true,  lightEmission: 0,  tool: 'axe',     drops: [{ id: BLOCK.CHEST, count: 1 }] },
  [BLOCK.TORCH]:          { name: 'Torch',          hardness: 0.0,      transparent: true,  solid: false, lightEmission: 14, tool: 'any',     drops: [{ id: BLOCK.TORCH, count: 1 }] },
  [BLOCK.GLASS]:          { name: 'Glass',          hardness: 0.3,      transparent: true,  solid: true,  lightEmission: 0,  tool: 'any',     drops: [] },
  [BLOCK.SNOW]:           { name: 'Snow',           hardness: 0.2,      transparent: false, solid: true,  lightEmission: 0,  tool: 'shovel',  drops: [{ id: BLOCK.SNOW, count: 1 }] },
  [BLOCK.ICE]:            { name: 'Ice',            hardness: 0.5,      transparent: true,  solid: true,  lightEmission: 0,  tool: 'pickaxe', drops: [] },
};

// Item-only data (not blocks)
export const ITEM_DATA = {
  [BLOCK.COAL]:           { name: 'Coal',           isBlock: false },
  [BLOCK.IRON_INGOT]:     { name: 'Iron Ingot',     isBlock: false },
  [BLOCK.GOLD_INGOT]:     { name: 'Gold Ingot',     isBlock: false },
  [BLOCK.DIAMOND]:        { name: 'Diamond',        isBlock: false },
  [BLOCK.STICK]:          { name: 'Stick',          isBlock: false },
  [BLOCK.APPLE]:          { name: 'Apple',          isBlock: false, food: 4 },
  [BLOCK.WOODEN_PICKAXE]: { name: 'Wooden Pickaxe', isBlock: false, tool: 'pickaxe', speed: 2 },
  [BLOCK.STONE_PICKAXE]:  { name: 'Stone Pickaxe',  isBlock: false, tool: 'pickaxe', speed: 4 },
  [BLOCK.IRON_PICKAXE]:   { name: 'Iron Pickaxe',   isBlock: false, tool: 'pickaxe', speed: 6 },
  [BLOCK.WOODEN_AXE]:     { name: 'Wooden Axe',     isBlock: false, tool: 'axe',     speed: 2 },
  [BLOCK.STONE_AXE]:      { name: 'Stone Axe',      isBlock: false, tool: 'axe',     speed: 4 },
  [BLOCK.WOODEN_SHOVEL]:  { name: 'Wooden Shovel',  isBlock: false, tool: 'shovel',  speed: 2 },
  [BLOCK.STONE_SHOVEL]:   { name: 'Stone Shovel',   isBlock: false, tool: 'shovel',  speed: 4 },
  [BLOCK.WOODEN_SWORD]:   { name: 'Wooden Sword',   isBlock: false, tool: 'sword',   damage: 4 },
  [BLOCK.STONE_SWORD]:    { name: 'Stone Sword',    isBlock: false, tool: 'sword',   damage: 5 },
  [BLOCK.IRON_SWORD]:     { name: 'Iron Sword',     isBlock: false, tool: 'sword',   damage: 6 },
  [BLOCK.COOKED_PORKCHOP]:{ name: 'Porkchop',       isBlock: false, food: 8 },
  [BLOCK.RAW_PORKCHOP]:   { name: 'Raw Porkchop',   isBlock: false, food: 3 },
};

export function getItemName(id) {
  if (BLOCK_DATA[id]) return BLOCK_DATA[id].name;
  if (ITEM_DATA[id]) return ITEM_DATA[id].name;
  return 'Unknown';
}

export function isBlockPlaceable(id) {
  return id > 0 && id <= 20 && BLOCK_DATA[id] && id !== BLOCK.WATER;
}

// ─── Texture Drawing ──────────────────────────────────────────────────────────
// Each function draws a block texture at (px, py) with given size on ctx

function px(ctx, px, py, x, y, w, h, color, bs) {
  ctx.fillStyle = color;
  const s = bs / 16;
  ctx.fillRect(px + x * s, py + y * s, w * s, h * s);
}

// Fixed "random" speckle patterns (deterministic pixel lists)
const DIRT_DARK  = [1,3,4,7,10,13,16,18,22,25,28,31,35,38,42,45,48,51,55,58,62,65,69,72,75,78,82,85,88,91,95,98,102,105,108,111,115,118,122,125,128,131,135,138,142,145,148,151,155,158,162,165,169,172,175,178,182,185,189,192,195,198,202,205,208,211,215,218,222,225,228,231,235,238,242,245,249,252];
const DIRT_LIGHT = [2,5,8,11,14,17,20,23,26,29,32,36,39,43,46,49,52,56,59,63,66,70,73,76,79,83,86,89,92,96,99,103,106,109,112,116,119,123,126,129,132,136,139,143,146,149,152,156,159,163,166,170,173,176,179,183,186,190,193,196,199,203,206,209,212,216,219,223,226,229,232,236,239,243,246,250,253];

function drawSpeckles(ctx, px2, py2, bs, darkColor, lightColor, darkList, lightList) {
  const s = bs / 16;
  for (const i of darkList) {
    const x = i % 16, y = Math.floor(i / 16);
    ctx.fillStyle = darkColor;
    ctx.fillRect(px2 + x * s, py2 + y * s, s, s);
  }
  for (const i of lightList) {
    const x = i % 16, y = Math.floor(i / 16);
    ctx.fillStyle = lightColor;
    ctx.fillRect(px2 + x * s, py2 + y * s, s, s);
  }
}

export function drawBlock(ctx, blockId, bx, by, bs, timeOffset = 0) {
  const p = (x, y, w, h, color) => px(ctx, bx, by, x, y, w, h, color, bs);
  const s = bs / 16;

  switch (blockId) {
    case BLOCK.GRASS: {
      // Dirt base (full)
      ctx.fillStyle = '#7B5C3A';
      ctx.fillRect(bx, by, bs, bs);
      // Dirt specks
      drawSpeckles(ctx, bx, by + 3 * s, bs, '#5A3D20', '#9A7050', DIRT_DARK.slice(0, 30), DIRT_LIGHT.slice(0, 20));
      // Green top band (3px)
      ctx.fillStyle = '#5D9E1F';
      ctx.fillRect(bx, by, bs, 3 * s);
      // Grass texture variation
      p(0, 0, 1, 3, '#4A7F10'); p(2, 0, 1, 2, '#7DB83A'); p(4, 1, 1, 2, '#4A7F10');
      p(6, 0, 1, 3, '#7DB83A'); p(8, 0, 1, 2, '#5D9E1F'); p(10, 1, 1, 2, '#4A7F10');
      p(12, 0, 1, 3, '#7DB83A'); p(14, 0, 1, 2, '#4A7F10');
      // Side green fringe
      p(0, 3, 2, 1, '#5D9E1F'); p(3, 3, 1, 1, '#5D9E1F'); p(7, 3, 2, 1, '#5D9E1F');
      p(11, 3, 1, 1, '#5D9E1F'); p(14, 3, 2, 1, '#5D9E1F');
      break;
    }
    case BLOCK.DIRT: {
      ctx.fillStyle = '#7B5C3A';
      ctx.fillRect(bx, by, bs, bs);
      drawSpeckles(ctx, bx, by, bs, '#5A3D20', '#9A7050', DIRT_DARK, DIRT_LIGHT);
      break;
    }
    case BLOCK.STONE: {
      ctx.fillStyle = '#7F7F7F';
      ctx.fillRect(bx, by, bs, bs);
      // Crack pattern
      ctx.strokeStyle = '#6B6B6B';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(bx + 3*s, by + 2*s); ctx.lineTo(bx + 6*s, by + 7*s); ctx.lineTo(bx + 4*s, by + 10*s);
      ctx.moveTo(bx + 10*s, by + 1*s); ctx.lineTo(bx + 13*s, by + 5*s); ctx.lineTo(bx + 11*s, by + 9*s);
      ctx.moveTo(bx + 2*s, by + 12*s); ctx.lineTo(bx + 7*s, by + 14*s); ctx.lineTo(bx + 9*s, by + 12*s); ctx.lineTo(bx + 14*s, by + 14*s);
      ctx.stroke();
      // Highlights
      p(0, 0, 2, 1, '#999'); p(14, 0, 2, 1, '#999'); p(0, 15, 2, 1, '#999'); p(14, 15, 2, 1, '#999');
      break;
    }
    case BLOCK.SAND: {
      ctx.fillStyle = '#F0D87A';
      ctx.fillRect(bx, by, bs, bs);
      const sd = [2,5,9,14,19,22,26,31,36,39,43,48,53,56,60,65,70,73,77,82,87,90,94,99,104,107,111,116,121,124,128,133,138,141,145,150,155,158,162,167,172,175,179,184,189,192,196,201,206,209,213,218,223,226,230,235];
      for (const i of sd) {
        const x = i % 16, y = Math.floor(i / 16);
        ctx.fillStyle = '#D4BD5A';
        ctx.fillRect(bx + x*s, by + y*s, s, s);
      }
      const sl = [3,8,13,18,23,28,33,38,44,49,54,59,64,69,74,79,84,89,95,100,105,110,115,120,126,131,136,141,147,152,157,162,168,173,178,183,188,193,199,204,209,215,220,225,230,236,241,246,251];
      for (const i of sl) {
        const x = i % 16, y = Math.floor(i / 16);
        ctx.fillStyle = '#F5E090';
        ctx.fillRect(bx + x*s, by + y*s, s, s);
      }
      break;
    }
    case BLOCK.WATER: {
      const wave = Math.floor(timeOffset * 2) % 2;
      ctx.fillStyle = '#2D5DA1';
      ctx.fillRect(bx, by, bs, bs);
      // Wave highlights
      ctx.fillStyle = '#4472C4';
      for (let wx = 0; wx < 16; wx += 4) {
        ctx.fillRect(bx + (wx + wave) * s, by, 2*s, 2*s);
      }
      ctx.fillStyle = '#1A3D80';
      for (let wx = 2; wx < 16; wx += 4) {
        ctx.fillRect(bx + wx*s, by + 8*s, 2*s, 2*s);
      }
      break;
    }
    case BLOCK.WOOD: {
      ctx.fillStyle = '#5E3A1A';
      ctx.fillRect(bx, by, bs, bs);
      // Bark rings (horizontal bands)
      const ringColors = ['#7A4E2D','#4A2C0E','#6A3E1A','#3C2408'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = ringColors[i % 4];
        ctx.fillRect(bx, by + (i*4)*s, bs, 2*s);
      }
      // Vertical grain lines
      ctx.fillStyle = '#4A2C0E';
      for (let gx = 1; gx < 16; gx += 3) {
        ctx.fillRect(bx + gx*s, by, s, bs);
      }
      break;
    }
    case BLOCK.LEAVES: {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#2D7D27';
      ctx.fillRect(bx, by, bs, bs);
      // Random dark/light pixels (fixed pattern)
      const ld = [1,5,9,13,17,21,25,29,33,37,41,45,49,53,57,61,65,69,73,77,81,85,89,93,97,101,105,109,113,117,121,125,129,133,137,141,145,149,153,157,161,165,169,173,177,181,185,189,193,197,201,205,209,213,217,221];
      for (const i of ld) {
        const x = i % 16, y = Math.floor(i / 16);
        ctx.fillStyle = (i % 3 === 0) ? '#1D5E1D' : '#3DAD37';
        ctx.fillRect(bx + x*s, by + y*s, s, s);
      }
      ctx.globalAlpha = 1.0;
      break;
    }
    case BLOCK.COAL_ORE: {
      // Stone base
      drawBlock(ctx, BLOCK.STONE, bx, by, bs, timeOffset);
      // Coal clusters
      ctx.fillStyle = '#1A1A1A';
      p(3, 2, 3, 3, '#1A1A1A'); p(10, 6, 3, 3, '#1A1A1A');
      p(5, 10, 4, 4, '#1A1A1A'); p(1, 8, 2, 3, '#1A1A1A');
      break;
    }
    case BLOCK.IRON_ORE: {
      drawBlock(ctx, BLOCK.STONE, bx, by, bs, timeOffset);
      ctx.fillStyle = '#C8A887';
      p(3, 2, 3, 3, '#C8A887'); p(10, 6, 3, 3, '#C8A887');
      p(5, 10, 4, 4, '#C8A887'); p(1, 8, 2, 3, '#C8A887');
      p(11, 2, 2, 2, '#DDB896');
      break;
    }
    case BLOCK.GOLD_ORE: {
      drawBlock(ctx, BLOCK.STONE, bx, by, bs, timeOffset);
      p(3, 2, 3, 3, '#FCE04A'); p(10, 6, 3, 3, '#FCE04A');
      p(5, 10, 4, 4, '#FCE04A'); p(1, 8, 2, 3, '#F0C030');
      p(11, 2, 2, 2, '#FFEE60');
      break;
    }
    case BLOCK.DIAMOND_ORE: {
      drawBlock(ctx, BLOCK.STONE, bx, by, bs, timeOffset);
      p(3, 2, 3, 3, '#4AFCE0'); p(10, 6, 3, 3, '#4AFCE0');
      p(5, 10, 4, 4, '#4AFCE0'); p(1, 8, 2, 3, '#2DE0C0');
      p(11, 2, 2, 2, '#6AFFEE');
      break;
    }
    case BLOCK.GRAVEL: {
      ctx.fillStyle = '#848484';
      ctx.fillRect(bx, by, bs, bs);
      const gp = [0,7,15,22,30,37,45,52,60,67,75,82,90,97,105,112,120,127,135,142,150,157,165,172,180,187,195,202,210,217,225,232,240,247];
      for (const i of gp) {
        const x = i % 16, y = Math.floor(i / 16);
        ctx.fillStyle = (i % 2 === 0) ? '#6A6A6A' : '#9A9A9A';
        ctx.fillRect(bx + x*s, by + y*s, 2*s, 2*s);
      }
      break;
    }
    case BLOCK.BEDROCK: {
      ctx.fillStyle = '#3B3B3B';
      ctx.fillRect(bx, by, bs, bs);
      const bp = [0,9,18,27,36,45,54,63,72,81,90,99,108,117,126,135,144,153,162,171,180,189,198,207,216,225,234,243,252];
      for (const i of bp) {
        const x = i % 16, y = Math.floor(i / 16);
        ctx.fillStyle = (i % 3 === 0) ? '#2A2A2A' : '#4A4A4A';
        ctx.fillRect(bx + x*s, by + y*s, 2*s, 2*s);
      }
      break;
    }
    case BLOCK.PLANKS: {
      ctx.fillStyle = '#AC8A56';
      ctx.fillRect(bx, by, bs, bs);
      // Grain lines
      for (let gy = 0; gy < 16; gy += 4) {
        ctx.fillStyle = '#9A7844';
        ctx.fillRect(bx, by + gy*s, bs, s);
      }
      // Plank split
      ctx.fillStyle = '#8A6834';
      ctx.fillRect(bx + 8*s, by, s, bs);
      ctx.fillRect(bx, by + 8*s, bs, s);
      break;
    }
    case BLOCK.CRAFTING_TABLE: {
      // Planks base on sides
      ctx.fillStyle = '#AC8A56';
      ctx.fillRect(bx, by, bs, bs);
      for (let gy = 0; gy < 16; gy += 4) {
        ctx.fillStyle = '#9A7844';
        ctx.fillRect(bx, by + gy*s, bs, s);
      }
      // Top face indicator (brown cross)
      ctx.fillStyle = '#8B3A0F';
      p(6, 2, 4, 12, '#8B3A0F');
      p(2, 6, 12, 4, '#8B3A0F');
      // Grid lines
      ctx.fillStyle = '#5A2000';
      p(7, 2, 2, 12, '#5A2000');
      p(2, 7, 12, 2, '#5A2000');
      break;
    }
    case BLOCK.CHEST: {
      ctx.fillStyle = '#8B6340';
      ctx.fillRect(bx, by, bs, bs);
      // Chest border
      ctx.fillStyle = '#5A3D1A';
      ctx.fillRect(bx, by, bs, s); ctx.fillRect(bx, by + bs - s, bs, s);
      ctx.fillRect(bx, by, s, bs); ctx.fillRect(bx + bs - s, by, s, bs);
      // Lock
      p(6, 5, 4, 6, '#D4A820');
      p(7, 4, 2, 2, '#D4A820');
      // Lid line
      p(1, 7, 14, 2, '#5A3D1A');
      break;
    }
    case BLOCK.TORCH: {
      // Transparent background - just draw the torch
      // Stick
      p(7, 4, 2, 11, '#5E3A1A');
      // Flame
      p(6, 1, 4, 4, '#FF8C00');
      p(7, 1, 2, 3, '#FFD700');
      p(7, 1, 2, 1, '#FFFFFF');
      break;
    }
    case BLOCK.GLASS: {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#B0E0FF';
      ctx.fillRect(bx, by, bs, bs);
      ctx.globalAlpha = 1.0;
      // Border
      ctx.fillStyle = '#E0F4FF';
      ctx.fillRect(bx, by, bs, s); ctx.fillRect(bx, by + bs - s, bs, s);
      ctx.fillRect(bx, by, s, bs); ctx.fillRect(bx + bs - s, by, s, bs);
      break;
    }
    case BLOCK.SNOW: {
      ctx.fillStyle = '#E8EAEC';
      ctx.fillRect(bx, by, bs, bs);
      p(0, 0, 16, 2, '#F5F7FA');
      p(2, 4, 3, 2, '#D0D4D8'); p(8, 6, 4, 2, '#D0D4D8');
      p(4, 10, 5, 3, '#C8CDD2'); p(12, 12, 3, 3, '#C8CDD2');
      break;
    }
    case BLOCK.ICE: {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#91C8E4';
      ctx.fillRect(bx, by, bs, bs);
      ctx.globalAlpha = 1.0;
      // Crack reflection lines
      ctx.strokeStyle = '#B8DDF0';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(bx + 2*s, by + 3*s); ctx.lineTo(bx + 8*s, by + 8*s);
      ctx.moveTo(bx + 10*s, by + 2*s); ctx.lineTo(bx + 14*s, by + 6*s);
      ctx.stroke();
      break;
    }
    default: {
      // Item rendering (for inventory display)
      drawItemIcon(ctx, blockId, bx, by, bs);
      break;
    }
  }
}

export function drawItemIcon(ctx, itemId, bx, by, bs) {
  const p = (x, y, w, h, color) => px(ctx, bx, by, x, y, w, h, color, bs);
  switch (itemId) {
    case BLOCK.COAL:
      ctx.fillStyle = '#1A1A1A'; ctx.fillRect(bx + bs*0.2, by + bs*0.2, bs*0.6, bs*0.6);
      ctx.fillStyle = '#333'; p(3, 3, 4, 3, '#333333');
      break;
    case BLOCK.IRON_INGOT:
      ctx.fillStyle = '#C8A887'; ctx.fillRect(bx + bs*0.1, by + bs*0.2, bs*0.8, bs*0.6);
      ctx.fillStyle = '#A08060'; ctx.fillRect(bx + bs*0.2, by + bs*0.3, bs*0.6, bs*0.1);
      break;
    case BLOCK.GOLD_INGOT:
      ctx.fillStyle = '#FCE04A'; ctx.fillRect(bx + bs*0.1, by + bs*0.2, bs*0.8, bs*0.6);
      ctx.fillStyle = '#D4B830'; ctx.fillRect(bx + bs*0.2, by + bs*0.3, bs*0.6, bs*0.1);
      break;
    case BLOCK.DIAMOND:
      // Diamond shape
      ctx.fillStyle = '#4AFCE0';
      ctx.beginPath();
      ctx.moveTo(bx + bs*0.5, by + bs*0.1);
      ctx.lineTo(bx + bs*0.9, by + bs*0.5);
      ctx.lineTo(bx + bs*0.5, by + bs*0.9);
      ctx.lineTo(bx + bs*0.1, by + bs*0.5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2DE0C0';
      ctx.beginPath();
      ctx.moveTo(bx + bs*0.5, by + bs*0.3);
      ctx.lineTo(bx + bs*0.7, by + bs*0.5);
      ctx.lineTo(bx + bs*0.5, by + bs*0.7);
      ctx.lineTo(bx + bs*0.3, by + bs*0.5);
      ctx.closePath(); ctx.fill();
      break;
    case BLOCK.STICK:
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(bx + bs*0.4, by + bs*0.05, bs*0.15, bs*0.9);
      break;
    case BLOCK.APPLE:
      ctx.fillStyle = '#CC2200';
      ctx.beginPath();
      ctx.arc(bx + bs*0.5, by + bs*0.55, bs*0.38, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#228B22';
      ctx.fillRect(bx + bs*0.45, by + bs*0.1, bs*0.1, bs*0.25);
      break;
    case BLOCK.WOODEN_PICKAXE: drawPickaxe(ctx, bx, by, bs, '#AC8A56', '#5E3A1A'); break;
    case BLOCK.STONE_PICKAXE:  drawPickaxe(ctx, bx, by, bs, '#7F7F7F', '#5E3A1A'); break;
    case BLOCK.IRON_PICKAXE:   drawPickaxe(ctx, bx, by, bs, '#C8A887', '#5E3A1A'); break;
    case BLOCK.WOODEN_AXE:     drawAxe(ctx, bx, by, bs, '#AC8A56', '#5E3A1A'); break;
    case BLOCK.STONE_AXE:      drawAxe(ctx, bx, by, bs, '#7F7F7F', '#5E3A1A'); break;
    case BLOCK.WOODEN_SHOVEL:  drawShovel(ctx, bx, by, bs, '#AC8A56', '#5E3A1A'); break;
    case BLOCK.STONE_SHOVEL:   drawShovel(ctx, bx, by, bs, '#7F7F7F', '#5E3A1A'); break;
    case BLOCK.WOODEN_SWORD:   drawSword(ctx, bx, by, bs, '#AC8A56', '#5E3A1A'); break;
    case BLOCK.STONE_SWORD:    drawSword(ctx, bx, by, bs, '#7F7F7F', '#5E3A1A'); break;
    case BLOCK.IRON_SWORD:     drawSword(ctx, bx, by, bs, '#C8A887', '#5E3A1A'); break;
    case BLOCK.COOKED_PORKCHOP:
    case BLOCK.RAW_PORKCHOP: {
      const col = itemId === BLOCK.COOKED_PORKCHOP ? '#B05020' : '#F090A0';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(bx + bs*0.5, by + bs*0.55, bs*0.35, bs*0.28, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(bx + bs*0.35, by + bs*0.2, bs*0.08, bs*0.4);
      break;
    }
    default:
      // Fallback: colored square
      ctx.fillStyle = '#888';
      ctx.fillRect(bx + bs*0.1, by + bs*0.1, bs*0.8, bs*0.8);
  }
}

function drawPickaxe(ctx, bx, by, bs, headColor, stickColor) {
  // Handle
  ctx.fillStyle = stickColor;
  ctx.fillRect(bx + bs*0.42, by + bs*0.35, bs*0.15, bs*0.6);
  // Head (3 prongs)
  ctx.fillStyle = headColor;
  ctx.fillRect(bx + bs*0.15, by + bs*0.15, bs*0.7, bs*0.15); // top bar
  ctx.fillRect(bx + bs*0.15, by + bs*0.05, bs*0.1, bs*0.15); // left prong
  ctx.fillRect(bx + bs*0.44, by + bs*0.03, bs*0.12, bs*0.15); // center prong
  ctx.fillRect(bx + bs*0.75, by + bs*0.05, bs*0.1, bs*0.15); // right prong
}

function drawAxe(ctx, bx, by, bs, headColor, stickColor) {
  ctx.fillStyle = stickColor;
  ctx.fillRect(bx + bs*0.52, by + bs*0.35, bs*0.12, bs*0.62);
  ctx.fillStyle = headColor;
  ctx.fillRect(bx + bs*0.15, by + bs*0.1, bs*0.42, bs*0.5);
  ctx.fillStyle = '#00000030';
  ctx.fillRect(bx + bs*0.2, by + bs*0.15, bs*0.3, bs*0.1);
}

function drawShovel(ctx, bx, by, bs, headColor, stickColor) {
  ctx.fillStyle = stickColor;
  ctx.fillRect(bx + bs*0.44, by + bs*0.3, bs*0.12, bs*0.65);
  ctx.fillStyle = headColor;
  ctx.fillRect(bx + bs*0.33, by + bs*0.08, bs*0.34, bs*0.28);
  ctx.fillRect(bx + bs*0.33, by + bs*0.36, bs*0.34, bs*0.08);
}

function drawSword(ctx, bx, by, bs, bladeColor, handleColor) {
  // Blade
  ctx.fillStyle = bladeColor;
  ctx.fillRect(bx + bs*0.44, by + bs*0.05, bs*0.12, bs*0.6);
  // Guard
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(bx + bs*0.2, by + bs*0.58, bs*0.6, bs*0.1);
  // Handle
  ctx.fillStyle = handleColor;
  ctx.fillRect(bx + bs*0.44, by + bs*0.68, bs*0.12, bs*0.27);
}

// ─── Texture Cache ────────────────────────────────────────────────────────────
const textureCache = new Map();

export function getCachedTexture(blockId, blockSize, timeOffset = 0) {
  // Water is animated, don't cache it
  if (blockId === BLOCK.WATER) return null;
  const key = `${blockId}_${blockSize}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const offscreen = document.createElement('canvas');
  offscreen.width = blockSize;
  offscreen.height = blockSize;
  const octx = offscreen.getContext('2d');
  drawBlock(octx, blockId, 0, 0, blockSize, 0);
  textureCache.set(key, offscreen);
  return offscreen;
}

export function clearTextureCache() {
  textureCache.clear();
}
