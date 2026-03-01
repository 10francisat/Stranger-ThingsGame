// ================= MENU BACKGROUND =================
document.body.classList.add("menu-active");

// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const gameOverDiv = document.getElementById("gameOver");

// ================= AUDIO SYSTEM =================
const bgMusic = new Audio("assets/background-music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

const roarSound = new Audio("assets/demogorgon-roar.mp3");
roarSound.volume = 0.65;

function playBackgroundMusic() {
  if (bgMusic.paused) {
    bgMusic.play().catch(e => console.log("Music waiting for interaction..."));
  }
}

// ================= JUICE & STATE =================
let screenShake = 0;
let hitFlash = 0;
let slowMotionTimer = 0;
let deathZoom = 1;
let particles = [];
let isDucking = false; 

// ================= HITBOX TUNING =================
const DEMO_HITBOX = { left: 110, right: 110, top: 45, bottom: 12 };

// ================= DIFFICULTY CONTROL =================
let difficultyLevel = 0;
const SPAWN_BASE_MIN = 950;
const SPAWN_BASE_MAX = 1700;
const SPAWN_MIN_LIMIT = 600;

// ================= RESPONSIVE CANVAS =================
let GROUND_Y = 320;
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GROUND_Y = Math.floor(canvas.height * 0.7);
}
window.addEventListener("resize", resizeCanvas);
setTimeout(resizeCanvas, 50);

// ================= ASSETS (4-Frame Sequence) =================
const characters = [
  { name: "MIKE", img1: "assets/mike1.png", img2: "assets/mike.png", img3: "assets/mike2.png" },
  { name: "DUSTIN", img1: "assets/dustin1.png", img2: "assets/dustin.png", img3: "assets/dustin2.png" },
  { name: "LUCAS", img1: "assets/lucas1.png", img2: "assets/lucas.png", img3: "assets/lucas2.png" },
  { name: "MAX", img1: "assets/max1.png", img2: "assets/max.png", img3: "assets/max2.png" },
  { name: "EL", img1: "assets/el1.png", img2: "assets/el.png", img3: "assets/el2.png" },
  { name: "WILL", img1: "assets/will1.png", img2: "assets/will.png", img3: "assets/will2.png" }
];

const characterImages = {};
characters.forEach(c => {
  const img1 = new Image(); img1.src = c.img1;
  const imgN = new Image(); imgN.src = c.img2;
  const img2 = new Image(); img2.src = c.img3;
  characterImages[c.name] = [img1, imgN, img2, imgN]; 
});

const demogorgonImg = new Image();
demogorgonImg.src = "assets/demogorgon.png";

const demobatImg = new Image(); 
demobatImg.src = "assets/demobat.png"; 

const bgImg = new Image();
bgImg.src = "assets/game-bg.png";

// ================= CHARACTER SELECT =================
let selectedCharacter = null;
const charContainer = document.getElementById("characters");

characters.forEach(char => {
  const div = document.createElement("div");
  div.className = "character";
  div.innerText = char.name;
  div.onclick = () => {
    playBackgroundMusic();
    document.querySelectorAll(".character").forEach(c => c.classList.remove("selected"));
    div.classList.add("selected");
    selectedCharacter = char;
  };
  charContainer.appendChild(div);
});

// ================= GAME VARIABLES =================
let player, obstacles, worldSpeed, score, gameRunning;
let lastSpawn = 0, nextSpawnDelay = 0, distanceTravelled = 0;

function getHighScore() { return Number(localStorage.getItem("upsidedown_highscore") || 0); }
function setHighScore(s) { localStorage.setItem("upsidedown_highscore", s); }
function getHighScoreName() { return localStorage.getItem("upsidedown_highscore_name") || "---"; }
function setHighScoreName(n) { localStorage.setItem("upsidedown_highscore_name", n); }

let playerName = "Player";

// ================= PARTICLES =================
function spawnParticles(x, y) {
  for (let i = 0; i < 25; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 40 + Math.random() * 20
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
  });
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  ctx.fillStyle = "rgba(255,50,50,0.9)";
  particles.forEach(p => ctx.fillRect(p.x, p.y, 3, 3));
}

// ================= RESET GAME =================
function resetGame() {
  player = {
    x: Math.floor(canvas.width * 0.4), y: GROUND_Y, vy: 0,
    width: 120, height: 120,
    jumping: false,
    sprites: characterImages[selectedCharacter.name], 
    frameIndex: 0, 
    animTimer: 0
  };
  obstacles = [];
  worldSpeed = 8;
  score = 0;
  distanceTravelled = 0;
  gameRunning = true;
  difficultyLevel = 0;
  screenShake = 0;
  hitFlash = 0;
  slowMotionTimer = 0;
  deathZoom = 1;
  particles = [];
  lastSpawn = 0;
  nextSpawnDelay = 1100 + Math.random() * 2000;
}

