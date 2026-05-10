// Core Defense v65: final combat override so Wave always hits every enemy in its cone.
(function(){
  function installCombat(){
    if(typeof game === 'undefined' || typeof TYPES === 'undefined' || typeof slotPos === 'undefined') return;

    if(!TYPES.find(t => t.name === 'Wave')){
      TYPES.push({name:'Wave', color:'#7dd3fc', range:155, rate:1.05, damage:.42, kind:'wave'});
    }

    function angleDiff(a,b){
      return Math.atan2(Math.sin(a-b), Math.cos(a-b));
    }

    function targetInCone(x,y,e,range,aimAngle,cone){
      const dx = e.x - x;
      const dy = e.y - y;
      const d = Math.hypot(dx,dy);
      if(d >= range) return false;
      const a = Math.atan2(dy,dx);
      return Math.abs(angleDiff(a, aimAngle)) <= cone;
    }

    function firstEnemyInCone(x,y,range,aimAngle,cone){
      let best = null;
      let bestDist = range;
      for(const e of game.enemies){
        if(!targetInCone(x,y,e,range,aimAngle,cone)) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if(d < bestDist){
          best = e;
          bestDist = d;
        }
      }
      return best;
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
        if(!t) continue;
        const boosted = s.boost > 0;
        const range = t.range + s.level * 22 + (boosted ? 30 : 0);

        if(s.cd <= 0){
          if(t.kind === 'wave'){
            const cone = boosted ? 1.32 : 1.04;
            let hits = 0;
            for(const e of game.enemies){
              if(targetInCone(pos.x,pos.y,e,range,pos.a,cone)){
                e.hp -= t.damage * s.level * (boosted ? 1.75 : 1);
                e.slow = Math.max(e.slow || 0, boosted ? .55 : .2);
                hits++;
              }
            }
            if(hits > 0){
              s.cd = Math.max(.28, (t.rate - s.level * .055) * (boosted ? .62 : 1));
              const endX = pos.x + Math.cos(pos.a) * range;
              const endY = pos.y + Math.sin(pos.a) * range;
              game.shots.push({x:pos.x,y:pos.y,tx:endX,ty:endY,life:.22,color:t.color,beam:true});
              s.flash = boosted ? 1.35 : 1;
            }
          } else {
            const target = firstEnemyInCone(pos.x,pos.y,range,pos.a,.95);
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
  }

  installCombat();
  setTimeout(installCombat,100);
  setTimeout(installCombat,300);
  setTimeout(installCombat,700);
})();