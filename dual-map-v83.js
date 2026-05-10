// Dual Gravity bridge: load improved map and trap mechanics through the existing live hook.
(function(){
  function load(src){
    const s=document.createElement('script');
    s.src=src;
    document.body.appendChild(s);
  }
  load('dual-map-v84.js?v=85');
  load('dual-spikes-v85.js?v=85');
})();