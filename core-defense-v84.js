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

    function drawTowerTypeButton(x,y,w,h,label,on,color){
      ctx.fillStyle=on?color:'rgba(17,24,39,.84)';
      ctx.strokeStyle=on?'rgba(255,255,255,.48)':color;
      ctx.lineWidth=on?2.2:1.8;
      rr(x,y,w,h,18);
      ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI);
      ctx.fillStyle=on?'#0b0f14':color;ctx.font='900 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,0,0);ctx.restore();
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
      const baseUpdate=update;update=function(dt){baseUpdate(dt);updateMessages(dt)};
      const baseRender=render;render=function(){baseRender();drawWaveMessage();drawCoreHealthRing()};
      drawSlots=function(){drawSlotsEnhanced();drawSlotClarity()};
      controls=function(){
        if(!game.running)return;
        let w=canvas.width*.31,h=56,s=game.slots[game.selected],tower=TYPES[game.buildType];
        let b=empty(s)?'BUILD $'+BUILD:s.level>=MAX?'MAX':'UP $'+price(s),boost='BOOST';
        if(s&&s.boost>0)boost='BOOST '+Math.ceil(s.boost)+'s';else if(game.specialCd>0)boost='WAIT '+Math.ceil(game.specialCd)+'s';
        drawTowerTypeButton(canvas.width*.02,76,w,h,'TYPE '+tower.name,game.input.topLeft,tower.color);
        topBtn(canvas.width*.345,76,w,h,b,game.input.topMid,C.blue);
        topBtn(canvas.width*.67,76,w,h,'SLOT '+(game.selected+1)+'/12',game.input.topRight,C.blue);
        let y=canvas.height-90;drawButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose);drawButton(canvas.width*.345,y,w,h,boost,game.input.bottomMid,C.rose);drawButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose);
      };
    }
    install();
  }

  load('core-defense-v80.js?v=105',function(){load('start-countdown-v51.js?v=105',installPolish)});
})();
