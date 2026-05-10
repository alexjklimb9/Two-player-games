// Core Defense v76: replace wave progression so URL difficulty controls the true win target.
(function(){
  function installWaveFinal(){
    if(typeof game === 'undefined' || typeof LEVEL === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const level = parseInt(params.get('level') || '2', 10);
    const targets = {1:5, 2:8, 3:12, 4:15, 5:999999};
    const target = targets[level] || 8;
    const endless = level === 5;

    LEVEL.number = level;
    LEVEL.winTarget = target;
    LEVEL.endless = endless;
    window.ACTIVE_LEVEL = {number:level, winTarget:target, endless};

    function waveLabel(){
      return endless ? 'Wave ' + Math.max(1, game.wave || 1) + '/∞' : 'Wave ' + Math.max(1, game.wave || 1) + '/' + target;
    }

    updateWaves = function(dt){
      if(!game.waveActive){
        game.waveTimer -= dt;
        if(game.waveTimer <= 0){
          beginWave();
        }
        if(typeof timeText !== 'undefined' && timeText) timeText.textContent = waveLabel();
        return;
      }

      game.spawnClock -= dt;
      if(game.spawnLeft > 0 && game.spawnClock <= 0){
        const easy = level <= 1;
        game.spawnClock = easy ? .95 : Math.max(.48, 1.0 - game.wave * .035 - level * .035);
        game.spawnLeft--;
        spawnEnemy();
      }

      if(game.spawnLeft <= 0 && game.enemies.length === 0){
        game.waveActive = false;
        game.waveTimer = level <= 1 ? 3.2 : 2.6;
        if(!endless && game.wave >= target){
          endGame('You defended the core through every wave.', true);
        }
      }

      if(typeof timeText !== 'undefined' && timeText) timeText.textContent = waveLabel();
    };

    const oldRender = render;
    if(!game.__v76RenderInstalled){
      game.__v76RenderInstalled = true;
      render = function(){
        oldRender();
        if(typeof timeText !== 'undefined' && timeText) timeText.textContent = waveLabel();
      };
    }
  }

  installWaveFinal();
  setTimeout(installWaveFinal,100);
  setTimeout(installWaveFinal,300);
  setTimeout(installWaveFinal,700);
  setTimeout(installWaveFinal,1500);
})();