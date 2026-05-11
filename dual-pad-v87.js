// Dual Gravity v87: shared pad override.
(function(){
function install(){
if(typeof game==='undefined'||typeof seam==='undefined')return;
window.teamLaunchPads=[{x:585,w:62,cool:0},{x:1230,w:66,cool:0}];
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function box(x,w,top){const y=seam();return{x:x,y:top?y-12:y,w:w,h:12}}
function ready(p,b){return hit(p,b)&&p.on&&Math.abs(p.vy)<140}
update=function(dt){if(typeof window.__dualBaseUpdate==='function')window.__dualBaseUpdate(dt);};
}
install();
})();