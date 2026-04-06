import { BLOCK, BLOCK_DATA, drawBlock, getCachedTexture } from './blocks.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './world.js';

export const BLOCK_SIZE = 32;

// Crack overlay patterns (6 stages, each entry = [x, y, w, h] in 16px space)
const CRACK_PATTERNS = [
  [[7,7,2,1],[6,8,1,1]],
  [[5,6,1,2],[8,6,2,1],[7,9,1,1],[6,10,2,1]],
  [[3,5,1,2],[5,5,3,1],[8,5,2,1],[7,7,2,1],[4,9,1,2],[6,10,3,1],[10,8,2,2]],
  [[2,4,2,1],[4,4,4,1],[8,4,2,1],[3,6,1,2],[6,6,2,1],[9,6,1,2],[2,9,3,1],[6,9,4,1],[11,9,2,1]],
  [[1,3,3,1],[4,3,5,1],[9,3,4,1],[2,5,1,3],[5,5,2,1],[8,5,2,1],[11,5,1,3],[1,8,4,1],[5,8,5,1],[10,8,3,1],[1,11,2,1],[4,11,4,1],[9,11,3,1]],
  [[0,2,16,1],[0,3,2,1],[14,3,2,1],[2,5,2,1],[12,5,2,1],[0,8,3,1],[13,8,3,1],[0,13,16,1],[3,14,10,1]],
];

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

