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
const game={running:false,timer:0,score:0,combo:0,shake:0,camY:0,platforms:[],sparks:[],players:[],input:{topLeft:false,topRight:false,bottomLeft:false,bottomRight:false}};

function resize(){canvas.width=innerWidth;canvas.height=innerHeight}addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rr(x,y,w,h,r,fill=true,stroke=false){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke()}
function sy(y){return y-game.camY}
function baseY(){return canvas.height*.75}
function gap(){return Math.max(92,canvas.height*.16)}

function makePlatforms(){const arr=[];for(let i=0;i<24;i++){arr.push({x:canvas.width/2,y:baseY()-i*gap(),w:canvas.width*.76,h:14,tilt:0,tiltV:0,pulse:0,lastHit:0})}return arr}
function makePlayer(side){return{side,x:side==='top'?canvas.width*.34:canvas.width*.66,y:baseY()-34,vx:0,vy:0,r:21,on:0,grounded:false,lastGrounded:false,wobble:Math.random()*6.28,blink:Math.random()*4,color:side==='top'?C.top:C.bottom}}
function clearInput(){Object.keys(game.input).forEach(k=>game.input[k]=false)}
function resetGame(){Object.assign(game,{running:true,timer:0,score:0,combo:0,shake:0,camY:0,sparks:[]});clearInput();game.platforms=makePlatforms();game.players=[makePlayer('top'),makePlayer('bottom')];startOverlay.classList.add('hidden');endOverlay.classList.add('hidden')}
function spark(x,y,color,n=10){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=40+Math.random()*150;game.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:1.5+Math.random()*3.5,color})}}
function endGame(msg){if(!game.running)return;game.running=false;clearInput();game.shake=10;spark(canvas.width/2,game.camY+canvas.height*.5,C.board,24);resultTitle.textContent='Game Over';resultText.textContent=msg;finalStats.innerHTML=`Height Reached: ${game.score}<br>Launch Chain: ${game.combo}<br>Survival Time: ${Math.floor(game.timer)}s`;endOverlay.classList.remove('hidden')}
function dir(p){return p.side==='top'?(game.input.topRight?1:0)-(game.input.topLeft?1:0):(game.input.bottomRight?1:0)-(game.input.bottomLeft?1:0)}
function platformAt(i){return game.platforms[Math.max(0,Math.min(game.platforms.length-1,i))]}
function nearestPlatform(p){let best=0,dist=1e9;for(let i=0;i<game.platforms.length;i++){const pf=game.platforms[i],d=Math.abs(p.y-(pf.y-30));if(d<dist){dist=d;best=i}}return best}
function platformSurface(pf,x){const rel=clamp((x-pf.x)/(pf.w/2),-1,1);return pf.y+Math.sin(pf.tilt)*rel*(pf.w/2)-30}
function sameSide(a,b,pf){return (a.x<pf.x&&b.x<pf.x)||(a.x>pf.x&&b.x>pf.x)}

function launchOpposite(lander,pf,landingSpeed){const side=lander.x<pf.x?'left':'right';const impulse=clamp(landingSpeed*.72,340,760);const tiltKick=side==='left'?.34:-.34;pf.tiltV+=tiltKick*(landingSpeed/520);pf.pulse=1;pf.lastHit=game.timer;game.shake=Math.max(game.shake,Math.min(8,landingSpeed*.01));spark(lander.x,pf.y-12,lander.color,10);
  game.players.forEach(other=>{if(other===lander)return;if(other.on!==lander.on)return;if(sameSide(lander,other,pf))return;const distanceFromEnd=Math.abs(other.x-pf.x)/(pf.w/2);const bonus=clamp(distanceFromEnd,.35,1.05);other.vy=-impulse*bonus;other.grounded=false;other.y-=6;game.combo++;spark(other.x,other.y,other.color,14)});
}

