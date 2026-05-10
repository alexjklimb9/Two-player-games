// Asteroid Crew wrap fix: re-enter close to opposite edge and steer inward.
window.wrapRock = function(r) {
  const c = document.getElementById('gameCanvas');
  if (!c || !r) return;
  const m = Math.max(18, r.r || 24);
  const push = 45;

  if (r.x < -m) {
    r.x = c.width + m;
    r.vx = -Math.max(Math.abs(r.vx || 0), push);
  } else if (r.x > c.width + m) {
    r.x = -m;
    r.vx = Math.max(Math.abs(r.vx || 0), push);
  }

  if (r.y < -m) {
    r.y = c.height + m;
    r.vy = -Math.max(Math.abs(r.vy || 0), push);
  } else if (r.y > c.height + m) {
    r.y = -m;
    r.vy = Math.max(Math.abs(r.vy || 0), push);
  }
};