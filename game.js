const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game Variables
let gravity = 0.5;
let jumpStrength = -10;
let playerSpeed = 5;
let platformSpacing = 200; // Initial platform spacing
let obstacleFrequency = 300; // Distance between obstacles
let platformWidthDecrease = 0.95; // Platform width decreases by 5% each level
let platforms = [];
let obstacles = [];
let goal = null;
let difficultyLevel = 1; // Track difficulty level
let lives = 3; // Player starts with 3 lives
let gameStarted = false; // Track if the game has started
let missedPlatforms = new Set(); // Set to track missed platforms

let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height / 2 - 25,
    width: 50,
    height: 50,
    color: 'blue',
    velocityX: 0,
    velocityY: 0,
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
};

// Platform Class
class Platform {
    constructor(x, y, width, height, id) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = id; // Unique identifier for each platform
        this.passed = false; // Track if the platform has been passed by the player
    }

    draw() {
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= playerSpeed * 0.5; // Platforms move slower than player

        // Remove off-screen platforms
        if (this.x + this.width < 0) {
            platforms.shift();
            missedPlatforms.delete(this.id); // Remove from missed set
        }
    }
}

// Obstacle Class
class Obstacle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= playerSpeed * 0.5; // Obstacles move slower than player

        // Remove off-screen obstacles
        if (this.x + this.width < 0) {
            obstacles.shift();
        }
    }
}

// Goal Class
class Goal {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = 'gold'; // Bright color to make the goal stand out
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= playerSpeed * 0.5; // Goal moves slower than player
    }
}

// Generate new platforms, obstacles, and goal
function generateObjects() {
    // Generate platforms
    if (platforms.length === 0 || platforms[platforms.length - 1].x < canvas.width - platformSpacing) {
        const width = (Math.random() * 100 + 50) * platformWidthDecrease;
        const x = canvas.width + Math.random() * 200;
        const y = canvas.height - (Math.random() * 100 + 50);
        const id = Date.now() + Math.random(); // Unique identifier
        platforms.push(new Platform(x, y, width, 20, id));
    }

    // Generate obstacles in areas that are not overlapping with platforms
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - obstacleFrequency) {
        let safeX;
        let safeY;
        let width = Math.random() * 50 + 30;

        // Ensure obstacle does not spawn on a platform
        do {
            safeX = canvas.width + Math.random() * 200;
            safeY = canvas.height - 50 - (Math.random() * 100);
        } while (platforms.some(platform => safeX < platform.x + platform.width && safeX + width > platform.x));

        obstacles.push(new Obstacle(safeX, safeY, width, 30));
    }

    // Generate goal after passing several platforms
    if (!goal && platforms.length > 5) {
        const lastPlatform = platforms[platforms.length - 1];  // Get the last platform
        const x = lastPlatform.x + lastPlatform.width / 2 - 30; // Center on platform
        const y = lastPlatform.y - 60;  // Above the last platform
        goal = new Goal(x, y, 60, 60);
    }
}

// Check collision between player and object
function checkCollision(player, object) {
    return (
        player.x < object.x + object.width &&
        player.x + player.width > object.x &&
        player.y < object.y + object.height &&
        player.y + player.height > object.y
    );
}

// Check if player has missed any platform
function checkPlatformMiss() {
    platforms.forEach(platform => {
        if (player.y > platform.y + platform.height && !platform.passed) {
            // Platform is below the player and has not been touched
            if (!missedPlatforms.has(platform.id)) {
                missedPlatforms.add(platform.id); // Mark as missed
                lives--;
                alert(`You missed a platform! Lives remaining: ${lives}`);

                // Reset player to initial position
                player.x = canvas.width / 2 - 25;
                player.y = canvas.height / 2 - 25;
                player.velocityY = 0;

                if (lives <= 0) {
                    alert('Game Over!');
                    document.location.reload();
                }
            }
        }
    });
}

// Reset Game and Increase Difficulty
function increaseDifficulty() {
    difficultyLevel += 1;
    playerSpeed += 1; // Increase player speed
    platformSpacing += 50; // Increase platform distance
    obstacleFrequency -= 20; // Increase obstacle frequency
    platformWidthDecrease *= 0.95; // Platforms get smaller
}

// Main Game Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameStarted) {
        // Player Physics
        player.velocityY += gravity;
        player.x += player.velocityX;
        player.y += player.velocityY;

        // Player Floor Collision (Game Over)
        if (player.y + player.height >= canvas.height) {
            lives--;
            alert(`You lost a life! Lives remaining: ${lives}`);

            // Reset player to initial position
            player.x = canvas.width / 2 - 25;
            player.y = canvas.height / 2 - 25;
            player.velocityY = 0;

            if (lives <= 0) {
                alert('Game Over!');
                document.location.reload();
            }
        }

        // Platform Collision
        platforms.forEach(platform => {
            platform.update();
            platform.draw();

            if (checkCollision(player, platform) && player.velocityY > 0) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                platform.passed = true; // Mark platform as touched
            }
        });

        // Check for platform misses
        checkPlatformMiss();

        // Obstacle Collision
        obstacles.forEach(obstacle => {
            obstacle.update();
            obstacle.draw();

            if (checkCollision(player, obstacle)) {
                alert('Game Over!');
                document.location.reload();
            }
        });

        // Goal Collision
        if (goal) {
            goal.update();
            goal.draw();

            if (checkCollision(player, goal)) {
                alert(`You Win! Moving to Level ${difficultyLevel + 1}`);
                increaseDifficulty();
                platforms = [];
                obstacles = [];
                goal = null; // Reset the goal
                missedPlatforms.clear(); // Clear missed platforms for new level
            }
        }

        // Add new objects and remove old ones
        generateObjects();

        // Draw player
        player.draw();
    }

    // Continuous Game Loop
    requestAnimationFrame(gameLoop);
}

// Handle player controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') {
        player.velocityX = -playerSpeed;
    } else if (e.code === 'ArrowRight') {
        player.velocityX = playerSpeed;
    } else if (e.code === 'Space') {
        if (!gameStarted) {
            gameStarted = true;
            player.velocityY = jumpStrength; // Start the game with an initial jump
        } else {
            // Allow player to jump while the game is running
            player.velocityY = jumpStrength;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        player.velocityX = 0;
    }
});

// Start game loop
gameLoop();
