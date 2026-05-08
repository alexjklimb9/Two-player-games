const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const finalStats = document.getElementById('finalStats');
const timeText = document.getElementById('timeText');
const stressText = document.getElementById('stressText');
const fallText = document.getElementById('fallText');
const holdText = document.getElementById('holdText');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

const LEVEL = {
  timeLimit: 150,
  holdRequired: 3,
  bridgeBaseYRatio: 0.58,
  stagesToWin: 4
};

const game = {
  running: false,
  timer: LEVEL.timeLimit,
  bridgeStress: 0,
  leftTouch: false,
  rightTouch: false,
  leftSwipeReady: false,
  rightSwipeReady: false,
  sway: 0,
  swayVelocity: 0,
  gravity: 0.55,
  holdProgress: 0,
  totalFalls: 0,
  stage: 1,
  stageTimer: 0,
  wind: 0,
  players: []
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function bridgeLeft() {
  return 70;
}

function bridgeRight() {
  return canvas.width - 70;
}

function bridgeWidth() {
  return bridgeRight() - bridgeLeft();
}

function bridgeYAt(x) {
  const t = (x - bridgeLeft()) / bridgeWidth();
  const base = canvas.height * LEVEL.bridgeBaseYRatio;
  const stageAmp = 25 + game.stage * 9;
  const longWave = Math.sin(game.sway + t * Math.PI * (3.8 + game.stage * 0.5)) * stageAmp;
  const shortWave = Math.sin(game.sway * 1.8 + t * Math.PI * (9 + game.stage * 2)) * (8 + game.stage * 3);
  const sag = Math.sin(t * Math.PI) * (18 + game.stage * 8);
  return base + longWave + shortWave + sag;
}

function leftGoalX() {
  return 118;
}

function rightGoalX() {
  return canvas.width - 118;
}

function centerX() {
  return canvas.width / 2;
}

function createPlayer(side) {
  return {
    side,
    x: centerX() + (side === 'left' ? 58 : -58),
    y: canvas.height * 0.43,
    vx: 0,
    vy: 0,
    radius: 24,
    grounded: false,
    color: side === 'left' ? '#38bdf8' : '#fb7185',
    reachedGoal: false,
    respawnTimer: 0,
    wobble: Math.random() * Math.PI * 2
  };
}

function resetGame() {
  game.timer = LEVEL.timeLimit;
  game.bridgeStress = 0;
  game.sway = 0;
  game.swayVelocity = 0;
  game.holdProgress = 0;
  game.totalFalls = 0;
  game.stage = 1;
  game.stageTimer = 0;
  game.wind = 0;
  game.running = true;
  game.players = [createPlayer('left'), createPlayer('right')];
  endOverlay.classList.add('hidden');
}

function endGame(win) {
  game.running = false;
  endOverlay.classList.remove('hidden');

  if (win) {
    resultTitle.textContent = 'Bridge Cleared!';
    resultText.textContent = 'Both players survived every stage together.';
  } else {
    resultTitle.textContent = 'Run Failed';
    resultText.textContent = game.timer <= 0 ? 'Time ran out before the final stage.' : 'Too much chaos destroyed the bridge.';
  }

  finalStats.innerHTML = `Stage Reached: ${game.stage}/${LEVEL.stagesToWin}<br>Falls: ${game.totalFalls}<br>Time Left: ${Math.ceil(Math.max(0, game.timer))}s`;
}

function stageTargets() {
  const padding = 105;
  const center = centerX();
  const patterns = [
    { left: leftGoalX(), right: rightGoalX(), label: 'Split to both ends' },
    { left: center - 160, right: center + 160, label: 'Meet near the middle' },
    { left: padding + 180, right: canvas.width - padding - 180, label: 'Hold the outer marks' },
    { left: leftGoalX(), right: rightGoalX(), label: 'Final crossing' }
  ];
  return patterns[Math.min(game.stage - 1, patterns.length - 1)];
}

function advanceStage() {
  game.stage += 1;
  game.holdProgress = 0;
  game.stageTimer = 0;
  game.timer += 12;
  game.bridgeStress = Math.max(0, game.bridgeStress - 25);
  game.players.forEach(player => {
    player.x = centerX() + (player.side === 'left' ? 58 : -58);
    player.y = canvas.height * 0.43;
    player.vx = 0;
    player.vy = 0;
  });

  if (game.stage > LEVEL.stagesToWin) {
    endGame(true);
  }
}

function respawnPlayer(player) {
  player.x = centerX() + (player.side === 'left' ? 58 : -58);
  player.y = canvas.height * 0.38;
  player.vx = 0;
  player.vy = 0;
  player.respawnTimer = 12;
  game.totalFalls += 1;
  game.timer = Math.max(0, game.timer - 7);
  game.bridgeStress += 12;
  game.holdProgress = 0;
}

function handleMovement(player) {
  if (player.respawnTimer > 0) {
    player.respawnTimer -= 1;
    return;
  }

  const moveDirection = player.side === 'left' ? -1 : 1;
  const held = player.side === 'left' ? game.leftTouch : game.rightTouch;
  const sideLoad = (player.x - centerX()) / (canvas.width / 2);
  const edgeRisk = Math.abs(sideLoad);

  if (held) {
    player.vx += moveDirection * 0.25;
    game.swayVelocity += sideLoad * (0.0055 + game.stage * 0.001);
    game.bridgeStress += 0.032 + edgeRisk * 0.055 + game.stage * 0.006;
  }

  player.vx += game.wind * 0.015;
  player.vx *= player.grounded ? 0.895 : 0.965;
  player.vy += game.gravity;

  player.x += player.vx;
  player.y += player.vy;

  const by = bridgeYAt(player.x);

  if (player.y > by) {
    const impact = Math.abs(player.vy);
    player.y = by;
    player.vy *= -0.15;
    player.grounded = true;

    if (impact > 8) {
      game.bridgeStress += impact * 0.45;
      game.swayVelocity += sideLoad * impact * 0.006;
    }
  } else {
    player.grounded = false;
  }

  player.x = clamp(player.x, bridgeLeft() + 5, bridgeRight() - 5);

  const jumpReady = player.side === 'left' ? game.leftSwipeReady : game.rightSwipeReady;

  if (jumpReady && player.grounded) {
    player.vy = -14.5;
    game.bridgeStress += 8 + edgeRisk * 8 + game.stage;
    game.swayVelocity += player.side === 'left' ? -0.06 : 0.06;

    if (player.side === 'left') {
      game.leftSwipeReady = false;
    } else {
      game.rightSwipeReady = false;
    }
  }

  if (player.y > canvas.height + 120) {
    respawnPlayer(player);
  }

  const targets = stageTargets();
  const targetX = player.side === 'left' ? targets.left : targets.right;
  player.reachedGoal = Math.abs(player.x - targetX) < 42;
}

function update(delta) {
  if (!game.running) return;

  game.timer -= delta;
  game.stageTimer += delta;

  if (game.timer <= 0) {
    endGame(false);
    return;
  }

  const windPulse = Math.sin(game.stageTimer * (0.8 + game.stage * 0.2));
  game.wind = windPulse * Math.max(0, game.stage - 1) * 0.38;

  game.bridgeStress *= 0.9965;
  game.bridgeStress += delta * (0.18 + game.stage * 0.14);

  game.sway += game.swayVelocity;
  game.swayVelocity *= 0.985;

  game.players.forEach(handleMovement);

  if (game.bridgeStress >= 100) {
    endGame(false);
    return;
  }

  if (game.players.every(p => p.reachedGoal)) {
    game.holdProgress += delta;

    if (game.holdProgress >= LEVEL.holdRequired) {
      advanceStage();
      return;
    }
  } else {
    game.holdProgress = Math.max(0, game.holdProgress - delta * 0.55);
  }

  timeText.textContent = Math.ceil(game.timer);
  stressText.textContent = `${Math.floor(game.bridgeStress)}%`;
  fallText.textContent = game.totalFalls;
  holdText.textContent = `${Math.min(100, Math.floor((game.holdProgress / LEVEL.holdRequired) * 100))}%`;
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#1e293b');
  sky.addColorStop(0.55, '#0f172a');
  sky.addColorStop(1, '#111827');

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 28; i++) {
    const x = (i * 137 + Math.sin(game.stageTimer * 0.2 + i) * 18) % canvas.width;
    const y = 60 + (i % 6) * 32;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);
}

