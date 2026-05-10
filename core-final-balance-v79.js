// Core Defense v79: final forced economy + wave targets.
(function(){
  function install(){
    if(typeof game==='undefined'||typeof canvas==='undefined'||typeof ctx==='undefined')return;
    const p=new URLSearchParams(location.search),lvl=parseInt(p.get('level')||'2',10),targets={1:5,2:8,3:12,4:15,5:999999};
    const TARGET=targets[lvl]||8,ENDLESS=lvl===5,BUILD=6,MAX=5,COST={1:15,2:25,3:42,4:70},BOOST=10,DUR=4.8;
    if(typeof LEVEL!=='undefined'){LEVEL.number=lvl;LEVEL.winTarget=TARGET;LEVEL.endless=ENDLESS}
    window.ACTIVE_LEVEL={number:lvl,winTarget:TARGET,endless:ENDLESS};
    function empty(s){return !s||(s.type!==0&&!s.type)}
    function price(s){if(empty(s))return BUILD;if(s.level>=MAX)return 0;return COST[s.level]||70}
    function waveText(){return 'Wave '+Math.max(1,game.wave||1)+'/'+(ENDLESS?'∞':TARGET)}

    buildUpgrade=function(){
      const s=game.slots&&game.slots[game.selected];if(!s)return;
      const pos=slotPos(game.selected),c=price(s);
      if(s.level>=MAX){spark(pos.x,pos.y,C.white,6);return}
      if((game.money||0)<c){spark(pos.x,pos.y,C.danger,8);return}
      game.money-=c;
      if(empty(s)){s.type=game.buildType;s.level=1;s.cd=0;s.boost=0;s.flash=1;spark(pos.x,pos.y,TYPES[s.type].color,14)}
      else{s.level++;s.flash=1;spark(pos.x,pos.y,TYPES[s.type].color,16)}
    };

    special=function(){
      if(game.specialCd>0)return;
      const s=game.slots&&game.slots[game.selected],pos=slotPos(game.selected);
      if(empty(s)){spark(pos.x,pos.y,C.danger,10);game.specialCd=1.5;return}
      s.boost=DUR;s.flash=1.4;game.specialCd=BOOST;spark(pos.x,pos.y,TYPES[s.type].color,30);
    };

    updateWaves=function(dt){
      if(!game.waveActive){game.waveTimer-=dt;if(game.waveTimer<=0)beginWave();if(typeof timeText!=='undefined'&&timeText)timeText.textContent=waveText();return}
      game.spawnClock-=dt;
      if(game.spawnLeft>0&&game.spawnClock<=0){const easy=lvl<=1;game.spawnClock=easy?.95:Math.max(.48,1.0-game.wave*.035-lvl*.035);game.spawnLeft--;spawnEnemy()}
      if(game.spawnLeft<=0&&game.enemies.length===0){game.waveActive=false;game.waveTimer=lvl<=1?3.2:2.6;if(!ENDLESS&&game.wave>=TARGET)endGame('You defended the core through every wave.',true)}
      if(typeof timeText!=='undefined'&&timeText)timeText.textContent=waveText();
    };

    function topBtn(x,y,w,h,label,on,color){drawButton(x,y,w,h,'',on,color);ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI);ctx.fillStyle=on?'#0b0f14':C.white;ctx.font='900 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,0,0);ctx.restore()}
    controls=function(){
      if(!game.running)return;const w=canvas.width*.31,h=56,s=game.slots&&game.slots[game.selected],t=TYPES&&TYPES[game.buildType]?TYPES[game.buildType].name:'Tower';
      let b='BUILD $'+BUILD;if(s){if(empty(s))b='BUILD $'+BUILD;else if(s.level>=MAX)b='MAX';else b='UP $'+price(s)}
      let boost='BOOST';if(s&&s.boost>0)boost='BOOST '+Math.ceil(s.boost)+'s';else if(game.specialCd&&game.specialCd>0)boost='WAIT '+Math.ceil(game.specialCd)+'s';
      topBtn(canvas.width*.02,76,w,h,'TYPE '+t,game.input.topLeft,C.blue);topBtn(canvas.width*.345,76,w,h,b,game.input.topMid,C.blue);topBtn(canvas.width*.67,76,w,h,'SLOT '+((game.selected||0)+1)+'/12',game.input.topRight,C.blue);
      const y=canvas.height-90;drawButton(canvas.width*.02,y,w,h,'ROT ◀',game.input.bottomLeft,C.rose);drawButton(canvas.width*.345,y,w,h,boost,game.input.bottomMid,C.rose);drawButton(canvas.width*.67,y,w,h,'ROT ▶',game.input.bottomRight,C.rose);
    };
  }
  install();setTimeout(install,100);setTimeout(install,300);setTimeout(install,700);setTimeout(install,1500);setTimeout(install,2500);
})();