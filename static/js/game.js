// Sunset Fall - Game Engine & Canvas Renderer
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 480;
const HEIGHT = 640;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const currentStageDisplay = document.getElementById('currentStageDisplay');
const prevStageBtn = document.getElementById('prevStageBtn');
const nextStageBtn = document.getElementById('nextStageBtn');

function updateStageDisplay() {
  const stage = STAGES[currentStageIndex];
  if (currentStageDisplay) {
    currentStageDisplay.textContent = `第 ${currentStageIndex + 1} 幕 · ${stage.name}`;
  }
  drawScene(performance.now());
}

if (prevStageBtn) {
  prevStageBtn.addEventListener('click', () => {
    window.soundManager.playClickSound();
    currentStageIndex = (currentStageIndex - 1 + STAGES.length) % STAGES.length;
    updateStageDisplay();
  });
}

if (nextStageBtn) {
  nextStageBtn.addEventListener('click', () => {
    window.soundManager.playClickSound();
    currentStageIndex = (currentStageIndex + 1) % STAGES.length;
    updateStageDisplay();
  });
}
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startGameBtn = document.getElementById('startGameBtn');
const retryBtn = document.getElementById('retryBtn');
const scoreSubmitForm = document.getElementById('scoreSubmitForm');
const playerNameInput = document.getElementById('playerNameInput');
const submitMsg = document.getElementById('submitMsg');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const rankingList = document.getElementById('rankingList');
const refreshRankingBtn = document.getElementById('refreshRankingBtn');
const finalScoreEl = document.getElementById('finalScore');
const finalTimeEl = document.getElementById('finalTime');
const finalStarsEl = document.getElementById('finalStars');

// Global Stats Elements
const globalHighScore = document.getElementById('globalHighScore');
const globalTotalPlays = document.getElementById('globalTotalPlays');
const globalTotalStars = document.getElementById('globalTotalStars');
const globalAvgScore = document.getElementById('globalAvgScore');

// Game State
let isPlaying = false;
let isGameOver = false;
let startTime = 0;
let elapsedTime = 0;
let score = 0;
let starsCollected = 0;
let difficultyFactor = 1.0;

// Input Handling
const keys = {
  left: false,
  right: false,
  mouseX: WIDTH / 2,
  useMouse: false
};

// Player Object
const player = {
  x: WIDTH / 2,
  y: HEIGHT - 80,
  width: 32,
  height: 24,
  speed: 6.5,
  tilt: 0,
  trail: []
};

// Entities & Particles
let obstacles = [];
let stars = [];
let particles = [];
let floatingTexts = [];
let birds = [];
let sakuraPetals = [];

// 9つのエモい背景ステージ定義（3x3グリッド画像）
const bgImage = new Image();
bgImage.src = '/static/images/backgrounds_grid.jpg';
let bgImageLoaded = false;
bgImage.onload = () => {
  bgImageLoaded = true;
};

const STAGES = [
  { name: '茜空の鳥居', sub: '夕日と鳥居が水面に沈む刻', col: 0, row: 0, theme: 'sunset' },
  { name: '月下の桜城', sub: '満月と夜桜に抱かれた天守閣', col: 1, row: 0, theme: 'moon' },
  { name: '宵闇の楼閣', sub: '提灯が灯る高台から望む黄昏', col: 2, row: 0, theme: 'twilight' },
  { name: '薄紅の太鼓橋', sub: '石灯籠と桜のアーチを渡る風', col: 0, row: 1, theme: 'sakura' },
  { name: '黄金蒔絵の夜桜', sub: '金箔と月光が紡ぐ幻想美', col: 1, row: 1, theme: 'gold' },
  { name: '雨月と紫陽花', sub: '雨露に濡れる夜と青い花弁', col: 2, row: 1, theme: 'rain' },
  { name: '星降る水辺', sub: 'すすきの原を照らす天の川', col: 0, row: 2, theme: 'star' },
  { name: '黄昏の茜雲', sub: '帰り道を染める懐かしい夕焼け', col: 1, row: 2, theme: 'dusk' },
  { name: '提灯の灯る夜桜', sub: '祭りの余韻が漂う春の宵', col: 2, row: 2, theme: 'festival' }
];

