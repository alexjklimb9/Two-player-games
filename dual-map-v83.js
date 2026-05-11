// Dual Gravity bridge: load improved map, traps, and team-launch mechanics.
(function(){
  function load(src){
    const s=document.createElement('script');
    s.src=src;
    document.body.appendChild(s);
  }
  load('dual-map-v84.js?v=86');
  load('dual-spikes-v85.js?v=86');
  load('dual-team-launch-v86.js?v=86');
})();