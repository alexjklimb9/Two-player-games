(function(){
  if (!window.GameScriptLoader) {
    console.error('GameScriptLoader is missing.');
    return;
  }

  window.GameScriptLoader.loadScriptChain(['dual-gravity-v2.js?v=107', 'dual-gravity-levels-v90.js?v=107'], null, function(src) {
    console.error('Failed to load chain script:', src);
  });
})();
