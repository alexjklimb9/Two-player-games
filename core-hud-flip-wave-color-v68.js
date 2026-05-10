// Core Defense v68: flip Wave/Money HUD for top player and recolor Wave tower.
(function(){
  function installV68(){
    if(typeof game === 'undefined' || typeof TYPES === 'undefined') return;

    const wave = TYPES.find(t => t.name === 'Wave');
    if(wave) wave.color = '#34d399';

    function drawTopHud(){
      if(!game || !game.running) return;
      const waveTarget = LEVEL.endless ? '∞' : WIN_WAVES;
      const waveText = 'Wave ' + Math.max(1, game.wave || 1) + '/' + waveTarget;
      const moneyText = '$' + (game.money || 0);
      const y = 24;
      const w = 112;
      const h = 30;
      const gap = 10;
      const total = w * 2 + gap;
      const x1 = canvas.width / 2 - total / 2;
      const x2 = x1 + w + gap;

      function pill(x, label){
        ctx.save();
        ctx.translate(x + w/2, y + h/2);
        ctx.rotate(Math.PI);
        ctx.fillStyle = 'rgba(17,24,39,.82)';
        ctx.strokeStyle = 'rgba(255,255,255,.16)';
        ctx.lineWidth = 1.4;
        rr(-w/2, -h/2, w, h, 15);
        ctx.fillStyle = C.white;
        ctx.font = '900 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 1);
        ctx.restore();
      }

      pill(x1, waveText);
      pill(x2, 'Money ' + moneyText);
    }

    const oldRender = render;
    render = function(){
      oldRender();
      drawTopHud();
    };

    const hud = document.getElementById('hud');
    if(hud) hud.style.display = 'none';
  }

  installV68();
  setTimeout(installV68,100);
  setTimeout(installV68,300);
  setTimeout(installV68,700);
})();