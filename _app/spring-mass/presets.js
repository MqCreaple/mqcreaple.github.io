/** @typedef {{stiffness?: number,damping?: number, gravity?: number, bounce?: number, mass: (canvas: HTMLCanvasElement) => void, otherUpdate?: (dt: number) => void, sliders: string[]}} Preset */

/**
 * Load a preset onto current canvas.
 * @param {Preset} preset preset to be loaded
 */
function loadPreset(preset, canvas) {
    if(preset.stiffness != undefined) {
        stiffness = preset.stiffness;
        document.getElementById('stiffness').value = Math.sqrt(stiffness / maxStiffness) * 100;
    }
    if(preset.damping != undefined) {
        damping = preset.damping;
        document.getElementById('damping').value = (damping / maxDamping) * 100;
    }
    if(preset.gravity != undefined) {
        gravity = preset.gravity;
        document.getElementById('gravity').value = (gravity / maxGravity) * 100;
    }
    if(preset.bounce != undefined) {
        bounce = preset.bounce;
        document.getElementById('bounce').value = (bounce / maxBounce) * 100;
    }
    otherUpdate = preset.otherUpdate;
    preset.mass(canvas);
    
    const sliders = document.getElementById("preset-sliders");
    sliders.innerHTML = "";
    for(const slider of preset.sliders) {
        const li = document.createElement("li");
        li.appendChild(document.createTextNode(slider + ": "));
        const sliderElem = document.createElement("input");
        sliderElem.type = "range";
        sliderElem.id = slider;
        sliderElem.min = 0;
        sliderElem.max = 100;
        li.appendChild(sliderElem);
        sliders.appendChild(li);
    }
}

/** @type {{[key: string]: Preset}} */
const presets = {
    "none": {
        mass: (canvas) => {
            masses = [];
            fixedInFrameMasses = [];
        },
        sliders: [],
    },
    "string": {
        stiffness: 10.0,
        mass: (canvas) => {
            const numMasses = 10;
            const len = (numMasses + 1) * springLength;
            const left = FixedInFrameMass((canvas.width - len) / 2, canvas.height * 0.8, 1.0);
            const right = FixedInFrameMass((canvas.width + len) / 2, canvas.height * 0.8, 1.0);
            masses = [];
            for(let i = 0; i < numMasses; i++) {
                masses.push(Mass((canvas.width - len) / 2 + springLength * (i + 1), canvas.height * 0.8, 1.0));
            }
            addSpring(left, masses[0], springLength);
            for(let i = 0; i < numMasses - 1; i++) {
                addSpring(masses[i], masses[i + 1], springLength);
            }
            addSpring(masses[numMasses - 1], right, springLength);
            fixedInFrameMasses = [left, right];
        },
        sliders: [],
    },
    "cloth": {
        stiffness: 3.0,
        damping: 0.7,
        mass: (canvas) => {
            const numMassHorizontal = 10;
            const numMassVertical = 10;
            const lenHorizontal = (numMassHorizontal + 1) * springLength;
            const lenVertical = (numMassVertical + 1) * springLength;
            const left = FixedInFrameMass((canvas.width - lenHorizontal) / 2, (canvas.height + lenVertical) / 2, 1.0);
            const right = FixedInFrameMass((canvas.width + lenHorizontal) / 2, (canvas.height + lenVertical) / 2, 1.0);
            masses = [];
            let tmpMass = [];
            for(let i = 0; i < numMassHorizontal; i++) {
                const mass = Mass((canvas.width - lenHorizontal) / 2 + springLength * (i + 1), (canvas.height + lenVertical) / 2, 1.0);
                if(i > 0) {
                    addSpring(mass, tmpMass[i - 1], springLength);
                    if(i == numMassHorizontal - 1) {
                        addSpring(mass, right, springLength);
                    }
                } else {
                    addSpring(mass, left, springLength);
                }
                tmpMass.push(mass);
            }
            masses.push(...tmpMass);
            for(let j = 0; j < numMassVertical; j++) {
                const tmpMass2 = [];
                for(let i = 0; i < numMassHorizontal; i++) {
                    const mass = Mass((canvas.width - lenHorizontal) / 2 + springLength * (i + 1), (canvas.height + lenVertical) / 2 - springLength * (j + 1), 1.0);
                    if(i > 0) {
                        addSpring(mass, tmpMass2[i - 1], springLength);
                    }
                    addSpring(mass, tmpMass[i], springLength);
                    tmpMass2.push(mass);
                }
                masses.push(...tmpMass2);
                tmpMass = tmpMass2;
            }
            fixedInFrameMasses = [left, right];
        },
        sliders: []
    },
    "centrifuge": {
        gravity: 0,
        mass: (canvas) => {
            masses = [];
            const fixed = FixedInFrameMass(canvas.width / 2, canvas.height / 2);
            const rotating = FixedInFrameMass(canvas.width / 2 + 100, canvas.height / 2);
            fixedInFrameMasses = [fixed, rotating];
        },
        otherUpdate: (dt) => {
            const omega = 2 * Math.PI * parseInt(document.getElementById("omega").value) / 100;
            const distance = 500 * parseInt(document.getElementById("distance").value) / 100;
            const cosOmegaDt = Math.cos(omega * dt);
            const sinOmegaDt = Math.sin(omega * dt);
            const fixed = fixedInFrameMasses[0];
            const rotating = fixedInFrameMasses[1];
            rotating.pos.subEq(fixed.pos);
            rotating.pos = new Vec2(
                cosOmegaDt * rotating.pos.x + sinOmegaDt * rotating.pos.y,
                -sinOmegaDt * rotating.pos.x + cosOmegaDt * rotating.pos.y
            );
            rotating.pos.normalize();
            rotating.pos.mulEq(distance);
            rotating.pos.addEq(fixed.pos);
        },
        sliders: [ "omega", "distance" ]
    }
};