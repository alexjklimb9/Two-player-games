// Core Defense v66: easier early-game balance, especially Easy mode.
(function(){
  function installBalance(){
    if(typeof game === 'undefined' || typeof LEVEL === 'undefined') return;
    const level = LEVEL.number || 1;
    const easy = level <= 1;

    const oldStartGame = startGame;
    startGame = function(e){
      oldStartGame(e);
      game.money = easy ? 12 : level === 2 ? 10 : 8;
      game.coreHp = easy ? 8 : 7;
      game.maxHp = game.coreHp;
      game.specialCd = 0;
    };

    beginWave = function(){
      game.wave++;
      game.waveActive = true;
      const base = easy ? 3 : 4;
      const waveAdd = easy ? 1.25 : 1.65;
      game.spawnLeft = Math.ceil(base + game.wave * waveAdd + Math.max(0, level - 1));
      game.spawnClock = .45;
    };

    spawnEnemy = function(){
      const side = Math.floor(Math.random()*4);
      let x,y;
      if(side===0){x=-25;y=Math.random()*canvas.height}
      else if(side===1){x=canvas.width+25;y=Math.random()*canvas.height}
      else if(side===2){x=Math.random()*canvas.width;y=-25}
      else{x=Math.random()*canvas.width;y=canvas.height+25}

      const hp = easy
        ? Math.ceil(2.4 + game.wave * .55)
        : Math.ceil(3.2 + game.wave * .75 + level * .55);
      const speed = easy
        ? 25 + game.wave * 1.8
        : 30 + game.wave * 2.4 + level * 2.5;
      game.enemies.push({x,y,hp,maxHp:hp,speed,slow:0,r:13+Math.random()*5,reward:easy?4:3});
    };

    const oldSpecial = special;
    special = function(){
      oldSpecial();
      if(game.specialCd > 0) game.specialCd = Math.min(game.specialCd, easy ? 4.5 : 5.5);
      const s = game.slots && game.slots[game.selected];
      if(s && s.boost > 0) s.boost = easy ? 5.5 : 5;
    };

    updateWaves = function(dt){
      if(!game.waveActive){
        game.waveTimer -= dt;
        if(game.waveTimer <= 0) beginWave();
        return;
      }
      game.spawnClock -= dt;
      if(game.spawnLeft > 0 && game.spawnClock <= 0){
        game.spawnClock = easy ? .95 : Math.max(.48, 1.0 - game.wave * .035 - level * .035);
        game.spawnLeft--;
        spawnEnemy();
      }
      if(game.spawnLeft <= 0 && game.enemies.length === 0){
        game.waveActive = false;
        game.waveTimer = easy ? 3.2 : 2.6;
        if(!LEVEL.endless && game.wave >= WIN_WAVES) endGame('You defended the core through every wave.', true);
      }
    };
  }

  installBalance();
  setTimeout(installBalance,100);
  setTimeout(installBalance,300);
})();