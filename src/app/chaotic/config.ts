// config.ts — shared (server + client) instrument definitions and control
// layout for the chaotic app. Values here are the source of truth for both
// the server-rendered instrument UI (Astro components) and the audio engine.

import type { InstrumentConfig } from './engine.ts';
import type { ModulationRange } from './modulation-range.ts';

export type ModulationScope = 'global' | 'instrument' | 'voice';

/** How the source's raw audio signal is normalized for modulation depth. */
export type ModulationSourceRange = 'unipolar' | 'bipolar';

export type ModulationSourceKind = 'envelope' | 'lfo' | 'lorenz';

export interface ModulationSourceSpec {
  /** Stable identifier used in state and configs (e.g. 'env', 'lorenz-x'). */
  id: string;
  /** Display name shown in the modulation panel. */
  name: string;
  /** Source availability: 'global' > 'instrument' > 'voice'. */
  scope: ModulationScope;
  /** Which audio node supplies this source. */
  kind: ModulationSourceKind;
  /** For Lorenz sources, which attractor output is exposed. */
  axis?: 'x' | 'y' | 'z';
  /** Raw signal polarity of the source output. */
  range: ModulationSourceRange;
}

/** Central registry of every modulation source. */
export const MODULATION_SOURCES = [
  { id: 'env', name: 'Envelope', scope: 'voice', kind: 'envelope', range: 'unipolar' },
  { id: 'lfo', name: 'LFO', scope: 'instrument', kind: 'lfo', range: 'bipolar' },
  { id: 'lorenz-x', name: 'Lorenz X', scope: 'global', kind: 'lorenz', axis: 'x', range: 'bipolar' },
  { id: 'lorenz-y', name: 'Lorenz Y', scope: 'global', kind: 'lorenz', axis: 'y', range: 'bipolar' },
  { id: 'lorenz-z', name: 'Lorenz Z', scope: 'global', kind: 'lorenz', axis: 'z', range: 'bipolar' },
] as const satisfies readonly ModulationSourceSpec[];

export type ModulationSource = (typeof MODULATION_SOURCES)[number]['id'];

export function getModulationSource(id: string): ModulationSourceSpec | undefined {
  return MODULATION_SOURCES.find((source) => source.id === id);
}

export function isModulationSource(id: string): id is ModulationSource {
  return getModulationSource(id) !== undefined;
}


/** Whether a source with `sourceScope` may modulate a target with `targetScope`.
 *  Compatibility hierarchy: global > instrument > voice. */
export function modulationSourceCanModulate(
  sourceScope: ModulationScope,
  targetScope: ModulationScope,
): boolean {
  if (sourceScope === 'global') return true;
  if (sourceScope === 'instrument') return targetScope !== 'global';
  return targetScope === 'voice';
}

/** All sources allowed on a knob of the given target scope. */
export function modulationSourceIdsForTargetScope(targetScope: ModulationScope): ModulationSource[] {
  return MODULATION_SOURCES
    .filter((source) => modulationSourceCanModulate(source.scope, targetScope))
    .map((source) => source.id) as ModulationSource[];
}

export type ControlKind = 'knob' | 'slider' | 'select' | 'checkbox' | 'number';

export interface ControlSpec {
  kind: ControlKind;
  /** Dotted path into the instrument config, e.g. 'env.attack'. May contain a
   *  '[tab]' placeholder inside a block that declares `tabs`. */
  param: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  log?: boolean;
  precision?: number;
  unit?: string;
  /** Selectable values when `kind` is 'select'. */
  options?: string[];
  /** Slider orientation (default vertical). */
  orientation?: 'vertical' | 'horizontal';
}

/** Live diagram bound to a section or block (see signal-plots.ts PlotKind). */
export interface PlotSpec {
  kind: 'waveform' | 'envelope' | 'filter';
  /** For a 'waveform' plot in a non-tabbed oscillator block, which oscillator
   *  to show. Tabbed blocks derive this from the active tab instead. */
  osc?: 1 | 2;
}

/** One tab of a tabbed block (e.g. Osc 1 / Osc 2 under one oscillator UI). */
export interface TabSpec {
  /** Display name in the tab selector. */
  name: string;
  /** Substitutes the '[tab]' placeholder in the block's control params. */
  param: string;
}

