// Core Defense v57: move tower slots closer to the core.
slotPos = function(i){
  const a = game.ring + i * Math.PI * 2 / 6 - Math.PI / 2;
  const r = Math.min(canvas.width, canvas.height) * .14 + 28;
  return {
    x: cx() + Math.cos(a) * r,
    y: cy() + Math.sin(a) * r,
    a
  };
};