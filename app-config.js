(function (global) {
  const CACHE_VERSION = '162';

  const GAME_SCRIPTS = {
    balance: 'balance-board-v2.js',
    seesaw: 'seesaw-entry-v2.js',
    asteroids: 'asteroids-crew-v3.js',
    core: 'core-defense-clean-v2.js',
    dual: 'dual-gravity-v3.js'
  };

  global.AppConfig = {
    CACHE_VERSION,
    GAME_SCRIPTS
  };
})(window);
