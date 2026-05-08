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

const game = {
  running: false,
  timer: 0,
  tilt: 0,
  tiltVelocity: 0,
  difficulty: 1,
  score: 0,
  spawnTimer: 0,
  particles: [],
  leftTouch: false,
  rightTouch: false,
  players: []
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function createPlayer(side) {
  return {
    side,
    x: side === 'left' ? canvas.width * 0.25 : canvas.width * 0.75,
    y: canvas.height * 0.63,
    vx: 0,
    radius: 26,
    color: side === 'left' ? '#38bdf8' : '#fb7185'
  };
}

function resetGame() {
  game.running = true;
  game.timer = 0;
  game.tilt = 0;
  game.tiltVelocity = 0;
  game.difficulty = 1;
  game.score = 0;
  game.spawnTimer = 0;
  game.particles = [];
  game.players = [createPlayer('left'), createPlayer('right')];
  endOverlay.classList.add('hidden');
}

function endGame(reason) {
  game.running = false;
  endOverlay.classList.remove('hidden');

  resultTitle.textContent = 'Game Over';
  resultText.textContent = reason;
  finalStats.innerHTML = `Survival Time: ${Math.floor(game.timer)}s<br>Difficulty: ${game.difficulty.toFixed(1)}x<br>Objects Dodged: ${game.score}`;
}

function spawnObject() {
  const side = Math.random() < 0.5 ? 'left' : 'right';
  const minX = side === 'left' ? 70 : canvas.width / 2 + 30;
  const maxX = side === 'left' ? canvas.width / 2 - 30 : canvas.width - 70;

  game.particles.push({
    x: minX + Math.random() * (maxX - minX),
    y: -40,
    vy: 6 + Math.random() * 4 + game.difficulty,
    radius: 18 + Math.random() * 20,
    rotation: Math.random() * Math.PI * 2
  });
}

function updatePlayers() {
  game.players.forEach(player => {
    const held = player.side === 'left' ? game.leftTouch : game.rightTouch;
    const moveDir = player.side === 'left' ? -1 : 1;

    if (held) {
      player.vx += moveDir * 0.9;
    }

    player.vx *= 0.82;
    player.x += player.vx;

    const minX = player.side === 'left'
      ? 50
      : canvas.width / 2 + 20;

    const maxX = player.side === 'left'
      ? canvas.width / 2 - 20
      : canvas.width - 50;

    player.x = clamp(player.x, minX, maxX);
  });
}

function updateTilt(delta) {
  const leftWeight = (canvas.width * 0.5 - game.players[0].x) * 0.02;
  const rightWeight = (game.players[1].x - canvas.width * 0.5) * 0.02;

  game.tiltVelocity += (rightWeight - leftWeight) * 0.0012;
  game.tiltVelocity *= 0.96;
  game.tilt += game.tiltVelocity;

  game.tilt += Math.sin(game.timer * 0.8) * 0.0003 * game.difficulty;

  if (Math.abs(game.tilt) > 0.34) {
    endGame('The board tipped too far.');
  }
}

function updateObjects(delta) {
  game.spawnTimer += delta;

  const spawnRate = Math.max(0.35, 1.2 - game.difficulty * 0.08);

  if (game.spawnTimer >= spawnRate) {
    game.spawnTimer = 0;
    spawnObject();
  }

  for (let i = game.particles.length - 1; i >= 0; i--) {
    const obj = game.particles[i];

    obj.y += obj.vy;
    obj.rotation += 0.03;

    for (const player of game.players) {
      const dx = obj.x - player.x;
      const dy = obj.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < obj.radius + player.radius - 8) {
        endGame(`${player.side === 'left' ? 'Left' : 'Right'} player got hit.`);
        return;
      }
    }

    if (obj.y > canvas.height + 60) {
      game.particles.splice(i, 1);
      game.score += 1;
    }
  }
}

function update(delta) {
  if (!game.running) return;

  game.timer += delta;
  game.difficulty += delta * 0.035;

  updatePlayers();
  updateTilt(delta);
  updateObjects(delta);

  timeText.textContent = `${Math.floor(game.timer)}s`;
  stressText.textContent = `${Math.floor(Math.abs(game.tilt) * 290)}%`;
  fallText.textContent = game.score;
  holdText.textContent = `${game.difficulty.toFixed(1)}x`;
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#1e293b');
  sky.addColorStop(1, '#020617');

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
}

function drawBoard() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height * 0.72;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(game.tilt);

  ctx.fillStyle = '#8b5e34';
  ctx.fillRect(-canvas.width * 0.35, -16, canvas.width * 0.7, 32);

  ctx.fillStyle = '#713f12';

  for (let i = -5; i <= 5; i++) {
    ctx.fillRect(i * 55 - 6, -16, 12, 32);
  }

  ctx.restore();

  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 16);
  ctx.lineTo(centerX - 50, canvas.height);
  ctx.lineTo(centerX + 50, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawPlayers() {
  const boardY = canvas.height * 0.72;

  game.players.forEach(player => {
    const localX = player.x - canvas.width / 2;
    const rotatedY = Math.sin(game.tilt) * localX;

    player.y = boardY + rotatedY - 28;

    ctx.fillStyle = player.color;

    ctx.beginPath();
    ctx.arc(player.x, player.y - 20, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(player.x - 18, player.y, 36, 44);
  });
}

function drawObjects() {
  game.particles.forEach(obj => {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.rotation);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(-obj.radius, -obj.radius, obj.radius * 2, obj.radius * 2);

    ctx.restore();
  });
}

function render() {
  drawBackground();
  drawBoard();
  drawPlayers();
  drawObjects();
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

window.addEventListener('touchstart', event => {
  for (const touch of event.changedTouches) {
    if (touch.clientX < window.innerWidth / 2) {
      game.leftTouch = true;
    } else {
      game.rightTouch = true;
    }
  }
}, { passive: false });

window.addEventListener('touchmove', event => {
  event.preventDefault();
}, { passive: false });

window.addEventListener('touchend', event => {
  for (const touch of event.changedTouches) {
    if (touch.clientX < window.innerWidth / 2) {
      game.leftTouch = false;
    } else {
      game.rightTouch = false;
    }
  }
}, { passive: false });

startButton.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  resetGame();
});

restartButton.addEventListener('click', resetGame);

render();