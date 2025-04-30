const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

let bird,     obstacles = [], score = 0, speed = 2;
let gameInterval, obstacleInterval, gravity = 0.5, birdY = 150, birdVelocity = 0;
let isGameOver = false, lastScoreUpdateTime = 0, passedPillars = 0;

// Load vine images for top obstacles (one with monkey and one without)
const vineImage1 = new Image(); // Vine with monkey hanging
vineImage1.src   = 'https://i.postimg.cc/CK4zq9r6/vines.png';  // Custom vine image with monkey hanging

const vineImage2 = new Image(); // Plain vine
vineImage2.src   = 'https://i.postimg.cc/c1cGN0gz/Untitled-design-4.png';  // Custom vine image (no monkey)

// Trunk images for bottom obstacles (old and new trunks)
const trunkImages = [
  'https://i.postimg.cc/mkt9c06W/Webp-net-resizeimage.png',  // Old trunk
  'https://i.postimg.cc/KzkjH4vC/Untitled-design-3.png',    // New trunk
];

// Background
const backgroundImage = new Image();
backgroundImage.src = 'https://i.postimg.cc/1zqWDSpr/Green-Modern-Welcome-To-The-Jungle-Video.png';
backgroundImage.onload = () => startGame();

// Game state
function Bird() {
  this.width  = 40;
  this.height = 40;
  this.x      = 50;
  this.y      = birdY;
  this.upImg   = new Image();
  this.downImg = new Image();
  this.upImg.src   = 'https://i.postimg.cc/RFxHy52d/wings-up.png';
  this.downImg.src = 'https://i.postimg.cc/VNnSjZ5C/wings-down.png';
  this.isFlap = true;

  this.jump = () => {
    birdVelocity = -6;
    this.isFlap   = true;
  };

  this.update = () => {
    birdVelocity += gravity;
    this.y += birdVelocity;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
      if (!isGameOver) endGame();
    }
    this.isFlap = !(this.y > birdY && birdVelocity > 0);
  };

  this.draw = () => {
    const img = this.isFlap ? this.upImg : this.downImg;
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
  };
}

// Obstacle constructor (solid pillars for top, monkey vine or plain vine, and random trunks for bottom)
function Obstacle() {
  this.width  = 40;
  this.height = Math.random() * 200 + 50;  // Random height for top pillars
  this.x      = canvas.width;
  this.gap    = 150;
  this.passed = false;

  // Randomly pick a vine image (one with monkey and one without)
  this.vineImage = Math.random() > 0.5 ? vineImage1 : vineImage2;

  // Randomly pick a trunk from the list
  this.trunkImage = trunkImages[Math.floor(Math.random() * trunkImages.length)];

  this.update = () => {
    this.x -= speed;
    if (this.x + this.width < 0) obstacles.shift();
  };

  this.draw = () => {
    // TOP: vine image (randomly selected with or without monkey)
    const vineHeight = this.height;
    const vineWidth  = this.width + 10; // Same width as trunk for consistency

    if (this.vineImage.complete) {
      ctx.drawImage(this.vineImage, this.x, 0, vineWidth, vineHeight);  // Adjust vine width and height based on the obstacle size
    } else {
      ctx.fillStyle = '#2E8B57';  // fallback color
      ctx.fillRect(this.x, 0, vineWidth, vineHeight);
    }

    // BOTTOM: randomly selected trunk image for bottom pillar
    const tx = this.x;
    const ty = this.height + this.gap;
    const tw = this.width + 10;
    const th = canvas.height - ty;

    const trunk = new Image();
    trunk.src = this.trunkImage;

    trunk.onload = () => {
      ctx.drawImage(trunk, tx, ty, tw, th);  // Draw the randomly selected tree trunk
    };

    // If trunk image isn't loaded yet, fallback to solid color
    if (!trunk.complete) {
      ctx.fillStyle = '#8B4513';  // fallback brown
      ctx.fillRect(tx, ty, tw, th);  // Fallback trunk
    }

    // **Collision Avoidance**: 
    // Bird dies if it hits the sharp left side of the trunk, but not the right side

    const pointedEndHeight = 50; // Adjust this based on the pointed part's size
    const pointedEndWidth  = 20; // The sharp pointed part width (in pixels)

    // Check if the bird is near the sharp pointed left part of the trunk (sharp side)
    if (bird.x + bird.width > tx && bird.x < tx + pointedEndWidth && bird.y + bird.height > ty) {
      endGame();  // End game if it hits the sharp point
    }

    // BOTTOM: Check for collision with the trunk's main body (right side, non-sharp)
    if (bird.x + bird.width > tx + pointedEndWidth && bird.x < tx + tw) {
      if (bird.y + bird.height > ty && bird.y < ty + th) {
        endGame(); // End game if the bird hits the main trunk body
      }
    }
  };
}

// Compliments (unchanged)
const compliments = [
  "Nice job!", "You're awesome!", "Keep going!",
  "Great work!", "Fantastic!"
];
function showCompliment() {
  const c = document.getElementById("compliment");
  c.textContent = compliments[Math.floor(Math.random() * compliments.length)];
  c.style.display = "block";
  setTimeout(() => c.style.display = "none", 2000);
}

// Start/reset
function startGame() {
  document.getElementById("homepage").style.display = "none";
  document.getElementById("gameOverScreen").style.display = "none"; // Hide game over screen
  document.getElementById("gameScreen").style.display = "block"; // Show the game screen

  bird = new Bird();
  obstacles = [];
  score = 0;
  passedPillars = 0;
  isGameOver = false;
  birdVelocity = 0;

  clearInterval(gameInterval);
  clearInterval(obstacleInterval);
  gameInterval = setInterval(gameLoop, 1000 / 60);
  obstacleInterval = setInterval(() => obstacles.push(new Obstacle()), 1500);
}

// Main loop
function gameLoop() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  bird.update();
  bird.draw();

  obstacles.forEach(obs => {
    obs.update();
    obs.draw();

    // scoring
    if (!obs.passed && bird.x + bird.width > obs.x) {
      obs.passed = true;
      passedPillars++;
      if (Date.now() - lastScoreUpdateTime >= 1000) {
        score += 10;
        lastScoreUpdateTime = Date.now();
      }
      if (passedPillars % 3 === 0) showCompliment();
    }

    // collision
    if (
      bird.x + bird.width > obs.x &&
      bird.x < obs.x + obs.width &&
      (bird.y < obs.height ||
       bird.y + bird.height > obs.height + obs.gap)
    ) {
      endGame();
    }
  });

  document.getElementById("score").innerText = "Score: " + score;
}

// End game
function endGame() {
  clearInterval(gameInterval);
  clearInterval(obstacleInterval);
  isGameOver = true;

  // Show the game over screen
  document.getElementById("gameOverScreen").style.display = "flex";
  document.getElementById("scoreDisplay").innerText = "Score: " + score;
  document.getElementById("gameScreen").style.display = "none";
}

// Highest score alert
function viewHighScore() {
  alert("Highest Score: " + score);
}

// Flap on click/touch
document.addEventListener("click", () => {
  if (!isGameOver) bird.jump();
});
