import * as Tone from "tone";
import workletUrl from "./lorenz.worklet.ts?worklet";

export interface LorenzState {
    x: number;
    y: number;
    z: number;
}

export interface LorenzOptions {
    context?: Tone.BaseContext;
    sigma?: number;
    rho?: number;
    beta?: number;
    dt?: number;
    xmin?: number;
    xmax?: number;
    ymin?: number;
    ymax?: number;
    zmin?: number;
    zmax?: number;

    initial?: {
        x?: number;
        y?: number;
        z?: number;
    };
}

export class Lorenz extends Tone.ToneAudioNode {
    readonly name = "Lorenz";
    readonly input = undefined;
    readonly output: ChannelSplitterNode;

    public readonly x: Tone.Signal;
    public readonly y: Tone.Signal;
    public readonly z: Tone.Signal;

    private state: LorenzState = { x: 1, y: 1, z: 1 };
    private readonly ranges: Record<keyof LorenzState, readonly [number, number]>;
    private readonly worklet: AudioWorkletNode;
    private readonly splitter: ChannelSplitterNode;
    private readonly silentGain: GainNode;

    constructor(options: LorenzOptions = {}) {
        super(options);

        const {
            sigma = 10,
            rho = 28,
            beta = 8 / 3,
            dt = 1 / this.context.sampleRate,
            xmin = -21.3,
            xmax = 21.3,
            ymin = -29.7,
            ymax = 29.7,
            zmin = 0.8,
            zmax = 53.7,
            initial = {},
        } = options;
        const {
            x = 1,
            y = 1,
            z = 1,
        } = initial;

        this.ranges = {
            x: [xmin, xmax],
            y: [ymin, ymax],
            z: [zmin, zmax],
        };

        this.worklet = this.context.createAudioWorkletNode("lorenz-attractor", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [3],
            processorOptions: {
                sigma,
                rho,
                beta,
                dt,
                xmin,
                xmax,
                ymin,
                ymax,
                zmin,
                zmax,
                x,
                y,
                z,
            },
        });

        this.splitter = this.context.createChannelSplitter(3);
        this.worklet.connect(this.splitter);
        this.output = this.splitter;

        this.x = new Tone.Signal({ context: this.context, value: 0 });
        this.y = new Tone.Signal({ context: this.context, value: 0 });
        this.z = new Tone.Signal({ context: this.context, value: 0 });

        // Split the worklet's single three-channel output into three audio-rate signals.
        Tone.connect(this.splitter, this.x, 0);
        Tone.connect(this.splitter, this.y, 1);
        Tone.connect(this.splitter, this.z, 2);

        // Keep the worklet graph running even when no modulation target is connected.
        this.silentGain = this.context.createGain();
        this.silentGain.gain.value = 0;
        this.x.connect(this.silentGain);
        this.y.connect(this.silentGain);
        this.z.connect(this.silentGain);
        Tone.connect(this.silentGain, this.context.destination);

        this.state = { x, y, z };
        this.worklet.port.onmessage = (e) => {
            const d = e.data as { type?: string; x?: number; y?: number; z?: number };
            if (d?.type === "state" && typeof d.x === "number" && typeof d.y === "number" && typeof d.z === "number") {
                this.state = { x: d.x, y: d.y, z: d.z };
            }
        };
    }

    /** Load the worklet module, then construct the attractor on that context. */
    static async create(options: LorenzOptions = {}): Promise<Lorenz> {
        const context = options.context ?? Tone.getContext();
        await context.addAudioWorkletModule(workletUrl);
        return new Lorenz({ ...options, context });
    }

    /** Latest state reported by the AudioWorklet processor. */
    getState(): Readonly<LorenzState> {
        return this.state;
    }

    /** Latest attractor output on an axis, mapped to the worklet's [-1, 1] signal. */
    getSignal(axis: keyof LorenzState): number {
        const [min, max] = this.ranges[axis];
        const value = this.state[axis];
        if (max <= min) return 0;
        return Math.min(1, Math.max(-1, ((value - min) / (max - min)) * 2 - 1));
    }

    setParameters(
        params: Partial<Pick<LorenzOptions, "sigma" | "rho" | "beta" | "dt">>,
    ): void {
        this.worklet.port.postMessage({
            type: "parameters",
            ...params,
        });
    }

    reset(x = 1, y = 1, z = 1): void {
        this.worklet.port.postMessage({
            type: "reset",
            x,
            y,
            z,
        });
    }

    override dispose(): this {
        this.worklet.disconnect();
        super.dispose();
        this.silentGain.disconnect();
        this.x.dispose();
        this.y.dispose();
        this.z.dispose();
        return this;
    }
}