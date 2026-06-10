// ═══════════════════════════════════════════════════════════════
//  PIKACHU DASH — game.js  (v3: Fearow PNG + Coins + Better UI)
// ═══════════════════════════════════════════════════════════════

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// ── State ──────────────────────────────────────────────────────
let gameStarted = false, gameOver = false;
let gravity = 0.6, jumpPower = 15;
let isJumping = false, doubleJumpUsed = false;
let bgX = 0, groundX = 0, frame = 0;
let score = 0;
let highScore = localStorage.getItem("pikachuHighScore") || 0;
let lives = 3;
let isInvincible = false, invincibleTimer = 0;
const INVINCIBLE_DURATION = 120;

// ── Collections ────────────────────────────────────────────────
let balloons = [], trunks = [], coins = [], thunderbolts = [];

// ── Fearow ─────────────────────────────────────────────────────
let fearow        = null;
let fearowState   = "idle";   // idle|entering|hovering|diving|retreating|dead
let nextFearowFrame = 350;
let warningAlpha  = 0, warningDir = 1;
let warningActive = false, warningTimer = 0;

// ── Spawning ───────────────────────────────────────────────────
let nextTrunkFrame = 0, nextCoinFrame = 180;

// ── ZAP visibility ────────────────────────────────────────────
let zapVisible = false;

