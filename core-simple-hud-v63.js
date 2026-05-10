// Core Defense v63: keep only Wave and Money in the HUD.
(function(){
  function simplifyHud(){
    const hud = document.getElementById('hud');
    if(!hud) return;
    hud.style.display = 'flex';
    const pills = hud.querySelectorAll('.pill');
    if(pills[0]) pills[0].style.display = 'inline-flex';
    if(pills[1]) pills[1].style.display = 'none';
    if(pills[2]) pills[2].style.display = 'inline-flex';
    if(pills[3]) pills[3].style.display = 'none';
    const scoreLabel = document.getElementById('scoreLabel');
    if(scoreLabel) scoreLabel.textContent = 'Money';
  }

  const oldUpdate = update;
  update = function(dt){
    oldUpdate(dt);
    if(game && game.running){
      simplifyHud();
      const waveTarget = LEVEL.endless ? '∞' : WIN_WAVES;
      if(timeText) timeText.textContent = 'Wave ' + Math.max(1, game.wave || 1) + '/' + waveTarget;
      if(fallText) fallText.textContent = '$' + (game.money || 0);
    }
  };

  simplifyHud();
})();