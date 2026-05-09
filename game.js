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
  imbalance: 0,
  difficulty: 1,
  score: 0,
  spawnTimer: 0,
  shake: 0,
  hazards: [],
  sparks: [],
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
function boardCenterY() { return canvas.height * 0.61; }
function boardHalfWidth() { return canvas.width * 0.54; }
function visibleBoardHalfWidth() { return canvas.width * 0.49; }
function boardLeft() { return canvas.width / 2 - visibleBoardHalfWidth(); }
function boardRight() { return canvas.width / 2 + visibleBoardHalfWidth(); }

function createPlayer(side) {
  return {
    side,
    x: side === 'top' ? canvas.width * 0.26 : canvas.width * 0.74,
    y: canvas.height * 0.52,
    vx: 0,
    radius: 22,
    wobble: Math.random() * Math.PI * 2,
    blink: Math.random() * 4,
    color: side === 'top' ? '#22d3ee' : '#fb7185',
    glow: side === 'top' ? 'rgba(34, 211, 238, 0.65)' : 'rgba(251, 113, 133, 0.65)'
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
  game.imbalance = 0;
  game.difficulty = 1;
  game.score = 0;
  game.spawnTimer = 0;
  game.shake = 0;
  game.hazards = [];
  game.sparks = [];
  clearInputs();
  game.players = [createPlayer('top'), createPlayer('bottom')];
  startOverlay.classList.add('hidden');
  endOverlay.classList.add('hidden');
}

function addSparks(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 170;
    game.sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color,
      size: 2 + Math.random() * 4
    });
  }
}

function endGame(reason) {
  if (!game.running) return;
  game.running = false;
  clearInputs();
  game.shake = 14;
  addSparks(canvas.width / 2, boardCenterY(), '#f8fafc', 28);
  endOverlay.classList.remove('hidden');
  resultTitle.textContent = 'Game Over';
  resultText.textContent = reason;
  finalStats.innerHTML = `Survival Time: ${Math.floor(game.timer)}s<br>Difficulty: ${game.difficulty.toFixed(1)}x<br>Objects Dodged: ${game.score}`;
}

function spawnObject() {
  const lane = Math.random() < 0.5 ? 'top' : 'bottom';
  const minX = lane === 'top' ? boardLeft() + 42 : canvas.width / 2 + 28;
  const maxX = lane === 'top' ? canvas.width / 2 - 28 : boardRight() - 42;
  const types = ['orb', 'capsule', 'diamond', 'bar'];
  const color = ['#a78bfa', '#facc15', '#34d399', '#f472b6'][Math.floor(Math.random() * 4)];
  game.hazards.push({
    type: types[Math.floor(Math.random() * types.length)],
    color,
    x: minX + Math.random() * Math.max(1, maxX - minX),
    y: -44,
    vy: 3.4 + Math.random() * 2 + game.difficulty * 0.55,
    radius: 14 + Math.random() * 12,
    rotation: Math.random() * Math.PI * 2,
    spin: -0.045 + Math.random() * 0.09
  });
}

function directionForPlayer(player) {
  if (player.side === 'top') return (game.input.topRight ? 1 : 0) - (game.input.topLeft ? 1 : 0);
  return (game.input.bottomRight ? 1 : 0) - (game.input.bottomLeft ? 1 : 0);
}

function updatePlayers(delta) {
  game.players.forEach(player => {
    const dir = directionForPlayer(player);
    if (dir !== 0) player.vx += dir * 26 * delta;
    player.vx *= Math.pow(0.84, delta * 60);
    player.x += player.vx * delta * 60;
    player.wobble += (3.4 + Math.abs(player.vx) * 0.08) * delta;
    player.blink += delta;

    const minX = player.side === 'top' ? boardLeft() + 42 : canvas.width / 2 + 20;
    const maxX = player.side === 'top' ? canvas.width / 2 - 20 : boardRight() - 42;
    player.x = clamp(player.x, minX, maxX);
  });
}

