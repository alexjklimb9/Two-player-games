// Core Defense v92
// Single entry point. Loads the proven Core layers, then applies safe final tuning patches.
(function(){
  if(window.__coreDefenseV92Loaded) return;
  window.__coreDefenseV92Loaded = true;

  const VERSION = '148';
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
    if(!isTutorialLevel || window.__coreTutorialSpeedV148 || typeof update !== 'function') return;
    window.__coreTutorialSpeedV148 = true;
    const scale = 11 / 6.5;
    const oldUpdate = update;
    update = function(dt){
      oldUpdate.call(this, dt);
      if(!window.game || !Array.isArray(game.enemies)) return;
      for(const enemy of game.enemies){
        if(enemy && enemy.behavior && !enemy.__tutorialSpeedMatched){
          enemy.speed *= scale;
          enemy.__tutorialSpeedMatched = true;
        }
      }
    };
  }

  function stabilizeEnemySpeedRestore(){
    if(window.__coreStableSpeedRestoreV148 || typeof updateEnemies !== 'function') return;
    window.__coreStableSpeedRestoreV148 = true;
    const oldUpdateEnemies = updateEnemies;
    updateEnemies = function(dt){
      const speedByEnemy = new Map();
      if(window.game && Array.isArray(game.enemies)){
        for(const enemy of game.enemies){
          if(enemy && typeof enemy.speed === 'number') speedByEnemy.set(enemy, enemy.speed);
        }
      }
      oldUpdateEnemies.call(this, dt);
      if(!window.game || !Array.isArray(game.enemies)) return;
      for(const enemy of game.enemies){
        if(enemy && speedByEnemy.has(enemy)) enemy.speed = speedByEnemy.get(enemy);
      }
    };
  }

  async function boot(){
    for(const layer of CORE_STACK) await loadLayer(layer);
    tuneTutorialSpeed();
    stabilizeEnemySpeedRestore();
    window.__coreDefenseV92Ready = true;
  }

  boot().catch(showLoadError);
})();
