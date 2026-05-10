// Core Defense v78: exponential-ish upgrade costs and longer boost cooldown.
(function(){
  function install(){
    if(typeof game==='undefined'||typeof canvas==='undefined'||typeof ctx==='undefined')return;
    const BUILD=6,MAX=5,BOOST=10,DUR=4.8,COST={1:15,2:25,3:42,4:70};
    function empty(s){return !s||(s.type!==0&&!s.type)}
    function cost(s){if(empty(s))return BUILD;if(s.level>=MAX)return 0;return COST[s.level]||70}
    buildUpgrade=function(){
      const s=game.slots&&game.slots[game.selected];if(!s)return;
      const p=slotPos(game.selected),c=cost(s);
      if(s.level>=MAX){spark(p.x,p.y,C.white,6);return}
      if((game.money||0)<c){spark(p.x,p.y,C.danger,8);return}
      game.money-=c;
      if(empty(s)){s.type=game.buildType;s.level=1;s.cd=0;s.boost=0;s.flash=1;spark(p.x,p.y,TYPES[s.type].color,14)}
      else{s.level++;s.flash=1;spark(p.x,p.y,TYPES[s.type].color,16)}
    };
    special=function(){
      if(game.specialCd>0)return;
      const s=game.slots&&game.slots[game.selected],p=slotPos(game.selected);
      if(empty(s)){spark(p.x,p.y,C.danger,10);game.specialCd=1.5;return}
      s.boost=DUR;s.flash=1.4;game.specialCd=BOOST;spark(p.x,p.y,TYPES[s.type].color,30);
    };
  }
  install();setTimeout(install,100);setTimeout(install,300);setTimeout(install,700);setTimeout(install,1500);
})();