let currentStageIndex = 0;
let stageBannerTimer = 0; // ステージ開始時のバナー表示タイマー

// 桜の花びらパーティクルの初期化
function initSakuraPetals() {
  sakuraPetals = [];
  for (let i = 0; i < 18; i++) {
    sakuraPetals.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: 4 + Math.random() * 5,
      speedY: 0.8 + Math.random() * 1.2,
      speedX: (Math.random() - 0.3) * 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      oscillation: Math.random() * Math.PI * 2,
      oscSpeed: 0.03 + Math.random() * 0.03
    });
  }
}
function initBirds() {
  birds = [];
  for (let i = 0; i < 4; i++) {
    birds.push({
      x: Math.random() * WIDTH,
      y: 60 + Math.random() * 140,
      speed: 0.6 + Math.random() * 0.5,
      size: 4 + Math.random() * 3,
      wingCycle: Math.random() * Math.PI * 2
    });
  }
}

// ----------------------------------------------------
// イベントリスナー
// ----------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = true;
    keys.useMouse = false;
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = true;
    keys.useMouse = false;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  keys.mouseX = (e.clientX - rect.left) * scaleX;
  keys.useMouse = true;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const touch = e.touches[0];
  if (touch) {
    keys.mouseX = (touch.clientX - rect.left) * scaleX;
    keys.useMouse = true;
  }
}, { passive: false });

soundToggleBtn.addEventListener('click', () => {
  const enabled = window.soundManager.toggleSound();
  soundToggleBtn.querySelector('.icon').textContent = enabled ? '🔊' : '🔇';
  soundToggleBtn.querySelector('.label').textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
});

startGameBtn.addEventListener('click', () => {
  window.soundManager.playClickSound();
  startOverlay.classList.add('hidden');
  resetGame(false); // 初回は Stage 0 (茜空の鳥居) からスタート
  startGame();
});

retryBtn.addEventListener('click', () => {
  window.soundManager.playClickSound();
  gameOverOverlay.classList.add('hidden');
  resetGame(true); // リトライ時は次のステージへ切り替え！
  startGame();
});

refreshRankingBtn.addEventListener('click', () => {
  window.soundManager.playClickSound();
  loadLeaderboard();
  loadStats();
});

// スコア送信
scoreSubmitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = playerNameInput.value.trim() || '名無しの旅人';
  submitScoreBtn.disabled = true;
  submitMsg.className = 'submit-msg';
  submitMsg.textContent = 'スコアを夕暮れの記録に刻んでいます...';

  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        score: score,
        survival_time: elapsedTime,
        stars: starsCollected
      })
    });
    const data = await res.json();
    if (data.success) {
      submitMsg.className = 'submit-msg success';
      submitMsg.textContent = data.rank ? `第 ${data.rank} 位にランクインしました！✨` : '記録を保存しました！';
      renderRanking(data.ranking);
      loadStats();
    } else {
      throw new Error(data.error || '送信失敗');
    }
  } catch (err) {
    submitMsg.className = 'submit-msg error';
    submitMsg.textContent = '送信に失敗しました: ' + err.message;
  } finally {
    submitScoreBtn.disabled = false;
  }
});

// ----------------------------------------------------
// ゲーム進行ロジック
// ----------------------------------------------------
function resetGame(nextStage = true) {
  if (nextStage) {
    // プレイごとに背景ステージを順番に切り替え！
    currentStageIndex = (currentStageIndex + 1) % STAGES.length;
  }
  updateStageDisplay();
  player.x = WIDTH / 2;
  player.tilt = 0;
  player.trail = [];
  obstacles = [];
  stars = [];
  particles = [];
  floatingTexts = [];
  score = 0;
  starsCollected = 0;
  elapsedTime = 0;
  difficultyFactor = 1.0;
  isGameOver = false;
  submitMsg.textContent = '';
  initBirds();
  initSakuraPetals();
  stageBannerTimer = 180; // 約3秒間ステージ名を表示
}

