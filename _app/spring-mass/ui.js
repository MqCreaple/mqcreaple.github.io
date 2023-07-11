const dtPerFrame = 0.1;
var stepsPerFrame = 10;

var massRadius = 10;
const massColor = '#000000';
const fixedInFrameMassesColor = '#0037da';
const springLength = 80;
const springColor = '#808080';
const springConnectionRadius = 1.5 * springLength;
const maxForceLength = springLength * 0.5;
const forceColorPalette = (x) => {
    return `rgb(255, ${(x > 0 && x < 1)? Math.floor(255 * (1 - x)): ((x <= 0)? 255: 0)}, 0)`;
}

var drawMass = true;
var drawSpring = true;
var drawForceScale = undefined;

function drawArrow(ctx, fromX, fromY, toX, toY, arrowWidth, color){
    if(fromX == fromY && toX == toY) {
        return;
    }
    const arrowLen = Math.sqrt((fromX - toX) * (fromX - toX) + (fromY - toY) * (fromY - toY));
    let headLen = (arrowLen > 10)? 10: (arrowLen - 1);
    let angle = Math.atan2(toY-fromY,toX-fromX);
 
    ctx.save();
    ctx.strokeStyle = color;
 
    //starting path of the arrow from the start square to the end square
    //and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineWidth = arrowWidth;
    ctx.stroke();
 
    //starting a new path from the head of the arrow to one of the sides of
    //the point
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX-headLen*Math.cos(angle-Math.PI/7),
               toY-headLen*Math.sin(angle-Math.PI/7));
 
    //path from the side point of the arrow, to the other side point
    ctx.lineTo(toX-headLen*Math.cos(angle+Math.PI/7),
               toY-headLen*Math.sin(angle+Math.PI/7));
 
    //path from the side point back to the tip of the arrow, and then
    //again to the opposite side point
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX-headLen*Math.cos(angle-Math.PI/7),
               toY-headLen*Math.sin(angle-Math.PI/7));

    //draws the paths created above
    ctx.stroke();
    ctx.restore();
}

function render(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(drawMass) {
        for(const mass of masses) {
            ctx.fillStyle = massColor;
            ctx.beginPath();
            ctx.arc(mass.pos.x, canvas.height - mass.pos.y, massRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
        for(const mass of fixedInFrameMasses) {
            ctx.fillStyle = fixedInFrameMassesColor;
            ctx.beginPath();
            ctx.arc(mass.pos.x, canvas.height - mass.pos.y, massRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    if(drawSpring) {
        for(const mass of masses) {
            for(const spring of mass.springs) {
                ctx.fillStyle = springColor;
                ctx.beginPath();
                ctx.moveTo(mass.pos.x, canvas.height - mass.pos.y);
                ctx.lineTo(spring[0].pos.x, canvas.height - spring[0].pos.y);
                ctx.stroke();
            }
        }
    }
    if(drawForceScale != undefined) {
        for(const mass of masses) {
            for(const spring of mass.springs) {
                const displacement = spring[0].pos.sub(mass.pos);
                const force = displacement.mul((displacement.magnitude() - spring[1]) * drawForceScale);
                let colorPalette = 0;
                if(force.magnitude() > maxForceLength) {
                    colorPalette = (force.magnitude() / maxForceLength - 1) / 5;
                    force.normalize();
                    force.mulEq(maxForceLength);
                }
                drawArrow(
                    ctx,
                    mass.pos.x,
                    canvas.height - mass.pos.y,
                    mass.pos.x + force.x,
                    canvas.height - mass.pos.y - force.y,
                    3,
                    forceColorPalette(colorPalette)
                );
            }
        }
    }
}

const maxStiffness = 10.0;
const maxDamping = 2.0;
const maxGravity = 2.0;
const maxBounce = 1.0;

function addEventListeners(canvas) {
    document.getElementById('display-masses').addEventListener('change', e => {
        drawMass = e.target.checked;
        document.getElementById('mass-radius').disabled = !e.target.checked;
    });
    document.getElementById('mass-radius').addEventListener('input', e => {
        massRadius = parseFloat(e.target.value) / 100 * 20.0;
    });
    document.getElementById('display-springs').addEventListener('change', e => {
        drawSpring = e.target.checked;
    });
    document.getElementById('display-force').addEventListener('change', e => {
        const forceScaleInput = document.getElementById('force-scale');
        const forceScaleValue = parseFloat(forceScaleInput.value) / 100;
        // force scale has a curve applied to it
        drawForceScale = e.target.checked? forceScaleValue * forceScaleValue * 50: undefined;
        forceScaleInput.disabled = !e.target.checked;
    });
    document.getElementById('force-scale').addEventListener('input', e => {
        if(drawForceScale != undefined) {
            const value = parseFloat(e.target.value) / 100;
            drawForceScale = value * value * 50;
        }
    });
    document.getElementById('stiffness').addEventListener('input', e => {
        const input = parseFloat(e.target.value) / 100;
        stiffness = input * input * maxStiffness;               // apply a curve to the input
    });
    document.getElementById('damping').addEventListener('input', e => {
        damping = parseFloat(e.target.value) / 100 * maxDamping;
    });
    document.getElementById('gravity').addEventListener('input', e => {
        gravity = parseFloat(e.target.value) / 100 * maxGravity;
    });
    document.getElementById('bounce').addEventListener('input', e => {
        bounce = parseFloat(e.target.value) / 100 * maxBounce;
    });
    document.getElementById('steps-per-frame').addEventListener('change', e => {
        stepsPerFrame = parseInt(e.target.value);
    });
    document.getElementsByName('integration-method').forEach(element => element.addEventListener('change', e => {
        method = methods[e.target.value];
    }));
    document.getElementById('presets').addEventListener('change', e => {
        const preset = presets[e.target.value];
        if(preset) {
            loadPreset(preset, canvas);
        }
    });
}

function main() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * canvas.width / rect.width;
        const y = (rect.bottom - e.clientY) * canvas.height / rect.height;
        if(x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const newMass = e.shiftKey? FixedInFrameMass(x, y): Mass(x, y, 1.0);
            for(const mass of masses) {
                if(mass.pos.sub(newMass.pos).magnitude() < springConnectionRadius) {
                    addSpring(mass, newMass, springLength);
                }
            }
            for(const mass of fixedInFrameMasses) {
                if(mass.pos.sub(newMass.pos).magnitude() < springConnectionRadius) {
                    addSpring(mass, newMass, springLength);
                }
            }
            e.shiftKey? fixedInFrameMasses.push(newMass): masses.push(newMass);
        }
    });
    addEventListeners(canvas);
    setInterval(() => {
        for(let i = 0; i < stepsPerFrame; i++) {
            advanceTime(canvas, dtPerFrame / stepsPerFrame);
        }
        render(canvas, ctx);
    }, 1000 / 60);
}