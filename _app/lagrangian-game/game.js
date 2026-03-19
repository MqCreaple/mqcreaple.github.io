class Level {
    /**
     * @param {string} name Name of the level.
     * @param {(x: number, v: number) => number} lagrangian The lagrangian function in javascript code.
     * @param {string} glslCode The equivalent GLSL code of the lagrangian. Used to render the function.
     * @param {string} latexCode The latex equation of the lagrangian, for displaying the equation.
     * @param {number} startX The position to start at.
     * @param {number} startT The time to start at.
     * @param {number} endX The position to end at.
     * @param {number} endT The time to end at.
     * @param {(t: number) => number | undefined} solution The solution to the lagrangian equation at given constraints.
     */
    constructor(name, lagrangian, glslCode, latexCode, startX, startT, endX, endT, solution) {
        /** @type {string} */
        this.name = name;
        /** @type {(x: number, v: number) => number} */
        this.lagrangian = lagrangian;
        /** @type {string} */
        this.glslCode = glslCode;
        /** @type {string} */
        this.latexCode = latexCode;
        /** @type {number} */
        this.startX = startX;
        /** @type {number} */
        this.startT = startT;
        /** @type {number} */
        this.endX = endX;
        /** @type {number} */
        this.endT = endT;
        /** @type {(t: number) => number | undefined} */
        this.solution = solution;
    }
}

const LEVELS = [
    new Level(
        "Empty Space",
        (x, v) => { return 0.5 * v * v; },
        `return 0.5 * v * v;`,
        "\\mathcal{L} = \\frac{1}{2} \\dot{x}^2",
        -1, 0, 1, 1,
        (t) => t * 2 - 1,
    ),
    new Level(
        "Simple Gravitation",
        (x, v) => { return 0.5 * v * v - x; },
        `return 0.5 * v * v - x;`,
        "\\mathcal{L} = \\frac{1}{2} \\dot{x}^2 - x",
        0.5, 0, 0, 1,
        (t) => 0.5 - 0.5 * t * t,
    ),
    new Level(
        "Simple Harmonic Oscillation",
        (x, v) => { return 0.5 * v * v - 0.5 * x * x; },
        `return 0.5 * v * v - 0.5 * x * x;`,
        "\\mathcal{L} = \\frac{1}{2} \\dot{x}^2 - \\frac{1}{2} x^2",
        -1, 0, 1, Math.PI,
        (t) => -Math.cos(t),
    ),
    new Level(
        "Simple Pendulum",
        (x, v) => { return 0.5 * v * v - (1.0 - Math.cos(x)); },
        `return 0.5 * v * v - (1.0 - cos(x));`,
        "\\mathcal{L} = \\frac{1}{2} \\dot{x}^2 - (1 - \\cos(x))",
        -1, 0, 1, Math.PI,
    ),
    new Level(
        "Linear Potential in Special Relativity",
        (x, v) => { return 1.0 - Math.sqrt(1.0 - v * v) - x; },
        `if(abs(v) < 1.0) { return 1.0 - sqrt(1.0 - v * v) - x; } else { return 0.0; }`,
        "\\mathcal{L} = 1 - \\sqrt{1 - \\dot{x}^2} - x",
        0.5, 0, 0, 1,
    ),
    new Level(
        "Quadratic Potential in Special Relativity",
        (x, v) => { return 1.0 - Math.sqrt(1.0 - v * v) - 0.5 * x * x; },
        `if(abs(v) < 1.0) { return 1.0 - sqrt(1.0 - v * v) - 0.5 * x * x; } else { return 0.0; }`,
        "\\mathcal{L} = 1 - \\sqrt{1 - \\dot{x}^2} - \\frac{1}{2} x^2",
        -1, 0, 1, Math.PI,
    ),
];

/**
 * Compute the velocity array from the time and position arrays.
 * @param {Float64Array} timeArray Array of the time values
 * @param {Float64Array} posArray Array of the position values
 * @returns {Float64Array} The velocity array
 */
function computeVelocity(timeArray, posArray) {
    // Compute velocity array using numerical differentiation
    const velocity = new Float64Array(posArray.length);
    for (let i = 0; i < posArray.length; i++) {
        if (i === 0) {
            // Forward difference for first point
            velocity[i] = (posArray[1] - posArray[0]) / (timeArray[1] - timeArray[0]);
        } else if (i === posArray.length - 1) {
            // Backward difference for last point
            velocity[i] = (posArray[i] - posArray[i - 1]) / (timeArray[i] - timeArray[i - 1]);
        } else {
            // Central difference for interior points
            velocity[i] = (posArray[i + 1] - posArray[i - 1]) / (timeArray[i + 1] - timeArray[i - 1]);
        }
    }
    return velocity;
}

/**
 * Compute the total action along the given path by trapezoidal numerical integration.
 * 
 * The action is defined as the integral of the lagrangian with times.
 * @param {Level} level Current level
 * @param {Float64Array} timeArray Array of the time values
 * @param {Float64Array} posArray Array of the position values
 * @returns {number} The action value along the path
 */
function computeAction(level, timeArray, posArray) {
    let action = 0;
    const velocity = computeVelocity(timeArray, posArray);
    for(let i = 0; i < timeArray.length - 1; i++) {
        const t0 = timeArray[i];
        const t1 = timeArray[i + 1];
        const x0 = posArray[i];
        const x1 = posArray[i + 1];
        const v0 = velocity[i];
        const v1 = velocity[i + 1];
        action += 0.5 * (level.lagrangian(x0, v0) + level.lagrangian(x1, v1)) * (t1 - t0);
    }
    return action
}