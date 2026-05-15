// Shared v51 start countdown for non-asteroid games.
(function(){
  let bypass = false;
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

  function stopEvent(e){
    if(!e) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function intercept(e){
    if(bypass) return;

    const startOverlay = byId('startOverlay');
    const endOverlay = byId('endOverlay');
    const isStartVisible = startOverlay && !startOverlay.classList.contains('hidden');
    const isEndVisible = endOverlay && !endOverlay.classList.contains('hidden');
    if(!isStartVisible && !isEndVisible) return;

    stopEvent(e);

    if(active) return;

    active = true;
    const target = e.currentTarget;
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
        bypass = true;
        target.click();
        setTimeout(function(){ bypass = false; }, 160);
      }
    }, 1000);
  }

  ['startButton','restartButton'].forEach(function(id){
    const btn = byId(id);
    if(!btn) return;
    ['touchstart','pointerdown','pointerup','click'].forEach(function(ev){
      btn.addEventListener(ev, intercept, true);
    });
  });
})();