function startGame() {
  isPlaying = true;
  startTime = performance.now();
  window.soundManager.startBGM();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  isPlaying = false;
  isGameOver = true;
  window.soundManager.playCrashSound();
  window.soundManager.stopBGM();

  // 衝突爆発パーティクル
  createExplosion(player.x, player.y, '#ff4b5c', 40);
  createExplosion(player.x, player.y, '#ffc83b', 25);

  finalScoreEl.textContent = score.toLocaleString();
  finalTimeEl.textContent = elapsedTime.toFixed(1) + 's';
  finalStarsEl.textContent = starsCollected + ' ⭐';

  const currentStage = STAGES[currentStageIndex];
  const stageBadgeEl = document.getElementById('gameOverStageBadge');
  if (stageBadgeEl) {
    stageBadgeEl.textContent = `第 ${currentStageIndex + 1} 幕 · ${currentStage.name}`;
  }

  // 保存済みの前回の名前を補完
  const savedName = localStorage.getItem('sunset_player_name');
  if (savedName) playerNameInput.value = savedName;

  setTimeout(() => {
    gameOverOverlay.classList.remove('hidden');
    playerNameInput.focus();
  }, 700);
}

// ----------------------------------------------------
// メインループ
// ----------------------------------------------------
let lastObstacleSpawn = 0;
let lastStarSpawn = 0;

function gameLoop(now) {
  if (!isPlaying) {
    // ゲームオーバー後もパーティクルや煙は描画し続ける
    drawScene(now);
    updateParticles();
    drawParticles();
    return;
  }

  elapsedTime = (now - startTime) / 1000;
  // 時間経過で徐々に難易度UP
  difficultyFactor = 1.0 + Math.min(elapsedTime * 0.05, 3.0);
  score = Math.floor(elapsedTime * 15) + (starsCollected * 100);

  updatePlayer();
  spawnEntities(now);
  updateEntities();
  checkCollisions();
  updateParticles();
  updateSakuraPetals();
  updateBirds();

  drawScene(now);
  drawEntities();
  drawPlayer();
  drawParticles();
  drawHUD();

  requestAnimationFrame(gameLoop);
}

// ----------------------------------------------------
// プレイヤーの更新
// ----------------------------------------------------
function updatePlayer() {
  let targetX = player.x;

  if (keys.useMouse) {
    targetX = keys.mouseX;
    const diff = targetX - player.x;
    player.x += diff * 0.18;
    player.tilt = Math.max(-0.4, Math.min(0.4, diff * 0.02));
  } else {
    if (keys.left) {
      player.x -= player.speed;
      player.tilt = -0.3;
    } else if (keys.right) {
      player.x += player.speed;
      player.tilt = 0.3;
    } else {
      player.tilt *= 0.8;
    }
  }

  // 画面端の制限
  player.x = Math.max(player.width / 2, Math.min(WIDTH - player.width / 2, player.x));

  // 飛行の軌跡パーティクル
  if (Math.random() < 0.6) {
    particles.push({
      x: player.x + (Math.random() - 0.5) * 8,
      y: player.y + 12,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 2 + Math.random() * 2,
      size: 3 + Math.random() * 2,
      color: Math.random() < 0.5 ? '#ff7e47' : '#ffd166',
      alpha: 0.8,
      decay: 0.03
    });
  }
}

// ----------------------------------------------------
// エンティティ生成（落ちてくる夕日の破片＆星）
// ----------------------------------------------------
function spawnEntities(now) {
  // 夕日の破片（障害物）
  const obstacleInterval = Math.max(300, 900 / difficultyFactor);
  if (now - lastObstacleSpawn > obstacleInterval) {
    lastObstacleSpawn = now;
    const size = 18 + Math.random() * 22;
    obstacles.push({
      x: size + Math.random() * (WIDTH - size * 2),
      y: -size,
      size: size,
      speed: (2.8 + Math.random() * 2.2) * (0.8 + difficultyFactor * 0.25),
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      hue: 15 + Math.random() * 25 // 赤〜オレンジのフレア
    });
  }

  // 一番星（ボーナスアイテム）
  const starInterval = 3200;
  if (now - lastStarSpawn > starInterval) {
    lastStarSpawn = now;
    stars.push({
      x: 30 + Math.random() * (WIDTH - 60),
      y: -20,
      size: 14,
      speed: 2.2 + Math.random() * 1.0,
      angle: 0
    });
  }
}

