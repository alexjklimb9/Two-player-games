// Asteroid Crew v49 pressure fix: asteroids keep spawning so players must clear them.
update = function(dt){
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

    W.forEach(w => {
      w.c = Math.max(0, w.c - dt);
      if(w.ammo < w.max){
        w.t += dt;
        if(w.t >= w.reload){
          w.t = 0;
          w.ammo++;
        }
      }
    });

    if(game.shield > 0) game.shield -= dt;

    game.spawn += dt;
    const progress = Math.min(1, game.timer / 60);
    const rate = Math.max(.28, 1.15 - progress * .82);
    const burst = game.timer > 40 ? 2 : 1;

    if(game.spawn > rate){
      game.spawn = 0;
      for(let i = 0; i < burst; i++) spawnRock();
    }

    updateRocks(dt);
    updateShots(dt);

    const tt = document.getElementById('timeText');
    if(tt) tt.textContent = Math.max(0, 60 - Math.floor(game.timer)) + 's left';
    stressText.textContent = `${3 - game.hits}`;
  }

  updateSparks(dt);
  game.shake = Math.max(0, game.shake - dt * 20);
};