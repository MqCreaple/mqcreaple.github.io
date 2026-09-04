// signal-plots.ts — per-section signal diagrams for the "chaotic" app.
// Each diagram lives inside its fx-section (waveform in Oscillator, ADSR
// envelope in Envelope, filter magnitude response in Filter) and updates
// live as the knobs are turned. uPlot renders compact Canvas charts styled
// with the site's theme colors so the diagrams blend with the page.

import * as Tone from 'tone';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { computeThemeColors } from '../../components/InteractiveDiagramBuilder.ts';
import type { ThemeColors } from '../../components/InteractiveDiagramBuilder.ts';
import type { EnvConfig, InstrumentConfig } from './engine.ts';

export type PlotKind = 'waveform' | 'envelope' | 'filter';

type PlotData = [number[], number[]];

interface PlotModel {
  data: PlotData;
  xRange: [number, number];
  yRange: [number, number];
  xLog?: boolean;
  lineColor: string;
}

const PLOT_HEIGHT = 130;
/** A filter curve is smooth at this rate without spending a frame on every audio tick. */
const FILTER_ANIMATION_INTERVAL = 1000 / 24;

// --- Data computation ------------------------------------------------------

/** One period of the selected oscillator waveform, plus a little on each side. */
function waveformData(waveform: OscillatorType): PlotData {
  const t: number[] = [];
  const y: number[] = [];
  const samples = 200;
  const pad = 0.1; // extra fraction of a period shown before/after
  for (let i = 0; i <= samples; i++) {
    const time = -pad + (i / samples) * (1 + 2 * pad);
    const p = ((time % 1) + 1) % 1; // wrap into [0, 1)
    let v: number;
    switch (waveform) {
      case 'triangle':
        v = p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
        break;
      case 'sawtooth':
        v = 2 * p - 1;
        break;
      case 'square':
        v = p < 0.5 ? 1 : -1;
        break;
      default: // sine
        v = Math.sin(time * 2 * Math.PI);
    }
    t.push(time);
    y.push(v);
  }
  return [t, y];
}

/** Sample the ADSR shape using Tone's own envelope automation (getValueAtTime). */
function envelopeData(env: EnvConfig): PlotData {
  const attack = Math.max(env.attack, 0.001);
  const decay = Math.max(env.decay, 0.001);
  const release = Math.max(env.release, 0.001);
  const sustain = Math.min(Math.max(env.sustain, 0), 1);
  const hold = attack + decay + 0.5; // a short sustain hold after the decay
  const total = hold + release;
  const start = Tone.now();

  // A fresh, disconnected envelope: trigger it, then read back the automation.
  const envelope = new Tone.Envelope({
    attack,
    decay,
    sustain,
    release,
    attackCurve: env.curve,
    decayCurve: env.curve,
    releaseCurve: env.curve,
  });
  envelope.triggerAttackRelease(hold, start, 1);

  const t: number[] = [];
  const y: number[] = [];
  const samples = 240;
  for (let i = 0; i <= samples; i++) {
    const time = (i / samples) * total;
    t.push(time);
    y.push(envelope.getValueAtTime(start + time));
  }
  envelope.dispose();
  return [t, y];
}

// --- Plotting --------------------------------------------------------------

export class SignalPlot {
  readonly kind: PlotKind;
  private state: InstrumentConfig;
  private readonly container: HTMLElement;
  private readonly getActualCutoff: (() => number) | null;
  private readonly getFilterResponse: ((len: number) => Float32Array) | null;
  private readonly shouldAnimateFilter: (() => boolean) | null;
  private oscIndex: 1 | 2 | null;
  private readonly resizeObserver: ResizeObserver;
  private readonly themeChangeHandler: () => void;
  private plot: uPlot | null = null;
  private colors: ThemeColors = computeThemeColors();
  private redrawQueued = false;
  private framePending = false;
  private filterAnimationFrame: number | null = null;
  private lastFilterAnimationAt = 0;
  private forceRecreate = true;
  private filterCutoff = 1000;

