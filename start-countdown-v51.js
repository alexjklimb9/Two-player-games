// Shared v51 start countdown for non-asteroid games.
(function(){
  let active = false;

  function byId(id){ return document.getElementById(id); }

  function overlay(){
    let el = byId('countdownOverlay');
    if(!el){
      el = document.createElement('div');
      el.id = 'countdownOverlay';
      el.style.position = 'absolute';
      el.style.inset = '0';
      el.style.zIndex = '80';
      el.style.display = 'none';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.pointerEvents = 'none';
      el.style.font = '900 72px Arial';
      el.style.color = '#f8fafc';
      el.style.textShadow = '0 18px 50px rgba(0,0,0,.65)';
      byId('gameScreen').appendChild(el);
    }
    return el;
  }

  function show(value){
    const el = overlay();
    el.textContent = value;
    el.style.display = 'flex';
  }

  function hide(){
    const el = byId('countdownOverlay');
    if(el) el.style.display = 'none';
  }

  function showGameScreen(){
    const startOverlay = byId('startOverlay');
    const endOverlay = byId('endOverlay');
    if(startOverlay) startOverlay.classList.add('hidden');
    if(endOverlay) endOverlay.classList.add('hidden');
  }

  function stopEvent(e){
    if(!e) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function runStart(e){
    if(typeof window.startGame === 'function') window.startGame(e);
    else if(typeof startGame === 'function') startGame(e);
  }

  function begin(e){
    stopEvent(e);
    if(active) return;
    active = true;
    showGameScreen();
    let n = 3;
    show('3');
    const timer = setInterval(function(){
      n--;
      if(n > 0) show(String(n));
      else if(n === 0) show('GO');
      else {
        clearInterval(timer);
        hide();
        active = false;
        runStart(e);
      }
    }, 1000);
  }

  function replaceButton(id){
    const old = byId(id);
    if(!old || !old.parentNode) return;
    const fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    ['touchstart','pointerdown'].forEach(function(ev){
      fresh.addEventListener(ev, begin, {capture:true, passive:false});
    });
  }

  replaceButton('startButton');
  replaceButton('restartButton');
})();