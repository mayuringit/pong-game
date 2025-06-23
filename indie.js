const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const popup = document.getElementById('popup');
const popupText = document.getElementById('popupText');

const hitSound = document.getElementById('hitSound');
const wallSound = document.getElementById('wallSound');
const scoreSound = document.getElementById('scoreSound');

const grid = 15;
const paddleHeight = grid * 5;
const topMargin = grid;
const bottomMargin = grid;
const winningScore = 5;

let paddleSpeed = 6;

let running = false;
let paused = false;
let animationId;

let maxY;

const leftPaddle = { x: grid * 2, y: 0, dy: 0, width: grid, height: paddleHeight, score: 0 };
const rightPaddle = { x: 0, y: 0, dy: 0, width: grid, height: paddleHeight, score: 0 };

const ball = {
    x: 0,
    y: 0,
    dx: 7,
    dy: -5,
    radius: 8,
    resetting: false
};

const difficultySettings = {
    easy: { ballSpeed: 4, paddleSpeed: 4 },
    hard: { ballSpeed: 7, paddleSpeed: 6 },
    insane: { ballSpeed: 10, paddleSpeed: 9 }
};

let difficulty = 'hard';

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;
    maxY = canvas.height - bottomMargin - paddleHeight;
    resetPositions();
    if (!running) draw(); // draw once if game is not running
}

window.addEventListener('resize', resizeCanvas);

function resetPositions() {
    leftPaddle.y = canvas.height / 2 - paddleHeight / 2;
    rightPaddle.x = canvas.width - grid * 3;
    rightPaddle.y = canvas.height / 2 - paddleHeight / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.resetting = false;
}

function setDifficulty(level) {
    difficulty = level;
    paddleSpeed = difficultySettings[level].paddleSpeed;
    const speed = difficultySettings[level].ballSpeed;

    ball.dx = (Math.random() > 0.5 ? 1 : -1) * speed;
    ball.dy = (Math.random() > 0.5 ? 1 : -1) * (speed * 0.7);

    resetBallPosition();
    updateScoreboard();

    ['easy', 'hard', 'insane'].forEach(lvl => {
        const btn = document.getElementById(lvl + '-btn');
        if (btn) btn.style.backgroundColor = (lvl === level) ? '#00f2ff' : '';
    });
}

function resetBallPosition() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.resetting = false;
    if (!running) startGame();
}

function collides(ball, paddle) {
    // Circle-rectangle collision detection
    const closestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
    const closestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;

    return (dx * dx + dy * dy) < (ball.radius * ball.radius);
}

function updateScoreboard() {
    document.getElementById('score1').textContent = leftPaddle.score;
    document.getElementById('score2').textContent = rightPaddle.score;
}

function showPopup(message) {
    popupText.textContent = message;
    popup.style.display = 'block';
    paused = true;
    stopGame();
}

function continueGame() {
    popup.style.display = 'none';
    paused = false;
    resetBall();
    startGame();
}

document.getElementById('continuebtn').addEventListener('click', continueGame);
document.addEventListener('keydown', e => {
    if (paused && e.key === 'Enter') {
        continueGame();
    }
});

function declareWinner(winner) {
    document.getElementById('winnerText').textContent = `🏆 ${winner} Wins!`;
    stopGame();
}

function calculateBounce(paddle) {
    const relativeIntersectY = (paddle.y + paddle.height / 2) - ball.y;
    const normalizedIntersectY = relativeIntersectY / (paddle.height / 2);
    const maxBounceAngle = Math.PI / 4;
    const randomFactor = (Math.random() * 0.2 - 0.1);
    const bounceAngle = (normalizedIntersectY * maxBounceAngle) + randomFactor;

    const speed = Math.min(Math.sqrt(ball.dx ** 2 + ball.dy ** 2) + 0.5, 14);
    const direction = ball.x < canvas.width / 2 ? 1 : -1;

    ball.dx = speed * Math.cos(bounceAngle) * direction;
    ball.dy = -speed * Math.sin(bounceAngle);

    paddleSpeed = Math.min(paddleSpeed + 0.2, 8);
}

function draw() {
    if (!running || paused) return;
    animationId = requestAnimationFrame(draw);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw top and bottom bars
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, topMargin);
    ctx.fillRect(0, canvas.height - bottomMargin, canvas.width, bottomMargin);

    // Draw middle dashed line
    for (let i = topMargin; i < canvas.height - bottomMargin; i += grid * 2) {
        ctx.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
    }

    // Update and clamp paddles
    [leftPaddle, rightPaddle].forEach(p => {
        p.y = Math.max(topMargin, Math.min(maxY, p.y + p.dy));
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top/bottom
    if (ball.y - ball.radius < topMargin || ball.y + ball.radius > canvas.height - bottomMargin) {
        ball.dy *= -1;
        wallSound.play();
    }

    // Ball collision with paddles (direction check prevents multiple hits)
    if (collides(ball, leftPaddle) && ball.dx < 0) {
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        calculateBounce(leftPaddle);
        hitSound.play();
    }

    if (collides(ball, rightPaddle) && ball.dx > 0) {
        ball.x = rightPaddle.x - ball.radius;
        calculateBounce(rightPaddle);
        hitSound.play();
    }

    // Score and reset
    if (ball.x - ball.radius < 0 && !ball.resetting) {
        rightPaddle.score++;
        updateScoreboard();
        scoreSound.play();
        ball.resetting = true;
        if (rightPaddle.score >= winningScore) {
            return declareWinner("Player 2");
        }
        showPopup("Player 1 Missed! Click Continue");
        return;
    }

    if (ball.x + ball.radius > canvas.width && !ball.resetting) {
        leftPaddle.score++;
        updateScoreboard();
        scoreSound.play();
        ball.resetting = true;
        if (leftPaddle.score >= winningScore) {
            return declareWinner("Player 1");
        }
        showPopup("Player 2 Missed! Click Continue");
        return;
    }

    // Draw ball with gradient
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#ff6ec7');
    gradient.addColorStop(1, '#00f2ff');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function startGame() {
    if (!running && !paused) {
        running = true;
        animationId = requestAnimationFrame(draw);
    } else if (!running && paused) {
        running = true;
        paused = false;
        animationId = requestAnimationFrame(draw);
    }
}

function stopGame() {
    running = false;
    cancelAnimationFrame(animationId);
}

document.addEventListener('keydown', e => {
    if (e.key === 'w') leftPaddle.dy = -paddleSpeed;
    if (e.key === 's') leftPaddle.dy = paddleSpeed;
    if (e.key === 'ArrowUp') rightPaddle.dy = -paddleSpeed;
    if (e.key === 'ArrowDown') rightPaddle.dy = paddleSpeed;

    // Unlock audio on user interaction (browser requirement)
    hitSound.play().catch(() => { });
});

document.addEventListener('keyup', e => {
    if (e.key === 'w' || e.key === 's') leftPaddle.dy = 0;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') rightPaddle.dy = 0;
});

resizeCanvas();
updateScoreboard();
setDifficulty(difficulty);
