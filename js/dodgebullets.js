const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const playerSpeed = 6;
const mobileSpeed = 3;

let player = {
  x: 400,
  y: 300,
  size: 20,
  speed: playerSpeed,
  angle: 0,
  health: 100,
  invincible: false,
};
let bullets = [];
let explosions = [];
let gameInterval;
let bulletInterval;
let gameOver = false;
let startTime;
let keysPressed = {};
let gameTime = 0;
let highScore = parseFloat(localStorage.getItem("dodgebullets-highScore")) || 0;
let touchStartX = 0;
let touchStartY = 0;

const shapes = ["circle", "diamond", "square"];
const speeds = [2, 3, 4, 5, 6];
const colors = ["#FF0000", "#00FF00", "#0000FF"];

function startGame() {
  clearIntervals(); // 確保清除所有的計時器

  document.getElementById("start-game").style.display = "none";
  document.getElementById("game-over").style.display = "none";
  canvas.style.display = "block"; // 顯示畫布
  player = {
    x: 400,
    y: 300,
    size: 20,
    speed: playerSpeed,
    angle: 0,
    health: 100,
    invincible: false,
  };
  bullets = [];
  explosions = [];
  gameOver = false;
  startTime = Date.now();

  // 初始化生成5顆飛彈
  spawnBullets(5);

  gameInterval = setInterval(gameLoop, 16);
  bulletInterval = setInterval(spawnBulletsWithIncreasingCount, 1000);

  // 添加觸控事件監聽
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
}

function clearIntervals() {
  clearInterval(gameInterval);
  clearInterval(bulletInterval);
  canvas.removeEventListener("touchstart", handleTouchStart);
  canvas.removeEventListener("touchmove", handleTouchMove);
  canvas.removeEventListener("touchend", handleTouchEnd);
}

function handleTouchStart(event) {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function handleTouchMove(event) {
  const touch = event.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  keysPressed["ArrowUp"] = dy < -10;
  keysPressed["ArrowDown"] = dy > 10;
  keysPressed["ArrowLeft"] = dx < -10;
  keysPressed["ArrowRight"] = dx > 10;

  player.speed = mobileSpeed; // 當使用手勢時，調整飛行器的速度

  updatePlayerAngle(dx, dy);
}

function handleTouchEnd(event) {
  keysPressed = {};
  player.speed = playerSpeed; // 手勢結束後恢復飛行器速度
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameOver) {
    updatePlayerPosition();
    drawPlayer();
    moveBullets();
    drawBullets();
    checkCollisions();
    updateGameTime();
  }
  moveExplosions();
  drawExplosions();
  drawHealthBar();
}

function updatePlayerPosition() {
  let dx = 0,
    dy = 0;

  if (keysPressed["ArrowUp"]) dy -= player.speed;
  if (keysPressed["ArrowDown"]) dy += player.speed;
  if (keysPressed["ArrowLeft"]) dx -= player.speed;
  if (keysPressed["ArrowRight"]) dx += player.speed;

  const newX = player.x + dx;
  const newY = player.y + dy;

  // 確保飛行器不會超出畫布
  if (newX >= player.size && newX <= canvas.width - player.size) {
    player.x = newX;
  }
  if (newY >= player.size && newY <= canvas.height - player.size) {
    player.y = newY;
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate((player.angle * Math.PI) / 180);

  // 繪製像素風格戰鬥機造型
  ctx.fillStyle = "white";
  ctx.fillRect(
    -player.size / 2,
    -player.size / 2,
    player.size,
    player.size / 2
  ); // 機身
  ctx.fillRect(
    -player.size / 4,
    -player.size,
    player.size / 2,
    player.size / 2
  ); // 機頭
  ctx.fillRect(-player.size / 2, 0, player.size / 4, player.size / 4); // 左翼
  ctx.fillRect(player.size / 4, 0, player.size / 4, player.size / 4); // 右翼

  ctx.restore();
}

function moveBullets() {
  bullets = bullets.filter((bullet) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    return (
      bullet.x >= 0 &&
      bullet.x <= canvas.width &&
      bullet.y >= 0 &&
      bullet.y <= canvas.height
    );
  });
}

function drawBullets() {
  for (let bullet of bullets) {
    ctx.fillStyle = bullet.color;
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.fillRect(-bullet.size / 2, -bullet.size / 2, bullet.size, bullet.size); // 繪製像素風格的飛彈
    ctx.restore();
  }
}

