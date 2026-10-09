const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos del DOM para la interfaz
const playerScoreEl = document.getElementById('playerScore');
const playerLivesEl = document.getElementById('playerLives');
const uiOverlay = document.getElementById('uiOverlay');
const startBtn = document.getElementById('startBtn');

// ==========================================
// Sistema de Partículas Neón para Colisiones
// ==========================================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.04 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ==========================================
// Clase Ball: representa y controla las pelotas
// ==========================================
class Ball {
    constructor(x, y, radius, speedX, speedY, color) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.baseSpeedX = speedX;
        this.baseSpeedY = speedY;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.speedX = this.baseSpeedX * (Math.random() > 0.5 ? 1 : -1);
        this.speedY = this.baseSpeedY * (Math.random() > 0.5 ? 1 : -1);
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebote en el borde superior
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.speedY = Math.abs(this.speedY);
            game.createSparks(this.x, this.y, this.color);
        }

        // Rebote en el borde inferior
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            this.speedY = -Math.abs(this.speedY);
            game.createSparks(this.x, this.y, this.color);
        }

        // Rebote en el borde derecho (la computadora rebota la pelota)
        if (this.x + this.radius >= canvas.width) {
            this.x = canvas.width - this.radius;
            this.speedX = -Math.abs(this.speedX);
            game.createSparks(this.x, this.y, this.color);
        }
    }
}

// ==========================================
// Clase Paddle: representa las paletas
// ==========================================
class Paddle {
    constructor(x, y, width, height, color, isPlayerControlled = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isPlayerControlled = isPlayerControlled;
        this.speed = 8;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }

    move(direction) {
        if (direction === 'up') {
            this.y -= this.speed;
        } else if (direction === 'down') {
            this.y += this.speed;
        }

        // Evitar que la paleta salga del lienzo
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }

    autoMove(ball) {
        const center = this.y + this.height / 2;
        const diff = ball.y - center;
        const aiSpeed = Math.min(Math.abs(diff), this.speed * 0.85);

        if (diff < 0) {
            this.y -= aiSpeed;
        } else if (diff > 0) {
            this.y += aiSpeed;
        }

        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }
}

// ==========================================
// Clase Game: controla el flujo completo
// ==========================================
class Game {
    constructor() {
        this.state = 'IDLE'; // IDLE, PLAYING, GAMEOVER
        this.playerScore = 0;
        this.playerLives = 5; // Aumentado a 5 vidas para equilibrar las 5 pelotas

        // Las 5 pelotas originales con sus respectivos colores, radios y velocidades
        this.balls = [
            new Ball(200, 100, 7, 3, 4, '#ff4040'),
            new Ball(350, 200, 10, 4, 3, '#40c4ff'),
            new Ball(450, 300, 13, 5, 4, '#ffee58'),
            new Ball(300, 400, 8, 3, -5, '#69f0ae'),
            new Ball(550, 250, 15, 6, -3, '#e040fb')
        ];

        // Paleta del jugador (izquierda) - 200 píxeles de alto
        this.paddle1 = new Paddle(15, canvas.height / 2 - 100, 12, 200, '#00e5ff', true);

        // Paleta de la computadora (derecha)
        this.paddle2 = new Paddle(canvas.width - 27, canvas.height / 2 - 50, 12, 100, '#ff9800');

        this.keys = {};
        this.particles = [];
    }

    createSparks(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    drawNet() {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 15]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.restore();
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Red central
        this.drawNet();

        // Partículas
        this.particles.forEach(p => p.draw());

        // Pelotas
        this.balls.forEach(ball => ball.draw());

        // Paletas
        this.paddle1.draw();
        this.paddle2.draw();
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // Actualizar partículas
        this.particles.forEach((p, index) => {
            p.update();
            if (p.alpha <= 0) {
                this.particles.splice(index, 1);
            }
        });

        // Actualizar cada pelota de las 5 en juego
        this.balls.forEach(ball => {
            ball.move();

            // ==========================================
            // COLISIÓN Y VALIDACIÓN DEL LADO IZQUIERDO
            // ==========================================
            if (ball.speedX < 0 && ball.x - ball.radius <= this.paddle1.x + this.paddle1.width) {
                // Verificar si golpea la paleta del jugador
                if (
                    ball.y + ball.radius >= this.paddle1.y &&
                    ball.y - ball.radius <= this.paddle1.y + this.paddle1.height
                ) {
                    ball.x = this.paddle1.x + this.paddle1.width + ball.radius;
                    ball.speedX = Math.abs(ball.speedX) * 1.03; // Incremento de velocidad gradual
                    this.playerScore += 5; // Puntos por devolución
                    this.updateHUD();
                    this.createSparks(ball.x, ball.y, this.paddle1.color);
                } else if (ball.x + ball.radius < 0) {
                    // LA PELOTA PASÓ LA PALETA: Pierde una vida
                    this.playerLives--;
                    this.updateHUD();
                    this.createSparks(0, ball.y, '#ff0000');

                    if (this.playerLives <= 0) {
                        this.gameOver();
                    } else {
                        ball.reset();
                    }
                }
            }

            // Colisión con la paleta de la computadora
            if (
                ball.speedX > 0 &&
                ball.x + ball.radius >= this.paddle2.x &&
                ball.x - ball.radius <= this.paddle2.x + this.paddle2.width &&
                ball.y + ball.radius >= this.paddle2.y &&
                ball.y - ball.radius <= this.paddle2.y + this.paddle2.height
            ) {
                ball.x = this.paddle2.x - ball.radius;
                ball.speedX = -Math.abs(ball.speedX) * 1.03;
                this.createSparks(ball.x, ball.y, this.paddle2.color);
            }
        });

        // Movimiento del jugador (W/S o Flechas Arriba/Abajo)
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.paddle1.move('up');
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.paddle1.move('down');
        }

        // La IA rastrea la pelota que esté más cerca de su campo
        const approachingBalls = this.balls.filter(ball => ball.speedX > 0);
        if (approachingBalls.length > 0) {
            const targetBall = approachingBalls.reduce((closest, ball) => 
                ball.x > closest.x ? ball : closest
            );
            this.paddle2.autoMove(targetBall);
        }
    }

    updateHUD() {
        playerScoreEl.textContent = this.playerScore;
        playerLivesEl.textContent = '❤️ '.repeat(Math.max(0, this.playerLives));
    }

    gameOver() {
        this.state = 'GAMEOVER';
        uiOverlay.querySelector('h2').textContent = '¡GAME OVER!';
        uiOverlay.querySelector('p').innerHTML = `Puntuación obtenida: <strong>${this.playerScore}</strong><br>¡Inténtalo de nuevo para mejorar tu récord!`;
        startBtn.textContent = 'REINTENTAR';
        uiOverlay.classList.remove('hidden');
    }

    start() {
        this.playerScore = 0;
        this.playerLives = 5; // Reiniciar con 5 vidas
        this.balls.forEach(ball => ball.reset());
        this.updateHUD();
        this.state = 'PLAYING';
        uiOverlay.classList.add('hidden');
    }

    handleInput() {
        window.addEventListener('keydown', event => {
            this.keys[event.key] = true;
            if (['ArrowUp', 'ArrowDown', ' ', 'w', 's', 'W', 'S'].includes(event.key)) {
                event.preventDefault();
            }
        });

        window.addEventListener('keyup', event => {
            this.keys[event.key] = false;
        });

        startBtn.addEventListener('click', () => {
            this.start();
        });
    }

    run() {
        this.handleInput();

        const gameLoop = () => {
            this.update();
            this.draw();

            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }
}

// Iniciar instancia del juego
const game = new Game();
game.run();