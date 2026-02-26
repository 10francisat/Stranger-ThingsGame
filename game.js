// ================= MENU BACKGROUND =================
document.body.classList.add("menu-active");

// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const gameOverDiv = document.getElementById("gameOver");

// ================= JUICE SYSTEM =================
let screenShake = 0;
let hitFlash = 0;
let slowMotionTimer = 0;
let deathZoom = 1;
let particles = [];

// 🔊 demogorgon roar
const roarSound = new Audio("assets/demogorgon-roar.mp3");
roarSound.volume = 0.65;

// ================= HITBOX TUNING =================
const DEMO_HITBOX = {
  left: 50,
  right: 50,
  top: 45,
  bottom: 12
};

// ================= DIFFICULTY CONTROL =================
let difficultyLevel = 0;

const SPAWN_BASE_MIN = 700;
const SPAWN_BASE_MAX = 1400;
const SPAWN_MIN_LIMIT = 380;

// ================= RESPONSIVE CANVAS =================
let GROUND_Y = 320;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GROUND_Y = Math.floor(canvas.height * 0.7);
}

window.addEventListener("resize", resizeCanvas);
setTimeout(resizeCanvas, 50);

// ================= CHARACTERS =================
const characters = [
  { name: "MIKE", img: "assets/mike.png" },
  { name: "DUSTIN", img: "assets/dustin.png" },
  { name: "LUCAS", img: "assets/lucas.png" },
  { name: "MAX", img: "assets/max.png" },
  { name: "EL", img: "assets/el.png" },
  { name: "WILL", img: "assets/will.png" }
];

// ================= IMAGE LOADING =================
const characterImages = {};
characters.forEach(c => {
  const img = new Image();
  img.src = c.img;
  characterImages[c.name] = img;
});

const demogorgonImg = new Image();
demogorgonImg.src = "assets/demogorgon.png";

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
    document.querySelectorAll(".character")
      .forEach(c => c.classList.remove("selected"));
    div.classList.add("selected");
    selectedCharacter = char;
  };

  charContainer.appendChild(div);
});

// ================= GAME VARIABLES =================
let player, obstacles, speed, worldSpeed, score, gameRunning;
let lastSpawn = 0;
let nextSpawnDelay = 0;
let distanceTravelled = 0;

// ================= HIGH SCORE =================
function getHighScore() {
  return Number(localStorage.getItem("upsidedown_highscore") || 0);
}

function setHighScore(s) {
  localStorage.setItem("upsidedown_highscore", s);
}

