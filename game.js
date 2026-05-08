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
  worldWidth: 3600,
  startX: 1800,
  leftGoalX: 180,
  rightGoalX: 3420,
  timeLimit: 165,
  holdRequired: 3,
  bridgeBaseYRatio: 0.58
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
  cameraX: 0,
  gravity: 0.55,
  holdProgress: 0,
  totalFalls: 0,
  checkpointsReached: 0,
  players: []
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function worldToScreenX(x) {
  return x - game.cameraX;
}

function bridgeYAt(x) {
  const t = x / LEVEL.worldWidth;
  const base = canvas.height * LEVEL.bridgeBaseYRatio;
  const longWave = Math.sin(game.sway + t * Math.PI * 8) * 52;
  const shortWave = Math.sin(game.sway * 1.7 + t * Math.PI * 22) * 18;
  const sag = Math.sin(t * Math.PI) * 44;
  return base + longWave + shortWave + sag;
}

function createPlayer(side) {
  return {
    side,
    x: LEVEL.startX + (side === 'left' ? 70 : -70),
    y: canvas.height * 0.44,
    vx: 0,
    vy: 0,
    radius: 24,
    grounded: false,
    color: side === 'left' ? '#38bdf8' : '#fb7185',
    goalX: side === 'left' ? LEVEL.leftGoalX : LEVEL.rightGoalX,
    reachedGoal: false,
    respawnTimer: 0,
    checkpointX: LEVEL.startX,
    wobble: Math.random() * Math.PI * 2
  };
}

function resetGame() {
  game.timer = LEVEL.timeLimit;
  game.bridgeStress = 0;
  game.sway = 0;
  game.swayVelocity = 0;
  game.cameraX = LEVEL.startX - canvas.width / 2;
  game.holdProgress = 0;
  game.totalFalls = 0;
  game.checkpointsReached = 0;
  game.running = true;
  game.players = [createPlayer('left'), createPlayer('right')];
  endOverlay.classList.add('hidden');
}

function endGame(win) {
  game.running = false;
  endOverlay.classList.remove('hidden');

  if (win) {
    resultTitle.textContent = 'Bridge Cleared!';
    resultText.textContent = 'Both players survived the full crossing.';
  } else {
    resultTitle.textContent = 'Run Failed';
    resultText.textContent = game.timer <= 0 ? 'Time ran out on the long bridge.' : 'Too much chaos destroyed the run.';
  }

  const distance = Math.round(Math.max(
    Math.abs(game.players[0]?.x - LEVEL.startX || 0),
    Math.abs(game.players[1]?.x - LEVEL.startX || 0)
  ));

  finalStats.innerHTML = `Falls: ${game.totalFalls}<br>Time Left: ${Math.ceil(Math.max(0, game.timer))}s<br>Best Distance: ${distance}m`;
}

function updateCamera() {
  if (!game.players.length) return;
  const midpoint = (game.players[0].x + game.players[1].x) / 2;
  const target = clamp(midpoint - canvas.width / 2, 0, LEVEL.worldWidth - canvas.width);
  game.cameraX += (target - game.cameraX) * 0.08;
}

function updateCheckpoint(player) {
  const progressFromStart = Math.abs(player.x - LEVEL.startX);
  const savedProgress = Math.abs(player.checkpointX - LEVEL.startX);

  if (progressFromStart > savedProgress + 450) {
    player.checkpointX = player.x;
    game.checkpointsReached += 1;
    game.timer += 5;
    game.bridgeStress = Math.max(0, game.bridgeStress - 12);
  }
}

function respawnPlayer(player) {
  player.x = player.checkpointX;
  player.y = canvas.height * 0.38;
  player.vx = 0;
  player.vy = 0;
  player.respawnTimer = 12;
  game.totalFalls += 1;
  game.timer = Math.max(0, game.timer - 8);
  game.bridgeStress += 11;
}

function handleMovement(player) {
  if (player.respawnTimer > 0) {
    player.respawnTimer -= 1;
    return;
  }

  const moveDirection = player.side === 'left' ? -1 : 1;
  const held = player.side === 'left' ? game.leftTouch : game.rightTouch;
  const centerDistance = Math.abs(player.x - LEVEL.startX) / (LEVEL.worldWidth / 2);
  const sideLoad = (player.x - LEVEL.startX) / (LEVEL.worldWidth / 2);

  if (held) {
    player.vx += moveDirection * 0.23;
    game.swayVelocity += sideLoad * 0.0065;
    game.bridgeStress += 0.035 + centerDistance * 0.055;
  }

  player.vx *= player.grounded ? 0.895 : 0.965;
  player.vy += game.gravity;

  player.x += player.vx;
  player.y += player.vy;

  const by = bridgeYAt(player.x);

  if (player.y > by) {
    const impact = Math.abs(player.vy);
    player.y = by;
    player.vy *= -0.16;
    player.grounded = true;

    if (impact > 8) {
      game.bridgeStress += impact * 0.45;
      game.swayVelocity += sideLoad * impact * 0.006;
    }
  } else {
    player.grounded = false;
  }

  player.x = clamp(player.x, 45, LEVEL.worldWidth - 45);

  const jumpReady = player.side === 'left' ? game.leftSwipeReady : game.rightSwipeReady;

  if (jumpReady && player.grounded) {
    player.vy = -14.5;
    game.bridgeStress += 9 + centerDistance * 6;
    game.swayVelocity += player.side === 'left' ? -0.065 : 0.065;

    if (player.side === 'left') {
      game.leftSwipeReady = false;
    } else {
      game.rightSwipeReady = false;
    }
  }

  if (player.y > canvas.height + 140) {
    respawnPlayer(player);
  }

  updateCheckpoint(player);

  player.reachedGoal =
    player.side === 'left'
      ? player.x <= player.goalX
      : player.x >= player.goalX;
}

