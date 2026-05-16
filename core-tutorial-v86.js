// Core tutorial v86: one guided wave with tower and enemy explanations.
(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('game')!=='core'||params.get('level')!=='0') return;

  function wait(){
    if(typeof game==='object'&&typeof startGame==='function'&&typeof beginWave==='function'&&typeof spawnEnemy==='function'&&typeof endGame==='function'&&typeof render==='function') install();
    else setTimeout(wait,50);
  }

  const enemyInfo={
    basic:['BASIC ENEMY','Standard enemy. Build towers and rotate the ring so shots face the threat.'],
    swarm:['SWARM ENEMY','Small and fast. Great test for rotation and quick coverage.'],
    dash:['DASHER ENEMY','Moves normally, then lunges forward. Freeze or focus it early.'],
    armor:['ARMORED ENEMY','Slow but tough. Beam and upgrades are strong against armor.'],
    split:['SPLITTER ENEMY','Breaks into two small enemies when destroyed. Kill it away from the core.']
  };

  function install(){
    if(window.__coreTutorialV86) return;
    window.__coreTutorialV86=true;

    const oldStart=startGame;
    const oldBegin=beginWave;
    const oldSpawn=spawnEnemy;
    const oldRender=render;

    let title='CORE DEFENSE TUTORIAL';
    let body='Top player chooses tower, builds/upgrades, and changes slots. Bottom player rotates the ring and uses Boost.';
    let messageTime=999;
    let spawned=0;
    let tutorialDone=false;

    function setMessage(t,b,time=4.4){title=t;body=b;messageTime=time;}

    function applyBehavior(e,b){
      if(!e||!b||b==='basic') return;
      e.behavior=b;
      e.seed=Math.random()*10;
      e.dashCd=.75;
      e.dashTime=0;
      e.splitDone=false;
      if(b==='swarm'){
        e.kind='small';e.r=Math.max(8,e.r*.72);e.speed*=1.35;e.hp=Math.max(1,Math.ceil(e.hp*.62));e.maxHp=e.hp;e.color='#facc15';
      }else if(b==='dash'){
        if(e.kind==='large')e.kind='medium';e.speed*=.94;e.hp=Math.ceil(e.hp*1.08);e.maxHp=e.hp;e.color='#fb7185';
      }else if(b==='armor'){
        e.kind='large';e.r=Math.max(e.r,22);e.speed*=.78;e.hp=Math.ceil(e.hp*1.5);e.maxHp=e.hp;e.reward=(e.reward||3)+2;e.color='#93a4b8';
      }else if(b==='split'){
        e.kind='medium';e.r=15;e.hp=Math.ceil(e.hp*1.2);e.maxHp=e.hp;e.reward=(e.reward||3)+1;e.color='#c084fc';
      }
    }

    startGame=function(e){
      oldStart(e);
      game.money=32;
      game.coreHp=10;
      game.maxHp=10;
      game.waveTimer=2.2;
      game.__enemyIntroSeen={};
      spawned=0;
      tutorialDone=false;
      setMessage('TOWER TYPES','Pulse is steady. Beam hits hard. Freeze slows. Wave handles groups. Use TYPE to cycle, BUILD to place, SLOT to move.',7.5);
    };

    beginWave=function(){
      game.wave=1;
      game.waveActive=true;
      game.spawnLeft=9;
      game.spawnClock=.55;
      game.spawnIndex=0;
      game.spawnPattern=[0,1,2,3,0,1,2,3,0];
      setMessage('ONE GUIDED WAVE','This tutorial introduces every enemy type in one wave. Watch the text when a new enemy appears.',5.5);
    };

    spawnEnemy=function(){
      const before=game.enemies.length;
      oldSpawn();
      for(let i=before;i<game.enemies.length;i++){
        const e=game.enemies[i];
        const order=['basic','swarm','dash','armor','split','swarm','dash','armor','split'];
        const type=order[Math.min(spawned,order.length-1)];
        applyBehavior(e,type);
        const info=enemyInfo[type];
        if(info) setMessage(info[0],info[1],4.6);
        spawned++;
      }
    };

    const oldUpdate=update;
    update=function(dt){
      oldUpdate(dt);
      messageTime=Math.max(0,messageTime-dt);
      if(game.running&&game.waveActive&&game.spawnLeft<=0&&game.enemies.length===0&&!tutorialDone){
        tutorialDone=true;
        setTimeout(function(){ if(game.running) endGame('Tutorial complete. You learned towers, boost, and every enemy type.',true); },350);
      }
    };

    render=function(){
      oldRender();
      if(!game.running||messageTime<=0) return;
      const w=Math.min(420,canvas.width*.88),h=88,x=canvas.width/2-w/2,y=canvas.height*.18;
      ctx.save();
      ctx.fillStyle='rgba(17,24,39,.78)';
      ctx.strokeStyle='rgba(255,255,255,.16)';
      ctx.lineWidth=1.4;
      rr(x,y,w,h,22);
      ctx.fillStyle='#f8fafc';
      ctx.font='900 13px Arial';
      ctx.textAlign='center';
      ctx.textBaseline='top';
      ctx.fillText(title,canvas.width/2,y+14);
      ctx.fillStyle='rgba(248,250,252,.82)';
      ctx.font='800 11px Arial';
      const words=body.split(' ');let line='',lines=[],max=48;
      for(const word of words){if((line+' '+word).trim().length>max){lines.push(line);line=word}else line=(line+' '+word).trim()}
      if(line)lines.push(line);
      lines.slice(0,3).forEach((ln,i)=>ctx.fillText(ln,canvas.width/2,y+38+i*14));
      ctx.restore();
    };
  }

  wait();
})();
