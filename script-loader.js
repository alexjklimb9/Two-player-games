(function (global) {
  function loadScript(src, onDone, onError) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = onDone || function () {};
    script.onerror = onError || function () {
      console.error('Failed to load script:', src);
    };
    document.body.appendChild(script);
  }

  function loadScriptChain(sources, onComplete, onError) {
    var index = 0;

    function next() {
      if (index >= sources.length) {
        if (onComplete) onComplete();
        return;
      }
      var src = sources[index++];
      loadScript(src, next, function () {
        if (onError) onError(src);
      });
    }

    next();
  }

  global.GameScriptLoader = {
    loadScript: loadScript,
    loadScriptChain: loadScriptChain
  };
})(window);
