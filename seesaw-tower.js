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

const C={bg:'#0b0f14',bg2:'#151b23',line:'rgba(235,240,245,.075)',line2:'rgba(235,240,245,.14)',top:'#4fb8d8',bottom:'#e06f8f',board:'#d7dde5',boardDark:'#2b333d',danger:'#d97757',safe:'#8bd3a7',white:'#f8fafc',haz:'#b8b0a8'};
const game={running:false,timer:0,floor:1,targetFloor:1,combo:0,shake:0,camY:0,spawn:0,platforms:[],sparks:[],flyers:[],players:[],input:{topLeft:false,topRight:false,bottomLeft:false,bottomRight:false}};

function resize(){canvas.width=innerWidth;canvas.height=innerHeight}addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rr(x,y,w,h,r,fill=true,stroke=false){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke()}
function sy(y){return y-game.camY}
function baseY(){return canvas.height*.78}
function gap(){return Math.max(122,canvas.height*.20)}
function laneMin(side){return side==='top'?canvas.width*.07:canvas.width*.53}
function laneMax(side){return side==='top'?canvas.width*.47:canvas.width*.93}
function floorY(n){return baseY()-(n-1)*gap()}

function makePlatforms(){const arr=[];for(let i=1;i<=14;i++){arr.push({floor:i,x:canvas.width/2,y:floorY(i),w:canvas.width*.86,tilt:0,tiltV:0,pulse:0,flashSide:null,flash:0,cleared:false})}return arr}
function makePlayer(side){return{side,x:side==='top'?canvas.width*.28:canvas.width*.72,y:floorY(1)-34,vx:0,vy:0,r:21,onFloor:1,grounded:true,airTime:0,hop:.22,wobble:Math.random()*6.28,blink:Math.random()*4,color:side==='top'?C.top:C.bottom}}
function clearInput(){Object.keys(game.input).forEach(k=>game.input[k]=false)}
function resetGame(){Object.assign(game,{running:true,timer:0,floor:1,targetFloor:1,combo:0,shake:0,camY:0,spawn:0,sparks:[],flyers:[]});clearInput();game.platforms=makePlatforms();game.players=[makePlayer('top'),makePlayer('bottom')];startOverlay.classList.add('hidden');endOverlay.classList.add('hidden')}
function spark(x,y,color,n=10){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=35+Math.random()*150;game.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:1.5+Math.random()*3.5,color})}}
function endGame(msg){if(!game.running)return;game.running=false;clearInput();game.shake=10;spark(canvas.width/2,game.camY+canvas.height*.5,C.board,24);resultTitle.textContent='Game Over';resultText.textContent=msg;finalStats.innerHTML=`Floor Reached: ${game.floor}<br>Launch Chain: ${game.combo}<br>Survival Time: ${Math.floor(game.timer)}s`;endOverlay.classList.remove('hidden')}
function winGame(){if(!game.running)return;game.running=false;clearInput();spark(canvas.width/2,game.camY+canvas.height*.42,C.safe,34);resultTitle.textContent='Tower Cleared';resultText.textContent='You both reached the top together.';finalStats.innerHTML=`Floors Cleared: ${game.floor}<br>Launch Chain: ${game.combo}<br>Time: ${Math.floor(game.timer)}s`;endOverlay.classList.remove('hidden')}
function dir(p){return p.side==='top'?(game.input.topRight?1:0)-(game.input.topLeft?1:0):(game.input.bottomRight?1:0)-(game.input.bottomLeft?1:0)}
function pfByFloor(n){return game.platforms[Math.max(0,Math.min(game.platforms.length-1,n-1))]}
function nearestPlatform(p){let best=game.platforms[0],dist=1e9;for(const pf of game.platforms){const d=Math.abs(p.y-(pf.y-30));if(d<dist){dist=d;best=pf}}return best}
function surface(pf,x){const rel=clamp((x-pf.x)/(pf.w/2),-1,1);return pf.y+Math.sin(pf.tilt)*rel*(pf.w/2)-30}
function oppositeSide(a,b,pf){return (a.x<pf.x&&b.x>pf.x)||(a.x>pf.x&&b.x<pf.x)}
function playerFloorFromY(p){return clamp(Math.round((baseY()-p.y)/gap()+1),1,game.platforms.length)}
function spikeActive(floor){if(floor<4||floor%2!==0)return false;return Math.sin(game.timer*1.25+floor*.85)>0.54}
function spikeY(pf){return pf.y-gap()+42}

