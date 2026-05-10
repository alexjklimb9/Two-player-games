// Core Defense v62: show tower type, active boost, and boost cooldown on buttons.
(function(){
  controls = function(){
    if(!game.running) return;
    const w = canvas.width * .31;
    const h = 56;
    const s = game.slots && game.slots[game.selected];
    const currentType = TYPES[game.buildType] ? TYPES[game.buildType].name : 'Tower';
    const typeLabel = 'TYPE ' + currentType;

    let boostLabel = 'BOOST';
    if(s && s.boost > 0){
      boostLabel = 'BOOST ' + Math.ceil(s.boost) + 's';
    } else if(game.specialCd && game.specialCd > 0){
      boostLabel = 'WAIT ' + Math.ceil(game.specialCd) + 's';
    }

    let buildLabel = 'BUILD $6';
    if(s){
      if(!s.type && s.type !== 0) buildLabel = 'BUILD $6';
      else if(s.level >= 3) buildLabel = 'MAX';
      else buildLabel = 'UP $' + (5 + s.level * 5);
    }

    drawButton(canvas.width*.02,76,w,h,typeLabel,game.input.topLeft,C.blue);
    drawButton(canvas.width*.345,76,w,h,buildLabel,game.input.topMid,C.blue);
    drawButton(canvas.width*.67,76,w,h,'SLOT',game.input.topRight,C.blue);

    const y = canvas.height - 90;
    drawButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose);
    drawButton(canvas.width*.345,y,w,h,boostLabel,game.input.bottomMid,C.rose);
    drawButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose);
  };
})();