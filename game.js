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

const game = {
  running: false,
  timer: 90,
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
  players: []
};

function createPlayer(side) {
  return {
    side,
    x: canvas.width / 2 + (side === 'left' ? 50 : -50),
    y: canvas.height * 0.58,
    vx: 0,
    vy: 0,
    radius: 24,
    grounded: true,
    color: side === 'left' ? '#38bdf8' : '#fb7185',
    goalX: side === 'left' ? 130 : canvas.width - 130,
    reachedGoal: false,
    respawnTimer: 0,
    wobble: Math.random() * Math.PI * 2
  };
}

function resetGame() {
  game.timer = 90;
  game.bridgeStress = 0;
  game.sway = 0;
  game.swayVelocity = 0;
  game.holdProgress = 0;
  game.totalFalls = 0;
  game.running = true;
  game.players = [createPlayer('left'), createPlayer('right')];
  endOverlay.classList.add('hidden');
}

function endGame(win) {
  game.running = false;
  endOverlay.classList.remove('hidden');

  if (win) {
    resultTitle.textContent = 'Bridge Cleared!';
    resultText.textContent = 'Both players survived the crossing.';
  } else {
    resultTitle.textContent = 'Bridge Failed';
    resultText.textContent = 'Too much chaos destroyed the run.';
  }

  finalStats.innerHTML = `Falls: ${game.totalFalls}<br>Time Left: ${Math.ceil(game.timer)}s`;
}

function respawnPlayer(player) {
  player.x = canvas.width / 2 + (player.side === 'left' ? 40 : -40);
  player.y = canvas.height * 0.45;
  player.vx = 0;
  player.vy = 0;
  game.totalFalls += 1;
  game.timer = Math.max(0, game.timer - 5);
  game.bridgeStress += 8;
}

function handleMovement(player) {
  if (player.respawnTimer > 0) {
    player.respawnTimer -= 1;
    return;
  }

  const moveDirection = player.side === 'left' ? -1 : 1;
  const held = player.side === 'left' ? game.leftTouch : game.rightTouch;

  const bridgeInfluence = (player.x - canvas.width / 2) / (canvas.width / 2);

  if (held) {
    player.vx += moveDirection * 0.26;
    game.swayVelocity += bridgeInfluence * 0.004;
    game.bridgeStress += 0.025 + Math.abs(bridgeInfluence) * 0.02;
  }

  player.vx *= 0.9;
  player.vy += game.gravity;

  player.x += player.vx;
  player.y += player.vy;

  const bridgeY = canvas.height * 0.58 + Math.sin(game.sway + bridgeInfluence * 2.5) * 55;

  if (player.y > bridgeY) {
    player.y = bridgeY;
    player.vy *= -0.18;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  player.x = Math.max(30, Math.min(canvas.width - 30, player.x));

  const jumpReady = player.side === 'left' ? game.leftSwipeReady : game.rightSwipeReady;

  if (jumpReady && player.grounded) {
    player.vy = -15;
    game.bridgeStress += 7;
    game.swayVelocity += player.side === 'left' ? -0.055 : 0.055;

    if (player.side === 'left') {
      game.leftSwipeReady = false;
    } else {
      game.rightSwipeReady = false;
    }
  }

  if (player.y > canvas.height + 100) {
    respawnPlayer(player);
  }

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

  game.bridgeStress *= 0.996;

  game.sway += game.swayVelocity;
  game.swayVelocity *= 0.985;

  game.players.forEach(handleMovement);

  if (game.bridgeStress >= 100) {
    endGame(false);
    return;
  }

  if (game.players.every(p => p.reachedGoal)) {
    game.holdProgress += delta;

    if (game.holdProgress >= 2) {
      endGame(true);
      return;
    }
  } else {
    game.holdProgress = Math.max(0, game.holdProgress - delta * 0.5);
  }

  timeText.textContent = Math.ceil(game.timer);
  stressText.textContent = `${Math.floor(game.bridgeStress)}%`;
  fallText.textContent = game.totalFalls;
  holdText.textContent = `${Math.min(100, Math.floor((game.holdProgress / 2) * 100))}%`;
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#1e293b');
  sky.addColorStop(0.6, '#0f172a');
  sky.addColorStop(1, '#111827');

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, canvas.height * 0.78, canvas.width, canvas.height * 0.22);
}

function drawBridge() {
  const bridgeY = canvas.height * 0.58;

  ctx.lineWidth = 16;
  ctx.strokeStyle = game.bridgeStress > 70 ? '#dc2626' : '#8b5e34';

  ctx.beginPath();

  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const x = 80 + t * (canvas.width - 160);
    const y = bridgeY + Math.sin(game.sway + t * 4) * 55;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(58, bridgeY - 90, 24, 90);
  ctx.fillRect(canvas.width - 82, bridgeY - 90, 24, 90);

  ctx.shadowBlur = 20;
  ctx.shadowColor = '#fde047';

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(130, bridgeY - 100, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(canvas.width - 130, bridgeY - 100, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
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

    if (player.reachedGoal) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y - 30, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function render() {
  drawBackground();
  drawBridge();
  drawPlayers();
}

let lastTime = performance.now();

function loop(now) {
  const delta = (now - lastTime) / 1000;
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