function assistLaunch(lander,pf,landingSpeed){const side=lander.x<pf.x?'left':'right';const sideSign=side==='left'?-1:1;const strength=clamp(landingSpeed/500,.7,1.7);pf.tiltV+=-sideSign*.46*strength;pf.tilt+=-sideSign*.08*strength;pf.pulse=1;pf.flashSide=side;pf.flash=1;game.shake=Math.max(game.shake,clamp(landingSpeed*.011,3,9));spark(lander.x,pf.y-12,lander.color,11);
  let launched=false;
  for(const other of game.players){if(other===lander)continue;if(!oppositeSide(lander,other,pf))continue;const sameOrLower=other.onFloor<=lander.onFloor+1;const closeHeight=Math.abs(other.y-lander.y)<gap()*1.55;if(!sameOrLower&&!closeHeight)continue;const edge=clamp(Math.abs(other.x-pf.x)/(pf.w/2),.45,1.1);const catchup=other.onFloor<lander.onFloor?1.25:1;const impulse=clamp(560+landingSpeed*.55,620,860)*edge*catchup;other.vy=-impulse;other.grounded=false;other.airTime=0;other.y-=9;game.combo++;launched=true;spark(other.x,other.y,other.color,18)}
  lander.vy=-clamp(245+landingSpeed*.10,285,410);lander.grounded=false;lander.airTime=0;lander.y-=5;if(!launched)game.combo=Math.max(0,game.combo-1)
}
function completeFloors(){const bothFloor=Math.min(game.players[0].onFloor,game.players[1].onFloor);if(bothFloor>game.floor){for(let f=game.floor;f<bothFloor;f++){const pf=pfByFloor(f);pf.cleared=true;spark(pf.x,pf.y,C.safe,18)}game.floor=bothFloor;game.targetFloor=game.floor+1;if(game.floor>=8)winGame()}}
function spawnFlyer(){const fromLeft=Math.random()<.5;const y=game.camY+canvas.height*(.28+Math.random()*.42);game.flyers.push({x:fromLeft?-45:canvas.width+45,y,vx:fromLeft?145+Math.random()*75:-145-Math.random()*75,r:12+Math.random()*8,rot:0})}

