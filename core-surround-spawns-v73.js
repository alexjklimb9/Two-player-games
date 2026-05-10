// Core Defense v73: spread enemy spawns around all sides instead of clumping from one direction.
(function(){
  function installSurroundSpawns(){
    if(typeof game === 'undefined' || typeof canvas === 'undefined') return;

    game.spawnIndex = 0;
    game.spawnPattern = [];

    beginWave = function(){
      game.wave++;
      game.waveActive = true;
      const level = LEVEL.number || 1;
      const easy = level <= 1;
      const base = easy ? 3 : 4;
      const waveAdd = easy ? 1.25 : 1.65;
      game.spawnLeft = Math.ceil(base + game.wave * waveAdd + Math.max(0, level - 1));
      game.spawnClock = .35;
      game.spawnIndex = 0;
      game.spawnPattern = [];
      const sides = [0,1,2,3];
      const start = Math.floor(Math.random() * 4);
      for(let i = 0; i < game.spawnLeft; i++){
        const side = sides[(start + i) % 4];
        game.spawnPattern.push(side);
      }
      for(let i = game.spawnPattern.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        const temp = game.spawnPattern[i];
        game.spawnPattern[i] = game.spawnPattern[j];
        game.spawnPattern[j] = temp;
      }
    };

    spawnEnemy = function(){
      const side = game.spawnPattern && game.spawnPattern.length
        ? game.spawnPattern[game.spawnIndex++ % game.spawnPattern.length]
        : Math.floor(Math.random() * 4);
      const margin = 28;
      let x, y;
      if(side === 0){ x = -margin; y = canvas.height * (.12 + Math.random() * .76); }
      else if(side === 1){ x = canvas.width + margin; y = canvas.height * (.12 + Math.random() * .76); }
      else if(side === 2){ x = canvas.width * (.12 + Math.random() * .76); y = -margin; }
      else { x = canvas.width * (.12 + Math.random() * .76); y = canvas.height + margin; }

      const level = LEVEL.number || 1;
      const easy = level <= 1;
      const hp = easy
        ? Math.ceil(2.4 + game.wave * .55)
        : Math.ceil(3.2 + game.wave * .75 + level * .55);
      const speed = easy
        ? 25 + game.wave * 1.8
        : 30 + game.wave * 2.4 + level * 2.5;
      game.enemies.push({x,y,hp,maxHp:hp,speed,slow:0,r:13+Math.random()*5,reward:easy?4:3});
    };
  }

  installSurroundSpawns();
  setTimeout(installSurroundSpawns,100);
  setTimeout(installSurroundSpawns,300);
  setTimeout(installSurroundSpawns,700);
})();