  constructor(
    container: HTMLElement,
    kind: PlotKind,
    state: InstrumentConfig,
    getActualCutoff?: () => number,
    oscIndex?: 1 | 2,
    getFilterResponse?: (len: number) => Float32Array,
    shouldAnimateFilter?: () => boolean,
  ) {
    this.container = container;
    this.kind = kind;
    this.state = state;
    this.getActualCutoff = getActualCutoff ?? null;
    this.getFilterResponse = getFilterResponse ?? null;
    this.shouldAnimateFilter = shouldAnimateFilter ?? null;
    this.oscIndex = oscIndex ?? null;
    this.themeChangeHandler = () => {
      // Colors are part of uPlot's construction options, so recreate only
      // when the site theme changes rather than on every parameter change.
      this.colors = computeThemeColors();
      this.forceRecreate = true;
      this.scheduleRedraw();
    };
    window.addEventListener('themechange', this.themeChangeHandler);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.scheduleRedraw();
  }

  /** Update the plotted signal from the instrument's live parameter state. */
  setState(state: InstrumentConfig): void {
    this.state = state;
    this.scheduleRedraw();
  }

  /** Redraw now (e.g. after a note changes the key-tracked filter cutoff). */
  refresh(): void {
    this.scheduleRedraw();
  }
  /** Point a waveform plot at another oscillator (tab switching). */
  setOscIndex(osc: 1 | 2): void {
    if (this.oscIndex === osc) return;
    this.oscIndex = osc;
    this.scheduleRedraw();
  }

  /** Release DOM and animation resources if the enclosing synth is removed. */
  dispose(): void {
    if (this.filterAnimationFrame !== null) cancelAnimationFrame(this.filterAnimationFrame);
    this.filterAnimationFrame = null;
    this.resizeObserver.disconnect();
    window.removeEventListener('themechange', this.themeChangeHandler);
    this.plot?.destroy();
    this.plot = null;
  }

  private resize(): void {
    const width = this.chartWidth();
    if (width <= 0) {
      this.scheduleRedraw();
      return;
    }
    if (!this.plot) {
      this.scheduleRedraw();
      return;
    }
    if (this.plot.width !== width || this.plot.height !== PLOT_HEIGHT) {
      this.plot.setSize({ width, height: PLOT_HEIGHT });
    }
  }

  private chartWidth(): number {
    return Math.floor(this.container.clientWidth);
  }

  private scheduleRedraw(): void {
    this.redrawQueued = true;
    this.ensureFilterAnimation();
    if (this.framePending) return;
    this.framePending = true;
    requestAnimationFrame(() => {
      this.framePending = false;
      this.redraw();
    });
  }

  /** Keep one 24 fps producer alive only while a filter modulation exists. */
  private ensureFilterAnimation(): void {
    const animate = this.kind === 'filter' && this.shouldAnimateFilter?.();
    if (!animate) {
      if (this.filterAnimationFrame !== null) cancelAnimationFrame(this.filterAnimationFrame);
      this.filterAnimationFrame = null;
      return;
    }
    if (this.filterAnimationFrame !== null) return;
    this.filterAnimationFrame = requestAnimationFrame((timestamp) => {
      this.filterAnimationFrame = null;
      if (timestamp - this.lastFilterAnimationAt >= FILTER_ANIMATION_INTERVAL) {
        this.lastFilterAnimationAt = timestamp;
        this.scheduleRedraw();
      }
      this.ensureFilterAnimation();
    });
  }

