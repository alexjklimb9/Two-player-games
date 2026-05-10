// Core Defense v69: force-hide the old DOM HUD every frame.
(function(){
  function hideOldHud(){
    const hud = document.getElementById('hud');
    if(hud) hud.style.display = 'none';
  }

  const oldUpdate = update;
  update = function(dt){
    oldUpdate(dt);
    hideOldHud();
  };

  const oldRender = render;
  render = function(){
    hideOldHud();
    oldRender();
    hideOldHud();
  };

  hideOldHud();
  setInterval(hideOldHud, 250);
})();