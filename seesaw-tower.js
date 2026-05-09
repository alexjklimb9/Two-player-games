const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
const startOverlay=document.getElementById('startOverlay');
const endOverlay=document.getElementById('endOverlay');
const startButton=document.getElementById('startButton');
const restartButton=document.getElementById('restartButton');
const resultTitle=document.getElementById('resultTitle');
const resultText=document.getElementById('resultText');
const finalStats=document.getElementById('finalStats');
const timeText=document.getElementById('timeText');
const stressText=document.getElementById('stressText');
const fallText=document.getElementById('fallText');
const holdText=document.getElementById('holdText');

const C={bg:'#0b0f14',bg2:'#151b23',line:'rgba(235,240,245,.075)',line2:'rgba(235,240,245,.14)',top:'#4fb8d8',bottom:'#e06f8f',board:'#d7dde5',boardDark:'#2b333d',danger:'#d97757',white:'#f8fafc',haz:'#b8b0a8'};
const game={running:false,timer:0,score:0,combo:0,shake:0,camY:0,spawn:0,platforms:[],sparks:[],flyers:[],players:[],input:{topLeft:false,topRight:false,bottomLeft:false,bottomRight:false}};

function resize(){canvas.width=innerWidth;canvas.height=innerHeight}addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rr(x,y,w,h,r,fill=true,stroke=false){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke()}
function sy(y){return y-game.camY}
function baseY(){return canvas.height*.76}
function gap(){return Math.max(116,canvas.height*.19)}
function laneMin(side){return side==='top'?canvas.width*.07:canvas.width*.53}
function laneMax(side){return side==='top'?canvas.width*.47:canvas.width*.93}

function makePlatforms(){const arr=[];for(let i=0;i<28;i++){arr.push({x:canvas.width/2,y:baseY()-i*gap(),w:canvas.width*.86,h:14,tilt:0,tiltV:0,pulse:0,flashSide:null,flash:0,spikeSeed:i*1.7+Math.random()*2})}return arr}
function makePlayer(side){return{side,x:side==='top'?canvas.width*.28:canvas.width*.72,y:baseY()-34,vx:0,vy:0,r:21,on:0,grounded:true,lastGrounded:true,airTime:0,hop:side==='top'?.12:.42,wobble:Math.random()*6.28,blink:Math.random()*4,color:side==='top'?C.top:C.bottom}}
function clearInput(){Object.keys(game.input).forEach(k=>game.input[k]=false)}
function resetGame(){Object.assign(game,{running:true,timer:0,score:0,combo:0,shake:0,camY:0,spawn:0,sparks:[],flyers:[]});clearInput();game.platforms=makePlatforms();game.players=[makePlayer('top'),makePlayer('bottom')];startOverlay.classList.add('hidden');endOverlay.classList.add('hidden')}
function spark(x,y,color,n=10){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=40+Math.random()*155;game.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:1.5+Math.random()*3.7,color})}}
function endGame(msg){if(!game.running)return;game.running=false;clearInput();game.shake=11;spark(canvas.width/2,game.camY+canvas.height*.5,C.board,24);resultTitle.textContent='Game Over';resultText.textContent=msg;finalStats.innerHTML=`Height Reached: ${game.score}<br>Launch Chain: ${game.combo}<br>Survival Time: ${Math.floor(game.timer)}s`;endOverlay.classList.remove('hidden')}
function dir(p){return p.side==='top'?(game.input.topRight?1:0)-(game.input.topLeft?1:0):(game.input.bottomRight?1:0)-(game.input.bottomLeft?1:0)}
function nearestPlatform(p){let best=0,dist=1e9;for(let i=0;i<game.platforms.length;i++){const pf=game.platforms[i],d=Math.abs(p.y-(pf.y-30));if(d<dist){dist=d;best=i}}return best}
function platformSurface(pf,x){const rel=clamp((x-pf.x)/(pf.w/2),-1,1);return pf.y+Math.sin(pf.tilt)*rel*(pf.w/2)-30}
function oppositeSide(a,b,pf){return (a.x<pf.x&&b.x>pf.x)||(a.x>pf.x&&b.x<pf.x)}
function spikeActive(i){if(i<2||i%3!==0)return false;return Math.sin(game.timer*1.45+i*.9)>0.43}
function spikeY(pf){return pf.y-gap()+34}

