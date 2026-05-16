// Core slow outline v87: show icy blue outline only for Freeze-level slow.
(function(){
  function wait(){
    if(typeof game==='object'&&Array.isArray(game.enemies)&&typeof drawEnemies==='function'&&typeof ctx==='object') install();
    else setTimeout(wait,50);
  }

  function install(){
    if(drawEnemies.__slowOutlineV87) return;
    const oldDrawEnemies=drawEnemies;
    drawEnemies=function(){
      oldDrawEnemies();
      for(const e of game.enemies){
        // Wave applies a tiny slow, but the icy outline should only represent Freeze.
        if(!e||!(e.slow>.75)) continue;
        const pulse=Math.sin((game.timer||0)*10+(e.seed||0))*0.5+0.5;
        ctx.save();
        ctx.globalAlpha=0.72+0.22*pulse;
        ctx.strokeStyle='rgba(167,243,255,.95)';
        ctx.lineWidth=2.4;
        ctx.shadowColor='rgba(167,243,255,.75)';
        ctx.shadowBlur=8;
        ctx.beginPath();
        ctx.arc(e.x,e.y,(e.r||12)+5+pulse*1.5,0,Math.PI*2);
        ctx.stroke();
        ctx.globalAlpha=0.35+0.2*pulse;
        ctx.lineWidth=1.2;
        ctx.beginPath();
        ctx.arc(e.x,e.y,(e.r||12)+9,0,Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
    };
    drawEnemies.__slowOutlineV87=true;
  }

  wait();
})();
