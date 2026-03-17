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
     */
    constructor(name, lagrangian, glslCode, latexCode, startX, startT, endX, endT) {
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
    }
}

const LEVLES = [
    new Level(
        "Empty Space",
        (x, v) => { return 0.5 * v * v; },
        `return 0.5 * v * v;`,
        "$\\mathcal{L} = \\frac{1}{2} v^2$",
        -1, 0, 1, 1,
    ),
    new Level(
        "Simple Harmonic Oscillation",
        (x, v) => { return 0.5 * v * v - 0.5 * x * x; },
        `return 0.5 * v * v - 0.5 * x * x;`,
        "$\\mathcal{L} = \\frac{1}{2} v^2 - \\frac{1}{2} x^2$",
        -1, 0, 1, 2 * Math.PI,
    ),
    new Level(
        "Simple Pendulum",
        (x, v) => { return 0.5 * v * v - (1.0 - Math.cos(x)); },
        `return 0.5 * v * v - (1.0 - cos(x));`,
        "$\\mathcal{L} = \\frac{1}{2} v^2 - (1 - \\cos(x))$",
        -1, 0, 1, 2 * Math.PI,
    ),
    new Level(
        "Atom in Special Relativity",
        (x, v) => { return 1.0 - Math.sqrt(1.0 - v * v) - 0.5 * x * x; },
        `if(abs(v) < 1.0) { return 1.0 - sqrt(1.0 - v * v) - 0.5 * x * x; } else { return 0.0; }`,
        "$\\mathcal{L} = 1 - \\sqrt{1 - v^2} - \\frac{1}{2} x^2$",
        -1, 0, 1, 2 * Math.PI,
    ),
];
