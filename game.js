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
  input: { topLeft: false, topRight: false, bottomLeft: false, bottomRight: false },
  players: []
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function boardCenterY() { return canvas.height * 0.68; }
function boardHalfWidth() { return canvas.width * 0.43; }
function boardLeft() { return canvas.width / 2 - boardHalfWidth(); }
function boardRight() { return canvas.width / 2 + boardHalfWidth(); }

function createPlayer(side) {
  return {
    side,
    x: side === 'top' ? canvas.width * 0.28 : canvas.width * 0.72,
    y: canvas.height * 0.58,
    vx: 0,
    radius: 22,
    color: side === 'top' ? '#38bdf8' : '#fb7185'
  };
}

function clearInputs() {
  game.input.topLeft = false;
  game.input.topRight = false;
  game.input.bottomLeft = false;
  game.input.bottomRight = false;
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
  clearInputs();
  game.players = [createPlayer('top'), createPlayer('bottom')];
  startOverlay.classList.add('hidden');
  endOverlay.classList.add('hidden');
}

function endGame(reason) {
  game.running = false;
  clearInputs();
  endOverlay.classList.remove('hidden');
  resultTitle.textContent = 'Game Over';
  resultText.textContent = reason;
  finalStats.innerHTML = `Survival Time: ${Math.floor(game.timer)}s<br>Difficulty: ${game.difficulty.toFixed(1)}x<br>Objects Dodged: ${game.score}`;
}

function spawnObject() {
  const lane = Math.random() < 0.5 ? 'top' : 'bottom';
  const minX = lane === 'top' ? boardLeft() + 25 : canvas.width / 2 + 25;
  const maxX = lane === 'top' ? canvas.width / 2 - 25 : boardRight() - 25;
  game.particles.push({
    x: minX + Math.random() * Math.max(1, maxX - minX),
    y: -40,
    vy: 3.6 + Math.random() * 2.1 + game.difficulty * 0.55,
    radius: 14 + Math.random() * 15,
    rotation: Math.random() * Math.PI * 2
  });
}

function directionForPlayer(player) {
  if (player.side === 'top') return (game.input.topRight ? 1 : 0) - (game.input.topLeft ? 1 : 0);
  return (game.input.bottomRight ? 1 : 0) - (game.input.bottomLeft ? 1 : 0);
}

function updatePlayers() {
  game.players.forEach(player => {
    const dir = directionForPlayer(player);
    if (dir !== 0) player.vx += dir * 0.42;
    player.vx *= 0.84;
    player.x += player.vx;

    const minX = player.side === 'top' ? boardLeft() + 28 : canvas.width / 2 + 18;
    const maxX = player.side === 'top' ? canvas.width / 2 - 18 : boardRight() - 28;
    player.x = clamp(player.x, minX, maxX);
  });
}

function updateTilt() {
  const center = canvas.width / 2;
  const topPlayer = game.players[0];
  const bottomPlayer = game.players[1];
  const leftWeight = (center - topPlayer.x) / Math.max(1, boardHalfWidth());
  const rightWeight = (bottomPlayer.x - center) / Math.max(1, boardHalfWidth());
  const targetTilt = (rightWeight - leftWeight) * 0.18;
  game.tiltVelocity += (targetTilt - game.tilt) * 0.012;
  game.tiltVelocity *= 0.93;
  game.tilt += game.tiltVelocity;
  game.tilt += Math.sin(game.timer * 0.65) * 0.00008 * game.difficulty;
  if (Math.abs(game.tilt) > 0.55) endGame('The board tipped too far.');
}

