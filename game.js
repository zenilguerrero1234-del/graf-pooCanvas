
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==========================================
// Clase Ball: representa y controla las pelotas
// ==========================================
class Ball {
    constructor(x, y, radius, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }

    // Dibujar la pelota
    draw() {
        ctx.beginPath();
        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    // Mover la pelota y evitar que salga del lienzo
    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebote en el borde superior
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.speedY = Math.abs(this.speedY);
        }

        // Rebote en el borde inferior
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            this.speedY = -Math.abs(this.speedY);
        }

        // Rebote en el borde izquierdo
        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.speedX = Math.abs(this.speedX);
        }

        // Rebote en el borde derecho
        if (this.x + this.radius >= canvas.width) {
            this.x = canvas.width - this.radius;
            this.speedX = -Math.abs(this.speedX);
        }
    }
}

// ==========================================
// Clase Paddle: representa las paletas
// ==========================================
class Paddle {
    constructor(
        x,
        y,
        width,
        height,
        color,
        isPlayerControlled = false
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isPlayerControlled = isPlayerControlled;
        this.speed = 5;
    }

    // Dibujar la paleta
    draw() {
        ctx.fillStyle = this.color;

        ctx.fillRect(
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    // Mover la paleta del jugador
    move(direction) {
        if (direction === 'up') {
            this.y -= this.speed;
        } else if (direction === 'down') {
            this.y += this.speed;
        }

        // Evitar que la paleta salga del lienzo
        this.y = Math.max(
            0,
            Math.min(
                canvas.height - this.height,
                this.y
            )
        );
    }

    // Movimiento automático de la computadora
    autoMove(ball) {
        const center = this.y + this.height / 2;

        if (ball.y < center) {
            this.y -= this.speed;
        } else if (ball.y > center) {
            this.y += this.speed;
        }

        // Mantener la paleta dentro del lienzo
        this.y = Math.max(
            0,
            Math.min(
                canvas.height - this.height,
                this.y
            )
        );
    }
}

// ==========================================
// Clase Game: controla el juego completo
// ==========================================
class Game {
    constructor() {

        // Crear cinco pelotas diferentes
        this.balls = [
            new Ball(
                200, 100, 7,
                3, 4, '#ff4040'
            ),

            new Ball(
                350, 200, 10,
                4, 3, '#40c4ff'
            ),

            new Ball(
                450, 300, 13,
                5, 4, '#ffee58'
            ),

            new Ball(
                300, 400, 8,
                3, -5, '#69f0ae'
            ),

            new Ball(
                550, 250, 15,
                6, -3, '#e040fb'
            )
        ];

        // Paleta del jugador:
        // 200 píxeles de alto, el doble de la original
        this.paddle1 = new Paddle(
            0,
            canvas.height / 2 - 100,
            10,
            200,
            '#00e5ff',
            true
        );

        // Paleta de la computadora
        this.paddle2 = new Paddle(
            canvas.width - 10,
            canvas.height / 2 - 50,
            10,
            100,
            '#ff9800'
        );

        // Registrar las teclas presionadas
        this.keys = {};
    }

    // Dibujar todos los elementos
    draw() {
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Dibujar las cinco pelotas
        this.balls.forEach(ball => {
            ball.draw();
        });

        // Dibujar las dos paletas
        this.paddle1.draw();
        this.paddle2.draw();
    }

    // Actualizar el movimiento y las colisiones
    update() {

        // Actualizar cada pelota
        this.balls.forEach(ball => {

            // Mover la pelota y rebotar en los bordes
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
                // Rebotar hacia la derecha
                ball.x =
                    this.paddle1.x +
                    this.paddle1.width +
                    ball.radius;

                ball.speedX = Math.abs(ball.speedX);
            }

            // Colisión con la paleta de la computadora
            if (
                ball.speedX > 0 &&
                ball.x + ball.radius >= this.paddle2.x &&
                ball.x - ball.radius <=
                    this.paddle2.x + this.paddle2.width &&
                ball.y + ball.radius >= this.paddle2.y &&
                ball.y - ball.radius <=
                    this.paddle2.y + this.paddle2.height
            ) {
                // Rebotar hacia la izquierda
                ball.x =
                    this.paddle2.x -
                    ball.radius;

                ball.speedX = -Math.abs(ball.speedX);
            }
        });

        // Movimiento del jugador con las flechas
        if (this.keys['ArrowUp']) {
            this.paddle1.move('up');
        }

        if (this.keys['ArrowDown']) {
            this.paddle1.move('down');
        }

        // La computadora sigue la pelota que avanza
        // más cerca de su lado del campo
        const approachingBalls = this.balls.filter(
            ball => ball.speedX > 0
        );

        if (approachingBalls.length > 0) {
            const targetBall = approachingBalls.reduce(
                (closest, ball) =>
                    ball.x > closest.x ? ball : closest
            );

            this.paddle2.autoMove(targetBall);
        }
    }

    // Detectar las teclas presionadas y liberadas
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

    // Ejecutar el ciclo del juego
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

// ==========================================
// Crear e iniciar el juego
// ==========================================
const game = new Game();
game.run();