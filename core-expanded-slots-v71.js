// Core Defense v71: 12 tower slots and upgrades to level 5.
(function(){
  function installExpansion(){
    if(typeof game === 'undefined' || typeof canvas === 'undefined') return;

    makeSlots = function(){
      game.slots = [];
      for(let i=0;i<12;i++){
        game.slots.push({type:null,level:0,cd:0,flash:0,boost:0});
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
      return {x:cx()+Math.cos(a)*r,y:cy()+Math.sin(a)*r,a};
    };

    function buildCost(s){
      if(!s.type && s.type !== 0) return 6;
      if(s.level >= 5) return 0;
      return 5 + s.level * 5;
    }

    buildUpgrade = function(){
      const s = game.slots[game.selected];
      const cost = buildCost(s);
      if(s.level >= 5){
        spark(slotPos(game.selected).x, slotPos(game.selected).y, C.white, 6);
        return;
      }
      if(game.money < cost){
        spark(slotPos(game.selected).x, slotPos(game.selected).y, C.danger, 8);
        return;
      }
      game.money -= cost;
      if(!s.type && s.type !== 0){
        s.type = game.buildType;
        s.level = 1;
        s.cd = 0;
        s.boost = 0;
        s.flash = 1;
        spark(slotPos(game.selected).x, slotPos(game.selected).y, TYPES[s.type].color, 14);
      } else {
        s.level++;
        s.flash = 1;
        spark(slotPos(game.selected).x, slotPos(game.selected).y, TYPES[s.type].color, 16);
      }
    };

    const oldUpdate = update;
    update = function(dt){
      oldUpdate(dt);
      if(game && game.running && game.selected >= 12) game.selected = 0;
    };
  }

  installExpansion();
  setTimeout(installExpansion,100);
  setTimeout(installExpansion,300);
  setTimeout(installExpansion,700);
})();