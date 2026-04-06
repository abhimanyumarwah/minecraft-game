import { BLOCK, BLOCK_DATA } from './blocks.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './world.js';

const GRAVITY = 28;
const MAX_FALL = 40;

class Entity {
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

  collidesAt(px, py) {
    const bx1 = Math.floor(px - this.width / 2);
    const bx2 = Math.floor(px + this.width / 2 - 0.001);
    const by1 = Math.floor(py);
    const by2 = Math.floor(py + this.height - 0.001);
    for (let ty = by1; ty <= by2; ty++) {
      for (let tx = bx1; tx <= bx2; tx++) {
        if (this.isSolid(tx, ty)) return true;
      }
    }
    return false;
  }

  physicsUpdate(dt) {
    this.vy += GRAVITY * dt;
    this.vy = Math.min(this.vy, MAX_FALL);

    const nx = this.x + this.vx * dt;
    if (!this.collidesAt(nx, this.y)) this.x = nx;
    else this.vx *= -1; // bounce off walls

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
    const ex1 = this.x - this.width/2, ex2 = this.x + this.width/2;
    const ey1 = this.y, ey2 = this.y + this.height;
    const px1 = player.x - player.width/2, px2 = player.x + player.width/2;
    const py1 = player.y, py2 = player.y + player.height;
    return ex1 < px2 && ex2 > px1 && ey1 < py2 && ey2 > py1;
  }
}

export class Zombie extends Entity {
  constructor(world, x, y) {
    super(world, x, y);
    this.health = 20;
    this.maxHealth = 20;
    this.speed = 2.0;
    this._attackTimer = 0;
    this._stateTimer = 0;
    this.state = 'patrol';
    this.patrolDir = Math.random() > 0.5 ? 1 : -1;
  }

  update(dt, player, dayFactor) {
    this._attackTimer = Math.max(0, this._attackTimer - dt);
    this._stateTimer += dt;

    const dist = this.distanceTo(player);

    // Burn in daylight
    if (dayFactor > 0.6 && this.world.getLight(Math.floor(this.x), Math.floor(this.y)) > 11) {
      this.takeDamage(dt * 2);
    }

    if (dist < 20) {
      this.state = 'chase';
    } else if (dist > 25) {
      this.state = 'patrol';
    }

    if (this.state === 'chase') {
      const dir = player.x > this.x ? 1 : -1;
      this.vx = dir * this.speed;
      this.facingLeft = dir < 0;
      // Jump over obstacles
      if (this.onGround && this.vx !== 0) {
        const nextX = this.x + dir * 0.6;
        if (this.isSolid(Math.floor(nextX), Math.floor(this.y + this.height - 0.5))) {
          this.vy = -8;
        }
      }
      // Attack
      if (dist < 1.5 && this._attackTimer <= 0) {
        player.takeDamage(3);
        this._attackTimer = 1.5;
      }
    } else {
      // Patrol
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

    // Legs
    ctx.fillStyle = '#2F5B3F';
    ctx.save(); ctx.translate(sx + w*0.15, sy + h*0.7);
    ctx.rotate(-swing); ctx.fillRect(0, 0, w*0.35, h*0.3); ctx.restore();
    ctx.save(); ctx.translate(sx + w*0.5, sy + h*0.7);
    ctx.rotate(swing); ctx.fillRect(0, 0, w*0.35, h*0.3); ctx.restore();

    // Body
    ctx.fillStyle = '#3E8C4A';
    ctx.fillRect(sx + w*0.1, sy + h*0.35, w*0.8, h*0.35);
    ctx.fillStyle = '#2F6E3A';
    ctx.fillRect(sx + w*0.2, sy + h*0.4, w*0.6, 2*s);

    // Arms (outstretched zombie style)
    ctx.fillStyle = '#3E8C4A';
    ctx.save(); ctx.translate(sx, sy + h*0.35);
    ctx.rotate(-0.5); ctx.fillRect(-w*0.25, 0, w*0.25, h*0.3); ctx.restore();
    ctx.save(); ctx.translate(sx + w, sy + h*0.35);
    ctx.rotate(0.5); ctx.fillRect(0, 0, w*0.25, h*0.3); ctx.restore();

    // Head
    ctx.fillStyle = '#5E9E5E';
    ctx.fillRect(sx + w*0.15, sy, w*0.7, h*0.35);
    // Eyes (red)
    ctx.fillStyle = '#FF2020';
    ctx.fillRect(sx + w*0.25, sy + h*0.1, w*0.15, h*0.08);
    ctx.fillRect(sx + w*0.6, sy + h*0.1, w*0.15, h*0.08);
    // Mouth (drooling)
    ctx.fillStyle = '#204020';
    ctx.fillRect(sx + w*0.3, sy + h*0.22, w*0.4, h*0.05);

    if (this.facingLeft) ctx.restore();

    // Health bar
    if (this.health < this.maxHealth) {
      ctx.fillStyle = '#400';
      ctx.fillRect(screenX - 16, sy - 6, 32, 4);
      ctx.fillStyle = '#0F0';
      ctx.fillRect(screenX - 16, sy - 6, 32 * (this.health / this.maxHealth), 4);
    }
  }
}

export class Creeper extends Entity {
  constructor(world, x, y) {
    super(world, x, y);
    this.health = 20;
    this.maxHealth = 20;
    this.speed = 2.5;
    this.width = 0.6;
    this.height = 1.7;
    this.state = 'patrol';
    this._explodeTimer = 0;
    this._isExploding = false;
    this._stateTimer = 0;
    this.patrolDir = Math.random() > 0.5 ? 1 : -1;
  }

