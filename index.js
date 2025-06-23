const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popupText');
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 20;

// const hitSound = document.getElementById('hitSound');
// const wallSound = document.getElementById('wallSound');
// const scoreSound = document.getElementById('scoreSound');

const grid = 15;
const paddleHeight = grid * 5;
const maxY = canvas.height - grid - paddleHeight;
const winningScore = 5;

let running = false;
let paused = false;
let animationId;
let paddleSpeed = 6;

window.onload = () => {
    setDifficulty('hard');
};
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.8;  // 80% width
    canvas.height = window.innerHeight * 0.6; // 60% height
    // You can redraw your game here or reset positions
    ctx.fillStyle = '#0ff';
    ctx.font = '24px Arial';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillText(`Canvas size: ${canvas.width.toFixed(0)} x ${canvas.height.toFixed(0)}`, 20, 40);
    draw()
}

window.addEventListener('resize', resizeCanvas);

resizeCanvas();

const leftPaddle = { x: grid * 2, y: canvas.height / 2 - paddleHeight / 2, dy: 0, width: grid, height: paddleHeight, score: 0 };
const rightPaddle = { x: canvas.width - grid * 3, y: canvas.height / 2 - paddleHeight / 2, dy: 0, width: grid, height: paddleHeight, score: 0 };

let difficulty = 'hard'; // default

const difficultySettings = {
    easy: { ballSpeed: 4, paddleSpeed: 4 },
    hard: { ballSpeed: 7, paddleSpeed: 6 },
    insane: { ballSpeed: 10, paddleSpeed: 9 }
};

function setDifficulty(level) {
    difficulty = level;

    // Update speeds
    paddleSpeed = difficultySettings[level].paddleSpeed;
    const speed = difficultySettings[level].ballSpeed;

    // Reset ball velocity to new speed with random direction
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * speed;
    ball.dy = (Math.random() > 0.5 ? 1 : -1) * (speed * 0.7);

    resetBallPosition();
    updateScoreboard();

    // Update button styles to show active difficulty
    ['easy', 'hard', 'insane'].forEach(lvl => {
        document.getElementById(lvl + '-btn').style.backgroundColor = (lvl === level) ? '#00f2ff' : '';
    });
}

function resetBallPosition() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.resetting = false;
    if (!running) startGame();
}


const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: 7,  //  faster than before
    dy: -5, //  increased for more speed
    radius: 8,
    resetting: false
};

function collides(ball, paddle) {
    return (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.y + ball.radius > paddle.y
    );
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 5 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = 4 * (Math.random() * 1.5 - 0.75);
    ball.resetting = false;
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
        popup.style.display = 'none';
        paused = false;
        resetBall();
        startGame();
    }
})
function declareWinner(winner) {
    document.getElementById('winnerText').textContent = `🏆 ${winner} Wins!`;
    stopGame();
}

function calculateBounce(paddle) {
    const relativeIntersectY = (paddle.y + paddle.height / 2) - ball.y;
    const normalizedIntersectY = relativeIntersectY / (paddle.height / 2);
    const maxBounceAngle = Math.PI / 4;
    const randomFactor = (Math.random() * 0.2 - 0.1);  // ±0.1 rad
    const bounceAngle = (normalizedIntersectY * maxBounceAngle) + randomFactor;

    // Increase speed but cap at 10
    const speed = Math.min(Math.sqrt(ball.dx ** 2 + ball.dy ** 2) + 0.5, 14);
    const direction = ball.x < canvas.width / 2 ? 1 : -1;

    ball.dx = speed * Math.cos(bounceAngle) * direction;
    ball.dy = -speed * Math.sin(bounceAngle);

    // 👇 Increase paddle speed with ball (but cap it)
    paddleSpeed = Math.min(paddleSpeed + 0.2, 8);
}

function draw() {
    if (!running || paused) return;
    animationId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, grid);
    ctx.fillRect(0, canvas.height - grid, canvas.width, grid);
    for (let i = grid; i < canvas.height - grid; i += grid * 2) {
        ctx.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
    }

    [leftPaddle, rightPaddle].forEach(p => {
        p.y = Math.max(grid, Math.min(canvas.height - grid - p.height, p.y + p.dy));
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - ball.radius < grid || ball.y + ball.radius > canvas.height - grid) {
        ball.dy *= -1;
        // wallSound.play();
    }

    if (collides(ball, leftPaddle)) {
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        calculateBounce(leftPaddle);
        // hitSound.play();
    }

    if (collides(ball, rightPaddle)) {
        ball.x = rightPaddle.x - ball.radius;
        calculateBounce(rightPaddle);
        // hitSound.play();
    }

    if (ball.x - ball.radius < 0 && !ball.resetting) {
        rightPaddle.score++;
        updateScoreboard();
        // scoreSound.play();
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
        // scoreSound.play();
        ball.resetting = true;
        if (leftPaddle.score >= winningScore) {
            return declareWinner("Player 1");
        }
        showPopup("Player 2 Missed! Click Continue");
        return;
    }

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

    // Trigger audio (browser requirement)
    hitSound.play().catch(() => { });
});

updateScoreboard();