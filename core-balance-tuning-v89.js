// Core balance tuning v89: softer arena visuals, smaller objects, stronger counters.
(function(){
  function wait(){
    if(typeof game==='object'&&typeof canvas==='object'&&typeof ctx==='object'&&typeof slotPos==='function'&&typeof spawnEnemy==='function'&&typeof updateEnemies==='function'&&typeof updateTowers==='function'&&typeof drawSlots==='function') install();
    else setTimeout(wait,50);
  }

  function arena(){
    const topSafe=150;
    const bottomSafe=canvas.height-150;
    const maxH=Math.max(240,bottomSafe-topSafe);
    const size=Math.max(260,Math.min(canvas.width*.84,maxH));
    return {size,left:(canvas.width-size)/2,top:topSafe+(maxH-size)/2,cx:canvas.width/2,cy:topSafe+maxH/2};
  }

  function install(){
    if(window.__coreBalanceTuningV89) return;
    window.__coreBalanceTuningV89=true;

    bg=function(){
      let g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      g.addColorStop(0,C.bg);g.addColorStop(.6,C.bg2);g.addColorStop(1,'#080b10');
      ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle=C.line;ctx.lineWidth=1;
      for(let x=0;x<canvas.width;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}
      for(let y=0;y<canvas.height;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}
      const a=arena();
      ctx.save();
      ctx.strokeStyle='rgba(248,250,252,.025)';
      for(let x=a.left+48;x<a.left+a.size;x+=48){ctx.beginPath();ctx.moveTo(x,a.top);ctx.lineTo(x,a.top+a.size);ctx.stroke()}
      for(let y=a.top+48;y<a.top+a.size;y+=48){ctx.beginPath();ctx.moveTo(a.left,y);ctx.lineTo(a.left+a.size,y);ctx.stroke()}
      ctx.restore();
    };

    slotPos=function(i){
      const a=arena(),inner=i>=6,idx=inner?i-6:i,off=inner?Math.PI/6:0;
      const ang=game.ring+idx*Math.PI*2/6-Math.PI/2+off;
      const r=inner?a.size*.142:a.size*.208;
      return {x:a.cx+Math.cos(ang)*r,y:a.cy+Math.sin(ang)*r,a:ang};
    };

    function towerBody(type,level,color){
      ctx.save();ctx.fillStyle=color;ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=1.5;
      if(type===0){ctx.beginPath();ctx.arc(0,0,12,0,6.283);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.46)';ctx.beginPath();ctx.arc(0,0,6.4,0,6.283);ctx.stroke()}
      else if(type===1){ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(14,0);ctx.lineTo(0,14);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.48)';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(9,0);ctx.lineTo(0,9);ctx.lineTo(-9,0);ctx.closePath();ctx.stroke()}
      else if(type===2){ctx.beginPath();for(let i=0;i<6;i++){const p=-Math.PI/2+i*6.283/6,x=Math.cos(p)*13,y=Math.sin(p)*13;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.50)';ctx.beginPath();ctx.moveTo(-7.4,0);ctx.lineTo(7.4,0);ctx.moveTo(0,-7.4);ctx.lineTo(0,7.4);ctx.stroke()}
      else{ctx.beginPath();ctx.ellipse(0,0,15.5,9.2,0,0,6.283);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.52)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-3.7,0,5.4,-1.1,1.1);ctx.stroke();ctx.beginPath();ctx.arc(4.7,0,7.1,-1.1,1.1);ctx.stroke()}
      ctx.fillStyle='#0b0f14';ctx.font='900 10.5px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(level,0,1);ctx.restore();
    }

    drawSlots=function(){
      for(let i=0;i<game.slots.length;i++){
        const s=game.slots[i],p=slotPos(i),sel=i===game.selected;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a+Math.PI/2);
        ctx.fillStyle=sel?'rgba(248,250,252,.13)':'rgba(17,24,39,.86)';ctx.strokeStyle=sel?C.white:'rgba(255,255,255,.22)';ctx.lineWidth=sel?2.35:1.55;
        ctx.beginPath();ctx.arc(0,0,20.5+(s.flash||0)*4.3,0,6.283);ctx.fill();ctx.stroke();
        if(!empty(s))towerBody(s.type,s.level,TYPES[s.type].color);else{ctx.fillStyle='rgba(255,255,255,.30)';ctx.fillRect(-7,-1.75,14,3.5);ctx.fillRect(-1.75,-7,3.5,14)}
        ctx.restore();
        if(game.running&&sel){const t=empty(s)?TYPES[game.buildType]:TYPES[s.type];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a+Math.PI/2);ctx.strokeStyle=t.color;ctx.lineWidth=2.35;ctx.globalAlpha=.64+Math.sin(game.timer*7)*.16;ctx.beginPath();ctx.arc(0,0,26.5,0,6.283);ctx.stroke();if(!empty(s)&&s.boost>0){const pct=clamp(s.boost/BOOST_TIME,0,1);ctx.globalAlpha=1;ctx.lineWidth=5.4;ctx.lineCap='round';ctx.shadowColor=t.color;ctx.shadowBlur=11;ctx.beginPath();ctx.arc(0,0,34,-Math.PI/2,-Math.PI/2+6.283*pct);ctx.stroke();ctx.shadowBlur=0}ctx.restore();ctx.globalAlpha=1}
      }
    };

    spawnEnemy=function(){
      const ar=arena();
      const side=game.spawnPattern.length?game.spawnPattern[game.spawnIndex++%game.spawnPattern.length]:Math.floor(Math.random()*4),m=24;
      let x,y;if(side===0){x=ar.left-m;y=ar.top+ar.size*(.10+Math.random()*.80)}else if(side===1){x=ar.left+ar.size+m;y=ar.top+ar.size*(.10+Math.random()*.80)}else if(side===2){x=ar.left+ar.size*(.10+Math.random()*.80);y=ar.top-m}else{x=ar.left+ar.size*(.10+Math.random()*.80);y=ar.top+ar.size+m}

      const easy=LV<=1;
      const t=pickEnemy();
      const baseHp=easy?2.4+game.wave*.55:3.2+game.wave*.75+LV*.55;

      // Fixed slower pacing. No wave speed scaling.
      const baseSp=easy?6.5:7.5+LV*.55;

      const hp=Math.max(1,Math.ceil(baseHp*t.hp));
      const speed=baseSp*t.sp;
      const reward=t.reward+(easy?1:0)+Math.floor(hp/8);

      game.enemies.push({
        x,y,hp,maxHp:hp,speed,slow:0,
        r:t.r*.88,reward,kind:t.name,color:t.color
      });
    };

    const oldUpdateTowers=updateTowers;
    updateTowers=function(dt){
      const before=new Map();
      for(const e of game.enemies)before.set(e,e.hp);
      oldUpdateTowers(dt);
      for(const e of game.enemies){
        const prev=before.get(e);
        if(prev==null)continue;
        const dealt=prev-e.hp;
        if(dealt>0&&e.behavior==='armor'){
          const recentBeam=game.shots.some(s=>s&&s.color===TYPES[1].color&&s.life>.12&&Math.hypot((s.tx||0)-e.x,(s.ty||0)-e.y)<e.r+8);
          if(recentBeam)e.hp-=dealt*.28;
        }
        if(dealt>0&&e.behavior==='swarm'){
          const recentWave=game.shots.some(s=>s&&s.color===TYPES[3].color&&s.life>.12&&s.beam);
          if(recentWave)e.hp-=dealt*.18;
        }
        if(e.behavior==='dash'&&e.slow>0){
          e.slow=Math.max(e.slow,1.05);
          e.dashTime=0;
          e.dashCd=Math.max(e.dashCd||0,.85);
        }
      }
    };

    const oldUpdateEnemies=updateEnemies;
    updateEnemies=function(dt){
      for(const e of game.enemies){
        if(e.behavior==='dash'&&e.slow>0){
          e.dashTime=0;
          e.dashCd=Math.max(e.dashCd||0,.85);
        }
      }

      oldUpdateEnemies(dt);

      for(const e of game.enemies){
        if(e.behavior==='armor'&&!e.__armorV89){
          const add=Math.ceil(e.maxHp*.12);
          e.maxHp+=add;
          e.hp+=add;
          e.__armorV89=true;
        }

        if(e.r){
          e.r*=e.__smallV89?1:.94;
          e.__smallV89=true;
        }
      }
    };
  }

  wait();
})();
