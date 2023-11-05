const NUM_LOOPS = 30;
const ARM_LENGTH = 0.5;
const LOG_DRAIN_RATE = 0.11;
const FILL_RATE = 0.60;
const ANGULAR_RESISTENCE = 0.4;

var angle = Math.PI / 180;
var angleVel = 0.0;
var quantity = Array(NUM_LOOPS).fill(0);

function advance(dt) {
    let torque = 0;
    const topIndex = (NUM_LOOPS - Math.round(angle * NUM_LOOPS / (2 * Math.PI))) % NUM_LOOPS;
    quantity[topIndex] += FILL_RATE * dt;
    for(let i = 0; i < NUM_LOOPS; i++) {
        quantity[i] *= Math.exp(-LOG_DRAIN_RATE * dt);
        if(quantity[i] < 0) {
            quantity[i] = 0;
        }
        torque += quantity[i] * Math.sin(angle + i * 2 * Math.PI / NUM_LOOPS) * ARM_LENGTH;
    }
    angleVel += (torque - ANGULAR_RESISTENCE * angleVel) * dt;
    angle += angleVel * dt;
    angle %= 2 * Math.PI;
}

const FILL_VISUAL_SCALE = 0.75;
const CONTAINER_EQUARE_SIZE = 0.05;

/**
 * Draw the water wheel on the screen
 * @param {HTMLCanvasElement} canvas canvas
 * @param {CanvasRenderingContext2D} ctx context
 */
function draw(canvas, ctx) {
    // the number of pixels on the canvas that represents 1 unit length
    const UNIT_PIXEL = 0.8 * Math.min(canvas.width, canvas.height);
    // draw the arms of the wheel
    for(let i = 0; i < NUM_LOOPS; i++) {
        ctx.beginPath();
        ctx.color
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(
            canvas.width / 2 + ARM_LENGTH * UNIT_PIXEL * Math.sin(angle + i * 2 * Math.PI / NUM_LOOPS),
            canvas.height / 2 - ARM_LENGTH * UNIT_PIXEL * Math.cos(angle + i * 2 * Math.PI / NUM_LOOPS)
        );
        ctx.stroke();
    }
    // draw each container of the wheel using an rectangle
    for(let i = 0; i < NUM_LOOPS; i++) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 0, 255, ${quantity[i] * FILL_VISUAL_SCALE})`;
        ctx.rect(
            canvas.width / 2 + ARM_LENGTH * UNIT_PIXEL * Math.sin(angle + i * 2 * Math.PI / NUM_LOOPS) - 0.5 * CONTAINER_EQUARE_SIZE * UNIT_PIXEL,
            canvas.height / 2 - ARM_LENGTH * UNIT_PIXEL * Math.cos(angle + i * 2 * Math.PI / NUM_LOOPS) - 0.5 * CONTAINER_EQUARE_SIZE * UNIT_PIXEL,
            CONTAINER_EQUARE_SIZE * UNIT_PIXEL,
            CONTAINER_EQUARE_SIZE * UNIT_PIXEL
        );
        ctx.fill();
        ctx.stroke();
    }
}