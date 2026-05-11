// Dual Gravity v86: two-player launch mechanic.
(function(){
function install(){
if(typeof game==='undefined'||typeof seam==='undefined')return;
window.teamLaunchPads=[
  {standX:610,standW:44,standSide:'bottom',triggerX:570,triggerW:54,triggerSide:'top',target:'bottom',cool:0},
  {standX:1235,standW:50,standSide:'top',triggerX:1190,triggerW:54,triggerSide:'bottom',target:'top',cool:0}
];
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function pad(x,w,side){const y=seam();return{x:x,y:side==='top'?y-12:y,w:w,h:12}}
const oldUpdate=update;
if(!game.__teamLaunchUpdate){game.__teamLaunchUpdate=true;update=function(dt){oldUpdate(dt);if(!game.running)return;for(const p of window.teamLaunchPads){p.cool=Math.max(0,p.cool-dt);const s=pad(p.standX,p.standW,p.standSide),tr=pad(p.triggerX,p.triggerW,p.triggerSide);const launched=p.target==='bottom'?game.bottom:game.top;const trigger=p.triggerSide==='top'?game.top:game.bottom;const ready=hit(launched,s)&&hit(trigger,tr)&&trigger.on&&Math.abs(trigger.vy)<120;if(p.cool<=0&&ready){launched.vy=-launched.g*325;launched.vx+=60;p.cool=1.3;}}};}
const oldDrawWorld=drawWorld;
if(!game.__teamLaunchDraw){game.__teamLaunchDraw=true;drawWorld=function(){oldDrawWorld();ctx.save();ctx.translate(-game.cameraX,0);for(const p of window.teamLaunchPads){const s=pad(p.standX,p.standW,p.standSide),tr=pad(p.triggerX,p.triggerW,p.triggerSide);ctx.fillStyle=p.cool>0?'#64748b':'#e06f8f';ctx.fillRect(s.x,s.y,s.w,s.h);ctx.fillStyle=p.cool>0?'#475569':'#f0b86e';ctx.fillRect(tr.x,tr.y,tr.w,tr.h);ctx.fillStyle='#061018';ctx.font='900 8px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('LAUNCH',s.x+s.w/2,s.y+s.h/2);ctx.fillText('TRIGGER',tr.x+tr.w/2,tr.y+tr.h/2);}ctx.restore();};}
}
install();setTimeout(install,100);setTimeout(install,300);
})();