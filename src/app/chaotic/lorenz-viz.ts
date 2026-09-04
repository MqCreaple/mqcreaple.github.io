// lorenz-viz.ts — live Lorenz attractor visualisation for the chaotic app.
// The trajectory is *not* integrated here: the visible x/y/z values come from
// the Lorenz AudioWorklet component in the audio engine, which posts its
// current state back to the main thread at a throttled audio-block rate.
// A Three.js line renders the 3D trajectory and three stacked uPlot strips
// show x/y/z over time, all fed from the engine signal state.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { computeThemeColors } from '../../components/InteractiveDiagramBuilder.ts';
import type { ThemeColors } from '../../components/InteractiveDiagramBuilder.ts';
import type { Lorenz } from './dynamics/lorenz.ts';
import { FloatRingBuffer, TimeRingBuffer } from './ring-buffer.ts';

const BUFFER_CAPACITY = 1024;
const PLOT_HEIGHT = 92;
const PLOT_UPDATE_MS = 1000 / 30;
const MAX_FRAME_DT = 0.05;

type Axis = 'x' | 'y' | 'z';
type PlotContainers = Record<Axis, HTMLElement | null>;
type Plots = Partial<Record<Axis, uPlot>>;
function axisColor(colors: ThemeColors, axis: Axis): string {
  if (axis === 'x') return colors.accentStrong;
  if (axis === 'y') return colors.accent;
  return colors.error;
}

export class LorenzVisualizer {
  private readonly root: HTMLElement;
  private readonly getLorenz: () => Lorenz | null;
  private colors: ThemeColors = computeThemeColors();
  private readonly xRing = new FloatRingBuffer(BUFFER_CAPACITY);
  private readonly yRing = new FloatRingBuffer(BUFFER_CAPACITY);
  private readonly zRing = new FloatRingBuffer(BUFFER_CAPACITY);
  private readonly timeRing = new TimeRingBuffer(BUFFER_CAPACITY);
  private plotTime = 0;
  private readonly orderedTime = new Float64Array(BUFFER_CAPACITY);
  private readonly orderedX = new Float32Array(BUFFER_CAPACITY);
  private readonly orderedY = new Float32Array(BUFFER_CAPACITY);
  private readonly orderedZ = new Float32Array(BUFFER_CAPACITY);

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private trajectory: THREE.Line | null = null;
  private trajectoryPositions: Float32Array = new Float32Array(BUFFER_CAPACITY * 3);
  private trajectoryGeometry: THREE.BufferGeometry | null = null;

  private readonly plotContainers: PlotContainers = { x: null, y: null, z: null };
  private readonly plots: Plots = {};
  private readonly resizeObserver: ResizeObserver | null = null;
  private readonly themeChangeHandler: () => void;
  private rafId = 0;
  private lastFrameAt = performance.now();
  private lastPlotAt = 0;
  private disposed = false;

