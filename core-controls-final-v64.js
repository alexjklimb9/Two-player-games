// Core Defense v64: final controls override so labels survive async script load order.
(function(){
  function installControls(){
    if(typeof game === 'undefined' || typeof drawButton === 'undefined' || typeof canvas === 'undefined') return;

    controls = function(){
      if(!game.running) return;
      const w = canvas.width * .31;
      const h = 56;
      const s = game.slots && game.slots[game.selected];
      const currentType = TYPES && TYPES[game.buildType] ? TYPES[game.buildType].name : 'Tower';
      const typeLabel = 'TYPE ' + currentType;

      let buildLabel = 'BUILD $6';
      if(s){
        if(!s.type && s.type !== 0) buildLabel = 'BUILD $6';
        else if(s.level >= 3) buildLabel = 'MAX';
        else buildLabel = 'UP $' + (5 + s.level * 5);
      }

      let boostLabel = 'BOOST';
      if(s && s.boost > 0) boostLabel = 'BOOST ' + Math.ceil(s.boost) + 's';
      else if(game.specialCd && game.specialCd > 0) boostLabel = 'WAIT ' + Math.ceil(game.specialCd) + 's';

      drawButton(canvas.width*.02,76,w,h,typeLabel,game.input.topLeft,C.blue);
      drawButton(canvas.width*.345,76,w,h,buildLabel,game.input.topMid,C.blue);
      drawButton(canvas.width*.67,76,w,h,'SLOT',game.input.topRight,C.blue);

      const y = canvas.height - 90;
      drawButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose);
      drawButton(canvas.width*.345,y,w,h,boostLabel,game.input.bottomMid,C.rose);
      drawButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose);
    };
  }

  installControls();
  setTimeout(installControls, 100);
  setTimeout(installControls, 300);
  setTimeout(installControls, 700);
})();