var stiffness = 2.5;
var damping = 0.5;
var gravity = 1.0;
var dt = 0.01;

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
 * @param {number} m mass
 * @class
 */
function FixedInFrameMass(x, y, m) {
    return {
        pos: new Vec2(x, y),
        m: m,
        mReciprocal: 1 / m,
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

/**
 * Forward Euler integration
 * @param {Mass} mass mass object to update
 * @param {Vec2} force force
 */
function forwardEuler(mass, force) {
    mass.pos.addEq(mass.v.mul(dt));
    mass.v.addEq(force.mul(mass.mReciprocal).mul(dt));
}

/**
 * Semi-implicit Euler integration
 * @param {Mass} mass mass object to update
 * @param {Vec2} force force
 */
function semiImplicitEuler(mass, force) {
    mass.v.addEq(force.mul(mass.mReciprocal).mul(dt));
    mass.pos.addEq(mass.v.mul(dt));
}

/** @type {number} */
let globalTime = 0.0;

/**
 * Advance time by dt
 * @param {(mass: Mass, force: Vec2) => void} method method to calculate the next position of the mass
 * @param {HTMLCanvasElement} canvas canvas to draw on
 */
function advanceTime(method, canvas) {
    globalTime += dt;
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
    for(let i = 0; i < masses.length; i++) {
        const mass = masses[i];
        const force = forces[i];
        method(mass, force);
        if(mass.pos.x < 0) {
            mass.pos.x = 0;
        } else if(mass.pos.x > canvas.width) {
            mass.pos.x = canvas.width;
        }
        if(mass.pos.y < 0) {
            mass.pos.y = 0;
        } else if(mass.pos.y > canvas.height) {
            mass.pos.y = canvas.height;
        }
    }
}