function assistLaunch(lander,pf,landingSpeed){const side=lander.x<pf.x?'left':'right';const sideSign=side==='left'?-1:1;const strength=clamp(landingSpeed/520,.7,1.8);pf.tiltV+=-sideSign*.48*strength;pf.tilt+=-sideSign*.08*strength;pf.pulse=1;pf.flashSide=side;pf.flash=1;game.shake=Math.max(game.shake,clamp(landingSpeed*.012,3,10));spark(lander.x,pf.y-12,lander.color,12);
  let launched=false;
  game.players.forEach(other=>{if(other===lander)return;const closeFloor=Math.abs(other.on-lander.on)<=1;const closeHeight=Math.abs(other.y-lander.y)<gap()*1.35;if(!closeFloor&&!closeHeight)return;if(!oppositeSide(lander,other,pf))return;const edgePower=clamp(Math.abs(other.x-pf.x)/(pf.w/2),.48,1.12);const catchup=other.y>lander.y?1.18:1;const impulse=clamp(520+landingSpeed*.62,600,900)*edgePower*catchup;other.vy=-impulse;other.grounded=false;other.airTime=0;other.y-=8;game.combo++;launched=true;spark(other.x,other.y,other.color,18)});
  lander.vy=-clamp(255+landingSpeed*.13,300,455);lander.y-=5;lander.grounded=false;lander.airTime=0;if(!launched)game.combo=Math.max(0,game.combo-1);
}
function spawnFlyer(){const fromLeft=Math.random()<.5;const y=game.camY+canvas.height*(.25+Math.random()*.48);game.flyers.push({x:fromLeft?-50:canvas.width+50,y,vx:fromLeft?150+Math.random()*80:-150-Math.random()*80,r:13+Math.random()*9,rot:0})}

