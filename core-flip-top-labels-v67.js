// Core Defense v67: flip top player button labels so the top player can read them.
(function(){
  function installFlippedTopControls(){
    if(typeof game === 'undefined' || typeof canvas === 'undefined' || typeof drawButton === 'undefined') return;

    function topButton(x,y,w,h,label,on,color){
      drawButton(x,y,w,h,'',on,color);
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate(Math.PI);
      ctx.fillStyle = on ? '#0b0f14' : C.white;
      ctx.font = '900 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

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

      topButton(canvas.width*.02,76,w,h,typeLabel,game.input.topLeft,C.blue);
      topButton(canvas.width*.345,76,w,h,buildLabel,game.input.topMid,C.blue);
      topButton(canvas.width*.67,76,w,h,'SLOT',game.input.topRight,C.blue);

      const y = canvas.height - 90;
      drawButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose);
      drawButton(canvas.width*.345,y,w,h,boostLabel,game.input.bottomMid,C.rose);
      drawButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose);
    };
  }

  installFlippedTopControls();
  setTimeout(installFlippedTopControls,100);
  setTimeout(installFlippedTopControls,300);
  setTimeout(installFlippedTopControls,700);
})();