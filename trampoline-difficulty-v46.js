// Trampoline Climb v46 difficulty override: taller goal + fewer platforms higher up.
(function(){
  function sparseCount(i){
    if(i < 8) return 2;
    const singleChance = Math.max(0.2, Math.min(0.84, 0.18 + i * 0.011));
    return Math.random() < singleChance ? 1 : 2;
  }

  window.platformCount = sparseCount;

  if (typeof window.platformType === 'function') {
    const originalPlatformType = window.platformType;
    window.platformType = function(i){
      const r = Math.random();
      if(i > 70){
        if(r < 0.12) return 'low';
        if(r < 0.48) return 'mid';
        if(r < 0.86) return 'high';
        return 'super';
      }
      if(i > 40){
        if(r < 0.15) return 'low';
        if(r < 0.55) return 'mid';
        if(r < 0.88) return 'high';
        return 'super';
      }
      return originalPlatformType(i);
    };
  }

  if (typeof window.makePlatforms === 'function' && typeof window.addPlatform === 'function') {
    window.makePlatforms = function(){
      game.platforms = [];
      addPlatform(canvas.width * .38, startY() + 26, 'mid', 112);
      addPlatform(canvas.width * .62, startY() + 26, 'mid', 112);
      let y = startY();
      for(let i = 1; i < 85; i++){
        const gap = 86 + Math.min(46, i * .85) + Math.random() * 6;
        y -= gap;
        const count = sparseCount(i);
        for(let c = 0; c < count; c++){
          const x = count === 1
            ? canvas.width * (.20 + Math.random() * .60)
            : (c === 0 ? canvas.width * (.13 + Math.random() * .28) : canvas.width * (.59 + Math.random() * .28));
          addPlatform(x, y, platformType(i), 72 + Math.random() * 32);
        }
      }
    };
  }

  if (typeof window.updatePlatforms === 'function' && typeof window.addPlatform === 'function') {
    window.updatePlatforms = function(dt){
      for(let i = game.platforms.length - 1; i >= 0; i--){
        const p = game.platforms[i];
        if(p.used) p.fade -= dt * 1.8;
        p.pulse = Math.max(0, p.pulse - dt * 4);
        if(p.fade <= 0) game.platforms.splice(i, 1);
      }
      const topY = game.camY - 340;
      let highestPlat = Math.min(...game.platforms.map(p => p.y));
      while(highestPlat > topY){
        const index = Math.max(1, Math.floor((startY() - highestPlat) / 86) + 1);
        const gap = 84 + Math.min(50, index * .9) + Math.random() * 8;
        highestPlat -= gap;
        const count = sparseCount(index);
        for(let c = 0; c < count; c++){
          const x = count === 1
            ? canvas.width * (.20 + Math.random() * .60)
            : (c === 0 ? canvas.width * (.13 + Math.random() * .28) : canvas.width * (.59 + Math.random() * .28));
          addPlatform(x, highestPlat, platformType(index), 70 + Math.random() * 32);
        }
      }
    };
  }
})();