function updateObjects(delta) {
  game.spawnTimer += delta;
  const spawnRate = Math.max(0.5, 1.45 - game.difficulty * 0.07);
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
        endGame(`${player.side === 'top' ? 'Top' : 'Bottom'} player got hit.`);
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
  game.difficulty += delta * 0.025;
  updatePlayers();
  updateTilt();
  updateObjects(delta);
  timeText.textContent = `${Math.floor(game.timer)}s`;
  stressText.textContent = `${Math.floor(Math.abs(game.tilt) * 180)}%`;
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
  const centerY = boardCenterY();
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(game.tilt);
  ctx.fillStyle = '#8b5e34';
  ctx.fillRect(-boardHalfWidth(), -14, boardHalfWidth() * 2, 28);
  ctx.fillStyle = '#713f12';
  for (let i = -15; i <= 15; i++) ctx.fillRect(i * 42 - 4, -14, 8, 28);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(0, 22);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 14);
  ctx.lineTo(centerX - 45, canvas.height);
  ctx.lineTo(centerX + 45, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawPlayers() {
  const bY = boardCenterY();
  game.players.forEach(player => {
    const localX = player.x - canvas.width / 2;
    const rotatedY = Math.sin(game.tilt) * localX;
    player.y = bY + rotatedY - 30;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 20, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(player.x - 15, player.y, 30, 38);
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(player.x - 7, player.y - 23, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 7, player.y - 23, 3, 0, Math.PI * 2);
    ctx.fill();
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

function drawControls() {
  if (!game.running) return;
  const buttonW = Math.min(120, canvas.width * 0.18);
  const buttonH = 58;
  const topY = 78;
  const bottomY = canvas.height - 92;
  const gap = 18;
  drawButton(canvas.width * 0.25 - buttonW - gap / 2, topY, buttonW, buttonH, '◀', game.input.topLeft, '#38bdf8');
  drawButton(canvas.width * 0.25 + gap / 2, topY, buttonW, buttonH, '▶', game.input.topRight, '#38bdf8');
  drawButton(canvas.width * 0.75 - buttonW - gap / 2, bottomY, buttonW, buttonH, '◀', game.input.bottomLeft, '#fb7185');
  drawButton(canvas.width * 0.75 + gap / 2, bottomY, buttonW, buttonH, '▶', game.input.bottomRight, '#fb7185');
}

function drawButton(x, y, w, h, label, active, color) {
  ctx.fillStyle = active ? color : 'rgba(15,23,42,0.75)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(x, y, w, h, 18, true, true);
  ctx.fillStyle = active ? '#020617' : '#f8fafc';
  ctx.font = '900 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
}

function roundRect(x, y, w, h, r, fill, stroke) {
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
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function render() {
  drawBackground();
  drawObjects();
  drawBoard();
  drawPlayers();
  drawControls();
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

function setInputFromTouch(touch, isDown) {
  const x = touch.clientX;
  const y = touch.clientY;
  const topZone = y < canvas.height / 2;
  const leftButton = x < canvas.width / 2;
  if (topZone) {
    if (leftButton) game.input.topLeft = isDown;
    else game.input.topRight = isDown;
  } else {
    if (leftButton) game.input.bottomLeft = isDown;
    else game.input.bottomRight = isDown;
  }
}

function shouldIgnoreGameTouch(event) {
  return !game.running || event.target.closest('button') || event.target.closest('.overlay');
}

window.addEventListener('touchstart', event => {
  if (shouldIgnoreGameTouch(event)) return;
  event.preventDefault();
  for (const touch of event.changedTouches) setInputFromTouch(touch, true);
}, { passive: false });
window.addEventListener('touchmove', event => { if (!shouldIgnoreGameTouch(event)) event.preventDefault(); }, { passive: false });
window.addEventListener('touchend', event => {
  if (shouldIgnoreGameTouch(event)) return;
  event.preventDefault();
  for (const touch of event.changedTouches) setInputFromTouch(touch, false);
}, { passive: false });
window.addEventListener('touchcancel', event => {
  if (shouldIgnoreGameTouch(event)) return;
  event.preventDefault();
  for (const touch of event.changedTouches) setInputFromTouch(touch, false);
}, { passive: false });

function bindButton(button, action) {
  button.addEventListener('click', action);
  button.addEventListener('touchstart', event => {
    event.stopPropagation();
    event.preventDefault();
    action();
  }, { passive: false });
  button.addEventListener('pointerdown', event => {
    event.stopPropagation();
    action();
  });
}

bindButton(startButton, resetGame);
bindButton(restartButton, resetGame);

render();