function updatePlatforms(dt){for(const pf of game.platforms){pf.tiltV+=(-pf.tilt)*2.2*dt;pf.tiltV*=Math.pow(.86,dt*60);pf.tilt+=pf.tiltV*dt*60;pf.tilt=clamp(pf.tilt,-.52,.52);pf.pulse=Math.max(0,pf.pulse-dt*3.5);pf.flash=Math.max(0,pf.flash-dt*4.2)}}
function updatePlayers(dt){for(const p of game.players){p.airTime+=dt;const d=dir(p);if(d)p.vx+=d*34*dt;p.vx*=Math.pow(.88,dt*60);p.x+=p.vx*dt*60;p.x=clamp(p.x,laneMin(p.side),laneMax(p.side));
  if(p.grounded){p.hop-=dt;if(p.hop<=0){p.vy=-285;p.grounded=false;p.airTime=0;p.hop=.38}}else{p.vy+=880*dt;p.y+=p.vy*dt}
  p.wobble+=(3+Math.abs(p.vx)*.055+Math.abs(p.vy)*.0019)*dt;p.blink+=dt;
  const pf=nearestPlatform(p);const y=surface(pf,p.x);const within=Math.abs(p.x-pf.x)<pf.w/2-20;const falling=p.vy>=0;const close=p.y>=y-34&&p.y<=y+42;
  if(!p.grounded&&falling&&within&&close){const speed=p.vy;p.y=y;p.vy=0;p.grounded=true;p.onFloor=pf.floor;p.hop=.18;if(p.airTime>.08&&speed>115)assistLaunch(p,pf,speed);p.airTime=0}
  p.onFloor=Math.max(p.onFloor,playerFloorFromY(p));
  if(spikeActive(pf.floor)&&p.vy<0&&p.y-p.r<spikeY(pf)&&pf.floor>=4){spark(p.x,p.y,C.danger,20);endGame(`${p.side==='top'?'Blue':'Rose'} hit active spikes.`)}
  if(p.y-game.camY>canvas.height+125)endGame(`${p.side==='top'?'Blue':'Rose'} fell too far.`)
}
  completeFloors();
  const focusY=Math.min(game.players[0].y,game.players[1].y);const lowerY=Math.max(game.players[0].y,game.players[1].y);game.camY+=(focusY-canvas.height*.46-game.camY)*.04;if(lowerY-game.camY>canvas.height*.84)game.camY+=(lowerY-canvas.height*.78-game.camY)*.03
}
function updateFlyers(dt){if(game.floor>=5){game.spawn+=dt;if(game.spawn>Math.max(1.9,4.0-game.floor*.12)){game.spawn=0;spawnFlyer()}}for(let i=game.flyers.length-1;i>=0;i--){const f=game.flyers[i];f.x+=f.vx*dt;f.rot+=dt*4;for(const p of game.players){if(Math.hypot(f.x-p.x,f.y-p.y)<f.r+p.r-5){spark(p.x,p.y,C.haz,16);endGame(`${p.side==='top'?'Blue':'Rose'} got clipped.`);return}}if(f.x<-90||f.x>canvas.width+90)game.flyers.splice(i,1)}}
function updateSparks(dt){for(let i=game.sparks.length-1;i>=0;i--){const s=game.sparks[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=165*dt;s.life-=dt*2.1;if(s.life<=0)game.sparks.splice(i,1)}}
function update(dt){if(game.running){game.timer+=dt;updatePlatforms(dt);updatePlayers(dt);updateFlyers(dt);timeText.textContent=`${Math.floor(game.timer)}s`;stressText.textContent=`${Math.min(100,Math.floor(Math.max(...game.platforms.map(p=>Math.abs(p.tilt)))/.52*100))}%`;fallText.textContent=`${game.floor}/8`;holdText.textContent=`${Math.max(1,game.combo).toFixed(0)}x`}updateSparks(dt);game.shake=Math.max(0,game.shake-dt*20)}

function bg(){const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,C.bg);g.addColorStop(.55,C.bg2);g.addColorStop(1,'#080b10');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=C.line;ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}for(let y=(-game.camY*.18)%64;y<canvas.height;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}ctx.strokeStyle=C.line2;ctx.beginPath();ctx.moveTo(canvas.width/2,0);ctx.lineTo(canvas.width/2,canvas.height);ctx.stroke()}
function drawSpikes(pf){if(!spikeActive(pf.floor))return;const y=sy(spikeY(pf));if(y<-30||y>canvas.height+35)return;ctx.fillStyle='rgba(217,119,87,.82)';const count=5,span=pf.w*.54,start=pf.x-span/2;for(let k=0;k<count;k++){const x=start+k*(span/(count-1));ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.lineTo(x,y+20);ctx.closePath();ctx.fill()}}
function drawPlatform(pf){const y=sy(pf.y);if(y<-100||y>canvas.height+115)return;drawSpikes(pf);ctx.save();ctx.translate(pf.x,y);ctx.rotate(pf.tilt);ctx.shadowColor='rgba(0,0,0,.32)';ctx.shadowBlur=15+pf.pulse*9;ctx.shadowOffsetY=8;ctx.fillStyle=C.boardDark;rr(-pf.w/2,-7-pf.pulse*3,pf.w,14+pf.pulse*6,7);const grad=ctx.createLinearGradient(-pf.w/2,0,pf.w/2,0);grad.addColorStop(0,C.top);grad.addColorStop(.5,pf.cleared?C.safe:C.board);grad.addColorStop(1,C.bottom);ctx.fillStyle=grad;rr(-pf.w/2,-2.5,pf.w,5,2.5);if(pf.flash>0){ctx.globalAlpha=pf.flash*.42;ctx.fillStyle=pf.flashSide==='left'?C.top:C.bottom;rr(pf.flashSide==='left'?-pf.w/2:0,-9,pf.w/2,18,8);ctx.globalAlpha=1}ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(0,0,4,0,6.28);ctx.fill();ctx.restore();ctx.fillStyle=pf.floor===game.targetFloor?'rgba(139,211,167,.9)':'rgba(248,250,252,.36)';ctx.font='800 12px Arial';ctx.textAlign='center';ctx.fillText(`F${pf.floor}`,pf.x,y-20)}
function drawPlayer(p){const y=sy(p.y);const pulse=1+Math.sin(p.wobble)*.025,panic=Math.min(1,Math.abs(p.vy)/850),eyeScale=Math.sin(p.blink*3)>.985?.15:1;ctx.save();ctx.translate(p.x,y+Math.sin(p.wobble)*.7);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,p.r+9,p.r*.78,5,0,0,6.28);ctx.fill();ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r*pulse,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.32)';ctx.lineWidth=1.7;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.34)';ctx.beginPath();ctx.arc(-7,-8,5,0,6.28);ctx.fill();ctx.fillStyle='#0b0f14';ctx.beginPath();ctx.ellipse(-7,1,3+panic*1.3,4.7*eyeScale+panic*1.6,0,0,6.28);ctx.ellipse(7,1,3+panic*1.3,4.7*eyeScale+panic*1.6,0,0,6.28);ctx.fill();ctx.strokeStyle='#0b0f14';ctx.lineWidth=2;ctx.beginPath();if(panic>.44)ctx.arc(0,9,3.8,0,6.28);else ctx.arc(0,6,6.5,.2,Math.PI-.2);ctx.stroke();ctx.restore()}
function drawFlyers(){for(const f of game.flyers){ctx.save();ctx.translate(f.x,sy(f.y));ctx.rotate(f.rot);ctx.fillStyle=C.haz;ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=1.5;ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=10;rr(-f.r*1.4,-f.r*.55,f.r*2.8,f.r*1.1,6,true,true);ctx.restore()}}
function drawSparks(){for(const s of game.sparks){ctx.globalAlpha=Math.max(0,s.life*.85);ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,sy(s.y),s.size*s.life,0,6.28);ctx.fill();ctx.globalAlpha=1}}
function drawButton(x,y,w,h,label,on,color){ctx.fillStyle=on?color:'rgba(17,24,39,.78)';ctx.strokeStyle=on?'rgba(255,255,255,.45)':'rgba(255,255,255,.18)';ctx.lineWidth=1.7;rr(x,y,w,h,18,true,true);ctx.fillStyle=on?'#0b0f14':C.white;ctx.font='800 28px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2+1)}
function controls(){if(!game.running)return;const w=Math.min(100,canvas.width*.15),h=56,e=12,ty=76,by=canvas.height-90;drawButton(e,ty,w,h,'◀',game.input.topLeft,C.top);drawButton(canvas.width-w-e,ty,w,h,'▶',game.input.topRight,C.top);drawButton(e,by,w,h,'◀',game.input.bottomLeft,C.bottom);drawButton(canvas.width-w-e,by,w,h,'▶',game.input.bottomRight,C.bottom)}
function render(){ctx.save();const sx=game.shake?(Math.random()-.5)*game.shake:0,syy=game.shake?(Math.random()-.5)*game.shake:0;ctx.translate(sx,syy);bg();for(const pf of game.platforms)drawPlatform(pf);drawFlyers();for(const p of game.players)drawPlayer(p);drawSparks();controls();ctx.restore()}

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