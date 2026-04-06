import { PerlinNoise } from './noise.js';
import { BLOCK, BLOCK_DATA } from './blocks.js';

export const WORLD_WIDTH  = 400;
export const WORLD_HEIGHT = 150;
export const CHUNK_SIZE   = 16;
export const SEA_LEVEL    = 90;
export const BEDROCK_START = 145;

// Biome IDs
const BIOME = { PLAINS: 0, FOREST: 1, DESERT: 2, SNOWY: 3 };

export class World {
  constructor(seed = Math.floor(Math.random() * 100000)) {
    this.seed = seed;
    this.noise = new PerlinNoise(seed);
    this.blocks = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
    this.lightMap = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
    this.heightMap = new Int16Array(WORLD_WIDTH);
    this.biomeMap = new Uint8Array(WORLD_WIDTH);
    this.dirtyChunks = new Set();
    for (let c = 0; c < Math.ceil(WORLD_WIDTH / CHUNK_SIZE); c++) {
      this.dirtyChunks.add(c);
    }
  }

  idx(x, y) { return y * WORLD_WIDTH + x; }

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
    // Update lighting in a local area
    this._updateLightArea(x - 15, y - 15, x + 15, y + 15);
  }

  getLight(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return 0;
    return this.lightMap[this.idx(x, y)];
  }

  isChunkDirty(chunkX) { return this.dirtyChunks.has(chunkX); }
  markChunkClean(chunkX) { this.dirtyChunks.delete(chunkX); }

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
      mixed:      { name: 'Mixed World',    desc: 'All biomes, caves, ores',       color: '#5D9E1F' },
      grasslands: { name: 'Grasslands',     desc: 'Rolling green hills',            color: '#7DB83A' },
      forest:     { name: 'Dense Forest',   desc: 'Thick trees everywhere',         color: '#2D7D27' },
      desert:     { name: 'Desert',         desc: 'Sand dunes, no water',           color: '#F0D87A' },
      snowy:      { name: 'Tundra',         desc: 'Snow-covered icy world',         color: '#E8EAEC' },
      ocean:      { name: 'Ocean World',    desc: 'Vast seas with islands',         color: '#2D5DA1' },
      caves:      { name: 'Cave World',     desc: 'Underground with huge caverns',  color: '#3B3B3B' },
      flat:       { name: 'Superflat',      desc: 'Perfectly flat grass world',     color: '#AC8A56' },
    };
  }

  // ─── World Generation ───────────────────────────────────────────────────────
  *generateGenerator(preset = 'mixed') {
    this.preset = preset;

    // ── Flat world (special case) ──────────────────────────────────────────
    if (preset === 'flat') {
      const flatSurf = 82;
      for (let x = 0; x < WORLD_WIDTH; x++) {
        this.heightMap[x] = flatSurf;
        this.biomeMap[x] = BIOME.PLAINS;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = BLOCK.AIR;
          if (y >= BEDROCK_START)  b = BLOCK.BEDROCK;
          else if (y > flatSurf + 3) b = BLOCK.STONE;
          else if (y > flatSurf)   b = BLOCK.DIRT;
          else if (y === flatSurf) b = BLOCK.GRASS;
          this.blocks[this.idx(x, y)] = b;
        }
        if (x % 40 === 0) yield 0.05 + (x / WORLD_WIDTH) * 0.85;
      }
      this._computeFullLighting();
      yield 1.0;
      return;
    }

    // ── Step 1: Heightmap + biomes ──────────────────────────────────────────
    for (let x = 0; x < WORLD_WIDTH; x++) {
      let surfY, biome;
      switch (preset) {
        case 'grasslands':
          surfY = Math.floor(78 + this.noise.octaveNoise(x * 0.012, 0, 3, 0.45, 2) * 12);
          biome = BIOME.PLAINS;
          break;
        case 'forest':
          surfY = Math.floor(74 + this.noise.octaveNoise(x * 0.018, 0, 5, 0.55, 2.1) * 18);
          biome = BIOME.FOREST;
          break;
        case 'desert':
          surfY = Math.floor(78 + this.noise.octaveNoise(x * 0.025, 0, 3, 0.4, 2) * 14);
          biome = BIOME.DESERT;
          break;
        case 'snowy':
          surfY = Math.floor(74 + this.noise.octaveNoise(x * 0.018, 0, 5, 0.55, 2.1) * 18);
          biome = BIOME.SNOWY;
          break;
        case 'ocean':
          surfY = Math.floor(95 + this.noise.octaveNoise(x * 0.015, 0, 4, 0.5, 2) * 10);
          biome = BIOME.PLAINS;
          break;
        case 'caves':
          surfY = Math.floor(20 + this.noise.octaveNoise(x * 0.02, 0, 3, 0.4, 2) * 5);
          biome = BIOME.PLAINS;
          break;
        default: // mixed
          surfY = Math.floor(72 + this.noise.octaveNoise(x * 0.018, 0, 5, 0.55, 2.1) * 22);
          const b = this.noise.noise1D(x * 0.004 + 500);
          if (b < -0.45)     biome = BIOME.DESERT;
          else if (b > 0.5)  biome = BIOME.SNOWY;
          else if (b > 0.15) biome = BIOME.FOREST;
          else               biome = BIOME.PLAINS;
      }
      this.heightMap[x] = surfY;
      this.biomeMap[x] = biome;
    }
    yield 0.05;

    // ── Step 2: Basic block fill ────────────────────────────────────────────
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const surf = this.heightMap[x];
      const biome = this.biomeMap[x];
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        let block = BLOCK.AIR;
        if (y >= BEDROCK_START) {
          block = BLOCK.BEDROCK;
        } else if (preset === 'caves' && y <= surf) {
          // Cave world: sealed stone cap
          block = y <= 5 ? BLOCK.BEDROCK : BLOCK.STONE;
        } else if (y >= surf + 5) {
          block = BLOCK.STONE;
        } else if (y >= surf + 1) {
          if (biome === BIOME.DESERT) block = BLOCK.SAND;
          else block = BLOCK.DIRT;
        } else if (y === surf) {
          if (preset === 'caves') block = BLOCK.STONE;
          else if (biome === BIOME.DESERT) block = BLOCK.SAND;
          else if (biome === BIOME.SNOWY)  block = BLOCK.SNOW;
          else block = BLOCK.GRASS;
        }
        this.blocks[this.idx(x, y)] = block;
      }
      if (x % 32 === 0) yield 0.05 + (x / WORLD_WIDTH) * 0.2;
    }
    yield 0.25;

    // ── Step 3: Water fill ──────────────────────────────────────────────────
    if (preset !== 'desert' && preset !== 'caves') {
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

    // ── Step 4: Caves ───────────────────────────────────────────────────────
    const caveThreshold = preset === 'caves' ? 0.025 : 0.04; // bigger caves for cave world
    const caveScale = preset === 'caves' ? 0.05 : 0.07;
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
      if (y % 20 === 0) yield 0.3 + (y / BEDROCK_START) * 0.15;
    }
    yield 0.45;

    // ── Step 5: Ores ────────────────────────────────────────────────────────
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const surf = this.heightMap[x];
      for (let y = surf + 5; y < BEDROCK_START - 5; y++) {
        if (this.blocks[this.idx(x, y)] !== BLOCK.STONE) continue;
        const r = this.noise.noise2D(x * 0.5 + 1000, y * 0.5 + 1000);
        const depth = y - surf;
        if (depth > 5  && r > 0.72) this.blocks[this.idx(x, y)] = BLOCK.COAL_ORE;
        else if (depth > 15 && r > 0.78) this.blocks[this.idx(x, y)] = BLOCK.IRON_ORE;
        else if (y > 100 && r > 0.84) this.blocks[this.idx(x, y)] = BLOCK.GOLD_ORE;
        else if (y > 130 && r > 0.90) this.blocks[this.idx(x, y)] = BLOCK.DIAMOND_ORE;
        const g = this.noise.noise2D(x * 0.3 + 2000, y * 0.3 + 2000);
        if (depth > 10 && g > 0.7) this.blocks[this.idx(x, y)] = BLOCK.GRAVEL;
      }
      if (x % 32 === 0) yield 0.45 + (x / WORLD_WIDTH) * 0.15;
    }
    yield 0.6;

    // ── Step 6: Trees ───────────────────────────────────────────────────────
    if (preset !== 'desert' && preset !== 'snowy' && preset !== 'caves') {
      const treeSpacing = preset === 'forest' ? 0.3 : (preset === 'grasslands' ? 0.65 : 0.55);
      for (let x = 3; x < WORLD_WIDTH - 3; x++) {
        const surf = this.heightMap[x];
        if (surf >= SEA_LEVEL) continue;
        if (this.blocks[this.idx(x, surf)] !== BLOCK.GRASS) continue;
        const treeNoise = this.noise.noise2D(x * 0.4 + 3000, 0);
        if (treeNoise > treeSpacing) {
          this._placeTree(x, surf);
          x += (preset === 'forest') ? 1 : 2;
        }
      }
    }
    yield 0.7;

    // ── Step 7: Desert cacti (placeholder with tall dirt) ──────────────────
    if (preset === 'desert') {
      for (let x = 5; x < WORLD_WIDTH - 5; x++) {
        const surf = this.heightMap[x];
        const n = this.noise.noise2D(x * 0.3 + 5000, 0);
        if (n > 0.75 && this.blocks[this.idx(x, surf)] === BLOCK.SAND) {
          // Sand dune bump
          const h = 1 + Math.floor(n * 3);
          for (let dy = 1; dy <= h; dy++) {
            if (surf - dy >= 0) this.blocks[this.idx(x, surf - dy)] = BLOCK.SAND;
          }
        }
      }
    }

    // ── Step 8: Lighting ────────────────────────────────────────────────────
    this._computeFullLighting();
    yield 1.0;
  }

  generate(preset = 'mixed') {
    const gen = this.generateGenerator(preset);
    let result;
    do { result = gen.next(); } while (!result.done);
  }

  findSpawnSurface(x) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const b = this.blocks[this.idx(x, y)];
      if (b !== BLOCK.AIR && b !== BLOCK.WATER && BLOCK_DATA[b]?.solid) return y;
    }
    return 80;
  }

  _placeTree(x, surfY) {
    const height = 4 + Math.floor(this.noise.noise2D(x * 2, 1000) * 2 + 2);
    for (let i = 1; i <= height; i++) {
      if (surfY - i >= 0) this.blocks[this.idx(x, surfY - i)] = BLOCK.WOOD;
    }
    // Leaves canopy
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

    // Sky light: flood fill downward
    const skyQueue = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        if (!this.isTransparent(x, y)) break;
        const i = this.idx(x, y);
        this.lightMap[i] = 15;
        skyQueue.push(x, y, 15);
      }
    }

    // BFS for sky light spread
    const sq = [];
    for (let i = 0; i < skyQueue.length; i += 3) {
      sq.push([skyQueue[i], skyQueue[i+1], skyQueue[i+2]]);
    }
    this._bfsLight(sq);

    // Torch light
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
      const neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
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
    x1 = Math.max(0, x1); y1 = Math.max(0, y1);
    x2 = Math.min(WORLD_WIDTH - 1, x2); y2 = Math.min(WORLD_HEIGHT - 1, y2);

    // Reset light in area
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        this.lightMap[this.idx(x, y)] = 0;
      }
    }

    // Re-propagate sky light from top of area
    const initial = [];
    for (let x = x1; x <= x2; x++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        if (!this.isTransparent(x, y)) break;
        const i = this.idx(x, y);
        this.lightMap[i] = 15;
        if (y >= y1 && y <= y2) initial.push([x, y, 15]);
      }
    }

    // Also add bright neighbors from outside the area as seeds
    for (let y = y1; y <= y2; y++) {
      for (const x of [x1 - 1, x2 + 1]) {
        if (x < 0 || x >= WORLD_WIDTH) continue;
        const light = this.lightMap[this.idx(x, y)];
        if (light > 1) initial.push([x, y, light]);
      }
    }

    // Torches in area
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
      blocks: Array.from(this.blocks),
    };
  }

  static deserialize(data) {
    const w = new World(data.seed);
    w.blocks = new Uint8Array(data.blocks);
    w._computeFullLighting();
    // Re-compute heightmap
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
}