function updatePlatforms(dt){game.platforms.forEach(pf=>{pf.tiltV+=(-pf.tilt)*1.9*dt;pf.tiltV*=Math.pow(.88,dt*60);pf.tilt+=pf.tiltV*dt*60;pf.tilt=clamp(pf.tilt,-.46,.46);pf.pulse=Math.max(0,pf.pulse-dt*3.2)});}
function updatePlayers(dt){game.players.forEach(p=>{p.lastGrounded=p.grounded;p.grounded=false;const d=dir(p);if(d)p.vx+=d*30*dt;p.vx*=Math.pow(.86,dt*60);p.x+=p.vx*dt*60;p.vy+=980*dt;p.y+=p.vy*dt;p.wobble+=(2.8+Math.abs(p.vx)*.055+Math.abs(p.vy)*.002)*dt;p.blink+=dt;
  const idx=nearestPlatform(p);const pf=game.platforms[idx];const surface=platformSurface(pf,p.x);const within=Math.abs(p.x-pf.x)<pf.w/2-20;const falling=p.vy>=0;const close=p.y>=surface-28&&p.y<=surface+34;
  if(falling&&within&&close){const landingSpeed=p.vy;p.y=surface;p.vy=0;p.grounded=true;p.on=idx;p.x=clamp(p.x,pf.x-pf.w/2+24,pf.x+pf.w/2-24);if(!p.lastGrounded&&landingSpeed>170)launchOpposite(p,pf,landingSpeed)}
  if(!within&&p.grounded){p.grounded=false;p.vy=80}
  const spikeY=pf.y-gap()+24;if(p.vy<0&&p.y-p.r<spikeY&&idx<game.platforms.length-1){spark(p.x,p.y,C.danger,18);endGame(`${p.side==='top'?'Top':'Bottom'} player hit the spike ceiling.`)}
  if(p.y-game.camY>canvas.height+90)endGame(`${p.side==='top'?'Top':'Bottom'} player fell.`)
});
  const highestY=Math.min(game.players[0].y,game.players[1].y);game.camY+=(highestY-canvas.height*.46-game.camY)*.045;
  let h=0;game.players.forEach(p=>{h=Math.max(h,Math.max(0,Math.floor((baseY()-p.y)/gap())))});game.score=Math.max(game.score,h);
}
function updateSparks(dt){for(let i=game.sparks.length-1;i>=0;i--){const s=game.sparks[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=170*dt;s.life-=dt*2.1;if(s.life<=0)game.sparks.splice(i,1)}}
function update(dt){if(game.running){game.timer+=dt;updatePlatforms(dt);updatePlayers(dt);timeText.textContent=`${Math.floor(game.timer)}s`;stressText.textContent=`${Math.min(100,Math.floor(Math.max(...game.platforms.map(p=>Math.abs(p.tilt)))/.46*100))}%`;fallText.textContent=game.score;holdText.textContent=`${Math.max(1,game.combo).toFixed(0)}x`}updateSparks(dt);game.shake=Math.max(0,game.shake-dt*18)}

function bg(){const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,C.bg);g.addColorStop(.55,C.bg2);g.addColorStop(1,'#080b10');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=C.line;ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}for(let y=(-game.camY*.18)%64;y<canvas.height;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}ctx.strokeStyle=C.line2;ctx.beginPath();ctx.moveTo(canvas.width/2,0);ctx.lineTo(canvas.width/2,canvas.height);ctx.stroke()}
function drawSpikes(pf,i){if(i>=game.platforms.length-1)return;const y=sy(pf.y-gap()+24);if(y<-20||y>canvas.height+30)return;ctx.fillStyle='rgba(217,119,87,.82)';const count=8,span=pf.w*.78,start=pf.x-span/2;for(let k=0;k<count;k++){const x=start+k*(span/(count-1));ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.lineTo(x,y+18);ctx.closePath();ctx.fill()}}
function drawPlatform(pf,i){const y=sy(pf.y);if(y<-80||y>canvas.height+100)return;drawSpikes(pf,i);ctx.save();ctx.translate(pf.x,y);ctx.rotate(pf.tilt);ctx.shadowColor='rgba(0,0,0,.32)';ctx.shadowBlur=15+pf.pulse*8;ctx.shadowOffsetY=8;ctx.fillStyle=C.boardDark;rr(-pf.w/2,-7-pf.pulse*2,pf.w,14+pf.pulse*4,7);const danger=Math.min(1,Math.abs(pf.tilt)/.46);const gr=ctx.createLinearGradient(-pf.w/2,0,pf.w/2,0);gr.addColorStop(0,C.top);gr.addColorStop(.5,danger>.55?C.danger:C.board);gr.addColorStop(1,C.bottom);ctx.fillStyle=gr;rr(-pf.w/2,-2.5,pf.w,5,2.5);ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(0,0,4,0,6.28);ctx.fill();ctx.restore();ctx.strokeStyle='rgba(203,213,225,.24)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pf.x,y+7);ctx.lineTo(pf.x-16,y+56);ctx.lineTo(pf.x+16,y+56);ctx.closePath();ctx.stroke()}
function drawPlayer(p){const y=sy(p.y);const pulse=1+Math.sin(p.wobble)*.025,panic=Math.min(1,Math.abs(p.vy)/800),eyeScale=Math.sin(p.blink*3)>.985?.15:1;ctx.save();ctx.translate(p.x,y+Math.sin(p.wobble)*.7);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,p.r+9,p.r*.78,5,0,0,6.28);ctx.fill();ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r*pulse,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.32)';ctx.lineWidth=1.7;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.34)';ctx.beginPath();ctx.arc(-7,-8,5,0,6.28);ctx.fill();ctx.fillStyle='#0b0f14';ctx.beginPath();ctx.ellipse(-7,1,3+panic*1.4,4.7*eyeScale+panic*1.7,0,0,6.28);ctx.ellipse(7,1,3+panic*1.4,4.7*eyeScale+panic*1.7,0,0,6.28);ctx.fill();ctx.strokeStyle='#0b0f14';ctx.lineWidth=2;ctx.beginPath();if(panic>.45)ctx.arc(0,9,3.8,0,6.28);else ctx.arc(0,6,6.5,.2,Math.PI-.2);ctx.stroke();ctx.restore()}
function drawSparks(){game.sparks.forEach(s=>{ctx.globalAlpha=Math.max(0,s.life*.85);ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,sy(s.y),s.size*s.life,0,6.28);ctx.fill();ctx.globalAlpha=1})}
function drawButton(x,y,w,h,label,on,color){ctx.fillStyle=on?color:'rgba(17,24,39,.78)';ctx.strokeStyle=on?'rgba(255,255,255,.45)':'rgba(255,255,255,.18)';ctx.lineWidth=1.7;rr(x,y,w,h,18,true,true);ctx.fillStyle=on?'#0b0f14':C.white;ctx.font='800 28px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2+1)}
function controls(){if(!game.running)return;const w=Math.min(100,canvas.width*.15),h=56,e=12,ty=76,by=canvas.height-90;drawButton(e,ty,w,h,'◀',game.input.topLeft,C.top);drawButton(canvas.width-w-e,ty,w,h,'▶',game.input.topRight,C.top);drawButton(e,by,w,h,'◀',game.input.bottomLeft,C.bottom);drawButton(canvas.width-w-e,by,w,h,'▶',game.input.bottomRight,C.bottom)}
function render(){ctx.save();const sx=game.shake?(Math.random()-.5)*game.shake:0,syy=game.shake?(Math.random()-.5)*game.shake:0;ctx.translate(sx,syy);bg();game.platforms.forEach(drawPlatform);game.players.forEach(drawPlayer);drawSparks();controls();ctx.restore()}

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