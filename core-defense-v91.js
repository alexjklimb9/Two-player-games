// Core Defense v91: safe consolidated loader for the current working Core stack.
// Keeps the existing working files as fallbacks while index.html only loads this one Core entry.
(function(){
  if(window.__coreDefenseV91Loaded) return;
  window.__coreDefenseV91Loaded = true;

  const VERSION = '128';
  const stack = [
    'core-defense-v84.js',
    'core-square-arena-v88.js',
    'core-balance-tuning-v89.js',
    'core-enemy-schedule-v85.js',
    'core-tutorial-v86.js',
    'core-slow-outline-v87.js'
  ];

  function withVersion(src){
    return src + '?v=' + VERSION;
  }

  function loadScript(src){
    return new Promise(function(resolve,reject){
      const script = document.createElement('script');
      script.src = withVersion(src);
      script.async = false;
      script.onload = function(){ resolve(src); };
      script.onerror = function(){ reject(new Error('Failed to load ' + src)); };
      document.body.appendChild(script);
    });
  }

  function showCoreLoadError(error){
    console.error('[Core Defense v91]', error);
    const panel = document.querySelector('#startOverlay .panel');
    if(!panel) return;
    const msg = document.createElement('p');
    msg.className = 'tip';
    msg.style.color = '#ff5c4a';
    msg.textContent = 'Core Defense failed to load. Please refresh.';
    panel.appendChild(msg);
  }

  let chain = Promise.resolve();
  stack.forEach(function(src){
    chain = chain.then(function(){ return loadScript(src); });
  });
  chain.catch(showCoreLoadError);
})();
