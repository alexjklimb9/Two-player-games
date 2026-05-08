const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const timeText = document.getElementById('timeText');
const stressText = document.getElementById('stressText');

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
  gravity: 0.6,
  players: []
};

function createPlayer(side) {
  return {
    side,
    x: canvas.width / 2,
    y: canvas.height * 0.58,
    vx: 0,
    vy: 0,
    radius: 24,
    grounded: true,
    color: side === 'left' ? '#38bdf8' : '#fb7185',
    goalX: side === 'left' ? 120 : canvas.width - 120,
    reachedGoal: false
  };
}

function resetGame() {
  game.timer = 90;
  game.bridgeStress = 0;
  game.sway = 0;
  game.swayVelocity = 0;
  game.running = true;
  game.players = [createPlayer('left'), createPlayer('right')];
  endOverlay.classList.add('hidden');
}

function endGame(win) {
  game.running = false;
  endOverlay.classList.remove('hidden');

  if (win) {
    resultTitle.textContent = 'You Win!';
    resultText.textContent = 'Both players made it across the bridge.';
  } else {
    resultTitle.textContent = 'Bridge Failed';
    resultText.textContent = 'The bridge became too unstable.';
  }
}

function handleMovement(player) {
  const moveDirection = player.side === 'left' ? -1 : 1;
  const held = player.side === 'left' ? game.leftTouch : game.rightTouch;

  if (held) {
    player.vx += moveDirection * 0.22;
    game.swayVelocity += moveDirection * 0.0025;
    game.bridgeStress += 0.02;
  }

  player.vx *= 0.92;
  player.vy += game.gravity;

  player.x += player.vx;
  player.y += player.vy;

  const bridgeY = canvas.height * 0.58 + Math.sin(game.sway) * 40;

  if (player.y > bridgeY) {
    player.y = bridgeY;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  player.x = Math.max(40, Math.min(canvas.width - 40, player.x));

  const jumpReady = player.side === 'left' ? game.leftSwipeReady : game.rightSwipeReady;

  if (jumpReady && player.grounded) {
    player.vy = -14;
    game.bridgeStress += 6;
    game.swayVelocity += player.side === 'left' ? -0.04 : 0.04;

    if (player.side === 'left') {
      game.leftSwipeReady = false;
    } else {
      game.rightSwipeReady = false;
    }
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
  }

  game.bridgeStress *= 0.995;

  game.sway += game.swayVelocity;
  game.swayVelocity *= 0.98;

  game.players.forEach(handleMovement);

  if (game.bridgeStress >= 100) {
    endGame(false);
  }

  if (game.players.every(p => p.reachedGoal)) {
    endGame(true);
  }

  timeText.textContent = Math.ceil(game.timer);
  stressText.textContent = `${Math.floor(game.bridgeStress)}%`;
}

function drawBackground() {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
}

function drawBridge() {
  const bridgeY = canvas.height * 0.58;

  ctx.lineWidth = 12;
  ctx.strokeStyle = '#8b5e34';

  ctx.beginPath();

  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = 80 + t * (canvas.width - 160);
    const y = bridgeY + Math.sin(game.sway + t * 3) * 40;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(60, bridgeY - 70, 20, 70);
  ctx.fillRect(canvas.width - 80, bridgeY - 70, 20, 70);
}

function drawPlayers() {
  game.players.forEach(player => {
    ctx.fillStyle = player.color;

    ctx.beginPath();
    ctx.arc(player.x, player.y - 28, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(player.x - 18, player.y - 10, 36, 40);
  });
}

function drawGoals() {
  ctx.fillStyle = '#facc15';

  ctx.beginPath();
  ctx.arc(120, canvas.height * 0.5, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(canvas.width - 120, canvas.height * 0.5, 20, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  drawBackground();
  drawBridge();
  drawGoals();
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

      if (leftStartY - touch.clientY > 50) {
        game.leftSwipeReady = true;
      }
    } else {
      game.rightTouch = false;

      if (rightStartY - touch.clientY > 50) {
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