export interface BlockSpec {
  /** Title shown in the block header (e.g. 'Portamento', 'Oscillator', 'LFO'). */
  title: string;
  /**
   * Whether the block is gated by an Enable checkbox (JSON: "enable-checkbox").
   * The checkbox itself is the first entry of `controls`; the renderer hoists
   * it into the header (next to the tab selector when `tabs` is present).
   * With `tabs`, each tab has its own enable flag.
   */
  enableCheckbox?: boolean;
  /** Optional tab switcher; control params use 'osc.[tab].field' patterns. */
  tabs?: TabSpec[];
  /** A live diagram drawn inside the block (e.g. the oscillator waveform). */
  plot?: PlotSpec;
  /** Widgets rendered under this block. */
  controls: ControlSpec[];
}

export interface SectionSpec {
  /** Title displayed at the very top of the section (e.g. 'Oscillator'). */
  title: string;
  /** Stable identifier for the section (e.g. 'osc', 'env', 'fx'). */
  key: string;
  /** A live diagram drawn at the top of the section (e.g. envelope/filter response). */
  plot?: PlotSpec;
  /** Widgets that sit directly under the section (e.g. the Voices control). */
  controls: ControlSpec[];
  /** Titled widget blocks grouped under the section (e.g. Oscillator, LFO, FX units). */
  blocks: BlockSpec[];
}

