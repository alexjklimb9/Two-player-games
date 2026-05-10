// Dual Gravity v83: improved first level map layout.
(function(){
  function installMap(){
    if(typeof game==='undefined'||typeof seam==='undefined')return;
    makeLevel=function(){
      const y=seam();
      spans=[
        {x:0,w:360},        // safe start / movement tutorial
        {x:420,w:230},      // first small gap
        {x:720,w:260},      // switch + launcher intro
        {x:1050,w:230},     // cooperation wall section
        {x:1360,w:360},     // final exit stretch
        {x:1800,w:220}      // victory runway
      ];
      walls=[
        {x:625,y:y-96,w:34,h:192},    // first center wall, both sides must jump around it
        {x:1000,y:y-138,w:38,h:276},  // taller gate before second switch
        {x:1325,y:y-112,w:34,h:224}   // final timing wall near exit
      ];
      switches=[
        {x:500,y:y-10,w:58,h:10,side:'top',active:false},
        {x:1120,y:y,w:58,h:10,side:'bottom',active:false}
      ];
      launchers=[
        {x:780,y:y-10,w:62,h:10,target:'bottom'},
        {x:1190,y:y,w:62,h:10,target:'top'}
      ];
      enemies=[
        {x:820,y:y-28,w:24,h:24,vx:42,side:'top'},
        {x:880,y:y+4,w:24,h:24,vx:-42,side:'bottom'}
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