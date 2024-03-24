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
    const topIndex = (quantity.length - Math.round(angle * quantity.length / (2 * Math.PI))) % quantity.length;
    quantity[topIndex] += FILL_RATE * dt;
    for(let i = 0; i < quantity.length; i++) {
        quantity[i] *= Math.exp(-LOG_DRAIN_RATE * dt);
        if(quantity[i] < 0) {
            quantity[i] = 0;
        }
        torque += quantity[i] * Math.sin(angle + i * 2 * Math.PI / quantity.length) * ARM_LENGTH;
    }
    angleVel += (torque - ANGULAR_RESISTENCE * angleVel) * dt;
    angle += angleVel * dt;
    angle %= 2 * Math.PI;
}

function getGravityCenter() {
    let x = 0;
    let y = 0;
    let quantitySum = 0;
    for(let i = 0; i < quantity.length; i++) {
        x += quantity[i] * ARM_LENGTH * Math.sin(angle + i * 2 * Math.PI / quantity.length);
        y += quantity[i] * ARM_LENGTH * Math.cos(angle + i * 2 * Math.PI / quantity.length);
        quantitySum += quantity[i];
    }
    console.log(quantitySum);
    return [x / quantitySum, y / quantitySum];
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
    for(let i = 0; i < quantity.length; i++) {
        ctx.beginPath();
        ctx.color
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(
            canvas.width / 2 + ARM_LENGTH * UNIT_PIXEL * Math.sin(angle + i * 2 * Math.PI / quantity.length),
            canvas.height / 2 - ARM_LENGTH * UNIT_PIXEL * Math.cos(angle + i * 2 * Math.PI / quantity.length)
        );
        ctx.stroke();
    }
    // draw each container of the wheel using an rectangle
    for(let i = 0; i < quantity.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 0, 255, ${quantity[i] * FILL_VISUAL_SCALE})`;
        ctx.rect(
            canvas.width / 2 + ARM_LENGTH * UNIT_PIXEL * Math.sin(angle + i * 2 * Math.PI / quantity.length) - 0.5 * CONTAINER_EQUARE_SIZE * UNIT_PIXEL,
            canvas.height / 2 - ARM_LENGTH * UNIT_PIXEL * Math.cos(angle + i * 2 * Math.PI / quantity.length) - 0.5 * CONTAINER_EQUARE_SIZE * UNIT_PIXEL,
            CONTAINER_EQUARE_SIZE * UNIT_PIXEL,
            CONTAINER_EQUARE_SIZE * UNIT_PIXEL
        );
        ctx.fill();
        ctx.stroke();
    }
    // draw the gravity center of the wheel
    ctx.beginPath();
    ctx.fillStyle = "red";
    let gravityCenter = getGravityCenter();
    ctx.arc(
        canvas.width / 2 + gravityCenter[0] * UNIT_PIXEL,
        canvas.height / 2 - gravityCenter[1] * UNIT_PIXEL,
        0.01 * UNIT_PIXEL,
        0,
        2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();
}