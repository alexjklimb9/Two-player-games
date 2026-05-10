// Core Defense v61: add Wave tower that damages every enemy in its cone.
(function(){
  if(!TYPES.find(t => t.name === 'Wave')){
    TYPES.push({name:'Wave', color:'#7dd3fc', range:155, rate:1.05, damage:.42, kind:'wave'});
  }

  function angleDiff(a,b){
    return Math.atan2(Math.sin(a-b), Math.cos(a-b));
  }

  function enemiesInCone(x,y,range,aimAngle,cone){
    const hits = [];
    for(const e of game.enemies){
      const dx = e.x - x;
      const dy = e.y - y;
      const d = Math.hypot(dx,dy);
      if(d >= range) continue;
      const a = Math.atan2(dy,dx);
      if(Math.abs(angleDiff(a, aimAngle)) > cone) continue;
      hits.push(e);
    }
    return hits;
  }

  updateTowers = function(dt){
    for(let i=0;i<game.slots.length;i++){
      const s = game.slots[i];
      if(s.flash > 0) s.flash -= dt * 3;
      if(s.boost > 0) s.boost -= dt;
      if(!s.type && s.type !== 0) continue;
      s.cd -= dt;
      const pos = slotPos(i);
      const t = TYPES[s.type];
      const boosted = s.boost > 0;
      const range = t.range + s.level * 22 + (boosted ? 30 : 0);
      const cone = t.kind === 'wave' ? (boosted ? 1.28 : 1.02) : .95;

      if(s.cd <= 0){
        if(t.kind === 'wave'){
          const hits = enemiesInCone(pos.x, pos.y, range, pos.a, cone);
          if(hits.length){
            s.cd = Math.max(.28, (t.rate - s.level * .055) * (boosted ? .62 : 1));
            for(const e of hits){
              e.hp -= t.damage * s.level * (boosted ? 1.7 : 1);
              e.slow = Math.max(e.slow || 0, boosted ? .45 : .18);
            }
            const endX = pos.x + Math.cos(pos.a) * range;
            const endY = pos.y + Math.sin(pos.a) * range;
            game.shots.push({x:pos.x,y:pos.y,tx:endX,ty:endY,life:.2,color:t.color,beam:true});
            s.flash = boosted ? 1.35 : 1;
          }
        } else {
          const target = nearestEnemy(pos.x, pos.y, range, pos.a);
          if(target){
            s.cd = Math.max(.12, (t.rate - s.level * .075) * (boosted ? .48 : 1));
            if(t.kind === 'slow') target.slow = (boosted ? 2.2 : 1.3) + s.level * .2;
            target.hp -= t.damage * s.level * (boosted ? 1.85 : 1);
            game.shots.push({x:pos.x,y:pos.y,tx:target.x,ty:target.y,life:.18,color:t.color,beam:t.kind==='beam'});
            s.flash = boosted ? 1.3 : 1;
          }
        }
      }
    }
  };
})();