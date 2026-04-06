(() => {
  // noise.js
  var PerlinNoise = class {
    constructor(seed = 42) {
      this.perm = new Uint8Array(512);
      const p = Array.from({ length: 256 }, (_, i) => i);
      let s = seed >>> 0;
      for (let i = 255; i > 0; i--) {
        s = Math.imul(s, 1664525) + 1013904223 >>> 0;
        const j = s % (i + 1);
        [p[i], p[j]] = [p[j], p[i]];
      }
      for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    }
    fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }
    lerp(a, b, t) {
      return a + t * (b - a);
    }
    grad(hash, x, y) {
      const h = hash & 3;
      const u = h < 2 ? x : y;
      const v = h < 2 ? y : x;
      return (h & 1 ? -u : u) + (h & 2 ? -v : v);
    }
    noise2D(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      const u = this.fade(x);
      const v = this.fade(y);
      const a = this.perm[X] + Y;
      const b = this.perm[X + 1] + Y;
      return this.lerp(
        this.lerp(this.grad(this.perm[a], x, y), this.grad(this.perm[b], x - 1, y), u),
        this.lerp(this.grad(this.perm[a + 1], x, y - 1), this.grad(this.perm[b + 1], x - 1, y - 1), u),
        v
      );
    }
    octaveNoise(x, y, octaves, persistence, lacunarity) {
      let total = 0, amplitude = 1, frequency = 1, maxValue = 0;
      for (let i = 0; i < octaves; i++) {
        total += this.noise2D(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }
      return total / maxValue;
    }
    noise1D(x) {
      return this.noise2D(x, 0.5);
    }
  };

  // blocks.js
  var BLOCK = {
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
    RAW_PORKCHOP: 41
  };
  var BLOCK_DATA = {
    [BLOCK.AIR]: { name: "Air", hardness: 0, transparent: true, solid: false, lightEmission: 0, tool: null, drops: [] },
    [BLOCK.GRASS]: { name: "Grass", hardness: 0.6, transparent: false, solid: true, lightEmission: 0, tool: "shovel", drops: [{ id: BLOCK.DIRT, count: 1 }] },
    [BLOCK.DIRT]: { name: "Dirt", hardness: 0.5, transparent: false, solid: true, lightEmission: 0, tool: "shovel", drops: [{ id: BLOCK.DIRT, count: 1 }] },
    [BLOCK.STONE]: { name: "Stone", hardness: 1.5, transparent: false, solid: true, lightEmission: 0, tool: "pickaxe", drops: [{ id: BLOCK.STONE, count: 1 }] },
    [BLOCK.SAND]: { name: "Sand", hardness: 0.5, transparent: false, solid: true, lightEmission: 0, tool: "shovel", drops: [{ id: BLOCK.SAND, count: 1 }] },
    [BLOCK.WATER]: { name: "Water", hardness: Infinity, transparent: true, solid: false, lightEmission: 0, tool: null, drops: [] },
    [BLOCK.WOOD]: { name: "Wood", hardness: 2, transparent: false, solid: true, lightEmission: 0, tool: "axe", drops: [{ id: BLOCK.WOOD, count: 1 }] },
    [BLOCK.LEAVES]: { name: "Leaves", hardness: 0.2, transparent: true, solid: true, lightEmission: 0, tool: "any", drops: [] },
    [BLOCK.COAL_ORE]: { name: "Coal Ore", hardness: 3, transparent: false, solid: true, lightEmission: 0, tool: "pickaxe", drops: [{ id: BLOCK.COAL, count: 1 }] },
    [BLOCK.IRON_ORE]: { name: "Iron Ore", hardness: 3, transparent: false, solid: true, lightEmission: 0, tool: "pickaxe", drops: [{ id: BLOCK.IRON_ORE, count: 1 }] },
    [BLOCK.GOLD_ORE]: { name: "Gold Ore", hardness: 3, transparent: false, solid: true, lightEmission: 0, tool: "pickaxe", drops: [{ id: BLOCK.GOLD_ORE, count: 1 }] },
    [BLOCK.DIAMOND_ORE]: { name: "Diamond Ore", hardness: 3, transparent: false, solid: true, lightEmission: 0, tool: "pickaxe", drops: [{ id: BLOCK.DIAMOND, count: 1 }] },
    [BLOCK.GRAVEL]: { name: "Gravel", hardness: 0.6, transparent: false, solid: true, lightEmission: 0, tool: "shovel", drops: [{ id: BLOCK.GRAVEL, count: 1 }] },
    [BLOCK.BEDROCK]: { name: "Bedrock", hardness: Infinity, transparent: false, solid: true, lightEmission: 0, tool: null, drops: [] },
    [BLOCK.PLANKS]: { name: "Planks", hardness: 2, transparent: false, solid: true, lightEmission: 0, tool: "axe", drops: [{ id: BLOCK.PLANKS, count: 1 }] },
    [BLOCK.CRAFTING_TABLE]: { name: "Crafting Table", hardness: 2.5, transparent: false, solid: true, lightEmission: 0, tool: "axe", drops: [{ id: BLOCK.CRAFTING_TABLE, count: 1 }] },
    [BLOCK.CHEST]: { name: "Chest", hardness: 2.5, transparent: false, solid: true, lightEmission: 0, tool: "axe", drops: [{ id: BLOCK.CHEST, count: 1 }] },
    [BLOCK.TORCH]: { name: "Torch", hardness: 0, transparent: true, solid: false, lightEmission: 14, tool: "any", drops: [{ id: BLOCK.TORCH, count: 1 }] },
    [BLOCK.GLASS]: { name: "Glass", hardness: 0.3, transparent: true, solid: true, lightEmission: 0, tool: "any", drops: [] },
    [BLOCK.SNOW]: { name: "Snow", hardness: 0.2, transparent: false, solid: true, lightEmission: 0, tool: "shovel", drops: [{ id: BLOCK.SNOW, count: 1 }] },
    [BLOCK.ICE]: { name: "Ice", hardness: 0.5, transparent: true, solid: true, lightEmission: 0, tool: "pickaxe", drops: [] }
  };
  var ITEM_DATA = {
    [BLOCK.COAL]: { name: "Coal", isBlock: false },
    [BLOCK.IRON_INGOT]: { name: "Iron Ingot", isBlock: false },
    [BLOCK.GOLD_INGOT]: { name: "Gold Ingot", isBlock: false },
    [BLOCK.DIAMOND]: { name: "Diamond", isBlock: false },
    [BLOCK.STICK]: { name: "Stick", isBlock: false },
    [BLOCK.APPLE]: { name: "Apple", isBlock: false, food: 4 },
    [BLOCK.WOODEN_PICKAXE]: { name: "Wooden Pickaxe", isBlock: false, tool: "pickaxe", speed: 2 },
    [BLOCK.STONE_PICKAXE]: { name: "Stone Pickaxe", isBlock: false, tool: "pickaxe", speed: 4 },
    [BLOCK.IRON_PICKAXE]: { name: "Iron Pickaxe", isBlock: false, tool: "pickaxe", speed: 6 },
    [BLOCK.WOODEN_AXE]: { name: "Wooden Axe", isBlock: false, tool: "axe", speed: 2 },
    [BLOCK.STONE_AXE]: { name: "Stone Axe", isBlock: false, tool: "axe", speed: 4 },
    [BLOCK.WOODEN_SHOVEL]: { name: "Wooden Shovel", isBlock: false, tool: "shovel", speed: 2 },
    [BLOCK.STONE_SHOVEL]: { name: "Stone Shovel", isBlock: false, tool: "shovel", speed: 4 },
    [BLOCK.WOODEN_SWORD]: { name: "Wooden Sword", isBlock: false, tool: "sword", damage: 4 },
    [BLOCK.STONE_SWORD]: { name: "Stone Sword", isBlock: false, tool: "sword", damage: 5 },
    [BLOCK.IRON_SWORD]: { name: "Iron Sword", isBlock: false, tool: "sword", damage: 6 },
    [BLOCK.COOKED_PORKCHOP]: { name: "Porkchop", isBlock: false, food: 8 },
    [BLOCK.RAW_PORKCHOP]: { name: "Raw Porkchop", isBlock: false, food: 3 }
  };
  function getItemName(id) {
    if (BLOCK_DATA[id]) return BLOCK_DATA[id].name;
    if (ITEM_DATA[id]) return ITEM_DATA[id].name;
    return "Unknown";
  }
  function px(ctx, px2, py, x, y, w, h, color, bs) {
    ctx.fillStyle = color;
    const s = bs / 16;
    ctx.fillRect(px2 + x * s, py + y * s, w * s, h * s);
  }
  var DIRT_DARK = [1, 3, 4, 7, 10, 13, 16, 18, 22, 25, 28, 31, 35, 38, 42, 45, 48, 51, 55, 58, 62, 65, 69, 72, 75, 78, 82, 85, 88, 91, 95, 98, 102, 105, 108, 111, 115, 118, 122, 125, 128, 131, 135, 138, 142, 145, 148, 151, 155, 158, 162, 165, 169, 172, 175, 178, 182, 185, 189, 192, 195, 198, 202, 205, 208, 211, 215, 218, 222, 225, 228, 231, 235, 238, 242, 245, 249, 252];
  var DIRT_LIGHT = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 36, 39, 43, 46, 49, 52, 56, 59, 63, 66, 70, 73, 76, 79, 83, 86, 89, 92, 96, 99, 103, 106, 109, 112, 116, 119, 123, 126, 129, 132, 136, 139, 143, 146, 149, 152, 156, 159, 163, 166, 170, 173, 176, 179, 183, 186, 190, 193, 196, 199, 203, 206, 209, 212, 216, 219, 223, 226, 229, 232, 236, 239, 243, 246, 250, 253];
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
  function drawBlock(ctx, blockId, bx, by, bs, timeOffset = 0) {
    const p = (x, y, w, h, color) => px(ctx, bx, by, x, y, w, h, color, bs);
    const s = bs / 16;
    switch (blockId) {
      case BLOCK.GRASS: {
        ctx.fillStyle = "#7B5C3A";
        ctx.fillRect(bx, by, bs, bs);
        drawSpeckles(ctx, bx, by + 3 * s, bs, "#5A3D20", "#9A7050", DIRT_DARK.slice(0, 30), DIRT_LIGHT.slice(0, 20));
        ctx.fillStyle = "#5D9E1F";
        ctx.fillRect(bx, by, bs, 3 * s);
        p(0, 0, 1, 3, "#4A7F10");
        p(2, 0, 1, 2, "#7DB83A");
        p(4, 1, 1, 2, "#4A7F10");
        p(6, 0, 1, 3, "#7DB83A");
        p(8, 0, 1, 2, "#5D9E1F");
        p(10, 1, 1, 2, "#4A7F10");
        p(12, 0, 1, 3, "#7DB83A");
        p(14, 0, 1, 2, "#4A7F10");
        p(0, 3, 2, 1, "#5D9E1F");
        p(3, 3, 1, 1, "#5D9E1F");
        p(7, 3, 2, 1, "#5D9E1F");
        p(11, 3, 1, 1, "#5D9E1F");
        p(14, 3, 2, 1, "#5D9E1F");
        break;
      }
      case BLOCK.DIRT: {
        ctx.fillStyle = "#7B5C3A";
        ctx.fillRect(bx, by, bs, bs);
        drawSpeckles(ctx, bx, by, bs, "#5A3D20", "#9A7050", DIRT_DARK, DIRT_LIGHT);
        break;
      }
      case BLOCK.STONE: {
        ctx.fillStyle = "#7F7F7F";
        ctx.fillRect(bx, by, bs, bs);
        ctx.strokeStyle = "#6B6B6B";
        ctx.lineWidth = s;
        ctx.beginPath();
        ctx.moveTo(bx + 3 * s, by + 2 * s);
        ctx.lineTo(bx + 6 * s, by + 7 * s);
        ctx.lineTo(bx + 4 * s, by + 10 * s);
        ctx.moveTo(bx + 10 * s, by + 1 * s);
        ctx.lineTo(bx + 13 * s, by + 5 * s);
        ctx.lineTo(bx + 11 * s, by + 9 * s);
        ctx.moveTo(bx + 2 * s, by + 12 * s);
        ctx.lineTo(bx + 7 * s, by + 14 * s);
        ctx.lineTo(bx + 9 * s, by + 12 * s);
        ctx.lineTo(bx + 14 * s, by + 14 * s);
        ctx.stroke();
        p(0, 0, 2, 1, "#999");
        p(14, 0, 2, 1, "#999");
        p(0, 15, 2, 1, "#999");
        p(14, 15, 2, 1, "#999");
        break;
      }
      case BLOCK.SAND: {
        ctx.fillStyle = "#F0D87A";
        ctx.fillRect(bx, by, bs, bs);
        const sd = [2, 5, 9, 14, 19, 22, 26, 31, 36, 39, 43, 48, 53, 56, 60, 65, 70, 73, 77, 82, 87, 90, 94, 99, 104, 107, 111, 116, 121, 124, 128, 133, 138, 141, 145, 150, 155, 158, 162, 167, 172, 175, 179, 184, 189, 192, 196, 201, 206, 209, 213, 218, 223, 226, 230, 235];
        for (const i of sd) {
          const x = i % 16, y = Math.floor(i / 16);
          ctx.fillStyle = "#D4BD5A";
          ctx.fillRect(bx + x * s, by + y * s, s, s);
        }
        const sl = [3, 8, 13, 18, 23, 28, 33, 38, 44, 49, 54, 59, 64, 69, 74, 79, 84, 89, 95, 100, 105, 110, 115, 120, 126, 131, 136, 141, 147, 152, 157, 162, 168, 173, 178, 183, 188, 193, 199, 204, 209, 215, 220, 225, 230, 236, 241, 246, 251];
        for (const i of sl) {
          const x = i % 16, y = Math.floor(i / 16);
          ctx.fillStyle = "#F5E090";
          ctx.fillRect(bx + x * s, by + y * s, s, s);
        }
        break;
      }
      case BLOCK.WATER: {
        const wave = Math.floor(timeOffset * 2) % 2;
        ctx.fillStyle = "#2D5DA1";
        ctx.fillRect(bx, by, bs, bs);
        ctx.fillStyle = "#4472C4";
        for (let wx = 0; wx < 16; wx += 4) {
          ctx.fillRect(bx + (wx + wave) * s, by, 2 * s, 2 * s);
        }
        ctx.fillStyle = "#1A3D80";
        for (let wx = 2; wx < 16; wx += 4) {
          ctx.fillRect(bx + wx * s, by + 8 * s, 2 * s, 2 * s);
        }
        break;
      }
      case BLOCK.WOOD: {
        ctx.fillStyle = "#5E3A1A";
        ctx.fillRect(bx, by, bs, bs);
        const ringColors = ["#7A4E2D", "#4A2C0E", "#6A3E1A", "#3C2408"];
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = ringColors[i % 4];
          ctx.fillRect(bx, by + i * 4 * s, bs, 2 * s);
        }
        ctx.fillStyle = "#4A2C0E";
        for (let gx = 1; gx < 16; gx += 3) {
          ctx.fillRect(bx + gx * s, by, s, bs);
        }
        break;
      }
      case BLOCK.LEAVES: {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#2D7D27";
        ctx.fillRect(bx, by, bs, bs);
        const ld = [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 101, 105, 109, 113, 117, 121, 125, 129, 133, 137, 141, 145, 149, 153, 157, 161, 165, 169, 173, 177, 181, 185, 189, 193, 197, 201, 205, 209, 213, 217, 221];
        for (const i of ld) {
          const x = i % 16, y = Math.floor(i / 16);
          ctx.fillStyle = i % 3 === 0 ? "#1D5E1D" : "#3DAD37";
          ctx.fillRect(bx + x * s, by + y * s, s, s);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case BLOCK.COAL_ORE: {
        drawBlock(ctx, BLOCK.STONE, bx, by, bs, timeOffset);
        ctx.fillStyle = "#1A1A1A";
        p(3, 2, 3, 3, "#1A1A1A");
        p(10, 6, 3, 3, "#1A1A1A");
        p(5, 10, 4, 4, "#1A1A1A");
        p(1, 8, 2, 3, "#1A1A1A");
        break;
      }
      case BLOCK.IRON_ORE: {
        drawBlock(ctx, BLOCK.STONE, bx, by, bs, timeOffset);
        ctx.fillStyle = "#C8A887";
        p(3, 2, 3, 3, "#C8A887");
        p(10, 6, 3, 3, "#C8A887");
        p(5, 10, 4, 4, "#C8A887");
        p(1, 8, 2, 3, "#C8A887");
        p(11, 2, 2, 2, "#DDB896");
        break;
      }
      case BLOCK.GOLD_ORE: {
        drawBlock(ctx, BLOCK.STONE, bx, by, bs, timeOffset);
        p(3, 2, 3, 3, "#FCE04A");
        p(10, 6, 3, 3, "#FCE04A");
        p(5, 10, 4, 4, "#FCE04A");
        p(1, 8, 2, 3, "#F0C030");
        p(11, 2, 2, 2, "#FFEE60");
        break;
      }
      case BLOCK.DIAMOND_ORE: {
        drawBlock(ctx, BLOCK.STONE, bx, by, bs, timeOffset);
        p(3, 2, 3, 3, "#4AFCE0");
        p(10, 6, 3, 3, "#4AFCE0");
        p(5, 10, 4, 4, "#4AFCE0");
        p(1, 8, 2, 3, "#2DE0C0");
        p(11, 2, 2, 2, "#6AFFEE");
        break;
      }
      case BLOCK.GRAVEL: {
        ctx.fillStyle = "#848484";
        ctx.fillRect(bx, by, bs, bs);
        const gp = [0, 7, 15, 22, 30, 37, 45, 52, 60, 67, 75, 82, 90, 97, 105, 112, 120, 127, 135, 142, 150, 157, 165, 172, 180, 187, 195, 202, 210, 217, 225, 232, 240, 247];
        for (const i of gp) {
          const x = i % 16, y = Math.floor(i / 16);
          ctx.fillStyle = i % 2 === 0 ? "#6A6A6A" : "#9A9A9A";
          ctx.fillRect(bx + x * s, by + y * s, 2 * s, 2 * s);
        }
        break;
      }
      case BLOCK.BEDROCK: {
        ctx.fillStyle = "#3B3B3B";
        ctx.fillRect(bx, by, bs, bs);
        const bp = [0, 9, 18, 27, 36, 45, 54, 63, 72, 81, 90, 99, 108, 117, 126, 135, 144, 153, 162, 171, 180, 189, 198, 207, 216, 225, 234, 243, 252];
        for (const i of bp) {
          const x = i % 16, y = Math.floor(i / 16);
          ctx.fillStyle = i % 3 === 0 ? "#2A2A2A" : "#4A4A4A";
          ctx.fillRect(bx + x * s, by + y * s, 2 * s, 2 * s);
        }
        break;
      }
      case BLOCK.PLANKS: {
        ctx.fillStyle = "#AC8A56";
        ctx.fillRect(bx, by, bs, bs);
        for (let gy = 0; gy < 16; gy += 4) {
          ctx.fillStyle = "#9A7844";
          ctx.fillRect(bx, by + gy * s, bs, s);
        }
        ctx.fillStyle = "#8A6834";
        ctx.fillRect(bx + 8 * s, by, s, bs);
        ctx.fillRect(bx, by + 8 * s, bs, s);
        break;
      }
      case BLOCK.CRAFTING_TABLE: {
        ctx.fillStyle = "#AC8A56";
        ctx.fillRect(bx, by, bs, bs);
        for (let gy = 0; gy < 16; gy += 4) {
          ctx.fillStyle = "#9A7844";
          ctx.fillRect(bx, by + gy * s, bs, s);
        }
        ctx.fillStyle = "#8B3A0F";
        p(6, 2, 4, 12, "#8B3A0F");
        p(2, 6, 12, 4, "#8B3A0F");
        ctx.fillStyle = "#5A2000";
        p(7, 2, 2, 12, "#5A2000");
        p(2, 7, 12, 2, "#5A2000");
        break;
      }
      case BLOCK.CHEST: {
        ctx.fillStyle = "#8B6340";
        ctx.fillRect(bx, by, bs, bs);
        ctx.fillStyle = "#5A3D1A";
        ctx.fillRect(bx, by, bs, s);
        ctx.fillRect(bx, by + bs - s, bs, s);
        ctx.fillRect(bx, by, s, bs);
        ctx.fillRect(bx + bs - s, by, s, bs);
        p(6, 5, 4, 6, "#D4A820");
        p(7, 4, 2, 2, "#D4A820");
        p(1, 7, 14, 2, "#5A3D1A");
        break;
      }
      case BLOCK.TORCH: {
        p(7, 4, 2, 11, "#5E3A1A");
        p(6, 1, 4, 4, "#FF8C00");
        p(7, 1, 2, 3, "#FFD700");
        p(7, 1, 2, 1, "#FFFFFF");
        break;
      }
      case BLOCK.GLASS: {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#B0E0FF";
        ctx.fillRect(bx, by, bs, bs);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#E0F4FF";
        ctx.fillRect(bx, by, bs, s);
        ctx.fillRect(bx, by + bs - s, bs, s);
        ctx.fillRect(bx, by, s, bs);
        ctx.fillRect(bx + bs - s, by, s, bs);
        break;
      }
      case BLOCK.SNOW: {
        ctx.fillStyle = "#E8EAEC";
        ctx.fillRect(bx, by, bs, bs);
        p(0, 0, 16, 2, "#F5F7FA");
        p(2, 4, 3, 2, "#D0D4D8");
        p(8, 6, 4, 2, "#D0D4D8");
        p(4, 10, 5, 3, "#C8CDD2");
        p(12, 12, 3, 3, "#C8CDD2");
        break;
      }
      case BLOCK.ICE: {
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = "#91C8E4";
        ctx.fillRect(bx, by, bs, bs);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#B8DDF0";
        ctx.lineWidth = s;
        ctx.beginPath();
        ctx.moveTo(bx + 2 * s, by + 3 * s);
        ctx.lineTo(bx + 8 * s, by + 8 * s);
        ctx.moveTo(bx + 10 * s, by + 2 * s);
        ctx.lineTo(bx + 14 * s, by + 6 * s);
        ctx.stroke();
        break;
      }
      default: {
        drawItemIcon(ctx, blockId, bx, by, bs);
        break;
      }
    }
  }
  function drawItemIcon(ctx, itemId, bx, by, bs) {
    const p = (x, y, w, h, color) => px(ctx, bx, by, x, y, w, h, color, bs);
    switch (itemId) {
      case BLOCK.COAL:
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(bx + bs * 0.2, by + bs * 0.2, bs * 0.6, bs * 0.6);
        ctx.fillStyle = "#333";
        p(3, 3, 4, 3, "#333333");
        break;
      case BLOCK.IRON_INGOT:
        ctx.fillStyle = "#C8A887";
        ctx.fillRect(bx + bs * 0.1, by + bs * 0.2, bs * 0.8, bs * 0.6);
        ctx.fillStyle = "#A08060";
        ctx.fillRect(bx + bs * 0.2, by + bs * 0.3, bs * 0.6, bs * 0.1);
        break;
      case BLOCK.GOLD_INGOT:
        ctx.fillStyle = "#FCE04A";
        ctx.fillRect(bx + bs * 0.1, by + bs * 0.2, bs * 0.8, bs * 0.6);
        ctx.fillStyle = "#D4B830";
        ctx.fillRect(bx + bs * 0.2, by + bs * 0.3, bs * 0.6, bs * 0.1);
        break;
      case BLOCK.DIAMOND:
        ctx.fillStyle = "#4AFCE0";
        ctx.beginPath();
        ctx.moveTo(bx + bs * 0.5, by + bs * 0.1);
        ctx.lineTo(bx + bs * 0.9, by + bs * 0.5);
        ctx.lineTo(bx + bs * 0.5, by + bs * 0.9);
        ctx.lineTo(bx + bs * 0.1, by + bs * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#2DE0C0";
        ctx.beginPath();
        ctx.moveTo(bx + bs * 0.5, by + bs * 0.3);
        ctx.lineTo(bx + bs * 0.7, by + bs * 0.5);
        ctx.lineTo(bx + bs * 0.5, by + bs * 0.7);
        ctx.lineTo(bx + bs * 0.3, by + bs * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      case BLOCK.STICK:
        ctx.fillStyle = "#8B5E3C";
        ctx.fillRect(bx + bs * 0.4, by + bs * 0.05, bs * 0.15, bs * 0.9);
        break;
      case BLOCK.APPLE:
        ctx.fillStyle = "#CC2200";
        ctx.beginPath();
        ctx.arc(bx + bs * 0.5, by + bs * 0.55, bs * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#228B22";
        ctx.fillRect(bx + bs * 0.45, by + bs * 0.1, bs * 0.1, bs * 0.25);
        break;
      case BLOCK.WOODEN_PICKAXE:
        drawPickaxe(ctx, bx, by, bs, "#AC8A56", "#5E3A1A");
        break;
      case BLOCK.STONE_PICKAXE:
        drawPickaxe(ctx, bx, by, bs, "#7F7F7F", "#5E3A1A");
        break;
      case BLOCK.IRON_PICKAXE:
        drawPickaxe(ctx, bx, by, bs, "#C8A887", "#5E3A1A");
        break;
      case BLOCK.WOODEN_AXE:
        drawAxe(ctx, bx, by, bs, "#AC8A56", "#5E3A1A");
        break;
      case BLOCK.STONE_AXE:
        drawAxe(ctx, bx, by, bs, "#7F7F7F", "#5E3A1A");
        break;
      case BLOCK.WOODEN_SHOVEL:
        drawShovel(ctx, bx, by, bs, "#AC8A56", "#5E3A1A");
        break;
      case BLOCK.STONE_SHOVEL:
        drawShovel(ctx, bx, by, bs, "#7F7F7F", "#5E3A1A");
        break;
      case BLOCK.WOODEN_SWORD:
        drawSword(ctx, bx, by, bs, "#AC8A56", "#5E3A1A");
        break;
      case BLOCK.STONE_SWORD:
        drawSword(ctx, bx, by, bs, "#7F7F7F", "#5E3A1A");
        break;
      case BLOCK.IRON_SWORD:
        drawSword(ctx, bx, by, bs, "#C8A887", "#5E3A1A");
        break;
      case BLOCK.COOKED_PORKCHOP:
      case BLOCK.RAW_PORKCHOP: {
        const col = itemId === BLOCK.COOKED_PORKCHOP ? "#B05020" : "#F090A0";
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(bx + bs * 0.5, by + bs * 0.55, bs * 0.35, bs * 0.28, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(bx + bs * 0.35, by + bs * 0.2, bs * 0.08, bs * 0.4);
        break;
      }
      default:
        ctx.fillStyle = "#888";
        ctx.fillRect(bx + bs * 0.1, by + bs * 0.1, bs * 0.8, bs * 0.8);
    }
  }
  function drawPickaxe(ctx, bx, by, bs, headColor, stickColor) {
    ctx.fillStyle = stickColor;
    ctx.fillRect(bx + bs * 0.42, by + bs * 0.35, bs * 0.15, bs * 0.6);
    ctx.fillStyle = headColor;
    ctx.fillRect(bx + bs * 0.15, by + bs * 0.15, bs * 0.7, bs * 0.15);
    ctx.fillRect(bx + bs * 0.15, by + bs * 0.05, bs * 0.1, bs * 0.15);
    ctx.fillRect(bx + bs * 0.44, by + bs * 0.03, bs * 0.12, bs * 0.15);
    ctx.fillRect(bx + bs * 0.75, by + bs * 0.05, bs * 0.1, bs * 0.15);
  }
  function drawAxe(ctx, bx, by, bs, headColor, stickColor) {
    ctx.fillStyle = stickColor;
    ctx.fillRect(bx + bs * 0.52, by + bs * 0.35, bs * 0.12, bs * 0.62);
    ctx.fillStyle = headColor;
    ctx.fillRect(bx + bs * 0.15, by + bs * 0.1, bs * 0.42, bs * 0.5);
    ctx.fillStyle = "#00000030";
    ctx.fillRect(bx + bs * 0.2, by + bs * 0.15, bs * 0.3, bs * 0.1);
  }
  function drawShovel(ctx, bx, by, bs, headColor, stickColor) {
    ctx.fillStyle = stickColor;
    ctx.fillRect(bx + bs * 0.44, by + bs * 0.3, bs * 0.12, bs * 0.65);
    ctx.fillStyle = headColor;
    ctx.fillRect(bx + bs * 0.33, by + bs * 0.08, bs * 0.34, bs * 0.28);
    ctx.fillRect(bx + bs * 0.33, by + bs * 0.36, bs * 0.34, bs * 0.08);
  }
  function drawSword(ctx, bx, by, bs, bladeColor, handleColor) {
    ctx.fillStyle = bladeColor;
    ctx.fillRect(bx + bs * 0.44, by + bs * 0.05, bs * 0.12, bs * 0.6);
    ctx.fillStyle = "#8B6914";
    ctx.fillRect(bx + bs * 0.2, by + bs * 0.58, bs * 0.6, bs * 0.1);
    ctx.fillStyle = handleColor;
    ctx.fillRect(bx + bs * 0.44, by + bs * 0.68, bs * 0.12, bs * 0.27);
  }
  var textureCache = /* @__PURE__ */ new Map();
  function getCachedTexture(blockId, blockSize, timeOffset = 0) {
    if (blockId === BLOCK.WATER) return null;
    const key = `${blockId}_${blockSize}`;
    if (textureCache.has(key)) return textureCache.get(key);
    const offscreen = document.createElement("canvas");
    offscreen.width = blockSize;
    offscreen.height = blockSize;
    const octx = offscreen.getContext("2d");
    drawBlock(octx, blockId, 0, 0, blockSize, 0);
    textureCache.set(key, offscreen);
    return offscreen;
  }

  // world.js
  var WORLD_WIDTH = 400;
  var WORLD_HEIGHT = 150;
  var CHUNK_SIZE = 16;
  var SEA_LEVEL = 90;
  var BEDROCK_START = 145;
  var BIOME = { PLAINS: 0, FOREST: 1, DESERT: 2, SNOWY: 3 };
  var World = class _World {
    constructor(seed = Math.floor(Math.random() * 1e5)) {
      this.seed = seed;
      this.noise = new PerlinNoise(seed);
      this.blocks = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
      this.lightMap = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
      this.heightMap = new Int16Array(WORLD_WIDTH);
      this.biomeMap = new Uint8Array(WORLD_WIDTH);
      this.dirtyChunks = /* @__PURE__ */ new Set();
      for (let c = 0; c < Math.ceil(WORLD_WIDTH / CHUNK_SIZE); c++) {
        this.dirtyChunks.add(c);
      }
    }
    idx(x, y) {
      return y * WORLD_WIDTH + x;
    }
    getBlock(x, y) {
      if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return BLOCK.BEDROCK;
      return this.blocks[this.idx(x, y)];
    }
    setBlock(x, y, id) {
      if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
      this.blocks[this.idx(x, y)] = id;
      const chunkX = Math.floor(x / CHUNK_SIZE);
      this.dirtyChunks.add(chunkX);
      if (x % CHUNK_SIZE === 0 && chunkX > 0) this.dirtyChunks.add(chunkX - 1);
      if ((x + 1) % CHUNK_SIZE === 0) this.dirtyChunks.add(chunkX + 1);
      this._updateLightArea(x - 15, y - 15, x + 15, y + 15);
    }
    getLight(x, y) {
      if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return 0;
      return this.lightMap[this.idx(x, y)];
    }
    isChunkDirty(chunkX) {
      return this.dirtyChunks.has(chunkX);
    }
    markChunkClean(chunkX) {
      this.dirtyChunks.delete(chunkX);
    }
    isSolid(x, y) {
      const b = this.getBlock(x, y);
      return BLOCK_DATA[b] ? BLOCK_DATA[b].solid : true;
    }
    isTransparent(x, y) {
      const b = this.getBlock(x, y);
      return BLOCK_DATA[b] ? BLOCK_DATA[b].transparent : false;
    }
    // Environment presets
    static get ENVIRONMENTS() {
      return {
        mixed: { name: "Mixed World", desc: "All biomes, caves, ores", color: "#5D9E1F" },
        grasslands: { name: "Grasslands", desc: "Rolling green hills", color: "#7DB83A" },
        forest: { name: "Dense Forest", desc: "Thick trees everywhere", color: "#2D7D27" },
        desert: { name: "Desert", desc: "Sand dunes, no water", color: "#F0D87A" },
        snowy: { name: "Tundra", desc: "Snow-covered icy world", color: "#E8EAEC" },
        ocean: { name: "Ocean World", desc: "Vast seas with islands", color: "#2D5DA1" },
        caves: { name: "Cave World", desc: "Underground with huge caverns", color: "#3B3B3B" },
        flat: { name: "Superflat", desc: "Perfectly flat grass world", color: "#AC8A56" }
      };
    }
    // ─── World Generation ───────────────────────────────────────────────────────
    *generateGenerator(preset = "mixed") {
      this.preset = preset;
      if (preset === "flat") {
        const flatSurf = 82;
        for (let x = 0; x < WORLD_WIDTH; x++) {
          this.heightMap[x] = flatSurf;
          this.biomeMap[x] = BIOME.PLAINS;
          for (let y = 0; y < WORLD_HEIGHT; y++) {
            let b = BLOCK.AIR;
            if (y >= BEDROCK_START) b = BLOCK.BEDROCK;
            else if (y > flatSurf + 3) b = BLOCK.STONE;
            else if (y > flatSurf) b = BLOCK.DIRT;
            else if (y === flatSurf) b = BLOCK.GRASS;
            this.blocks[this.idx(x, y)] = b;
          }
          if (x % 40 === 0) yield 0.05 + x / WORLD_WIDTH * 0.85;
        }
        this._computeFullLighting();
        yield 1;
        return;
      }
      for (let x = 0; x < WORLD_WIDTH; x++) {
        let surfY, biome;
        switch (preset) {
          case "grasslands":
            surfY = Math.floor(78 + this.noise.octaveNoise(x * 0.012, 0, 3, 0.45, 2) * 12);
            biome = BIOME.PLAINS;
            break;
          case "forest":
            surfY = Math.floor(74 + this.noise.octaveNoise(x * 0.018, 0, 5, 0.55, 2.1) * 18);
            biome = BIOME.FOREST;
            break;
          case "desert":
            surfY = Math.floor(78 + this.noise.octaveNoise(x * 0.025, 0, 3, 0.4, 2) * 14);
            biome = BIOME.DESERT;
            break;
          case "snowy":
            surfY = Math.floor(74 + this.noise.octaveNoise(x * 0.018, 0, 5, 0.55, 2.1) * 18);
            biome = BIOME.SNOWY;
            break;
          case "ocean":
            surfY = Math.floor(95 + this.noise.octaveNoise(x * 0.015, 0, 4, 0.5, 2) * 10);
            biome = BIOME.PLAINS;
            break;
          case "caves":
            surfY = Math.floor(20 + this.noise.octaveNoise(x * 0.02, 0, 3, 0.4, 2) * 5);
            biome = BIOME.PLAINS;
            break;
          default:
            surfY = Math.floor(72 + this.noise.octaveNoise(x * 0.018, 0, 5, 0.55, 2.1) * 22);
            const b = this.noise.noise1D(x * 4e-3 + 500);
            if (b < -0.45) biome = BIOME.DESERT;
            else if (b > 0.5) biome = BIOME.SNOWY;
            else if (b > 0.15) biome = BIOME.FOREST;
            else biome = BIOME.PLAINS;
        }
        this.heightMap[x] = surfY;
        this.biomeMap[x] = biome;
      }
      yield 0.05;
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const surf = this.heightMap[x];
        const biome = this.biomeMap[x];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let block = BLOCK.AIR;
          if (y >= BEDROCK_START) {
            block = BLOCK.BEDROCK;
          } else if (preset === "caves" && y <= surf) {
            block = y <= 5 ? BLOCK.BEDROCK : BLOCK.STONE;
          } else if (y >= surf + 5) {
            block = BLOCK.STONE;
          } else if (y >= surf + 1) {
            if (biome === BIOME.DESERT) block = BLOCK.SAND;
            else block = BLOCK.DIRT;
          } else if (y === surf) {
            if (preset === "caves") block = BLOCK.STONE;
            else if (biome === BIOME.DESERT) block = BLOCK.SAND;
            else if (biome === BIOME.SNOWY) block = BLOCK.SNOW;
            else block = BLOCK.GRASS;
          }
          this.blocks[this.idx(x, y)] = block;
        }
        if (x % 32 === 0) yield 0.05 + x / WORLD_WIDTH * 0.2;
      }
      yield 0.25;
      if (preset !== "desert" && preset !== "caves") {
        for (let x = 0; x < WORLD_WIDTH; x++) {
          const surf = this.heightMap[x];
          if (surf < SEA_LEVEL) {
            for (let y = surf; y < SEA_LEVEL; y++) {
              if (this.blocks[this.idx(x, y)] === BLOCK.AIR) {
                this.blocks[this.idx(x, y)] = BLOCK.WATER;
              }
            }
          }
        }
      }
      yield 0.3;
      const caveThreshold = preset === "caves" ? 0.025 : 0.04;
      const caveScale = preset === "caves" ? 0.05 : 0.07;
      for (let y = 10; y < BEDROCK_START - 5; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
          const b = this.blocks[this.idx(x, y)];
          if (b !== BLOCK.STONE && b !== BLOCK.DIRT) continue;
          const v1 = this.noise.noise2D(x * caveScale, y * caveScale);
          const v2 = this.noise.noise2D(x * caveScale + 200, y * caveScale + 200);
          if (v1 * v1 + v2 * v2 < caveThreshold) {
            this.blocks[this.idx(x, y)] = BLOCK.AIR;
          }
        }
        if (y % 20 === 0) yield 0.3 + y / BEDROCK_START * 0.15;
      }
      yield 0.45;
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const surf = this.heightMap[x];
        for (let y = surf + 5; y < BEDROCK_START - 5; y++) {
          if (this.blocks[this.idx(x, y)] !== BLOCK.STONE) continue;
          const r = this.noise.noise2D(x * 0.5 + 1e3, y * 0.5 + 1e3);
          const depth = y - surf;
          if (depth > 5 && r > 0.72) this.blocks[this.idx(x, y)] = BLOCK.COAL_ORE;
          else if (depth > 15 && r > 0.78) this.blocks[this.idx(x, y)] = BLOCK.IRON_ORE;
          else if (y > 100 && r > 0.84) this.blocks[this.idx(x, y)] = BLOCK.GOLD_ORE;
          else if (y > 130 && r > 0.9) this.blocks[this.idx(x, y)] = BLOCK.DIAMOND_ORE;
          const g = this.noise.noise2D(x * 0.3 + 2e3, y * 0.3 + 2e3);
          if (depth > 10 && g > 0.7) this.blocks[this.idx(x, y)] = BLOCK.GRAVEL;
        }
        if (x % 32 === 0) yield 0.45 + x / WORLD_WIDTH * 0.15;
      }
      yield 0.6;
      if (preset !== "desert" && preset !== "snowy" && preset !== "caves") {
        const treeSpacing = preset === "forest" ? 0.3 : preset === "grasslands" ? 0.65 : 0.55;
        for (let x = 3; x < WORLD_WIDTH - 3; x++) {
          const surf = this.heightMap[x];
          if (surf >= SEA_LEVEL) continue;
          if (this.blocks[this.idx(x, surf)] !== BLOCK.GRASS) continue;
          const treeNoise = this.noise.noise2D(x * 0.4 + 3e3, 0);
          if (treeNoise > treeSpacing) {
            this._placeTree(x, surf);
            x += preset === "forest" ? 1 : 2;
          }
        }
      }
      yield 0.7;
      if (preset === "desert") {
        for (let x = 5; x < WORLD_WIDTH - 5; x++) {
          const surf = this.heightMap[x];
          const n = this.noise.noise2D(x * 0.3 + 5e3, 0);
          if (n > 0.75 && this.blocks[this.idx(x, surf)] === BLOCK.SAND) {
            const h = 1 + Math.floor(n * 3);
            for (let dy = 1; dy <= h; dy++) {
              if (surf - dy >= 0) this.blocks[this.idx(x, surf - dy)] = BLOCK.SAND;
            }
          }
        }
      }
      this._computeFullLighting();
      yield 1;
    }
    generate(preset = "mixed") {
      const gen = this.generateGenerator(preset);
      let result;
      do {
        result = gen.next();
      } while (!result.done);
    }
    findSpawnSurface(x) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const b = this.blocks[this.idx(x, y)];
        if (b !== BLOCK.AIR && b !== BLOCK.WATER && BLOCK_DATA[b]?.solid) return y;
      }
      return 80;
    }
    _placeTree(x, surfY) {
      const height = 4 + Math.floor(this.noise.noise2D(x * 2, 1e3) * 2 + 2);
      for (let i = 1; i <= height; i++) {
        if (surfY - i >= 0) this.blocks[this.idx(x, surfY - i)] = BLOCK.WOOD;
      }
      const topY = surfY - height;
      for (let dy = -2; dy <= 1; dy++) {
        const radius = dy <= -1 ? 2 : 1;
        for (let dx = -radius; dx <= radius; dx++) {
          const lx = x + dx, ly = topY + dy;
          if (lx < 0 || lx >= WORLD_WIDTH || ly < 0 || ly >= WORLD_HEIGHT) continue;
          if (this.blocks[this.idx(lx, ly)] === BLOCK.AIR) {
            this.blocks[this.idx(lx, ly)] = BLOCK.LEAVES;
          }
        }
      }
    }
    // ─── Lighting ───────────────────────────────────────────────────────────────
    _computeFullLighting() {
      this.lightMap.fill(0);
      const skyQueue = [];
      for (let x = 0; x < WORLD_WIDTH; x++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          if (!this.isTransparent(x, y)) break;
          const i = this.idx(x, y);
          this.lightMap[i] = 15;
          skyQueue.push(x, y, 15);
        }
      }
      const sq = [];
      for (let i = 0; i < skyQueue.length; i += 3) {
        sq.push([skyQueue[i], skyQueue[i + 1], skyQueue[i + 2]]);
      }
      this._bfsLight(sq);
      const torchQueue = [];
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
          const b = this.blocks[this.idx(x, y)];
          const data = BLOCK_DATA[b];
          if (data && data.lightEmission > 0) {
            torchQueue.push([x, y, data.lightEmission]);
          }
        }
      }
      this._bfsLight(torchQueue);
    }
    _bfsLight(initial) {
      const queue = [...initial];
      let head = 0;
      while (head < queue.length) {
        const [x, y, light] = queue[head++];
        if (light <= 1) continue;
        const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= WORLD_WIDTH || ny < 0 || ny >= WORLD_HEIGHT) continue;
          if (!this.isTransparent(nx, ny)) continue;
          const ni = this.idx(nx, ny);
          const newLight = light - 1;
          if (this.lightMap[ni] < newLight) {
            this.lightMap[ni] = newLight;
            queue.push([nx, ny, newLight]);
          }
        }
      }
    }
    _updateLightArea(x1, y1, x2, y2) {
      x1 = Math.max(0, x1);
      y1 = Math.max(0, y1);
      x2 = Math.min(WORLD_WIDTH - 1, x2);
      y2 = Math.min(WORLD_HEIGHT - 1, y2);
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          this.lightMap[this.idx(x, y)] = 0;
        }
      }
      const initial = [];
      for (let x = x1; x <= x2; x++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          if (!this.isTransparent(x, y)) break;
          const i = this.idx(x, y);
          this.lightMap[i] = 15;
          if (y >= y1 && y <= y2) initial.push([x, y, 15]);
        }
      }
      for (let y = y1; y <= y2; y++) {
        for (const x of [x1 - 1, x2 + 1]) {
          if (x < 0 || x >= WORLD_WIDTH) continue;
          const light = this.lightMap[this.idx(x, y)];
          if (light > 1) initial.push([x, y, light]);
        }
      }
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          const b = this.blocks[this.idx(x, y)];
          const data = BLOCK_DATA[b];
          if (data && data.lightEmission > 0) initial.push([x, y, data.lightEmission]);
        }
      }
      this._bfsLight(initial);
    }
    // ─── Serialization ──────────────────────────────────────────────────────────
    serialize() {
      return {
        seed: this.seed,
        blocks: Array.from(this.blocks)
      };
    }
    static deserialize(data) {
      const w = new _World(data.seed);
      w.blocks = new Uint8Array(data.blocks);
      w._computeFullLighting();
      for (let x = 0; x < WORLD_WIDTH; x++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          if (w.blocks[w.idx(x, y)] !== BLOCK.AIR && w.blocks[w.idx(x, y)] !== BLOCK.WATER) {
            w.heightMap[x] = y;
            break;
          }
        }
      }
      for (let c = 0; c < Math.ceil(WORLD_WIDTH / CHUNK_SIZE); c++) {
        w.dirtyChunks.add(c);
      }
      return w;
    }
  };

  // inventory.js
  var ItemStack = class _ItemStack {
    constructor(id, count = 1) {
      this.id = id;
      this.count = count;
    }
    clone() {
      return new _ItemStack(this.id, this.count);
    }
  };
  var Inventory = class _Inventory {
    constructor() {
      this.slots = new Array(36).fill(null);
      this.selectedSlot = 0;
      this.craftGrid2 = new Array(4).fill(null);
      this.craftGrid3 = new Array(9).fill(null);
      this.craftOutput = null;
      this.usingCraftingTable = false;
    }
    // Add item, returns leftover count
    addItem(id, count = 1) {
      for (let i = 0; i < 36; i++) {
        if (this.slots[i] && this.slots[i].id === id && this.slots[i].count < 64) {
          const space = 64 - this.slots[i].count;
          const add = Math.min(space, count);
          this.slots[i].count += add;
          count -= add;
          if (count <= 0) return 0;
        }
      }
      for (let i = 0; i < 36; i++) {
        if (!this.slots[i]) {
          const add = Math.min(64, count);
          this.slots[i] = new ItemStack(id, add);
          count -= add;
          if (count <= 0) return 0;
        }
      }
      return count;
    }
    removeFromSlot(slotIdx, count = 1) {
      const slot = this.slots[slotIdx];
      if (!slot) return false;
      slot.count -= count;
      if (slot.count <= 0) this.slots[slotIdx] = null;
      return true;
    }
    getHotbarSlot(i) {
      return this.slots[i] || null;
    }
    getActiveItem() {
      return this.slots[this.selectedSlot] || null;
    }
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
      this[is3x3 ? "craftOutput3" : "craftOutput"] = result;
      return result;
    }
    craft(is3x3 = false) {
      const grid = is3x3 ? this.craftGrid3 : this.craftGrid2;
      const output = this.computeCraftOutput(is3x3);
      if (!output) return null;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
          grid[i].count--;
          if (grid[i].count <= 0) grid[i] = null;
        }
      }
      this[is3x3 ? "craftOutput3" : "craftOutput"] = null;
      return output;
    }
    serialize() {
      return {
        slots: this.slots.map((s) => s ? { id: s.id, count: s.count } : null),
        selectedSlot: this.selectedSlot
      };
    }
    static deserialize(data) {
      const inv = new _Inventory();
      inv.slots = data.slots.map((s) => s ? new ItemStack(s.id, s.count) : null);
      inv.selectedSlot = data.selectedSlot || 0;
      return inv;
    }
  };
  var RECIPES = [
    // Shapeless
    { type: "shapeless", inputs: [{ id: BLOCK.WOOD, count: 1 }], output: { id: BLOCK.PLANKS, count: 4 } },
    { type: "shapeless", inputs: [{ id: BLOCK.PLANKS, count: 2 }], output: { id: BLOCK.STICK, count: 4 } },
    { type: "shapeless", inputs: [{ id: BLOCK.WOOD, count: 1 }, { id: BLOCK.WOOD, count: 1 }], output: { id: BLOCK.PLANKS, count: 8 } },
    // Shaped 2x2
    {
      type: "shaped",
      size: 2,
      pattern: [[BLOCK.PLANKS, BLOCK.PLANKS], [BLOCK.PLANKS, BLOCK.PLANKS]],
      output: { id: BLOCK.CRAFTING_TABLE, count: 1 }
    },
    // Shaped 3x3 — Wooden Pickaxe
    {
      type: "shaped",
      size: 3,
      pattern: [
        [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
        [null, BLOCK.STICK, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.WOODEN_PICKAXE, count: 1 }
    },
    // Stone Pickaxe
    {
      type: "shaped",
      size: 3,
      pattern: [
        [BLOCK.STONE, BLOCK.STONE, BLOCK.STONE],
        [null, BLOCK.STICK, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.STONE_PICKAXE, count: 1 }
    },
    // Iron Pickaxe
    {
      type: "shaped",
      size: 3,
      pattern: [
        [BLOCK.IRON_INGOT, BLOCK.IRON_INGOT, BLOCK.IRON_INGOT],
        [null, BLOCK.STICK, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.IRON_PICKAXE, count: 1 }
    },
    // Wooden Axe
    {
      type: "shaped",
      size: 3,
      pattern: [
        [BLOCK.PLANKS, BLOCK.PLANKS, null],
        [BLOCK.PLANKS, BLOCK.STICK, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.WOODEN_AXE, count: 1 }
    },
    // Stone Axe
    {
      type: "shaped",
      size: 3,
      pattern: [
        [BLOCK.STONE, BLOCK.STONE, null],
        [BLOCK.STONE, BLOCK.STICK, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.STONE_AXE, count: 1 }
    },
    // Wooden Shovel
    {
      type: "shaped",
      size: 3,
      pattern: [
        [null, BLOCK.PLANKS, null],
        [null, BLOCK.STICK, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.WOODEN_SHOVEL, count: 1 }
    },
    // Wooden Sword
    {
      type: "shaped",
      size: 3,
      pattern: [
        [null, BLOCK.PLANKS, null],
        [null, BLOCK.PLANKS, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.WOODEN_SWORD, count: 1 }
    },
    // Stone Sword
    {
      type: "shaped",
      size: 3,
      pattern: [
        [null, BLOCK.STONE, null],
        [null, BLOCK.STONE, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.STONE_SWORD, count: 1 }
    },
    // Iron Sword
    {
      type: "shaped",
      size: 3,
      pattern: [
        [null, BLOCK.IRON_INGOT, null],
        [null, BLOCK.IRON_INGOT, null],
        [null, BLOCK.STICK, null]
      ],
      output: { id: BLOCK.IRON_SWORD, count: 1 }
    },
    // Torch (4 torches from 1 coal + 1 stick)
    {
      type: "shaped",
      size: 2,
      pattern: [
        [BLOCK.COAL, null],
        [BLOCK.STICK, null]
      ],
      output: { id: BLOCK.TORCH, count: 4 }
    },
    {
      type: "shaped",
      size: 3,
      pattern: [
        [null, BLOCK.COAL, null],
        [null, BLOCK.STICK, null],
        [null, null, null]
      ],
      output: { id: BLOCK.TORCH, count: 4 }
    },
    // Glass (would need furnace, skip for now - just allow direct)
    // Planks to chest
    {
      type: "shaped",
      size: 3,
      pattern: [
        [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
        [BLOCK.PLANKS, null, BLOCK.PLANKS],
        [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS]
      ],
      output: { id: BLOCK.CHEST, count: 1 }
    }
  ];
  function matchRecipes(grid, size) {
    for (const recipe of RECIPES) {
      if (recipe.type === "shapeless") {
        const result = tryShapeless(grid, recipe);
        if (result) return new ItemStack(result.id, result.count);
      } else if (recipe.type === "shaped") {
        const result = tryShaped(grid, size, recipe);
        if (result) return new ItemStack(result.id, result.count);
      }
    }
    return null;
  }
  function tryShapeless(grid, recipe) {
    const available = {};
    for (const slot of grid) {
      if (slot) available[slot.id] = (available[slot.id] || 0) + slot.count;
    }
    const needed = {};
    for (const inp of recipe.inputs) {
      needed[inp.id] = (needed[inp.id] || 0) + inp.count;
    }
    let totalGrid = 0;
    for (const slot of grid) {
      if (slot) totalGrid += 1;
    }
    let totalNeeded = recipe.inputs.length;
    if (totalGrid !== totalNeeded) return null;
    for (const [id, cnt] of Object.entries(needed)) {
      if ((available[id] || 0) < cnt) return null;
    }
    return recipe.output;
  }
  function tryShaped(grid, gridSize, recipe) {
    const patSize = recipe.size;
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
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const slot = grid[y * gridSize + x];
        const px2 = x - ox, py = y - oy;
        if (px2 < 0 || px2 >= patSize || py < 0 || py >= patSize) {
          if (slot !== null) return false;
        } else {
          const expected = pattern[py][px2];
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

  // player.js
  var GRAVITY = 30;
  var JUMP_VEL = -12;
  var WALK_SPEED = 4.5;
  var SPRINT_SPEED = 7;
  var SWIM_SPEED = 2.5;
  var MAX_FALL = 55;
  var MINING_RANGE = 5;
  var Player = class {
    constructor(world, inventory) {
      this.world = world;
      this.inventory = inventory;
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;
      this.inWater = false;
      this.width = 0.6;
      this.height = 1.8;
      this.health = 20;
      this.maxHealth = 20;
      this.hunger = 20;
      this.maxHunger = 20;
      this._hungerTimer = 0;
      this._healthRegen = 0;
      this.miningBlock = null;
      this.miningProgress = 0;
      this.miningTime = 0;
      this.creativeMode = false;
      this.flying = false;
      this._jumpPressTime = -1;
      this._flyVy = 0;
      this.walkCycle = 0;
      this.facingLeft = false;
      this.isMoving = false;
      this._spawn();
    }
    _spawn() {
      const cx = Math.floor(WORLD_WIDTH / 2);
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
      const centerX = this.x;
      const feetY = this.y + this.height - 0.1;
      this.inWater = this.world.getBlock(Math.floor(centerX), Math.floor(feetY)) === BLOCK.WATER || this.world.getBlock(Math.floor(centerX), Math.floor(this.y + 0.5)) === BLOCK.WATER;
      if (this.creativeMode) {
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
          if (input.left) {
            this.vx = -hspd;
            this.facingLeft = true;
            this.isMoving = true;
          } else if (input.right) {
            this.vx = hspd;
            this.facingLeft = false;
            this.isMoving = true;
          } else {
            this.vx = 0;
            this.isMoving = false;
          }
          if (input.jump) this._flyVy = -flySpeed;
          else if (input.sneak) this._flyVy = flySpeed;
          else this._flyVy *= 0.8;
          const nx2 = this.x + this.vx * dt;
          if (!this._collidesAt(nx2, this.y)) this.x = nx2;
          else this.vx = 0;
          const ny2 = this.y + this._flyVy * dt;
          if (!this._collidesAt(this.x, ny2)) this.y = ny2;
          else {
            this._flyVy = 0;
            if (this._flyVy > 0) {
              this.flying = false;
            }
          }
          this.vy = 0;
          this.onGround = false;
          this.x = Math.max(this.width / 2, Math.min(WORLD_WIDTH - this.width / 2, this.x));
          this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.y));
          if (this.isMoving) this.walkCycle += dt * 6;
          else this.walkCycle *= 0.85;
          this._miningTick(dt);
          return;
        }
      }
      const baseSpeed = this.creativeMode ? WALK_SPEED * 1.4 : WALK_SPEED;
      const speed = input.sprint && !this.inWater ? this.creativeMode ? baseSpeed * 1.6 : SPRINT_SPEED : this.inWater ? SWIM_SPEED : baseSpeed;
      if (input.left) {
        this.vx = -speed;
        this.facingLeft = true;
        this.isMoving = true;
      } else if (input.right) {
        this.vx = speed;
        this.facingLeft = false;
        this.isMoving = true;
      } else {
        this.vx = 0;
        this.isMoving = false;
      }
      if (input.jump) {
        if (this.inWater) {
          this.vy = -SWIM_SPEED;
        } else if (this.onGround) {
          this.vy = JUMP_VEL;
          this.onGround = false;
        }
      }
      if (this.inWater) {
        this.vy += 6 * dt;
        this.vy = Math.min(this.vy, 3);
      } else {
        this.vy += GRAVITY * dt;
        this.vy = Math.min(this.vy, MAX_FALL);
      }
      const nx = this.x + this.vx * dt;
      if (!this._collidesAt(nx, this.y)) this.x = nx;
      else this.vx = 0;
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
      this.x = Math.max(this.width / 2, Math.min(WORLD_WIDTH - this.width / 2, this.x));
      this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.y));
      if (this.isMoving && this.onGround) this.walkCycle += dt * 8;
      else this.walkCycle *= 0.8;
      this._miningTick(dt);
    }
    _miningTick(dt) {
      if (this.miningBlock) {
        const blockId = this.world.getBlock(this.miningBlock.bx, this.miningBlock.by);
        const hardness = BLOCK_DATA[blockId]?.hardness ?? 1;
        if (hardness === Infinity) {
        } else if (this.creativeMode) {
          this._breakBlock(this.miningBlock.bx, this.miningBlock.by, true);
          this.miningBlock = null;
          this.miningProgress = 0;
          this.miningTime = 0;
        } else {
          const toolMult = this._getToolMultiplier(this.miningBlock.bx, this.miningBlock.by);
          this.miningTime += dt;
          this.miningProgress = Math.min(1, this.miningTime / (hardness / toolMult));
          if (this.miningProgress >= 1) {
            this._breakBlock(this.miningBlock.bx, this.miningBlock.by, false);
            this.miningBlock = null;
            this.miningProgress = 0;
            this.miningTime = 0;
          }
        }
      }
    }
    _collidesAt(px2, py) {
      const bx1 = Math.floor(px2 - this.width / 2);
      const bx2 = Math.floor(px2 + this.width / 2 - 1e-3);
      const by1 = Math.floor(py);
      const by2 = Math.floor(py + this.height - 1e-3);
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
      if (blockData.tool === itemData.tool || blockData.tool === "any") {
        return itemData.speed || 2;
      }
      return 1;
    }
    _breakBlock(bx, by, creative = false) {
      const blockId = this.world.getBlock(bx, by);
      const blockData = BLOCK_DATA[blockId];
      if (!blockData) return;
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
      return { bx, by };
    }
    getPlaceFace(mouseWorldX, mouseWorldY) {
      const bx = Math.floor(mouseWorldX);
      const by = Math.floor(mouseWorldY);
      if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return null;
      const dist = Math.hypot(bx + 0.5 - this.x, by + 0.5 - (this.y + this.height / 2));
      if (dist > MINING_RANGE) return null;
      const fx = mouseWorldX - bx - 0.5;
      const fy = mouseWorldY - by - 0.5;
      let ax = 0, ay = 0;
      if (Math.abs(fx) > Math.abs(fy)) ax = fx > 0 ? 1 : -1;
      else ay = fy > 0 ? 1 : -1;
      const clickedBlock = this.world.getBlock(bx, by);
      if (clickedBlock !== BLOCK.AIR && clickedBlock !== BLOCK.WATER) {
        return { bx: bx + ax, by: by + ay };
      }
      return { bx, by };
    }
    takeDamage(amount) {
      if (this.creativeMode) return;
      this.health = Math.max(0, this.health - amount);
    }
    eat(foodValue) {
      this.hunger = Math.min(this.maxHunger, this.hunger + foodValue);
    }
    isDead() {
      return !this.creativeMode && this.health <= 0;
    }
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
      this.x = data.x;
      this.y = data.y;
      this.vx = data.vx || 0;
      this.vy = data.vy || 0;
      this.health = data.health || 20;
      this.hunger = data.hunger || 20;
    }
  };

  // renderer.js
  var BLOCK_SIZE = 32;
  var CRACK_PATTERNS = [
    [[7, 7, 2, 1], [6, 8, 1, 1]],
    [[5, 6, 1, 2], [8, 6, 2, 1], [7, 9, 1, 1], [6, 10, 2, 1]],
    [[3, 5, 1, 2], [5, 5, 3, 1], [8, 5, 2, 1], [7, 7, 2, 1], [4, 9, 1, 2], [6, 10, 3, 1], [10, 8, 2, 2]],
    [[2, 4, 2, 1], [4, 4, 4, 1], [8, 4, 2, 1], [3, 6, 1, 2], [6, 6, 2, 1], [9, 6, 1, 2], [2, 9, 3, 1], [6, 9, 4, 1], [11, 9, 2, 1]],
    [[1, 3, 3, 1], [4, 3, 5, 1], [9, 3, 4, 1], [2, 5, 1, 3], [5, 5, 2, 1], [8, 5, 2, 1], [11, 5, 1, 3], [1, 8, 4, 1], [5, 8, 5, 1], [10, 8, 3, 1], [1, 11, 2, 1], [4, 11, 4, 1], [9, 11, 3, 1]],
    [[0, 2, 16, 1], [0, 3, 2, 1], [14, 3, 2, 1], [2, 5, 2, 1], [12, 5, 2, 1], [0, 8, 3, 1], [13, 8, 3, 1], [0, 13, 16, 1], [3, 14, 10, 1]]
  ];
  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }
  var Renderer = class {
    constructor(canvas, world, player) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.world = world;
      this.player = player;
      this.camX = player.x;
      this.camY = player.y + player.height / 2;
      this.blockSize = BLOCK_SIZE;
      this.particles = [];
      this._particlePool = [];
      this.stars = this._generateStars(200);
    }
    _generateStars(count) {
      const stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random() * 0.65,
          size: Math.random() > 0.8 ? 2 : 1,
          bri: 0.5 + Math.random() * 0.5
        });
      }
      return stars;
    }
    worldToScreen(wx, wy) {
      return {
        x: (wx - this.camX) * this.blockSize + this.canvas.width / 2,
        y: (wy - this.camY) * this.blockSize + this.canvas.height / 2
      };
    }
    screenToWorld(sx, sy) {
      return {
        x: (sx - this.canvas.width / 2) / this.blockSize + this.camX,
        y: (sy - this.canvas.height / 2) / this.blockSize + this.camY
      };
    }
    spawnParticles(wx, wy, blockId, count = 10) {
      for (let i = 0; i < count; i++) {
        const p = this._particlePool.pop() || {};
        p.x = wx + 0.2 + Math.random() * 0.6;
        p.y = wy + 0.2 + Math.random() * 0.6;
        p.vx = (Math.random() - 0.5) * 7;
        p.vy = -(Math.random() * 5 + 2);
        p.life = p.maxLife = 0.4 + Math.random() * 0.5;
        p.color = this._blockColor(blockId);
        p.size = 2 + Math.random() * 4;
        this.particles.push(p);
      }
    }
    _blockColor(id) {
      const map = {
        [BLOCK.GRASS]: "#5D9E1F",
        [BLOCK.DIRT]: "#7B5C3A",
        [BLOCK.STONE]: "#7F7F7F",
        [BLOCK.SAND]: "#F0D87A",
        [BLOCK.WOOD]: "#5E3A1A",
        [BLOCK.LEAVES]: "#2D7D27",
        [BLOCK.COAL_ORE]: "#333",
        [BLOCK.IRON_ORE]: "#C8A887",
        [BLOCK.GOLD_ORE]: "#FCE04A",
        [BLOCK.DIAMOND_ORE]: "#4AFCE0",
        [BLOCK.PLANKS]: "#AC8A56",
        [BLOCK.GRAVEL]: "#848484",
        [BLOCK.BEDROCK]: "#3B3B3B",
        [BLOCK.SNOW]: "#EEE"
      };
      return map[id] || "#888";
    }
    updateCamera(dt) {
      const tx = this.player.x;
      const ty = this.player.y + this.player.height / 2;
      const k = Math.min(1, 10 * dt);
      this.camX += (tx - this.camX) * k;
      this.camY += (ty - this.camY) * k;
    }
    render(timeOfDay, gameTime, targetBlock, entities) {
      const ctx = this.ctx;
      const W = this.canvas.width, H = this.canvas.height;
      const bs = this.blockSize;
      this._drawSky(ctx, W, H, timeOfDay);
      const x1 = Math.max(0, Math.floor(this.camX - W / (2 * bs)) - 1);
      const x2 = Math.min(WORLD_WIDTH - 1, Math.ceil(this.camX + W / (2 * bs)) + 1);
      const y1 = Math.max(0, Math.floor(this.camY - H / (2 * bs)) - 1);
      const y2 = Math.min(WORLD_HEIGHT - 1, Math.ceil(this.camY + H / (2 * bs)) + 1);
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          const blockId = this.world.getBlock(x, y);
          if (blockId === BLOCK.AIR) continue;
          const sp = this.worldToScreen(x, y);
          if (blockId === BLOCK.WATER) {
            drawBlock(ctx, blockId, sp.x, sp.y, bs, gameTime);
          } else {
            const cached = getCachedTexture(blockId, bs);
            if (cached) ctx.drawImage(cached, sp.x, sp.y);
            else drawBlock(ctx, blockId, sp.x, sp.y, bs, gameTime);
          }
        }
      }
      if (targetBlock) {
        const sp = this.worldToScreen(targetBlock.bx, targetBlock.by);
        const bid = this.world.getBlock(targetBlock.bx, targetBlock.by);
        if (bid !== BLOCK.AIR) {
          ctx.strokeStyle = "rgba(0,0,0,0.85)";
          ctx.lineWidth = 2;
          ctx.strokeRect(sp.x + 1, sp.y + 1, bs - 2, bs - 2);
          if (this.player.miningBlock && this.player.miningBlock.bx === targetBlock.bx && this.player.miningBlock.by === targetBlock.by && this.player.miningProgress > 0) {
            this._drawCracks(ctx, sp.x, sp.y, bs, this.player.miningProgress);
          }
        }
      }
      for (const e of entities) {
        const sp = this.worldToScreen(e.x, e.y + e.height);
        if (sp.x > -100 && sp.x < W + 100) {
          e.render(ctx, sp.x, sp.y, bs);
        }
      }
      this._drawLighting(ctx, x1, y1, x2, y2, timeOfDay);
      this._drawPlayer(ctx);
      this._tickParticles(ctx, 1 / 60);
      const le = this.worldToScreen(0, 0);
      const re = this.worldToScreen(WORLD_WIDTH, 0);
      if (le.x > 0) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, le.x, H);
      }
      if (re.x < W) {
        ctx.fillStyle = "#000";
        ctx.fillRect(re.x, 0, W - re.x, H);
      }
      const te = this.worldToScreen(0, 0);
      const be2 = this.worldToScreen(0, WORLD_HEIGHT);
      if (te.y > 0) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, te.y);
      }
      if (be2.y < H) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, be2.y, W, H - be2.y);
      }
    }
    _drawSky(ctx, W, H, t) {
      let topR, topG, topB, botR, botG, botB;
      if (t < 0.2) {
        topR = 135;
        topG = 206;
        topB = 235;
        botR = 176;
        botG = 226;
        botB = 255;
      } else if (t < 0.3) {
        const f = (t - 0.2) / 0.1;
        topR = lerp(135, 10, f);
        topG = lerp(206, 10, f);
        topB = lerp(235, 30, f);
        botR = lerp(176, 255, f);
        botG = lerp(226, 80, f);
        botB = lerp(255, 30, f);
      } else if (t < 0.5) {
        const f = (t - 0.3) / 0.2;
        topR = lerp(10, 5, f);
        topG = lerp(10, 5, f);
        topB = lerp(30, 15, f);
        botR = lerp(255, 10, f);
        botG = lerp(80, 10, f);
        botB = lerp(30, 20, f);
      } else if (t < 0.7) {
        const f = (t - 0.5) / 0.2;
        topR = 5;
        topG = 5;
        topB = 15;
        botR = 10;
        botG = 10;
        botB = 20;
      } else if (t < 0.8) {
        const f = (t - 0.7) / 0.1;
        topR = lerp(5, 135, f);
        topG = lerp(5, 206, f);
        topB = lerp(15, 235, f);
        botR = lerp(10, 255, f);
        botG = lerp(10, 80, f);
        botB = lerp(20, 30, f);
      } else {
        const f = (t - 0.8) / 0.2;
        topR = lerp(135, 135, f);
        topG = lerp(206, 206, f);
        topB = lerp(235, 235, f);
        botR = lerp(255, 176, f);
        botG = lerp(80, 226, f);
        botB = lerp(30, 255, f);
      }
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgb(${Math.round(topR)},${Math.round(topG)},${Math.round(topB)})`);
      grad.addColorStop(1, `rgb(${Math.round(botR)},${Math.round(botG)},${Math.round(botB)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      const isNight = t > 0.28 && t < 0.72;
      if (isNight) {
        const sa = Math.min(1, Math.min(t - 0.28, 0.72 - t) / 0.05);
        for (const s of this.stars) {
          ctx.globalAlpha = sa * s.bri;
          ctx.fillStyle = "#FFF";
          ctx.fillRect(s.x * W, s.y * H, s.size, s.size);
        }
        ctx.globalAlpha = 1;
      }
      const angle = (t - 0.25) * Math.PI * 2;
      const arcR = Math.min(W, H) * 0.4;
      const sunX = W / 2 + Math.sin(angle) * arcR;
      const sunY = H * 0.6 - Math.cos(angle) * arcR * 0.5;
      if (sunY < H + 60) {
        const isDay2 = t < 0.25 || t > 0.75;
        if (isDay2 || t > 0.18 && t < 0.35 || t > 0.65 && t < 0.82) {
          ctx.beginPath();
          ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
          ctx.fillStyle = "#FFE54A";
          ctx.fill();
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 2;
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
            ctx.beginPath();
            ctx.moveTo(sunX + Math.cos(a) * 24, sunY + Math.sin(a) * 24);
            ctx.lineTo(sunX + Math.cos(a) * 34, sunY + Math.sin(a) * 34);
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
          ctx.fillStyle = "#E8E8E8";
          ctx.fill();
          ctx.fillStyle = "#CCC";
          ctx.beginPath();
          ctx.arc(sunX + 5, sunY - 4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sunX - 6, sunY + 3, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sunX + 2, sunY + 6, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    _drawPlayer(ctx) {
      const p = this.player;
      const sp = this.worldToScreen(p.x, p.y);
      const bs = this.blockSize;
      const sw = p.width * bs;
      const sh = p.height * bs;
      const swing = Math.sin(p.walkCycle) * 0.4;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y + sh + 2, sw * 0.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(sp.x, sp.y);
      if (p.facingLeft) ctx.scale(-1, 1);
      const drawRect = (lx, ly, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(lx - sw / 2, ly, w, h);
      };
      ctx.save();
      ctx.translate(-sw * 0.14, sh * 0.64);
      ctx.rotate(-swing);
      ctx.fillStyle = "#3C44AA";
      ctx.fillRect(0, 0, sw * 0.36, sh * 0.36);
      ctx.fillStyle = "#2C3490";
      ctx.fillRect(0, sh * 0.28, sw * 0.36, sh * 0.08);
      ctx.restore();
      ctx.save();
      ctx.translate(sw * 0.14 - sw * 0.36, sh * 0.64);
      ctx.rotate(swing);
      ctx.fillStyle = "#3C44AA";
      ctx.fillRect(0, 0, sw * 0.36, sh * 0.36);
      ctx.fillStyle = "#2C3490";
      ctx.fillRect(0, sh * 0.28, sw * 0.36, sh * 0.08);
      ctx.restore();
      ctx.fillStyle = "#3C44AA";
      ctx.fillRect(-sw * 0.42, sh * 0.32, sw * 0.84, sh * 0.32);
      ctx.fillStyle = "#8B8BCC";
      ctx.fillRect(-sw * 0.28, sh * 0.38, sw * 0.56, sh * 0.06);
      ctx.fillStyle = "#5555BB";
      ctx.fillRect(-sw * 0.42, sh * 0.32, sw * 0.84, sh * 0.05);
      ctx.save();
      ctx.translate(-sw * 0.42 - sw * 0.04, sh * 0.32);
      ctx.rotate(-swing * 0.8);
      ctx.fillStyle = "#C68642";
      ctx.fillRect(0, 0, sw * 0.22, sh * 0.32);
      ctx.restore();
      ctx.save();
      ctx.translate(sw * 0.42 - sw * 0.04, sh * 0.32);
      ctx.rotate(swing * 0.8);
      ctx.fillStyle = "#C68642";
      ctx.fillRect(0, 0, sw * 0.22, sh * 0.32);
      const activeItem = p.inventory.getActiveItem();
      if (activeItem && activeItem.id > 0) {
        ctx.save();
        ctx.translate(sw * 0.05, sh * 0.2);
        ctx.rotate(0.4);
        const ibs = Math.max(12, bs * 0.5);
        drawBlock(ctx, activeItem.id, 0, 0, ibs, 0);
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = "#C68642";
      ctx.fillRect(-sw * 0.42, 0, sw * 0.84, sh * 0.33);
      ctx.fillStyle = "#59301A";
      ctx.fillRect(-sw * 0.42, 0, sw * 0.84, sh * 0.07);
      ctx.fillRect(-sw * 0.42, 0, sw * 0.12, sh * 0.17);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-sw * 0.2, sh * 0.09, sw * 0.22, sh * 0.11);
      ctx.fillRect(sw * 0.14 - sw * 0.22, sh * 0.09, sw * 0.22, sh * 0.11);
      ctx.fillStyle = "#4A2800";
      ctx.fillRect(-sw * 0.14, sh * 0.09, sw * 0.11, sh * 0.11);
      ctx.fillRect(sw * 0.14 - sw * 0.11, sh * 0.09, sw * 0.11, sh * 0.11);
      ctx.fillStyle = "#A05530";
      ctx.fillRect(-sw * 0.09, sh * 0.18, sw * 0.18, sh * 0.05);
      ctx.fillStyle = "#7A3820";
      ctx.fillRect(-sw * 0.25, sh * 0.24, sw * 0.5, sh * 0.04);
      ctx.restore();
      if (p.inWater) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#4090FF";
        ctx.fillRect(sp.x - sw / 2, sp.y, sw, sh);
        ctx.globalAlpha = 1;
      }
    }
    _drawCracks(ctx, sx, sy, bs, progress) {
      const stage = Math.min(5, Math.floor(progress * 6));
      const pattern = CRACK_PATTERNS[stage];
      const s = bs / 16;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      for (const [x, y, w, h] of pattern) {
        ctx.fillRect(sx + x * s, sy + y * s, w * s, h * s);
      }
    }
    _drawLighting(ctx, x1, y1, x2, y2, timeOfDay) {
      const bs = this.blockSize;
      let nightFactor = 0;
      if (timeOfDay >= 0.22 && timeOfDay <= 0.28) nightFactor = (timeOfDay - 0.22) / 0.06;
      else if (timeOfDay > 0.28 && timeOfDay < 0.72) nightFactor = 1;
      else if (timeOfDay >= 0.72 && timeOfDay <= 0.78) nightFactor = 1 - (timeOfDay - 0.72) / 0.06;
      if (nightFactor < 0.01) return;
      const maxAlpha = 0.88;
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          const light = this.world.getLight(x, y);
          const darkness = nightFactor * maxAlpha * (1 - light / 15);
          if (darkness < 0.02) continue;
          const sp = this.worldToScreen(x, y);
          ctx.fillStyle = `rgba(0,0,0,${darkness.toFixed(2)})`;
          ctx.fillRect(sp.x, sp.y, bs + 1, bs + 1);
        }
      }
    }
    _tickParticles(ctx, dt) {
      const alive = [];
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 25 * dt;
        p.life -= dt;
        if (p.life > 0) {
          const sp = this.worldToScreen(p.x, p.y);
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.fillStyle = p.color;
          ctx.fillRect(sp.x, sp.y, p.size, p.size);
          alive.push(p);
        } else {
          this._particlePool.push(p);
        }
      }
      ctx.globalAlpha = 1;
      this.particles = alive;
    }
  };

  // ui.js
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
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
  var SLOT_SIZE = 44;
  var SLOT_GAP = 4;
  var HOTBAR_SLOTS = 9;
  var CREATIVE_BLOCKS = [
    BLOCK.GRASS,
    BLOCK.DIRT,
    BLOCK.STONE,
    BLOCK.SAND,
    BLOCK.GRAVEL,
    BLOCK.WOOD,
    BLOCK.LEAVES,
    BLOCK.PLANKS,
    BLOCK.WATER,
    BLOCK.GLASS,
    BLOCK.SNOW,
    BLOCK.ICE,
    BLOCK.COAL_ORE,
    BLOCK.IRON_ORE,
    BLOCK.GOLD_ORE,
    BLOCK.DIAMOND_ORE,
    BLOCK.BEDROCK,
    BLOCK.CRAFTING_TABLE,
    BLOCK.CHEST,
    BLOCK.TORCH
  ];
  var UI = class {
    constructor(canvas, inventory, player) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.inventory = inventory;
      this.player = player;
      this.isInventoryOpen = false;
      this.isCraftingTableOpen = false;
      this.isCreativePaletteOpen = false;
      this.isEnvSelectorOpen = false;
      this.onEnvironmentChange = null;
      this.heldItem = null;
      this.heldFrom = null;
      this.mouseX = 0;
      this.mouseY = 0;
      this.tooltipText = "";
      this.tooltipX = 0;
      this.tooltipY = 0;
    }
    setMouse(x, y) {
      this.mouseX = x;
      this.mouseY = y;
    }
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
      this.tooltipText = "";
      const cx = W / 2, cy = H / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();
      ctx.shadowBlur = 0;
      this._drawHotbar(ctx, W, H);
      this._drawHealthHunger(ctx, W, H);
      const debugH = this.player.creativeMode ? 72 : 56;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(4, 4, 220, debugH);
      ctx.fillStyle = "#FFF";
      ctx.font = "12px monospace";
      ctx.fillText(`X: ${this.player.x.toFixed(1)}  Y: ${this.player.y.toFixed(1)}`, 10, 20);
      ctx.fillText(`FPS: ${fps}`, 10, 36);
      const tod = timeOfDay < 0.25 || timeOfDay > 0.75 ? "Day" : timeOfDay > 0.3 && timeOfDay < 0.7 ? "Night" : "Dusk/Dawn";
      ctx.fillText(`Time: ${tod}`, 10, 52);
      if (this.player.creativeMode) {
        ctx.fillStyle = "#7AFF4A";
        ctx.fillText(this.player.flying ? "\u2726 CREATIVE \xB7 FLYING" : "\u2726 CREATIVE MODE", 10, 68);
      }
      if (this.isInventoryOpen) {
        this._drawInventory(ctx, W, H);
      }
      if (this.isCreativePaletteOpen) {
        this._drawCreativePalette(ctx, W, H);
      }
      if (this.isEnvSelectorOpen) {
        this._drawEnvSelector(ctx, W, H);
      }
      if (this.heldItem) {
        this._drawSlotItem(ctx, this.heldItem, this.mouseX - SLOT_SIZE / 2, this.mouseY - SLOT_SIZE / 2, SLOT_SIZE, false);
      }
      if (this.tooltipText) {
        ctx.font = "13px monospace";
        const tw = ctx.measureText(this.tooltipText).width + 12;
        const tx = Math.min(this.tooltipX, W - tw - 4);
        const ty = Math.max(20, this.tooltipY - 24);
        ctx.fillStyle = "rgba(20,10,30,0.88)";
        ctx.fillRect(tx, ty, tw, 20);
        ctx.strokeStyle = "#8B5FBF";
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, tw, 20);
        ctx.fillStyle = "#FFF";
        ctx.fillText(this.tooltipText, tx + 6, ty + 14);
      }
    }
    _drawHotbar(ctx, W, H) {
      const inv = this.inventory;
      const totalW = HOTBAR_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
      const startX = (W - totalW) / 2;
      const startY = H - SLOT_SIZE - 10;
      ctx.fillStyle = "rgba(80,80,80,0.85)";
      ctx.strokeStyle = "#373737";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(startX - 6, startY - 4, totalW + 12, SLOT_SIZE + 8, 4);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < HOTBAR_SLOTS; i++) {
        const sx = startX + i * (SLOT_SIZE + SLOT_GAP);
        const sy = startY;
        const isActive = i === inv.selectedSlot;
        ctx.fillStyle = isActive ? "rgba(220,220,220,0.3)" : "rgba(40,40,40,0.7)";
        ctx.strokeStyle = isActive ? "#FFFFFF" : "#555";
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 2);
        ctx.fill();
        ctx.stroke();
        const slot = inv.getHotbarSlot(i);
        if (slot) {
          this._drawSlotItem(ctx, slot, sx, sy, SLOT_SIZE, true);
          if (this.mouseX >= sx && this.mouseX < sx + SLOT_SIZE && this.mouseY >= sy && this.mouseY < sy + SLOT_SIZE) {
            this.tooltipText = getItemName(slot.id);
            this.tooltipX = sx;
            this.tooltipY = sy;
          }
        }
        ctx.fillStyle = isActive ? "#FFF" : "#AAA";
        ctx.font = "10px monospace";
        ctx.fillText(`${i + 1}`, sx + 3, sy + 12);
      }
    }
    _drawHealthHunger(ctx, W, H) {
      const startY = H - SLOT_SIZE - 10 - 28;
      const totalW = HOTBAR_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
      const startX = (W - totalW) / 2;
      const maxHearts = 10;
      for (let i = 0; i < maxHearts; i++) {
        const hx = startX + i * 18;
        const filled = this.player.health / this.player.maxHealth * maxHearts;
        const isFull = i < Math.floor(filled);
        const isHalf = !isFull && i < filled;
        this._drawHeart(ctx, hx, startY, isFull ? 1 : isHalf ? 0.5 : 0);
      }
      const hungerStartX = startX + totalW - maxHearts * 18;
      for (let i = 0; i < maxHearts; i++) {
        const hx = hungerStartX + i * 18;
        const filled = this.player.hunger / this.player.maxHunger * maxHearts;
        const isFull = i < Math.floor(filled);
        const isHalf = !isFull && i < filled;
        this._drawHunger(ctx, hx, startY, isFull ? 1 : isHalf ? 0.5 : 0);
      }
    }
    _drawHeart(ctx, x, y, fill) {
      const heartPixels = [
        [1, 0, 3, 2],
        [5, 0, 3, 2],
        // top bumps
        [0, 1, 8, 5],
        // main body
        [1, 5, 6, 1],
        [2, 6, 4, 1],
        [3, 7, 2, 1]
        // bottom point
      ];
      const emptyColor = "#373737";
      const fillColor = "#E31C1C";
      const halfColor = "#E31C1C";
      const s = 2;
      ctx.fillStyle = emptyColor;
      for (const [hx, hy, hw, hh] of heartPixels) {
        ctx.fillRect(x + hx * s, y + hy * s, hw * s, hh * s);
      }
      if (fill > 0) {
        ctx.fillStyle = fill >= 1 ? fillColor : halfColor;
        const clipW = fill >= 1 ? 16 : 8;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, clipW, 16);
        ctx.clip();
        for (const [hx, hy, hw, hh] of heartPixels) {
          ctx.fillRect(x + hx * s, y + hy * s, hw * s, hh * s);
        }
        ctx.restore();
      }
    }
    _drawHunger(ctx, x, y, fill) {
      const emptyColor = "#373737";
      const fullColor = "#C87137";
      ctx.fillStyle = fill > 0 ? fullColor : emptyColor;
      ctx.beginPath();
      ctx.ellipse(x + 6, y + 4, 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fill > 0 ? "#A05A2A" : "#222";
      ctx.fillRect(x + 3, y + 6, 2, 8);
      if (fill < 1 && fill > 0) {
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
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.font = "bold 11px monospace";
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
      const px2 = (W - panelW) / 2;
      const py = (H - panelH) / 2;
      ctx.fillStyle = "rgba(30,30,30,0.95)";
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px2, py, panelW, panelH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 16px monospace";
      ctx.fillText(is3x3 ? "Crafting Table" : "Inventory", px2 + 16, py + 26);
      const craftStartX = px2 + 16;
      const craftStartY = py + 36;
      const craftGrid = is3x3 ? this.inventory.craftGrid3 : this.inventory.craftGrid2;
      for (let i = 0; i < gridSize * gridSize; i++) {
        const gx = craftStartX + i % gridSize * (SLOT_SIZE + SLOT_GAP);
        const gy = craftStartY + Math.floor(i / gridSize) * (SLOT_SIZE + SLOT_GAP);
        this._drawSlot(ctx, gx, gy, craftGrid[i], "craft", i, is3x3);
      }
      const arrowX = craftStartX + craftW + 8;
      const arrowY = craftStartY + gridSize * (SLOT_SIZE + SLOT_GAP) / 2 - SLOT_SIZE / 2;
      ctx.fillStyle = "#AAA";
      ctx.font = "24px sans-serif";
      ctx.fillText("\u2192", arrowX, arrowY + SLOT_SIZE * 0.65);
      const outX = arrowX + 36;
      const outY = arrowY;
      const craftOutput = this.inventory.computeCraftOutput(is3x3);
      this._drawSlot(ctx, outX, outY, craftOutput, "output", 0, is3x3, true);
      const mainStartY = craftStartY + gridSize * (SLOT_SIZE + SLOT_GAP) + 16;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
          const si = 9 + row * 9 + col;
          const gx = px2 + 16 + col * (SLOT_SIZE + SLOT_GAP);
          const gy = mainStartY + row * (SLOT_SIZE + SLOT_GAP);
          this._drawSlot(ctx, gx, gy, this.inventory.slots[si], "main", si, is3x3);
        }
      }
      const hotbarY = mainStartY + 3 * (SLOT_SIZE + SLOT_GAP) + 8;
      for (let col = 0; col < 9; col++) {
        const gx = px2 + 16 + col * (SLOT_SIZE + SLOT_GAP);
        this._drawSlot(ctx, gx, hotbarY, this.inventory.slots[col], "main", col, is3x3);
      }
      ctx.fillStyle = "#888";
      ctx.font = "11px monospace";
      ctx.fillText("[E] Close", px2 + panelW - 70, py + panelH - 8);
    }
    _drawSlot(ctx, sx, sy, item, type, index, is3x3, isOutput = false) {
      const hover = this.mouseX >= sx && this.mouseX < sx + SLOT_SIZE && this.mouseY >= sy && this.mouseY < sy + SLOT_SIZE;
      ctx.fillStyle = isOutput ? "rgba(60,30,60,0.6)" : "rgba(40,40,40,0.7)";
      ctx.strokeStyle = hover ? "#FFD700" : "#555";
      ctx.lineWidth = hover ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 2);
      ctx.fill();
      ctx.stroke();
      if (item) {
        this._drawSlotItem(ctx, item, sx, sy, SLOT_SIZE, true);
        if (hover) {
          this.tooltipText = getItemName(item.id);
          this.tooltipX = sx;
          this.tooltipY = sy;
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
      const px2 = (W - panelW) / 2;
      const py = (H - panelH) / 2;
      const craftStartX = px2 + 16;
      const craftStartY = py + 36;
      const craftGrid = is3x3 ? this.inventory.craftGrid3 : this.inventory.craftGrid2;
      for (let i = 0; i < gridSize * gridSize; i++) {
        const gx = craftStartX + i % gridSize * (SLOT_SIZE + SLOT_GAP);
        const gy = craftStartY + Math.floor(i / gridSize) * (SLOT_SIZE + SLOT_GAP);
        if (screenX >= gx && screenX < gx + SLOT_SIZE && screenY >= gy && screenY < gy + SLOT_SIZE) {
          this._swapSlot(craftGrid, i, button);
          return true;
        }
      }
      const arrowX = craftStartX + craftW + 8;
      const arrowY = craftStartY + gridSize * (SLOT_SIZE + SLOT_GAP) / 2 - SLOT_SIZE / 2;
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
      const mainStartY = craftStartY + gridSize * (SLOT_SIZE + SLOT_GAP) + 16;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
          const si = 9 + row * 9 + col;
          const gx = px2 + 16 + col * (SLOT_SIZE + SLOT_GAP);
          const gy = mainStartY + row * (SLOT_SIZE + SLOT_GAP);
          if (screenX >= gx && screenX < gx + SLOT_SIZE && screenY >= gy && screenY < gy + SLOT_SIZE) {
            this._swapSlot(this.inventory.slots, si, button);
            return true;
          }
        }
      }
      const hotbarY = mainStartY + 3 * (SLOT_SIZE + SLOT_GAP) + 8;
      for (let col = 0; col < 9; col++) {
        const gx = px2 + 16 + col * (SLOT_SIZE + SLOT_GAP);
        if (screenX >= gx && screenX < gx + SLOT_SIZE && screenY >= hotbarY && screenY < hotbarY + SLOT_SIZE) {
          this._swapSlot(this.inventory.slots, col, button);
          return true;
        }
      }
      if (screenX < px2 || screenX > px2 + panelW || screenY < py || screenY > py + panelH) {
      }
      return false;
    }
    _swapSlot(arr, index, button) {
      if (button === 2 && !this.heldItem && arr[index]) {
        const slot = arr[index];
        const half = Math.ceil(slot.count / 2);
        this.heldItem = new ItemStack(slot.id, half);
        slot.count -= half;
        if (slot.count <= 0) arr[index] = null;
        return;
      }
      if (button === 2 && this.heldItem && arr[index] === null) {
        arr[index] = new ItemStack(this.heldItem.id, 1);
        this.heldItem.count--;
        if (this.heldItem.count <= 0) this.heldItem = null;
        return;
      }
      if (button === 2 && this.heldItem && arr[index] && arr[index].id === this.heldItem.id) {
        if (arr[index].count < 64) {
          arr[index].count++;
          this.heldItem.count--;
          if (this.heldItem.count <= 0) this.heldItem = null;
        }
        return;
      }
      const tmp = arr[index] ? arr[index].clone() : null;
      arr[index] = this.heldItem ? this.heldItem.clone() : null;
      this.heldItem = tmp;
    }
    handleKeyDown(e) {
      const key = e.key;
      if (key >= "1" && key <= "9") {
        this.inventory.selectedSlot = parseInt(key) - 1;
      }
      if (e.code === "KeyE") this.toggleInventory();
    }
    handleScroll(delta) {
      if (this.isInventoryOpen) return;
      this.inventory.selectedSlot = (this.inventory.selectedSlot + (delta > 0 ? 1 : -1) + 9) % 9;
    }
  };

  // entities.js
  var GRAVITY2 = 28;
  var MAX_FALL2 = 40;
  var Entity = class {
    constructor(world, x, y) {
      this.world = world;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.width = 0.8;
      this.height = 1.8;
      this.health = 10;
      this.maxHealth = 10;
      this.onGround = false;
      this.alive = true;
      this.facingLeft = false;
      this.walkCycle = 0;
    }
    isSolid(tx, ty) {
      const b = this.world.getBlock(tx, ty);
      return BLOCK_DATA[b] ? BLOCK_DATA[b].solid : false;
    }
    collidesAt(px2, py) {
      const bx1 = Math.floor(px2 - this.width / 2);
      const bx2 = Math.floor(px2 + this.width / 2 - 1e-3);
      const by1 = Math.floor(py);
      const by2 = Math.floor(py + this.height - 1e-3);
      for (let ty = by1; ty <= by2; ty++) {
        for (let tx = bx1; tx <= bx2; tx++) {
          if (this.isSolid(tx, ty)) return true;
        }
      }
      return false;
    }
    physicsUpdate(dt) {
      this.vy += GRAVITY2 * dt;
      this.vy = Math.min(this.vy, MAX_FALL2);
      const nx = this.x + this.vx * dt;
      if (!this.collidesAt(nx, this.y)) this.x = nx;
      else this.vx *= -1;
      const ny = this.y + this.vy * dt;
      this.onGround = false;
      if (!this.collidesAt(this.x, ny)) {
        this.y = ny;
      } else {
        if (this.vy > 0) {
          this.y = Math.floor(this.y + this.height) - this.height;
          this.onGround = true;
        }
        this.vy = 0;
      }
      this.x = Math.max(0.5, Math.min(WORLD_WIDTH - 0.5, this.x));
      this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.y));
    }
    takeDamage(amount) {
      this.health -= amount;
      if (this.health <= 0) this.alive = false;
    }
    distanceTo(player) {
      return Math.hypot(this.x - player.x, this.y - player.y);
    }
    overlapsPlayer(player) {
      const ex1 = this.x - this.width / 2, ex2 = this.x + this.width / 2;
      const ey1 = this.y, ey2 = this.y + this.height;
      const px1 = player.x - player.width / 2, px2 = player.x + player.width / 2;
      const py1 = player.y, py2 = player.y + player.height;
      return ex1 < px2 && ex2 > px1 && ey1 < py2 && ey2 > py1;
    }
  };
  var Zombie = class extends Entity {
    constructor(world, x, y) {
      super(world, x, y);
      this.health = 20;
      this.maxHealth = 20;
      this.speed = 2;
      this._attackTimer = 0;
      this._stateTimer = 0;
      this.state = "patrol";
      this.patrolDir = Math.random() > 0.5 ? 1 : -1;
    }
    update(dt, player, dayFactor) {
      this._attackTimer = Math.max(0, this._attackTimer - dt);
      this._stateTimer += dt;
      const dist = this.distanceTo(player);
      if (dayFactor > 0.6 && this.world.getLight(Math.floor(this.x), Math.floor(this.y)) > 11) {
        this.takeDamage(dt * 2);
      }
      if (dist < 20) {
        this.state = "chase";
      } else if (dist > 25) {
        this.state = "patrol";
      }
      if (this.state === "chase") {
        const dir = player.x > this.x ? 1 : -1;
        this.vx = dir * this.speed;
        this.facingLeft = dir < 0;
        if (this.onGround && this.vx !== 0) {
          const nextX = this.x + dir * 0.6;
          if (this.isSolid(Math.floor(nextX), Math.floor(this.y + this.height - 0.5))) {
            this.vy = -8;
          }
        }
        if (dist < 1.5 && this._attackTimer <= 0) {
          player.takeDamage(3);
          this._attackTimer = 1.5;
        }
      } else {
        if (this._stateTimer > 3) {
          this._stateTimer = 0;
          this.patrolDir *= -1;
        }
        this.vx = this.patrolDir * 1.5;
        this.facingLeft = this.patrolDir < 0;
      }
      if (this.isMoving) this.walkCycle += dt * 5;
      this.isMoving = Math.abs(this.vx) > 0.1;
      this.physicsUpdate(dt);
    }
    render(ctx, screenX, screenY, blockSize) {
      const bs = blockSize;
      const s = bs / 16;
      const w = bs * 0.8;
      const h = bs * 1.8;
      const sx = screenX - w / 2;
      const sy = screenY - h;
      if (this.facingLeft) {
        ctx.save();
        ctx.translate(screenX, sy);
        ctx.scale(-1, 1);
        ctx.translate(-screenX, -sy);
      }
      const swing = Math.sin(this.walkCycle) * 0.3;
      ctx.fillStyle = "#2F5B3F";
      ctx.save();
      ctx.translate(sx + w * 0.15, sy + h * 0.7);
      ctx.rotate(-swing);
      ctx.fillRect(0, 0, w * 0.35, h * 0.3);
      ctx.restore();
      ctx.save();
      ctx.translate(sx + w * 0.5, sy + h * 0.7);
      ctx.rotate(swing);
      ctx.fillRect(0, 0, w * 0.35, h * 0.3);
      ctx.restore();
      ctx.fillStyle = "#3E8C4A";
      ctx.fillRect(sx + w * 0.1, sy + h * 0.35, w * 0.8, h * 0.35);
      ctx.fillStyle = "#2F6E3A";
      ctx.fillRect(sx + w * 0.2, sy + h * 0.4, w * 0.6, 2 * s);
      ctx.fillStyle = "#3E8C4A";
      ctx.save();
      ctx.translate(sx, sy + h * 0.35);
      ctx.rotate(-0.5);
      ctx.fillRect(-w * 0.25, 0, w * 0.25, h * 0.3);
      ctx.restore();
      ctx.save();
      ctx.translate(sx + w, sy + h * 0.35);
      ctx.rotate(0.5);
      ctx.fillRect(0, 0, w * 0.25, h * 0.3);
      ctx.restore();
      ctx.fillStyle = "#5E9E5E";
      ctx.fillRect(sx + w * 0.15, sy, w * 0.7, h * 0.35);
      ctx.fillStyle = "#FF2020";
      ctx.fillRect(sx + w * 0.25, sy + h * 0.1, w * 0.15, h * 0.08);
      ctx.fillRect(sx + w * 0.6, sy + h * 0.1, w * 0.15, h * 0.08);
      ctx.fillStyle = "#204020";
      ctx.fillRect(sx + w * 0.3, sy + h * 0.22, w * 0.4, h * 0.05);
      if (this.facingLeft) ctx.restore();
      if (this.health < this.maxHealth) {
        ctx.fillStyle = "#400";
        ctx.fillRect(screenX - 16, sy - 6, 32, 4);
        ctx.fillStyle = "#0F0";
        ctx.fillRect(screenX - 16, sy - 6, 32 * (this.health / this.maxHealth), 4);
      }
    }
  };
  var Creeper = class extends Entity {
    constructor(world, x, y) {
      super(world, x, y);
      this.health = 20;
      this.maxHealth = 20;
      this.speed = 2.5;
      this.width = 0.6;
      this.height = 1.7;
      this.state = "patrol";
      this._explodeTimer = 0;
      this._isExploding = false;
      this._stateTimer = 0;
      this.patrolDir = Math.random() > 0.5 ? 1 : -1;
    }
    update(dt, player, _dayFactor) {
      this._stateTimer += dt;
      const dist = this.distanceTo(player);
      if (dist < 4) {
        this.state = "exploding";
      } else if (dist < 16) {
        this.state = "chase";
      } else {
        this.state = "patrol";
      }
      if (this.state === "exploding") {
        this._explodeTimer += dt;
        this.vx = 0;
        if (this._explodeTimer > 1.5) {
          this._explode(player);
          return;
        }
      } else if (this.state === "chase") {
        this._explodeTimer = Math.max(0, this._explodeTimer - dt * 2);
        const dir = player.x > this.x ? 1 : -1;
        this.vx = dir * this.speed;
        this.facingLeft = dir < 0;
        if (this.onGround) {
          const nextX = this.x + dir * 0.6;
          if (this.isSolid(Math.floor(nextX), Math.floor(this.y + this.height - 0.5))) {
            this.vy = -8;
          }
        }
      } else {
        this._explodeTimer = 0;
        if (this._stateTimer > 2.5) {
          this._stateTimer = 0;
          this.patrolDir *= -1;
        }
        this.vx = this.patrolDir * 1.5;
        this.facingLeft = this.patrolDir < 0;
      }
      this.physicsUpdate(dt);
    }
    _explode(player) {
      const bx = Math.floor(this.x);
      const by = Math.floor(this.y);
      const radius = 3;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const b = this.world.getBlock(bx + dx, by + dy);
            if (b !== BLOCK.BEDROCK && b !== BLOCK.AIR) {
              this.world.setBlock(bx + dx, by + dy, BLOCK.AIR);
            }
          }
        }
      }
      const dist = this.distanceTo(player);
      if (dist < radius + 2) player.takeDamage(Math.floor((1 - dist / (radius + 2)) * 12));
      this.alive = false;
    }
    render(ctx, screenX, screenY, blockSize) {
      const bs = blockSize;
      const s = bs / 16;
      const w = bs * 0.6;
      const h = bs * 1.7;
      const sx = screenX - w / 2;
      const sy = screenY - h;
      if (this._explodeTimer > 0 && Math.floor(this._explodeTimer * 8) % 2 === 0) {
        ctx.globalAlpha = 0.3;
      }
      ctx.fillStyle = "#3A7A3A";
      ctx.fillRect(sx + w * 0.05, sy + h * 0.68, w * 0.4, h * 0.32);
      ctx.fillRect(sx + w * 0.55, sy + h * 0.68, w * 0.4, h * 0.32);
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(sx, sy + h * 0.35, w, h * 0.33);
      ctx.fillStyle = "#5DBF5D";
      ctx.fillRect(sx + w * 0.05, sy, w * 0.9, h * 0.35);
      ctx.fillStyle = "#1A5C1A";
      ctx.fillRect(sx + w * 0.15, sy + h * 0.06, w * 0.2, h * 0.1);
      ctx.fillRect(sx + w * 0.65, sy + h * 0.06, w * 0.2, h * 0.1);
      ctx.fillRect(sx + w * 0.35, sy + h * 0.17, w * 0.3, h * 0.08);
      ctx.fillRect(sx + w * 0.15, sy + h * 0.22, w * 0.2, h * 0.08);
      ctx.fillRect(sx + w * 0.65, sy + h * 0.22, w * 0.2, h * 0.08);
      ctx.globalAlpha = 1;
      if (this.health < this.maxHealth) {
        ctx.fillStyle = "#400";
        ctx.fillRect(screenX - 16, sy - 6, 32, 4);
        ctx.fillStyle = "#0F0";
        ctx.fillRect(screenX - 16, sy - 6, 32 * (this.health / this.maxHealth), 4);
      }
    }
  };
  var Pig = class extends Entity {
    constructor(world, x, y) {
      super(world, x, y);
      this.health = 10;
      this.maxHealth = 10;
      this.width = 0.9;
      this.height = 0.9;
      this.speed = 1.5;
      this._stateTimer = 0;
      this.patrolDir = Math.random() > 0.5 ? 1 : -1;
    }
    update(dt, _player, _dayFactor) {
      this._stateTimer += dt;
      if (this._stateTimer > 2 + Math.random() * 3) {
        this._stateTimer = 0;
        if (Math.random() > 0.4) {
          this.patrolDir = Math.random() > 0.5 ? 1 : -1;
        } else {
          this.patrolDir = 0;
        }
      }
      this.vx = this.patrolDir * this.speed;
      if (this.patrolDir !== 0) this.facingLeft = this.patrolDir < 0;
      this.physicsUpdate(dt);
    }
    render(ctx, screenX, screenY, blockSize) {
      const bs = blockSize;
      const w = bs * 0.9;
      const h = bs * 0.9;
      const sx = screenX - w / 2;
      const sy = screenY - h;
      if (this.facingLeft) {
        ctx.save();
        ctx.translate(screenX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-screenX, 0);
      }
      ctx.fillStyle = "#F4A0B0";
      ctx.fillRect(sx, sy + h * 0.1, w, h * 0.7);
      ctx.fillStyle = "#F4A0B0";
      ctx.fillRect(sx + w * 0.6, sy, w * 0.5, h * 0.55);
      ctx.fillStyle = "#E08090";
      ctx.fillRect(sx + w * 0.95, sy + h * 0.25, w * 0.15, h * 0.2);
      ctx.fillStyle = "#222";
      ctx.fillRect(sx + w * 0.7, sy + h * 0.1, w * 0.08, h * 0.1);
      ctx.fillStyle = "#E090A0";
      ctx.fillRect(sx + w * 0.1, sy + h * 0.8, w * 0.2, h * 0.2);
      ctx.fillRect(sx + w * 0.7, sy + h * 0.8, w * 0.2, h * 0.2);
      ctx.fillRect(sx + w * 0.35, sy + h * 0.8, w * 0.15, h * 0.2);
      if (this.facingLeft) ctx.restore();
    }
  };
  var EntityManager = class {
    constructor(world) {
      this.world = world;
      this.entities = [];
      this._spawnTimer = 0;
    }
    spawnNaturally(player, timeOfDay) {
      this._spawnTimer = 0;
      const isNight = timeOfDay > 0.25 && timeOfDay < 0.75;
      const px2 = player.x, py = player.y;
      if (this.entities.length >= 30) return;
      if (!isNight && Math.random() < 0.3 && this.entities.filter((e) => e instanceof Pig).length < 8) {
        const ox = (Math.random() * 30 + 15) * (Math.random() > 0.5 ? 1 : -1);
        const sx = Math.floor(px2 + ox);
        const sy = this._findSurface(sx);
        if (sy > 0) this.entities.push(new Pig(this.world, sx + 0.5, sy));
      }
      if (isNight && Math.random() < 0.5) {
        const ox = (Math.random() * 40 + 20) * (Math.random() > 0.5 ? 1 : -1);
        const sx = Math.floor(px2 + ox);
        const sy = this._findSurface(sx);
        const light = this.world.getLight(sx, sy - 1);
        if (sy > 0 && light < 7) {
          this.entities.push(new Zombie(this.world, sx + 0.5, sy));
        }
      }
      if (isNight && Math.random() < 0.2) {
        const ox = (Math.random() * 50 + 25) * (Math.random() > 0.5 ? 1 : -1);
        const sx = Math.floor(px2 + ox);
        const sy = this._findSurface(sx);
        if (sy > 0) this.entities.push(new Creeper(this.world, sx + 0.5, sy));
      }
    }
    _findSurface(x) {
      if (x < 0 || x >= this.world.blocks.length) return -1;
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const b = this.world.getBlock(x, y);
        if (b !== BLOCK.AIR && b !== BLOCK.WATER && BLOCK_DATA[b]?.solid) {
          return y;
        }
      }
      return -1;
    }
    update(dt, player, timeOfDay) {
      const dayFactor = timeOfDay < 0.5 ? timeOfDay * 2 : (1 - timeOfDay) * 2;
      this._spawnTimer += dt;
      if (this._spawnTimer > 8) this.spawnNaturally(player, timeOfDay);
      const despawnDist = 80;
      this.entities = this.entities.filter((e) => {
        if (!e.alive) {
          if (e instanceof Pig) player.inventory.addItem(BLOCK.RAW_PORKCHOP, 1);
          return false;
        }
        if (Math.abs(e.x - player.x) > despawnDist) return false;
        return true;
      });
      for (const e of this.entities) {
        e.update(dt, player, dayFactor);
      }
    }
  };

  // game.js
  var STATE = { LOADING: 0, PLAYING: 1, PAUSED: 2, DEAD: 3 };
  var Game = class {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this._resizeCanvas();
      window.addEventListener("resize", () => this._resizeCanvas());
      this.state = STATE.LOADING;
      this.gameTime = 0;
      this.dayLength = 480;
      this.timeOfDay = 0;
      this.fpsCounter = 0;
      this.fpsTimer = 0;
      this.fps = 60;
      this.keys = {};
      this.mouse = { x: 0, y: 0, buttons: [false, false, false], justDown: [false, false, false], justUp: [false, false, false] };
      this._setupInput();
      this._startGeneration();
    }
    _resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    _setupInput() {
      window.addEventListener("keydown", (e) => {
        this.keys[e.code] = true;
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
        if (this.ui) this.ui.handleKeyDown(e);
        if (e.code === "Escape") this._handleEsc();
        if (e.code === "KeyF") this._toggleFullscreen();
        if (e.code === "KeyR" && this.state === STATE.DEAD) this._respawn();
        if (e.code === "Equal" && this.renderer) this.renderer.blockSize = Math.min(64, this.renderer.blockSize + 4);
        if (e.code === "Minus" && this.renderer) this.renderer.blockSize = Math.max(16, this.renderer.blockSize - 4);
      }, true);
      window.addEventListener("keyup", (e) => {
        this.keys[e.code] = false;
      }, true);
      this.canvas.addEventListener("mousemove", (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        if (this.ui) this.ui.setMouse(e.clientX, e.clientY);
      });
      this.canvas.addEventListener("mousedown", (e) => {
        this.mouse.buttons[e.button] = true;
        this.mouse.justDown[e.button] = true;
      });
      this.canvas.addEventListener("mouseup", (e) => {
        this.mouse.buttons[e.button] = false;
        this.mouse.justUp[e.button] = true;
      });
      this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      this.canvas.addEventListener("wheel", (e) => {
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
        document.documentElement.requestFullscreen().catch(() => {
        });
      } else {
        document.exitFullscreen().catch(() => {
        });
      }
    }
    // ─── World Generation ────────────────────────────────────────────────────────
    async _startGeneration() {
      const loadingEl = document.getElementById("loadingScreen");
      const progressEl = document.getElementById("progressFill");
      const statusEl = document.getElementById("loadingStatus");
      const seed = Math.floor(Math.random() * 999999);
      this.world = new World(seed);
      const gen = this.world.generateGenerator();
      let done = false;
      while (!done) {
        const result = gen.next();
        if (result.done) {
          done = true;
          break;
        }
        const pct = result.value;
        if (progressEl) progressEl.style.width = `${Math.round(pct * 100)}%`;
        if (statusEl) {
          if (pct < 0.1) statusEl.textContent = "Generating terrain\u2026";
          else if (pct < 0.35) statusEl.textContent = "Placing blocks\u2026";
          else if (pct < 0.5) statusEl.textContent = "Carving caves\u2026";
          else if (pct < 0.65) statusEl.textContent = "Placing ores\u2026";
          else if (pct < 0.75) statusEl.textContent = "Growing trees\u2026";
          else statusEl.textContent = "Computing lighting\u2026";
        }
        await new Promise((r) => setTimeout(r, 0));
      }
      this.inventory = new Inventory();
      this.inventory.addItem(BLOCK.WOODEN_PICKAXE, 1);
      this.inventory.addItem(BLOCK.TORCH, 10);
      this.inventory.addItem(BLOCK.PLANKS, 20);
      this.inventory.addItem(BLOCK.DIRT, 10);
      this.player = new Player(this.world, this.inventory);
      this.renderer = new Renderer(this.canvas, this.world, this.player);
      this.ui = new UI(this.canvas, this.inventory, this.player);
      this.entityManager = new EntityManager(this.world);
      this.renderer.camX = this.player.x;
      this.renderer.camY = this.player.y + this.player.height / 2;
      this._loadGame();
      if (loadingEl) {
        loadingEl.style.transition = "opacity 0.5s";
        loadingEl.style.opacity = "0";
        setTimeout(() => loadingEl.style.display = "none", 500);
      }
      this.state = STATE.PLAYING;
      this._startLoop();
    }
    // ─── Game Loop ───────────────────────────────────────────────────────────────
    _startLoop() {
      let lastTime = performance.now();
      this._saveTimer = 0;
      const loop = (now) => {
        const dt = Math.min((now - lastTime) / 1e3, 0.05);
        lastTime = now;
        this.fpsTimer += dt;
        this.fpsCounter++;
        if (this.fpsTimer >= 1) {
          this.fps = this.fpsCounter;
          this.fpsCounter = 0;
          this.fpsTimer = 0;
        }
        this._update(dt);
        this._render();
        this.mouse.justDown = [false, false, false];
        this.mouse.justUp = [false, false, false];
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    _update(dt) {
      if (this.state === STATE.LOADING || this.state === STATE.PAUSED) return;
      if (this.state === STATE.DEAD) return;
      this.gameTime += dt;
      this.timeOfDay = this.gameTime % this.dayLength / this.dayLength;
      this.renderer.updateCamera(dt);
      const input = {
        left: this.keys["KeyA"] || this.keys["ArrowLeft"],
        right: this.keys["KeyD"] || this.keys["ArrowRight"],
        jump: this.keys["Space"] || this.keys["KeyW"] || this.keys["ArrowUp"],
        sprint: this.keys["ShiftLeft"] || this.keys["ShiftRight"]
      };
      if (!this.ui.isInventoryOpen) {
        this.player.update(dt, input);
      }
      const worldMouse = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
      const targetBlock = this.player.getTargetBlock(worldMouse.x, worldMouse.y);
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
      if (this.player.miningBlock && this.player.miningProgress >= 1) {
        const { bx, by } = this.player.miningBlock;
        const bid = this.world.getBlock(bx, by);
        this.renderer.spawnParticles(bx, by, bid, 10);
      }
      if (this.mouse.justDown[2] && !this.ui.isInventoryOpen) {
        if (targetBlock) {
          const clickedBlock = this.world.getBlock(targetBlock.bx, targetBlock.by);
          if (clickedBlock === BLOCK.CRAFTING_TABLE) {
            this.ui.openCraftingTable();
          } else {
            const placeFace = this.player.getPlaceFace(worldMouse.x, worldMouse.y);
            if (placeFace && this.world.getBlock(placeFace.bx, placeFace.by) === BLOCK.AIR) {
              this.player.placeBlock(placeFace.bx, placeFace.by);
            }
          }
        } else {
          const placeFace = this.player.getPlaceFace(worldMouse.x, worldMouse.y);
          if (placeFace && this.world.getBlock(placeFace.bx, placeFace.by) === BLOCK.AIR) {
            this.player.placeBlock(placeFace.bx, placeFace.by);
          }
        }
      }
      if (this.mouse.justDown[0] && this.ui.isInventoryOpen) {
        this.ui.handleClick(this.mouse.x, this.mouse.y, 0);
      }
      if (this.mouse.justDown[2] && this.ui.isInventoryOpen) {
        this.ui.handleClick(this.mouse.x, this.mouse.y, 2);
      }
      this.entityManager.update(dt, this.player, this.timeOfDay);
      if (this.player.isDead()) {
        this.state = STATE.DEAD;
      }
      this._saveTimer += dt;
      if (this._saveTimer > 60) {
        this._saveTimer = 0;
        this._saveGame();
      }
    }
    _render() {
      const ctx = this.canvas.getContext("2d");
      const W = this.canvas.width, H = this.canvas.height;
      if (this.state === STATE.LOADING) {
        ctx.fillStyle = "#1A1A2E";
        ctx.fillRect(0, 0, W, H);
        return;
      }
      const worldMouse = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
      const targetBlock = this.state === STATE.PLAYING && !this.ui.isInventoryOpen ? this.player.getTargetBlock(worldMouse.x, worldMouse.y) : null;
      this.renderer.render(
        this.timeOfDay,
        this.gameTime,
        targetBlock,
        this.entityManager.entities
      );
      this.ui.render(this.timeOfDay, this.fps);
      if (this.state === STATE.PAUSED) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 40px monospace";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", W / 2, H / 2 - 40);
        ctx.font = "20px monospace";
        ctx.fillText("Press ESC to resume", W / 2, H / 2);
        ctx.fillText("[F] Toggle fullscreen", W / 2, H / 2 + 30);
        ctx.fillText("Saves automatically every minute", W / 2, H / 2 + 60);
        ctx.textAlign = "left";
      }
      if (this.state === STATE.DEAD) {
        ctx.fillStyle = "rgba(60,0,0,0.75)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#FF4444";
        ctx.font = "bold 48px monospace";
        ctx.textAlign = "center";
        ctx.fillText("YOU DIED!", W / 2, H / 2 - 40);
        ctx.fillStyle = "#FFF";
        ctx.font = "22px monospace";
        ctx.fillText("Press [R] to respawn", W / 2, H / 2 + 20);
        ctx.textAlign = "left";
      }
      if (this.gameTime < 30 && this.state === STATE.PLAYING) {
        const alpha = this.gameTime < 25 ? 0.85 : (30 - this.gameTime) / 5 * 0.85;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(W - 230, 10, 220, 160);
        ctx.fillStyle = "#FFF";
        ctx.font = "13px monospace";
        ctx.textAlign = "right";
        const hints = [
          "Controls:",
          "A/D or \u2190/\u2192 Move",
          "Space/W Jump",
          "Shift Sprint",
          "Left Click Mine",
          "Right Click Place",
          "1-9 Select item",
          "E Inventory",
          "Scroll wheel item",
          "+/- Zoom"
        ];
        hints.forEach((h, i) => {
          ctx.fillStyle = i === 0 ? "#FFD700" : "#FFF";
          ctx.fillText(h, W - 16, 28 + i * 15);
        });
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }
    }
    _respawn() {
      this.player.respawn();
      this.player.inventory = this.inventory;
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
          gameTime: this.gameTime
        };
        const buf = data.world.blocks;
        let binary = "";
        for (const b of buf) binary += String.fromCharCode(b);
        data.world.blocks = btoa(binary);
        localStorage.setItem("mc2d_save", JSON.stringify(data));
      } catch (e) {
        console.warn("Save failed:", e);
      }
    }
    _loadGame() {
      try {
        const raw = localStorage.getItem("mc2d_save");
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data.version || data.version < 2) {
          localStorage.removeItem("mc2d_save");
          return;
        }
        const binary = atob(data.world.blocks);
        data.world.blocks = Array.from(binary, (c) => c.charCodeAt(0));
        const loadedWorld = World.deserialize(data.world);
        this.world.blocks = loadedWorld.blocks;
        this.world.lightMap = loadedWorld.lightMap;
        this.world.heightMap = loadedWorld.heightMap;
        this.player.deserialize(data.player);
        const loadedInv = Inventory.deserialize(data.inventory);
        Object.assign(this.inventory, loadedInv);
        this.gameTime = data.gameTime || 0;
        for (let c = 0; c < Math.ceil(400 / 16); c++) {
          this.world.dirtyChunks.add(c);
        }
        console.log("Game loaded!");
      } catch (e) {
        console.warn("Load failed, starting fresh:", e);
      }
    }
  };
  window._game = new Game();
})();
