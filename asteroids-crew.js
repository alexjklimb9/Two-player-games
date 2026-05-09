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

const C={bg:'#0b0f14',bg2:'#151b23',line:'rgba(235,240,245,.075)',line2:'rgba(235,240,245,.14)',blue:'#4fb8d8',rose:'#e06f8f',white:'#f8fafc',rock:'#a8a29e',danger:'#d97757',green:'#8bd3a7',gold:'#f0b86e',purple:'#b78cff'};
const WEAPONS=[
  {name:'Pulse',color:C.blue,ammoMax:10,ammo:10,reload:0.55,timer:0,cooldown:0.16,cd:0,speed:620,damage:1,spread:0,count:1,label:'fast'},
  {name:'Scatter',color:C.rose,ammoMax:5,ammo:5,reload:0.95,timer:0,cooldown:0.38,cd:0,speed:520,damage:1,spread:0.28,count:3,label:'wide'},
  {name:'Rail',color:C.gold,ammoMax:3,ammo:3,reload:1.45,timer:0,cooldown:0.62,cd:0,speed:900,damage:3,spread:0,count:1,label:'pierce'},
  {name:'Shield',color:C.green,ammoMax:2,ammo:2,reload:2.4,timer:0,cooldown:0.75,cd:0,speed:0,damage:0,spread:0,count:0,label:'bubble'}
];
const game={running:false,timer:0,score:0,hits:0,shake:0,spawn:0,angle:-Math.PI/2,shipV:0,weapon:0,shield:0,stars:[],rocks:[],shots:[],sparks:[],domControls:null,input:{topLeft:false,topRight:false,bottomLeft:false,bottomRight:false}};

