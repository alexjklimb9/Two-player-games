// Core Defense UI polish v81
// Color-codes the tower type button and adds selected-slot clarity.
(function(){
  const waitForCore=()=>typeof controls==='function'&&typeof drawButton==='function'&&typeof topBtn==='function'&&typeof game==='object'&&Array.isArray(TYPES);

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

  function drawSelectedSlotPanel(){
    if(!game.running || !game.slots || !game.slots.length)return;
    const s=game.slots[game.selected];
    const isEmpty=empty(s);
    const tower=isEmpty?TYPES[game.buildType]:TYPES[s.type];
    const title='SLOT '+(game.selected+1);
    const status=isEmpty?'Empty · Build '+tower.name: tower.name+' · Lv '+s.level;
    const action=isEmpty?'Build $'+BUILD:(s.level>=MAX?'Max Level':'Upgrade $'+price(s));
    const boost=s&&!isEmpty&&s.boost>0?'Boost '+Math.ceil(s.boost)+'s':'';
    const w=Math.min(260,canvas.width*.72),h=72;
    const x=canvas.width/2-w/2;
    const y=Math.min(canvas.height-172,canvas.height/2+102);

    ctx.save();
    ctx.fillStyle='rgba(17,24,39,.72)';
    ctx.strokeStyle='rgba(255,255,255,.14)';
    ctx.lineWidth=1.4;
    rr(x,y,w,h,22);
    ctx.fillStyle=tower.color;
    ctx.beginPath();
    ctx.arc(x+28,y+36,12,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=C.white;
    ctx.font='900 12px Arial';
    ctx.textAlign='left';
    ctx.textBaseline='middle';
    ctx.fillText(title,x+50,y+22);
    ctx.fillStyle='rgba(248,250,252,.78)';
    ctx.font='800 13px Arial';
    ctx.fillText(status,x+50,y+42);
    ctx.fillStyle=boost?tower.color:'rgba(203,213,225,.86)';
    ctx.font='900 11px Arial';
    ctx.textAlign='right';
    ctx.fillText(boost||action,x+w-18,y+36);
    ctx.restore();
  }

  function install(){
    if(!waitForCore())return setTimeout(install,50);
    const originalRender=typeof render==='function'?render:null;
    if(originalRender&&!render.__slotPanelWrapped){
      render=function(){
        originalRender();
        drawSelectedSlotPanel();
      };
      render.__slotPanelWrapped=true;
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
