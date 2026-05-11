// Dual Gravity tutorial build: shared center line, spikes, enemies, wall puzzle, and teammate launch pads.
const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const startOverlay=document.getElementById('startOverlay'),endOverlay=document.getElementById('endOverlay'),startButton=document.getElementById('startButton'),restartButton=document.getElementById('restartButton');
const resultTitle=document.getElementById('resultTitle'),resultText=document.getElementById('resultText'),finalStats=document.getElementById('finalStats');
const C={bg:'#071018',bg2:'#111827',line:'rgba(255,255,255,.08)',blue:'#4fb8d8',rose:'#e06f8f',white:'#f8fafc',green:'#8bd3a7',gold:'#f0b86e',danger:'#f97316',gray:'#64748b'};
const game={running:false,t:0,cameraX:0,doorOpen:false,input:{tl:false,tm:false,tr:false,bl:false,bm:false,br:false},top:{x:110,y:0,w:24,h:30,vx:0,vy:0,on:false,g:1,color:'#4fb8d8'},bottom:{x:110,y:0,w:24,h:30,vx:0,vy:0,on:false,g:-1,color:'#e06f8f'}};
let spans=[],walls=[],switches=[],enemies=[],launchPads=[],spikeButtons=[],spikeTraps=[];
const EXIT_X=3260,CAMERA_MAX=2880;
function resize(){canvas.width=innerWidth;canvas.height=innerHeight}addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),seam=()=>canvas.height/2,wx=x=>x-game.cameraX;
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();ctx.stroke()}
function rects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function clearInput(){Object.keys(game.input).forEach(k=>game.input[k]=false)}
function padBox(x,w,side){const y=seam();return{x,y:side==='top'?y-12:y,w,h:12}}
function trapBox(t){const y=seam(),h=30;return{x:t.x,y:t.side==='top'?y-h:y,w:t.w,h}}
function onSpan(x,w){return spans.some(s=>x+w>s.x&&x<s.x+s.w)}
function teamX(){return(game.top.x+game.bottom.x)/2}
function tutorialText(){const x=teamX();if(game.doorOpen)return'Door open. Bring both players to the exit.';if(x<360)return'1/7: Move together. Top controls blue, bottom controls pink.';if(x<760)return'2/7: The glowing center line is floor for one player and ceiling for the other.';if(x<1120)return'3/7: Both players matter. Stand on the gold switches to open paths.';if(x<1560)return'4/7: Shared launch pads throw your teammate across gaps.';if(x<2020)return'5/7: Spike buttons trigger traps on the other side. Warn your partner.';if(x<2540)return'6/7: Enemies are timing puzzles. Wait, then cross together.';return'7/7: Final wall puzzle. Hold both switches, then escape together.'}
function makeLevel(){const y=seam();
  spans=[
    {x:0,w:520},      // 1 movement
    {x:590,w:360},    // 2 center-line reading / first gap
    {x:1030,w:360},   // 3 first switches
    {x:1510,w:350},   // 4 launch landing
    {x:1970,w:350},   // 5 spike trap room
    {x:2440,w:370},   // 6 enemy timing
    {x:2910,w:520}    // 7 final wall puzzle and exit
  ];
  walls=[
    {x:990,y:y-58,w:30,h:116},     // soft gate before first switch room
    {x:1430,y:y-86,w:34,h:172},    // gate before launch section
    {x:2365,y:y-104,w:36,h:208},   // gate before enemy section
    {x:2855,y:y-124,w:38,h:248},   // final puzzle wall
    {x:3185,y:y-70,w:30,h:140}     // exit door visual blocker
  ];
  switches=[
    {x:1125,y:y-10,w:62,h:10,side:'top',active:false},
    {x:3050,y:y,w:62,h:10,side:'bottom',active:false}
  ];
  enemies=[
    {x:2550,y:y-28,w:24,h:24,vx:32,side:'top',alive:true},
    {x:2650,y:y+4,w:24,h:24,vx:-32,side:'bottom',alive:true}
  ];
  launchPads=[
    {x:1260,w:64,cool:0},
    {x:1680,w:70,cool:0}
  ];
  spikeButtons=[
    {x:2050,w:50,side:'top',target:'bottom',cool:0},
    {x:2155,w:50,side:'bottom',target:'top',cool:0}
  ];
  spikeTraps=[
    {x:2110,w:130,side:'top',timer:0},
    {x:2075,w:130,side:'bottom',timer:0}
  ];
  game.top.x=110;game.top.y=y-game.top.h;game.bottom.x=110;game.bottom.y=y;game.top.vx=game.top.vy=game.bottom.vx=game.bottom.vy=0;game.top.on=game.bottom.on=true;game.cameraX=0;game.doorOpen=false}