function updateTilt(delta) {
  const center = canvas.width / 2;
  const topPlayer = game.players[0];
  const bottomPlayer = game.players[1];
  const leftWeight = (center - topPlayer.x) / Math.max(1, visibleBoardHalfWidth());
  const rightWeight = (bottomPlayer.x - center) / Math.max(1, visibleBoardHalfWidth());
  const balanceDelta = rightWeight - leftWeight;
  const targetTilt = balanceDelta * 0.72;

  game.tiltVelocity += (targetTilt - game.tilt) * 2.7 * delta;
  game.tiltVelocity *= Math.pow(0.94, delta * 60);
  game.tilt += game.tiltVelocity * delta * 60;
  game.tilt += Math.sin(game.timer * 0.8) * 0.00018 * game.difficulty;

  const danger = Math.max(0, Math.abs(game.tilt) - 0.23);
  game.imbalance += danger * delta * 3.8;
  game.imbalance = Math.max(0, game.imbalance - delta * 0.48);

  if (danger > 0.05) game.shake = Math.max(game.shake, danger * 14);

  if (Math.abs(game.tilt) > 0.42 || game.imbalance > 1) endGame('The platform lost balance.');
}

function updateObjects(delta) {
  game.spawnTimer += delta;
  const spawnRate = Math.max(0.48, 1.45 - game.difficulty * 0.07);
  if (game.spawnTimer >= spawnRate) {
    game.spawnTimer = 0;
    spawnObject();
  }

  for (let i = game.hazards.length - 1; i >= 0; i--) {
    const obj = game.hazards[i];
    obj.y += obj.vy * delta * 60;
    obj.rotation += obj.spin * delta * 60;

    for (const player of game.players) {
      const dx = obj.x - player.x;
      const dy = obj.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < obj.radius + player.radius - 7) {
        addSparks(player.x, player.y, player.color, 22);
        endGame(`${player.side === 'top' ? 'Top' : 'Bottom'} player was hit.`);
        return;
      }
    }

    if (obj.y > canvas.height + 70) {
      addSparks(obj.x, canvas.height - 20, obj.color, 4);
      game.hazards.splice(i, 1);
      game.score += 1;
    }
  }
}

function updateSparks(delta) {
  for (let i = game.sparks.length - 1; i >= 0; i--) {
    const p = game.sparks[i];
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vy += 180 * delta;
    p.life -= delta * 1.9;
    if (p.life <= 0) game.sparks.splice(i, 1);
  }
}

function update(delta) {
  if (game.running) {
    game.timer += delta;
    game.difficulty += delta * 0.026;
    updatePlayers(delta);
    updateTilt(delta);
    updateObjects(delta);
    timeText.textContent = `${Math.floor(game.timer)}s`;
    stressText.textContent = `${Math.min(100, Math.floor(Math.max(Math.abs(game.tilt) / 0.42, game.imbalance) * 100))}%`;
    fallText.textContent = game.score;
    holdText.textContent = `${game.difficulty.toFixed(1)}x`;
  }
  updateSparks(delta);
  game.shake = Math.max(0, game.shake - delta * 18);
}

