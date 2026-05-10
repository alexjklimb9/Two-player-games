// Asteroid Crew v50: countdown, continuous pressure, and inward wrapping.
(function(){
  const GOAL = 60;
  let countingDown = false;
  let realStart = null;

  function byId(id){ return document.getElementById(id); }

  function showCountdown(n){
    let el = byId('countdownOverlay');
    if(!el){
      el = document.createElement('div');
      el.id = 'countdownOverlay';
      el.style.position = 'absolute';
      el.style.inset = '0';
      el.style.zIndex = '80';
      el.style.display = 'none';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.pointerEvents = 'none';
      el.style.font = '900 72px Arial';
      el.style.color = '#f8fafc';
      el.style.textShadow = '0 18px 50px rgba(0,0,0,.65)';
      byId('gameScreen').appendChild(el);
    }
    el.textContent = n > 0 ? String(n) : 'GO';
    el.style.display = 'flex';
    if(n < 0) el.style.display = 'none';
  }

  function beginAfterCountdown(e){
    if(!byId('startOverlay') || byId('startOverlay').classList.contains('hidden')) return;
    if(countingDown) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    countingDown = true;
    let n = 3;
    showCountdown(n);
    const timer = setInterval(function(){
      n--;
      showCountdown(n);
      if(n < 0){
        clearInterval(timer);
        countingDown = false;
        if(realStart) realStart(e);
      }
    }, 1000);
  }

  function installCountdown(){
    realStart = window.startGame;
    ['touchstart','pointerup','click'].forEach(function(ev){
      byId('startButton').addEventListener(ev, beginAfterCountdown, true);
      byId('restartButton').addEventListener(ev, beginAfterCountdown, true);
    });
  }

  window.wrapRock = function(r){
    const c = byId('gameCanvas');
    if(!c || !r) return;
    const m = Math.max(18, r.r || 24);
    const push = 45;
    if(r.x < -m){ r.x = c.width + m; r.vx = -Math.max(Math.abs(r.vx || 0), push); }
    else if(r.x > c.width + m){ r.x = -m; r.vx = Math.max(Math.abs(r.vx || 0), push); }
    if(r.y < -m){ r.y = c.height + m; r.vy = -Math.max(Math.abs(r.vy || 0), push); }
    else if(r.y > c.height + m){ r.y = -m; r.vy = Math.max(Math.abs(r.vy || 0), push); }
  };

  window.update = function(dt){
    if(game.running){
      game.timer += dt;
      if(game.input.forward) game.drift += 360 * dt;
      if(game.input.backward) game.drift -= 300 * dt;
      game.drift = clamp(game.drift, -360, 470);
      game.drift *= Math.pow(.94, dt * 60);
      if(game.input.turnLeft) game.angle -= 3.2 * dt;
      if(game.input.turnRight) game.angle += 3.2 * dt;
      if(Math.abs(game.drift) > 1) moveWorld(Math.cos(game.angle) * game.drift * dt, Math.sin(game.angle) * game.drift * dt);
      if(game.input.fire) fire();
      W.forEach(function(w){
        w.c = Math.max(0, w.c - dt);
        if(w.ammo < w.max){
          w.t += dt;
          if(w.t >= w.reload){ w.t = 0; w.ammo++; }
        }
      });
      if(game.shield > 0) game.shield -= dt;
      game.spawn += dt;
      const progress = Math.min(1, game.timer / GOAL);
      const rate = Math.max(.28, 1.15 - progress * .82);
      const burst = game.timer > 40 ? 2 : 1;
      if(game.spawn > rate){
        game.spawn = 0;
        for(let i = 0; i < burst; i++) spawnRock();
      }
      updateRocks(dt);
      updateShots(dt);
      const remaining = Math.max(0, GOAL - Math.floor(game.timer));
      const tt = byId('timeText');
      if(tt) tt.textContent = remaining + 's left';
      stressText.textContent = String(3 - game.hits);
    }
    updateSparks(dt);
    game.shake = Math.max(0, game.shake - dt * 20);
  };

  installCountdown();
})();