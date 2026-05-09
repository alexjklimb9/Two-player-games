// Asteroid Crew v48 wrap fix: make asteroids re-enter visibly from the opposite edge.
(function(){
  window.wrapRock = function(r){
    const canvas = document.getElementById('gameCanvas');
    if(!canvas || !r) return;
    const m = Math.max(18, r.r || 24);
    if(r.x < -m) r.x = canvas.width + m;
    else if(r.x > canvas.width + m) r.x = -m;
    if(r.y < -m) r.y = canvas.height + m;
    else if(r.y > canvas.height + m) r.y = -m;
  };
})();