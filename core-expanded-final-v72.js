// Core Defense v72: final fix for 12-slot cycling and level 5 upgrade labels.
(function(){
  function installV72(){
    if(typeof game === 'undefined' || typeof canvas === 'undefined' || typeof ctx === 'undefined') return;

    makeSlots = function(){
      game.slots = [];
      for(let i = 0; i < 12; i++){
        game.slots.push({type:null, level:0, cd:0, flash:0, boost:0});
      }
    };

    slotPos = function(i){
      const inner = i >= 6;
      const ringIndex = inner ? i - 6 : i;
      const offset = inner ? Math.PI / 6 : 0;
      const a = game.ring + ringIndex * Math.PI * 2 / 6 - Math.PI / 2 + offset;
      const outerR = Math.min(canvas.width, canvas.height) * .14 + 28;
      const innerR = Math.min(canvas.width, canvas.height) * .095 + 18;
      const r = inner ? innerR : outerR;
      return {x:cx()+Math.cos(a)*r, y:cy()+Math.sin(a)*r, a};
    };

    function isEmptySlot(s){ return !s || (s.type !== 0 && !s.type); }
    function costFor(s){
      if(isEmptySlot(s)) return 6;
      if(s.level >= 5) return 0;
      return 5 + s.level * 5;
    }

    buildUpgrade = function(){
      const s = game.slots[game.selected];
      if(!s) return;
      const p = slotPos(game.selected);
      const cost = costFor(s);
      if(s.level >= 5){ spark(p.x,p.y,C.white,6); return; }
      if(game.money < cost){ spark(p.x,p.y,C.danger,8); return; }
      game.money -= cost;
      if(isEmptySlot(s)){
        s.type = game.buildType;
        s.level = 1;
        s.cd = 0;
        s.boost = 0;
        s.flash = 1;
        spark(p.x,p.y,TYPES[s.type].color,14);
      }else{
        s.level++;
        s.flash = 1;
        spark(p.x,p.y,TYPES[s.type].color,16);
      }
    };

    function topButton(x,y,w,h,label,on,color){
      drawButton(x,y,w,h,'',on,color);
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate(Math.PI);
      ctx.fillStyle = on ? '#0b0f14' : C.white;
      ctx.font = '900 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label,0,0);
      ctx.restore();
    }

    controls = function(){
      if(!game.running) return;
      const w = canvas.width * .31;
      const h = 56;
      const s = game.slots && game.slots[game.selected];
      const currentType = TYPES && TYPES[game.buildType] ? TYPES[game.buildType].name : 'Tower';
      let buildLabel = 'BUILD $6';
      if(s){
        if(isEmptySlot(s)) buildLabel = 'BUILD $6';
        else if(s.level >= 5) buildLabel = 'MAX';
        else buildLabel = 'UP $' + (5 + s.level * 5);
      }
      let boostLabel = 'BOOST';
      if(s && s.boost > 0) boostLabel = 'BOOST ' + Math.ceil(s.boost) + 's';
      else if(game.specialCd && game.specialCd > 0) boostLabel = 'WAIT ' + Math.ceil(game.specialCd) + 's';

      topButton(canvas.width*.02,76,w,h,'TYPE ' + currentType,game.input.topLeft,C.blue);
      topButton(canvas.width*.345,76,w,h,buildLabel,game.input.topMid,C.blue);
      topButton(canvas.width*.67,76,w,h,'SLOT ' + ((game.selected || 0) + 1) + '/12',game.input.topRight,C.blue);
      const y = canvas.height - 90;
      drawButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose);
      drawButton(canvas.width*.345,y,w,h,boostLabel,game.input.bottomMid,C.rose);
      drawButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose);
    };

    if(!game.__v72UpdateInstalled){
      const priorUpdate = update;
      game.__v72UpdateInstalled = true;
      update = function(dt){
        const slotPressed = game.running && game.input.topRight;
        if(slotPressed) game.input.topRight = false;
        priorUpdate(dt);
        if(slotPressed){
          game.selected = ((game.selected || 0) + 1) % 12;
        }
        if(game.selected >= 12) game.selected = 0;
      };
    }
  }

  installV72();
  setTimeout(installV72,100);
  setTimeout(installV72,300);
  setTimeout(installV72,700);
  setTimeout(installV72,1500);
})();