/** Shared waveform choices for oscillator and LFO wave selects. */
export const WAVEFORMS: string[] = ['sine', 'triangle', 'sawtooth', 'square'];
export const INSTRUMENT_DEFS: InstrumentConfig[] = [
  {
    id: 'bass',
    name: 'Bass',
    osc: {
      voices: 1,
      portamento: { enabled: false, time: 0.12 },
      osc1: { enabled: true, waveform: 'square', detune: { value: -7, env: 'env', amplitude: 0.1 }, transpose: 0, volume: 1.0 },
      osc2: { enabled: true, waveform: 'triangle', detune: { value: -7, env: 'env', amplitude: 0.1 }, transpose: -12, volume: 0.8 },
    },
    env: { attack: 0.01, decay: 3.0, sustain: 0.0, release: 1.5, curve: 'exponential' },
    filter: { type: 'lowpass', cutoff: { value: 160, env: 'env', amplitude: 0.08 }, q: 1.5, keyTracking: true },
    distortion: { drive: 0, wet: 0 },
    delay: { time: 0.45, feedback: 0.2, wet: 0.12 },
    reverb: { wet: 0.15, decay: 2.5 },
    comp: { threshold: -18, ratio: 4, attack: 0.003, release: 0.12 },
    lfo: { enabled: false, waveform: 'sine', rate: 0.5 },
    out: { volume: 1.1, pan: 0 },
  },
  {
    id: 'pad',
    name: 'Pad',
    osc: {
      voices: 4,
      portamento: { enabled: false, time: 0.12 },
      osc1: { enabled: true, waveform: 'sine', detune: 0, transpose: 0, volume: 1.0 },
      osc2: { enabled: false, waveform: 'sawtooth', detune: 0, transpose: 0, volume: 1.0 },
    },
    env: { attack: 0.6, decay: 0.4, sustain: 0.7, release: 1.6, curve: 'exponential' },
    filter: { type: 'bandpass', cutoff: { value: 500, env: 'env', amplitude: 0.2 }, q: 1.0, keyTracking: false },
    distortion: { drive: 0, wet: 0 },
    delay: { time: 0.6, feedback: 0.45, wet: { value: 0.4, env: 'lorenz-x', amplitude: -0.6 } },
    reverb: { wet: { value: 0.45, env: 'lorenz-x', amplitude: -0.7 }, decay: 4 },
    comp: { threshold: -16, ratio: 3, attack: 0.005, release: 0.2 },
    lfo: { enabled: true, waveform: 'sine', rate: 4.0 },
    out: { volume: { value: 0.5, env: 'lorenz-x', amplitude: 0.7 }, pan: 0.1 },
  },
  {
    id: 'pluck',
    name: 'Pluck',
    osc: {
      voices: 4,
      portamento: { enabled: false, time: 0.12 },
      osc1: { enabled: true, waveform: 'sawtooth', detune: 0, transpose: 0, volume: 1.0 },
      osc2: { enabled: true, waveform: 'triangle', detune: 3, transpose: 0, volume: 0.5 },
    },
    env: { attack: 0.002, decay: 0.35, sustain: 0.3, release: 0.6, curve: 'linear' },
    filter: { type: 'lowpass', cutoff: { value: 170, env: 'env', amplitude: 0.5 }, q: 2.5, keyTracking: true },
    distortion: { drive: 0.2, wet: 0.1 },
    delay: { time: 0.3, feedback: 0.2, wet: { value: 0.4, env: 'lorenz-x', amplitude: 0.6 } },
    reverb: { wet: { value: 0.4, env: 'lorenz-x', amplitude: 0.7 }, decay: 2.0 },
    comp: { threshold: -20, ratio: 5, attack: 0.002, release: 0.1 },
    lfo: { enabled: false, waveform: 'sine', rate: 0.5 },
    out: { volume: { value: 0.7, env: 'lorenz-x', amplitude: -0.7 }, pan: { value: 0.0, env: 'lorenz-x', amplitude: 0.6 } },
  },
  {
    id: 'lead',
    name: 'Lead',
    osc: {
      voices: 2,
      portamento: { enabled: true, time: 1.0 },
      osc1: { enabled: true, waveform: 'triangle', detune: { value: 0, env: 'env', amplitude: -0.2 }, transpose: 0, volume: 1.0 },
      osc2: { enabled: true, waveform: 'sine', detune: { value: 0, env: 'env', amplitude: -0.2 }, transpose: 12, volume: 0.2 },
    },
    env: { attack: 0.65, decay: 1.0, sustain: 0.3, release: 0.8, curve: 'exponential' },
    filter: { type: 'lowpass', cutoff: { value: 1900, env: 'lorenz-y', amplitude: -0.5 }, q: 1.0, keyTracking: false },
    distortion: { drive: 0, wet: 0 },
    delay: { time: 0.35, feedback: 0.5, wet: 0.6 },
    reverb: { wet: 0.7, decay: 4.0 },
    comp: { threshold: -18, ratio: 4, attack: 0.003, release: 0.15 },
    lfo: { enabled: true, waveform: 'sine', rate: 4.0 },
    out: { volume: { value: 0.8, env: 'lfo', amplitude: 0.06 }, pan: 0.5 },
  },
];
export const SECTIONS: SectionSpec[] = [
  {
    title: 'Oscillator',
    key: 'osc',
    controls: [
      { kind: 'number', param: 'osc.voices', label: 'Voices', min: 1, max: 8, step: 1 },
    ],
    blocks: [
      {
        title: 'Portamento',
        enableCheckbox: true,
        controls: [
          { kind: 'checkbox', param: 'osc.portamento.enabled', label: 'Enable' },
          { kind: 'knob', param: 'osc.portamento.time', label: 'Time', min: 0.001, max: 2, step: 0.001, precision: 3, unit: 's', log: true },
        ],
      },
      {
        title: 'Oscillator',
        enableCheckbox: true,
        tabs: [
          { name: 'Osc 1', param: 'osc1' },
          { name: 'Osc 2', param: 'osc2' },
        ],
        plot: { kind: 'waveform' },
        controls: [
          { kind: 'checkbox', param: 'osc.[tab].enabled', label: 'Enable' },
          { kind: 'select', param: 'osc.[tab].waveform', label: 'Wave', options: WAVEFORMS },
          { kind: 'knob', param: 'osc.[tab].detune', label: 'Detune', min: -50, max: 50, step: 1, precision: 0, unit: 'ct' },
          { kind: 'knob', param: 'osc.[tab].transpose', label: 'Transpose', min: -24, max: 24, step: 1, precision: 0, unit: 'st' },
          { kind: 'slider', param: 'osc.[tab].volume', label: 'Volume', min: 0, max: 1, step: 0.01, precision: 2, orientation: 'horizontal' },
        ],
      },
    ],
  },
  {
    title: 'Envelope',
    key: 'env',
    plot: { kind: 'envelope' },
    controls: [
      { kind: 'select', param: 'env.curve', label: 'Curve', options: ['linear', 'exponential'] },
      { kind: 'knob', param: 'env.attack', label: 'Attack', min: 0.001, max: 2, step: 0.001, precision: 3, unit: 's', log: true },
      { kind: 'knob', param: 'env.decay', label: 'Decay', min: 0.01, max: 3, step: 0.001, precision: 3, unit: 's', log: true },
      { kind: 'knob', param: 'env.sustain', label: 'Sustain', min: 0, max: 1, step: 0.01, precision: 2 },
      { kind: 'knob', param: 'env.release', label: 'Release', min: 0.01, max: 5, step: 0.001, precision: 3, unit: 's', log: true },
    ],
    blocks: [
      {
        title: 'LFO',
        enableCheckbox: true,
        controls: [
          { kind: 'checkbox', param: 'lfo.enabled', label: 'Enable' },
          { kind: 'select', param: 'lfo.waveform', label: 'Wave', options: WAVEFORMS },
          { kind: 'knob', param: 'lfo.rate', label: 'Rate', min: 0.01, max: 20, step: 0.01, precision: 2, unit: 'Hz', log: true },
        ],
      },
    ],
  },
  {
    title: 'Filter',
    key: 'filter',
    plot: { kind: 'filter' },
    controls: [
      { kind: 'select', param: 'filter.type', label: 'Type', options: ['lowpass', 'highpass', 'bandpass', 'notch'] },
      { kind: 'checkbox', param: 'filter.keyTracking', label: 'Key track' },
      { kind: 'knob', param: 'filter.cutoff', label: 'Cutoff', min: 20, max: 20000, step: 1, precision: 0, unit: 'Hz', log: true },
      { kind: 'knob', param: 'filter.q', label: 'Q', min: 0.1, max: 20, step: 0.1, precision: 1, log: true },
    ],
    blocks: [],
  },
  {
    title: 'FX',
    key: 'fx',
    controls: [],
    blocks: [
      {
        title: 'Distortion',
        controls: [
          { kind: 'knob', param: 'distortion.drive', label: 'Drive', min: 0, max: 1, step: 0.01, precision: 2 },
          { kind: 'knob', param: 'distortion.wet', label: 'Wet', min: 0, max: 1, step: 0.01, precision: 2 },
        ],
      },
      {
        title: 'Delay',
        controls: [
          { kind: 'knob', param: 'delay.time', label: 'Time', min: 0.03, max: 1.5, step: 0.01, precision: 2, unit: 's', log: true },
          { kind: 'knob', param: 'delay.feedback', label: 'Feedback', min: 0, max: 0.9, step: 0.01, precision: 2 },
          { kind: 'knob', param: 'delay.wet', label: 'Wet', min: 0, max: 1, step: 0.01, precision: 2 },
        ],
      },
      {
        title: 'Reverb',
        controls: [
          { kind: 'knob', param: 'reverb.wet', label: 'Wet', min: 0, max: 1, step: 0.01, precision: 2 },
          { kind: 'knob', param: 'reverb.decay', label: 'Decay', min: 0.2, max: 8, step: 0.1, precision: 1, unit: 's', log: true },
        ],
      },
      {
        title: 'Compressor',
        controls: [
          { kind: 'knob', param: 'comp.threshold', label: 'Threshold', min: -60, max: 0, step: 1, precision: 0, unit: 'dB' },
          { kind: 'knob', param: 'comp.ratio', label: 'Ratio', min: 1, max: 20, step: 0.5, precision: 1 },
          { kind: 'knob', param: 'comp.attack', label: 'Attack', min: 0, max: 0.1, step: 0.001, precision: 3, unit: 's' },
          { kind: 'knob', param: 'comp.release', label: 'Release', min: 0, max: 0.5, step: 0.001, precision: 3, unit: 's' },
        ],
      },
    ],
  },
];