function drawBackground() {
  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#020617');
  bg.addColorStop(0.5, '#08111f');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  const grid = 48;
  for (let x = (game.timer * 8) % grid; x < canvas.width; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
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

  ctx.shadowColor = Math.abs(game.tilt) > 0.26 ? 'rgba(248, 113, 113, 0.65)' : 'rgba(34, 211, 238, 0.45)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#0f172a';
  roundRect(-boardHalfWidth(), -8, boardHalfWidth() * 2, 16, 8, true, false);

  const line = ctx.createLinearGradient(-boardHalfWidth(), 0, boardHalfWidth(), 0);
  line.addColorStop(0, '#22d3ee');
  line.addColorStop(0.5, '#f8fafc');
  line.addColorStop(1, '#fb7185');
  ctx.fillStyle = line;
  roundRect(-boardHalfWidth(), -3, boardHalfWidth() * 2, 6, 3, true, false);

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(248,250,252,0.8)';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 8);
  ctx.lineTo(centerX - 24, centerY + 74);
  ctx.lineTo(centerX + 24, centerY + 74);
  ctx.closePath();
  ctx.stroke();
}

function drawPlayer(player) {
  const bY = boardCenterY();
  const localX = player.x - canvas.width / 2;
  const rotatedY = Math.sin(game.tilt) * localX;
  player.y = bY + rotatedY - 30;

  const pulse = 1 + Math.sin(player.wobble) * 0.035;
  const panic = Math.min(1, game.imbalance + Math.max(0, Math.abs(game.tilt) - 0.2) * 3);
  const eyeScale = Math.sin(player.blink * 3) > 0.985 ? 0.15 : 1;

  ctx.save();
  ctx.translate(player.x, player.y + Math.sin(player.wobble) * 1.2);

  ctx.shadowColor = player.glow;
  ctx.shadowBlur = 22;
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.arc(-7, -8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.ellipse(-7, 0, 3 + panic * 1.5, 5 * eyeScale + panic * 2, 0, 0, Math.PI * 2);
  ctx.ellipse(7, 0, 3 + panic * 1.5, 5 * eyeScale + panic * 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (panic > 0.4) ctx.arc(0, 9, 4, 0, Math.PI * 2);
  else ctx.arc(0, 6, 7, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.restore();
}

function drawPlayers() { game.players.forEach(drawPlayer); }

function drawObjects() {
  game.hazards.forEach(obj => {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.rotation);
    ctx.shadowColor = obj.color;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = obj.color;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.lineWidth = 3;

    if (obj.type === 'orb') {
      ctx.beginPath();
      ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (obj.type === 'capsule') {
      roundRect(-obj.radius * 0.7, -obj.radius * 1.15, obj.radius * 1.4, obj.radius * 2.3, obj.radius * 0.7, true, true);
    } else if (obj.type === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -obj.radius * 1.25);
      ctx.lineTo(obj.radius * 1.25, 0);
      ctx.lineTo(0, obj.radius * 1.25);
      ctx.lineTo(-obj.radius * 1.25, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      roundRect(-obj.radius * 1.25, -obj.radius * 0.45, obj.radius * 2.5, obj.radius * 0.9, 5, true, true);
    }
    ctx.restore();
  });
}

function drawSparks() {
  game.sparks.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });
}

function drawControls() {
  if (!game.running) return;
  const buttonW = Math.min(100, canvas.width * 0.15);
  const buttonH = 56;
  const edge = 12;
  const topY = 76;
  const bottomY = canvas.height - 90;
  drawButton(edge, topY, buttonW, buttonH, '◀', game.input.topLeft, '#22d3ee');
  drawButton(canvas.width - buttonW - edge, topY, buttonW, buttonH, '▶', game.input.topRight, '#22d3ee');
  drawButton(edge, bottomY, buttonW, buttonH, '◀', game.input.bottomLeft, '#fb7185');
  drawButton(canvas.width - buttonW - edge, bottomY, buttonW, buttonH, '▶', game.input.bottomRight, '#fb7185');
}

function drawButton(x, y, w, h, label, active, color) {
  ctx.fillStyle = active ? color : 'rgba(15,23,42,0.72)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = active ? color : 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = active ? 22 : 8;
  roundRect(x, y, w, h, 18, true, true);
  ctx.shadowBlur = 0;
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
  ctx.save();
  const shakeX = game.shake ? (Math.random() - 0.5) * game.shake : 0;
  const shakeY = game.shake ? (Math.random() - 0.5) * game.shake : 0;
  ctx.translate(shakeX, shakeY);
  drawBackground();
  drawObjects();
  drawBoard();
  drawPlayers();
  drawSparks();
  drawControls();
  ctx.restore();
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

function overlayVisible() {
  return !startOverlay.classList.contains('hidden') || !endOverlay.classList.contains('hidden');
}

function startFromOverlay(event) {
  event.preventDefault();
  event.stopPropagation();
  resetGame();
}

startOverlay.addEventListener('touchstart', startFromOverlay, { passive: false });
startOverlay.addEventListener('pointerdown', startFromOverlay);
startOverlay.addEventListener('click', startFromOverlay);
endOverlay.addEventListener('touchstart', startFromOverlay, { passive: false });
endOverlay.addEventListener('pointerdown', startFromOverlay);
endOverlay.addEventListener('click', startFromOverlay);
startButton.addEventListener('touchstart', startFromOverlay, { passive: false });
startButton.addEventListener('pointerdown', startFromOverlay);
startButton.addEventListener('click', startFromOverlay);
restartButton.addEventListener('touchstart', startFromOverlay, { passive: false });
restartButton.addEventListener('pointerdown', startFromOverlay);
restartButton.addEventListener('click', startFromOverlay);

document.addEventListener('touchstart', event => {
  if (overlayVisible()) return;
  event.preventDefault();
  for (const touch of event.changedTouches) setInputFromTouch(touch, true);
}, { passive: false });

document.addEventListener('touchmove', event => {
  if (!overlayVisible()) event.preventDefault();
}, { passive: false });

document.addEventListener('touchend', event => {
  if (overlayVisible()) return;
  event.preventDefault();
  for (const touch of event.changedTouches) setInputFromTouch(touch, false);
}, { passive: false });

document.addEventListener('touchcancel', event => {
  if (overlayVisible()) return;
  event.preventDefault();
  for (const touch of event.changedTouches) setInputFromTouch(touch, false);
}, { passive: false });

render();