  update(dt, player, _dayFactor) {
    this._stateTimer += dt;
    const dist = this.distanceTo(player);

    if (dist < 4) {
      this.state = 'exploding';
    } else if (dist < 16) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }

    if (this.state === 'exploding') {
      this._explodeTimer += dt;
      this.vx = 0;
      if (this._explodeTimer > 1.5) {
        this._explode(player);
        return;
      }
    } else if (this.state === 'chase') {
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
        if (dx*dx + dy*dy <= radius*radius) {
          const b = this.world.getBlock(bx+dx, by+dy);
          if (b !== BLOCK.BEDROCK && b !== BLOCK.AIR) {
            this.world.setBlock(bx+dx, by+dy, BLOCK.AIR);
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

    // Flash when exploding
    if (this._explodeTimer > 0 && Math.floor(this._explodeTimer * 8) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    // Legs
    ctx.fillStyle = '#3A7A3A';
    ctx.fillRect(sx + w*0.05, sy + h*0.68, w*0.4, h*0.32);
    ctx.fillRect(sx + w*0.55, sy + h*0.68, w*0.4, h*0.32);
    // Body
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(sx, sy + h*0.35, w, h*0.33);
    // Head
    ctx.fillStyle = '#5DBF5D';
    ctx.fillRect(sx + w*0.05, sy, w*0.9, h*0.35);
    // Face (creeper pattern)
    ctx.fillStyle = '#1A5C1A';
    // Eyes
    ctx.fillRect(sx + w*0.15, sy + h*0.06, w*0.2, h*0.1);
    ctx.fillRect(sx + w*0.65, sy + h*0.06, w*0.2, h*0.1);
    // Nose + mouth (creeper face)
    ctx.fillRect(sx + w*0.35, sy + h*0.17, w*0.3, h*0.08);
    ctx.fillRect(sx + w*0.15, sy + h*0.22, w*0.2, h*0.08);
    ctx.fillRect(sx + w*0.65, sy + h*0.22, w*0.2, h*0.08);

    ctx.globalAlpha = 1.0;

    // Health bar
    if (this.health < this.maxHealth) {
      ctx.fillStyle = '#400';
      ctx.fillRect(screenX - 16, sy - 6, 32, 4);
      ctx.fillStyle = '#0F0';
      ctx.fillRect(screenX - 16, sy - 6, 32 * (this.health / this.maxHealth), 4);
    }
  }
}

export class Pig extends Entity {
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
    if (this._stateTimer > (2 + Math.random() * 3)) {
      this._stateTimer = 0;
      if (Math.random() > 0.4) {
        this.patrolDir = Math.random() > 0.5 ? 1 : -1;
      } else {
        this.patrolDir = 0; // stand still
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

    // Body
    ctx.fillStyle = '#F4A0B0';
    ctx.fillRect(sx, sy + h*0.1, w, h*0.7);
    // Head
    ctx.fillStyle = '#F4A0B0';
    ctx.fillRect(sx + w*0.6, sy, w*0.5, h*0.55);
    // Snout
    ctx.fillStyle = '#E08090';
    ctx.fillRect(sx + w*0.95, sy + h*0.25, w*0.15, h*0.2);
    // Eye
    ctx.fillStyle = '#222';
    ctx.fillRect(sx + w*0.7, sy + h*0.1, w*0.08, h*0.1);
    // Legs
    ctx.fillStyle = '#E090A0';
    ctx.fillRect(sx + w*0.1, sy + h*0.8, w*0.2, h*0.2);
    ctx.fillRect(sx + w*0.7, sy + h*0.8, w*0.2, h*0.2);
    ctx.fillRect(sx + w*0.35, sy + h*0.8, w*0.15, h*0.2);

    if (this.facingLeft) ctx.restore();
  }
}

export class EntityManager {
  constructor(world) {
    this.world = world;
    this.entities = [];
    this._spawnTimer = 0;
  }

  spawnNaturally(player, timeOfDay) {
    this._spawnTimer = 0;
    const isNight = timeOfDay > 0.25 && timeOfDay < 0.75;
    const px = player.x, py = player.y;

    // Limit total entities
    if (this.entities.length >= 30) return;

    // Spawn pigs in daytime
    if (!isNight && Math.random() < 0.3 && this.entities.filter(e => e instanceof Pig).length < 8) {
      const ox = (Math.random() * 30 + 15) * (Math.random() > 0.5 ? 1 : -1);
      const sx = Math.floor(px + ox);
      const sy = this._findSurface(sx);
      if (sy > 0) this.entities.push(new Pig(this.world, sx + 0.5, sy));
    }

    // Spawn zombies at night
    if (isNight && Math.random() < 0.5) {
      const ox = (Math.random() * 40 + 20) * (Math.random() > 0.5 ? 1 : -1);
      const sx = Math.floor(px + ox);
      const sy = this._findSurface(sx);
      const light = this.world.getLight(sx, sy - 1);
      if (sy > 0 && light < 7) {
        this.entities.push(new Zombie(this.world, sx + 0.5, sy));
      }
    }

    // Spawn creepers at night
    if (isNight && Math.random() < 0.2) {
      const ox = (Math.random() * 50 + 25) * (Math.random() > 0.5 ? 1 : -1);
      const sx = Math.floor(px + ox);
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

    // Remove entities far from player
    const despawnDist = 80;
    this.entities = this.entities.filter(e => {
      if (!e.alive) {
        // Drop items on death
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
}
