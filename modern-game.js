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

const C={bg:'#0b0f14',bg2:'#141a22',line:'rgba(235,240,245,.08)',line2:'rgba(235,240,245,.16)',top:'#4fb8d8',bottom:'#e06f8f',topInk:'#0f3442',bottomInk:'#4d1f2d',board:'#d7dde5',boardDark:'#2b333d',danger:'#d97757',white:'#f8fafc',muted:'#94a3b8',haz:['#d4d4d8','#a8a29e','#cbd5e1','#b8b0a8']};
const game={running:false,timer:0,difficulty:1,score:0,tilt:0,tiltV:0,imbalance:0,spawn:0,shake:0,hazards:[],sparks:[],players:[],input:{topLeft:false,topRight:false,bottomLeft:false,bottomRight:false}};

function resize(){canvas.width=innerWidth;canvas.height=innerHeight}addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const boardY=()=>canvas.height*.61;
const half=()=>canvas.width*.54;
const visibleHalf=()=>canvas.width*.49;
const leftEdge=()=>canvas.width/2-visibleHalf();
const rightEdge=()=>canvas.width/2+visibleHalf();

function player(side){return{side,x:side==='top'?canvas.width*.26:canvas.width*.74,y:canvas.height*.52,vx:0,r:22,wobble:Math.random()*6.28,blink:Math.random()*4,color:side==='top'?C.top:C.bottom,ink:side==='top'?C.topInk:C.bottomInk}}
function clearInput(){Object.keys(game.input).forEach(k=>game.input[k]=false)}
function resetGame(){Object.assign(game,{running:true,timer:0,difficulty:1,score:0,tilt:0,tiltV:0,imbalance:0,spawn:0,shake:0,hazards:[],sparks:[]});clearInput();game.players=[player('top'),player('bottom')];startOverlay.classList.add('hidden');endOverlay.classList.add('hidden')}
function endGame(msg){if(!game.running)return;game.running=false;clearInput();game.shake=8;spark(canvas.width/2,boardY(),C.board,20);resultTitle.textContent='Game Over';resultText.textContent=msg;finalStats.innerHTML=`Survival Time: ${Math.floor(game.timer)}s<br>Difficulty: ${game.difficulty.toFixed(1)}x<br>Objects Dodged: ${game.score}`;endOverlay.classList.remove('hidden')}
function spark(x,y,color,n=8){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=35+Math.random()*120;game.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:1.5+Math.random()*3,color})}}
function spawnHazard(){const lane=Math.random()<.5?'top':'bottom';const minX=lane==='top'?leftEdge()+42:canvas.width/2+28;const maxX=lane==='top'?canvas.width/2-28:rightEdge()-42;const types=['disc','pill','diamond','slab'];game.hazards.push({type:types[Math.floor(Math.random()*types.length)],x:minX+Math.random()*Math.max(1,maxX-minX),y:-46,vy:3.25+Math.random()*1.9+game.difficulty*.52,r:14+Math.random()*12,rot:Math.random()*6.28,spin:-.045+Math.random()*.09,color:C.haz[Math.floor(Math.random()*C.haz.length)]})}
function dir(p){return p.side==='top'?(game.input.topRight?1:0)-(game.input.topLeft?1:0):(game.input.bottomRight?1:0)-(game.input.bottomLeft?1:0)}

