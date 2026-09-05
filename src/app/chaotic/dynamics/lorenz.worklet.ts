// AudioWorklet code runs in the AudioWorkletGlobalScope, whose globals are not
// part of TypeScript's DOM lib. Declare the subset this worklet uses.
declare class AudioWorkletProcessor {
    readonly port: MessagePort;
    constructor(options?: AudioWorkletNodeOptions);
}

declare const sampleRate: number;

declare function registerProcessor(
    name: string,
    processorCtor: new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor,
): void;

function normalizeRange(value: number, min: number, max: number): number {
    if (max <= min) return 0;
    return Math.min(1, Math.max(-1, ((value - min) / (max - min)) * 2 - 1));
}
class LorenzProcessor extends AudioWorkletProcessor {
    private x: number;
    private y: number;
    private z: number;

    private sigma: number;
    private rho: number;
    private beta: number;
    private rate: number;   // The rate at which the Lorenz equations are integrated, in seconds.
                            // The dt between two consecutive samples is rate / sampleRate.
    private xmin: number;
    private xmax: number;
    private ymin: number;
    private ymax: number;
    private zmin: number;
    private zmax: number;
    private framesSinceState = 0;

    constructor(options?: AudioWorkletNodeOptions) {
        super();

        const p = options?.processorOptions ?? {};
        this.x = p.x ?? 1;
        this.y = p.y ?? 1;
        this.z = p.z ?? 1;
        this.sigma = p.sigma ?? 10;
        this.rho = p.rho ?? 28;
        this.beta = p.beta ?? 8 / 3;
        this.rate = p.rate ?? 1.0;
        this.xmin = p.xmin ?? -21.3;
        this.xmax = p.xmax ?? 21.3;
        this.ymin = p.ymin ?? -29.7;
        this.ymax = p.ymax ?? 29.7;
        this.zmin = p.zmin ?? 0.8;
        this.zmax = p.zmax ?? 53.7;

        this.port.onmessage = e => {
            const d = e.data;
            if (d.type === "parameters") {
                if (d.sigma !== undefined) this.sigma = d.sigma;
                if (d.rho !== undefined) this.rho = d.rho;
                if (d.beta !== undefined) this.beta = d.beta;
                if (d.rate !== undefined) this.rate = d.rate;
                if (d.xmin !== undefined) this.xmin = d.xmin;
                if (d.xmax !== undefined) this.xmax = d.xmax;
                if (d.ymin !== undefined) this.ymin = d.ymin;
                if (d.ymax !== undefined) this.ymax = d.ymax;
                if (d.zmin !== undefined) this.zmin = d.zmin;
                if (d.zmax !== undefined) this.zmax = d.zmax;
            }
            if (d.type === "reset") {
                this.x = d.x ?? 1;
                this.y = d.y ?? 1;
                this.z = d.z ?? 1;
            }
        };
    }

    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        // Lorenz worklet need to output x, y, and z as three channels instead of three outputs.
        const outX = outputs[0][0];
        const outY = outputs[0][1];
        const outZ = outputs[0][2];
        for (let i = 0; i < outX.length; i++) {
            /*
             * Lorenz equations
             */
            const dx = this.sigma * (this.y - this.x);
            const dy = this.x * (this.rho - this.z) - this.y;
            const dz = this.x * this.y - this.beta * this.z;

            /*
             * Euler integration
             */
            const dt = this.rate / sampleRate;
            this.x += dx * dt;
            this.y += dy * dt;
            this.z += dz * dt;

            outX[i] = normalizeRange(this.x, this.xmin, this.xmax);
            outY[i] = normalizeRange(this.y, this.ymin, this.ymax);
            outZ[i] = normalizeRange(this.z, this.zmin, this.zmax);
        }
        this.framesSinceState++;
        if (this.framesSinceState >= 2) {
            this.framesSinceState = 0;
            this.port.postMessage({ type: "state", x: this.x, y: this.y, z: this.z });
        }
        return true;
    }
}

registerProcessor(
    "lorenz-attractor",
    LorenzProcessor
);