  private model(): PlotModel | null {
    if (this.kind === 'waveform') {
      // When bound to a specific oscillator voice, plot that voice's waveform;
      // otherwise fall back to the first enabled oscillator.
      const osc =
        this.oscIndex === 1
          ? this.state.osc.osc1
          : this.oscIndex === 2
            ? this.state.osc.osc2
            : this.state.osc.osc1.enabled
              ? this.state.osc.osc1
              : this.state.osc.osc2;
      return {
        data: waveformData(osc.waveform),
        xRange: [-0.14, 1.14],
        yRange: [-1.2, 1.2],
        lineColor: this.colors.accentStrong,
      };
    }

    if (this.kind === 'envelope') {
      return {
        data: envelopeData(this.state.env),
        xRange: [0, Math.max(0.01, this.state.env.attack + this.state.env.decay + this.state.env.release + 0.5)],
        yRange: [-0.05, 1.15],
        lineColor: this.colors.accent,
      };
    }

    if (!this.getFilterResponse) return null;
    const len = 160;
    const magnitudes = this.getFilterResponse(len);
    const frequency: number[] = [];
    const decibels: number[] = [];
    for (let i = 0; i < len; i++) {
      const norm = Math.pow(i / len, 2);
      frequency.push(norm * (20000 - 20) + 20);
      decibels.push(20 * Math.log10(Math.max(magnitudes[i], 1e-8)));
    }
    this.filterCutoff = Math.min(20000, Math.max(20, this.getActualCutoff?.() ?? 1000));
    const maxDb = Math.max(0, ...decibels);
    return {
      data: [frequency, decibels],
      xRange: [20, 20000],
      yRange: [-70, maxDb + 6],
      xLog: true,
      lineColor: this.colors.accent,
    };
  }

  private axisOptions(): uPlot.Axis[] {
    const shared = {
      stroke: this.colors.muted,
      font: '8px Verdana, Geneva, sans-serif',
      grid: { show: true, stroke: this.colors.border, width: 1 },
      ticks: { show: true, stroke: this.colors.border, width: 1, size: 4 },
      border: { show: true, stroke: this.colors.border, width: 1 },
    };
    return [
      { ...shared, size: 22, gap: 4 },
      { ...shared, size: 34, gap: 4 },
    ];
  }

  private cutoffMarkerPlugin(): uPlot.Plugin {
    return {
      hooks: {
        // draw runs after the axes and the curve, keeping this marker visible
        // without allocating or mutating a separate data series each frame.
        draw: (plot) => {
          if (this.kind !== 'filter') return;
          const x = plot.valToPos(this.filterCutoff, 'x', true);
          const { top, height } = plot.bbox;
          const context = plot.ctx;
          context.save();
          context.strokeStyle = this.colors.border;
          context.lineWidth = 1;
          context.setLineDash([3, 3]);
          context.beginPath();
          context.moveTo(x, top);
          context.lineTo(x, top + height);
          context.stroke();
          context.restore();
        },
      },
    };
  }

  private create(model: PlotModel): uPlot {
    const options: uPlot.Options = {
      width: this.chartWidth(),
      height: PLOT_HEIGHT,
      pxAlign: true,
      series: [
        {},
        { stroke: model.lineColor, width: 2, points: { show: false } },
      ],
      scales: {
        x: {
          time: false,
          auto: false,
          range: model.xRange,
          distr: model.xLog ? 3 : 1,
          log: 10,
        },
        y: { time: false, auto: false, range: model.yRange },
      },
      axes: this.axisOptions(),
      cursor: { show: false },
      select: { show: false, left: 0, top: 0, width: 0, height: 0 },
      legend: { show: false },
      plugins: this.kind === 'filter' ? [this.cutoffMarkerPlugin()] : [],
    };
    return new uPlot(options, model.data, this.container);
  }

  private redraw(): void {
    if (!this.redrawQueued) return;
    this.redrawQueued = false;
    if (this.chartWidth() <= 0) {
      this.redrawQueued = true;
      return;
    }

    const model = this.model();
    if (!model) return;

    if (!this.plot || this.forceRecreate) {
      this.plot?.destroy();
      this.plot = this.create(model);
      this.forceRecreate = false;
      return;
    }

    // batch coalesces the curve, dynamic filter y-range, and cutoff marker
    // into one Canvas redraw. Unlike Plotly.react/update, no asynchronous
    // update queue can accumulate when the modulation is active.
    this.plot.batch(() => {
      this.plot?.setData(model.data, false);
      const y = this.plot?.scales.y;
      if (y && (y.min !== model.yRange[0] || y.max !== model.yRange[1])) {
        this.plot?.setScale('y', { min: model.yRange[0], max: model.yRange[1] });
      }
    }, true);
  }
}

