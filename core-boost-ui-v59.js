// Core Defense v59: show boost countdown directly over boosted tower.
(function(){
  const oldDrawSlots = drawSlots;
  drawSlots = function(){
    oldDrawSlots();
    if(!game || !game.slots) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 13px Arial';
    for(let i = 0; i < game.slots.length; i++){
      const s = game.slots[i];
      if(!s || !s.boost || s.boost <= 0) continue;
      const p = slotPos(i);
      const t = TYPES[s.type] || {color:C.white};
      const label = Math.ceil(s.boost) + 's';
      ctx.fillStyle = 'rgba(17,24,39,.92)';
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2;
      rr(p.x - 20, p.y - 42, 40, 22, 11);
      ctx.fillStyle = t.color;
      ctx.fillText(label, p.x, p.y - 31);
    }
    ctx.restore();
  };
})();