function drawBridge() {
  ctx.lineWidth = 16;
  ctx.strokeStyle = game.bridgeStress > 72 ? '#dc2626' : '#8b5e34';

  ctx.beginPath();

  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const x = bridgeLeft() + (bridgeWidth() * i) / steps;
    const y = bridgeYAt(x);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  for (let x = bridgeLeft(); x <= bridgeRight(); x += 55) {
    const y = bridgeYAt(x);
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y + 18);
    ctx.stroke();
  }

  const targets = stageTargets();
  drawGoal(targets.left, 'LEFT');
  drawGoal(targets.right, 'RIGHT');
}

function drawGoal(x, label) {
  const y = bridgeYAt(x);

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x - 12, y - 70, 24, 70);

  ctx.shadowBlur = 22;
  ctx.shadowColor = '#fde047';
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(x, y - 86, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 112);
}

function drawPlayers() {
  game.players.forEach(player => {
    player.wobble += 0.08;
    const bounce = Math.sin(player.wobble) * 2;

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 32 + bounce, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(player.x - 18, player.y - 10, 36, 42);

    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(player.x - 8, player.y - 36 + bounce, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 8, player.y - 36 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();

    if (player.reachedGoal) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y - 30, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawStageBar() {
  const margin = 26;
  const y = canvas.height - 34;
  const width = canvas.width - margin * 2;

  ctx.fillStyle = 'rgba(15,23,42,0.75)';
  ctx.fillRect(margin, y, width, 12);

  const progress = (game.stage - 1 + game.holdProgress / LEVEL.holdRequired) / LEVEL.stagesToWin;
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(margin, y, width * clamp(progress, 0, 1), 12);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`STAGE ${Math.min(game.stage, LEVEL.stagesToWin)} / ${LEVEL.stagesToWin} · ${stageTargets().label}`, canvas.width / 2, y - 10);
}

function render() {
  drawBackground();
  drawBridge();
  drawPlayers();
  drawStageBar();
}

let lastTime = performance.now();

function loop(now) {
  const delta = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  update(delta);
  render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

let leftStartY = 0;
let rightStartY = 0;

window.addEventListener('touchstart', event => {
  for (const touch of event.changedTouches) {
    const isLeft = touch.clientX < window.innerWidth / 2;

    if (isLeft) {
      game.leftTouch = true;
      leftStartY = touch.clientY;
    } else {
      game.rightTouch = true;
      rightStartY = touch.clientY;
    }
  }
}, { passive: false });

window.addEventListener('touchmove', event => {
  event.preventDefault();
}, { passive: false });

window.addEventListener('touchend', event => {
  for (const touch of event.changedTouches) {
    const isLeft = touch.clientX < window.innerWidth / 2;

    if (isLeft) {
      game.leftTouch = false;

      if (leftStartY - touch.clientY > 40) {
        game.leftSwipeReady = true;
      }
    } else {
      game.rightTouch = false;

      if (rightStartY - touch.clientY > 40) {
        game.rightSwipeReady = true;
      }
    }
  }
}, { passive: false });

startButton.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  resetGame();
});

restartButton.addEventListener('click', () => {
  resetGame();
});

render();