export class Renderer {
  constructor(canvas, world, player) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
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
        bri: 0.5 + Math.random() * 0.5,
      });
    }
    return stars;
  }

  worldToScreen(wx, wy) {
    return {
      x: (wx - this.camX) * this.blockSize + this.canvas.width / 2,
      y: (wy - this.camY) * this.blockSize + this.canvas.height / 2,
    };
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.canvas.width / 2) / this.blockSize + this.camX,
      y: (sy - this.canvas.height / 2) / this.blockSize + this.camY,
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
      [BLOCK.GRASS]: '#5D9E1F', [BLOCK.DIRT]: '#7B5C3A', [BLOCK.STONE]: '#7F7F7F',
      [BLOCK.SAND]: '#F0D87A', [BLOCK.WOOD]: '#5E3A1A', [BLOCK.LEAVES]: '#2D7D27',
      [BLOCK.COAL_ORE]: '#333', [BLOCK.IRON_ORE]: '#C8A887', [BLOCK.GOLD_ORE]: '#FCE04A',
      [BLOCK.DIAMOND_ORE]: '#4AFCE0', [BLOCK.PLANKS]: '#AC8A56', [BLOCK.GRAVEL]: '#848484',
      [BLOCK.BEDROCK]: '#3B3B3B', [BLOCK.SNOW]: '#EEE',
    };
    return map[id] || '#888';
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

    // Sky
    this._drawSky(ctx, W, H, timeOfDay);

    // Visible block range
    const x1 = Math.max(0, Math.floor(this.camX - W / (2 * bs)) - 1);
    const x2 = Math.min(WORLD_WIDTH - 1, Math.ceil(this.camX + W / (2 * bs)) + 1);
    const y1 = Math.max(0, Math.floor(this.camY - H / (2 * bs)) - 1);
    const y2 = Math.min(WORLD_HEIGHT - 1, Math.ceil(this.camY + H / (2 * bs)) + 1);

    // Draw all blocks
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

    // Block selection outline
    if (targetBlock) {
      const sp = this.worldToScreen(targetBlock.bx, targetBlock.by);
      const bid = this.world.getBlock(targetBlock.bx, targetBlock.by);
      if (bid !== BLOCK.AIR) {
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(sp.x + 1, sp.y + 1, bs - 2, bs - 2);
        // Mining cracks
        if (this.player.miningBlock &&
            this.player.miningBlock.bx === targetBlock.bx &&
            this.player.miningBlock.by === targetBlock.by &&
            this.player.miningProgress > 0) {
          this._drawCracks(ctx, sp.x, sp.y, bs, this.player.miningProgress);
        }
      }
    }

    // Player
    this._drawPlayer(ctx);

    // Entities
    for (const e of entities) {
      const sp = this.worldToScreen(e.x, e.y + e.height);
      if (sp.x > -100 && sp.x < W + 100) {
        e.render(ctx, sp.x, sp.y, bs);
      }
    }

    // Lighting overlay
    this._drawLighting(ctx, x1, y1, x2, y2, timeOfDay);

    // Particles
    this._tickParticles(ctx, 1 / 60);

    // World edge darkening
    const le = this.worldToScreen(0, 0);
    const re = this.worldToScreen(WORLD_WIDTH, 0);
    if (le.x > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, le.x, H); }
    if (re.x < W) { ctx.fillStyle = '#000'; ctx.fillRect(re.x, 0, W - re.x, H); }
    const te = this.worldToScreen(0, 0);
    const be2 = this.worldToScreen(0, WORLD_HEIGHT);
    if (te.y > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, te.y); }
    if (be2.y < H) { ctx.fillStyle = '#000'; ctx.fillRect(0, be2.y, W, H - be2.y); }
  }

  _drawSky(ctx, W, H, t) {
    let topR, topG, topB, botR, botG, botB;
    if (t < 0.2) {
      topR=135; topG=206; topB=235; botR=176; botG=226; botB=255;
    } else if (t < 0.3) {
      const f = (t - 0.2) / 0.1;
      topR=lerp(135,10,f); topG=lerp(206,10,f); topB=lerp(235,30,f);
      botR=lerp(176,255,f); botG=lerp(226,80,f); botB=lerp(255,30,f);
    } else if (t < 0.5) {
      const f = (t - 0.3) / 0.2;
      topR=lerp(10,5,f); topG=lerp(10,5,f); topB=lerp(30,15,f);
      botR=lerp(255,10,f); botG=lerp(80,10,f); botB=lerp(30,20,f);
    } else if (t < 0.7) {
      const f = (t - 0.5) / 0.2;
      topR=5; topG=5; topB=15; botR=10; botG=10; botB=20;
    } else if (t < 0.8) {
      const f = (t - 0.7) / 0.1;
      topR=lerp(5,135,f); topG=lerp(5,206,f); topB=lerp(15,235,f);
      botR=lerp(10,255,f); botG=lerp(10,80,f); botB=lerp(20,30,f);
    } else {
      const f = (t - 0.8) / 0.2;
      topR=lerp(135,135,f); topG=lerp(206,206,f); topB=lerp(235,235,f);
      botR=lerp(255,176,f); botG=lerp(80,226,f); botB=lerp(30,255,f);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgb(${Math.round(topR)},${Math.round(topG)},${Math.round(topB)})`);
    grad.addColorStop(1, `rgb(${Math.round(botR)},${Math.round(botG)},${Math.round(botB)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    const isNight = t > 0.28 && t < 0.72;
    if (isNight) {
      const sa = Math.min(1, Math.min(t - 0.28, 0.72 - t) / 0.05);
      for (const s of this.stars) {
        ctx.globalAlpha = sa * s.bri;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(s.x * W, s.y * H, s.size, s.size);
      }
      ctx.globalAlpha = 1;
    }

    // Sun/Moon along arc
    const angle = (t - 0.25) * Math.PI * 2; // sunrise=0.75→0, noon=0→top
    const arcR = Math.min(W, H) * 0.4;
    const sunX = W / 2 + Math.sin(angle) * arcR;
    const sunY = H * 0.6 - Math.cos(angle) * arcR * 0.5;

    if (sunY < H + 60) {
      const isDay2 = t < 0.25 || t > 0.75;
      if (isDay2 || (t > 0.18 && t < 0.35) || (t > 0.65 && t < 0.82)) {
        ctx.beginPath();
        ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE54A';
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(sunX + Math.cos(a)*24, sunY + Math.sin(a)*24);
          ctx.lineTo(sunX + Math.cos(a)*34, sunY + Math.sin(a)*34);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#E8E8E8';
        ctx.fill();
        ctx.fillStyle = '#CCC';
        ctx.beginPath(); ctx.arc(sunX+5, sunY-4, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(sunX-6, sunY+3, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(sunX+2, sunY+6, 2, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  _drawPlayer(ctx) {
    const p = this.player;
    const sp = this.worldToScreen(p.x, p.y);
    const bs = this.blockSize;
    const sw = p.width * bs;
    const sh = p.height * bs;
    // We draw in a local coord system centered on sp.x, sp.y (top of player)
    // All x offsets are relative to center, y offsets relative to top

    const swing = Math.sin(p.walkCycle) * 0.4;

    // Shadow (always in screen coords, not flipped)
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + sh + 2, sw * 0.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw all player parts in a local coordinate system
    ctx.save();
    ctx.translate(sp.x, sp.y);
    if (p.facingLeft) ctx.scale(-1, 1);

    // Everything is now drawn relative to (0,0) = player center-top
    // Use lx/ly (local x from center, local y from top)
    const drawRect = (lx, ly, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx - sw / 2, ly, w, h);
    };

    // Left Leg (back)
    ctx.save();
    ctx.translate(-sw * 0.14, sh * 0.64);
    ctx.rotate(-swing);
    ctx.fillStyle = '#3C44AA';
    ctx.fillRect(0, 0, sw * 0.36, sh * 0.36);
    ctx.fillStyle = '#2C3490';
    ctx.fillRect(0, sh * 0.28, sw * 0.36, sh * 0.08);
    ctx.restore();

    // Right Leg (front)
    ctx.save();
    ctx.translate(sw * 0.14 - sw * 0.36, sh * 0.64);
    ctx.rotate(swing);
    ctx.fillStyle = '#3C44AA';
    ctx.fillRect(0, 0, sw * 0.36, sh * 0.36);
    ctx.fillStyle = '#2C3490';
    ctx.fillRect(0, sh * 0.28, sw * 0.36, sh * 0.08);
    ctx.restore();

    // Body
    ctx.fillStyle = '#3C44AA';
    ctx.fillRect(-sw * 0.42, sh * 0.32, sw * 0.84, sh * 0.32);
    ctx.fillStyle = '#8B8BCC';
    ctx.fillRect(-sw * 0.28, sh * 0.38, sw * 0.56, sh * 0.06);
    ctx.fillStyle = '#5555BB';
    ctx.fillRect(-sw * 0.42, sh * 0.32, sw * 0.84, sh * 0.05);

    // Left arm (back)
    ctx.save();
    ctx.translate(-sw * 0.42 - sw * 0.04, sh * 0.32);
    ctx.rotate(-swing * 0.8);
    ctx.fillStyle = '#C68642';
    ctx.fillRect(0, 0, sw * 0.22, sh * 0.32);
    ctx.restore();

    // Right arm (front, holds item)
    ctx.save();
    ctx.translate(sw * 0.42 - sw * 0.04, sh * 0.32);
    ctx.rotate(swing * 0.8);
    ctx.fillStyle = '#C68642';
    ctx.fillRect(0, 0, sw * 0.22, sh * 0.32);
    // Held item
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

    // Head
    ctx.fillStyle = '#C68642';
    ctx.fillRect(-sw * 0.42, 0, sw * 0.84, sh * 0.33);
    // Hair
    ctx.fillStyle = '#59301A';
    ctx.fillRect(-sw * 0.42, 0, sw * 0.84, sh * 0.07);
    ctx.fillRect(-sw * 0.42, 0, sw * 0.12, sh * 0.17);
    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-sw * 0.20, sh * 0.09, sw * 0.22, sh * 0.11);
    ctx.fillRect(sw * 0.14 - sw * 0.22, sh * 0.09, sw * 0.22, sh * 0.11);
    ctx.fillStyle = '#4A2800';
    ctx.fillRect(-sw * 0.14, sh * 0.09, sw * 0.11, sh * 0.11);
    ctx.fillRect(sw * 0.14 - sw * 0.11, sh * 0.09, sw * 0.11, sh * 0.11);
    // Nose
    ctx.fillStyle = '#A05530';
    ctx.fillRect(-sw * 0.09, sh * 0.18, sw * 0.18, sh * 0.05);
    // Mouth
    ctx.fillStyle = '#7A3820';
    ctx.fillRect(-sw * 0.25, sh * 0.24, sw * 0.5, sh * 0.04);

    ctx.restore(); // end of local coords

    // Water tint (in screen space)
    if (p.inWater) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#4090FF';
      ctx.fillRect(sp.x - sw / 2, sp.y, sw, sh);
      ctx.globalAlpha = 1;
    }
  }

  _drawCracks(ctx, sx, sy, bs, progress) {
    const stage = Math.min(5, Math.floor(progress * 6));
    const pattern = CRACK_PATTERNS[stage];
    const s = bs / 16;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    for (const [x, y, w, h] of pattern) {
      ctx.fillRect(sx + x * s, sy + y * s, w * s, h * s);
    }
  }

  _drawLighting(ctx, x1, y1, x2, y2, timeOfDay) {
    const bs = this.blockSize;
    let nightFactor = 0;
    if (timeOfDay >= 0.22 && timeOfDay <= 0.28)      nightFactor = (timeOfDay - 0.22) / 0.06;
    else if (timeOfDay > 0.28 && timeOfDay < 0.72)   nightFactor = 1;
    else if (timeOfDay >= 0.72 && timeOfDay <= 0.78)  nightFactor = 1 - (timeOfDay - 0.72) / 0.06;

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
}
