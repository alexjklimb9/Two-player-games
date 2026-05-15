// Core Defense UI polish v81
// Adds in-world clarity without extra panels: tower type color, selected-slot glow, boost aura, core health ring, and brief wave/critical messages.
(function(){
  const waitForCore=()=>typeof controls==='function'&&typeof drawButton==='function'&&typeof topBtn==='function'&&typeof game==='object'&&Array.isArray(TYPES);
  let lastWave=-1,lastCritical=false,message='',messageTime=0,messageColor=null;

  function drawTowerTypeButton(x,y,w,h,label,on,color){
    ctx.fillStyle=on?color:'rgba(17,24,39,.84)';
    ctx.strokeStyle=on?'rgba(255,255,255,.48)':color;
    ctx.lineWidth=on?2.2:1.8;
    rr(x,y,w,h,18);
    ctx.save();
    ctx.translate(x+w/2,y+h/2);
    ctx.rotate(Math.PI);
    ctx.fillStyle=on?'#0b0f14':color;
    ctx.font='900 12px Arial';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(label,0,0);
    ctx.restore();
  }

  function flashMessage(text,color=C.white,time=1.25){
    message=text;
    messageColor=color;
    messageTime=time;
  }

  function updateMessages(dt){
    if(!game.running)return;
    if(game.wave!==lastWave&&game.wave>0){
      lastWave=game.wave;
      const finalText=!ENDLESS&&game.wave>=TARGET?'FINAL WAVE':'WAVE '+game.wave;
      flashMessage(finalText,!ENDLESS&&game.wave>=TARGET?C.gold:C.white,1.25);
    }
    const critical=game.coreHp<=2;
    if(critical&&!lastCritical)flashMessage('CORE CRITICAL',C.danger,1.35);
    lastCritical=critical;
    messageTime=Math.max(0,messageTime-dt);
  }

  function drawWaveMessage(){
    if(!game.running||messageTime<=0||!message)return;
    const a=Math.min(1,messageTime/.35);
    const scale=1+(1-a)*.05;
    ctx.save();
    ctx.globalAlpha=Math.min(.9,a);
    ctx.translate(cx(),cy()-86);
    ctx.scale(scale,scale);
    ctx.fillStyle='rgba(17,24,39,.46)';
    ctx.strokeStyle='rgba(255,255,255,.10)';
    ctx.lineWidth=1.2;
    rr(-86,-21,172,42,21);
    ctx.fillStyle=messageColor||C.white;
    ctx.font='900 15px Arial';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(message,0,1);
    ctx.restore();
    ctx.globalAlpha=1;
  }

  function drawCoreHealthRing(){
    if(!game.running)return;
    const pct=Math.max(0,Math.min(1,game.coreHp/game.maxHp));
    const low=game.coreHp<=2;
    const pulse=low?(Math.sin(game.timer*8)*.5+.5):0;
    ctx.save();
    ctx.translate(cx(),cy());
    ctx.strokeStyle='rgba(255,255,255,.10)';
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.arc(0,0,48,-Math.PI/2,Math.PI*1.5);
    ctx.stroke();
    ctx.strokeStyle=low?`rgba(217,119,87,${.68+.25*pulse})`:C.green;
    ctx.lineWidth=5.5;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.arc(0,0,48,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);
    ctx.stroke();
    if(low){
      ctx.strokeStyle=`rgba(217,119,87,${.20+.18*pulse})`;
      ctx.lineWidth=12;
      ctx.beginPath();
      ctx.arc(0,0,56+pulse*6,0,Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSlotClarity(){
    if(!game.running||!game.slots||!game.slots.length)return;
    const i=game.selected;
    const s=game.slots[i];
    const p=slotPos(i);
    const isEmpty=empty(s);
    const tower=isEmpty?TYPES[game.buildType]:TYPES[s.type];
    const boosted=!isEmpty&&s.boost>0;
    const pulse=Math.sin(game.timer*7)*.5+.5;
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(p.a+Math.PI/2);
    ctx.strokeStyle=tower.color;
    ctx.lineWidth=boosted?5:3.2;
    ctx.globalAlpha=boosted?.9:.55+.25*pulse;
    ctx.beginPath();
    ctx.arc(0,0,34+(boosted?pulse*9:pulse*4),0,Math.PI*2);
    ctx.stroke();
    if(boosted){
      ctx.globalAlpha=.22+.18*pulse;
      ctx.lineWidth=12;
      ctx.beginPath();
      ctx.arc(0,0,48+pulse*10,0,Math.PI*2);
      ctx.stroke();
    }
    if(isEmpty){
      ctx.globalAlpha=.75;
      ctx.strokeStyle=tower.color;
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(-12,0);ctx.lineTo(12,0);
      ctx.moveTo(0,-12);ctx.lineTo(0,12);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha=1;
  }

  function install(){
    if(!waitForCore())return setTimeout(install,50);

    const originalUpdate=typeof update==='function'?update:null;
    if(originalUpdate&&!update.__messageWrapped){
      update=function(dt){
        originalUpdate(dt);
        updateMessages(dt);
      };
      update.__messageWrapped=true;
    }

    const originalRender=typeof render==='function'?render:null;
    if(originalRender&&!render.__messageWrapped){
      render=function(){
        originalRender();
        drawWaveMessage();
      };
      render.__messageWrapped=true;
    }

    const originalDrawCore=typeof drawCore==='function'?drawCore:null;
    if(originalDrawCore&&!drawCore.__clarityWrapped){
      drawCore=function(){
        originalDrawCore();
        drawCoreHealthRing();
      };
      drawCore.__clarityWrapped=true;
    }

    const originalDrawSlots=typeof drawSlots==='function'?drawSlots:null;
    if(originalDrawSlots&&!drawSlots.__clarityWrapped){
      drawSlots=function(){
        originalDrawSlots();
        drawSlotClarity();
      };
      drawSlots.__clarityWrapped=true;
    }

    controls=function(){
      if(!game.running)return;
      let w=canvas.width*.31,h=56,s=game.slots[game.selected],tower=TYPES[game.buildType];
      let b=empty(s)?'BUILD $'+BUILD:s.level>=MAX?'MAX':'UP $'+price(s),boost='BOOST';
      if(s&&s.boost>0)boost='BOOST '+Math.ceil(s.boost)+'s';
      else if(game.specialCd>0)boost='WAIT '+Math.ceil(game.specialCd)+'s';
      drawTowerTypeButton(canvas.width*.02,76,w,h,'TYPE '+tower.name,game.input.topLeft,tower.color);
      topBtn(canvas.width*.345,76,w,h,b,game.input.topMid,C.blue);
      topBtn(canvas.width*.67,76,w,h,'SLOT '+(game.selected+1)+'/12',game.input.topRight,C.blue);
      let y=canvas.height-90;
      drawButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose);
      drawButton(canvas.width*.345,y,w,h,boost,game.input.bottomMid,C.rose);
      drawButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose);
    };
  }
  install();
})();
