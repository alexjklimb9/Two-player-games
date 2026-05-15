// Dual Gravity level pack: Tutorial + Levels 1-5, no endless mode.
const dualParams = new URLSearchParams(window.location.search);
const dualLevel = Math.max(0, Math.min(5, parseInt(dualParams.get('level') || '0', 10) || 0));
const dualLevelNames = ['Tutorial', 'Level 1: Coordination', 'Level 2: Split Tasks', 'Level 3: Moving Systems', 'Level 4: Co-op Chaos', 'Level 5: Final Trial'];
const dualCameraMax = [3250, 3500, 3720, 4000, 4300, 4680];
const dualExitX = [3290, 3510, 3735, 4020, 4335, 4690];

function dualGoalX(){ return (goals && goals[0] ? goals[0].x : 3290); }
function dualLevelTitle(){ return dualLevelNames[dualLevel] || dualLevelNames[0]; }

const originalStartGame = startGame;
startGame = function(e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  game.running = true;
  game.t = 0;
  clearInput();
  makeLevel();
  startOverlay.classList.add('hidden');
  endOverlay.classList.add('hidden');
};

makeLevel = function(){
  const y = seam();
  const L = dualLevel;
  game.doorOpen = false;
  game.cameraX = 0;
  game.prevPad.top = game.prevPad.bottom = false;
  game.wasAir.top = game.wasAir.bottom = false;
  game.top.carrier = game.bottom.carrier = null;
  game.top.vx = game.top.vy = game.bottom.vx = game.bottom.vy = 0;
  game.top.x = 110; game.top.y = y - game.top.h; game.top.on = true;
  game.bottom.x = 110; game.bottom.y = y; game.bottom.on = true;

  if(L === 0){
    spans=[{x:0,w:2470},{x:2835,w:595}];
    walls=[{x:990,y:y-58,w:30,h:116},{x:1430,y:y-148,w:34,h:148},{x:1430,y:y,w:34,h:92},{x:2365,y:y-58,w:36,h:116},{x:2925,y:y-92,w:38,h:92},{x:2925,y:y,w:38,h:148},{x:3185,y:y-70,w:30,h:140,door:true}];
    switches=[{x:3035,w:118,active:false,type:'both'}];
    goals=[{x:3290,w:100}];
    enemies=[{x:2115,y:y-28,w:24,h:24,vx:28,side:'top',alive:true,min:2055,max:2235},{x:2080,y:y+4,w:24,h:24,vx:-28,side:'bottom',alive:true,min:2025,max:2205}];
    launchPads=[{x:1305,w:110,cool:0},{x:2838,w:74,cool:0}];
    spikeButtons=[{x:2050,w:50,side:'top',target:'bottom',cool:0},{x:2155,w:50,side:'bottom',target:'top',cool:0}];
    spikeTraps=[{x:2110,w:130,side:'top',timer:0},{x:2075,w:130,side:'bottom',timer:0}];
    movingPlatforms=[{x:2520,w:82,min:2520,max:2730,vx:48,dir:1,lastDx:0}];
  } else if(L === 1){
    spans=[{x:0,w:620},{x:720,w:640},{x:1480,w:600},{x:2200,w:120},{x:2700,w:80},{x:2860,w:740}];
    walls=[{x:690,y:y-55,w:30,h:110},{x:1390,y:y-142,w:34,h:142},{x:1390,y:y,w:34,h:82},{x:2110,y:y-58,w:34,h:116},{x:2488,y:y-44,w:32,h:88},{x:2770,y:y-88,w:36,h:88},{x:2770,y:y,w:36,h:142},{x:3385,y:y-70,w:30,h:140,door:true}];
    switches=[{x:3245,w:120,active:false,type:'both'}];
    goals=[{x:3505,w:105}];
    enemies=[{x:1880,y:y-28,w:24,h:24,vx:30,side:'top',alive:true,min:1780,max:2025},{x:1940,y:y+4,w:24,h:24,vx:-30,side:'bottom',alive:true,min:1780,max:2025}];
    launchPads=[{x:1245,w:110,cool:0},{x:2678,w:80,cool:0}];
    spikeButtons=[{x:1810,w:50,side:'top',target:'bottom',cool:0},{x:1970,w:50,side:'bottom',target:'top',cool:0}];
    spikeTraps=[{x:1910,w:150,side:'top',timer:0},{x:1815,w:150,side:'bottom',timer:0}];
    movingPlatforms=[{x:2330,w:92,min:2330,max:2605,vx:48,dir:1,lastDx:0}];
  } else if(L === 2){
    spans=[{x:0,w:760},{x:860,w:670},{x:1640,w:520},{x:2300,w:360},{x:2860,w:360},{x:3360,w:520}];
    walls=[{x:805,y:y-70,w:34,h:140},{x:1570,y:y-92,w:36,h:92},{x:1570,y:y,w:36,h:156},{x:2210,y:y-66,w:36,h:132},{x:2730,y:y-148,w:38,h:148},{x:2730,y:y,w:38,h:86},{x:3580,y:y-70,w:30,h:140,door:true}];
    switches=[{x:3420,w:120,active:false,type:'both'}];
    goals=[{x:3740,w:105}];
    enemies=[{x:1760,y:y-28,w:24,h:24,vx:42,side:'top',alive:true,min:1680,max:2100},{x:1900,y:y+4,w:24,h:24,vx:-42,side:'bottom',alive:true,min:1680,max:2100},{x:3040,y:y-28,w:24,h:24,vx:34,side:'top',alive:true,min:2920,max:3180}];
    launchPads=[{x:1420,w:100,cool:0},{x:2638,w:85,cool:0}];
    spikeButtons=[{x:1730,w:45,side:'top',target:'bottom',cool:0},{x:1995,w:45,side:'bottom',target:'top',cool:0},{x:3095,w:45,side:'bottom',target:'top',cool:0}];
    spikeTraps=[{x:1940,w:150,side:'top',timer:0},{x:1720,w:150,side:'bottom',timer:0}];
    movingPlatforms=[{x:2350,w:82,min:2350,max:2780,vx:58,dir:1,lastDx:0}];
  } else if(L === 3){
    spans=[{x:0,w:780},{x:900,w:610},{x:1640,w:300},{x:2140,w:260},{x:2700,w:300},{x:3240,w:310},{x:3800,w:420}];
    walls=[{x:830,y:y-58,w:32,h:116},{x:1545,y:y-158,w:34,h:158},{x:1545,y:y,w:34,h:94},{x:2470,y:y-62,w:36,h:124},{x:3100,y:y-104,w:38,h:104},{x:3100,y:y,w:38,h:166},{x:4000,y:y-70,w:30,h:140,door:true}];
    switches=[{x:3840,w:126,active:false,type:'both'}];
    goals=[{x:4155,w:110}];
    enemies=[{x:1720,y:y-28,w:24,h:24,vx:52,side:'top',alive:true,min:1660,max:1920},{x:2170,y:y+4,w:24,h:24,vx:-48,side:'bottom',alive:true,min:2140,max:2380},{x:2860,y:y-28,w:24,h:24,vx:42,side:'top',alive:true,min:2740,max:2980},{x:3370,y:y+4,w:24,h:24,vx:-44,side:'bottom',alive:true,min:3250,max:3530}];
    launchPads=[{x:1390,w:98,cool:0},{x:3008,w:80,cool:0}];
    spikeButtons=[{x:1710,w:42,side:'top',target:'bottom',cool:0},{x:2240,w:42,side:'bottom',target:'top',cool:0},{x:2860,w:42,side:'top',target:'bottom',cool:0},{x:3400,w:42,side:'bottom',target:'top',cool:0}];
    spikeTraps=[{x:2180,w:155,side:'top',timer:0},{x:1690,w:155,side:'bottom',timer:0},{x:3350,w:150,side:'top',timer:0},{x:2820,w:150,side:'bottom',timer:0}];
    movingPlatforms=[{x:1960,w:76,min:1960,max:2110,vx:62,dir:1,lastDx:0},{x:2520,w:78,min:2520,max:2670,vx:64,dir:1,lastDx:0},{x:3560,w:78,min:3560,max:3760,vx:58,dir:1,lastDx:0}];
  } else if(L === 4){
    spans=[{x:0,w:740},{x:900,w:480},{x:1540,w:320},{x:2060,w:280},{x:2580,w:300},{x:3160,w:260},{x:3680,w:320},{x:4240,w:400}];
    walls=[{x:810,y:y-70,w:34,h:140},{x:1420,y:y-164,w:34,h:164},{x:1420,y:y,w:34,h:90},{x:2420,y:y-72,w:36,h:144},{x:3000,y:y-152,w:36,h:152},{x:3000,y:y,w:36,h:82},{x:4110,y:y-94,w:38,h:188},{x:4435,y:y-70,w:30,h:140,door:true}];
    switches=[{x:4260,w:130,active:false,type:'both'}];
    goals=[{x:4590,w:115}];
    enemies=[{x:1580,y:y-28,w:24,h:24,vx:58,side:'top',alive:true,min:1540,max:1850},{x:2080,y:y+4,w:24,h:24,vx:-55,side:'bottom',alive:true,min:2060,max:2340},{x:2640,y:y-28,w:24,h:24,vx:52,side:'top',alive:true,min:2585,max:2870},{x:3260,y:y+4,w:24,h:24,vx:-50,side:'bottom',alive:true,min:3170,max:3420},{x:3830,y:y-28,w:24,h:24,vx:48,side:'top',alive:true,min:3690,max:3985}];
    launchPads=[{x:1285,w:96,cool:0},{x:2906,w:82,cool:0},{x:3998,w:84,cool:0}];
    spikeButtons=[{x:1630,w:42,side:'top',target:'bottom',cool:0},{x:2180,w:42,side:'bottom',target:'top',cool:0},{x:2690,w:42,side:'top',target:'bottom',cool:0},{x:3330,w:42,side:'bottom',target:'top',cool:0},{x:3860,w:42,side:'top',target:'bottom',cool:0}];
    spikeTraps=[{x:2130,w:150,side:'top',timer:0},{x:1590,w:150,side:'bottom',timer:0},{x:3290,w:150,side:'top',timer:0},{x:2640,w:150,side:'bottom',timer:0},{x:3820,w:150,side:'bottom',timer:0}];
    movingPlatforms=[{x:1880,w:74,min:1880,max:2045,vx:65,dir:1,lastDx:0},{x:2370,w:74,min:2370,max:2550,vx:70,dir:1,lastDx:0},{x:3460,w:78,min:3460,max:3660,vx:62,dir:1,lastDx:0}];
  } else {
    spans=[{x:0,w:760},{x:930,w:400},{x:1500,w:260},{x:1980,w:240},{x:2500,w:220},{x:3000,w:240},{x:3520,w:240},{x:4040,w:260},{x:4520,w:420}];
    walls=[{x:820,y:y-70,w:34,h:140},{x:1380,y:y-170,w:34,h:170},{x:1380,y:y,w:34,h:92},{x:2320,y:y-74,w:36,h:148},{x:2870,y:y-160,w:36,h:160},{x:2870,y:y,w:36,h:82},{x:3920,y:y-96,w:38,h:192},{x:4350,y:y-154,w:38,h:154},{x:4350,y:y,w:38,h:92},{x:4725,y:y-70,w:30,h:140,door:true}];
    switches=[{x:4560,w:130,active:false,type:'both'}];
    goals=[{x:4880,w:120}];
    enemies=[{x:1540,y:y-28,w:24,h:24,vx:62,side:'top',alive:true,min:1500,max:1760},{x:1990,y:y+4,w:24,h:24,vx:-62,side:'bottom',alive:true,min:1980,max:2220},{x:2540,y:y-28,w:24,h:24,vx:58,side:'top',alive:true,min:2500,max:2720},{x:3050,y:y+4,w:24,h:24,vx:-58,side:'bottom',alive:true,min:3000,max:3240},{x:3580,y:y-28,w:24,h:24,vx:54,side:'top',alive:true,min:3520,max:3740},{x:4100,y:y+4,w:24,h:24,vx:-54,side:'bottom',alive:true,min:4040,max:4300}];
    launchPads=[{x:1248,w:94,cool:0},{x:2780,w:82,cool:0},{x:4258,w:84,cool:0}];
    spikeButtons=[{x:1580,w:40,side:'top',target:'bottom',cool:0},{x:2050,w:40,side:'bottom',target:'top',cool:0},{x:2580,w:40,side:'top',target:'bottom',cool:0},{x:3100,w:40,side:'bottom',target:'top',cool:0},{x:3620,w:40,side:'top',target:'bottom',cool:0},{x:4140,w:40,side:'bottom',target:'top',cool:0}];
    spikeTraps=[{x:2000,w:150,side:'top',timer:0},{x:1540,w:150,side:'bottom',timer:0},{x:3060,w:150,side:'top',timer:0},{x:2540,w:150,side:'bottom',timer:0},{x:4100,w:150,side:'top',timer:0},{x:3580,w:150,side:'bottom',timer:0}];
    movingPlatforms=[{x:1780,w:72,min:1780,max:1950,vx:72,dir:1,lastDx:0},{x:2240,w:72,min:2240,max:2480,vx:76,dir:1,lastDx:0},{x:3260,w:74,min:3260,max:3500,vx:70,dir:1,lastDx:0},{x:3760,w:74,min:3760,max:4020,vx:66,dir:1,lastDx:0}];
  }
};