// ================= PARTICLES =================
function spawnParticles(x, y) {
  for (let i = 0; i < 25; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 40 + Math.random() * 20
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  ctx.fillStyle = "rgba(255,50,50,0.9)";
  particles.forEach(p => {
    ctx.fillRect(p.x, p.y, 3, 3);
  });
}

// ================= RESET GAME =================
function resetGame() {
  player = {
    x: 50,
    y: GROUND_Y,
    vy: 0,
    width: 100,
    height: 100,
    jumping: false,
    sprite: characterImages[selectedCharacter.name]
  };

  obstacles = [];

  speed = 5;
  worldSpeed = 5;
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
  nextSpawnDelay = 900 + Math.random() * 1400;
}

// ================= START BUTTON =================
document.getElementById("startBtn").onclick = () => {
  if (!selectedCharacter) {
    alert("Choose a character first!");
    return;
  }

  menu.style.display = "none";
  canvas.style.display = "block";
  document.body.classList.remove("menu-active");

  resizeCanvas();
  resetGame();

  requestAnimationFrame(gameLoop);
};

// ================= INPUT =================
document.addEventListener("keydown", e => {
  if (e.code === "Space" && player && !player.jumping) {
    player.vy = -18;
    player.jumping = true;
  }
});

// ================= SMART SPAWN =================
function spawnObstacle() {
  obstacles.push({
    x: canvas.width + 120,
    width: 70,
    height: 90
  });

  // 🎯 difficulty scaling
  difficultyLevel = Math.floor(distanceTravelled / 2500);

  let minDelay = SPAWN_BASE_MIN - difficultyLevel * 60;
  let maxDelay = SPAWN_BASE_MAX - difficultyLevel * 90;

  minDelay = Math.max(SPAWN_MIN_LIMIT, minDelay);
  maxDelay = Math.max(minDelay + 120, maxDelay);

  nextSpawnDelay =
    minDelay + Math.random() * (maxDelay - minDelay);

  // anti-clump protection
  if (obstacles.length > 2) {
    nextSpawnDelay += 120;
  }
}

// ================= GAME LOOP =================
function gameLoop(timestamp) {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let speedMultiplier = slowMotionTimer > 0 ? 0.35 : 1;
  if (slowMotionTimer > 0) slowMotionTimer--;

  // screen shake
  let shakeX = 0;
  let shakeY = 0;
  if (screenShake > 0) {
    shakeX = (Math.random() - 0.5) * screenShake;
    shakeY = (Math.random() - 0.5) * screenShake;
    screenShake *= 0.9;
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(deathZoom, deathZoom);
  ctx.translate(-canvas.width / 2 + shakeX, -canvas.height / 2 + shakeY);

  // background scroll
  const bgScroll = distanceTravelled * 0.4;
  const bgWidth = canvas.width;

  ctx.drawImage(bgImg, -bgScroll % bgWidth, 0, bgWidth, canvas.height);
  ctx.drawImage(bgImg, (-bgScroll % bgWidth) + bgWidth, 0, bgWidth, canvas.height);

  score += 0.1 * speedMultiplier;

  // player forward drift
  if (player.x < canvas.width * 0.25) {
    player.x += worldSpeed * 0.4 * speedMultiplier;
  }

  // spawn
  if (timestamp - lastSpawn > nextSpawnDelay) {
    spawnObstacle();
    lastSpawn = timestamp;
  }

  // physics
  player.vy += 0.9 * speedMultiplier;
  player.y += player.vy;

  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.vy = 0;
    player.jumping = false;
  }

  distanceTravelled += worldSpeed * speedMultiplier;

  // draw player
  ctx.drawImage(
    player.sprite,
    player.x,
    player.y - player.height,
    player.width,
    player.height
  );

  // demogorgons
  for (let obs of obstacles) {
    obs.x -= worldSpeed * speedMultiplier;

    ctx.drawImage(
      demogorgonImg,
      obs.x,
      GROUND_Y - obs.height,
      obs.width,
      obs.height
    );

    // collision
    const hitLeft = obs.x + DEMO_HITBOX.left;
    const hitRight = obs.x + obs.width - DEMO_HITBOX.right;
    const hitTop = GROUND_Y - obs.height + DEMO_HITBOX.top;
    const hitBottom = GROUND_Y - DEMO_HITBOX.bottom;

    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y - player.height;
    const playerBottom = player.y;

    if (
      playerRight > hitLeft &&
      playerLeft < hitRight &&
      playerBottom > hitTop &&
      playerTop < hitBottom
    ) {
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

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

// ================= CINEMATIC DEATH =================
function triggerDeathFX() {
  gameRunning = false;

  screenShake = 25;
  hitFlash = 0.6;
  slowMotionTimer = 25;
  deathZoom = 1.15;

  spawnParticles(player.x + 30, player.y - 30);

  try {
    roarSound.currentTime = 0;
    roarSound.play();
  } catch (e) {}

  setTimeout(endGame, 900);
}

// ================= GAME OVER =================
function endGame() {
  let hs = getHighScore();
  if (score > hs) {
    setHighScore(Math.floor(score));
    hs = Math.floor(score);
  }

  document.getElementById("scoreText").innerText =
    "Your Score: " + Math.floor(score);

  document.getElementById("highScoreText").innerText =
    "High Score: " + hs;

  canvas.style.display = "none";
  gameOverDiv.classList.remove("hidden");
}

// ================= RESTART =================
function restartGame() {
  gameOverDiv.classList.add("hidden");
  canvas.style.display = "none";
  menu.style.display = "flex";
  document.body.classList.add("menu-active");
}