function startGame(e){if(e){e.preventDefault();e.stopPropagation()}game.running=true;game.t=0;clearInput();makeLevel();startOverlay.classList.add('hidden');endOverlay.classList.add('hidden')}
function endGame(msg,win=false){if(!game.running)return;game.running=false;clearInput();resultTitle.textContent=win?'Tutorial Complete':'Game Over';resultText.textContent=msg;finalStats.innerHTML=`Dual Gravity tutorial<br>Door Opened: ${game.doorOpen?'Yes':'No'}<br>Time: ${game.t.toFixed(1)}s`;endOverlay.classList.remove('hidden')}
function hitWall(p){let box={x:p.x,y:p.y,w:p.w,h:p.h};for(const w of walls){if(rects(box,w)){if(p.vx>0)p.x=w.x-p.w;else if(p.vx<0)p.x=w.x+w.w;p.vx=0;box.x=p.x}}}
function movePlayer(p,dt,left,right,jump){const accel=900,max=185,fric=.82,grav=980,y=seam();p.vx+=(right-left)*accel*dt;p.vx=clamp(p.vx,-max,max);if(!left&&!right)p.vx*=fric;if(jump&&p.on){p.vy=-p.g*430;p.on=false}p.vy+=p.g*grav*dt;p.x+=p.vx*dt;hitWall(p);p.y+=p.vy*dt;p.on=false;if(p.g>0){if(p.vy>=0&&p.y+p.h>=y&&onSpan(p.x,p.w)){p.y=y-p.h;p.vy=0;p.on=true}}else{if(p.vy<=0&&p.y<=y&&onSpan(p.x,p.w)){p.y=y;p.vy=0;p.on=true}}if(p.y>canvas.height+200||p.y<-200)endGame('A player fell out of the gravity chamber.')}
function updateLaunchPads(dt){for(const p of launchPads){p.cool=Math.max(0,p.cool-dt);const top=padBox(p.x,p.w,'top'),bot=padBox(p.x,p.w,'bottom');if(p.cool<=0&&rects(game.top,top)&&game.top.on){game.bottom.vy=-game.bottom.g*460;game.bottom.vx+=95;p.cool=1.05}else if(p.cool<=0&&rects(game.bottom,bot)&&game.bottom.on){game.top.vy=-game.top.g*460;game.top.vx+=95;p.cool=1.05}}}
function updateSpikes(dt){for(const b of spikeButtons){b.cool=Math.max(0,b.cool-dt);const r=padBox(b.x,b.w,b.side),p=b.side==='top'?game.top:game.bottom;if(b.cool<=0&&rects(p,r)&&p.on){const t=spikeTraps.find(s=>s.side===b.target);if(t)t.timer=.62;b.cool=1.25}}for(const t of spikeTraps){if(t.timer>0){t.timer-=dt;const box=trapBox(t);for(const e of enemies){if(e.alive&&e.side===t.side&&rects(e,box))e.alive=false}const p=t.side==='top'?game.top:game.bottom;if(rects(p,box))endGame('The spike trap saved one player but caught the other.')}}}
function update(dt){if(!game.running)return;game.t+=dt;movePlayer(game.top,dt,game.input.tl?1:0,game.input.tr?1:0,game.input.tm||game.input.tl&&game.input.tr);movePlayer(game.bottom,dt,game.input.bl?1:0,game.input.br?1:0,game.input.bm||game.input.bl&&game.input.br);updateLaunchPads(dt);updateSpikes(dt);for(const sw of switches)sw.active=rects(sw.side==='top'?game.top:game.bottom,sw);game.doorOpen=switches.every(s=>s.active);for(const e of enemies){if(!e.alive)continue;e.x+=e.vx*dt;if(e.x<2500||e.x>2740)e.vx*=-1;if(e.side==='top'&&rects(game.top,e))endGame('The top player was caught.');if(e.side==='bottom'&&rects(game.bottom,e))endGame('The bottom player was caught.')}if(game.doorOpen&&game.top.x>EXIT_X&&game.bottom.x>EXIT_X)endGame('Both players completed the first Dual Gravity training course.',true);game.cameraX=clamp(teamX()-canvas.width/2,0,CAMERA_MAX)}
function bg(){const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,C.bg);g.addColorStop(.5,C.bg2);g.addColorStop(1,C.bg);ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=C.line;for(let x=-game.cameraX%64;x<canvas.width;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}const y=seam();ctx.strokeStyle='rgba(79,184,216,.42)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();ctx.fillStyle='rgba(79,184,216,.10)';ctx.fillRect(0,y-3,canvas.width,6)}
function drawWorld(){const y=seam();ctx.save();ctx.translate(-game.cameraX,0);for(const s of spans){ctx.fillStyle='rgba(248,250,252,.16)';ctx.strokeStyle='rgba(255,255,255,.22)';ctx.fillRect(s.x,y-3,s.w,6);ctx.strokeRect(s.x,y-3,s.w,6)}for(const w of walls){ctx.fillStyle='rgba(248,250,252,.12)';ctx.strokeStyle='rgba(255,255,255,.2)';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeRect(w.x,w.y,w.w,w.h)}for(const p of launchPads){ctx.fillStyle=p.cool>0?C.gray:C.rose;let a=padBox(p.x,p.w,'top'),b=padBox(p.x,p.w,'bottom');ctx.fillRect(a.x,a.y,a.w,a.h);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(p.x,y-2,p.w,4)}for(const sw of switches){ctx.fillStyle=sw.active?C.green:C.gold;ctx.fillRect(sw.x,sw.y,sw.w,sw.h)}for(const b of spikeButtons){let r=padBox(b.x,b.w,b.side);ctx.fillStyle=b.cool>0?C.gray:C.gold;ctx.fillRect(r.x,r.y,r.w,r.h)}for(const t of spikeTraps){ctx.fillStyle=t.timer>0?C.danger:'rgba(249,115,22,.28)';for(let i=0;i<8;i++){let x=t.x+i*(t.w/8),w=t.w/8*.72,h=t.timer>0?30:8;ctx.beginPath();if(t.side==='top'){ctx.moveTo(x,y);ctx.lineTo(x+w/2,y-h);ctx.lineTo(x+w,y)}else{ctx.moveTo(x,y);ctx.lineTo(x+w/2,y+h);ctx.lineTo(x+w,y)}ctx.closePath();ctx.fill()}}for(const e of enemies){if(!e.alive)continue;ctx.fillStyle=C.danger;ctx.fillRect(e.x,e.y,e.w,e.h)}ctx.fillStyle=game.doorOpen?C.green:'rgba(255,255,255,.24)';ctx.fillRect(3185,y-70,30,140);ctx.fillStyle='rgba(139,211,167,.22)';ctx.fillRect(EXIT_X,y-96,90,192);ctx.restore()}
function drawPlayer(p,label){ctx.save();ctx.translate(wx(p.x+p.w/2),p.y+p.h/2);if(p.g<0)ctx.rotate(Math.PI);ctx.fillStyle=p.color;ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=2;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.strokeRect(-p.w/2,-p.h/2,p.w,p.h);ctx.fillStyle='#061018';ctx.font='900 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,0,1);ctx.restore()}
function drawButton(x,y,w,h,label,on,color,flip=false){ctx.save();ctx.fillStyle=on?color:'rgba(17,24,39,.82)';ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1.7;rr(x,y,w,h,18);ctx.translate(x+w/2,y+h/2);if(flip)ctx.rotate(Math.PI);ctx.fillStyle=on?'#061018':C.white;ctx.font='900 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,0,0);ctx.restore()}
function render(){bg();drawWorld();drawPlayer(game.top,'T');drawPlayer(game.bottom,'B');if(game.running){ctx.fillStyle=C.white;ctx.font='900 13px Arial';ctx.textAlign='center';ctx.fillText(tutorialText(),canvas.width/2,seam()-86);const w=canvas.width*.31,h=56;drawButton(canvas.width*.02,76,w,h,'LEFT',game.input.tl,C.blue,true);drawButton(canvas.width*.345,76,w,h,'JUMP',game.input.tm,C.blue,true);drawButton(canvas.width*.67,76,w,h,'RIGHT',game.input.tr,C.blue,true);const by=canvas.height-90;drawButton(canvas.width*.02,by,w,h,'LEFT',game.input.bl,C.rose);drawButton(canvas.width*.345,by,w,h,'JUMP',game.input.bm,C.rose);drawButton(canvas.width*.67,by,w,h,'RIGHT',game.input.br,C.rose)}let hud=document.getElementById('hud');if(hud)hud.style.display='none'}
let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function visibleOverlay(){return!startOverlay.classList.contains('hidden')||!endOverlay.classList.contains('hidden')}function start(e){if(e){e.preventDefault();e.stopPropagation()}startGame(e)}[startOverlay,startButton,restartButton].forEach(el=>{el.addEventListener('touchstart',start,{passive:false});el.addEventListener('pointerdown',start);el.addEventListener('click',start)});
function key(t){const top=t.clientY<canvas.height/2,third=t.clientX/canvas.width;if(top){if(third<.333)return'tl';if(third<.666)return'tm';return'tr'}else{if(third<.333)return'bl';if(third<.666)return'bm';return'br'}}
document.addEventListener('touchstart',e=>{if(visibleOverlay())return;e.preventDefault();for(const t of e.changedTouches)game.input[key(t)]=true},{passive:false});document.addEventListener('touchend',e=>{if(visibleOverlay())return;e.preventDefault();for(const t of e.changedTouches)game.input[key(t)]=false},{passive:false});document.addEventListener('touchcancel',e=>{if(visibleOverlay())return;e.preventDefault();for(const t of e.changedTouches)game.input[key(t)]=false},{passive:false});render();