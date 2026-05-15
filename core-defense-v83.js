// Core Defense v83 consolidated entry
// Loads the base game, countdown, and approved Core Defense polish from one game entry point.
(function(){
  function load(src,done){
    const s=document.createElement('script');
    s.src=src;
    s.onload=done||function(){};
    document.body.appendChild(s);
  }
  load('core-defense-v80.js?v=104',function(){
    load('start-countdown-v51.js?v=104',function(){
      load('core-defense-ui-polish-v81.js?v=104');
    });
  });
})();
