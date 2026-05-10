// Core Defense v74: add small/medium/large enemy types with color, health, speed, and size differences.
(function(){
  function installEnemyTypes(){
    if(typeof game === 'undefined' || typeof canvas === 'undefined') return;

    const ENEMY_TYPES = [
      {name:'small', color:'#facc15', hpMult:.65, speedMult:1.45, radius:10, reward:2},
      {name:'medium', color:'#a8a29e', hpMult:1.0, speedMult:1.0, radius:15, reward:3},
      {name:'large', color:'#f97316', hpMult:1.85, speedMult:.62, radius:22, reward:5}
    ];

    spawnEnemy = function(){
      const side = game.spawnPattern && game.spawnPattern.length
        ? game.spawnPattern[game.spawnIndex++ % game.spawnPattern.length]
        : Math.floor(Math.random() * 4);
      const margin = 32;
      let x, y;
      if(side === 0){ x = -margin; y = canvas.height * (.12 + Math.random() * .76); }
      else if(side === 1){ x = canvas.width + margin; y = canvas.height * (.12 + Math.random() * .76); }
      else if(side === 2){ x = canvas.width * (.12 + Math.random() * .76); y = -margin; }
      else { x = canvas.width * (.12 + Math.random() * .76); y = canvas.height + margin; }

      const level = LEVEL.number || 1;
      const easy = level <= 1;
      const roll = Math.random();
      let type = ENEMY_TYPES[1];
      if(game.wave <= 1){
        type = roll < .7 ? ENEMY_TYPES[0] : ENEMY_TYPES[1];
      } else if(game.wave <= 3){
        type = roll < .42 ? ENEMY_TYPES[0] : roll < .86 ? ENEMY_TYPES[1] : ENEMY_TYPES[2];
      } else {
        type = roll < .34 ? ENEMY_TYPES[0] : roll < .74 ? ENEMY_TYPES[1] : ENEMY_TYPES[2];
      }

      const baseHp = easy
        ? 2.4 + game.wave * .55
        : 3.2 + game.wave * .75 + level * .55;
      const baseSpeed = easy
        ? 25 + game.wave * 1.8
        : 30 + game.wave * 2.4 + level * 2.5;

      const hp = Math.max(1, Math.ceil(baseHp * type.hpMult));
      const speed = baseSpeed * type.speedMult;
      const reward = type.reward + (easy ? 1 : 0) + Math.floor(hp / 8);
      game.enemies.push({
        x,y,hp,maxHp:hp,speed,slow:0,
        r:type.radius,
        reward,
        kind:type.name,
        color:type.color
      });
    };

    drawEnemies = function(){
      for(const e of game.enemies){
        ctx.fillStyle = e.slow > 0 ? C.purple : (e.color || C.rock);
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(e.x,e.y,e.r,0,6.28);
        ctx.fill();
        ctx.stroke();
        if(e.kind === 'large'){
          ctx.strokeStyle = 'rgba(255,255,255,.22)';
          ctx.beginPath();
          ctx.arc(e.x,e.y,e.r * .58,0,6.28);
          ctx.stroke();
        }
        if(e.hp < e.maxHp){
          const bw = Math.max(28, e.r * 2.1);
          ctx.fillStyle = 'rgba(17,24,39,.8)';
          ctx.fillRect(e.x-bw/2,e.y-e.r-10,bw,4);
          ctx.fillStyle = C.green;
          ctx.fillRect(e.x-bw/2,e.y-e.r-10,bw*clamp(e.hp/e.maxHp,0,1),4);
        }
      }
    };
  }

  installEnemyTypes();
  setTimeout(installEnemyTypes,100);
  setTimeout(installEnemyTypes,300);
  setTimeout(installEnemyTypes,700);
})();