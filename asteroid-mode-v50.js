// Asteroid Crew v50: countdown, continuous pressure, inward wrapping, polished controls, weapon info, and pacing tuning.
(function(){
  const GOAL = 60;
  let countingDown = false;
  let realStart = null;

  function byId(id){ return document.getElementById(id); }

  function applyAsteroidTuning(){
    if(!Array.isArray(W) || W.__asteroidTuned) return;
    W.forEach(function(w){ w.reload = +(w.reload * 1.16).toFixed(2); });
    W.__asteroidTuned = true;
  }

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

  function refreshWeaponButtonText(){
    if(!game.controls || !Array.isArray(W)) return;
    const b = game.controls.querySelector('button[data-k="weapon"]');
    const w = W[game.weapon];
    if(b && w) b.textContent = `${w.name.toUpperCase()} ${w.ammo}/${w.max}`;
  }

  function polishButton(b,on){
    if(!b) return;
    const key = b.dataset.k;
    const top = ['forward','backward','weapon'].includes(key);
    const w = Array.isArray(W) ? W[game.weapon] : null;
    const weaponReady = key === 'weapon' && w;
    const fireReady = key === 'fire' && w && w.ammo > 0 && w.c <= 0;
    const specialReady = weaponReady || fireReady;
    const accent = key === 'weapon' && w ? w.color : top ? C.blue : C.rose;
    b.style.background = on ? accent : specialReady ? `linear-gradient(180deg, rgba(17,24,39,.88), rgba(17,24,39,.68))` : 'rgba(17,24,39,.78)';
    b.style.border = on ? '1.8px solid rgba(255,255,255,.48)' : specialReady ? `1.8px solid ${accent}` : `1.5px solid ${accent}`;
    b.style.color = on ? '#0b0f14' : accent;
    b.style.boxShadow = on ? `0 10px 24px rgba(0,0,0,.36), 0 0 16px ${accent}66` : specialReady ? `0 14px 30px rgba(0,0,0,.38), 0 0 14px ${accent}55` : '0 12px 28px rgba(0,0,0,.34)';
    b.style.transform = on ? 'scale(.97)' : 'scale(1)';
    b.style.opacity = key === 'fire' && w && w.ammo <= 0 ? '.62' : '1';
  }

  function installControlPolish(){
    if(!game.controls) return setTimeout(installControlPolish, 50);
    game.controls.querySelectorAll('button').forEach(function(b){
      b.style.background = 'rgba(17,24,39,.78)';
      b.style.backdropFilter = 'blur(10px)';
      b.style.webkitBackdropFilter = 'blur(10px)';
      b.style.borderRadius = '18px';
      b.style.transition = 'transform .08s ease, background .12s ease, border .12s ease, box-shadow .12s ease, opacity .12s ease';
    });
    window.buttonState = function(){
      if(!game.controls) return;
      refreshWeaponButtonText();
      game.controls.querySelectorAll('button').forEach(function(b){ polishButton(b, game.input[b.dataset.k]); });
    };
    buttonState();
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
      if(game.input.forward) game.drift += 405 * dt;
      if(game.input.backward) game.drift -= 335 * dt;
      game.drift = clamp(game.drift, -405, 520);
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
      if(typeof buttonState === 'function') buttonState();
    }
    updateSparks(dt);
    game.shake = Math.max(0, game.shake - dt * 20);
  };

  applyAsteroidTuning();
  installCountdown();
  installControlPolish();
})();