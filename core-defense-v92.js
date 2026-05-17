// Core Defense v92
// Clean single entry point for Core Defense.
//
// Why this exists:
// - index.html should only load one Core file.
// - The current working gameplay is preserved in proven versioned layers.
// - Movement speed is controlled by core-square-arena-v88.js and core-balance-tuning-v89.js.
//
// Current safe load order:
// 1. core-defense-v84.js              Base polished Core wrapper, built on v80 + countdown
// 2. core-square-arena-v88.js         Square arena layout, spawn positions, and enemy movement
// 3. core-balance-tuning-v89.js       Balance/counter tuning and fixed readable enemy pacing
// 4. core-enemy-schedule-v85.js       Enemy behavior scheduling
// 5. core-tutorial-v86.js             Tutorial-only lesson flow, loaded only on level=0
// 6. core-slow-outline-v87.js         Freeze slow outline visual
//
// Active balance edit in this entry:
// - Wave towers deal a little extra damage against swarm units.
// - Enemy speed cleanup is restored by enemy object, not array index.
// - Tutorial enemies are scaled to the same fixed-speed baseline used in levels.
//
// Editing rule:
// Do NOT add another script to index.html. Add/merge Core behavior here, then test.
(function(){
  if(window.__coreDefenseV92Loaded) return;
  window.__coreDefenseV92Loaded = true;

  const VERSION = '143';
  const params = new URLSearchParams(window.location.search);
  const isTutorialLevel = params.get('game') === 'core' && params.get('level') === '0';

  const CORE_STACK = [
    { name: 'base', file: 'core-defense-v84.js' },
    { name: 'arena', file: 'core-square-arena-v88.js' },
    { name: 'balance', file: 'core-balance-tuning-v89.js' },
    { name: 'enemySchedule', file: 'core-enemy-schedule-v85.js' },
    ...(isTutorialLevel ? [{ name: 'tutorial', file: 'core-tutorial-v86.js' }] : []),
    { name: 'slowOutline', file: 'core-slow-outline-v87.js' }
  ];

  window.CORE_DEFENSE_VERSION = 'v92';
  window.CORE_DEFENSE_STACK = CORE_STACK.map(function(layer){ return layer.file; });

  function scriptUrl(file){
    return file + '?v=' + VERSION;
  }

  function loadLayer(layer){
    return new Promise(function(resolve,reject){
      const script = document.createElement('script');
      script.src = scriptUrl(layer.file);
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
    if(!isTutorialLevel || window.__coreTutorialSpeedV143) return;
    window.__coreTutorialSpeedV143 = true;
    if(typeof update !== 'function') return;

    const TUTORIAL_OLD_BASE = 6.5;
    const LEVEL_FIXED_BASE = 11;
    const SCALE = LEVEL_FIXED_BASE / TUTORIAL_OLD_BASE;
    const oldUpdate = update;

    update = function(dt){
      oldUpdate.call(this, dt);
      if(!window.game || !Array.isArray(game.enemies)) return;

      for(const enemy of game.enemies){
        if(!enemy || enemy.__tutorialSpeedMatched) continue;
        if(!enemy.behavior) continue;
        enemy.speed *= SCALE;
        enemy.__tutorialSpeedMatched = true;
      }
    };
  }

  function stabilizeEnemySpeedRestore(){
    if(window.__coreStableSpeedRestoreV143) return;
    window.__coreStableSpeedRestoreV143 = true;

    if(typeof updateEnemies !== 'function') return;

    const oldUpdateEnemies = updateEnemies;
    updateEnemies = function(dt){
      const speedByEnemy = new Map();

      if(window.game && Array.isArray(game.enemies)){
        for(const enemy of game.enemies){
          if(enemy && typeof enemy.speed === 'number'){
            speedByEnemy.set(enemy, enemy.speed);
          }
        }
      }

      oldUpdateEnemies.call(this, dt);

      if(!window.game || !Array.isArray(game.enemies)) return;

      for(const enemy of game.enemies){
        if(enemy && speedByEnemy.has(enemy)){
          enemy.speed = speedByEnemy.get(enemy);
        }
      }
    };
  }

  function buffWaveVsSwarm(){
    if(window.__coreWaveSwarmBuffV143) return;
    window.__coreWaveSwarmBuffV143 = true;

    const EXTRA_SWARM_DAMAGE = 0.15;

    if(typeof updateTowers !== 'function') return;

    const oldUpdateTowers = updateTowers;
    updateTowers = function(dt){
      const before = new Map();

      if(window.game && Array.isArray(game.enemies)){
        for(const enemy of game.enemies){
          before.set(enemy, enemy.hp);
        }
      }

      oldUpdateTowers.call(this, dt);

      if(!window.game || !Array.isArray(game.enemies) || !Array.isArray(game.shots) || !Array.isArray(TYPES) || !TYPES[3]) return;

      const recentWaveHit = game.shots.some(function(shot){
        return shot && shot.beam && shot.color === TYPES[3].color && shot.life > 0.1;
      });

      if(!recentWaveHit) return;

      for(const enemy of game.enemies){
        if(!enemy || enemy.behavior !== 'swarm') continue;
        const prevHp = before.get(enemy);
        if(typeof prevHp !== 'number') continue;

        const damageTaken = prevHp - enemy.hp;
        if(damageTaken > 0){
          enemy.hp -= damageTaken * EXTRA_SWARM_DAMAGE;
        }
      }
    };
  }

  async function boot(){
    for(const layer of CORE_STACK){
      await loadLayer(layer);
    }

    tuneTutorialSpeed();
    stabilizeEnemySpeedRestore();
    buffWaveVsSwarm();

    window.__coreDefenseV92Ready = true;
  }

  boot().catch(showLoadError);
})();
