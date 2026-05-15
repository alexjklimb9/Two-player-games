// Restores the softer pulsing boost aura while keeping the current core health ring.
(function(){
  function ready(){return typeof game==='object'&&Array.isArray(game.slots)&&typeof slotPos==='function'&&typeof empty==='function'&&Array.isArray(TYPES)&&typeof ctx==='object'}
  function body(type,level,color){
    ctx.save();ctx.fillStyle=color;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1.25;
    if(type===0){ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();ctx.stroke()}
    else if(type===1){ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(15,0);ctx.lineTo(0,15);ctx.lineTo(-15,0);ctx.closePath();ctx.fill();ctx.stroke()}
    else if(type===2){ctx.beginPath();for(let i=0;i<6;i++){let a=-Math.PI/2+i*Math.PI/3,x=Math.cos(a)*14,y=Math.sin(a)*14;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke()}
    else{ctx.beginPath();ctx.ellipse(0,0,17,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(11,15,20,.30)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-4,0,6,-1.1,1.1);ctx.stroke();ctx.beginPath();ctx.arc(5,0,8,-1.1,1.1);ctx.stroke()}
    ctx.fillStyle='#0b0f14';ctx.font='900 11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(level,0,1);ctx.restore();
  }
  function install(){
    if(!ready())return setTimeout(install,50);
    drawSlots=function(){
      for(let i=0;i<game.slots.length;i++){
        let s=game.slots[i],p=slotPos(i),sel=i===game.selected;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a+Math.PI/2);
        ctx.fillStyle=sel?'rgba(248,250,252,.12)':'rgba(17,24,39,.85)';ctx.strokeStyle=sel?C.white:'rgba(255,255,255,.18)';ctx.lineWidth=sel?2.5:1.5;
        ctx.beginPath();ctx.arc(0,0,24+(s.flash||0)*5,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(!empty(s))body(s.type,s.level,TYPES[s.type].color);else{ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-8,-2,16,4);ctx.fillRect(-2,-8,4,16)}
        ctx.restore();
      }
      let s=game.slots[game.selected],p=slotPos(game.selected),isEmpty=empty(s),tower=isEmpty?TYPES[game.buildType]:TYPES[s.type],boosted=!isEmpty&&s.boost>0,pulse=Math.sin(game.timer*7)*.5+.5;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a+Math.PI/2);ctx.strokeStyle=tower.color;ctx.lineWidth=boosted?4.2:2.4;ctx.globalAlpha=boosted?.82:.42+.18*pulse;ctx.beginPath();ctx.arc(0,0,29+pulse*2.5,0,Math.PI*2);ctx.stroke();
      if(boosted){ctx.globalAlpha=.16+.12*pulse;ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,40+pulse*6,0,Math.PI*2);ctx.stroke()}
      if(isEmpty){ctx.globalAlpha=.7;ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(11,0);ctx.moveTo(0,-11);ctx.lineTo(0,11);ctx.stroke()}
      ctx.restore();ctx.globalAlpha=1;
    }
  }
  install();
})();