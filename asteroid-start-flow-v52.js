// Asteroid start flow v52: remove legacy start listeners, then attach one clean countdown flow.
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

  function showGameScreen(){
    const s=byId('startOverlay'),e=byId('endOverlay');
    if(s)s.classList.add('hidden');
    if(e)e.classList.add('hidden');
  }

  function begin(e){
    stop(e);
    if(active)return;
    active=true;
    showGameScreen();
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
        if(typeof window.startGame==='function')window.startGame(e);
        else if(typeof startGame==='function')startGame(e);
      }
    },1000);
  }

  function replaceButton(id){
    const old=byId(id);
    if(!old||!old.parentNode)return;
    const fresh=old.cloneNode(true);
    old.parentNode.replaceChild(fresh,old);
    ['touchstart','pointerdown','pointerup','click'].forEach(function(ev){
      fresh.addEventListener(ev,begin,{capture:true,passive:false});
    });
  }

  replaceButton('startButton');
  replaceButton('restartButton');
})();