function updatePlatforms(dt){game.platforms.forEach(pf=>{pf.tiltV+=(-pf.tilt)*2.15*dt;pf.tiltV*=Math.pow(.86,dt*60);pf.tilt+=pf.tiltV*dt*60;pf.tilt=clamp(pf.tilt,-.55,.55);pf.pulse=Math.max(0,pf.pulse-dt*3.4);pf.flash=Math.max(0,pf.flash-dt*4.2)});}
function updatePlayers(dt){game.players.forEach(p=>{p.lastGrounded=p.grounded;p.airTime+=dt;const d=dir(p);if(d)p.vx+=d*34*dt;p.vx*=Math.pow(.88,dt*60);p.x+=p.vx*dt*60;p.x=clamp(p.x,laneMin(p.side),laneMax(p.side));
  if(p.grounded){p.hop-=dt;if(p.hop<=0){p.vy=-315;p.grounded=false;p.airTime=0;p.hop=.42}}else{p.vy+=900*dt;p.y+=p.vy*dt}
  p.wobble+=(3.1+Math.abs(p.vx)*.06+Math.abs(p.vy)*.002)*dt;p.blink+=dt;
  const idx=nearestPlatform(p);const pf=game.platforms[idx];const surface=platformSurface(pf,p.x);const within=Math.abs(p.x-pf.x)<pf.w/2-20;const falling=p.vy>=0;const close=p.y>=surface-32&&p.y<=surface+40;
  if(!p.grounded&&falling&&within&&close){const landingSpeed=p.vy;p.y=surface;p.vy=0;p.grounded=true;p.on=idx;p.hop=.16;if(p.airTime>.07&&landingSpeed>120)assistLaunch(p,pf,landingSpeed);p.airTime=0}
  if(!within&&p.grounded){p.grounded=false;p.vy=80}
  if(spikeActive(idx)&&p.vy<0&&p.y-p.r<spikeY(pf)&&idx<game.platforms.length-1){spark(p.x,p.y,C.danger,20);endGame(`${p.side==='top'?'Top':'Bottom'} player hit active spikes.`)}
  if(p.y-game.camY>canvas.height+115)endGame(`${p.side==='top'?'Top':'Bottom'} player fell.`)
});
  const lowY=Math.max(game.players[0].y,game.players[1].y);const highY=Math.min(game.players[0].y,game.players[1].y);game.camY+=(highY-canvas.height*.48-game.camY)*.045;if(lowY-game.camY>canvas.height*.86)game.camY+=(lowY-canvas.height*.78-game.camY)*.035;
  let h=0;game.players.forEach(p=>{h=Math.max(h,Math.max(0,Math.floor((baseY()-p.y)/gap())))});game.score=Math.max(game.score,h);
}
function updateFlyers(dt){game.spawn+=dt;if(game.spawn>Math.max(1.6,3.4-game.score*.08)){game.spawn=0;spawnFlyer()}for(let i=game.flyers.length-1;i>=0;i--){const f=game.flyers[i];f.x+=f.vx*dt;f.rot+=dt*4;for(const p of game.players){if(Math.hypot(f.x-p.x,f.y-p.y)<f.r+p.r-5){spark(p.x,p.y,C.haz,16);endGame(`${p.side==='top'?'Top':'Bottom'} player got clipped.`);return}}if(f.x<-90||f.x>canvas.width+90)game.flyers.splice(i,1)}}
function updateSparks(dt){for(let i=game.sparks.length-1;i>=0;i--){const s=game.sparks[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=170*dt;s.life-=dt*2.1;if(s.life<=0)game.sparks.splice(i,1)}}
function update(dt){if(game.running){game.timer+=dt;updatePlatforms(dt);updatePlayers(dt);updateFlyers(dt);timeText.textContent=`${Math.floor(game.timer)}s`;stressText.textContent=`${Math.min(100,Math.floor(Math.max(...game.platforms.map(p=>Math.abs(p.tilt)))/.55*100))}%`;fallText.textContent=game.score;holdText.textContent=`${Math.max(1,game.combo).toFixed(0)}x`}updateSparks(dt);game.shake=Math.max(0,game.shake-dt*20)}

function bg(){const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,C.bg);g.addColorStop(.55,C.bg2);g.addColorStop(1,'#080b10');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=C.line;ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}for(let y=(-game.camY*.18)%64;y<canvas.height;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}ctx.strokeStyle=C.line2;ctx.beginPath();ctx.moveTo(canvas.width/2,0);ctx.lineTo(canvas.width/2,canvas.height);ctx.stroke()}
function drawSpikes(pf,i){if(!spikeActive(i))return;const y=sy(spikeY(pf));if(y<-30||y>canvas.height+35)return;ctx.fillStyle='rgba(217,119,87,.86)';const count=6,span=pf.w*.62,start=pf.x-span/2;for(let k=0;k<count;k++){const x=start+k*(span/(count-1));ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.lineTo(x,y+20);ctx.closePath();ctx.fill()}}
function drawPlatform(pf,i){const y=sy(pf.y);if(y<-95||y>canvas.height+110)return;drawSpikes(pf,i);ctx.save();ctx.translate(pf.x,y);ctx.rotate(pf.tilt);ctx.shadowColor='rgba(0,0,0,.32)';ctx.shadowBlur=15+pf.pulse*9;ctx.shadowOffsetY=8;ctx.fillStyle=C.boardDark;rr(-pf.w/2,-7-pf.pulse*3,pf.w,14+pf.pulse*6,7);const danger=Math.min(1,Math.abs(pf.tilt)/.55);const gr=ctx.createLinearGradient(-pf.w/2,0,pf.w/2,0);gr.addColorStop(0,C.top);gr.addColorStop(.5,danger>.58?C.danger:C.board);gr.addColorStop(1,C.bottom);ctx.fillStyle=gr;rr(-pf.w/2,-2.5,pf.w,5,2.5);if(pf.flash>0){ctx.globalAlpha=pf.flash*.42;ctx.fillStyle=pf.flashSide==='left'?C.top:C.bottom;rr(pf.flashSide==='left'?-pf.w/2:0,-9,pf.w/2,18,8);ctx.globalAlpha=1}ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(0,0,4,0,6.28);ctx.fill();ctx.restore();ctx.strokeStyle='rgba(203,213,225,.24)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pf.x,y+7);ctx.lineTo(pf.x-16,y+56);ctx.lineTo(pf.x+16,y+56);ctx.closePath();ctx.stroke()}
function drawPlayer(p){const y=sy(p.y);const pulse=1+Math.sin(p.wobble)*.025,panic=Math.min(1,Math.abs(p.vy)/850),eyeScale=Math.sin(p.blink*3)>.985?.15:1;ctx.save();ctx.translate(p.x,y+Math.sin(p.wobble)*.7);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,p.r+9,p.r*.78,5,0,0,6.28);ctx.fill();ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r*pulse,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.32)';ctx.lineWidth=1.7;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.34)';ctx.beginPath();ctx.arc(-7,-8,5,0,6.28);ctx.fill();ctx.fillStyle='#0b0f14';ctx.beginPath();ctx.ellipse(-7,1,3+panic*1.4,4.7*eyeScale+panic*1.7,0,0,6.28);ctx.ellipse(7,1,3+panic*1.4,4.7*eyeScale+panic*1.7,0,0,6.28);ctx.fill();ctx.strokeStyle='#0b0f14';ctx.lineWidth=2;ctx.beginPath();if(panic>.42)ctx.arc(0,9,3.8,0,6.28);else ctx.arc(0,6,6.5,.2,Math.PI-.2);ctx.stroke();ctx.restore()}
function drawFlyers(){game.flyers.forEach(f=>{ctx.save();ctx.translate(f.x,sy(f.y));ctx.rotate(f.rot);ctx.fillStyle=C.haz;ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=1.5;ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=10;rr(-f.r*1.4,-f.r*.55,f.r*2.8,f.r*1.1,6,true,true);ctx.restore()})}
function drawSparks(){game.sparks.forEach(s=>{ctx.globalAlpha=Math.max(0,s.life*.85);ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,sy(s.y),s.size*s.life,0,6.28);ctx.fill();ctx.globalAlpha=1})}
function drawButton(x,y,w,h,label,on,color){ctx.fillStyle=on?color:'rgba(17,24,39,.78)';ctx.strokeStyle=on?'rgba(255,255,255,.45)':'rgba(255,255,255,.18)';ctx.lineWidth=1.7;rr(x,y,w,h,18,true,true);ctx.fillStyle=on?'#0b0f14':C.white;ctx.font='800 28px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2+1)}
function controls(){if(!game.running)return;const w=Math.min(100,canvas.width*.15),h=56,e=12,ty=76,by=canvas.height-90;drawButton(e,ty,w,h,'◀',game.input.topLeft,C.top);drawButton(canvas.width-w-e,ty,w,h,'▶',game.input.topRight,C.top);drawButton(e,by,w,h,'◀',game.input.bottomLeft,C.bottom);drawButton(canvas.width-w-e,by,w,h,'▶',game.input.bottomRight,C.bottom)}
function render(){ctx.save();const sx=game.shake?(Math.random()-.5)*game.shake:0,syy=game.shake?(Math.random()-.5)*game.shake:0;ctx.translate(sx,syy);bg();game.platforms.forEach(drawPlatform);drawFlyers();game.players.forEach(drawPlayer);drawSparks();controls();ctx.restore()}

let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function overlayVisible(){return!startOverlay.classList.contains('hidden')||!endOverlay.classList.contains('hidden')}
function start(e){e.preventDefault();e.stopPropagation();resetGame()}
[startOverlay,endOverlay,startButton,restartButton].forEach(el=>{el.addEventListener('touchstart',start,{passive:false});el.addEventListener('pointerdown',start);el.addEventListener('click',start)});
function setTouch(t,on){const top=t.clientY<canvas.height/2,left=t.clientX<canvas.width/2;if(top){if(left)game.input.topLeft=on;else game.input.topRight=on}else{if(left)game.input.bottomLeft=on;else game.input.bottomRight=on}}
document.addEventListener('touchstart',e=>{if(overlayVisible())return;e.preventDefault();for(const t of e.changedTouches)setTouch(t,true)},{passive:false});
document.addEventListener('touchmove',e=>{if(!overlayVisible())e.preventDefault()},{passive:false});
document.addEventListener('touchend',e=>{if(overlayVisible())return;e.preventDefault();for(const t of e.changedTouches)setTouch(t,false)},{passive:false});
document.addEventListener('touchcancel',e=>{if(overlayVisible())return;e.preventDefault();for(const t of e.changedTouches)setTouch(t,false)},{passive:false});
render();