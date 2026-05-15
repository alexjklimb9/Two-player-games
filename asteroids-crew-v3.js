// Asteroid Crew v3 clean testing entry
// Single page-loaded file for Asteroid Crew testing. Keeps legacy files behind one entry point for now.
(function(){
  function load(src,done){
    const s=document.createElement('script');
    s.src=src;
    s.onload=done||function(){};
    document.body.appendChild(s);
  }
  load('asteroids-crew-v2.js?v=109',function(){
    load('asteroid-mode-v50.js?v=109',function(){
      load('asteroid-start-flow-v51.js?v=109');
    });
  });
})();
