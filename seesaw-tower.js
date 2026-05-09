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

const C={bg:'#0b0f14',bg2:'#151b23',line:'rgba(235,240,245,.075)',line2:'rgba(235,240,245,.14)',top:'#4fb8d8',bottom:'#e06f8f',white:'#f8fafc',haz:'#b8b0a8',danger:'#d97757',low:'#8bd3a7',mid:'#d7dde5',high:'#f0b86e',super:'#b78cff'};
const TYPES={low:{color:C.low,power:520,label:'LOW'},mid:{color:C.mid,power:680,label:'MID'},high:{color:C.high,power:850,label:'HIGH'},super:{color:C.super,power:1040,label:'BOOST'}};
const game={running:false,timer:0,height:0,combo:0,shake:0,camY:0,spawn:0,platforms:[],sparks:[],flyers:[],players:[],input:{topLeft:false,topRight:false,bottomLeft:false,bottomRight:false}};

function resize(){canvas.width=innerWidth;canvas.height=innerHeight}addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rr(x,y,w,h,r,fill=true,stroke=false){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke()}
function sy(y){return y-game.camY}
function startY(){return canvas.height*.76}
function highestY(){return Math.min(game.players[0].y,game.players[1].y)}

function makePlayer(side){return{side,x:side==='top'?canvas.width*.38:canvas.width*.62,y:startY()-40,vx:0,vy:0,r:21,wobble:Math.random()*6.28,blink:Math.random()*4,color:side==='top'?C.top:C.bottom}}
function platformType(i){const r=Math.random();if(i<5)return r<.65?'mid':'low';if(r<.18)return'low';if(r<.68)return'mid';if(r<.92)return'high';return'super'}
function addPlatform(x,y,type,w=92){game.platforms.push({x,y,w,h:14,type,used:false,fade:1,pulse:0})}
function makePlatforms(){game.platforms=[];addPlatform(canvas.width*.38,startY()+26,'mid',112);addPlatform(canvas.width*.62,startY()+26,'mid',112);for(let i=1;i<44;i++){const y=startY()-i*86;const count=i<5?2:(Math.random()<.25?1:2);for(let c=0;c<count;c++){const x=count===1?canvas.width*(.22+Math.random()*.56):(c===0?canvas.width*(.13+Math.random()*.30):canvas.width*(.57+Math.random()*.30));addPlatform(x,y,platformType(i),78+Math.random()*36)}}}
function clearInput(){Object.keys(game.input).forEach(k=>game.input[k]=false)}
function resetGame(){Object.assign(game,{running:true,timer:0,height:0,combo:0,shake:0,camY:0,spawn:0,sparks:[],flyers:[]});clearInput();makePlatforms();game.players=[makePlayer('top'),makePlayer('bottom')];startOverlay.classList.add('hidden');endOverlay.classList.add('hidden')}
function spark(x,y,color,n=10){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=35+Math.random()*150;game.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:1.5+Math.random()*3.5,color})}}
function endGame(msg){if(!game.running)return;game.running=false;clearInput();game.shake=10;spark(canvas.width/2,game.camY+canvas.height*.5,C.white,26);resultTitle.textContent='Game Over';resultText.textContent=msg;finalStats.innerHTML=`Height: ${game.height}<br>Bounce Chain: ${game.combo}<br>Survival Time: ${Math.floor(game.timer)}s`;endOverlay.classList.remove('hidden')}
function dir(p){return p.side==='top'?(game.input.topRight?1:0)-(game.input.topLeft?1:0):(game.input.bottomRight?1:0)-(game.input.bottomLeft?1:0)}
function spawnFlyer(){const fromLeft=Math.random()<.5;const y=game.camY+canvas.height*(.22+Math.random()*.48);game.flyers.push({x:fromLeft?-50:canvas.width+50,y,vx:fromLeft?155+Math.random()*80:-155-Math.random()*80,r:12+Math.random()*9,rot:0})}
function bouncePlayer(p,plat){const type=TYPES[plat.type];p.vy=-type.power;p.y=plat.y-plat.h/2-p.r-2;game.combo++;plat.used=true;plat.pulse=1;game.shake=Math.max(game.shake,plat.type==='super'?9:plat.type==='high'?6:4);spark(p.x,plat.y,type.color,plat.type==='super'?22:14)}
function updatePlayers(dt){for(const p of game.players){const d=dir(p);if(d)p.vx+=d*38*dt;p.vx*=Math.pow(.9,dt*60);p.x+=p.vx*dt*60;p.x=clamp(p.x,p.r+8,canvas.width-p.r-8);p.vy+=920*dt;p.y+=p.vy*dt;p.wobble+=(3+Math.abs(p.vx)*.06+Math.abs(p.vy)*.0018)*dt;p.blink+=dt;if(p.vy>0){for(const plat of game.platforms){if(plat.used)continue;const top=plat.y-plat.h/2;const prevY=p.y-p.vy*dt;const wasAbove=prevY+p.r<=top+8;const withinX=Math.abs(p.x-plat.x)<plat.w/2+p.r*.55;const crossing=p.y+p.r>=top&&p.y+p.r<=top+30;if(wasAbove&&withinX&&crossing){bouncePlayer(p,plat);break}}}if(p.y-game.camY>canvas.height+130)endGame(`${p.side==='top'?'Blue':'Rose'} fell below the screen.`)}}
function updatePlatforms(dt){for(let i=game.platforms.length-1;i>=0;i--){const p=game.platforms[i];if(p.used)p.fade-=dt*1.8;p.pulse=Math.max(0,p.pulse-dt*4);if(p.fade<=0)game.platforms.splice(i,1)}const topY=game.camY-280;let highestPlat=Math.min(...game.platforms.map(p=>p.y));while(highestPlat>topY){highestPlat-=82;const count=Math.random()<.3?1:2;const index=Math.floor((startY()-highestPlat)/86);for(let c=0;c<count;c++){const x=count===1?canvas.width*(.18+Math.random()*.64):(c===0?canvas.width*(.13+Math.random()*.28):canvas.width*(.59+Math.random()*.28));addPlatform(x,highestPlat,platformType(index),76+Math.random()*36)}}}
function updateFlyers(dt){if(game.height>=10){game.spawn+=dt;if(game.spawn>Math.max(1.7,3.8-game.height*.025)){game.spawn=0;spawnFlyer()}}for(let i=game.flyers.length-1;i>=0;i--){const f=game.flyers[i];f.x+=f.vx*dt;f.rot+=dt*4;for(const p of game.players){if(Math.hypot(f.x-p.x,f.y-p.y)<f.r+p.r-5){spark(p.x,p.y,C.haz,16);endGame(`${p.side==='top'?'Blue':'Rose'} got clipped.`);return}}if(f.x<-100||f.x>canvas.width+100)game.flyers.splice(i,1)}}
function updateSparks(dt){for(let i=game.sparks.length-1;i>=0;i--){const s=game.sparks[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=160*dt;s.life-=dt*2.1;if(s.life<=0)game.sparks.splice(i,1)}}
function update(dt){if(game.running){game.timer+=dt;updatePlayers(dt);const focus=highestY();game.camY+=(focus-canvas.height*.44-game.camY)*.05;updatePlatforms(dt);updateFlyers(dt);game.height=Math.max(game.height,Math.floor((startY()-highestY())/70));timeText.textContent=`${Math.floor(game.timer)}s`;stressText.textContent=`${game.platforms.length}`;fallText.textContent=game.height;holdText.textContent=`${Math.max(1,game.combo).toFixed(0)}x`}updateSparks(dt);game.shake=Math.max(0,game.shake-dt*20)}

function bg(){const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,C.bg);g.addColorStop(.55,C.bg2);g.addColorStop(1,'#080b10');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=C.line;ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}for(let y=(-game.camY*.18)%64;y<canvas.height;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}ctx.strokeStyle=C.line2;ctx.beginPath();ctx.moveTo(canvas.width/2,0);ctx.lineTo(canvas.width/2,canvas.height);ctx.stroke()}
function drawPlatform(p){const y=sy(p.y);if(y<-80||y>canvas.height+80)return;const t=TYPES[p.type];ctx.save();ctx.globalAlpha=Math.max(0,p.fade);ctx.translate(p.x,y);ctx.shadowColor='rgba(0,0,0,.34)';ctx.shadowBlur=12+p.pulse*10;ctx.shadowOffsetY=7;ctx.fillStyle='rgba(17,24,39,.96)';rr(-p.w/2,-p.h/2-p.pulse*3,p.w,p.h+p.pulse*6,7);ctx.shadowBlur=0;ctx.fillStyle=t.color;rr(-p.w/2+4,-3,p.w-8,6,3);ctx.fillStyle='rgba(11,15,20,.72)';ctx.font='800 9px Arial';ctx.textAlign='center';ctx.fillText(t.label,0,3);ctx.restore()}
function drawPlayer(p){const y=sy(p.y);const pulse=1+Math.sin(p.wobble)*.025,panic=Math.min(1,Math.abs(p.vy)/900),eyeScale=Math.sin(p.blink*3)>.985?.15:1;ctx.save();ctx.translate(p.x,y+Math.sin(p.wobble)*.7);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,p.r+9,p.r*.78,5,0,0,6.28);ctx.fill();ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r*pulse,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.32)';ctx.lineWidth=1.7;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.34)';ctx.beginPath();ctx.arc(-7,-8,5,0,6.28);ctx.fill();ctx.fillStyle='#0b0f14';ctx.beginPath();ctx.ellipse(-7,1,3+panic*1.3,4.7*eyeScale+panic*1.6,0,0,6.28);ctx.ellipse(7,1,3+panic*1.3,4.7*eyeScale+panic*1.6,0,0,6.28);ctx.fill();ctx.strokeStyle='#0b0f14';ctx.lineWidth=2;ctx.beginPath();if(panic>.44)ctx.arc(0,9,3.8,0,6.28);else ctx.arc(0,6,6.5,.2,Math.PI-.2);ctx.stroke();ctx.restore()}
function drawFlyers(){for(const f of game.flyers){ctx.save();ctx.translate(f.x,sy(f.y));ctx.rotate(f.rot);ctx.fillStyle=C.haz;ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=1.5;ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=10;rr(-f.r*1.4,-f.r*.55,f.r*2.8,f.r*1.1,6,true,true);ctx.restore()}}
function drawSparks(){for(const s of game.sparks){ctx.globalAlpha=Math.max(0,s.life*.85);ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,sy(s.y),s.size*s.life,0,6.28);ctx.fill();ctx.globalAlpha=1}}
function drawButton(x,y,w,h,label,on,color){ctx.fillStyle=on?color:'rgba(17,24,39,.78)';ctx.strokeStyle=on?'rgba(255,255,255,.45)':'rgba(255,255,255,.18)';ctx.lineWidth=1.7;rr(x,y,w,h,18,true,true);ctx.fillStyle=on?'#0b0f14':C.white;ctx.font='800 28px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2+1)}
function controls(){if(!game.running)return;const w=Math.min(100,canvas.width*.15),h=56,e=12,ty=76,by=canvas.height-90;drawButton(e,ty,w,h,'◀',game.input.topLeft,C.top);drawButton(canvas.width-w-e,ty,w,h,'▶',game.input.topRight,C.top);drawButton(e,by,w,h,'◀',game.input.bottomLeft,C.bottom);drawButton(canvas.width-w-e,by,w,h,'▶',game.input.bottomRight,C.bottom)}
function render(){ctx.save();const sx=game.shake?(Math.random()-.5)*game.shake:0,syy=game.shake?(Math.random()-.5)*game.shake:0;ctx.translate(sx,syy);bg();for(const p of game.platforms)drawPlatform(p);drawFlyers();for(const p of game.players)drawPlayer(p);drawSparks();controls();ctx.restore()}

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