(function(){
  if (!window.GameScriptLoader) {
    console.error('GameScriptLoader is missing.');
    return;
  }

  window.GameScriptLoader.loadScriptChain(['seesaw-tower.js?v=108', 'trampoline-difficulty-v46.js?v=108', 'start-countdown-v51.js?v=108'], null, function(src) {
    console.error('Failed to load chain script:', src);
  });
})();
