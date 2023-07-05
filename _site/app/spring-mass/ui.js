var massRadius = 10;
const massColor = '#000000';
const fixedInFrameMassesColor = '#0037da';
const springLength = 80;
const springColor = '#808080';
const springConnectionRadius = 1.5 * springLength;

var drawMass = true;
var drawSpring = true;

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
        let springDrawn = new Set();
        for(const mass of masses) {
            for(const spring of mass.springs) {
                springDrawn.add([mass, spring[0]]);
                ctx.fillStyle = springColor;
                ctx.beginPath();
                ctx.moveTo(mass.pos.x, canvas.height - mass.pos.y);
                ctx.lineTo(spring[0].pos.x, canvas.height - spring[0].pos.y);
                ctx.stroke();
            }
        }
    }
}

function addEventListeners() {
    document.getElementById('display-masses').addEventListener('change', e => {
        drawMass = e.target.checked;
        document.getElementById('mass-radius').disabled = !e.target.checked;
    });
    document.getElementById('mass-radius').addEventListener('change', e => {
        massRadius = parseFloat(e.target.value) / 100 * 20.0;
    });
    document.getElementById('display-springs').addEventListener('change', e => {
        drawSpring = e.target.checked;
    });
    document.getElementById('stiffness').addEventListener('change', e => {
        stiffness = parseFloat(e.target.value) / 100 * 5.0;
    });
    document.getElementById('damping').addEventListener('change', e => {
        damping = parseFloat(e.target.value) / 100 * 1.0;
    });
    document.getElementById('gravity').addEventListener('change', e => {
        gravity = parseFloat(e.target.value) / 100 * 2.0;
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
            const newMass = e.shiftKey? FixedInFrameMass(x, y, 1.0): Mass(x, y, 1.0);
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
    addEventListeners();
    setInterval(() => {
        for(let i = 0; i < 10; i++) {
            advanceTime(semiImplicitEuler, canvas);
        }
        render(canvas, ctx);
    }, 1000 / 60);
}