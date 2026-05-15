// Balance Board v2 clean testing entry
// Single page-loaded file for Balance Board testing.
(function(){
  function load(src,done){
    const s=document.createElement('script');
    s.src=src;
    s.onload=done||function(){};
    document.body.appendChild(s);
  }
  load('modern-game.js?v=108',function(){
    load('start-countdown-v51.js?v=108');
  });
})();