/** Per-instrument output controls shown next to mute/solo in the header. */
export const OUTPUT_CONTROLS: ControlSpec[] = [
  { kind: 'slider', param: 'out.volume', label: 'Volume', min: 0, max: 1.2, step: 0.01, precision: 2, orientation: 'horizontal' },
  { kind: 'knob', param: 'out.pan', label: 'Pan', min: -1, max: 1, step: 0.01, precision: 2 },
];

/** Transport/global controls shown in the sidebar. */
export const GLOBAL_CONTROLS: ControlSpec[] = [
  { kind: 'slider', param: 'bpm', label: 'BPM', min: 30, max: 200, step: 1, precision: 0, unit: 'bpm' },
  { kind: 'slider', param: 'master', label: 'Master', min: 0, max: 1.2, step: 0.01, precision: 2 },
  { kind: 'slider', param: 'dynrate', label: 'Dynamics Rate', log: true, min: 1/16, max: 16, step: 0.01, precision: 2 },
];

/** Params applied per voice (each voice gets its own modulation connection). */
const VOICE_MODULATION_PATHS = [
  'osc.osc1.detune',
  'osc.osc1.transpose',
  'osc.osc1.volume',
  'osc.osc2.detune',
  'osc.osc2.transpose',
  'osc.osc2.volume',
  'filter.cutoff',
  'filter.q',
  'env.attack',
  'env.decay',
  'env.sustain',
  'env.release',
];