function spawnBullet() {
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const speed = speeds[Math.floor(Math.random() * speeds.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 4 + 4; // 大小在4到8之間隨機

  switch (edge) {
    case 0: // Top edge
      x = Math.random() * canvas.width;
      y = 0;
      break;
    case 1: // Bottom edge
      x = Math.random() * canvas.width;
      y = canvas.height;
      break;
    case 2: // Left edge
      x = 0;
      y = Math.random() * canvas.height;
      break;
    case 3: // Right edge
      x = canvas.width;
      y = Math.random() * canvas.height;
      break;
  }

  const angle = Math.atan2(player.y - y, player.x - x);
  vx = speed * Math.cos(angle);
  vy = speed * Math.sin(angle);

  bullets.push({
    x: x,
    y: y,
    size: size,
    vx: vx,
    vy: vy,
    shape: shape,
    color: color,
  });
}

function spawnBullets(number) {
  for (let i = 0; i < number; i++) {
    spawnBullet();
  }
}

function spawnBulletsWithIncreasingCount() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const maxBullets = Math.min(5 + elapsed, 16); // 每秒增加1顆飛彈，最多同時生成16顆
  const currentBullets = bullets.length;
  if (currentBullets < maxBullets && bullets.length < 80) {
    // 所有飛彈總數不超過80
    spawnBullets(maxBullets - currentBullets);
  }
}

function checkCollisions() {
  if (player.invincible) return; // 如果玩家處於無敵狀態，跳過碰撞檢測

  for (let bullet of bullets) {
    const dx = bullet.x - player.x;
    const dy = bullet.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bullet.size + player.size) {
      createExplosion(player.x, player.y);
      player.health -= 20;
      player.invincible = true;
      setTimeout(() => {
        player.invincible = false;
      }, 1000); // 1秒無敵時間
      if (player.health <= 0) {
        endGame();
      }
      break; // 防止多次減少健康值
    }
  }
}

function createExplosion(x, y) {
  explosions.push({ x: x, y: y, radius: 0 });
}

function moveExplosions() {
  for (let explosion of explosions) {
    explosion.radius += 2; // 調整這個值可以改變爆炸效果的擴散速度
  }
  explosions = explosions.filter((explosion) => explosion.radius < 50); // 調整這個值可以改變爆炸效果持續時間
}

function drawExplosions() {
  for (let explosion of explosions) {
    ctx.save();
    ctx.translate(explosion.x, explosion.y);
    ctx.fillStyle = "rgba(255, 69, 0, 0.5)"; // 爆炸效果顏色
    ctx.fillRect(
      -explosion.radius,
      -explosion.radius,
      explosion.radius * 2,
      explosion.radius * 2
    ); // 繪製像素風格的爆炸效果
    ctx.restore();
  }
}

function updateGameTime() {
  const elapsed = Date.now() - startTime;
  gameTime = (elapsed / 1000).toFixed(3); // 顯示到毫秒
  ctx.fillStyle = "white";
  ctx.font = '20px "Press Start 2P"';
  ctx.fillText(`Time: ${gameTime}s`, 10, 30);
}

function drawHealthBar() {
  ctx.fillStyle = "white";
  ctx.fillRect(canvas.width - 110, 10, 100, 20);
  ctx.fillStyle = "red";
  ctx.fillRect(canvas.width - 110, 10, player.health, 20);
  ctx.strokeStyle = "black";
  ctx.strokeRect(canvas.width - 110, 10, 100, 20);
}

function endGame() {
  clearInterval(bulletInterval);
  canvas.style.display = "none"; // 隱藏畫布
  gameOver = true;
  document.getElementById(
    "time-display"
  ).innerText = `你存活了 ${gameTime} 秒！`; // 顯示遊戲時間

  // 更新最高分數
  if (parseFloat(gameTime) > parseFloat(highScore)) {
    highScore = gameTime;
    localStorage.setItem("dodgebullets-highScore", highScore);
  }

  document.getElementById(
    "high-score-display"
  ).innerText = `最高紀錄： ${highScore} 秒！`; // 顯示最高分數

  setTimeout(() => {
    document.getElementById("game-over").style.display = "block";
  }, 1000); // 延遲顯示game over屏幕
}

document.addEventListener("keydown", (e) => {
  keysPressed[e.key] = true;
  updatePlayerAngle();
});

document.addEventListener("keyup", (e) => {
  keysPressed[e.key] = false;
});

function updatePlayerAngle(dx = 0, dy = 0) {
  if (keysPressed["ArrowUp"]) dy -= 1;
  if (keysPressed["ArrowDown"]) dy += 1;
  if (keysPressed["ArrowLeft"]) dx -= 1;
  if (keysPressed["ArrowRight"]) dx += 1;

  if (dx !== 0 || dy !== 0) {
    if (dx === 0 && dy < 0) {
      player.angle = 0;
    } else if (dx > 0 && dy < 0) {
      player.angle = 45;
    } else if (dx > 0 && dy === 0) {
      player.angle = 90;
    } else if (dx > 0 && dy > 0) {
      player.angle = 135;
    } else if (dx === 0 && dy > 0) {
      player.angle = 180;
    } else if (dx < 0 && dy > 0) {
      player.angle = 225;
    } else if (dx < 0 && dy === 0) {
      player.angle = 270;
    } else if (dx < 0 && dy < 0) {
      player.angle = 315;
    }
  }
}