function updateEntities() {
  // 障害物の移動
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.y += ob.speed;
    ob.rotation += ob.rotSpeed;

    // 落下炎パーティクル
    if (Math.random() < 0.4) {
      particles.push({
        x: ob.x + (Math.random() - 0.5) * ob.size * 0.6,
        y: ob.y,
        vx: (Math.random() - 0.5) * 1.0,
        vy: -0.5 - Math.random() * 1.5,
        size: 3 + Math.random() * 3,
        color: `hsl(${ob.hue}, 100%, 60%)`,
        alpha: 0.7,
        decay: 0.04
      });
    }

    if (ob.y > HEIGHT + 40) {
      obstacles.splice(i, 1);
    }
  }

  // 星の移動
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.y += s.speed;
    s.angle += 0.04;
    if (s.y > HEIGHT + 30) {
      stars.splice(i, 1);
    }
  }
}

function checkCollisions() {
  const px = player.x;
  const py = player.y;
  const pr = 12; // プレイヤーの当たり判定半径

  // 障害物との衝突
  for (let i = 0; i < obstacles.length; i++) {
    const ob = obstacles[i];
    const dist = Math.hypot(px - ob.x, py - ob.y);
    if (dist < pr + ob.size * 0.7) {
      gameOver();
      return;
    }
  }

  // 星の回収
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    const dist = Math.hypot(px - s.x, py - s.y);
    if (dist < pr + s.size + 10) {
      stars.splice(i, 1);
      starsCollected++;
      window.soundManager.playStarSound();
      createExplosion(s.x, s.y, '#ffea79', 15);
      floatingTexts.push({
        text: '+100 STAR!',
        x: s.x,
        y: s.y,
        alpha: 1.0
      });
    }
  }
}

