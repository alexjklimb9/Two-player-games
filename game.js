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
  if (game?.players?.length) {
    game.players.forEach(player => keepPlayerVisible(player, true));
  }
}

window.addEventListener('resize', resize);

const LEVEL = {
  timeLimit: 180,
  holdRequired: 7,
  bridgeBaseYRatio: 0.58,
  stagesToWin: 5,
  safePadding: 42,
  targetRadius: 30
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
  objectiveIndex: 0,
  wind: 0,
  players: []
};

resize();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeMinX() { return LEVEL.safePadding; }
function safeMaxX() { return canvas.width - LEVEL.safePadding; }
function safeMinY() { return 88; }
function safeMaxY() { return canvas.height - 70; }
function bridgeLeft() { return safeMinX(); }
function bridgeRight() { return safeMaxX(); }
function bridgeWidth() { return Math.max(1, bridgeRight() - bridgeLeft()); }
function centerX() { return canvas.width / 2; }

function bridgeYAt(x) {
  const t = clamp((x - bridgeLeft()) / bridgeWidth(), 0, 1);
  const base = canvas.height * LEVEL.bridgeBaseYRatio;
  const stageAmp = 20 + game.stage * 8;
  const longWave = Math.sin(game.sway + t * Math.PI * (3.2 + game.stage * 0.45)) * stageAmp;
  const shortWave = Math.sin(game.sway * 1.7 + t * Math.PI * (8 + game.stage * 1.7)) * (6 + game.stage * 2.5);
  const sag = Math.sin(t * Math.PI) * (14 + game.stage * 6);
  return clamp(base + longWave + shortWave + sag, safeMinY() + 80, safeMaxY());
}

function pos(ratio) {
  return safeMinX() + bridgeWidth() * ratio;
}

