// Dual Gravity v3 clean testing entry
// Single page-loaded file for Dual Gravity testing. Keeps current level/polish files behind one entry point.
(function(){
  function load(src,done){
    const s=document.createElement('script');
    s.src=src;
    s.onload=done||function(){};
    document.body.appendChild(s);
  }
  load('dual-gravity-v2.js?v=107',function(){
    load('dual-gravity-levels-v90.js?v=107',function(){
      load('dual-gravity-level1-polish-v91.js?v=107');
    });
  });
})();