// ----------------------------------------------------
// パーティクル & エフェクト
// ----------------------------------------------------
function createExplosion(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5.0;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color: color,
      alpha: 1.0,
      decay: 0.02 + Math.random() * 0.02
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 1.2;
    ft.alpha -= 0.025;
    if (ft.alpha <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

function updateBirds() {
  birds.forEach(b => {
    b.x += b.speed;
    b.wingCycle += 0.12;
    if (b.x > WIDTH + 30) {
      b.x = -30;
      b.y = 50 + Math.random() * 160;
    }
  });
}

function updateSakuraPetals() {
  sakuraPetals.forEach(p => {
    p.y += p.speedY;
    p.oscillation += p.oscSpeed;
    p.x += p.speedX + Math.sin(p.oscillation) * 0.7;
    p.rotation += p.rotSpeed;

    if (p.y > HEIGHT + 20) {
      p.y = -20;
      p.x = Math.random() * WIDTH;
    }
  });
}

function drawSakuraPetals() {
  sakuraPetals.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    
    // 花びらの淡いピンク〜桜色
    ctx.fillStyle = 'rgba(255, 192, 203, 0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 0.5, p.size, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawStageBanner() {
  if (stageBannerTimer <= 0) return;
  stageBannerTimer--;

  const stage = STAGES[currentStageIndex];
  const alpha = Math.min(1.0, stageBannerTimer / 30, (180 - stageBannerTimer) / 20);

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);

  // 半透明の帯
  ctx.fillStyle = 'rgba(10, 4, 24, 0.7)';
  ctx.fillRect(0, HEIGHT * 0.38, WIDTH, 75);

  // 金のライン
  ctx.strokeStyle = 'rgba(255, 200, 80, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, HEIGHT * 0.38);
  ctx.lineTo(WIDTH - 40, HEIGHT * 0.38);
  ctx.moveTo(40, HEIGHT * 0.38 + 75);
  ctx.lineTo(WIDTH - 40, HEIGHT * 0.38 + 75);
  ctx.stroke();

  // ステージ名
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "M PLUS Rounded 1c", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(255, 150, 50, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillText(`【 第 ${currentStageIndex + 1} 幕 】 ${stage.name}`, WIDTH / 2, HEIGHT * 0.38 + 34);

  // サブタイトル
  ctx.font = '12px "M PLUS Rounded 1c", sans-serif';
  ctx.fillStyle = '#ffc83b';
  ctx.shadowBlur = 0;
  ctx.fillText(stage.sub, WIDTH / 2, HEIGHT * 0.38 + 58);

  ctx.restore();
}

// ----------------------------------------------------
// 描画（レンダリング）
// ----------------------------------------------------
function drawScene(now) {
  const stage = STAGES[currentStageIndex];

  if (bgImageLoaded && bgImage.complete) {
    // 3x3 グリッド画像から現在のステージ画像を美しくCover形式で描画
    const cellW = bgImage.naturalWidth / 3;
    const cellH = bgImage.naturalHeight / 3;
    const sx = stage.col * cellW;
    const sy = stage.row * cellH;

    // アスペクト比を保ちつつCanvasいっぱいにCover描画（中央クロップ）
    const canvasAspect = WIDTH / HEIGHT;
    const cellAspect = cellW / cellH;

    let cropW = cellW;
    let cropH = cellH;
    let cropX = sx;
    let cropY = sy;

    if (cellAspect > canvasAspect) {
      // 横が余るため左右を中央トリミング
      cropW = cellH * canvasAspect;
      cropX = sx + (cellW - cropW) / 2;
    } else {
      // 縦が余るため上下を中央トリミング
      cropH = cellW / canvasAspect;
      cropY = sy + (cellH - cropH) / 2;
    }

    ctx.drawImage(bgImage, cropX, cropY, cropW, cropH, 0, 0, WIDTH, HEIGHT);

    // ゲームプレイを見やすくするための半透明グラデーションオーバーレイ
    const dimGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    dimGrad.addColorStop(0, 'rgba(10, 4, 20, 0.35)');
    dimGrad.addColorStop(0.5, 'rgba(10, 4, 20, 0.15)');
    dimGrad.addColorStop(1, 'rgba(10, 4, 20, 0.55)');
    ctx.fillStyle = dimGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

  } else {
    // 画像ロード中のフォールバック背景
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#15092a');
    grad.addColorStop(0.5, '#912d4d');
    grad.addColorStop(1, '#fca34d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // 舞い散る桜の花びら
  drawSakuraPetals();

  // 鳥たちのシルエット
  drawBirds();

  // ステージ名バナー
  drawStageBanner();
}

function drawSkyline() {
  ctx.fillStyle = '#140620';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT);
  // 山並みのシルエット
  ctx.lineTo(0, HEIGHT - 70);
  ctx.lineTo(80, HEIGHT - 95);
  ctx.lineTo(160, HEIGHT - 75);
  ctx.lineTo(240, HEIGHT - 110);
  ctx.lineTo(340, HEIGHT - 80);
  ctx.lineTo(420, HEIGHT - 100);
  ctx.lineTo(WIDTH, HEIGHT - 70);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.closePath();
  ctx.fill();

  // 地面の薄いネオン反射
  ctx.strokeStyle = 'rgba(255, 140, 60, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT - 65);
  ctx.lineTo(WIDTH, HEIGHT - 65);
  ctx.stroke();
}

function drawBirds() {
  ctx.fillStyle = 'rgba(20, 10, 30, 0.75)';
  birds.forEach(b => {
    const wingY = Math.sin(b.wingCycle) * b.size;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.quadraticCurveTo(b.x - b.size, b.y - wingY, b.x - b.size * 2, b.y + wingY * 0.5);
    ctx.quadraticCurveTo(b.x - b.size, b.y - wingY * 0.3, b.x, b.y);
    ctx.quadraticCurveTo(b.x + b.size, b.y - wingY * 0.3, b.x + b.size * 2, b.y + wingY * 0.5);
    ctx.quadraticCurveTo(b.x + b.size, b.y - wingY, b.x, b.y);
    ctx.fill();
  });
}

function drawEntities() {
  // 1. 障害物（落ちてくる夕日の欠片・サンフレア）
  obstacles.forEach(ob => {
    ctx.save();
    ctx.translate(ob.x, ob.y);
    ctx.rotate(ob.rotation);

    // 外側の炎グロー
    const flareGlow = ctx.createRadialGradient(0, 0, ob.size * 0.2, 0, 0, ob.size * 1.4);
    flareGlow.addColorStop(0, `hsla(${ob.hue + 10}, 100%, 75%, 0.8)`);
    flareGlow.addColorStop(0.6, `hsla(${ob.hue}, 100%, 55%, 0.35)`);
    flareGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = flareGlow;
    ctx.beginPath();
    ctx.arc(0, 0, ob.size * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // コア（燃える鉱石 / 結晶）
    ctx.fillStyle = `hsl(${ob.hue}, 95%, 50%)`;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const r = i % 2 === 0 ? ob.size : ob.size * 0.7;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // 明るい中心核
    ctx.fillStyle = '#fff4cc';
    ctx.beginPath();
    ctx.arc(0, 0, ob.size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // 2. 一番星（ボーナススター）
  stars.forEach(s => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);

    // 星の光彩
    const starGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, s.size * 2);
    starGlow.addColorStop(0, 'rgba(255, 245, 160, 0.9)');
    starGlow.addColorStop(0.5, 'rgba(255, 210, 50, 0.4)');
    starGlow.addColorStop(1, 'rgba(255, 210, 50, 0)');
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(0, 0, s.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // 4芒星の描画
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? s.size : s.size * 0.35;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  });
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.tilt);

  // グライダーのシルエット＆ネオンエッジ
  // 影
  ctx.fillStyle = 'rgba(10, 3, 20, 0.8)';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(-20, 14);
  ctx.lineTo(0, 6);
  ctx.lineTo(20, 14);
  ctx.closePath();
  ctx.fill();

  // エッジの夕日ハイライト
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // コックピットの光
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, -2, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.alpha);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 14px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}

function drawHUD() {
  // 左上: スコア
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Orbitron", sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(score.toLocaleString(), 20, 35);

  // 生存時間 & 星
  ctx.font = '12px "M PLUS Rounded 1c", sans-serif';
  ctx.fillStyle = '#fce4a6';
  ctx.fillText(`${elapsedTime.toFixed(1)}s`, 20, 55);

  // 右上: 星カウント
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 16px "Orbitron", sans-serif';
  ctx.fillText(`⭐ ${starsCollected}`, WIDTH - 20, 35);

  ctx.shadowBlur = 0;
}

// ----------------------------------------------------
// リーダーボード & 統計情報 (API 通信)
// ----------------------------------------------------
async function loadLeaderboard() {
  try {
    const res = await fetch('/api/ranking?limit=10');
    const data = await res.json();
    if (data.success) {
      renderRanking(data.ranking);
    }
  } catch (err) {
    console.error('リーダーボード読み込みエラー:', err);
    rankingList.innerHTML = '<li class="loading-item">読み込みに失敗しました</li>';
  }
}

function renderRanking(list) {
  if (!list || list.length === 0) {
    rankingList.innerHTML = '<li class="loading-item">まだ記録がありません。最初の旅人になりましょう！</li>';
    return;
  }

  rankingList.innerHTML = list.map((item, idx) => {
    const rank = idx + 1;
    const topClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;

    return `
      <li class="ranking-item ${topClass}">
        <div class="rank-left">
          <span class="rank-num">${medal}</span>
          <span class="rank-name" title="${item.player_name}">${escapeHtml(item.player_name)}</span>
        </div>
        <div class="rank-right">
          <span class="rank-score">${item.score.toLocaleString()}</span>
          <span class="rank-meta">${item.survival_time}s / ${item.stars_collected}⭐</span>
        </div>
      </li>
    `;
  }).join('');
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success && data.stats) {
      const s = data.stats;
      globalHighScore.textContent = Number(s.high_score || 0).toLocaleString();
      globalTotalPlays.textContent = Number(s.total_plays || 0).toLocaleString();
      globalTotalStars.textContent = Number(s.total_stars || 0).toLocaleString();
      globalAvgScore.textContent = Math.round(s.avg_score || 0).toLocaleString();
    }
  } catch (err) {
    console.error('統計読み込みエラー:', err);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// 初期化実行
initBirds();
initSakuraPetals();
bgImage.onload = () => {
  bgImageLoaded = true;
  drawScene(0);
};
drawScene(0);
loadLeaderboard();
loadStats();