function keepPlayerVisible(player, resetVelocity = false) {
  const minX = safeMinX() + player.radius;
  const maxX = safeMaxX() - player.radius;
  const minY = safeMinY() + player.radius;
  const maxY = safeMaxY();
  const oldX = player.x;
  const oldY = player.y;

  player.x = clamp(player.x, minX, maxX);
  player.y = clamp(player.y, minY, maxY);

  if (resetVelocity || player.x !== oldX) player.vx = 0;
  if (resetVelocity || player.y !== oldY) player.vy = Math.min(0, player.vy);
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

function stageObjectives() {
  const stages = [
    [
      { left: 0.2, right: 0.8, label: 'Split wide and hold' },
      { left: 0.38, right: 0.62, label: 'Return near center' }
    ],
    [
      { left: 0.32, right: 0.68, label: 'Balance the middle marks' },
      { left: 0.16, right: 0.84, label: 'Stretch to the edges' },
      { left: 0.45, right: 0.55, label: 'Regroup carefully' }
    ],
    [
      { left: 0.24, right: 0.76, label: 'Hold through wind' },
      { left: 0.12, right: 0.88, label: 'Danger edge hold' },
      { left: 0.36, right: 0.64, label: 'Recover balance' }
    ],
    [
      { left: 0.42, right: 0.58, label: 'Tight center hold' },
      { left: 0.14, right: 0.86, label: 'Full bridge stretch' },
      { left: 0.3, right: 0.7, label: 'Outer marks again' }
    ],
    [
      { left: 0.18, right: 0.82, label: 'Final split hold' },
      { left: 0.48, right: 0.52, label: 'Final center squeeze' },
      { left: 0.1, right: 0.9, label: 'Final edge survival' }
    ]
  ];
  return stages[Math.min(game.stage - 1, stages.length - 1)];
}

function currentObjective() {
  const objectives = stageObjectives();
  return objectives[Math.min(game.objectiveIndex, objectives.length - 1)];
}

function targetXFor(player) {
  const objective = currentObjective();
  return pos(player.side === 'left' ? objective.left : objective.right);
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
  game.objectiveIndex = 0;
  game.wind = 0;
  game.running = true;
  game.players = [createPlayer('left'), createPlayer('right')];
  game.players.forEach(player => keepPlayerVisible(player, true));
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

  finalStats.innerHTML = `Stage Reached: ${Math.min(game.stage, LEVEL.stagesToWin)}/${LEVEL.stagesToWin}<br>Objective: ${game.objectiveIndex + 1}/${stageObjectives().length}<br>Falls: ${game.totalFalls}<br>Time Left: ${Math.ceil(Math.max(0, game.timer))}s`;
}

function advanceObjective() {
  game.objectiveIndex += 1;
  game.holdProgress = 0;
  game.bridgeStress = Math.max(0, game.bridgeStress - 10);

  if (game.objectiveIndex >= stageObjectives().length) {
    game.stage += 1;
    game.objectiveIndex = 0;
    game.stageTimer = 0;
    game.timer += 10;
    game.bridgeStress = Math.max(0, game.bridgeStress - 22);

    game.players.forEach(player => {
      player.x = centerX() + (player.side === 'left' ? 58 : -58);
      player.y = canvas.height * 0.43;
      player.vx = 0;
      player.vy = 0;
      keepPlayerVisible(player, true);
    });

    if (game.stage > LEVEL.stagesToWin) endGame(true);
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
  keepPlayerVisible(player, true);
}

function handleMovement(player) {
  if (player.respawnTimer > 0) {
    player.respawnTimer -= 1;
    keepPlayerVisible(player, true);
    return;
  }

  const moveDirection = player.side === 'left' ? -1 : 1;
  const held = player.side === 'left' ? game.leftTouch : game.rightTouch;
  const sideLoad = (player.x - centerX()) / Math.max(1, canvas.width / 2);
  const edgeRisk = Math.abs(sideLoad);

  if (held) {
    player.vx += moveDirection * 0.13;
    game.swayVelocity += sideLoad * (0.0055 + game.stage * 0.001);
    game.bridgeStress += 0.038 + edgeRisk * 0.06 + game.stage * 0.007;
  }

  player.vx += game.wind * 0.013;
  player.vx *= player.grounded ? 0.86 : 0.95;
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

  keepPlayerVisible(player);

  const jumpReady = player.side === 'left' ? game.leftSwipeReady : game.rightSwipeReady;

  if (jumpReady && player.grounded) {
    player.vy = -13.5;
    game.bridgeStress += 8 + edgeRisk * 8 + game.stage;
    game.swayVelocity += player.side === 'left' ? -0.06 : 0.06;

    if (player.side === 'left') game.leftSwipeReady = false;
    else game.rightSwipeReady = false;
  }

  keepPlayerVisible(player);
  player.reachedGoal = Math.abs(player.x - targetXFor(player)) < LEVEL.targetRadius;
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
  game.wind = windPulse * Math.max(0, game.stage - 1) * 0.34;

  game.bridgeStress *= 0.9965;
  game.bridgeStress += delta * (0.2 + game.stage * 0.14);

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
      advanceObjective();
      return;
    }
  } else {
    game.holdProgress = Math.max(0, game.holdProgress - delta * 0.6);
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

  ctx.strokeStyle = 'rgba(248,250,252,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(safeMinX(), safeMinY(), safeMaxX() - safeMinX(), safeMaxY() - safeMinY());

  drawGoal(targetXFor({ side: 'left' }), 'LEFT');
  drawGoal(targetXFor({ side: 'right' }), 'RIGHT');
}

function drawGoal(x, label) {
  const y = bridgeYAt(x);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x - 12, y - 70, 24, 70);

  ctx.shadowBlur = 22;
  ctx.shadowColor = '#fde047';
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(x, y - 86, LEVEL.targetRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#020617';
  ctx.font = '900 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 82);
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
  const totalObjectives = Array.from({ length: LEVEL.stagesToWin }, (_, i) => {
    const oldStage = game.stage;
    game.stage = i + 1;
    const count = stageObjectives().length;
    game.stage = oldStage;
    return count;
  }).reduce((a, b) => a + b, 0);

  let completed = 0;
  for (let s = 1; s < game.stage; s++) {
    const oldStage = game.stage;
    game.stage = s;
    completed += stageObjectives().length;
    game.stage = oldStage;
  }
  completed += game.objectiveIndex + game.holdProgress / LEVEL.holdRequired;

  ctx.fillStyle = 'rgba(15,23,42,0.75)';
  ctx.fillRect(margin, y, width, 12);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(margin, y, width * clamp(completed / totalObjectives, 0, 1), 12);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`STAGE ${Math.min(game.stage, LEVEL.stagesToWin)} / ${LEVEL.stagesToWin} · OBJECTIVE ${game.objectiveIndex + 1} / ${stageObjectives().length} · ${currentObjective().label}`, canvas.width / 2, y - 10);
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

window.addEventListener('touchmove', event => event.preventDefault(), { passive: false });

window.addEventListener('touchend', event => {
  for (const touch of event.changedTouches) {
    const isLeft = touch.clientX < window.innerWidth / 2;
    if (isLeft) {
      game.leftTouch = false;
      if (leftStartY - touch.clientY > 40) game.leftSwipeReady = true;
    } else {
      game.rightTouch = false;
      if (rightStartY - touch.clientY > 40) game.rightSwipeReady = true;
    }
  }
}, { passive: false });

startButton.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  resetGame();
});

restartButton.addEventListener('click', resetGame);

render();