tutorialText = function(){
  const x = teamX(), L = dualLevel;
  if(game.doorOpen && x > dualGoalX() - 120) return `${dualLevelTitle()}: Both players stand on the green finish rail.`;
  if(game.doorOpen) return `${dualLevelTitle()}: Door unlocked permanently. Bring both players to the finish.`;
  if(L === 0){
    if(x<360)return'Tutorial 1/7: Move together. Top controls blue, bottom controls pink.';
    if(x<760)return'Tutorial 2/7: The center line is floor for blue and ceiling for pink.';
    if(x<1560)return'Tutorial 3/7: One player waits on the pad. The other jumps and lands on it.';
    if(x<2220)return'Tutorial 4/7: Use spike buttons to trap enemies on the other side.';
    if(x<2820)return'Tutorial 5/7: The purple platform moves only with exactly one rider.';
    if(x<3030)return'Tutorial 6/7: Use the flipped launch wall.';
    return'Tutorial 7/7: Both players stand on gold to unlock the door.';
  }
  const tips=[
    '',
    'Level 1: Ride the one-player platform across the gap and jump the middle block.',
    'Level 2: Split jobs. One player creates safety while the other advances.',
    'Level 3: Moving systems. Watch timing before crossing.',
    'Level 4: Co-op chaos. Communicate before every launch and trap.',
    'Level 5: Final trial. Every mechanic appears in a longer gauntlet.'
  ];
  return tips[L] || tips[1];
};

