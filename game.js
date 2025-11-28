const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Make canvas full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Load images
const playerImg = new Image();
playerImg.src = 'character.png';
const enemyImg = new Image();
enemyImg.src = 'enemy.png';

// Game state
let gameState = 'title';

// Responsive variables
let floorHeight = 50;

// Player
let player = { 
    x: 50, 
    y: 0, 
    width: 0, 
    height: 0, 
    dy: 0, 
    onGround: false, 
    speed: 0, 
    health: 100 
};
let bullets = [];
let enemies = [];
let enemyBullets = [];
let keys = {};
let shootCooldown = 0;

// Gravity & jump power
let gravity = 0.5;
let jumpPower = -10;

// Event listeners
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);
canvas.addEventListener('click', () => {
    if (gameState === 'title') gameState = 'playing';
});

// Resize player & enemy based on canvas
function resizeEntities() {
    player.width = canvas.width * 0.05;   // 5% of width
    player.height = canvas.height * 0.1;  // 10% of height
    player.y = canvas.height - floorHeight - player.height;
    player.speed = canvas.width * 0.006;  // player speed proportional
    gravity = canvas.height * 0.003;      // stronger gravity
    jumpPower = -canvas.height * 0.03;    // higher jump
}
resizeEntities();
window.addEventListener('resize', resizeEntities);

// Shoot bullets
function shoot() {
    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 5,
        width: 10,
        height: 10,
        dx: canvas.width * 0.012   // player bullets slightly faster
    });
}

// Spawn enemy
function spawnEnemy() {
    let enemyWidth = canvas.width * 0.05;
    let enemyHeight = canvas.height * 0.1;
    let enemyY = canvas.height - floorHeight - enemyHeight;
    enemies.push({ 
        x: canvas.width, 
        y: enemyY, 
        width: enemyWidth, 
        height: enemyHeight, 
        dx: -canvas.width * 0.002,  // slower enemy movement
        fireCooldown: 100 
    });
}

// Enemy shoots
function enemyShoot(enemy) {
    enemyBullets.push({
        x: enemy.x,
        y: enemy.y + enemy.height / 2 - 5,
        width: 8,
        height: 8,
        dx: -canvas.width * 0.007   // slower enemy bullets
    });
    enemy.fireCooldown = 100;
}

// Draw title screen
function drawTitle() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = `${canvas.width * 0.08}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Battle Realms', canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = `${canvas.width * 0.03}px Arial`;
    ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2 + 20);
}

// Draw health bar
function drawHealth() {
    let barWidth = canvas.width * 0.12;
    ctx.fillStyle = 'black';
    ctx.fillRect(10, 10, barWidth, 30);
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, barWidth * (player.health / 100), 30);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 10, barWidth, 30);
    ctx.fillStyle = 'white';
    ctx.font = `${canvas.width * 0.015}px Arial`;
    ctx.fillText(`Health: ${player.health}`, 15, 32);
}

// Game loop
function update() {
    if (gameState === 'title') {
        drawTitle();
        requestAnimationFrame(update);
        return;
    }

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player movement
    if (keys['ArrowUp'] && player.onGround) { 
        player.dy = jumpPower; 
        player.onGround = false; 
    }
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;

    // Keep player inside canvas
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Shooting cooldown
    if (shootCooldown > 0) shootCooldown--;
    if (keys[' '] && shootCooldown === 0) { shoot(); shootCooldown = 15; }

    // Gravity
    player.dy += gravity;
    player.y += player.dy;

    // Floor collision
    if (player.y + player.height > canvas.height - floorHeight) {
        player.y = canvas.height - floorHeight - player.height;
        player.dy = 0;
        player.onGround = true;
    }

    // Draw floor
    ctx.fillStyle = 'green';
    ctx.fillRect(0, canvas.height - floorHeight, canvas.width, floorHeight);

    // Draw player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // Draw health
    drawHealth();

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx;
        ctx.fillStyle = 'yellow';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        if (b.x > canvas.width) bullets.splice(i,1);
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.x += e.dx;
        if (e.fireCooldown > 0) e.fireCooldown--;
        if (e.fireCooldown === 0) enemyShoot(e);
        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);

        // Bullet collision
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (b.x < e.x+e.width && b.x+b.width>e.x && b.y<e.y+e.height && b.y+b.height>e.y) {
                enemies.splice(i,1);
                bullets.splice(j,1);
                break;
            }
        }
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let eb = enemyBullets[i];
        eb.x += eb.dx;
        ctx.fillStyle = 'purple';
        ctx.fillRect(eb.x, eb.y, eb.width, eb.height);

        // Collision with player
        if (player.x < eb.x+eb.width && player.x+player.width>eb.x &&
            player.y<eb.y+eb.height && player.y+player.height>eb.y) {
            player.health -= 10;
            enemyBullets.splice(i,1);
            if (player.health <= 0) { alert("Game Over!"); location.reload(); }
        }
        if (eb.x+eb.width < 0) enemyBullets.splice(i,1);
    }

    // Randomly spawn enemies
    if (Math.random() < 0.01) spawnEnemy();

    requestAnimationFrame(update);
}

update();