function resize(){canvas.width=innerWidth;canvas.height=innerHeight;makeStars()}addEventListener('resize',resize);resize();
function makeStars(){game.stars=[];for(let i=0;i<80;i++)game.stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.8+.4,a:.25+Math.random()*.55})}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function clearInput(){Object.keys(game.input).forEach(k=>game.input[k]=false);updateDomButtons()}
function resetWeapons(){WEAPONS.forEach(w=>{w.ammo=w.ammoMax;w.timer=0;w.cd=0})}
function resetGame(){Object.assign(game,{running:true,timer:0,score:0,hits:0,shake:0,spawn:.85,angle:-Math.PI/2,shipV:0,weapon:0,shield:0,rocks:[],shots:[],sparks:[]});clearInput();resetWeapons();makeStars();startOverlay.classList.add('hidden');endOverlay.classList.add('hidden');showDomControls(true);spawnRock();setTimeout(()=>{if(game.running)spawnRock()},450)}
function endGame(msg){if(!game.running)return;game.running=false;clearInput();showDomControls(false);game.shake=12;spark(canvas.width/2,canvas.height/2,C.danger,34);resultTitle.textContent='Game Over';resultText.textContent=msg;finalStats.innerHTML=`Survival Time: ${Math.floor(game.timer)}s<br>Asteroids Broken: ${game.score}<br>Hull Hits: ${game.hits}/3`;endOverlay.classList.remove('hidden')}
function spark(x,y,color,n=10){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=50+Math.random()*190;game.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:1.5+Math.random()*3.8,color})}}
function cx(){return canvas.width/2}function cy(){return canvas.height/2}
function spawnRock(){const side=Math.floor(Math.random()*4);let x,y;if(side===0){x=-40;y=Math.random()*canvas.height}else if(side===1){x=canvas.width+40;y=Math.random()*canvas.height}else if(side===2){x=Math.random()*canvas.width;y=-40}else{x=Math.random()*canvas.width;y=canvas.height+40}const dx=cx()-x,dy=cy()-y,a=Math.atan2(dy,dx)+(-.45+Math.random()*.9);const sp=42+Math.random()*38+game.timer*1.2;const r=18+Math.random()*22;game.rocks.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r,hp:Math.ceil(r/17),rot:Math.random()*6.28,spin:-1+Math.random()*2})}
function selectWeapon(dir){game.weapon=(game.weapon+dir+WEAPONS.length)%WEAPONS.length;spark(cx(),cy(),WEAPONS[game.weapon].color,8)}
function fire(){const w=WEAPONS[game.weapon];if(w.cd>0||w.ammo<=0)return;w.cd=w.cooldown;w.ammo--;if(w.name==='Shield'){game.shield=2.6;spark(cx(),cy(),w.color,24);return}for(let i=0;i<w.count;i++){const off=w.count===1?0:(i-1)*w.spread;const a=game.angle+off;game.shots.push({x:cx()+Math.cos(a)*28,y:cy()+Math.sin(a)*28,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,life:1.15,r:w.name==='Rail'?4:3,damage:w.damage,pierce:w.name==='Rail'?2:0,color:w.color})}spark(cx()+Math.cos(game.angle)*30,cy()+Math.sin(game.angle)*30,w.color,5)}
function updateWeapons(dt){for(const w of WEAPONS){w.cd=Math.max(0,w.cd-dt);if(w.ammo<w.ammoMax){w.timer+=dt;if(w.timer>=w.reload){w.timer=0;w.ammo++}}else w.timer=0}if(game.shield>0)game.shield-=dt}
function updateShip(dt){if(game.input.topLeft)game.shipV-=220*dt;if(game.input.topRight)game.shipV+=220*dt;game.shipV*=Math.pow(.92,dt*60);if(game.input.bottomLeft)game.angle-=3.1*dt;if(game.input.bottomRight){game.angle+=3.1*dt;fire()}}
function updateRocks(dt){game.spawn+=dt;const rate=Math.max(.42,1.15-game.timer*.012);if(game.spawn>rate){game.spawn=0;spawnRock()}for(let i=game.rocks.length-1;i>=0;i--){const r=game.rocks[i];r.x+=r.vx*dt;r.y+=r.vy*dt;r.rot+=r.spin*dt;const toShip=Math.hypot(r.x-cx(),r.y-cy());if(toShip<r.r+20){if(game.shield>0){spark(r.x,r.y,C.green,18);game.rocks.splice(i,1);game.score++;continue}game.hits++;spark(cx(),cy(),C.danger,22);game.shake=10;game.rocks.splice(i,1);if(game.hits>=3)endGame('The ship took too many hits.');continue}if(r.x<-90||r.x>canvas.width+90||r.y<-90||r.y>canvas.height+90)game.rocks.splice(i,1)}}
function updateShots(dt){for(let i=game.shots.length-1;i>=0;i--){const s=game.shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;let remove=s.life<=0||s.x<-40||s.x>canvas.width+40||s.y<-40||s.y>canvas.height+40;for(let j=game.rocks.length-1;j>=0&&!remove;j--){const r=game.rocks[j];if(Math.hypot(s.x-r.x,s.y-r.y)<s.r+r.r){r.hp-=s.damage;spark(s.x,s.y,s.color,7);if(r.hp<=0){spark(r.x,r.y,s.color,18);game.rocks.splice(j,1);game.score++}if(s.pierce>0)s.pierce--;else remove=true}}if(remove)game.shots.splice(i,1)}}
function updateSparks(dt){for(let i=game.sparks.length-1;i>=0;i--){const p=game.sparks[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;p.life-=dt*2.2;if(p.life<=0)game.sparks.splice(i,1)}}
function update(dt){if(game.running){game.timer+=dt;updateShip(dt);updateWeapons(dt);updateRocks(dt);updateShots(dt);timeText.textContent=`${Math.floor(game.timer)}s`;stressText.textContent=`${3-game.hits}`;fallText.textContent=game.score;const w=WEAPONS[game.weapon];holdText.textContent=`${w.name} ${w.ammo}/${w.ammoMax}`}updateSparks(dt);game.shake=Math.max(0,game.shake-dt*22)}

function bg(){const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,C.bg);g.addColorStop(.55,C.bg2);g.addColorStop(1,'#080b10');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=C.line;ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}for(let y=0;y<canvas.height;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}for(const s of game.stars){ctx.globalAlpha=s.a;ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fill()}ctx.globalAlpha=1}
function drawShip(){ctx.save();ctx.translate(cx(),cy());ctx.rotate(game.angle);ctx.shadowColor=C.blue;ctx.shadowBlur=10;ctx.fillStyle='rgba(17,24,39,.96)';ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(30,0);ctx.lineTo(-18,-16);ctx.lineTo(-10,0);ctx.lineTo(-18,16);ctx.closePath();ctx.fill();ctx.stroke();if(Math.abs(game.shipV)>10){ctx.fillStyle=C.gold;ctx.globalAlpha=clamp(Math.abs(game.shipV)/230,.25,.9);ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-32,-8);ctx.lineTo(-28,0);ctx.lineTo(-32,8);ctx.closePath();ctx.fill();ctx.globalAlpha=1}ctx.restore();if(game.shield>0){ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.globalAlpha=clamp(game.shield/2.6,.25,.8);ctx.beginPath();ctx.arc(cx(),cy(),38+Math.sin(game.timer*10)*2,0,6.28);ctx.stroke();ctx.globalAlpha=1}}
function drawRocks(){for(const r of game.rocks){ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.rot);ctx.strokeStyle='rgba(255,255,255,.28)';ctx.fillStyle=C.rock;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<9;i++){const a=i/9*6.28;const rad=r.r*(.75+((i*17)%10)/35);const x=Math.cos(a)*rad,y=Math.sin(a)*rad;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}}
function drawShots(){for(const s of game.shots){ctx.fillStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fill();ctx.shadowBlur=0}}
function drawSparks(){for(const p of game.sparks){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,6.28);ctx.fill();ctx.globalAlpha=1}}
function drawUI(){if(!game.running)return;const w=WEAPONS[game.weapon];ctx.fillStyle='rgba(17,24,39,.8)';ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=1.5;rr(cx()-82,canvas.height-154,164,48,18,true,true);ctx.fillStyle=w.color;ctx.font='900 14px Arial';ctx.textAlign='center';ctx.fillText(`${w.name} · ${w.label}`,cx(),canvas.height-134);ctx.fillStyle=C.white;ctx.font='800 12px Arial';ctx.fillText(`Ammo ${w.ammo}/${w.ammoMax}`,cx(),canvas.height-116)}
function render(){ctx.save();const sx=game.shake?(Math.random()-.5)*game.shake:0,sy=game.shake?(Math.random()-.5)*game.shake:0;ctx.translate(sx,sy);bg();drawShots();drawRocks();drawShip();drawSparks();drawUI();ctx.restore()}

