// Core tutorial v86: step-based tower counter lessons.
(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('game')!=='core'||params.get('level')!=='0') return;

  function wait(){
    if(typeof game==='object'&&typeof startGame==='function'&&typeof beginWave==='function'&&typeof spawnEnemy==='function'&&typeof endGame==='function'&&typeof render==='function'&&typeof buildUpgrade==='function') install();
    else setTimeout(wait,50);
  }

  const lessons=[
    {tower:3,enemy:'swarm',count:5,title:'WAVE VS SWARM',body:'Build a free Wave tower. Swarm enemies come in packs, and Wave counters them by hitting groups at once.'},
    {tower:2,enemy:'dash',count:2,title:'FREEZE VS DASHERS',body:'Build a free Freeze tower. Dashers burst forward, and Freeze counters them by slowing the rush.'},
    {tower:1,enemy:'armor',count:1,title:'BEAM VS ARMORED',body:'Build a free Beam tower. Armored enemies have high health, and Beam counters them with focused damage.'},
    {tower:0,enemy:'split',count:1,title:'PULSE VS SPLITTERS',body:'Build a free Pulse tower. Splitters break into small swarm enemies, and Pulse counters them with steady cleanup shots.'}
  ];

  function install(){
    if(window.__coreTutorialV86) return;
    window.__coreTutorialV86=true;

    const oldStart=startGame;
    const oldBegin=beginWave;
    const oldSpawn=spawnEnemy;
    const oldBuild=buildUpgrade;
    const oldRender=render;
    const oldEnd=endGame;

    let title='CORE DEFENSE TUTORIAL';
    let body='Each lesson teaches one tower and the enemy it counters.';
    let messageTime=999;
    let step=0;
    let phase='build';
    let spawned=0;
    let waitUntil=0;
    let tutorialDone=false;
    let requiredCount=0;

    function setMessage(t,b,time=999){title=t;body=b;messageTime=time;}
    function current(){return lessons[Math.min(step,lessons.length-1)]}
    function towerCount(type){return game.slots.filter(s=>s&&s.type===type&&s.level>0).length}

    function setLessonBuild(){
      const l=current();
      phase='build';
      spawned=0;
      game.enemies=[];
      game.shots=[];
      game.spawnLeft=0;
      game.spawnClock=999;
      game.waveActive=false;
      game.waveTimer=999;
      game.buildType=l.tower;
      requiredCount=towerCount(l.tower)+1;
      setMessage(l.title,l.body+' Use TYPE if needed, then tap BUILD. Tutorial tower builds are free; upgrades still cost money.');
    }

    function makeEnemy(type,x,y){
      const e={x:x,y:y,hp:3,maxHp:3,speed:34,slow:0,r:13,reward:1,kind:'medium',color:'#a8a29e',seed:Math.random()*10};
      if(type==='swarm'){
        e.behavior='swarm';e.kind='small';e.r=8;e.hp=2;e.maxHp=2;e.speed=46;e.color='#facc15';
      }else if(type==='dash'){
        e.behavior='dash';e.kind='medium';e.r=14;e.hp=5;e.maxHp=5;e.speed=30;e.dashCd=1.25;e.dashTime=0;e.color='#fb7185';
      }else if(type==='armor'){
        e.behavior='armor';e.kind='large';e.r=22;e.hp=13;e.maxHp=13;e.speed=22;e.color='#93a4b8';
      }else if(type==='split'){
        e.behavior='split';e.kind='medium';e.r=15;e.hp=7;e.maxHp=7;e.speed=27;e.splitDone=false;e.color='#c084fc';
      }
      return e;
    }

    function spawnTutorialEnemy(type,offset){
      const side=(spawned+offset)%4,m=40;let x,y;
      if(side===0){x=-m;y=canvas.height*(.32+offset*.055)}
      else if(side===1){x=canvas.width+m;y=canvas.height*(.62-offset*.045)}
      else if(side===2){x=canvas.width*(.34+offset*.05);y=-m}
      else{x=canvas.width*(.64-offset*.05);y=canvas.height+m}
      game.enemies.push(makeEnemy(type,x,y));
    }

    startGame=function(e){
      oldStart(e);
      game.money=20;
      game.coreHp=10;
      game.maxHp=10;
      game.wave=1;
      game.waveTimer=999;
      game.waveActive=false;
      game.spawnLeft=0;
      game.enemies=[];
      game.shots=[];
      step=0;phase='build';spawned=0;tutorialDone=false;waitUntil=0;
      setLessonBuild();
    };

    endGame=function(msg,win){
      if(win&&!tutorialDone) return;
      oldEnd(msg,win);
    };

    beginWave=function(){
      game.wave=1;
      game.waveActive=false;
      game.spawnLeft=0;
      game.spawnClock=999;
      game.waveTimer=999;
    };

    buildUpgrade=function(){
      const s=game.slots[game.selected];
      const wasEmpty=empty(s);
      if(wasEmpty&&phase==='build'){
        const before=game.money;
        game.money+=BUILD;
        oldBuild();
        game.money=before;
      }else oldBuild();
    };

    spawnEnemy=function(){ oldSpawn(); };

    const oldUpdate=update;
    update=function(dt){
      oldUpdate(dt);
      messageTime=Math.max(0,messageTime-dt);
      if(!game.running||tutorialDone)return;
      game.waveActive=false;
      game.waveTimer=999;
      game.spawnLeft=0;
      game.spawnClock=999;

      const l=current();
      if(phase==='build'){
        if(towerCount(l.tower)>=requiredCount){
          phase='explain';
          waitUntil=game.timer+4.0;
          const enemyNames={swarm:'Swarm packs',dash:'Dashers',armor:'Armored enemies',split:'Splitters'};
          setMessage(enemyNames[l.enemy],l.body.replace('Build a free ','You built a ').replace(' tower.',' tower.'));
        }
      }else if(phase==='explain'){
        if(game.timer>=waitUntil){
          phase='fight';
          spawned=0;
          setMessage('COUNTER TEST','Now defeat this enemy type with the tower you just built. Rotate the ring so the tower faces the threat.',7.0);
        }
      }else if(phase==='fight'){
        if(spawned<l.count&&game.enemies.length===0){
          if(l.enemy==='swarm'){
            for(let i=0;i<l.count;i++)spawnTutorialEnemy('swarm',i);
            spawned=l.count;
          }else{
            spawnTutorialEnemy(l.enemy,0);
            spawned++;
          }
        }
        if(spawned>=l.count&&game.enemies.length===0){
          step++;
          if(step>=lessons.length){
            tutorialDone=true;
            setTimeout(function(){if(game.running)oldEnd('Tutorial complete. You learned which towers counter each enemy type.',true)},900);
          }else{
            phase='pause';
            waitUntil=game.timer+2.5;
            setMessage('GOOD COUNTER','Nice. Next we will build a different tower and test it against a different enemy.',2.5);
          }
        }
      }else if(phase==='pause'){
        if(game.timer>=waitUntil)setLessonBuild();
      }
    };

    render=function(){
      oldRender();
      if(!game.running||messageTime<=0)return;
      const w=Math.min(470,canvas.width*.92),h=120,x=canvas.width/2-w/2,y=canvas.height-230;
      ctx.save();
      ctx.fillStyle='rgba(17,24,39,.84)';ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.4;rr(x,y,w,h,22);
      ctx.fillStyle='#f8fafc';ctx.font='900 13px Arial';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(title,canvas.width/2,y+14);
      ctx.fillStyle='rgba(248,250,252,.84)';ctx.font='800 11px Arial';
      const words=body.split(' ');let line='',lines=[],max=52;
      for(const word of words){if((line+' '+word).trim().length>max){lines.push(line);line=word}else line=(line+' '+word).trim()}
      if(line)lines.push(line);
      lines.slice(0,5).forEach((ln,i)=>ctx.fillText(ln,canvas.width/2,y+38+i*14));
      ctx.restore();
    };
  }

  wait();
})();