  constructor(root: HTMLElement, getLorenz: () => Lorenz | null) {
    this.root = root;
    this.getLorenz = getLorenz;
    this.themeChangeHandler = () => {
      this.colors = computeThemeColors();
      const background = this.scene?.background;
      if (background instanceof THREE.Color) background.set(this.colors.background);
      if (this.trajectory) {
        (this.trajectory.material as THREE.LineBasicMaterial).color.set(this.colors.accent);
      }
      this.recreatePlots();
    };
    window.addEventListener('themechange', this.themeChangeHandler);

    this.plotContainers.x = this.root.querySelector<HTMLElement>('[data-plot="x"]');
    this.plotContainers.y = this.root.querySelector<HTMLElement>('[data-plot="y"]');
    this.plotContainers.z = this.root.querySelector<HTMLElement>('[data-plot="z"]');

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeRenderer();
      this.resizePlots();
    });
    this.resizeObserver.observe(this.root);

    if (!this.initRenderer()) return;
    this.createPlots();
    this.lastFrameAt = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  dispose(): void {
    this.disposed = true;
    if (this.rafId !== 0) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    window.removeEventListener('themechange', this.themeChangeHandler);
    for (const axis of ['x', 'y', 'z'] as const) this.plots[axis]?.destroy();
    this.trajectoryGeometry?.dispose();
    if (this.trajectory) (this.trajectory.material as THREE.Material).dispose();
    this.renderer?.dispose();
  }

  private initRenderer(): boolean {
    const canvas = this.root.querySelector<HTMLCanvasElement>('.lorenz-viz-canvas');
    if (!canvas) return false;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch (error) {
      console.error('LorenzVisualizer: WebGL is unavailable', error);
      return false;
    }
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.colors.background);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
    this.camera.position.set(75, 45, 85);
    this.camera.lookAt(0, 15, 20);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 15, 20);
    this.controls.enableDamping = true;
    this.controls.update();

    this.scene.add(new THREE.AxesHelper(55));
    this.scene.add(new THREE.AmbientLight(0xffffff, 1));

    this.trajectoryGeometry = new THREE.BufferGeometry();
    this.trajectoryGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.trajectoryPositions, 3),
    );
    this.trajectoryGeometry.setDrawRange(0, 0);
    this.trajectory = new THREE.Line(
      this.trajectoryGeometry,
      new THREE.LineBasicMaterial({ color: new THREE.Color(this.colors.accent) }),
    );
    this.trajectory.frustumCulled = false;
    this.scene.add(this.trajectory);

    this.resizeRenderer();
    this.resizeObserver?.observe(this.root.querySelector('.lorenz-viz-stage') ?? this.root);
    return true;
  }

  private resizeRenderer(): void {
    if (!this.renderer || !this.camera) return;
    const stage = this.root.querySelector<HTMLElement>('.lorenz-viz-stage');
    const width = Math.max(1, stage?.clientWidth ?? this.root.clientWidth);
    const height = Math.max(1, stage?.clientHeight ?? 300);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
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
      { ...shared, size: 20, gap: 4 },
      { ...shared, size: 28, gap: 4 },
    ];
  }

  private createPlot(axis: Axis): uPlot | null {
    const container = this.plotContainers[axis];
    if (!container) return null;
    const width = Math.max(1, container.clientWidth || this.root.clientWidth - 24);
    const options: uPlot.Options = {
      width,
      height: PLOT_HEIGHT,
      pxAlign: true,
      series: [
        {},
        { stroke: axisColor(this.colors, axis), width: 1.5, points: { show: false } },
      ],
      scales: {
        x: { time: false, auto: true },
        y: { time: false, auto: true },
      },
      axes: this.axisOptions(),
      cursor: { show: false },
      select: { show: false, left: 0, top: 0, width: 0, height: 0 },
      legend: { show: false },
    };
    return new uPlot(options, [[0], [0]], container);
  }

  private createPlots(): void {
    for (const axis of ['x', 'y', 'z'] as const) {
      this.plots[axis]?.destroy();
      this.plots[axis] = this.createPlot(axis) ?? undefined;
    }
  }

  private recreatePlots(): void {
    this.createPlots();
    this.resizePlots();
    this.pushPlotData();
  }

  private resizePlots(): void {
    for (const axis of ['x', 'y', 'z'] as const) {
      const plot = this.plots[axis];
      const container = this.plotContainers[axis];
      if (!plot || !container) continue;
      const width = Math.max(1, container.clientWidth);
      if (plot.width !== width || plot.height !== PLOT_HEIGHT) {
        plot.setSize({ width, height: PLOT_HEIGHT });
      }
    }
  }

  private pushPlotData(): void {
    const n = this.timeRing.length;
    if (n === 0) return;
    this.timeRing.copyTo(this.orderedTime);
    this.xRing.copyTo(this.orderedX);
    this.yRing.copyTo(this.orderedY);
    this.zRing.copyTo(this.orderedZ);
    const time = this.orderedTime.subarray(0, n);
    const xs = this.orderedX.subarray(0, n);
    const ys = this.orderedY.subarray(0, n);
    const zs = this.orderedZ.subarray(0, n);
    if (this.plots.x) this.plots.x.setData([time, xs]);
    if (this.plots.y) this.plots.y.setData([time, ys]);
    if (this.plots.z) this.plots.z.setData([time, zs]);
  }
  private updateTrajectory(): void {
    if (!this.trajectory || !this.trajectoryGeometry) return;
    const n = this.xRing.length;
    for (let i = 0; i < n; i++) {
      const index = (this.xRing.start + i) % BUFFER_CAPACITY;
      this.trajectoryPositions[i * 3] = this.xRing.data[index];
      this.trajectoryPositions[i * 3 + 1] = this.yRing.data[index];
      this.trajectoryPositions[i * 3 + 2] = this.zRing.data[index];
    }
    (this.trajectoryGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.trajectoryGeometry.setDrawRange(0, n);
    this.trajectory.visible = n > 1;
  }

  private readonly frame = (now: number): void => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.frame);
    const dt = Math.min(Math.max((now - this.lastFrameAt) / 1000, 0), MAX_FRAME_DT);
    this.lastFrameAt = now;

    // The engine owns the dynamics; only the latest posted state is recorded.
    const state = this.getLorenz()?.getState();
    if (state) {
      this.plotTime += dt;
      this.xRing.push(state.x);
      this.yRing.push(state.y);
      this.zRing.push(state.z);
      this.timeRing.push(this.plotTime);
      this.updateTrajectory();
    }

    this.controls?.update();
    this.renderer?.render(this.scene!, this.camera!);

    if (state && now - this.lastPlotAt >= PLOT_UPDATE_MS) {
      this.lastPlotAt = now;
      this.pushPlotData();
    }
  };
}

/** Initialise the sidebar Lorenz visualisation once the DOM is available. */
export function initLorenzVisualization(
  root: HTMLElement | null,
  getLorenz: () => Lorenz | null,
): LorenzVisualizer | null {
  if (!root) return null;
  return new LorenzVisualizer(root, getLorenz);
}