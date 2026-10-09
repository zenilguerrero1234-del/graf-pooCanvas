
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Clase Ball: representa cada pelota
class Ball {
    constructor(x, y, radius, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebote en los bordes superior e inferior
        if (
            this.y - this.radius <= 0 ||
            this.y + this.radius >= canvas.height
        ) {
            this.speedY *= -1;
        }
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speedX *= -1;
    }
}

// Clase Paddle: representa las paletas
class Paddle {
    constructor(
        x, y, width, height,
        color, isPlayerControlled = false
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isPlayerControlled = isPlayerControlled;
        this.speed = 5;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x, this.y,
            this.width, this.height
        );
    }

    move(direction) {
        if (direction === 'up') {
            this.y -= this.speed;
        } else if (direction === 'down') {
            this.y += this.speed;
        }

        // Mantener la paleta dentro del lienzo
        this.y = Math.max(
            0,
            Math.min(canvas.height - this.height, this.y)
        );
    }

    autoMove(ball) {
        const center = this.y + this.height / 2;

        if (ball.y < center) {
            this.y -= this.speed;
        } else if (ball.y > center) {
            this.y += this.speed;
        }

        this.y = Math.max(
            0,
            Math.min(canvas.height - this.height, this.y)
        );
    }
}

// Clase Game: controla todas las pelotas y las paletas
class Game {
    constructor() {
        // Cinco pelotas con diferentes tamaños,
        // colores y velocidades
        this.balls = [
            new Ball(400, 150, 7, 3, 4, '#ff4040'),
            new Ball(400, 250, 10, 4, 3, '#40c4ff'),
            new Ball(400, 350, 13, 5, 4, '#ffee58'),
            new Ball(400, 450, 8, 3, -5, '#69f0ae'),
            new Ball(400, 300, 15, 6, -3, '#e040fb')
        ];

        // La paleta del jugador mide 200 px de alto,
        // el doble de los 100 px de la versión inicial
        this.paddle1 = new Paddle(
            0, canvas.height / 2 - 100,
            10, 200, '#00e5ff', true
        );

        this.paddle2 = new Paddle(
            canvas.width - 10, canvas.height / 2 - 50,
            10, 100, '#ff9800'
        );

        this.keys = {};
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar las cinco pelotas
        this.balls.forEach(ball => ball.draw());

        this.paddle1.draw();
        this.paddle2.draw();
    }

    update() {
        // Actualizar cada pelota
        this.balls.forEach(ball => {
            ball.move();

            // Colisión con la paleta del jugador
            if (
                ball.speedX < 0 &&
                ball.x - ball.radius <=
                    this.paddle1.x + this.paddle1.width &&
                ball.x + ball.radius >= this.paddle1.x &&
                ball.y + ball.radius >= this.paddle1.y &&
                ball.y - ball.radius <=
                    this.paddle1.y + this.paddle1.height
            ) {
                ball.speedX = Math.abs(ball.speedX);
            }

            // Colisión con la paleta automática
            if (
                ball.speedX > 0 &&
                ball.x + ball.radius >= this.paddle2.x &&
                ball.x - ball.radius <=
                    this.paddle2.x + this.paddle2.width &&
                ball.y + ball.radius >= this.paddle2.y &&
                ball.y - ball.radius <=
                    this.paddle2.y + this.paddle2.height
            ) {
                ball.speedX = -Math.abs(ball.speedX);
            }

            // Reiniciar una pelota cuando sale del lienzo
            if (
                ball.x + ball.radius < 0 ||
                ball.x - ball.radius > canvas.width
            ) {
                ball.reset();
            }
        });

        // Movimiento de la paleta del jugador
        if (this.keys['ArrowUp']) {
            this.paddle1.move('up');
        }

        if (this.keys['ArrowDown']) {
            this.paddle1.move('down');
        }

        // La computadora sigue la pelota más cercana
        // al lado derecho del lienzo
        let targetBall = this.balls[0];

        this.balls.forEach(ball => {
            if (ball.speedX > 0 &&
                ball.x > targetBall.x) {
                targetBall = ball;
            }
        });

        this.paddle2.autoMove(targetBall);
    }

    handleInput() {
        window.addEventListener('keydown', event => {
            this.keys[event.key] = true;

            if (
                event.key === 'ArrowUp' ||
                event.key === 'ArrowDown'
            ) {
                event.preventDefault();
            }
        });

        window.addEventListener('keyup', event => {
            this.keys[event.key] = false;
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

// Iniciar el juego
const game = new Game();
game.run();