const originalUpdateDG = update;
update = function(dt){
  if(!game.running)return;
  game.t+=dt;
  movePlayer(game.top,dt,game.input.tl?1:0,game.input.tr?1:0,game.input.tm||game.input.tl&&game.input.tr);
  movePlayer(game.bottom,dt,game.input.bl?1:0,game.input.br?1:0,game.input.bm||game.input.bl&&game.input.br);
  updateMovingPlatforms(dt);
  updateLaunchPads(dt);
  updateSpikes(dt);
  updateSwitches();
  for(const e of enemies){
    if(!e.alive)continue;
    e.x+=e.vx*dt;
    if(e.x<e.min||e.x>e.max)e.vx*=-1;
    if(e.side==='top'&&rects(game.top,e))endGame('The top player was caught.');
    if(e.side==='bottom'&&rects(game.bottom,e))endGame('The bottom player was caught.');
  }
  updateGoal();
  game.cameraX=clamp(teamX()-canvas.width/2,0,dualCameraMax[dualLevel] || 3250);
};

function drawWrappedText(text,x,y,maxWidth,lineHeight){
  const words=text.split(' ');let line='',lines=[];
  for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}
  if(line)lines.push(line);
  const start=y-(lines.length-1)*lineHeight/2;
  ctx.save();ctx.fillStyle='rgba(7,16,24,.72)';ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=1;
  const boxH=lines.length*lineHeight+14;ctx.fillRect(x-maxWidth/2-10,start-lineHeight/2-7,maxWidth+20,boxH);ctx.strokeRect(x-maxWidth/2-10,start-lineHeight/2-7,maxWidth+20,boxH);
  ctx.fillStyle=C.white;ctx.textAlign='center';ctx.textBaseline='middle';for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],x,start+i*lineHeight);ctx.restore();
}

