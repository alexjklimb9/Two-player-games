(function () {
  const CACHE_VERSION = window.AppConfig && window.AppConfig.CACHE_VERSION ? window.AppConfig.CACHE_VERSION : '161';
  const params = new URLSearchParams(window.location.search);
  const selectedGame = params.get('game');

  const games = Object.fromEntries(
    Object.entries((window.AppConfig && window.AppConfig.GAME_SCRIPTS) || {}).map(([key, file]) => [
      key,
      { script: `${file}?v=${CACHE_VERSION}`, extraScript: '' }
    ])
  );


  function showLoadError(scriptName) {
    const resultTitleEl = document.getElementById('resultTitle');
    const resultTextEl = document.getElementById('resultText');
    const endOverlayEl = document.getElementById('endOverlay');

    if (resultTitleEl) resultTitleEl.textContent = 'Load Error';
    if (resultTextEl) {
      resultTextEl.textContent = `Unable to load game assets (${scriptName}). Please refresh and try again.`;
    }
    if (endOverlayEl) endOverlayEl.classList.remove('hidden');

    console.error('Failed to load game script:', scriptName);
  }

  function loadExtraScripts(extraScript) {
    if (!extraScript) return;
    const extraSources = extraScript.split('|').filter(Boolean);
    window.GameScriptLoader.loadScriptChain(extraSources, null, showLoadError);
  }

  if (!selectedGame || !games[selectedGame]) return;

  const game = games[selectedGame];
  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');

  if (selectedGame === 'dual') {
    document.getElementById('gameEyebrow').textContent = 'Two Player Games · Dual Gravity';
    document.getElementById('gameTitle').textContent = 'Dual Gravity';
    document.getElementById('gameDescription').textContent =
      'Shared-line mirrored gravity co-op with tutorial and progression levels.';
    document.getElementById('gameTip').textContent = 'Tutorial plus Levels 1–5 are now playable.';
    document.getElementById('topPlayerLabel').textContent = 'Top Player';
    document.getElementById('topPlayerInstructions').textContent =
      'Walk on the shared line and jump upward.';
    document.getElementById('bottomPlayerLabel').textContent = 'Bottom Player';
    document.getElementById('bottomPlayerInstructions').textContent =
      'Hang from the same line and jump downward.';
    document.getElementById('homeButton').href = `levels.html?game=dual&v=${CACHE_VERSION}`;
  }

  window.GameScriptLoader.loadScript(
    game.script,
    function () {
      loadExtraScripts(game.extraScript);
    },
    function () {
      showLoadError(game.script);
    }
  );
})();