/** Params applied once per instrument. */
const INSTRUMENT_MODULATION_PATHS = [
  'distortion.wet',
  'delay.time',
  'delay.feedback',
  'delay.wet',
  'reverb.wet',
  'comp.threshold',
  'comp.ratio',
  'comp.attack',
  'comp.release',
  'out.volume',
  'out.pan',
  'lfo.rate',
];


const GLOBAL_MODULATION_PATHS = ['master'];

/** Which audio parameter scope a control path belongs to, if it is modulatable. */
export function modulationTargetScope(path: string): ModulationScope | null {
  if (GLOBAL_MODULATION_PATHS.includes(path)) return 'global';
  if (VOICE_MODULATION_PATHS.includes(path)) return 'voice';
  if (INSTRUMENT_MODULATION_PATHS.includes(path)) return 'instrument';
  return null;
}

/** Sources that may drive the given control path. */
export function allowedModulationSourcesForPath(path: string): ModulationSource[] {
  const scope = modulationTargetScope(path);
  const sources = scope ? modulationSourceIdsForTargetScope(scope) : [];
  return sources.filter((id) => {
    // Exclude the envelope source from any control that is itself part of the envelope, to avoid feedback loops.
    return !path.startsWith(id);
  });
}

/** Replace the '[tab]' placeholder in a control param with a concrete value. */
export function substituteTabParam(param: string, tabParam: string): string {
  return param.includes('[tab]') ? param.split('[tab]').join(tabParam) : param;
}

/** Every concrete control widget keyed by param, with tabbed params expanded per tab. */
function allControls(): Record<string, ControlSpec> {
  const controls: Record<string, ControlSpec> = {};
  for (const ctl of [...OUTPUT_CONTROLS, ...GLOBAL_CONTROLS]) controls[ctl.param] = ctl;
  for (const section of SECTIONS) {
    for (const ctl of section.controls) controls[ctl.param] = ctl;
    for (const block of section.blocks) {
      const tabs = block.tabs && block.tabs.length > 0 ? block.tabs : null;
      for (const ctl of block.controls) {
        if (tabs) {
          for (const tab of tabs) {
            const param = substituteTabParam(ctl.param, tab.param);
            controls[param] = { ...ctl, param };
          }
        } else {
          controls[ctl.param] = ctl;
        }
      }
    }
  }
  return controls;
}

/** The control-space bounds used by both the UI and audio-rate modulation. */
export function getModulationRange(path: string): ModulationRange | null {
  const control = allControls()[path];
  if (!control || control.kind === 'select' || control.kind === 'checkbox' || control.kind === 'number') return null;
  return {
    min: control.min ?? 0,
    max: control.max ?? 1,
    logarithmic: control.log ?? false,
  };
}

export function getConfig(config: InstrumentConfig, path: string): unknown {
  let obj: unknown = config;
  for (const key of path.split('.')) {
    if (obj === null || typeof obj !== 'object') return undefined;
    obj = (obj as Record<string, unknown>)[key];
  }
  return obj;
}

export function setPath(config: InstrumentConfig, path: string, value: unknown): void {
  const keys = path.split('.');
  let obj: Record<string, unknown> = config as unknown as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = obj[key];
    obj = next !== null && typeof next === 'object' && !Array.isArray(next)
      ? (next as Record<string, unknown>)
      : (obj[key] = {});
  }
  obj[keys[keys.length - 1]] = value;
}
