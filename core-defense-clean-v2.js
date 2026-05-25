(() => {
  'use strict';

  // ============================================================
  // DOM + LEVEL CONFIG
  // ============================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const startOverlay = document.getElementById('startOverlay');
  const endOverlay = document.getElementById('endOverlay');
  const startButton = document.getElementById('startButton');
  const restartButton = document.getElementById('restartButton');
  const resultTitle = document.getElementById('resultTitle');
  const resultText = document.getElementById('resultText');
  const finalStats = document.getElementById('finalStats');

  const params = new URLSearchParams(location.search);
  const rawLevel = params.get('level');
  const parsedLevel = Number.parseInt(rawLevel ?? '2', 10);
  const LV = Number.isNaN(parsedLevel) ? 2 : parsedLevel;
  const IS_TUTORIAL = LV === 0;
  const ENDLESS = LV >= 5;
  const TARGET_WAVES = ({ 0: 3, 1: 5, 2: 8, 3: 12, 4: 15, 5: 999999 }[LV] || 8);
  const LEVEL_CAP = ENDLESS ? 999 : Math.max(1, Math.min(5, LV + 1));

  // ============================================================
  // COLORS + BALANCE DATA
  // ============================================================
  const C = {
    bg: '#0b0f14',
    bg2: '#151b23',
    line: 'rgba(235,240,245,.08)',
    blue: '#4fb8d8',
    rose: '#e06f8f',
    white: '#f8fafc',
    danger: '#d97757',
    green: '#8bd3a7',
    gold: '#f0b86e',
    purple: '#b78cff',
    rock: '#a8a29e'
  };

  const TOWERS = [
    { name: 'Pulse', color: C.blue, range: 158, rate: 0.62, damage: 0.72, kind: 'pulse', upgradeScale: 0.58, cone: 0.95 },
    { name: 'Beam', color: C.gold, range: 245, rate: 0.86, damage: 2.55, kind: 'beam', upgradeScale: 0.72, cone: 0.88 },
    { name: 'Freeze', color: C.purple, range: 178, rate: 1.00, damage: 0.58, kind: 'freeze', upgradeScale: 0.72, cone: 0.98 },
    { name: 'Wave', color: '#34d399', range: 168, rate: 0.98, damage: 0.52, kind: 'wave', upgradeScale: 0.72, cone: 1.04 }
  ];

  const ENEMY_TYPES = [
    { kind: 'small', color: '#facc15', hpMult: 0.65, speedMult: 1.42, radius: 8 * ENEMY_SIZE_SCALE, reward: 2 },
    { kind: 'medium', color: '#a8a29e', hpMult: 0.95, speedMult: 0.98, radius: 12 * ENEMY_SIZE_SCALE, reward: 3 },
    { kind: 'large', color: '#f97316', hpMult: 1.65, speedMult: 0.60, radius: 18 * ENEMY_SIZE_SCALE, reward: 6 }
  ];

  const TOWER_SIZE_SCALE = 0.86;
  const ENEMY_SIZE_SCALE = 0.86;
  const BUILD_COST = 5;
  const UPGRADE_COSTS = { 1: 14, 2: 23, 3: 39, 4: 66 };
  const BOOST_COOLDOWN = 10;
  const BOOST_TIME = 4.8;

  let game;
  let lastFrame = performance.now();

  // ============================================================
  // BASIC HELPERS
  // ============================================================
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }

  addEventListener('resize', resize);
  resize();

  const centerX = () => canvas.width / 2;
  const centerY = () => canvas.height / 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function polygon(points, radius, offset = 0) {
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = offset + i * Math.PI * 2 / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function isEmptySlot(slot) {
    return !slot || slot.type === null || slot.level <= 0;
  }

  function clearInput() {
    Object.keys(game.input).forEach((key) => {
      game.input[key] = false;
    });
  }

  // ============================================================
  // GAME STATE
  // ============================================================
  function initGame() {
    game = {
      running: false,
      time: 0,
      wave: 0,
      waveTimer: 1.2,
      waveActive: false,
      enemiesLeftToSpawn: 0,
      spawnClock: 0,
      spawnPattern: [],
      spawnIndex: 0,
      kills: 0,
      money: LV <= 1 ? 13 : LV === 2 ? 11 : 9,
      coreHp: LV <= 1 ? 8 : 7,
      maxCoreHp: LV <= 1 ? 8 : 7,
      ringAngle: 0,
      selectedSlot: 0,
      buildType: 0,
      boostCooldown: 0,
      specialGap: 0,
      slots: Array.from({ length: 12 }, () => ({ type: null, level: 0, cooldown: 0, flash: 0, boost: 0 })),
      enemies: [],
      shots: [],
      particles: [],
      input: { topLeft: false, topMid: false, topRight: false, bottomLeft: false, bottomMid: false, bottomRight: false }
    };

    if (IS_TUTORIAL) {
      game.tutorial = { step: 0, phase: 'build', waveStarted: false, enemiesSpawned: 0, prevCount: 0, messageTime: 999, waitUntil: 0, completed: false };
    }
  }

  initGame();

  function startGame(event) {
    if (event) event.preventDefault();
    initGame();
    game.running = true;
    clearInput();
    startOverlay.classList.add('hidden');
    endOverlay.classList.add('hidden');
  }

  function endGame(message, won = false) {
    if (!game.running) return;
    game.running = false;
    clearInput();

    resultTitle.textContent = won ? 'You Win' : 'Game Over';
    resultText.textContent = message;
    finalStats.innerHTML = `Waves Cleared: ${Math.max(0, game.wave - 1)}${ENDLESS ? '' : '/' + TARGET_WAVES}<br>Enemies Destroyed: ${game.kills}<br>Money: $${game.money}<br>Core Health: ${game.coreHp}/${game.maxCoreHp}`;
    endOverlay.classList.remove('hidden');
  }

  // ============================================================
  // TOWER HELPERS
  // ============================================================
  function slotPosition(index) {
    const inner = index >= 6;
    const ringIndex = inner ? index - 6 : index;
    const offset = inner ? Math.PI / 6 : 0;
    const angle = game.ringAngle + ringIndex * Math.PI * 2 / 6 - Math.PI / 2 + offset;
    const radius = inner
      ? Math.min(canvas.width, canvas.height) * 0.095 + 18
      : Math.min(canvas.width, canvas.height) * 0.14 + 28;

    return {
      x: centerX() + Math.cos(angle) * radius,
      y: centerY() + Math.sin(angle) * radius,
      angle
    };
  }

  function towerPower(slot) {
    if (isEmptySlot(slot)) return 0;
    const tower = TOWERS[slot.type];
    return 1 + (slot.level - 1) * tower.upgradeScale;
  }

  function upgradeCost(slot) {
    if (isEmptySlot(slot)) return BUILD_COST;
    if (!ENDLESS && slot.level >= LEVEL_CAP) return null;
    if (ENDLESS && slot.level >= 5) return Math.ceil(70 * Math.pow(1.45, slot.level - 4));
    return UPGRADE_COSTS[slot.level] || 70;
  }

  function buildOrUpgradeTower() {
    const slot = game.slots[game.selectedSlot];
    const position = slotPosition(game.selectedSlot);
    let cost = upgradeCost(slot);

    if (IS_TUTORIAL && game.tutorial && game.tutorial.phase === 'build' && isEmptySlot(slot)) {
      const steps = tutorialSteps();
      const step = steps[Math.min(game.tutorial.step, steps.length - 1)];
      if (game.buildType === step.tower) cost = 0;
    }

    if (cost === null) {
      spawnParticles(position.x, position.y, C.white, 6);
      return;
    }

    if (game.money < cost) {
      spawnParticles(position.x, position.y, C.danger, 8);
      return;
    }

    game.money -= cost;

    if (isEmptySlot(slot)) {
      slot.type = game.buildType;
      slot.level = 1;
      slot.cooldown = 0;
      slot.boost = 0;
      slot.flash = 1;
      spawnParticles(position.x, position.y, TOWERS[slot.type].color, 14);
    } else {
      slot.level += 1;
      slot.flash = 1;
      spawnParticles(position.x, position.y, TOWERS[slot.type].color, 16);
    }
  }

  function activateBoost() {
    if (game.boostCooldown > 0) return;

    const slot = game.slots[game.selectedSlot];
    const position = slotPosition(game.selectedSlot);

    if (isEmptySlot(slot)) {
      spawnParticles(position.x, position.y, C.danger, 10);
      game.boostCooldown = 1.5;
      return;
    }

    slot.boost = BOOST_TIME;
    slot.flash = 1.4;
    game.boostCooldown = BOOST_COOLDOWN;
    spawnParticles(position.x, position.y, TOWERS[slot.type].color, 30);

    if (slot.type === 2 || slot.type === 3) {
      const radius = slot.type === 2 ? 210 : 185;
      const damage = slot.type === 2 ? 0.55 : 0.85;
      const slow = slot.type === 2 ? 2.6 : 0.35;

      for (const enemy of game.enemies) {
        if (Math.hypot(enemy.x - position.x, enemy.y - position.y) < radius) {
          enemy.hp -= damage * towerPower(slot);
          enemy.slow = Math.max(enemy.slow || 0, slow);
        }
      }
    }
  }

  // ============================================================
  // ENEMY SELECTION + SPECIAL ENEMIES
  // ============================================================
  function pickEnemyType() {
    const roll = Math.random();

    if (LV <= 1) return roll < 0.50 ? ENEMY_TYPES[0] : roll < 0.88 ? ENEMY_TYPES[1] : ENEMY_TYPES[2];
    if (LV === 2) return roll < 0.42 ? ENEMY_TYPES[0] : roll < 0.78 ? ENEMY_TYPES[1] : ENEMY_TYPES[2];
    if (LV === 3) return roll < 0.34 ? ENEMY_TYPES[0] : roll < 0.70 ? ENEMY_TYPES[1] : ENEMY_TYPES[2];
    return roll < 0.28 ? ENEMY_TYPES[0] : roll < 0.62 ? ENEMY_TYPES[1] : ENEMY_TYPES[2];
  }

  function getSpecialBehavior(kind) {
    const wave = Math.max(1, game.wave);
    const options = [];
    const chance = Math.min(0.74, 0.28 + wave * 0.02 + Math.max(0, LV - 1) * 0.045);

    if (kind === 'small') options.push('swarm');
    if (kind !== 'large') options.push('dash');
    if (kind === 'large') options.push('armor');
    if (kind === 'medium') options.push('split');

    if (!options.length) return null;

    game.specialGap = (game.specialGap || 0) + 1;
    if (game.specialGap >= 4 || Math.random() < chance) {
      game.specialGap = 0;
      return options[Math.floor(Math.random() * options.length)];
    }

    return null;
  }

  function applySpecialBehavior(enemy) {
    if (IS_TUTORIAL) return;
    const behavior = getSpecialBehavior(enemy.kind);
    if (!behavior) return;

    enemy.behavior = behavior;
    enemy.dashCooldown = 0.8 + Math.random();
    enemy.dashTime = 0;
    enemy.splitDone = false;

    if (behavior === 'swarm') {
      enemy.radius = Math.max(8 * ENEMY_SIZE_SCALE, enemy.radius * 0.78);
      enemy.speed *= 1.35;
      enemy.hp = Math.ceil(enemy.hp * 0.65 * 1.2);
      enemy.reward = Math.max(1, enemy.reward - 1);
      enemy.color = '#facc15';
    }

    if (behavior === 'dash') {
      enemy.speed *= 0.94;
      enemy.hp = Math.ceil(enemy.hp * 1.08 * 1.18);
      enemy.color = '#fb7185';
    }

    if (behavior === 'armor') {
      enemy.speed *= 0.82;
      enemy.hp = Math.ceil(enemy.hp * 1.45 * 1.25);
      enemy.reward += 2;
      enemy.color = '#94a3b8';
    }

    if (behavior === 'split') {
      enemy.hp = Math.ceil(enemy.hp * 1.2 * 1.2);
      enemy.reward += 1;
      enemy.color = '#c084fc';
    }

    enemy.maxHp = enemy.hp;
  }

  function splitEnemy(enemy) {
    if (enemy.splitDone) return;
    enemy.splitDone = true;

    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const hp = Math.max(1, Math.ceil(enemy.maxHp * 0.25));
      game.enemies.push({
        x: enemy.x + Math.cos(angle) * 10,
        y: enemy.y + Math.sin(angle) * 10,
        hp,
        maxHp: hp,
        speed: enemy.speed * 1.35,
        slow: 0,
        radius: 7 * ENEMY_SIZE_SCALE,
        reward: 1,
        kind: 'small',
        color: '#facc15',
        behavior: 'swarm'
      });
    }

    spawnParticles(enemy.x, enemy.y, '#c084fc', 18);
  }

  // ============================================================
  // WAVES + SPAWNING
  // ============================================================
  function startWave() {
    game.wave += 1;
    game.waveActive = true;

    const easy = LV <= 1;
    const base = easy ? 3 : 4;
    const add = easy ? 1.2 : 1.5;

    game.enemiesLeftToSpawn = Math.ceil(base + game.wave * add + Math.max(0, LV - 1));
    game.spawnClock = 0.35;
    game.spawnPattern = [];
    game.spawnIndex = 0;

    const startSide = Math.floor(Math.random() * 4);
    for (let i = 0; i < game.enemiesLeftToSpawn; i++) {
      game.spawnPattern.push((startSide + i) % 4);
    }

    for (let i = game.spawnPattern.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [game.spawnPattern[i], game.spawnPattern[j]] = [game.spawnPattern[j], game.spawnPattern[i]];
    }
  }

  function spawnEnemy() {
    if (IS_TUTORIAL) return;
    const side = game.spawnPattern.length
      ? game.spawnPattern[game.spawnIndex++ % game.spawnPattern.length]
      : Math.floor(Math.random() * 4);

    const margin = 32;
    let x;
    let y;

    if (side === 0) {
      x = -margin;
      y = canvas.height * (0.12 + Math.random() * 0.76);
    } else if (side === 1) {
      x = canvas.width + margin;
      y = canvas.height * (0.12 + Math.random() * 0.76);
    } else if (side === 2) {
      x = canvas.width * (0.12 + Math.random() * 0.76);
      y = -margin;
    } else {
      x = canvas.width * (0.12 + Math.random() * 0.76);
      y = canvas.height + margin;
    }

    const easy = LV <= 1;
    const enemyType = pickEnemyType();
    const baseHp = easy ? 2.25 + game.wave * 0.5 : 3.0 + game.wave * 0.66 + LV * 0.5;
    const baseSpeed = easy ? 22 : 24;
    const hp = Math.max(1, Math.ceil(baseHp * enemyType.hpMult));
    const speed = baseSpeed * enemyType.speedMult;

    const enemy = {
      x,
      y,
      hp,
      maxHp: hp,
      speed,
      slow: 0,
      radius: enemyType.radius,
      reward: enemyType.reward + (easy ? 1 : 0) + Math.floor(hp / 8),
      kind: enemyType.kind,
      color: enemyType.color,
      behavior: null
    };

    applySpecialBehavior(enemy);
    game.enemies.push(enemy);
  }

  // ============================================================
  // COMBAT
  // ============================================================
  function angleDiff(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
  }

  function enemyInCone(x, y, enemy, range, aim, cone) {
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const dist = Math.hypot(dx, dy);
    return dist < range && Math.abs(angleDiff(Math.atan2(dy, dx), aim)) <= cone;
  }

  function firstEnemyInCone(x, y, range, aim, cone) {
    let best = null;
    let bestDist = range;

    for (const enemy of game.enemies) {
      if (!enemyInCone(x, y, enemy, range, aim, cone)) continue;
      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = enemy;
      }
    }

    return best;
  }

  function applyTowerCounter(enemy, towerType, damageDealt) {
    if (!enemy.behavior || damageDealt <= 0) return;

    if (towerType === 0 && enemy.behavior === 'split') enemy.hp -= damageDealt * 0.7;
    if (towerType === 1 && enemy.behavior === 'armor') enemy.hp -= damageDealt * 0.75;
    if (towerType === 2 && enemy.behavior === 'dash') {
      enemy.hp -= damageDealt * 0.55;
      enemy.slow = Math.max(enemy.slow || 0, 1.85);
      enemy.dashTime = 0;
    }
    if (towerType === 3 && enemy.behavior === 'swarm') enemy.hp -= damageDealt * 0.75;
  }

  function updateTowers(dt) {
    for (let i = 0; i < game.slots.length; i++) {
      const slot = game.slots[i];

      if (slot.flash > 0) slot.flash = Math.max(0, slot.flash - dt * 3);
      if (slot.boost > 0) slot.boost = Math.max(0, slot.boost - dt);
      if (isEmptySlot(slot)) continue;

      slot.cooldown -= dt;

      const position = slotPosition(i);
      const tower = TOWERS[slot.type];
      const power = towerPower(slot);
      const boosted = slot.boost > 0;
      const range = tower.range + power * 16 + (boosted ? 30 : 0);

      if (slot.cooldown > 0) continue;

      if (tower.kind === 'wave') {
        let hit = false;
        const cone = boosted ? 1.32 : tower.cone;

        for (const enemy of game.enemies) {
          if (!enemyInCone(position.x, position.y, enemy, range, position.angle, cone)) continue;
          const before = enemy.hp;
          enemy.hp -= tower.damage * power * (boosted ? 1.75 : 1);
          enemy.slow = Math.max(enemy.slow || 0, boosted ? 0.55 : 0.2);
          applyTowerCounter(enemy, slot.type, before - enemy.hp);
          hit = true;
        }

        if (hit) {
          slot.cooldown = Math.max(0.3, (tower.rate - power * 0.045) * (boosted ? 0.65 : 1));
          game.shots.push({
            x: position.x,
            y: position.y,
            tx: position.x + Math.cos(position.angle) * range,
            ty: position.y + Math.sin(position.angle) * range,
            life: 0.22,
            color: tower.color,
            beam: true
          });
          slot.flash = boosted ? 1.35 : 1;
        }
      } else {
        const enemy = firstEnemyInCone(position.x, position.y, range, position.angle, tower.cone);
        if (!enemy) continue;

        const before = enemy.hp;
        if (tower.kind === 'freeze') enemy.slow = Math.max(enemy.slow || 0, (boosted ? 2.2 : 1.3) + power * 0.2);
        enemy.hp -= tower.damage * power * (boosted ? 1.85 : 1);
        applyTowerCounter(enemy, slot.type, before - enemy.hp);

        slot.cooldown = Math.max(tower.kind === 'pulse' ? 0.16 : 0.14, (tower.rate - power * 0.055) * (boosted ? 0.52 : 1));
        game.shots.push({ x: position.x, y: position.y, tx: enemy.x, ty: enemy.y, life: 0.18, color: tower.color, beam: tower.kind === 'beam' });
        slot.flash = boosted ? 1.3 : 1;
      }
    }
  }

  function updateEnemies(dt) {
    for (const enemy of game.enemies) {
      if (enemy.behavior === 'dash') {
        enemy.dashCooldown -= dt;
        if (enemy.dashTime > 0) {
          enemy.dashTime -= dt;
        } else if (enemy.dashCooldown <= 0) {
          enemy.dashTime = 0.34;
          enemy.dashCooldown = 1.7 + Math.random() * 0.9;
          spawnParticles(enemy.x, enemy.y, '#fb7185', 6);
        }
      }
    }

    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const enemy = game.enemies[i];

      if (enemy.hp <= 0) {
        if (enemy.behavior === 'split' && !enemy.splitDone) splitEnemy(enemy);
        spawnParticles(enemy.x, enemy.y, C.gold, 10);
        game.enemies.splice(i, 1);
        game.kills += 1;
        game.money += enemy.reward || 3;
        continue;
      }

      const angle = Math.atan2(centerY() - enemy.y, centerX() - enemy.x);
      const speed = enemy.speed * (enemy.dashTime > 0 ? 2.6 : 1) * (enemy.slow > 0 ? 0.52 : 1);
      enemy.x += Math.cos(angle) * speed * dt;
      enemy.y += Math.sin(angle) * speed * dt;
      enemy.slow = Math.max(0, enemy.slow - dt);

      if (Math.hypot(enemy.x - centerX(), enemy.y - centerY()) < 42) {
        game.enemies.splice(i, 1);
        game.coreHp -= 1;
        spawnParticles(centerX(), centerY(), C.danger, 20);
        if (game.coreHp <= 0) endGame('The core was destroyed.');
      }
    }
  }

  function updateWaves(dt) {
    if (IS_TUTORIAL) return;
    if (!game.waveActive) {
      game.waveTimer -= dt;
      if (game.waveTimer <= 0) startWave();
      return;
    }

    game.spawnClock -= dt;
    if (game.enemiesLeftToSpawn > 0 && game.spawnClock <= 0) {
      game.spawnClock = LV <= 1
        ? Math.max(0.62, 0.98 - game.wave * 0.04)
        : Math.max(0.34, 0.9 - game.wave * 0.045 - LV * 0.02);
      game.enemiesLeftToSpawn -= 1;
      spawnEnemy();
    }

    if (game.enemiesLeftToSpawn <= 0 && game.enemies.length === 0) {
      game.waveActive = false;
      game.waveTimer = LV <= 1 ? 3.2 : 2.6;
      if (!ENDLESS && game.wave >= TARGET_WAVES) endGame('You defended the core through every wave.', true);
    }
  }

  // ============================================================
  // PARTICLES + SHOTS
  // ============================================================
  function spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 150;
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 1.5 + Math.random() * 3,
        color
      });
    }
  }

  function updateParticles(dt) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt * 2;
      if (p.life <= 0) game.particles.splice(i, 1);
    }
  }

  function updateShots(dt) {
    for (let i = game.shots.length - 1; i >= 0; i--) {
      game.shots[i].life -= dt;
      if (game.shots[i].life <= 0) game.shots.splice(i, 1);
    }
  }

  // ============================================================
  // UPDATE LOOP
  // ============================================================
  function update(dt) {
    if (game.running) {
      game.time += dt;

      if (game.input.topLeft) {
        game.buildType = (game.buildType + 1) % TOWERS.length;
        game.input.topLeft = false;
      }

      if (game.input.topMid) {
        buildOrUpgradeTower();
        game.input.topMid = false;
      }

      if (game.input.topRight) {
        game.selectedSlot = (game.selectedSlot + 1) % 12;
        game.input.topRight = false;
      }

      if (game.input.bottomLeft) game.ringAngle -= 2.4 * dt;
      if (game.input.bottomRight) game.ringAngle += 2.4 * dt;

      if (game.input.bottomMid) {
        activateBoost();
        game.input.bottomMid = false;
      }

      game.boostCooldown = Math.max(0, game.boostCooldown - dt);
      updateWaves(dt);
      updateTutorial();
      updateTowers(dt);
      updateEnemies(dt);
      updateShots(dt);
    }

    updateParticles(dt);
  }

  // ============================================================
  // DRAWING
  // ============================================================
  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, C.bg);
    gradient.addColorStop(0.6, C.bg2);
    gradient.addColorStop(1, '#080b10');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawCore() {
    ctx.save();
    ctx.translate(centerX(), centerY());

    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 92, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(17,24,39,.95)';
    ctx.strokeStyle = 'rgba(255,255,255,.24)';
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = game.coreHp <= 2 ? C.danger : C.green;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(game.coreHp / game.maxCoreHp, 0, 1));
    ctx.stroke();

    ctx.fillStyle = game.coreHp <= 2 ? C.danger : C.white;
    ctx.font = '900 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(game.coreHp, 0, 1);
    ctx.restore();
  }

  function drawTowerShape(type, level, color) {
    ctx.save();
    ctx.scale(TOWER_SIZE_SCALE, TOWER_SIZE_SCALE);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 1.25;

    if (type === 1) {
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(15, 0);
      ctx.lineTo(0, 15);
      ctx.lineTo(-15, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 2) {
      polygon(6, 14, -Math.PI / 2);
      ctx.fill();
      ctx.stroke();
    } else if (type === 3) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#0b0f14';
    ctx.font = '900 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(level, 0, 1);
    ctx.restore();
  }

  function drawSlots() {
    for (let i = 0; i < game.slots.length; i++) {
      const slot = game.slots[i];
      const position = slotPosition(i);
      const selected = i === game.selectedSlot;

      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.rotate(position.angle + Math.PI / 2);
      ctx.fillStyle = selected ? 'rgba(248,250,252,.12)' : 'rgba(17,24,39,.85)';
      ctx.strokeStyle = selected ? C.white : 'rgba(255,255,255,.18)';
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, (24 + (slot.flash || 0) * 5) * TOWER_SIZE_SCALE, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (!isEmptySlot(slot)) {
        drawTowerShape(slot.type, slot.level, TOWERS[slot.type].color);
        if (slot.boost > 0) {
          const progress = clamp(slot.boost / BOOST_TIME, 0, 1);
          ctx.strokeStyle = 'rgba(255,255,255,.92)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 28 * TOWER_SIZE_SCALE, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        ctx.fillRect(-8 * TOWER_SIZE_SCALE, -2 * TOWER_SIZE_SCALE, 16 * TOWER_SIZE_SCALE, 4 * TOWER_SIZE_SCALE);
        ctx.fillRect(-2 * TOWER_SIZE_SCALE, -8 * TOWER_SIZE_SCALE, 4 * TOWER_SIZE_SCALE, 16 * TOWER_SIZE_SCALE);
      }
      ctx.restore();

      if (game.running && selected) {
        const tower = isEmptySlot(slot) ? TOWERS[game.buildType] : TOWERS[slot.type];
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(position.angle + Math.PI / 2);
        ctx.strokeStyle = tower.color;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = 0.55 + Math.sin(game.time * 7) * 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, 30 * TOWER_SIZE_SCALE, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawEnemies() {
    for (const enemy of game.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.fillStyle = enemy.slow > 0 ? C.purple : enemy.color;
      ctx.strokeStyle = 'rgba(255,255,255,.22)';
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = enemy.behavior ? 7 : 0;

      if (enemy.behavior === 'swarm') {
        polygon(4, enemy.radius + 4, 0.785);
        ctx.fill();
        ctx.stroke();
      } else if (enemy.behavior === 'dash') {
        ctx.rotate(Math.atan2(centerY() - enemy.y, centerX() - enemy.x));
        ctx.beginPath();
        ctx.moveTo(enemy.radius + 10, 0);
        ctx.lineTo(-enemy.radius * 0.75, -enemy.radius * 0.72);
        ctx.lineTo(-enemy.radius * 0.35, 0);
        ctx.lineTo(-enemy.radius * 0.75, enemy.radius * 0.72);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (enemy.behavior === 'armor') {
        polygon(6, enemy.radius + 6, 0.52 + game.time * 0.45);
        ctx.fill();
        ctx.stroke();
      } else if (enemy.behavior === 'split') {
        ctx.beginPath();
        ctx.arc(-enemy.radius * 0.35, 0, enemy.radius * 0.62, 0, Math.PI * 2);
        ctx.arc(enemy.radius * 0.35, 0, enemy.radius * 0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      if (enemy.hp < enemy.maxHp) {
        const barWidth = Math.max(28, enemy.radius * 2.1);
        ctx.fillStyle = 'rgba(17,24,39,.8)';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 12, barWidth, 4);
        ctx.fillStyle = C.green;
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 12, barWidth * clamp(enemy.hp / enemy.maxHp, 0, 1), 4);
      }
    }
  }

  function drawShots() {
    for (const shot of game.shots) {
      ctx.globalAlpha = clamp(shot.life / 0.18, 0, 1);
      ctx.strokeStyle = shot.color;
      ctx.lineWidth = shot.beam ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y);
      ctx.lineTo(shot.tx, shot.ty);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles() {
    for (const particle of game.particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawButton(x, y, w, h, label, pressed, color, options = {}) {
    const pulse = Math.sin(game.time * 5) * 0.5 + 0.5;
    const muted = options.muted;
    const ready = options.ready;
    const rotate = options.rotate;

    ctx.save();
    ctx.fillStyle = pressed
      ? color
      : ready
        ? `rgba(79,184,216,${0.22 + 0.07 * pulse})`
        : muted
          ? 'rgba(17,24,39,.54)'
          : 'rgba(17,24,39,.78)';

    ctx.strokeStyle = pressed
      ? 'rgba(255,255,255,.48)'
      : ready
        ? `rgba(79,184,216,${0.62 + 0.2 * pulse})`
        : muted
          ? 'rgba(255,255,255,.11)'
          : color;

    ctx.lineWidth = pressed ? 2.25 : ready ? 2.15 : 1.65;
    roundedRect(x, y, w, h, 18);

    ctx.fillStyle = pressed ? '#0b0f14' : muted ? 'rgba(248,250,252,.58)' : C.white;
    ctx.font = '900 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (rotate) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(Math.PI);
      ctx.fillText(label, 0, 0);
    } else {
      ctx.fillText(label, x + w / 2, y + h / 2);
    }

    ctx.restore();
  }

  function drawControls() {
    if (!game.running) return;

    const w = clamp(canvas.width * 0.29, 100, 220);
    const h = clamp(canvas.height * 0.075, 46, 60);
    const gap = clamp(canvas.width * 0.02, 8, 18);
    const xA = Math.max(8, (canvas.width - (w * 3 + gap * 2)) / 2);
    const xB = xA + w + gap;
    const xC = xB + w + gap;
    const topY = clamp(canvas.height * 0.095, 66, 106);
    const slot = game.slots[game.selectedSlot];
    const buildTower = TOWERS[game.buildType];
    const cost = upgradeCost(slot);
    const capped = cost === null;
    const canBuy = !capped && game.money >= cost;
    const buildLabel = isEmptySlot(slot) ? 'BUILD $' + BUILD_COST : capped ? 'MAX' : 'UP $' + cost;

    let boostLabel = 'BOOST';
    let boostReady = game.boostCooldown <= 0 && !isEmptySlot(slot);

    if (slot && slot.boost > 0) {
      boostLabel = 'BOOST ' + Math.ceil(slot.boost) + 's';
      boostReady = false;
    } else if (game.boostCooldown > 0) {
      boostLabel = 'WAIT ' + Math.ceil(game.boostCooldown) + 's';
      boostReady = false;
    }

    drawButton(xA, topY, w, h, 'TYPE ' + buildTower.name, game.input.topLeft, buildTower.color, { rotate: true });
    drawButton(xB, topY, w, h, buildLabel, game.input.topMid, C.blue, { rotate: true, muted: !canBuy, ready: canBuy });
    drawButton(xC, topY, w, h, 'SLOT ' + (game.selectedSlot + 1) + '/12', game.input.topRight, C.blue, { rotate: true });

    const y = canvas.height - h - clamp(canvas.height * 0.04, 20, 34);
    drawButton(xA, y, w, h, 'ROT ◀', game.input.bottomLeft, C.rose);
    drawButton(xB, y, w, h, boostLabel, game.input.bottomMid, C.rose, { ready: boostReady });
    drawButton(xC, y, w, h, 'ROT ▶', game.input.bottomRight, C.rose);
  }

  function tutorialSteps() {
    return [
      { tower: 0, enemy: 'split', count: 1, title: 'PULSE VS SPLITTERS', body: 'Build a free Pulse tower. Splitters break into small swarm enemies, and Pulse counters them with steady cleanup shots.' },
      { tower: 1, enemy: 'armor', count: 1, title: 'BEAM VS ARMORED', body: 'Build a free Beam tower. Armored enemies have high health, and Beam counters them with focused damage.' },
      { tower: 2, enemy: 'dash', count: 2, title: 'FREEZE VS DASHERS', body: 'Build a free Freeze tower. Dashers burst forward, and Freeze counters them by slowing the rush.' },
      { tower: 3, enemy: 'swarm', count: 5, title: 'WAVE VS SWARM', body: 'Build a free Wave tower. Swarm enemies come in packs, and Wave counters them by hitting groups at once.' }
    ];
  }

  function spawnTutorialEnemy(behavior, offset = 0) {
    const margin = 34;
    let x = -margin;
    let y = centerY();

    if (behavior === 'swarm') {
      const dx = ((offset % 3) - 1) * 18;
      const dy = (Math.floor(offset / 3) - 1) * 16;
      x += dx;
      y += dy;
    } else {
      const side = game.tutorial.enemiesSpawned % 4;
      if (side === 1) { x = canvas.width + margin; y = centerY(); }
      if (side === 2) { x = centerX(); y = -margin; }
      if (side === 3) { x = centerX(); y = canvas.height + margin; }
    }

    const enemy = { x, y, hp: 6, maxHp: 6, speed: 34, slow: 0, radius: 12 * ENEMY_SIZE_SCALE, reward: 0, kind: 'medium', color: '#a8a29e', behavior: null };
    if (behavior === 'swarm') { enemy.kind = 'small'; enemy.radius = 7 * ENEMY_SIZE_SCALE; enemy.hp = enemy.maxHp = 2; enemy.speed = 44; enemy.color = '#facc15'; }
    else if (behavior === 'dash') { enemy.hp = enemy.maxHp = 8; enemy.speed = 32; enemy.color = '#fb7185'; enemy.dashCooldown = 0.7; enemy.dashTime = 0; }
    else if (behavior === 'armor') { enemy.kind = 'large'; enemy.radius = 18 * ENEMY_SIZE_SCALE; enemy.hp = enemy.maxHp = 16; enemy.speed = 20; enemy.color = '#94a3b8'; }
    else if (behavior === 'split') { enemy.radius = 12 * ENEMY_SIZE_SCALE; enemy.hp = enemy.maxHp = 10; enemy.speed = 28; enemy.color = '#c084fc'; enemy.splitDone = false; }
    enemy.behavior = behavior;
    game.enemies.push(enemy);
    game.tutorial.enemiesSpawned += 1;
  }

  function updateTutorial() {
    if (!IS_TUTORIAL || !game.running) return;
    const steps = tutorialSteps();
    const t = game.tutorial;
    const step = steps[Math.min(t.step, steps.length - 1)];

    t.messageTime = Math.max(0, (t.messageTime || 0) - (1 / 60));

    if (!t.waveStarted) {
      game.money = 20;
      game.coreHp = 10;
      game.maxCoreHp = 10;
      game.wave = 1;
      t.waveStarted = true;
      game.buildType = step.tower;
      t.prevCount = game.slots.filter((s) => s.level > 0 && s.type === step.tower).length;
      t.messageTime = 999;
    }

    if (t.phase === 'build') {
      game.buildType = step.tower;
      const nowCount = game.slots.filter((s) => s.level > 0 && s.type === step.tower).length;
      if (nowCount > t.prevCount) {
        t.phase = 'explain';
        t.waitUntil = game.time + 2.5;
        t.messageTime = 3;
      }
      return;
    }

    if (t.phase === 'explain') {
      if (game.time >= t.waitUntil) {
        t.phase = 'fight';
        t.enemiesSpawned = 0;
        t.messageTime = 7;
      }
      return;
    }

    if (t.phase === 'fight') {
      if (game.enemies.length === 0 && t.enemiesSpawned < step.count) {
        if (step.enemy === 'swarm') for (let i = 0; i < step.count; i++) spawnTutorialEnemy('swarm', i);
        else spawnTutorialEnemy(step.enemy);
      } else if (game.enemies.length === 0 && t.enemiesSpawned >= step.count) {
        t.step += 1;
        if (t.step >= steps.length) {
          t.completed = true;
          endGame('Tutorial complete. You learned which towers counter each enemy type.', true);
          return;
        }
        t.phase = 'build';
        const nextStep = steps[t.step];
        game.buildType = nextStep.tower;
        t.prevCount = game.slots.filter((s) => s.level > 0 && s.type === nextStep.tower).length;
        t.messageTime = 999;
      }
    }
  }

  function drawTutorialMessage() {
    if (!IS_TUTORIAL || !game.running) return;
    const steps = tutorialSteps();
    const t = game.tutorial;
    const step = steps[Math.min(t.step, steps.length - 1)];
    const title = t.phase === 'build' ? `Step ${t.step + 1}: ${step.title}` : t.phase === 'fight' ? `Counter Test: ${step.enemy.toUpperCase()}` : 'GOOD COUNTER';
    const body = t.phase === 'build'
      ? `${step.body} Use TYPE if needed, then tap BUILD.`
      : t.phase === 'fight'
        ? 'Rotate the ring and defeat the spawned enemies.'
        : 'Nice. Next tower coming up.';

    const w = Math.min(canvas.width * 0.92, 540);
    const h = 96;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height - 210;
    ctx.save();
    ctx.fillStyle = 'rgba(17,24,39,.84)';
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 1.2;
    roundedRect(x, y, w, h, 14);
    ctx.fillStyle = C.white;
    ctx.font = '900 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, x + w / 2, y + 10);
    ctx.fillStyle = 'rgba(248,250,252,.9)';
    ctx.font = '700 12px Arial';
    ctx.fillText(body, x + w / 2, y + 38);
    ctx.restore();
  }

  function drawHud() {
    if (!game.running) return;

    const y = clamp(canvas.height * 0.02, 14, 28);
    const w = clamp(canvas.width * 0.25, 110, 160);
    const h = clamp(canvas.height * 0.042, 28, 36);
    const gap = 10;
    const x1 = canvas.width / 2 - (w * 2 + gap) / 2;
    const x2 = x1 + w + gap;

    function pill(x, label) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(Math.PI);
      ctx.fillStyle = 'rgba(17,24,39,.82)';
      ctx.strokeStyle = 'rgba(255,255,255,.16)';
      roundedRect(-w / 2, -h / 2, w, h, 15);
      ctx.fillStyle = C.white;
      ctx.font = '900 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 1);
      ctx.restore();
    }

    pill(x1, IS_TUTORIAL ? 'Tutorial' : 'Wave ' + Math.max(1, game.wave || 1) + '/' + (ENDLESS ? '∞' : TARGET_WAVES));
    pill(x2, 'Money $' + game.money);
  }

  function render() {
    drawBackground();
    drawShots();
    drawEnemies();
    drawCore();
    drawSlots();
    drawParticles();
    drawHud();
    drawControls();
    drawTutorialMessage();

    const oldHud = document.getElementById('hud');
    if (oldHud) oldHud.style.display = 'none';
  }

  // ============================================================
  // INPUT
  // ============================================================
  function overlayVisible() {
    return !startOverlay.classList.contains('hidden') || !endOverlay.classList.contains('hidden');
  }

  function inputKeyForTouch(touch) {
    const top = touch.clientY < canvas.height / 2;
    const third = touch.clientX / canvas.width;

    if (top) return third < 0.333 ? 'topLeft' : third < 0.666 ? 'topMid' : 'topRight';
    return third < 0.333 ? 'bottomLeft' : third < 0.666 ? 'bottomMid' : 'bottomRight';
  }

  [startOverlay, startButton, restartButton].forEach((element) => {
    element.addEventListener('touchstart', startGame, { passive: false });
    element.addEventListener('pointerdown', startGame);
    element.addEventListener('click', startGame);
  });

  document.addEventListener('touchstart', (event) => {
    if (overlayVisible()) return;
    event.preventDefault();
    for (const touch of event.changedTouches) game.input[inputKeyForTouch(touch)] = true;
  }, { passive: false });

  document.addEventListener('touchend', (event) => {
    if (overlayVisible()) return;
    event.preventDefault();
    for (const touch of event.changedTouches) game.input[inputKeyForTouch(touch)] = false;
  }, { passive: false });

  document.addEventListener('touchcancel', (event) => {
    if (overlayVisible()) return;
    event.preventDefault();
    for (const touch of event.changedTouches) game.input[inputKeyForTouch(touch)] = false;
  }, { passive: false });

  // ============================================================
  // MAIN LOOP
  // ============================================================
  function loop(now) {
    const dt = Math.min(0.033, (now - lastFrame) / 1000);
    lastFrame = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
  render();
})();
