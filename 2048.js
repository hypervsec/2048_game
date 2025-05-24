// HTML elementleri
const startBtn = document.getElementById('startBtn');
const gameContainer = document.querySelector('.game-container');
const menu = document.querySelector('.menu');
const gameBoard = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('score');
const bestScoreDisplay = document.getElementById('bestScore');
const restartBtn = document.getElementById('restartBtn');
const homeBtn = document.getElementById('homeBtn');
const themeToggle = document.getElementById('themeToggle');
const gameOverScreen = document.getElementById('gameOverScreen');
const retryBtn = document.getElementById('retryBtn');
const difficultySelect = document.getElementById('difficulty');
const undoBtn = document.getElementById('undoBtn');
const timeModeCheckbox = document.getElementById('timeMode');
const timerDisplay = document.getElementById('timer');
const timerBox = document.querySelector('.timer-box');
const menuThemeToggle = document.getElementById('menuThemeToggle');
const gameMusic = document.getElementById('gameMusic');
const soundToggle = document.getElementById('soundToggle');

// Oyun durum değişkenleri
let board = [];
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let size = 1;
let gameOver = false;
let undoStack = [];
let maxUndo = 1;
let timeLeft = 60;
let timerInterval;
let isMuted = false;

bestScoreDisplay.textContent = bestScore;

// Oyun başlat
startBtn.addEventListener('click', () => {
  size = parseInt(difficultySelect.value);
  menu.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameMusic.play();
  init();
});

// Menüye dön
homeBtn.addEventListener('click', () => {
  gameContainer.classList.add('hidden');
  menu.classList.remove('hidden');
  gameMusic.pause();
  clearBoard();
});

// Tema ve ses kontrolleri
themeToggle.addEventListener('click', () => {
  if (document.body.classList.contains('dark')) {
    document.body.classList.remove('dark');
    document.body.classList.add('neon');
    themeToggle.textContent = '🔆';
    menuThemeToggle.value = 'neon';
  } else if (document.body.classList.contains('neon')) {
    document.body.classList.remove('neon');
    themeToggle.textContent = '🌙';
    menuThemeToggle.value = 'light';
  } else {
    document.body.classList.add('dark');
    themeToggle.textContent = '💡';
    menuThemeToggle.value = 'dark';
  }
});

menuThemeToggle.addEventListener('change', (e) => {
  document.body.classList.remove('dark', 'neon');
  const selected = e.target.value;
  if (selected === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '💡';
  } else if (selected === 'neon') {
    document.body.classList.add('neon');
    themeToggle.textContent = '🔆';
  } else {
    themeToggle.textContent = '🌙';
  }
});

soundToggle.addEventListener('click', () => {
  isMuted = !isMuted;
  gameMusic.muted = isMuted;
  soundToggle.textContent = isMuted ? '🔇' : '🔈';
});



// Yeniden başlat
restartBtn.addEventListener('click', () => {
  init();
});

// Game Over ekranından tekrar başlat
retryBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  init();
});

// Geri al
undoBtn.addEventListener('click', () => {
  undoMove();
});

// Oyun başlangıcı
function init() {
  gameOver = false;
  score = 0;
  undoStack = [];
  updateScore();
  clearBoard();
  createEmptyBoard();
  addRandomTile();
  addRandomTile();
  drawBoard();

  // Zamana karşı mod
  if (timeModeCheckbox.checked) {
    timeLeft = 60;
    timerBox.classList.remove('hidden');
    timerDisplay.textContent = timeLeft;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        triggerGameOver();
      }
    }, 1000);
  } else {
    timerBox.classList.add('hidden');
    clearInterval(timerInterval);
  }
}

// Board'u temizle
function clearBoard() {
  board = [];
  gameBoard.innerHTML = '';
}

// Boş board oluştur
function createEmptyBoard() {
  for (let i = 0; i < size; i++) {
    board[i] = [];
    for (let j = 0; j < size; j++) {
      board[i][j] = 0;
    }
  }
}

// Rastgele 2 veya 4 ekle
function addRandomTile() {
  let empty = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === 0) empty.push({ x: i, y: j });
    }
  }
  if (empty.length === 0) return;

  const rand = empty[Math.floor(Math.random() * empty.length)];
  board[rand.x][rand.y] = Math.random() < 0.9 ? 2 : 4;
}

