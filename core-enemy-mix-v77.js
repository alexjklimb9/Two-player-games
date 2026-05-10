// Core Defense v77: all levels spawn small, medium, and large enemies.
(function(){
  function install(){
    if(typeof game==='undefined'||typeof canvas==='undefined')return;
    const T=[
      {name:'small',color:'#facc15',hp:.65,sp:1.45,r:10,reward:2},
      {name:'medium',color:'#a8a29e',hp:1,sp:1,r:15,reward:3},
      {name:'large',color:'#f97316',hp:1.85,sp:.62,r:22,reward:5}
    ];
    function pick(level){
      const x=Math.random();
      if(level<=1)return x<.50?T[0]:x<.88?T[1]:T[2];
      if(level===2)return x<.42?T[0]:x<.78?T[1]:T[2];
      if(level===3)return x<.34?T[0]:x<.70?T[1]:T[2];
      return x<.28?T[0]:x<.62?T[1]:T[2];
    }
    spawnEnemy=function(){
      const side=game.spawnPattern&&game.spawnPattern.length?game.spawnPattern[game.spawnIndex++%game.spawnPattern.length]:Math.floor(Math.random()*4);
      const m=32;let x,y;
      if(side===0){x=-m;y=canvas.height*(.12+Math.random()*.76)}
      else if(side===1){x=canvas.width+m;y=canvas.height*(.12+Math.random()*.76)}
      else if(side===2){x=canvas.width*(.12+Math.random()*.76);y=-m}
      else{x=canvas.width*(.12+Math.random()*.76);y=canvas.height+m}
      const level=(typeof LEVEL!=='undefined'&&LEVEL.number)||parseInt(new URLSearchParams(location.search).get('level')||'2',10);
      const easy=level<=1,type=pick(level),wave=game.wave||1;
      const baseHp=easy?2.4+wave*.55:3.2+wave*.75+level*.55;
      const baseSp=easy?25+wave*1.8:30+wave*2.4+level*2.5;
      const hp=Math.max(1,Math.ceil(baseHp*type.hp));
      const speed=baseSp*type.sp;
      const reward=type.reward+(easy?1:0)+Math.floor(hp/8);
      game.enemies.push({x,y,hp,maxHp:hp,speed,slow:0,r:type.r,reward,kind:type.name,color:type.color});
    };
  }
  install();setTimeout(install,100);setTimeout(install,300);setTimeout(install,700);setTimeout(install,1500);
})();