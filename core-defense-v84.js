// Core Defense v84 consolidated entry
// Single loaded Core Defense file: loads the base engine, then applies the approved in-world polish directly here.
(function(){
  function load(src,done){const s=document.createElement('script');s.src=src;s.onload=done||function(){};document.body.appendChild(s)}

  function installPolish(){
    const wait=()=>typeof controls==='function'&&typeof drawButton==='function'&&typeof topBtn==='function'&&typeof game==='object'&&Array.isArray(TYPES);
    let lastWave=-1,lastCritical=false,message='',messageTime=0,messageColor=null;

    function applyTowerColors(){
      TYPES[0].color='#5fb7cf';
      TYPES[1].color=C.gold;
      TYPES[2].color='#a7f3ff';
      TYPES[3].color='#34d399';
    }

    function installEnemyBehaviorsAndBoosts(){
      const BEHAVIOR_NAMES={swarm:'SWARM',dash:'DASHER',armor:'ARMORED',split:'SPLITTER'};
      const SPECIAL_NAMES=['RAPID','PIERCE','NOVA','SHOCK'];
      const BOOST_FLASH_TIME=.32;
      game.boostBursts=[];
      game.enemyNote='';
      game.enemyNoteTime=0;

      function markEnemy(e){
        if(!e||e.behavior)return e;
        const w=Math.max(1,game.wave||1),lv=LV||1;
        let behavior=null,roll=Math.random();
        if(lv>=2&&w>=3&&e.kind==='small'&&roll<.24)behavior='swarm';
        else if(lv>=3&&w>=4&&e.kind!=='large'&&roll<.18)behavior='dash';
        else if(lv>=3&&w>=5&&e.kind==='large'&&roll<.30)behavior='armor';
        else if(lv>=4&&w>=6&&e.kind==='medium'&&roll<.22)behavior='split';
        if(!behavior)return e;
        e.behavior=behavior;
        e.behaviorSeen=false;
        e.dashCd=.9+Math.random()*.8;
        e.dashTime=0;
        e.armor=.45;
        e.splitDone=false;
        if(behavior==='swarm'){e.r=Math.max(7,e.r*.72);e.speed*=1.32;e.reward=Math.max(1,e.reward-1);e.hp=Math.max(1,Math.ceil(e.hp*.62));e.maxHp=e.hp;e.color='#fef08a'}
        if(behavior==='dash'){e.color='#fb7185';e.speed*=.92;e.hp=Math.ceil(e.hp*1.05);e.maxHp=e.hp}
        if(behavior==='armor'){e.color='#93a4b8';e.hp=Math.ceil(e.hp*1.35);e.maxHp=e.hp;e.reward+=2}
        if(behavior==='split'){e.color='#c084fc';e.hp=Math.ceil(e.hp*1.18);e.maxHp=e.hp;e.reward+=1}
        return e;
      }

      function showEnemyNote(text,color=C.gold){
        if(game.enemyNote===text&&game.enemyNoteTime>.2)return;
        game.enemyNote=text;game.enemyNoteColor=color;game.enemyNoteTime=1.15;
      }

      const oldSpawnEnemy=spawnEnemy;
      spawnEnemy=function(){
        const before=game.enemies.length;
        oldSpawnEnemy();
        for(let i=before;i<game.enemies.length;i++){
          const e=markEnemy(game.enemies[i]);
          if(e.behavior&&!e.behaviorSeen){e.behaviorSeen=true;showEnemyNote(BEHAVIOR_NAMES[e.behavior],e.color||C.gold)}
        }
      };

      function splitEnemy(e){
        if(!e||e.splitDone)return;
        e.splitDone=true;
        const n=2;
        for(let k=0;k<n;k++){
          const a=Math.random()*Math.PI*2;
          game.enemies.push({x:e.x+Math.cos(a)*10,y:e.y+Math.sin(a)*10,hp:Math.max(1,Math.ceil(e.maxHp*.32)),maxHp:Math.max(1,Math.ceil(e.maxHp*.32)),speed:e.speed*1.35,slow:0,r:9,reward:1,kind:'small',color:'#ddd6fe',behavior:'swarm',behaviorSeen:true});
        }
        spark(e.x,e.y,'#c084fc',18);
      }

      function addBoostBurst(x,y,color,type){
        game.boostBursts.push({x,y,color,type,life:BOOST_FLASH_TIME,max:BOOST_FLASH_TIME});
      }

      const oldSpecial=special;
      special=function(){
        const s=game.slots[game.selected],p=slotPos(game.selected),wasReady=game.specialCd<=0&&!empty(s);
        oldSpecial();
        if(!wasReady||empty(s))return;
        const type=s.type;
        addBoostBurst(p.x,p.y,TYPES[type].color,type);
        showEnemyNote(SPECIAL_NAMES[type]+' BOOST',TYPES[type].color);
        if(type===2){
          for(const e of game.enemies){
            const d=Math.hypot(e.x-p.x,e.y-p.y);
            if(d<210){e.slow=Math.max(e.slow||0,2.6);e.hp-=.55*s.level}}
        }else if(type===3){
          for(const e of game.enemies){
            const d=Math.hypot(e.x-p.x,e.y-p.y);
            if(d<185){e.hp-=.85*s.level;e.slow=Math.max(e.slow||0,.35)}}
        }
      };

      const oldUpdateTowers=updateTowers;
      updateTowers=function(dt){
        oldUpdateTowers(dt);
        for(let i=game.enemies.length-1;i>=0;i--){
          const e=game.enemies[i];
          if(e.hp<=0&&e.behavior==='split')splitEnemy(e);
        }
      };

      const oldUpdateEnemies=updateEnemies;
      updateEnemies=function(dt){
        for(const e of game.enemies){
          if(e.behavior==='dash'){
            e.dashCd-=dt;
            if(e.dashTime>0)e.dashTime-=dt;
            else if(e.dashCd<=0){e.dashTime=.34;e.dashCd=1.7+Math.random()*.9;spark(e.x,e.y,'#fb7185',6)}
            e._dashBoost=e.dashTime>0?2.55:1;
          }else e._dashBoost=1;
        }
        const originalSpeeds=game.enemies.map(e=>e.speed);
        for(let i=0;i<game.enemies.length;i++)if(game.enemies[i]._dashBoost>1)game.enemies[i].speed*=game.enemies[i]._dashBoost;
        oldUpdateEnemies(dt);
        for(let i=0;i<game.enemies.length;i++)if(originalSpeeds[i]!==undefined)game.enemies[i].speed=originalSpeeds[i];
      };

      const oldDrawEnemies=drawEnemies;
      drawEnemies=function(){
        oldDrawEnemies();
        for(const e of game.enemies){
          if(!e.behavior)continue;
          ctx.save();ctx.translate(e.x,e.y);ctx.lineWidth=2;ctx.strokeStyle=e.color||C.white;ctx.globalAlpha=.85;
          if(e.behavior==='swarm'){ctx.beginPath();ctx.moveTo(0,-e.r-5);ctx.lineTo(e.r+5,0);ctx.lineTo(0,e.r+5);ctx.lineTo(-e.r-5,0);ctx.closePath();ctx.stroke()}
          else if(e.behavior==='dash'){ctx.beginPath();ctx.arc(0,0,e.r+5,Math.PI*.15,Math.PI*1.15);ctx.stroke();ctx.beginPath();ctx.moveTo(e.r+8,0);ctx.lineTo(e.r+1,-5);ctx.lineTo(e.r+1,5);ctx.closePath();ctx.stroke()}
          else if(e.behavior==='armor'){ctx.strokeStyle='rgba(226,232,240,.9)';ctx.beginPath();ctx.arc(0,0,e.r+6,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,e.r+10,-Math.PI*.85,-Math.PI*.15);ctx.stroke()}
          else if(e.behavior==='split'){ctx.beginPath();ctx.arc(-5,0,e.r*.42,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(6,0,e.r*.42,0,Math.PI*2);ctx.stroke()}
          ctx.restore();ctx.globalAlpha=1;
        }
      };

      const oldUpdate=update;
      update=function(dt){
        oldUpdate(dt);
        game.enemyNoteTime=Math.max(0,(game.enemyNoteTime||0)-dt);
        if(game.boostBursts){for(let i=game.boostBursts.length-1;i>=0;i--){game.boostBursts[i].life-=dt;if(game.boostBursts[i].life<=0)game.boostBursts.splice(i,1)}}
      };

      function drawBoostBursts(){
        if(!game.boostBursts)return;
        for(const b of game.boostBursts){
          const pct=1-b.life/b.max,r=28+pct*90;
          ctx.save();ctx.globalAlpha=(1-pct)*.75;ctx.strokeStyle=b.color;ctx.fillStyle=b.color;ctx.lineWidth=b.type===1?5:3;ctx.shadowColor=b.color;ctx.shadowBlur=16;
          if(b.type===0){for(let i=0;i<10;i++){const a=i*Math.PI*2/10+game.timer*5;ctx.beginPath();ctx.moveTo(b.x+Math.cos(a)*20,b.y+Math.sin(a)*20);ctx.lineTo(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r);ctx.stroke()}}
          else if(b.type===1){ctx.beginPath();ctx.moveTo(b.x-r,b.y);ctx.lineTo(b.x+r,b.y);ctx.stroke();ctx.beginPath();ctx.moveTo(b.x,b.y-r);ctx.lineTo(b.x,b.y+r);ctx.stroke()}
          else if(b.type===2){ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,r*.62,0,Math.PI*2);ctx.stroke()}
          else{ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const a=i*Math.PI*2/6;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r);ctx.stroke()}}
          ctx.restore();ctx.globalAlpha=1;
        }
      }

      function drawEnemyNote(){
        if(!game.running||!game.enemyNoteTime)return;
        const a=Math.min(1,game.enemyNoteTime/.25);
        ctx.save();ctx.globalAlpha=Math.min(.88,a);ctx.translate(cx(),cy()+78);
        ctx.fillStyle='rgba(17,24,39,.48)';ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=1.2;rr(-90,-18,180,36,18);
        ctx.fillStyle=game.enemyNoteColor||C.gold;ctx.font='900 13px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(game.enemyNote,0,1);ctx.restore();ctx.globalAlpha=1;
      }

      const oldRender=render;
      render=function(){oldRender();drawBoostBursts();drawEnemyNote()};
    }

    function buttonSurface(x,y,w,h,label,on,color,opts={}){
      const muted=opts.muted||false,rotate=opts.rotate||false,accent=opts.accent||color||C.blue,ready=opts.ready||false;
      const pulse=Math.sin(game.timer*5)*.5+.5;
      const glow=opts.glow||0;
      ctx.save();
      if(glow>0||ready){ctx.shadowColor=accent;ctx.shadowBlur=ready?(9+4*pulse):glow}
      ctx.fillStyle=on?accent:ready?`rgba(79,184,216,${.22+.07*pulse})`:(muted?'rgba(17,24,39,.54)':'rgba(17,24,39,.78)');
      ctx.strokeStyle=on?'rgba(255,255,255,.48)':ready?`rgba(79,184,216,${.62+.2*pulse})`:muted?'rgba(255,255,255,.11)':accent;
      ctx.lineWidth=on?2.25:ready?2.15:1.65;
      rr(x,y,w,h,18);
      ctx.shadowBlur=0;
      ctx.fillStyle=on?'#0b0f14':muted?'rgba(248,250,252,.58)':C.white;
      ctx.font='900 12px Arial';
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      if(rotate){ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI);ctx.fillText(label,0,0)}
      else ctx.fillText(label,x+w/2,y+h/2);
      ctx.restore();
    }

    function drawTowerTypeButton(x,y,w,h,label,on,color){buttonSurface(x,y,w,h,label,on,color,{rotate:true,glow:on?10:0})}
    function drawControlButton(x,y,w,h,label,on,color,rotate=false,muted=false,ready=false){buttonSurface(x,y,w,h,label,on,color,{rotate,muted,ready,glow:on?8:0})}

    function drawBoostButton(x,y,w,h,label,on,state){
      const ready=state==='ready',active=state==='active',cooldown=state==='cooldown';
      const pulse=Math.sin(game.timer*5)*.5+.5;
      const fill=on?'rgba(224,111,143,.96)':active?'rgba(224,111,143,.74)':ready?`rgba(224,111,143,${.22+.08*pulse})`:'rgba(17,24,39,.56)';
      const stroke=active?'rgba(255,203,219,.9)':ready?`rgba(224,111,143,${.65+.2*pulse})`:'rgba(255,255,255,.14)';
      ctx.save();
      if(ready||active||on){ctx.shadowColor='rgba(224,111,143,.34)';ctx.shadowBlur=on?16:ready?10+4*pulse:14}
      ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=active||ready?2.2:1.5;rr(x,y,w,h,18);
      ctx.shadowBlur=0;
      ctx.fillStyle=on||active?'#0b0f14':cooldown?'rgba(248,250,252,.55)':C.white;
      ctx.font='900 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2);
      if(cooldown){const pct=game.specialCd/BOOST_CD;ctx.strokeStyle='rgba(224,111,143,.42)';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+18,y+h-7);ctx.lineTo(x+18+(w-36)*(1-pct),y+h-7);ctx.stroke()}
      ctx.restore();
    }

    function flashMessage(text,color=C.white,time=1.25){message=text;messageColor=color;messageTime=time}
    function updateMessages(dt){
      if(!game.running)return;
      if(game.wave!==lastWave&&game.wave>0){lastWave=game.wave;const finalText=!ENDLESS&&game.wave>=TARGET?'FINAL WAVE':'WAVE '+game.wave;flashMessage(finalText,!ENDLESS&&game.wave>=TARGET?C.gold:C.white,1.25)}
      const critical=game.coreHp<=2;if(critical&&!lastCritical)flashMessage('CORE CRITICAL',C.danger,1.35);lastCritical=critical;messageTime=Math.max(0,messageTime-dt);
    }

    function drawWaveMessage(){
      if(!game.running||messageTime<=0||!message)return;
      const a=Math.min(1,messageTime/.35),scale=1+(1-a)*.05;
      ctx.save();ctx.globalAlpha=Math.min(.9,a);ctx.translate(cx(),cy()-86);ctx.scale(scale,scale);
      ctx.fillStyle='rgba(17,24,39,.46)';ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=1.2;rr(-86,-21,172,42,21);
      ctx.fillStyle=messageColor||C.white;ctx.font='900 15px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(message,0,1);ctx.restore();ctx.globalAlpha=1;
    }

    function drawCoreHealthRing(){
      if(!game.running)return;
      const pct=Math.max(0,Math.min(1,game.coreHp/game.maxHp)),low=game.coreHp<=2,pulse=low?(Math.sin(game.timer*8)*.5+.5):0,radius=28;
      ctx.save();ctx.translate(cx(),cy());
      ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,radius,-Math.PI/2,Math.PI*1.5);ctx.stroke();
      ctx.strokeStyle='rgba(248,250,252,.30)';ctx.lineWidth=5.5;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,radius,-Math.PI/2,Math.PI*1.5);ctx.stroke();
      ctx.strokeStyle=low?`rgba(255,92,74,${.95+.05*pulse})`:'rgba(139,255,181,1)';ctx.shadowColor=low?'rgba(255,92,74,.75)':'rgba(139,255,181,.58)';ctx.shadowBlur=9;ctx.lineWidth=5.5;
      ctx.beginPath();ctx.arc(0,0,radius,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);ctx.stroke();ctx.shadowBlur=0;
      if(low){ctx.strokeStyle=`rgba(255,92,74,${.22+.2*pulse})`;ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,radius+4+pulse*3,0,Math.PI*2);ctx.stroke()}
      ctx.restore();
    }

    function drawTowerBody(type,level,color){
      ctx.save();ctx.fillStyle=color;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1.25;
      if(type===0){ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();ctx.stroke()}
      else if(type===1){ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(15,0);ctx.lineTo(0,15);ctx.lineTo(-15,0);ctx.closePath();ctx.fill();ctx.stroke()}
      else if(type===2){ctx.beginPath();for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3,x=Math.cos(a)*14,y=Math.sin(a)*14;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke()}
      else{ctx.beginPath();ctx.ellipse(0,0,17,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(11,15,20,.30)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-4,0,6,-1.1,1.1);ctx.stroke();ctx.beginPath();ctx.arc(5,0,8,-1.1,1.1);ctx.stroke()}
      ctx.fillStyle='#0b0f14';ctx.font='900 11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(level,0,1);ctx.restore();
    }

    function drawSlotsEnhanced(){
      for(let i=0;i<game.slots.length;i++){
        let s=game.slots[i],p=slotPos(i),sel=i===game.selected;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a+Math.PI/2);
        ctx.fillStyle=sel?'rgba(248,250,252,.12)':'rgba(17,24,39,.85)';ctx.strokeStyle=sel?C.white:'rgba(255,255,255,.18)';ctx.lineWidth=sel?2.5:1.5;
        ctx.beginPath();ctx.arc(0,0,24+(s.flash||0)*5,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(!empty(s))drawTowerBody(s.type,s.level,TYPES[s.type].color);else{ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-8,-2,16,4);ctx.fillRect(-2,-8,4,16)}
        ctx.restore();
      }
    }

    function drawSlotClarity(){
      if(!game.running||!game.slots||!game.slots.length)return;
      const i=game.selected,s=game.slots[i],p=slotPos(i),isEmpty=empty(s),tower=isEmpty?TYPES[game.buildType]:TYPES[s.type],boosted=!isEmpty&&s.boost>0,pulse=Math.sin(game.timer*7)*.5+.5;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a+Math.PI/2);ctx.strokeStyle=tower.color;ctx.lineWidth=boosted?3:2.4;ctx.globalAlpha=boosted?.7:.42+.18*pulse;
      ctx.beginPath();ctx.arc(0,0,28+(pulse*2),0,Math.PI*2);ctx.stroke();
      if(boosted){const boostPct=Math.max(0,Math.min(1,s.boost/BOOST_TIME));ctx.globalAlpha=1;ctx.lineWidth=6.5;ctx.lineCap='round';ctx.strokeStyle=tower.color;ctx.shadowColor=tower.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,38,-Math.PI/2,-Math.PI/2+Math.PI*2*boostPct);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=.34;ctx.lineWidth=6.5;ctx.strokeStyle='rgba(255,255,255,.26)';ctx.beginPath();ctx.arc(0,0,38,-Math.PI/2,Math.PI*1.5);ctx.stroke()}
      if(isEmpty){ctx.globalAlpha=.7;ctx.strokeStyle=tower.color;ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(11,0);ctx.moveTo(0,-11);ctx.lineTo(0,11);ctx.stroke()}
      ctx.restore();ctx.globalAlpha=1;
    }

    function install(){
      if(!wait())return setTimeout(install,50);
      applyTowerColors();
      installEnemyBehaviorsAndBoosts();
      const baseUpdate=update;update=function(dt){baseUpdate(dt);updateMessages(dt)};
      const baseRender=render;render=function(){baseRender();drawWaveMessage();drawCoreHealthRing()};
      drawSlots=function(){drawSlotsEnhanced();drawSlotClarity()};
      controls=function(){
        if(!game.running)return;
        let w=canvas.width*.31,h=56,s=game.slots[game.selected],tower=TYPES[game.buildType];
        const buildCost=price(s),canBuy=!(!empty(s)&&s.level>=MAX)&&game.money>=buildCost;
        let b=empty(s)?'BUILD $'+BUILD:s.level>=MAX?'MAX':'UP $'+buildCost,boost='BOOST',boostState='ready';
        if(s&&s.boost>0){boost='BOOST '+Math.ceil(s.boost)+'s';boostState='active'}else if(game.specialCd>0){boost='WAIT '+Math.ceil(game.specialCd)+'s';boostState='cooldown'}
        drawTowerTypeButton(canvas.width*.02,76,w,h,'TYPE '+tower.name,game.input.topLeft,tower.color);
        drawControlButton(canvas.width*.345,76,w,h,b,game.input.topMid,C.blue,true,!canBuy,canBuy);
        drawControlButton(canvas.width*.67,76,w,h,'SLOT '+(game.selected+1)+'/12',game.input.topRight,C.blue,true,false,false);
        let y=canvas.height-90;drawControlButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose,false,false,false);drawBoostButton(canvas.width*.345,y,w,h,boost,game.input.bottomMid,boostState);drawControlButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose,false,false,false);
      };
    }
    install();
  }

  load('core-defense-v80.js?v=108',function(){load('start-countdown-v51.js?v=108',installPolish)});
})();
