// Core Defense v84 consolidated entry
// Loads the stable base game, then applies Core Defense polish, behavior enemies, silhouette readability, and boost effects.
(function(){
  function load(src,done){const s=document.createElement('script');s.src=src;s.onload=done||function(){};document.body.appendChild(s)}

  function installPolish(){
    const wait=()=>typeof controls==='function'&&typeof drawButton==='function'&&typeof topBtn==='function'&&typeof game==='object'&&Array.isArray(TYPES);

    function ensureStartButtonWorks(){
      const btn=document.getElementById('startButton');
      const overlay=document.getElementById('startOverlay');
      if(!btn||btn.dataset.coreFixed)return;
      btn.dataset.coreFixed='1';

      btn.addEventListener('click',()=>{
        if(overlay)overlay.classList.add('hidden');
        if(game){
          game.running=true;
          game.over=false;
          game.win=false;
        }

        if(typeof resetGame==='function')resetGame();
        if(typeof startGame==='function')startGame();
      });
    }

    function applyTowerColors(){
      TYPES[0].color='#5fb7cf';
      TYPES[1].color=C.gold;
      TYPES[2].color='#a7f3ff';
      TYPES[3].color='#34d399';
    }

    function install(){
      if(!wait())return setTimeout(install,50);
      applyTowerColors();
      ensureStartButtonWorks();
    }

    install();
  }

  load('core-defense-v80.js?v=108',function(){
    load('start-countdown-v51.js?v=108',installPolish)
  });
})();