// Board'u çiz
function drawBoard() {
  const cellSize = 70;
  const gapSize = 10;
  const boardSize = (cellSize * size) + (gapSize * (size - 1));
  gameBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  gameBoard.style.width = boardSize + 'px';
  gameBoard.style.height = boardSize + 'px';

  gameBoard.innerHTML = '';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const cell = document.createElement('div');
      const val = board[i][j];
      cell.className = 'cell';
      if (val !== 0) {
        cell.textContent = val;
        cell.setAttribute('data-value', val);
        if (val >= 65536) {
      cell.classList.add('cell-high');
        }
      }
      gameBoard.appendChild(cell);
    }
  }
}

// Skorları güncelle
function updateScore() {
  scoreDisplay.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('bestScore', bestScore);
    bestScoreDisplay.textContent = bestScore;
  }
}

// Hareketleri işle
function move(direction) {
  if (gameOver) return;

  // Önceki durumu kaydet
  const boardCopy = board.map(row => [...row]);
  undoStack.push({ board: boardCopy, score: score });
  if (undoStack.length > maxUndo) {
    undoStack.shift();
  }

  let moved = false;
  let merged = Array(size).fill().map(() => Array(size).fill(false));

  const moveCell = (i, j, di, dj) => {
    let x = i;
    let y = j;
    while (true) {
      let nx = x + di;
      let ny = y + dj;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
      if (board[nx][ny] === 0) {
        board[nx][ny] = board[x][y];
        board[x][y] = 0;
        x = nx;
        y = ny;
        moved = true;
      } else if (
        board[nx][ny] === board[x][y] &&
        !merged[nx][ny] &&
        !merged[x][y]
      ) {
        board[nx][ny] *= 2;
        board[x][y] = 0;
        score += board[nx][ny];
        merged[nx][ny] = true;
        moved = true;
        // her doğru harekette merge sesi çalar.
        if (!isMuted) {
          const mergeSound = document.getElementById('mergeSound');
            mergeSound.currentTime = 0; // aynı sesi art arda tekrar oynatmak için
            mergeSound.play();
                      }
        break;
      } else break;
    }
  };

  for (let k = 0; k < size; k++) {
    for (let l = 0; l < size; l++) {
      let i = direction === 'down' ? size - 1 - k : k;
      let j = direction === 'right' ? size - 1 - l : l;
      if (board[i][j] !== 0) {
        switch (direction) {
          case 'up':
            moveCell(i, j, -1, 0);
            break;
          case 'down':
            moveCell(i, j, 1, 0);
            break;
          case 'left':
            moveCell(i, j, 0, -1);
            break;
          case 'right':
            moveCell(i, j, 0, 1);
            break;
        }
      }
    }
  }

  if (moved) {
    addRandomTile();
    updateScore();
    drawBoard();
    checkGameOver();
  }
}

// Oyun bitiş kontrolü
function checkGameOver() {
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === 0) return;
      if (i > 0 && board[i][j] === board[i - 1][j]) return;
      if (i < size - 1 && board[i][j] === board[i + 1][j]) return;
      if (j > 0 && board[i][j] === board[i][j - 1]) return;
      if (j < size - 1 && board[i][j] === board[i][j + 1]) return;
    }
  }

  setTimeout(() => {
    triggerGameOver();
  }, 100);
}

// Geri alma işlemi
function undoMove() {
  if (undoStack.length === 0) return;

  const lastState = undoStack.pop();
  board = lastState.board.map(row => [...row]);
  score = lastState.score;

  updateScore();
  drawBoard();
  gameOver = false;
  gameOverScreen.classList.add('hidden');
}

// Oyun bitti ekranı
function triggerGameOver() {
  gameOver = true;
  gameOverScreen.classList.remove('hidden');
  if (timerInterval) clearInterval(timerInterval);
}

// Klavye kontrolü
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': move('up'); break;
    case 'ArrowDown': move('down'); break;
    case 'ArrowLeft': move('left'); break;
    case 'ArrowRight': move('right'); break;
  }
});

// nasıl oynanır butonu
document.getElementById('helpBtn').addEventListener('click', () => {
  document.getElementById('helpModal').classList.remove('hidden');
});


let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 30; // minimum mesafe (px)

gameBoard.addEventListener('touchstart', (e) => {
  const touch = e.changedTouches[0];
  touchStartX = touch.screenX;
  touchStartY = touch.screenY;
}, { passive: true });

gameBoard.addEventListener('touchend', (e) => {
  const touch = e.changedTouches[0];
  touchEndX = touch.screenX;
  touchEndY = touch.screenY;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
    if (dx > 0) {
      move('right');
    } else {
      move('left');
    }
  } else if (Math.abs(dy) > swipeThreshold) {
    if (dy > 0) {
      move('down');
    } else {
      move('up');
    }
  }
}

window.addEventListener('resize', () => {
  document.body.style.height = window.innerHeight + 'px';
});