// ══════════════════════════════════════════════════════════════
//  IMAGE LOADING HELPER
// ══════════════════════════════════════════════════════════════
function loadImg(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// ── Background / Ground ────────────────────────────────────────
const bg     = loadImg("/assests/background/sky.jpg");
const ground = loadImg("/assests/background/ground.png");

// ── Pikachu sprites ────────────────────────────────────────────
const pikachuIdle      = loadImg("/assests/pikachu/idle.png");
const pikachuJump      = loadImg("/assests/pikachu/pikachusky.png");
const pikachuCollision = loadImg("/assests/pikachu/obstacle.png");
const pikachuRunFrames = [
  "/assests/pikachu/run5.png","/assests/pikachu/run4.png",
  "/assests/pikachu/run1.png","/assests/pikachu/run4.png",
  "/assests/pikachu/idle.png",
].map(loadImg);

// ── Fearow sprites (PNG — falls back to canvas shapes if missing) ──
const fearowFrames = {
  fly : ["/assests/fearow/fly1.png","/assests/fearow/fly2.png",
         "/assests/fearow/fly3.png","/assests/fearow/fly4.png"].map(loadImg),
  dive: loadImg("/assests/fearow/dive.png"),
  hit : loadImg("/assests/fearow/hit.png"),
  dead: loadImg("/assests/fearow/dead.png"),
};
// Track which fearow images loaded OK
const fearowLoaded = {};
function markLoaded(key, img) {
  img.onload  = () => { fearowLoaded[key] = true; };
  img.onerror = () => { fearowLoaded[key] = false; };
}
fearowFrames.fly.forEach((img, i) => markLoaded("fly" + i, img));
markLoaded("dive", fearowFrames.dive);
markLoaded("hit",  fearowFrames.hit);
markLoaded("dead", fearowFrames.dead);

// ── Other sprites ──────────────────────────────────────────────
const trunkImage  = loadImg("/assests/obstacles/trunk.png");
const balloonImg  = loadImg("/assests/collectibles/baloon.png");
const coinImg     = loadImg("/assests/collectibles/coin.png"); // optional

// ── Pikachu object ─────────────────────────────────────────────
const pikachu = { x:150, y:0, width:130, height:130, velocityY:0, currentSprite:"idle" };
const groundY = canvas.height - 100;

// ══════════════════════════════════════════════════════════════
//  DOM REFERENCES
// ══════════════════════════════════════════════════════════════
const runBtn          = document.getElementById("runBtn");
const htmlRestartBtn  = document.getElementById("restartBtn");
const desktopControls = document.getElementById("desktopControls");
const mobileControls  = document.getElementById("mobileControls");
const zapBtn          = document.getElementById("zapBtn");       // single unified ZAP btn
const livesDisplay    = document.getElementById("livesDisplay");
const scoreDisplay    = document.getElementById("scoreDisplay");
const jumpBtn         = document.getElementById("jumpBtn");
const muteBGMBtn      = document.getElementById("muteBGMBtn");
const muteSFXBtn      = document.getElementById("muteSFXBtn");
const mobileBGMBtn    = document.getElementById("mobileBGMBtn");
const mobileSFXBtn    = document.getElementById("mobileSFXBtn");
const mobileJumpBtn   = document.getElementById("mobileJumpBtn");

// ══════════════════════════════════════════════════════════════
//  AUDIO
// ══════════════════════════════════════════════════════════════
const backgroundMusic = new Audio('/assests/sound/baase.mp3');
backgroundMusic.loop = true; backgroundMusic.volume = 0.5;
const crashSound   = new Audio('/assests/sound/crash.mp3');   crashSound.volume = 0.8;
const collectSound = new Audio('/assests/sound/collect.mp3'); collectSound.volume = 0.7;
const jumpSound    = new Audio('/assests/sound/jump.mp3');    jumpSound.volume = 0.5;
let isBGMMuted = false, isSFXMuted = false;

function playSFX(snd) {
  if (isSFXMuted) return;
  snd.currentTime = 0; snd.play().catch(()=>{});
}

function toggleBGM() {
  isBGMMuted = !isBGMMuted;
  backgroundMusic.muted = isBGMMuted;
  if (muteBGMBtn)  muteBGMBtn.textContent  = isBGMMuted ? "🎵 Muted" : "🎶 BGM";
  if (mobileBGMBtn) mobileBGMBtn.textContent = isBGMMuted ? "🔇" : "🎶";
  if (gameStarted && !gameOver)
    isBGMMuted ? backgroundMusic.pause() : backgroundMusic.play().catch(()=>{});
}
function toggleSFX() {
  isSFXMuted = !isSFXMuted;
  [crashSound, collectSound, jumpSound].forEach(s => s.muted = isSFXMuted);
  if (muteSFXBtn)  muteSFXBtn.textContent  = isSFXMuted ? "🔇 Muted" : "🔊 SFX";
  if (mobileSFXBtn) mobileSFXBtn.textContent = isSFXMuted ? "🔇" : "🔊";
}

// ══════════════════════════════════════════════════════════════
//  HUD HELPERS
// ══════════════════════════════════════════════════════════════
function updateHUD() {
  if (livesDisplay) livesDisplay.textContent = "❤️".repeat(Math.max(lives, 0));
  if (scoreDisplay) {
    scoreDisplay.innerHTML =
      `<span class="hud-score">⭐ ${score}</span>` +
      `<span class="hud-high">🏆 ${highScore}</span>`;
  }
}

function setZapVisible(val) {
  zapVisible = val;
  if (zapBtn) {
    zapBtn.style.display = val ? "flex" : "none";
    if (val) zapBtn.classList.add("zap-pulse");
    else     zapBtn.classList.remove("zap-pulse");
  }
}

// ══════════════════════════════════════════════════════════════
//  JUMP
// ══════════════════════════════════════════════════════════════
function handleJump(initial) {
  if (!gameStarted || gameOver) return;
  if (initial) {
    if (!isJumping) {
      pikachu.velocityY = -jumpPower;
      isJumping = true;
      pikachu.currentSprite = "jump";
      playSFX(jumpSound);
    }
  } else {
    if (isJumping && !doubleJumpUsed) {
      pikachu.velocityY = -jumpPower * 1.2;
      doubleJumpUsed = true;
      playSFX(jumpSound);
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  THUNDERBOLT (ZAP)
// ══════════════════════════════════════════════════════════════
function fireThunderbolt() {
  if (!zapVisible || !fearow || fearowState === "dead" || fearowState === "retreating" || fearowState === "idle") return;
  thunderbolts.push({
    x: pikachu.x + pikachu.width - 10,
    y: pikachu.y + pikachu.height / 2 - 10,
    speed: 15, frame: 0,
  });
  playSFX(collectSound);
}

// ══════════════════════════════════════════════════════════════
//  FEAROW FUNCTIONS
// ══════════════════════════════════════════════════════════════
function spawnFearow() {
  fearow = {
    x: canvas.width + 30,
    y: 55,
    width: 100, height: 75,
    hp: 1,
    hoverX: canvas.width * 0.62,
    hoverTimer: 0,
    diveSpeedX: 9, diveSpeedY: 6,
    hitFlash: 0,
    flyFrame: 0,
  };
  fearowState   = "entering";
  warningActive = false;
  setZapVisible(true);
}

// Choose fearow sprite — uses PNG if loaded, else canvas fallback
function getFearowSprite() {
  switch (fearowState) {
    case "diving":
      return fearowLoaded["dive"] ? fearowFrames.dive : null;
    case "dead":
      return fearowLoaded["dead"] ? fearowFrames.dead : null;
    default: {
      // cycling fly frames
      const fi = Math.floor(fearow.flyFrame / 8) % 4;
      return fearowLoaded["fly" + fi] ? fearowFrames.fly[fi] : null;
    }
  }
}

function drawFearowCanvas() {
  // Canvas-shape fallback (same as before but cleaner)
  const fx = 0, fy = 0;
  const wingAng = Math.sin(frame / 6) * 0.45;
  // Body
  ctx.fillStyle = fearow.hitFlash > 0 && fearow.hitFlash % 4 < 2 ? "#fff" : "#c0392b";
  ctx.beginPath(); ctx.ellipse(fx, fy+5, 26, 18, 0, 0, Math.PI*2); ctx.fill();
  // Wings
  ctx.fillStyle = "#a93226";
  ctx.save(); ctx.rotate(-wingAng-0.3);
  ctx.beginPath(); ctx.ellipse(-30,-5,32,12,-0.3,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.rotate(wingAng+0.3);
  ctx.beginPath(); ctx.ellipse(30,-5,32,12,0.3,0,Math.PI*2); ctx.fill(); ctx.restore();
  // Head
  ctx.fillStyle = "#c0392b";
  ctx.beginPath(); ctx.arc(-20,-10,14,0,Math.PI*2); ctx.fill();
  // Eye
  ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(-24,-13,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#111"; ctx.beginPath(); ctx.arc(-25,-13,2.5,0,Math.PI*2); ctx.fill();
  // Beak
  ctx.fillStyle="#e67e22"; ctx.beginPath();
  ctx.moveTo(-32,-11); ctx.lineTo(-44,-8); ctx.lineTo(-32,-5); ctx.closePath(); ctx.fill();
  // Crest
  ctx.fillStyle="#e74c3c"; ctx.beginPath();
  ctx.moveTo(-16,-22); ctx.lineTo(-12,-36); ctx.lineTo(-8,-22); ctx.closePath(); ctx.fill();
  // Tail
  ctx.fillStyle="#a93226"; ctx.beginPath();
  ctx.moveTo(22,10); ctx.lineTo(42,20); ctx.lineTo(42,5); ctx.closePath(); ctx.fill();
}

function drawFearow() {
  if (!fearow) return;
  fearow.flyFrame++;
  if (fearow.hitFlash > 0) fearow.hitFlash--;

  ctx.save();
  ctx.translate(fearow.x + fearow.width/2, fearow.y + fearow.height/2);

  // Flicker on hit
  if (fearow.hitFlash > 0) ctx.globalAlpha = fearow.hitFlash % 4 < 2 ? 0.25 : 1;

  const sprite = getFearowSprite();
  if (sprite) {
    // PNG sprites already face left (right-to-left movement) — draw directly, NO flip needed
    ctx.drawImage(sprite, -fearow.width/2, -fearow.height/2, fearow.width, fearow.height);
  } else {
    drawFearowCanvas();
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // HP bar
  if (fearowState !== "dead" && fearowState !== "retreating") {
    const bw = 70, bx = fearow.x + fearow.width/2 - bw/2, by = fearow.y - 16;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(bx-1, by-1, bw+2, 10);
    ctx.fillStyle = fearow.hp > 0.6 ? "#2ecc71" : fearow.hp > 0.3 ? "#f39c12" : "#e74c3c";
    ctx.fillRect(bx, by, bw * fearow.hp, 8);
  }
}

function updateFearow() {
  if (!fearow) return;
  switch (fearowState) {
    case "entering":
      fearow.x -= 5;
      if (fearow.x <= fearow.hoverX) { fearow.x = fearow.hoverX; fearowState = "hovering"; fearow.hoverTimer = 140; }
      break;
    case "hovering":
      fearow.y = 55 + Math.sin(frame / 18) * 12;
      fearow.hoverTimer--;
      if (fearow.hoverTimer <= 0) {
        fearowState = "diving";
        warningActive = true; warningTimer = 70; warningAlpha = 0; warningDir = 1;
      }
      break;
    case "diving":
      fearow.x -= fearow.diveSpeedX;
      fearow.y += fearow.diveSpeedY * 0.7;
      if (!isInvincible && checkCollision(pikachu, fearow)) { takeDamage(); fearowState = "retreating"; }
      if (fearow.x < pikachu.x - 80) fearowState = "retreating";
      break;
    case "retreating":
      fearow.x -= 7; fearow.y -= 3;
      if (fearow.x < -fearow.width - 30) { endFearow(); }
      break;
    case "dead":
      fearow.x += 4; fearow.y += 7;
      if (fearow.y > canvas.height + 60) { endFearow(); }
      break;
  }
}

function endFearow() {
  fearow = null; fearowState = "idle"; warningActive = false;
  setZapVisible(false);
  nextFearowFrame = frame + 420 + Math.floor(Math.random() * 280);
}

function drawWarning() {
  if (!warningActive) return;
  warningTimer--;
  if (warningTimer <= 0) { warningActive = false; return; }
  warningAlpha += warningDir * 0.07;
  if (warningAlpha >= 1) warningDir = -1;
  if (warningAlpha <= 0) warningDir = 1;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(warningAlpha, 1));
  ctx.font = "bold 24px 'Comic Sans MS'";
  ctx.fillStyle = "#ff4444";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  const txt = "⚠ FEAROW DIVING!  Press → or ZAP! ⚠";
  ctx.strokeText(txt, canvas.width/2 - 230, 88);
  ctx.fillText(txt,   canvas.width/2 - 230, 88);
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════
//  THUNDERBOLTS
// ══════════════════════════════════════════════════════════════
function updateThunderbolts() {
  for (let i = thunderbolts.length - 1; i >= 0; i--) {
    const tb = thunderbolts[i];
    tb.x += tb.speed; tb.frame++;
    if (tb.x > canvas.width + 20) { thunderbolts.splice(i, 1); continue; }

    // Draw — zigzag lightning
    ctx.save();
    ctx.shadowColor = "#f1c40f"; ctx.shadowBlur = 22;
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    const zx = tb.x, zy = tb.y;
    ctx.moveTo(zx,    zy+2);  ctx.lineTo(zx+22, zy+2);
    ctx.lineTo(zx+13, zy+9);  ctx.lineTo(zx+30, zy+9);
    ctx.lineTo(zx+8,  zy+18); ctx.lineTo(zx+20, zy+18);
    ctx.lineTo(zx,    zy+18); ctx.closePath(); ctx.fill();
    // Sparks trail
    for (let s=0;s<3;s++) {
      ctx.globalAlpha = 0.6 - s*0.18;
      ctx.fillRect(zx-8-s*10, zy+7+Math.sin(tb.frame+s)*3, 7, 3);
    }
    ctx.restore();

    // Hit Fearow?
    if (fearow && fearowState !== "dead" && fearowState !== "retreating" && fearowState !== "idle") {
      if (tb.x+30 > fearow.x && tb.x < fearow.x+fearow.width &&
          tb.y+18 > fearow.y && tb.y < fearow.y+fearow.height) {
        fearow.hp -= 0.34;
        fearow.hitFlash = 18;
        thunderbolts.splice(i, 1);
        playSFX(crashSound);
        if (fearow.hp <= 0) { fearow.hp = 0; fearowState = "dead"; score += 50; updateHUD(); setZapVisible(false); }
        continue;
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  DAMAGE
// ══════════════════════════════════════════════════════════════
function takeDamage() {
  if (isInvincible) return;
  lives--; isInvincible = true; invincibleTimer = INVINCIBLE_DURATION;
  playSFX(crashSound);
  updateHUD();
  if (lives <= 0) showGameOver();
}

// ══════════════════════════════════════════════════════════════
//  COINS
// ══════════════════════════════════════════════════════════════
function spawnCoin() {
  coins.push({
    x: canvas.width,
    y: 80 + Math.random() * (groundY - 180),
    r: 18,           // radius
    spin: 0,
    speed: 4 + Math.random() * 2,
  });
}

function updateCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.x -= c.speed; c.spin += 0.1;

    // Draw coin as gold circle with ★ (fallback if no coinImg)
    ctx.save();
    ctx.translate(c.x, c.y);
    // Squish to simulate spin
    const scaleX = Math.abs(Math.cos(c.spin));
    ctx.scale(scaleX < 0.1 ? 0.1 : scaleX, 1);

    if (coinImg.complete && coinImg.naturalWidth) {
      ctx.drawImage(coinImg, -c.r, -c.r, c.r*2, c.r*2);
    } else {
      // Canvas coin fallback
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI*2);
      const grad = ctx.createRadialGradient(-c.r*0.3, -c.r*0.3, c.r*0.1, 0, 0, c.r);
      grad.addColorStop(0, "#fff176");
      grad.addColorStop(0.5, "#fdd835");
      grad.addColorStop(1, "#f9a825");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "#e65100"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#e65100"; ctx.font = `bold ${c.r}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("★", 0, 1);
    }
    ctx.restore();

    // Collect
    const dx = pikachu.x + pikachu.width/2 - c.x;
    const dy = pikachu.y + pikachu.height/2 - c.y;
    if (Math.sqrt(dx*dx + dy*dy) < c.r + 30) {
      score += 5; updateHUD();
      coins.splice(i, 1);
      playSFX(collectSound);
      continue;
    }
    if (c.x + c.r < 0) coins.splice(i, 1);
  }
}

// ══════════════════════════════════════════════════════════════
//  COLLISION
// ══════════════════════════════════════════════════════════════
function checkCollision(a, b) {
  const p = 12;
  return a.x+p < b.x+b.width && a.x+a.width-p > b.x &&
         a.y+p < b.y+b.height && a.y+a.height-p > b.y;
}

// ══════════════════════════════════════════════════════════════
//  DRAWING
// ══════════════════════════════════════════════════════════════
function drawBackground() {
  bgX -= 2; if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);
}
function drawGround() {
  groundX -= 5; if (groundX <= -canvas.width) groundX = 0;
  ctx.drawImage(ground, groundX, groundY, canvas.width, 100);
  ctx.drawImage(ground, groundX + canvas.width, groundY, canvas.width, 100);
}
function drawPikachu() {
  if (isInvincible && invincibleTimer % 6 < 3) ctx.globalAlpha = 0.3;
  let img;
  if (gameOver)                              img = pikachuCollision;
  else if (pikachu.currentSprite==="idle")   img = pikachuIdle;
  else if (pikachu.currentSprite==="jump")   img = pikachuJump;
  else img = pikachuRunFrames[Math.floor(frame/5) % pikachuRunFrames.length];
  ctx.drawImage(img, pikachu.x, pikachu.y, pikachu.width, pikachu.height);
  ctx.globalAlpha = 1;
}

// ══════════════════════════════════════════════════════════════
//  PHYSICS
// ══════════════════════════════════════════════════════════════
function update() {
  if (gameOver) return;
  if (isInvincible) { invincibleTimer--; if (invincibleTimer<=0) isInvincible=false; }
  pikachu.velocityY += gravity;
  pikachu.y += pikachu.velocityY;
  if (pikachu.y < 0) { pikachu.y=0; pikachu.velocityY=0; }
  if (pikachu.y + pikachu.height >= groundY) {
    pikachu.y = groundY - pikachu.height + 10;
    pikachu.velocityY = 0; isJumping = false; doubleJumpUsed = false;
    if (pikachu.currentSprite !== "run") pikachu.currentSprite = "run";
  }
}

// ══════════════════════════════════════════════════════════════
//  GAME OVER
// ══════════════════════════════════════════════════════════════
function showGameOver() {
  gameOver = true;
  backgroundMusic.pause(); backgroundMusic.currentTime = 0;
  playSFX(crashSound);
  if (score > highScore) { highScore = score; localStorage.setItem("pikachuHighScore", highScore); }
  desktopControls.style.display = "none";
  mobileControls.style.display  = "none";
  setZapVisible(false);

  // Overlay
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 54px 'Comic Sans MS'";
  ctx.fillStyle = "#ff4444";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width/2, canvas.height/2 - 55);

  ctx.font = "26px 'Comic Sans MS'";
  ctx.fillStyle = "#fff";
  ctx.fillText("⭐ Score: " + score,    canvas.width/2, canvas.height/2 - 10);
  ctx.fillText("🏆 Best:  " + highScore, canvas.width/2, canvas.height/2 + 28);
  ctx.textAlign = "left";

  htmlRestartBtn.style.display = "block";
  drawPikachu();
}

// ══════════════════════════════════════════════════════════════
//  GAME LIFECYCLE
// ══════════════════════════════════════════════════════════════
function startGame() {
  document.getElementById("startScreen").style.display = "none";
  canvas.style.display = "block";
  if (livesDisplay)  livesDisplay.style.display  = "flex";
  if (scoreDisplay)  scoreDisplay.style.display  = "flex";
  desktopControls.style.display = "flex";
  mobileControls.style.display  = "block";
  resetGame();
  gameStarted = true;
  if (!isBGMMuted) backgroundMusic.play().catch(()=>{});
  gameLoop();
}

function resetGame() {
  bgX=0; groundX=0; frame=0;
  balloons=[]; trunks=[]; coins=[]; thunderbolts=[];
  nextTrunkFrame = Math.floor(Math.random()*100)+60;
  nextCoinFrame  = 180;
  nextFearowFrame = 350;
  score=0; lives=3; gameOver=false;
  fearow=null; fearowState="idle"; zapVisible=false;
  warningActive=false; isInvincible=false; invincibleTimer=0;
  htmlRestartBtn.style.display = "none";
  setZapVisible(false);
  updateHUD();
  pikachu.y = groundY - pikachu.height + 10;
  pikachu.velocityY = 0; pikachu.currentSprite = "run";
  isJumping=false; doubleJumpUsed=false;
}

// ══════════════════════════════════════════════════════════════
//  GAME LOOP
// ══════════════════════════════════════════════════════════════
function gameLoop() {
  if (!gameStarted || gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frame++;

  drawBackground();
  drawGround();

  // Spawners
  if (frame % 250 === 0) balloons.push({ x:canvas.width, y:50+Math.random()*100, width:60, height:90, speed:1+Math.random()*1.5 });
  if (frame >= nextTrunkFrame) { trunks.push({ x:canvas.width, y:groundY-60, width:60, height:70 }); nextTrunkFrame = frame + Math.floor(Math.random()*250)+150; }
  if (frame >= nextCoinFrame)  { spawnCoin(); nextCoinFrame = frame + 120 + Math.floor(Math.random()*80); }
  if (!fearow && fearowState==="idle" && frame>=nextFearowFrame) spawnFearow();

  // Balloons
  for (let i=balloons.length-1;i>=0;i--) {
    const b=balloons[i]; b.x-=4; b.y+=Math.sin(frame/30)*0.5;
    ctx.drawImage(balloonImg, b.x, b.y, b.width, b.height);
    if (checkCollision(pikachu,b)) { score+=10; updateHUD(); balloons.splice(i,1); playSFX(collectSound); continue; }
    if (b.x+b.width<0) balloons.splice(i,1);
  }

  // Coins
  updateCoins();

  // Trunks
  for (let i=trunks.length-1;i>=0;i--) {
    const t=trunks[i]; t.x-=6;
    ctx.drawImage(trunkImage, t.x, t.y, t.width, t.height);
    if (checkCollision(pikachu,t)) { showGameOver(); return; }
    if (t.x+t.width<0) trunks.splice(i,1);
  }

  // Fearow
  updateFearow();
  if (fearow) drawFearow();
  drawWarning();

  // Thunderbolts
  updateThunderbolts();

  update();
  drawPikachu();

  requestAnimationFrame(gameLoop);
}

// ══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════
runBtn.addEventListener("click", startGame);
htmlRestartBtn.addEventListener("click", startGame);
if (zapBtn) zapBtn.addEventListener("click", fireThunderbolt);
if (muteBGMBtn)  muteBGMBtn.addEventListener("click", toggleBGM);
if (muteSFXBtn)  muteSFXBtn.addEventListener("click", toggleSFX);
if (mobileBGMBtn) mobileBGMBtn.addEventListener("click", toggleBGM);
if (mobileSFXBtn) mobileSFXBtn.addEventListener("click", toggleSFX);

// Jump — desktop button
let lastJumpClick = 0;
if (jumpBtn) jumpBtn.addEventListener("click", () => {
  const now=Date.now(), dbl=now-lastJumpClick<300; lastJumpClick=now;
  if (!isJumping) handleJump(true); else if(dbl) handleJump(false);
});

// Jump — mobile button
if (mobileJumpBtn) {
  let mLast=0;
  mobileJumpBtn.addEventListener("click", () => {
    const now=Date.now(), dbl=now-mLast<300; mLast=now;
    if (!isJumping) handleJump(true); else if(dbl) handleJump(false);
  });
}

// Keyboard
document.addEventListener("keydown", e => {
  if (!gameStarted || gameOver) return;
  // Jump
  if (e.code==="Space"||e.code==="ArrowUp") {
    e.preventDefault();
    if (!isJumping) handleJump(true); else handleJump(false);
  }
  // ZAP — Right Arrow OR Z OR X
  if (e.code==="ArrowRight"||e.code==="KeyZ"||e.code==="KeyX") {
    e.preventDefault();
    fireThunderbolt();
  }
});

// ══════════════════════════════════════════════════════════════
//  INITIAL SCREEN
// ══════════════════════════════════════════════════════════════
window.onload = function () {
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(ground, 0, groundY, canvas.width, 100);
  ctx.drawImage(pikachuIdle, pikachu.x, groundY-pikachu.height+10, pikachu.width, pikachu.height);
  if (mobileBGMBtn) mobileBGMBtn.textContent="🎶";
  if (mobileSFXBtn) mobileSFXBtn.textContent="🔊";
  updateHUD();
};