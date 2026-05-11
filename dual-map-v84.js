// Dual Gravity v84: first wall teaches asymmetric jump + controlled launch teamwork.
(function(){
  function installMap(){
    if(typeof game==='undefined'||typeof seam==='undefined')return;
    makeLevel=function(){
      const y=seam();
      spans=[
        {x:0,w:390},
        {x:450,w:250},
        {x:770,w:260},
        {x:1100,w:250},
        {x:1430,w:380},
        {x:1880,w:220}
      ];
      walls=[
        {x:650,y:y-62,w:34,h:190},
        {x:1050,y:y-138,w:38,h:276},
        {x:1395,y:y-112,w:34,h:224}
      ];
      switches=[
        {x:510,y:y-10,w:58,h:10,side:'top',active:false},
        {x:1170,y:y,w:58,h:10,side:'bottom',active:false}
      ];
      launchers=[
        {x:585,y:y-10,w:54,h:10,target:'bottom'},
        {x:1240,y:y,w:62,h:10,target:'top'}
      ];
      enemies=[
        {x:875,y:y-28,w:24,h:24,vx:42,side:'top'},
        {x:940,y:y+4,w:24,h:24,vx:-42,side:'bottom'}
      ];
      game.top.x=110;game.top.y=y-game.top.h;
      game.bottom.x=110;game.bottom.y=y;
      game.top.vx=game.top.vy=game.bottom.vx=game.bottom.vy=0;
      game.top.on=game.bottom.on=true;
      game.cameraX=0;game.doorOpen=false;
    };
  }
  installMap();
  setTimeout(installMap,100);
  setTimeout(installMap,300);
})();