function makeDomControls(){if(game.domControls)return;const wrap=document.createElement('div');wrap.id='asteroidControls';wrap.innerHTML=`<button data-k="topLeft" class="asteroid-btn blue">WEAPON</button><button data-k="topRight" class="asteroid-btn blue right">THRUST</button><button data-k="bottomLeft" class="asteroid-btn rose bottom">TURN</button><button data-k="bottomRight" class="asteroid-btn rose bottom right">FIRE</button>`;document.getElementById('gameScreen').appendChild(wrap);game.domControls=wrap;wrap.querySelectorAll('button').forEach(btn=>{const key=btn.dataset.k;const down=e=>{e.preventDefault();e.stopPropagation();if(key==='topLeft'&&!game.input.topLeft)selectWeapon(1);if(key==='bottomRight')fire();game.input[key]=true;updateDomButtons()};const up=e=>{e.preventDefault();e.stopPropagation();game.input[key]=false;updateDomButtons()};btn.addEventListener('touchstart',down,{passive:false});btn.addEventListener('pointerdown',down);btn.addEventListener('touchend',up,{passive:false});btn.addEventListener('touchcancel',up,{passive:false});btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up)})}
function showDomControls(show){makeDomControls();game.domControls.classList.toggle('visible',!!show)}
function updateDomButtons(){if(!game.domControls)return;game.domControls.querySelectorAll('button').forEach(btn=>btn.classList.toggle('active',!!game.input[btn.dataset.k]))}

let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function start(e){if(e){e.preventDefault();e.stopPropagation()}resetGame()}
[startOverlay,startButton,restartButton].forEach(el=>{el.addEventListener('touchstart',start,{passive:false});el.addEventListener('pointerdown',start);el.addEventListener('click',start)});
makeDomControls();showDomControls(false);
setTimeout(()=>{if(!game.running&&!endOverlay.classList.contains('hidden'))return;if(!game.running)resetGame()},250);
render();