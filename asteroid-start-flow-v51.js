// Asteroid start flow: start/restart button -> game screen -> countdown -> actual start.
(function(){
  let active=false;
  function byId(id){return document.getElementById(id)}
  function stop(e){if(!e)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
  function overlay(){
    let el=byId('countdownOverlay');
    if(!el){
      el=document.createElement('div');
      el.id='countdownOverlay';
      Object.assign(el.style,{position:'absolute',inset:'0',zIndex:'90',display:'none',alignItems:'center',justifyContent:'center',pointerEvents:'none',font:'900 72px Arial',color:'#f8fafc',textShadow:'0 18px 50px rgba(0,0,0,.65)'});
      byId('gameScreen').appendChild(el);
    }
    return el;
  }
  function show(v){const el=overlay();el.textContent=v;el.style.display='flex'}
  function hide(){const el=byId('countdownOverlay');if(el)el.style.display='none'}
  function shouldHandle(){
    const s=byId('startOverlay'),e=byId('endOverlay');
    return (s&&!s.classList.contains('hidden'))||(e&&!e.classList.contains('hidden'));
  }
  function begin(e){
    if(!shouldHandle())return;
    stop(e);
    if(active)return;
    active=true;
    const s=byId('startOverlay'),end=byId('endOverlay');
    if(s)s.classList.add('hidden');
    if(end)end.classList.add('hidden');
    let n=3;
    show('3');
    const t=setInterval(function(){
      n--;
      if(n>0)show(String(n));
      else if(n===0)show('GO');
      else{
        clearInterval(t);
        hide();
        active=false;
        if(typeof startGame==='function')startGame(e);
      }
    },1000);
  }
  ['startButton','restartButton'].forEach(function(id){
    const btn=byId(id);
    if(!btn)return;
    ['touchstart','pointerdown','pointerup','click'].forEach(function(ev){
      btn.addEventListener(ev,begin,true);
    });
  });
})();