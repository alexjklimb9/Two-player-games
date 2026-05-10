// Core Defense v58: economy, tower choice, selected-tower boost, visible costs.
(function(){
  game.money = 0;
  game.buildType = 0;

  const oldStartGame = startGame;
  startGame = function(e){
    oldStartGame(e);
    game.money = 6;
    game.buildType = 0;
  };

  const oldSpawnEnemy = spawnEnemy;
  spawnEnemy = function(){
    const before = game.enemies.length;
    oldSpawnEnemy();
    const e = game.enemies[game.enemies.length - 1];
    if(e && game.enemies.length > before){
      const lvl = LEVEL.number || 2;
      e.hp = e.maxHp = Math.ceil(e.maxHp * 1.15 + game.wave * .65 + lvl * .85);
      e.reward = 2 + Math.floor(e.maxHp / 7);
      e.speed *= .88;
    }
  };

  function buildCost(s){
    if(!s.type && s.type !== 0) return 6;
    if(s.level >= 3) return 0;
    return 5 + s.level * 5;
  }

  function actionLabel(){
    const s = game.slots[game.selected];
    const cost = buildCost(s);
    if(!s.type && s.type !== 0) return 'BUILD $' + cost;
    if(s.level >= 3) return 'MAX';
    return 'UP $' + cost;
  }

  buildUpgrade = function(){
    const s = game.slots[game.selected];
    const cost = buildCost(s);
    if(s.level >= 3){
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

  repair = function(){
    const cost = 8;
    if(game.coreHp < game.maxHp && game.money >= cost){
      game.money -= cost;
      game.coreHp++;
      spark(cx(), cy(), C.green, 18);
    }
  };

  special = function(){
    if(game.specialCd > 0) return;
    const s = game.slots[game.selected];
    const p = slotPos(game.selected);
    if(!s || (s.type !== 0 && !s.type)){
      spark(p.x, p.y, C.danger, 10);
      game.specialCd = 1.2;
      return;
    }
    s.boost = 4.5;
    s.flash = 1.4;
    game.specialCd = 7;
    spark(p.x, p.y, TYPES[s.type].color, 30);
  };

  function angleDiff(a,b){
    return Math.atan2(Math.sin(a-b), Math.cos(a-b));
  }

  nearestEnemy = function(x,y,range,aimAngle){
    let best = null;
    let bestDist = range;
    const cone = .95;
    for(const e of game.enemies){
      const dx = e.x - x;
      const dy = e.y - y;
      const d = Math.hypot(dx,dy);
      if(d >= bestDist) continue;
      const a = Math.atan2(dy,dx);
      if(Math.abs(angleDiff(a, aimAngle)) > cone) continue;
      best = e;
      bestDist = d;
    }
    return best;
  };

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
      if(s.cd <= 0){
        const target = nearestEnemy(pos.x, pos.y, t.range + s.level * 22 + (boosted ? 30 : 0), pos.a);
        if(target){
          s.cd = Math.max(.12, (t.rate - s.level * .075) * (boosted ? .48 : 1));
          if(t.kind === 'slow') target.slow = (boosted ? 2.2 : 1.3) + s.level * .2;
          target.hp -= t.damage * s.level * (boosted ? 1.85 : 1);
          game.shots.push({x:pos.x,y:pos.y,tx:target.x,ty:target.y,life:.18,color:t.color,beam:t.kind==='beam'});
          s.flash = boosted ? 1.3 : 1;
        }
      }
    }
  };

  updateEnemies = function(dt){
    for(let i=game.enemies.length-1;i>=0;i--){
      const e = game.enemies[i];
      const a = Math.atan2(cy()-e.y, cx()-e.x);
      const sp = e.speed * (e.slow > 0 ? .52 : 1);
      e.x += Math.cos(a) * sp * dt;
      e.y += Math.sin(a) * sp * dt;
      e.slow = Math.max(0, e.slow - dt);

      if(e.hp <= 0){
        spark(e.x,e.y,C.gold,10);
        game.enemies.splice(i,1);
        game.kills++;
        game.money += e.reward || 3;
        continue;
      }

      if(Math.hypot(e.x-cx(), e.y-cy()) < 42){
        game.enemies.splice(i,1);
        game.coreHp--;
        spark(cx(),cy(),C.danger,20);
        if(game.coreHp <= 0) endGame('The core was destroyed.');
      }
    }
  };

  const oldUpdate = update;
  update = function(dt){
    if(game.running){
      if(game.input.topLeft){
        game.buildType = (game.buildType + 1) % TYPES.length;
        game.input.topLeft = false;
      }
      if(game.input.topRight){
        game.selected = (game.selected + 1) % 6;
        game.input.topRight = false;
      }
    }
    oldUpdate(dt);
    if(game.running){
      const t = TYPES[game.buildType];
      const s = game.slots[game.selected];
      fallText.textContent = '$' + game.money;
      holdText.textContent = s && s.boost > 0 ? 'BOOST ' + Math.ceil(s.boost) : t.name;
    }
  };

  controls = function(){
    if(!game.running) return;
    const w = canvas.width * .31, h = 56;
    drawButton(canvas.width*.02,76,w,h,'TYPE',game.input.topLeft,C.blue);
    drawButton(canvas.width*.345,76,w,h,actionLabel(),game.input.topMid,C.blue);
    drawButton(canvas.width*.67,76,w,h,'SLOT',game.input.topRight,C.blue);
    const y = canvas.height - 90;
    drawButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose);
    drawButton(canvas.width*.345,y,w,h,'BOOST',game.input.bottomMid,C.rose);
    drawButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose);
  };
})();