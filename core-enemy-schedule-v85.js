// Core enemy schedule v85: tutorial enemy intro + all enemy types across every level.
(function(){
  function wait(){
    if(typeof game==='object'&&typeof spawnEnemy==='function'&&Array.isArray(game.enemies)&&typeof LV!=='undefined') install();
    else setTimeout(wait,50);
  }

  function colorFor(e,b){
    const t=e.kind==='large'?2:e.kind==='medium'?1:0;
    const colors={
      swarm:['#fde68a','#facc15','#f59e0b'],
      dash:['#fda4af','#fb7185','#e11d48'],
      armor:['#cbd5e1','#93a4b8','#64748b'],
      split:['#ddd6fe','#c084fc','#9333ea']
    };
    return colors[b] ? colors[b][t] : e.color;
  }

  function makeSwarmChild(x,y,n,total){
    const spread=18;
    const row=(n%3)-1;
    const col=Math.floor(n/3);
    return {
      x:x+row*spread+(Math.random()*8-4),
      y:y+col*spread+(Math.random()*8-4),
      hp:2,
      maxHp:2,
      speed:54+Math.random()*10,
      slow:0,
      r:8,
      reward:1,
      kind:'small',
      behavior:'swarm',
      seed:Math.random()*10,
      color:'#facc15'
    };
  }

  function unlockWave(type,lv){
    const schedule={
      1:{swarm:2,dash:3,armor:4,split:5},
      2:{swarm:3,dash:5,armor:7,split:9},
      3:{swarm:2,dash:4,armor:6,split:8},
      4:{swarm:2,dash:3,armor:5,split:6},
      5:{swarm:2,dash:3,armor:4,split:5}
    };
    return (schedule[lv]||schedule[3])[type]||99;
  }

  function canUse(type,e,w,lv){
    if(w<unlockWave(type,lv)) return false;
    if(type==='swarm') return e.kind==='small';
    if(type==='dash') return e.kind!=='large';
    if(type==='armor') return e.kind==='large';
    if(type==='split') return e.kind==='medium';
    return false;
  }

  function pickBehavior(e){
    const lv=LV||1;
    const w=Math.max(1,game.wave||1);
    if(lv===0) return null;

    game.__enemyIntroSeen=game.__enemyIntroSeen||{};

    if(lv===1){
      if(w===2&&e.kind==='small'&&!game.__enemyIntroSeen.swarm){game.__enemyIntroSeen.swarm=1;return 'swarm'}
      if(w===3&&e.kind!=='large'&&!game.__enemyIntroSeen.dash){game.__enemyIntroSeen.dash=1;return 'dash'}
      if(w===4&&e.kind==='large'&&!game.__enemyIntroSeen.armor){game.__enemyIntroSeen.armor=1;return 'armor'}
      if(w>=5&&e.kind==='medium'&&!game.__enemyIntroSeen.split){game.__enemyIntroSeen.split=1;return 'split'}
    }

    const options=['split','armor','dash','swarm'].filter(type=>canUse(type,e,w,lv));
    if(!options.length) return null;
    const chance=lv===1?.35:lv===2?.22:lv===3?.28:lv===4?.34:.42;
    if(Math.random()>chance) return null;
    return options[Math.floor(Math.random()*options.length)];
  }

  function applyBehavior(e,b){
    if(!e||e.behavior||!b) return;
    e.behavior=b;
    e.seed=Math.random()*10;
    e.dashCd=.8+Math.random();
    e.dashTime=0;
    e.splitDone=false;

    if(b==='swarm'){
      e.r=Math.max(8,e.r*.78);
      e.speed*=1.35;
      e.hp=Math.max(1,Math.ceil(e.hp*.65));
      e.maxHp=e.hp;
      e.reward=Math.max(1,(e.reward||2)-1);
    }else if(b==='dash'){
      e.speed*=.94;
      e.hp=Math.ceil(e.hp*1.08);
      e.maxHp=e.hp;
    }else if(b==='armor'){
      e.speed*=.82;
      e.hp=Math.ceil(e.hp*1.45);
      e.maxHp=e.hp;
      e.reward=(e.reward||3)+2;
    }else if(b==='split'){
      e.hp=Math.ceil(e.hp*1.2);
      e.maxHp=e.hp;
      e.reward=(e.reward||3)+1;
    }
    e.color=colorFor(e,b);
  }

  function install(){
    if(spawnEnemy.__scheduleV85) return;
    const oldSpawn=spawnEnemy;
    spawnEnemy=function(){
      const before=game.enemies.length;
      oldSpawn();
      for(let i=before;i<game.enemies.length;i++){
        const e=game.enemies[i];
        const behavior=pickBehavior(e);
        applyBehavior(e,behavior);
        if(behavior==='swarm'){
          const total=3+Math.floor(Math.random()*3);
          for(let n=1;n<total;n++)game.enemies.push(makeSwarmChild(e.x,e.y,n,total));
        }
      }
    };
    spawnEnemy.__scheduleV85=true;
  }

  wait();
})();