// ================= START BUTTON =================
document.getElementById("startBtn").onclick = () => {
  if (!selectedCharacter) { alert("Choose a character first!"); return; }
  const nameVal = document.getElementById("playerNameInput").value.trim();
  playerName = nameVal.length > 0 ? nameVal : "Player";
  playBackgroundMusic();
  menu.style.display = "none";
  canvas.style.display = "block";
  document.body.classList.remove("menu-active");
  resizeCanvas();
  resetGame();
  requestAnimationFrame(gameLoop);
};

// ================= INPUT (JUMP & DUCK) =================
document.addEventListener("keydown", e => {
  if ((e.code === "Space" || e.code === "ArrowUp") && player && !player.jumping && !isDucking) {
    player.vy = -18;
    player.jumping = true;
  }
  if (e.code === "ArrowDown" || e.code === "KeyS") {
    isDucking = true;
  }
});

document.addEventListener("keyup", e => {
  if (e.code === "ArrowDown" || e.code === "KeyS") {
    isDucking = false;
  }
});

// ================= MPU-6050 GESTURE CONTROL =================
const ESP_IP = "10.74.15.1"; // 🔁 replace with your ESP's IP from Serial Monitor

let lastSensorState = 0;
let sensorCooldown = 0;

async function pollSensor() {
  try {
    const res = await fetch(`http://${ESP_IP}/sensor`);
    const val = await res.text(); // "jump", "crouch", or "none"

    if (sensorCooldown > 0) { sensorCooldown--; }

    if (val.trim() === "jump" && lastSensorState !== 1 && sensorCooldown === 0) {
      if (player && !player.jumping && !isDucking) {
        player.vy = -18;
        player.jumping = true;
        sensorCooldown = 20;
      }
      lastSensorState = 1;
    } else if (val.trim() === "crouch") {
      isDucking = true;
      lastSensorState = 2;
    } else if (val.trim() === "none") {
      isDucking = false;
      lastSensorState = 0;
    }
  } catch (e) {
    // ESP unreachable, silently ignore — keyboard still works
  }
}

setInterval(pollSensor, 100); // poll 10x per second

// ================= SMART SPAWN =================
function spawnObstacle() {
  const isAirEnemy = Math.random() > 0.7; 
  
  let obsWidth, obsHeight, obsY;

  if (isAirEnemy) {
    obsWidth = 80;
    obsHeight = 65;
    obsY = GROUND_Y - 55;
  } else {
    obsWidth = 75;
    obsHeight = 120;
    obsY = GROUND_Y;
  }

  obstacles.push({
    x: canvas.width + 120,
    y: obsY, 
    width: obsWidth,
    height: obsHeight,
    type: isAirEnemy ? "demobat" : "demogorgon"
  });

  difficultyLevel = Math.floor(distanceTravelled / 2500);
  let minDelay = Math.max(SPAWN_MIN_LIMIT, SPAWN_BASE_MIN - difficultyLevel * 60);
  let maxDelay = Math.max(minDelay + 120, SPAWN_BASE_MAX - difficultyLevel * 90);
  nextSpawnDelay = minDelay + Math.random() * (maxDelay - minDelay);
}

