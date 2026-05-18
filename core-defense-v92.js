// Core Defense v92
// Single entry point. Loads the proven Core layers, then applies safe final tuning patches.
(function(){
  if(window.__coreDefenseV92Loaded) return;
  window.__coreDefenseV92Loaded = true;

  const VERSION = '150';
  const params = new URLSearchParams(window.location.search);
  const isTutorialLevel = params.get('game') === 'core' && params.get('level') === '0';

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

  function tuneTutorialSpeed(){
    if(!isTutorialLevel || window.__coreTutorialSpeedV150 || typeof update !== 'function') return;
    window.__coreTutorialSpeedV150 = true;
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
    if(window.__coreStableSpeedRestoreV150 || typeof updateEnemies !== 'function') return;
    window.__coreStableSpeedRestoreV150 = true;
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
    if(window.__coreSpecialDurabilityV150 || typeof spawnEnemy !== 'function') return;
    window.__coreSpecialDurabilityV150 = true;
    const oldSpawnEnemy = spawnEnemy;
    spawnEnemy = function(){
      const before = window.game && Array.isArray(game.enemies) ? game.enemies.length : 0;
      oldSpawnEnemy.call(this);
      if(!window.game || !Array.isArray(game.enemies)) return;
      for(let i = before; i < game.enemies.length; i++){
        const unit = game.enemies[i];
        if(!unit || !unit.behavior || unit.__specialDurabilityV150) continue;
        let mult = 1;
        if(unit.behavior === 'swarm') mult = 1.45;
        else if(unit.behavior === 'dash') mult = 1.30;
        else if(unit.behavior === 'armor') mult = 1.40;
        else if(unit.behavior === 'split') mult = 1.35;
        if(mult > 1 && typeof unit.hp === 'number'){
          unit.hp = Math.ceil(unit.hp * mult);
          unit.maxHp = unit.hp;
          unit.__specialDurabilityV150 = true;
        }
      }
    };
  }

  function rebalanceTowerRoles(){
    if(window.__coreTowerRolesV150 || typeof updateTowers !== 'function') return;
    window.__coreTowerRolesV150 = true;
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

        if(pulse && unit.behavior !== 'split'){
          unit.hp = Math.min(unit.maxHp, unit.hp + dealt * 0.58);
        }
        if(unit.behavior === 'armor' && beam){
          unit.hp -= dealt * 0.28;
        }
        if(unit.behavior === 'dash' && freeze){
          unit.hp -= dealt * 0.18;
          unit.slow = Math.max(unit.slow || 0, 1.2);
          unit.dashTime = 0;
        }
        if(unit.behavior === 'swarm' && wave){
          unit.hp -= dealt * 0.26;
        }
        if(unit.behavior === 'split' && pulse){
          unit.hp -= dealt * 0.20;
        }
      }
    };
  }

  async function boot(){
    for(const layer of CORE_STACK) await loadLayer(layer);
    tuneTutorialSpeed();
    stabilizeEnemySpeedRestore();
    boostSpecialDurability();
    rebalanceTowerRoles();
    window.__coreDefenseV92Ready = true;
  }

  boot().catch(showLoadError);
})();
