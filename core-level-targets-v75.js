// Core Defense v75: force wave targets from URL level when compact router omits ACTIVE_LEVEL.
(function(){
  const p = new URLSearchParams(window.location.search);
  const level = parseInt(p.get('level') || '2', 10);
  const targets = {1:5, 2:8, 3:12, 4:15, 5:999999};
  const target = targets[level] || 8;
  window.ACTIVE_LEVEL = {number:level, winTarget:target, endless:level===5};

  if(typeof LEVEL !== 'undefined'){
    LEVEL.number = level;
    LEVEL.winTarget = target;
    LEVEL.endless = level === 5;
  }
  if(typeof WIN_WAVES !== 'undefined'){
    try { window.WIN_WAVES = target; } catch(e) {}
  }

  function patchWaveWin(){
    if(typeof game === 'undefined' || typeof endGame === 'undefined') return;
    const oldUpdateWaves = updateWaves;
    updateWaves = function(dt){
      oldUpdateWaves(dt);
      if(!LEVEL.endless && game.running && game.wave >= target && !game.waveActive && game.enemies.length === 0){
        endGame('You defended the core through every wave.', true);
      }
      if(typeof timeText !== 'undefined' && timeText){
        timeText.textContent = LEVEL.endless ? 'Wave ' + Math.max(1, game.wave || 1) + '/∞' : 'Wave ' + Math.max(1, game.wave || 1) + '/' + target;
      }
    };
  }

  patchWaveWin();
  setTimeout(patchWaveWin,100);
  setTimeout(patchWaveWin,300);
  setTimeout(patchWaveWin,700);
})();