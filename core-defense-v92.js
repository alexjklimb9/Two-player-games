// Core Defense v92
// Single entry point. Loads the proven Core layers, then applies safe final tuning patches.
(function(){
  if(window.__coreDefenseV92Loaded) return;
  window.__coreDefenseV92Loaded = true;

  const VERSION = '154';
  const params = new URLSearchParams(window.location.search);
  const isTutorialLevel = params.get('game') === 'core' && params.get('level') === '0';
  const levelCap = Math.max(1, Math.min(5, parseInt(params.get('level') || '2', 10) || 2));

  const CORE_STACK = [
    { name:'base', file:'core-defense-v84.js' },
    { name:'arena', file:'core-square-arena-v88.js' },
    { name:'balance', file:'core-balance-tuning-v89.js' },
    { name:'enemySchedule', file:'core-enemy-schedule-v85.js' },
    ...(isTutorialLevel ? [{ name:'tutorial', file:'core-tutorial-v86.js' }] : []),
    { name:'slowOutline', file:'core-slow-outline-v87.js' }
  ];

  window.CORE_DEFENSE_VERSION = 'v92';
  window.CORE_DEFENSE_STACK = CORE_STACK.map(layer => layer.file);
  window.CORE_TOWER_LEVEL_CAP = levelCap;

  function loadLayer(layer){
    return new Promise(function(resolve,reject){
      const script = document.createElement('script');
      script.src = layer.file + '?v=' + VERSION;
      script.async = false;
      script.dataset.coreLayer = layer.name;
      script.onload = function(){ resolve(layer); };
      script.onerror = function(){ reject(new Error('Core layer failed: ' + layer.file)); };
      document.body.appendChild(script);
    });
  }

  function showLoadError(error){
    console.error('[Core Defense v92]', error);
    const panel = document.querySelector('#startOverlay .panel');
    if(!panel) return;
    const msg = document.createElement('p');
    msg.className = 'tip';
    msg.style.color = '#ff5c4a';
    msg.textContent = 'Core Defense failed to load. Refresh and try again.';
    panel.appendChild(msg);
  }

  function tuneTowerStats(){
    if(window.__coreTowerStatsV154 || !Array.isArray(window.TYPES)) return;
    window.__coreTowerStatsV154 = true;
    TYPES[0].range = 158;
    TYPES[0].rate = 0.62;
    TYPES[0].damage = 0.72;
    TYPES[1].range = 245;
    TYPES[1].rate = 0.86;
    TYPES[1].damage = 2.55;
    TYPES[2].range = 178;
    TYPES[2].rate = 1.0;
    TYPES[2].damage = 0.58;
    TYPES[3].range = 168;
    TYPES[3].rate = 0.98;
    TYPES[3].damage = 0.52;
  }

  function capTowerUpgrades(){
    if(window.__coreTowerCapV154 || typeof buildUpgrade !== 'function') return;
    window.__coreTowerCapV154 = true;
    const oldBuildUpgrade = buildUpgrade;
    buildUpgrade = function(){
      if(window.game && Array.isArray(game.slots)){
        const slot = game.slots[game.selected];
        if(slot && !empty(slot) && slot.level >= levelCap){
          const p = slotPos(game.selected);
          if(typeof spark === 'function') spark(p.x, p.y, C.white, 6);
          return;
        }
      }
      oldBuildUpgrade.call(this);
    };

    if(typeof controls === 'function' && typeof buttonSurface === 'function'){
      controls = function(){
        if(!game.running) return;
        const w = canvas.width * .31;
        const h = 56;
        const s = game.slots[game.selected];
        const tower = TYPES[game.buildType];
        const capped = !empty(s) && s.level >= levelCap;
        const buildCost = price(s);
        const canBuy = !capped && game.money >= buildCost;
        const b = empty(s) ? 'BUILD $' + BUILD : capped ? 'MAX' : 'UP $' + buildCost;
        let boost = 'BOOST';
        let boostState = 'ready';
        if(s && s.boost > 0){boost = 'BOOST ' + Math.ceil(s.boost) + 's';boostState = 'active'}
        else if(game.specialCd > 0){boost = 'WAIT ' + Math.ceil(game.specialCd) + 's';boostState = 'cooldown'}
        buttonSurface(canvas.width * .02, 76, w, h, 'TYPE ' + tower.name, game.input.topLeft, tower.color, {rotate:true});
        buttonSurface(canvas.width * .345, 76, w, h, b, game.input.topMid, C.blue, {rotate:true, muted:!canBuy, ready:canBuy});
        buttonSurface(canvas.width * .67, 76, w, h, 'SLOT ' + (game.selected + 1) + '/12', game.input.topRight, C.blue, {rotate:true});
        const y = canvas.height - 90;
        buttonSurface(canvas.width * .02, y, w, h, 'ROT ◀', game.input.bottomLeft, C.rose);
        buttonSurface(canvas.width * .345, y, w, h, boost, game.input.bottomMid, C.rose, {ready:boostState === 'ready'});
        buttonSurface(canvas.width * .67, y, w, h, 'ROT ▶', game.input.bottomRight, C.rose);
      };
    }
  }

  function flattenUpgradeScaling(){
    if(window.__coreUpgradeScalingV154 || typeof updateTowers !== 'function') return;
    window.__coreUpgradeScalingV154 = true;
    const oldUpdateTowers = updateTowers;
    const virtualLevel = function(slot){
      const level = Math.max(1, slot.level || 1);
      const type = slot.type;
      const scale = type === 0 ? 0.58 : 0.72;
      return 1 + (level - 1) * scale;
    };
    updateTowers = function(dt){
      if(!window.game || !Array.isArray(game.slots)) return oldUpdateTowers.call(this, dt);
      const saved = [];
      for(const slot of game.slots){
        if(slot && typeof slot.level === 'number' && slot.level > 1){
          saved.push([slot, slot.level]);
          slot.level = virtualLevel(slot);
        }
      }
      oldUpdateTowers.call(this, dt);
      for(const pair of saved){
        pair[0].level = pair[1];
      }
    };
  }

  function tuneTutorialSpeed(){
    if(!isTutorialLevel || window.__coreTutorialSpeedV154 || typeof update !== 'function') return;
    window.__coreTutorialSpeedV154 = true;
    const scale = 11 / 6.5;
    const oldUpdate = update;
    update = function(dt){
      oldUpdate.call(this, dt);
      if(!window.game || !Array.isArray(game.enemies)) return;
      for(const unit of game.enemies){
        if(unit && unit.behavior && !unit.__tutorialSpeedMatched){
          unit.speed *= scale;
          unit.__tutorialSpeedMatched = true;
        }
      }
    };
  }

  function stabilizeEnemySpeedRestore(){
    if(window.__coreStableSpeedRestoreV154 || typeof updateEnemies !== 'function') return;
    window.__coreStableSpeedRestoreV154 = true;
    const oldUpdateEnemies = updateEnemies;
    updateEnemies = function(dt){
      const speedByUnit = new Map();
      if(window.game && Array.isArray(game.enemies)){
        for(const unit of game.enemies){
          if(unit && typeof unit.speed === 'number') speedByUnit.set(unit, unit.speed);
        }
      }
      oldUpdateEnemies.call(this, dt);
      if(!window.game || !Array.isArray(game.enemies)) return;
      for(const unit of game.enemies){
        if(unit && speedByUnit.has(unit)) unit.speed = speedByUnit.get(unit);
      }
    };
  }

  function boostSpecialDurability(){
    if(window.__coreSpecialDurabilityV154 || typeof spawnEnemy !== 'function') return;
    window.__coreSpecialDurabilityV154 = true;
    const oldSpawnEnemy = spawnEnemy;
    spawnEnemy = function(){
      const before = window.game && Array.isArray(game.enemies) ? game.enemies.length : 0;
      oldSpawnEnemy.call(this);
      if(!window.game || !Array.isArray(game.enemies)) return;
      for(let i = before; i < game.enemies.length; i++){
        const unit = game.enemies[i];
        if(!unit || !unit.behavior || unit.__specialDurabilityV154) continue;
        let mult = 1;
        if(unit.behavior === 'swarm') mult = 1.45;
        else if(unit.behavior === 'dash') mult = 1.30;
        else if(unit.behavior === 'armor') mult = 1.40;
        else if(unit.behavior === 'split') mult = 1.35;
        if(mult > 1 && typeof unit.hp === 'number'){
          unit.hp = Math.ceil(unit.hp * mult);
          unit.maxHp = unit.hp;
          unit.__specialDurabilityV154 = true;
        }
      }
    };
  }

  function rebalanceTowerRoles(){
    if(window.__coreTowerRolesV154 || typeof updateTowers !== 'function') return;
    window.__coreTowerRolesV154 = true;
    const oldUpdateTowers = updateTowers;
    updateTowers = function(dt){
      const before = new Map();
      if(window.game && Array.isArray(game.enemies)){
        for(const unit of game.enemies){
          if(unit) before.set(unit, unit.hp);
        }
      }
      oldUpdateTowers.call(this, dt);
      if(!window.game || !Array.isArray(game.enemies) || !Array.isArray(game.shots) || !Array.isArray(TYPES)) return;

      function hitBy(typeIndex, unit){
        const type = TYPES[typeIndex];
        if(!type) return false;
        return game.shots.some(function(shot){
          if(!shot || shot.color !== type.color || shot.life <= 0.06) return false;
          const endHit = Math.hypot((shot.tx || 0) - unit.x, (shot.ty || 0) - unit.y) < unit.r + 18;
          const beamHit = shot.beam && Math.hypot((shot.x || 0) - unit.x, (shot.y || 0) - unit.y) < (type.range || 0) + 80;
          return endHit || beamHit;
        });
      }

      for(const unit of game.enemies){
        if(!unit || !unit.behavior || !before.has(unit)) continue;
        const dealt = before.get(unit) - unit.hp;
        if(dealt <= 0) continue;
        const pulse = hitBy(0, unit);
        const beam = hitBy(1, unit);
        const freeze = hitBy(2, unit) || unit.slow > 0;
        const wave = hitBy(3, unit);
        if(pulse && unit.behavior !== 'split') unit.hp = Math.min(unit.maxHp, unit.hp + dealt * 0.65);
        if(unit.behavior === 'armor' && beam) unit.hp -= dealt * 0.32;
        if(unit.behavior === 'dash' && freeze){unit.hp -= dealt * 0.20;unit.slow = Math.max(unit.slow || 0, 1.25);unit.dashTime = 0;}
        if(unit.behavior === 'swarm' && wave) unit.hp -= dealt * 0.30;
        if(unit.behavior === 'split' && pulse) unit.hp -= dealt * 0.24;
      }
    };
  }

  async function boot(){
    for(const layer of CORE_STACK) await loadLayer(layer);
    tuneTowerStats();
    capTowerUpgrades();
    flattenUpgradeScaling();
    tuneTutorialSpeed();
    stabilizeEnemySpeedRestore();
    boostSpecialDurability();
    rebalanceTowerRoles();
    window.__coreDefenseV92Ready = true;
  }

  boot().catch(showLoadError);
})();