function updatePlayers(dt){game.players.forEach(p=>{const d=dir(p);if(d)p.vx+=d*26*dt;p.vx*=Math.pow(.84,dt*60);p.x+=p.vx*dt*60;p.wobble+=(2.8+Math.abs(p.vx)*.06)*dt;p.blink+=dt;const min=p.side==='top'?leftEdge()+42:canvas.width/2+20;const max=p.side==='top'?canvas.width/2-20:rightEdge()-42;p.x=clamp(p.x,min,max)})}
function updateTilt(dt){const c=canvas.width/2,a=(c-game.players[0].x)/visibleHalf(),b=(game.players[1].x-c)/visibleHalf(),target=(b-a)*.72;game.tiltV+=(target-game.tilt)*2.7*dt;game.tiltV*=Math.pow(.94,dt*60);game.tilt+=game.tiltV*dt*60;game.tilt+=Math.sin(game.timer*.8)*.00018*game.difficulty;const danger=Math.max(0,Math.abs(game.tilt)-.23);game.imbalance+=danger*dt*3.8;game.imbalance=Math.max(0,game.imbalance-dt*.48);if(danger>.05)game.shake=Math.max(game.shake,danger*8);if(Math.abs(game.tilt)>.42||game.imbalance>1)endGame('The platform lost balance.')}
function updateHazards(dt){game.spawn+=dt;const rate=Math.max(.48,1.45-game.difficulty*.07);if(game.spawn>=rate){game.spawn=0;spawnHazard()}for(let i=game.hazards.length-1;i>=0;i--){const h=game.hazards[i];h.y+=h.vy*dt*60;h.rot+=h.spin*dt*60;for(const p of game.players){const dx=h.x-p.x,dy=h.y-p.y;if(Math.hypot(dx,dy)<h.r+p.r-7){spark(p.x,p.y,p.color,18);endGame(`${p.side==='top'?'Top':'Bottom'} player was hit.`);return}}if(h.y>canvas.height+70){spark(h.x,canvas.height-20,h.color,3);game.hazards.splice(i,1);game.score++}}}
function updateSparks(dt){for(let i=game.sparks.length-1;i>=0;i--){const s=game.sparks[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=170*dt;s.life-=dt*2.1;if(s.life<=0)game.sparks.splice(i,1)}}
function update(dt){if(game.running){game.timer+=dt;game.difficulty+=dt*.026;updatePlayers(dt);updateTilt(dt);updateHazards(dt);timeText.textContent=`${Math.floor(game.timer)}s`;stressText.textContent=`${Math.min(100,Math.floor(Math.max(Math.abs(game.tilt)/.42,game.imbalance)*100))}%`;fallText.textContent=game.score;holdText.textContent=`${game.difficulty.toFixed(1)}x`}updateSparks(dt);game.shake=Math.max(0,game.shake-dt*18)}

function rr(x,y,w,h,r,fill=true,stroke=false){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke()}
function bg(){const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,C.bg);g.addColorStop(.52,C.bg2);g.addColorStop(1,'#090d12');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=C.line;ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}for(let y=0;y<canvas.height;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}ctx.strokeStyle=C.line2;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(canvas.width/2,0);ctx.lineTo(canvas.width/2,canvas.height);ctx.stroke()}
function drawBoard(){const x=canvas.width/2,y=boardY(),danger=Math.min(1,Math.max(Math.abs(game.tilt)/.42,game.imbalance));ctx.save();ctx.translate(x,y);ctx.rotate(game.tilt);ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=18;ctx.shadowOffsetY=10;ctx.fillStyle=C.boardDark;rr(-half(),-8,half()*2,16,8);const grad=ctx.createLinearGradient(-half(),0,half(),0);grad.addColorStop(0,C.top);grad.addColorStop(.5,danger>.65?C.danger:C.board);grad.addColorStop(1,C.bottom);ctx.fillStyle=grad;rr(-half(),-2.5,half()*2,5,2.5);ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.72)';ctx.beginPath();ctx.arc(0,0,4,0,6.28);ctx.fill();ctx.restore();ctx.strokeStyle='rgba(203,213,225,.32)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x-22,y+72);ctx.lineTo(x+22,y+72);ctx.closePath();ctx.stroke()}
function drawPlayer(p){const local=p.x-canvas.width/2;p.y=boardY()+Math.sin(game.tilt)*local-30;const pulse=1+Math.sin(p.wobble)*.02,panic=Math.min(1,game.imbalance+Math.max(0,Math.abs(game.tilt)-.2)*3),eyeScale=Math.sin(p.blink*3)>.985?.15:1;ctx.save();ctx.translate(p.x,p.y+Math.sin(p.wobble)*.8);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,p.r+9,p.r*.78,5,0,0,6.28);ctx.fill();ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r*pulse,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.32)';ctx.lineWidth=1.7;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.34)';ctx.beginPath();ctx.arc(-7,-8,5,0,6.28);ctx.fill();ctx.fillStyle='#0b0f14';ctx.beginPath();ctx.ellipse(-7,1,3+panic*1.4,4.7*eyeScale+panic*1.7,0,0,6.28);ctx.ellipse(7,1,3+panic*1.4,4.7*eyeScale+panic*1.7,0,0,6.28);ctx.fill();ctx.strokeStyle='#0b0f14';ctx.lineWidth=2;ctx.beginPath();if(panic>.4)ctx.arc(0,9,3.8,0,6.28);else ctx.arc(0,6,6.5,.2,Math.PI-.2);ctx.stroke();ctx.restore()}
function drawHazards(){game.hazards.forEach(h=>{ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.rot);ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=12;ctx.shadowOffsetY=6;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.fillStyle=h.color;ctx.lineWidth=1.5;if(h.type==='disc'){ctx.beginPath();ctx.arc(0,0,h.r,0,6.28);ctx.fill();ctx.stroke()}else if(h.type==='pill')rr(-h.r*.62,-h.r*1.1,h.r*1.24,h.r*2.2,h.r*.62,true,true);else if(h.type==='diamond'){ctx.beginPath();ctx.moveTo(0,-h.r*1.15);ctx.lineTo(h.r*1.15,0);ctx.lineTo(0,h.r*1.15);ctx.lineTo(-h.r*1.15,0);ctx.closePath();ctx.fill();ctx.stroke()}else rr(-h.r*1.18,-h.r*.42,h.r*2.36,h.r*.84,5,true,true);ctx.restore()})}
function drawSparks(){game.sparks.forEach(s=>{ctx.globalAlpha=Math.max(0,s.life*.85);ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,s.y,s.size*s.life,0,6.28);ctx.fill();ctx.globalAlpha=1})}
function drawButton(x,y,w,h,label,on,color){ctx.fillStyle=on?color:'rgba(17,24,39,.78)';ctx.strokeStyle=on?'rgba(255,255,255,.45)':'rgba(255,255,255,.18)';ctx.lineWidth=1.7;rr(x,y,w,h,18,true,true);ctx.fillStyle=on?'#0b0f14':C.white;ctx.font='800 28px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2+1)}
function controls(){if(!game.running)return;const w=Math.min(100,canvas.width*.15),h=56,e=12,ty=76,by=canvas.height-90;drawButton(e,ty,w,h,'◀',game.input.topLeft,C.top);drawButton(canvas.width-w-e,ty,w,h,'▶',game.input.topRight,C.top);drawButton(e,by,w,h,'◀',game.input.bottomLeft,C.bottom);drawButton(canvas.width-w-e,by,w,h,'▶',game.input.bottomRight,C.bottom)}
function render(){ctx.save();const sx=game.shake?(Math.random()-.5)*game.shake:0,sy=game.shake?(Math.random()-.5)*game.shake:0;ctx.translate(sx,sy);bg();drawHazards();drawBoard();game.players.forEach(drawPlayer);drawSparks();controls();ctx.restore()}

let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function visibleOverlay(){return!startOverlay.classList.contains('hidden')||!endOverlay.classList.contains('hidden')}
function start(e){e.preventDefault();e.stopPropagation();resetGame()}
[startOverlay,endOverlay,startButton,restartButton].forEach(el=>{el.addEventListener('touchstart',start,{passive:false});el.addEventListener('pointerdown',start);el.addEventListener('click',start)});
function setTouch(t,on){const top=t.clientY<canvas.height/2,left=t.clientX<canvas.width/2;if(top){if(left)game.input.topLeft=on;else game.input.topRight=on}else{if(left)game.input.bottomLeft=on;else game.input.bottomRight=on}}
document.addEventListener('touchstart',e=>{if(visibleOverlay())return;e.preventDefault();for(const t of e.changedTouches)setTouch(t,true)},{passive:false});
document.addEventListener('touchmove',e=>{if(!visibleOverlay())e.preventDefault()},{passive:false});
document.addEventListener('touchend',e=>{if(visibleOverlay())return;e.preventDefault();for(const t of e.changedTouches)setTouch(t,false)},{passive:false});
document.addEventListener('touchcancel',e=>{if(visibleOverlay())return;e.preventDefault();for(const t of e.changedTouches)setTouch(t,false)},{passive:false});
render();