// Dual Gravity v85: cross-side spike buttons. A player can trigger spikes on the other player's side.
(function(){
function installSpikes(){
if(typeof game==='undefined'||typeof seam==='undefined')return;
if(!window.dualSpikeTraps){window.dualSpikeTraps=[
{x:820,w:150,side:'top',timer:0,active:false},
{x:880,w:150,side:'bottom',timer:0,active:false}
];}
if(!window.dualSpikeButtons){window.dualSpikeButtons=[
{x:760,w:44,side:'top',target:'bottom',cool:0},
{x:1020,w:44,side:'bottom',target:'top',cool:0}
];}
function r(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function buttonRect(b){const y=seam();return{x:b.x,y:b.side==='top'?y-12:y,w:b.w,h:12}}
function trapRect(t){const y=seam();const h=30;return{x:t.x,y:t.side==='top'?y-h:y,w:t.w,h:h}}
const oldUpdate=update;
if(!game.__dualSpikesUpdate){game.__dualSpikesUpdate=true;update=function(dt){oldUpdate(dt);if(!game.running)return;for(const b of window.dualSpikeButtons){b.cool=Math.max(0,b.cool-dt);const p=b.side==='top'?game.top:game.bottom;if(b.cool<=0&&r(p,buttonRect(b))){const trap=window.dualSpikeTraps.find(t=>t.side===b.target);if(trap){trap.timer=.62;trap.active=true;b.cool=1.25;}}}
for(const t of window.dualSpikeTraps){if(t.timer>0){t.timer-=dt;t.active=t.timer>0;const box=trapRect(t);for(const e of enemies){if(e&&e.side===t.side&&r(e,box)){e.alive=false;e.x=-9999;e.y=-9999;}}
const p=t.side==='top'?game.top:game.bottom;if(r(p,box))endGame('The spike trap saved one player but caught the other.');}else t.active=false;}
};}
const oldDrawWorld=drawWorld;
if(!game.__dualSpikesDraw){game.__dualSpikesDraw=true;drawWorld=function(){oldDrawWorld();const y=seam();ctx.save();ctx.translate(-game.cameraX,0);for(const b of window.dualSpikeButtons){const br=buttonRect(b);ctx.fillStyle=b.cool>0?'#64748b':'#f0b86e';ctx.fillRect(br.x,br.y,br.w,br.h);ctx.fillStyle='#061018';ctx.font='900 9px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('SPIKE',br.x+br.w/2,br.y+br.h/2);}
for(const t of window.dualSpikeTraps){const count=8,baseY=t.side==='top'?y:y;ctx.fillStyle=t.active?'#f97316':'rgba(249,115,22,.28)';for(let i=0;i<count;i++){const x=t.x+i*(t.w/count),w=t.w/count*.72,h=t.active?30:8;ctx.beginPath();if(t.side==='top'){ctx.moveTo(x,baseY);ctx.lineTo(x+w/2,baseY-h);ctx.lineTo(x+w,baseY);}else{ctx.moveTo(x,baseY);ctx.lineTo(x+w/2,baseY+h);ctx.lineTo(x+w,baseY);}ctx.closePath();ctx.fill();}}
ctx.restore();};}
}
installSpikes();setTimeout(installSpikes,100);setTimeout(installSpikes,300);
})();