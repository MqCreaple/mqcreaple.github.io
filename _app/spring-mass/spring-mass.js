var stiffness = 10.0;
var damping = 1.0;
var gravity = 1.0;
var bounce = 0.0;

/** @type {(dt: number) => void | undefined} */
var otherUpdate = undefined

/**
 * Create a new mass object.
 * @param {number} x Initial x position
 * @param {number} y Initial y position
 * @param {number} m Mass
 * @class
 */
function Mass(x, y, m) {
    return {
        pos: new Vec2(x, y),
        m: m,
        mReciprocal: 1 / m,
        v: new Vec2(0, 0),
        a: new Vec2(0, 0),
        springs: []
    };
}

/**
 * Create a fixed in frame mass object. The mass would not move.
 * @param {number} x initial x position
 * @param {number} y initial y position
 * @class
 */
function FixedInFrameMass(x, y) {
    return {
        pos: new Vec2(x, y),
        springs: []
    }
}

/** @typedef {Mass | FixedInFrameMass} MassType */

/** @type {Mass[]} */
let masses = [];
/** @type {FixedInFrameMass[]} */
let fixedInFrameMasses = [];

// type Spring = [Mass, number];

/**
 * Add a spring between m1 and m2.
 * @param {MassType} m1 First mass to connect
 * @param {MassType} m2 Second mass to connect
 * @param {number} l length of the spring
 */
function addSpring(m1, m2, l) {
    m1.springs.push([m2, l]);
    m2.springs.push([m1, l]);
}

/** @typedef {{calcForce: (dt: number) => Vec2[], update: (forces: Vec2[], dt: number) => void}} Method */

/** @type {Method} */
const explicitEuler = {
    calcForce: (dt) => {
        const forces = []
        for(let i = 0; i < masses.length; i++) {
            const mass = masses[i];
            let force = new Vec2(0, -gravity * mass.m);
            for(const [other, l] of mass.springs) {
                const springForce = other.pos.sub(mass.pos).mul(stiffness * (other.pos.sub(mass.pos).magnitude() - l));
                // assume damping is proportional to velocity
                const dampingForce = (other.v != undefined)? 
                        other.v.sub(mass.v).mul(damping):
                        mass.v.neg().mul(damping);
                force.addEq(springForce.add(dampingForce));
            }
            forces.push(force);
        }
        return forces;
    },
    update: (forces, dt) => {
        for(let i = 0; i < masses.length; i++) {
            const mass = masses[i];
            mass.pos.addEq(mass.v.mul(dt));
            mass.v.addEq(forces[i].mul(mass.mReciprocal).mul(dt));
        }
    },
}

/** @type {Method} */
const semiImplicitEuler = {
    calcForce: explicitEuler.calcForce,
    update: (forces, dt) => {
        for(let i = 0; i < masses.length; i++) {
            const mass = masses[i];
            mass.v.addEq(forces[i].mul(mass.mReciprocal).mul(dt));
            mass.pos.addEq(mass.v.mul(dt));
        }
    }
}

/** @type {Method} */
const modifiedEuler = {
    calcForce: (dt) => {
        const fLeft = explicitEuler.calcForce(dt);
        const posBackup = masses.map(mass => mass.pos.copy());
        const vBackup = masses.map(mass => mass.v.copy());
        explicitEuler.update(fLeft, dt);
        const fRight = explicitEuler.calcForce(dt);
        for(let i = 0; i < masses.length; i++) {
            const mass = masses[i];
            mass.pos = posBackup[i];
            mass.v = vBackup[i];
        }
        const f = fLeft.map((f, i) => f.add(fRight[i]).mul(0.5));
        return f;
    },
    update: explicitEuler.update,
}

/** @type {{ [keys: string]: (mass: Mass, force: Vec2) => void }} */
const methods = {
    "explicit": explicitEuler,
    "semi-implicit": semiImplicitEuler,
    "modified-explicit": modifiedEuler,
};

/** @type {Method} */
var method = semiImplicitEuler;

/**
 * Advance time by dt
 * @param {HTMLCanvasElement} canvas canvas to draw on
 * @param {number} dt time step
 */
function advanceTime(canvas, dt) {
    method.update(method.calcForce(dt), dt);
    for(let i = 0; i < masses.length; i++) {
        const mass = masses[i];
        if(mass.pos.x < 0) {
            mass.pos.x = 0;
            mass.v.x = -mass.v.x * bounce;
        } else if(mass.pos.x > canvas.width) {
            mass.pos.x = canvas.width;
            mass.v.x = -mass.v.x * bounce;
        }
        if(mass.pos.y < 0) {
            mass.pos.y = 0;
            mass.v.y = -mass.v.y * bounce;
        } else if(mass.pos.y > canvas.height) {
            mass.pos.y = canvas.height;
            mass.v.y = -mass.v.y * bounce;
        }
    }
    if(otherUpdate != undefined) {
        otherUpdate(dt);
    }
}