// ================= GAME LOOP =================
function gameLoop(timestamp) {
  if (!gameRunning) {
    drawDeathSequence();
    return;
  }

  let speedMultiplier = slowMotionTimer > 0 ? 0.35 : 1;
  if (slowMotionTimer > 0) slowMotionTimer--;

  let shakeX = 0, shakeY = 0;
  if (screenShake > 0) {
    shakeX = (Math.random() - 0.5) * screenShake;
    shakeY = (Math.random() - 0.5) * screenShake;
    screenShake *= 0.9;
  }

  ctx.save();
  if (deathZoom > 1) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(deathZoom, deathZoom);
    ctx.translate(-canvas.width / 2 + shakeX, -canvas.height / 2 + shakeY);
  } else {
    ctx.translate(shakeX, shakeY);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); 
  const bgScroll = distanceTravelled * 0.4;
  const bgWidth = canvas.width;
  ctx.drawImage(bgImg, -(bgScroll % bgWidth), 0, bgWidth, canvas.height);
  ctx.drawImage(bgImg, -(bgScroll % bgWidth) + bgWidth, 0, bgWidth, canvas.height);

  score += 0.1 * speedMultiplier;
  distanceTravelled += worldSpeed * speedMultiplier;

  if (timestamp - lastSpawn > nextSpawnDelay) {
    spawnObstacle();
    lastSpawn = timestamp;
  }

  player.vy += 0.9 * speedMultiplier;
  player.y += player.vy;
  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.vy = 0;
    player.jumping = false;
  }

  player.animTimer += speedMultiplier;
  if (player.animTimer > 7) {
    player.frameIndex = (player.frameIndex + 1) % 4; 
    player.animTimer = 0;
  }

  let currentSprite = player.sprites[player.frameIndex];
  if (player.jumping || isDucking) {
    currentSprite = player.sprites[1]; 
  }

  let drawH = player.height;
  let drawY = player.y - player.height;
  
  if (isDucking && !player.jumping) {
    drawH = player.height * 0.55; 
    drawY = player.y - drawH;
  }

  ctx.drawImage(currentSprite, player.x, drawY, player.width, drawH);

  for (let obs of obstacles) {
    obs.x -= (worldSpeed + (difficultyLevel * 0.5)) * speedMultiplier;

    if (obs.type === "demobat") {
      ctx.drawImage(demobatImg, obs.x, obs.y - obs.height, obs.width, obs.height);
    } else {
      ctx.drawImage(demogorgonImg, obs.x, obs.y - obs.height, obs.width, obs.height);
    }

    let obstacleTop = obs.y - obs.height + 15;
    if (obs.type === "demobat") {
      obstacleTop = -1000;
    }

    const pBox = {
      left: player.x + 20,
      right: player.x + player.width - 20,
      top: drawY + 10,
      bottom: player.y
    };

    const oBox = {
      left: obs.x + 15,
      right: obs.x + obs.width - 15,
      top: obstacleTop,
      bottom: obs.y - 10            
    };

    if (pBox.right > oBox.left && pBox.left < oBox.right && pBox.bottom > oBox.top && pBox.top < oBox.bottom) {
      triggerDeathFX();
      return;
    }
  }

  obstacles = obstacles.filter(o => o.x > -120);
  updateParticles();
  drawParticles();

  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255,0,0,${hitFlash})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hitFlash *= 0.9;
  }

  ctx.fillStyle = "white";
  ctx.font = "20px Consolas";
  ctx.fillText("Score: " + Math.floor(score), 20, 30);

  // Persistent best score below current score
  ctx.font = "15px Consolas";
  ctx.fillStyle = "rgba(255, 80, 80, 0.85)";
  ctx.fillText("Best: " + getHighScore() + "  (" + getHighScoreName() + ")", 20, 54);

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

function triggerDeathFX() {
  gameRunning = false;
  screenShake = 25;
  hitFlash = 0.6;
  slowMotionTimer = 25;
  deathZoom = 1.15;
  deathFrames = 40; 
  spawnParticles(player.x + 30, player.y - 30);
  try { roarSound.currentTime = 0; roarSound.play(); } catch (e) {}
  requestAnimationFrame(drawDeathSequence);
}

function drawDeathSequence() {
  if (deathFrames <= 0) { endGame(); return; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bgScroll = distanceTravelled * 0.4;
  const bgWidth = canvas.width;
  ctx.drawImage(bgImg, -(bgScroll % bgWidth), 0, bgWidth, canvas.height);
  ctx.drawImage(bgImg, -(bgScroll % bgWidth) + bgWidth, 0, bgWidth, canvas.height);
  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255,0,0,${hitFlash})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hitFlash *= 0.9;
  }
  updateParticles();
  drawParticles();
  deathFrames--;
  requestAnimationFrame(drawDeathSequence);
}

function endGame() {
  let hs = getHighScore();
  let hsName = getHighScoreName();
  if (score > hs) {
    setHighScore(Math.floor(score));
    setHighScoreName(playerName);
    hs = Math.floor(score);
    hsName = playerName;
  }
  document.getElementById("scoreText").innerText = playerName + "'s Score: " + Math.floor(score);
  document.getElementById("highScoreText").innerText = "High Score: " + hs + "  (" + hsName + ")";
  canvas.style.display = "none";
  gameOverDiv.classList.remove("hidden");
}

function restartGame() {
  gameOverDiv.classList.add("hidden");
  canvas.style.display = "none";
  menu.style.display = "flex";
  document.body.classList.add("menu-active");
  playBackgroundMusic();
}