const originalRenderDG = render;
render = function(){
  bg();drawWorld();drawPlayer(game.top,'T');drawPlayer(game.bottom,'B');
  if(game.running){
    ctx.font='900 13px Arial';
    drawWrappedText(tutorialText(),canvas.width/2,seam()-98,Math.min(canvas.width-28,540),16);
    const w=canvas.width*.31,h=56;
    drawButton(canvas.width*.02,76,w,h,'LEFT',game.input.tl,C.blue,true);
    drawButton(canvas.width*.345,76,w,h,'JUMP',game.input.tm,C.blue,true);
    drawButton(canvas.width*.67,76,w,h,'RIGHT',game.input.tr,C.blue,true);
    const by=canvas.height-90;
    drawButton(canvas.width*.02,by,w,h,'LEFT',game.input.bl,C.rose);
    drawButton(canvas.width*.345,by,w,h,'JUMP',game.input.bm,C.rose);
    drawButton(canvas.width*.67,by,w,h,'RIGHT',game.input.br,C.rose);
  }
  let hud=document.getElementById('hud');if(hud)hud.style.display='none';
};

if(document.getElementById('gameTitle')) document.getElementById('gameTitle').textContent = dualLevelTitle();
if(document.getElementById('gameDescription')) document.getElementById('gameDescription').textContent = dualLevel===0 ? 'Learn the Dual Gravity mechanics.' : 'A Dual Gravity co-op challenge.';
if(document.getElementById('gameTip')) document.getElementById('gameTip').textContent = dualLevel===0 ? 'Tutorial includes every core mechanic.' : 'No endless mode: finish the level together.';
if(document.getElementById('homeButton')) document.getElementById('homeButton').href = 'levels.html?game=dual&v=90';
