(function(){
  if (!window.GameScriptLoader) {
    console.error('GameScriptLoader is missing.');
    return;
  }

  window.GameScriptLoader.loadScriptChain(['asteroids-crew-v2.js?v=112', 'asteroid-start-flow-v52.js?v=112', 'asteroid-mode-v50.js?v=112'], null, function(src) {
    console.error('Failed to load chain script:', src);
  });
})();