function update(delta) {
  if (!game.running) return;

  game.timer -= delta;

  if (game.timer <= 0) {
    endGame(false);
    return;
  }

  game.bridgeStress *= 0.997;
  game.bridgeStress += delta * 0.22;

  game.sway += game.swayVelocity;
  game.swayVelocity *= 0.986;

  game.players.forEach(handleMovement);
  updateCamera();

  if (game.bridgeStress >= 100) {
    endGame(false);
    return;
  }

  if (game.players.every(p => p.reachedGoal)) {
    game.holdProgress += delta;

    if (game.holdProgress >= LEVEL.holdRequired) {
      endGame(true);
      return;
    }
  } else {
    game.holdProgress = Math.max(0, game.holdProgress - delta * 0.45);
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
  for (let i = 0; i < 24; i++) {
    const x = ((i * 230 - game.cameraX * 0.2) % (canvas.width + 260)) - 130;
    const y = 70 + (i % 5) * 34;
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

  const visibleStart = clamp(game.cameraX - 100, 0, LEVEL.worldWidth);
  const visibleEnd = clamp(game.cameraX + canvas.width + 100, 0, LEVEL.worldWidth);
  const steps = 80;

  for (let i = 0; i <= steps; i++) {
    const x = visibleStart + ((visibleEnd - visibleStart) * i) / steps;
    const y = bridgeYAt(x);
    const sx = worldToScreenX(x);

    if (i === 0) ctx.moveTo(sx, y);
    else ctx.lineTo(sx, y);
  }

  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  for (let x = Math.floor(visibleStart / 120) * 120; x <= visibleEnd; x += 120) {
    const sx = worldToScreenX(x);
    const y = bridgeYAt(x);
    ctx.beginPath();
    ctx.moveTo(sx, y - 18);
    ctx.lineTo(sx, y + 18);
    ctx.stroke();
  }

  drawGoal(LEVEL.leftGoalX, 'LEFT EXIT');
  drawGoal(LEVEL.rightGoalX, 'RIGHT EXIT');

  for (let x = 450; x < LEVEL.worldWidth; x += 450) {
    const sx = worldToScreenX(x);
    if (sx < -40 || sx > canvas.width + 40) continue;
    ctx.fillStyle = 'rgba(56,189,248,0.35)';
    ctx.fillRect(sx - 8, bridgeYAt(x) - 70, 16, 70);
  }
}

function drawGoal(x, label) {
  const sx = worldToScreenX(x);
  const y = bridgeYAt(x);
  if (sx < -120 || sx > canvas.width + 120) return;

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(sx - 14, y - 95, 28, 95);

  ctx.shadowBlur = 22;
  ctx.shadowColor = '#fde047';
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(sx, y - 112, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, sx, y - 142);
}

function drawPlayers() {
  game.players.forEach(player => {
    player.wobble += 0.08;
    const bounce = Math.sin(player.wobble) * 2;
    const sx = worldToScreenX(player.x);

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(sx, player.y - 32 + bounce, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(sx - 18, player.y - 10, 36, 42);

    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(sx - 8, player.y - 36 + bounce, 3, 0, Math.PI * 2);
    ctx.arc(sx + 8, player.y - 36 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();

    if (player.reachedGoal) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, player.y - 30, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawProgressBar() {
  const margin = 26;
  const y = canvas.height - 34;
  const width = canvas.width - margin * 2;

  ctx.fillStyle = 'rgba(15,23,42,0.75)';
  ctx.fillRect(margin, y, width, 12);

  game.players.forEach(player => {
    const progress = player.side === 'left'
      ? 1 - (player.x - LEVEL.leftGoalX) / (LEVEL.startX - LEVEL.leftGoalX)
      : (player.x - LEVEL.startX) / (LEVEL.rightGoalX - LEVEL.startX);

    const px = margin + clamp(progress, 0, 1) * width;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(px, y + 6, 9, 0, Math.PI * 2);
    ctx.fill();
  });
}

function render() {
  drawBackground();
  drawBridge();
  drawPlayers();
  drawProgressBar();
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
