// main.ts — client layer for the "chaotic" app.
// Instruments are rendered server-side by the Astro components; this module
// attaches behaviour to that DOM (controls, plots, mute/solo), runs the audio
// engine (Tone.js) and the transport.

import { AudioEngine, ChaoticTransport, noteToMidi } from './engine.ts';
import type { Instrument, InstrumentConfig } from './engine.ts';
import { SignalPlot } from './signal-plots.ts';
import type { PlotKind } from './signal-plots.ts';
import { initKnob, initSlider, initToggle } from './widgets.ts';
import { INSTRUMENT_DEFS, getConfig, isModulationSource, setPath } from './config.ts';
import type { ModulationSource } from './config.ts';
import { createTestPattern } from './pattern.ts';
import { initLorenzVisualization } from './lorenz-viz.ts';
import type { PatternStep } from './pattern.ts';

const engine = new AudioEngine();
const transport = new ChaoticTransport(engine, { bpm: 128 });

// Live parameter state per instrument (same shape as config.ts defs).
const liveState = new Map<Instrument, InstrumentConfig>();
const instrumentPlots = new Map<Instrument, SignalPlot[]>();
const plotsByCanvas = new Map<HTMLElement, SignalPlot>();
const widgetsByEl = new Map<HTMLElement, { setValue: (value: number) => void }>();

// Background glow constants.
const GLOW_MAX = 0.2;
const GLOW_GAIN = 2.5;
const GLOW_SMOOTHING = 0.8;
const instrumentRows: Array<{ inst: Instrument; el: HTMLElement; smooth: number }> = [];

/** Write a base/param change into the engine + live state + plots. */
function applyParam(inst: Instrument, param: string, value: number | string | boolean): void {
  inst.setParam(param, value);
  const state = liveState.get(inst);
  if (!state) return;
  const raw = getConfig(state, param);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) setPath(state, `${param}.value`, value);
  else setPath(state, param, value);
  instrumentPlots.get(inst)?.forEach((plot) => plot.setState(state));
}

/** Persist a modulation-source enable/disable from the modulation panel. */
function modulationSourceChanged(inst: Instrument, el: HTMLElement, param: string, kind: ModulationSource | null): void {
  const state = liveState.get(inst);
  if (!state) return;
  const raw = getConfig(state, param);
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as { value: number }).value : (raw as number);
  const amp = modCtl(el)?.getAmplitude() ?? Number(el.dataset.amp ?? 0);
  const modulation = kind ? { value: base, env: kind, amplitude: amp } : null;
  if (modulation) setPath(state, param, modulation);
  else setPath(state, param, base);
  inst.setModulation(param, modulation);
  instrumentPlots.get(inst)?.forEach((plot) => plot.setState(state));
}

/** Persist an amplitude edit from the modulation panel. */
function knobAmplitudeChanged(inst: Instrument, el: HTMLElement, param: string, amplitude: number): void {
  const state = liveState.get(inst);
  if (!state) return;
  const raw = getConfig(state, param);
  const kind = modCtl(el)?.getModulationSource() ?? null;
  if (!kind) return;
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as { value: number }).value : (raw as number);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    setPath(state, param + '.amplitude', amplitude);
  } else {
    setPath(state, param, { value: base, env: kind, amplitude });
  }
  inst.setModulation(param, { value: base, env: kind, amplitude });
  instrumentPlots.get(inst)?.forEach((plot) => plot.setState(state));
}

function parseNumber(el: Element, name: string, fallback: number): number {
  const v = el.getAttribute(`data-${name}`);
  return v === null ? fallback : Number(v);
}

function allowedModSources(el: HTMLElement): ModulationSource[] {
  return (el.dataset.modSources ?? '')
    .split(',')
    .filter((source): source is ModulationSource => isModulationSource(source));
}


/** Grey out a block and disable its knob/slider widgets. */
function setBlockDisabled(block: HTMLElement, disabled: boolean): void {
  block.classList.toggle('voice-block--disabled', disabled);
  block.querySelectorAll<HTMLElement>('.chaotic-knob, .chaotic-slider').forEach((control) => {
    control.setAttribute('aria-disabled', String(disabled));
    control.tabIndex = disabled ? -1 : 0;
  });
}

/** Oscillator index (1|2) carried by a tab param like 'osc1'. */
function tabbedOscIndex(param: string): 1 | 2 | undefined {
  const match = /(\d+)$/.exec(param);
  const osc = match ? Number(match[1]) : NaN;
  return osc === 1 || osc === 2 ? osc : undefined;
}

/** Point every control + plot of a tabbed block at the newly active tab. */
function switchTab(inst: Instrument, block: HTMLElement, tabParam: string): void {
  const state = liveState.get(inst);
  const tabs = block.dataset.tabs ? JSON.parse(block.dataset.tabs) as Array<{ name: string; param: string }> : null;
  if (!state || !tabs || !tabs.some((tab) => tab.param === tabParam)) return;

  block.dataset.currentTabParam = tabParam;
  const select = block.querySelector<HTMLSelectElement>('.voice-block-tab-select');
  if (select) select.value = tabParam;

  let enabled = true;
  block.querySelectorAll<HTMLElement>('[data-control]').forEach((el) => {
    const pattern = el.dataset.paramPattern || el.dataset.param || '';
    const param = pattern.split('[tab]').join(tabParam);
    el.dataset.param = param;
    const raw = getConfig(state, param);
    const kind = el.dataset.control;

    if (kind === 'checkbox') {
      const input = el.querySelector<HTMLInputElement>('input[type="checkbox"]');
      const checked = Boolean(raw);
      if (input) input.checked = checked;
      enabled = checked;
    } else if (kind === 'select') {
      const inner = el.querySelector<HTMLSelectElement>('select');
      if (inner) inner.value = String(raw ?? '');
    } else if (kind === 'knob' || kind === 'slider') {
      const isMod = raw && typeof raw === 'object' && !Array.isArray(raw);
      const base = isMod ? (raw as { value: number }).value : (raw as number);
      const modCtlApi = modCtl(el);
      if (modCtlApi) {
        const source = isMod ? (raw as { env: ModulationSource }).env : null;
        const amplitude = isMod ? (raw as { amplitude: number }).amplitude : 0;
        modCtlApi.setModulationSource(source, false);
        modCtlApi.setAmplitude(amplitude, false);
        el.dataset.env = source ?? '';
        el.dataset.amp = String(amplitude);
      }
      widgetsByEl.get(el)?.setValue(base);
      el.dataset.value = String(base);
    }
  });
  setBlockDisabled(block, !enabled);

  const canvas = block.querySelector<HTMLElement>('.signal-canvas[data-plot="waveform"]');
  const osc = tabbedOscIndex(tabParam);
  if (canvas && osc) {
    canvas.dataset.osc = String(osc);
    plotsByCanvas.get(canvas)?.setOscIndex(osc);
  }
}

/** Wire each tabbed block's tab selector to switchTab. */
function bindTabs(inst: Instrument, row: HTMLElement): void {
  row.querySelectorAll<HTMLElement>('.voice-block[data-tabbed]').forEach((block) => {
    const tabs = block.dataset.tabs ? JSON.parse(block.dataset.tabs) as Array<{ name: string; param: string }> : null;
    if (!tabs || tabs.length === 0) return;
    block.dataset.currentTabParam = tabs[0].param;
    const select = block.querySelector<HTMLSelectElement>('.voice-block-tab-select');
    select?.addEventListener('change', () => {
      if (select.value) switchTab(inst, block, select.value);
    });
  });
}

/** Bind control elements to their respective handlers. */
export function bindControlElement(el: HTMLElement, inst: Instrument) {
  const kind = el.dataset.control;
  const pattern = el.dataset.paramPattern || el.dataset.param || '';
  if (!pattern) return;
  const paramFor = (): string => {
    const tabParam = el.closest<HTMLElement>('.voice-block[data-tabbed]')?.dataset.currentTabParam;
    return pattern.includes('[tab]') && tabParam ? pattern.split('[tab]').join(tabParam) : pattern;
  };
  if (kind === 'knob') {
    const envRaw = el.dataset.env ?? '';
    const modulationSource = isModulationSource(envRaw) ? envRaw : undefined;
    const widget = initKnob(el, {
      label: el.getAttribute('aria-label') ?? '',
      min: parseNumber(el, 'min', 0),
      max: parseNumber(el, 'max', 1),
      step: parseNumber(el, 'step', 0.01),
      value: parseNumber(el, 'value', 0),
      log: el.dataset.log === '1',
      precision: parseNumber(el, 'precision', 2),
      unit: el.dataset.unit ?? '',
      modulation: modulationSource ? { env: modulationSource, amplitude: Number(el.dataset.amp ?? 0) } : undefined,
      allowedModSources: allowedModSources(el),
      onChange: (v) => applyParam(inst, paramFor(), v),
      onAmplitude: (a) => knobAmplitudeChanged(inst, el, paramFor(), a),
      onModulationSourceChange: (kind) => modulationSourceChanged(inst, el, paramFor(), kind),
      onRequestPanel: modPanelRequest,
    });
    widgetsByEl.set(el, widget);
  } else if (kind === 'slider') {
    const envRaw = el.dataset.env ?? '';
    const modulationSource = isModulationSource(envRaw) ? envRaw : undefined;
    const widget = initSlider(el, {
      label: el.getAttribute('aria-label') ?? '',
      min: parseNumber(el, 'min', 0),
      max: parseNumber(el, 'max', 1),
      step: parseNumber(el, 'step', 0.01),
      value: parseNumber(el, 'value', 0),
      log: el.dataset.log === '1',
      precision: parseNumber(el, 'precision', 0),
      unit: el.dataset.unit ?? '',
      orientation: el.dataset.orientation === 'horizontal' ? 'horizontal' : 'vertical',
      modulation: modulationSource ? { env: modulationSource, amplitude: Number(el.dataset.amp ?? 0) } : undefined,
      allowedModSources: allowedModSources(el),
      onAmplitude: (a) => knobAmplitudeChanged(inst, el, paramFor(), a),
      onModulationSourceChange: (kind) => modulationSourceChanged(inst, el, paramFor(), kind),
      onRequestPanel: modPanelRequest,
      onChange: (v) => applyParam(inst, paramFor(), v),
    });
    widgetsByEl.set(el, widget);
  } else if (kind === 'select') {
    const select = el.querySelector<HTMLSelectElement>('select');
    select?.addEventListener('change', () => applyParam(inst, paramFor(), select.value));
  } else if (kind === 'checkbox') {
    const input = el.querySelector<HTMLInputElement>('input[type="checkbox"]');
    input?.addEventListener('change', () => {
      const param = paramFor();
      applyParam(inst, param, input.checked);
      const block = el.closest<HTMLElement>('.voice-block');
      if (block && (param.endsWith('.enabled') || param === 'lfo.enabled')) {
        setBlockDisabled(block, !input.checked);
      }
    });
  } else if (kind === 'number') {
    const input = el.querySelector<HTMLInputElement>('input[type="number"]');
    input?.addEventListener('change', () => {
      const min = Number(input.min || 1);
      const max = Number(input.max || 8);
      const value = Math.min(max, Math.max(min, Math.round(Number(input.value) || min)));
      input.value = String(value);
      applyParam(inst, paramFor(), value);
    });
  }
}

// --- Instrument hydration ---------------------------------------------------

function bindInstruments(): void {
  const rack = document.getElementById('chaotic-instruments');
  if (!rack) return;

  for (const def of INSTRUMENT_DEFS) {
    const inst = engine.addInstrument(def);
    const state: InstrumentConfig = structuredClone(def);
    liveState.set(inst, state);
    instrumentPlots.set(inst, []);

    const row = rack.querySelector<HTMLElement>(`.instrument[data-inst="${def.id}"]`);
    if (!row) continue;
    instrumentRows.push({ inst, el: row, smooth: 0 });

    // plots
    row.querySelectorAll<HTMLElement>('.signal-canvas').forEach((canvas) => {
      const kind = canvas.dataset.plot as PlotKind | undefined;
      if (!kind) return;
      const osc = canvas.dataset.osc ? (Number(canvas.dataset.osc) as 1 | 2) : undefined;
      const plot = new SignalPlot(
        canvas,
        kind,
        state,
        () => inst.getFilterCutoff(),
        osc,
        (n) => inst.getFilterResponse(n),
        () => inst.hasAnimatedFilterResponse(),
      );
      instrumentPlots.get(inst)?.push(plot);
      plotsByCanvas.set(canvas, plot);
    });

    // mute / solo
    let muted = false;
    let soloed = false;
    row.querySelectorAll<HTMLElement>('[data-control="toggle"]').forEach((btn) => {
      const action = btn.dataset.action;
      initToggle(btn, (active) => {
        if (action === 'mute') {
          muted = active;
          inst.setMuted(active);
          if (active && soloed) {
            soloed = false;
            inst.setSoloed(false);
            row.querySelectorAll<HTMLElement>('[data-action="solo"]').forEach((b) => b.classList.remove('active'));
          }
        } else if (action === 'solo') {
          soloed = active;
          inst.setSoloed(active);
          if (active && muted) {
            muted = false;
            inst.setMuted(false);
            row.querySelectorAll<HTMLElement>('[data-action="mute"]').forEach((b) => b.classList.remove('active'));
          }
        }
      });
    });

    // controls — params resolve at event time so tabbed blocks follow the tab
    row.querySelectorAll<HTMLElement>('[data-control]').forEach((el) => bindControlElement(el, inst));

    // tabbed blocks: wire the tab selector after their controls are bound
    bindTabs(inst, row);
  }
}
// --- Transport / pattern -----------------------------------------------------

const pattern = createTestPattern((step: PatternStep, time: number): void => {
  for (const note of step.notes) {
    const inst = engine.instruments[note.instrument];
    if (!inst) continue;
    const beat = 60 / transport.bpm;
    inst.trigger(noteToMidi(note.note), time, (note.dur ?? 1) * beat, note.velocity ?? 1.0);
    const state = liveState.get(inst);
    if (state?.filter.keyTracking) {
      instrumentPlots.get(inst)?.forEach((plot) => {
        if (plot.kind === 'filter') plot.refresh();
      });
    }
  }
});
transport.setSequence(pattern);

// --- Global panel + sidebar ---------------------------------------------------

function sliderOpts(el: HTMLElement): {
  label: string; min: number; max: number; step: number; value: number;
  log: boolean; precision: number; unit: string;
  orientation: 'vertical' | 'horizontal';
  allowedModSources: ModulationSource[];
} {
  return {
    label: el.getAttribute('aria-label') ?? '',
    min: parseNumber(el, 'min', 0),
    max: parseNumber(el, 'max', 1),
    step: parseNumber(el, 'step', 0.01),
    value: parseNumber(el, 'value', 0),
    log: el.dataset.log === '1',
    precision: parseNumber(el, 'precision', 0),
    unit: el.dataset.unit ?? '',
    orientation: (el.dataset.orientation === 'horizontal' ? 'horizontal' : 'vertical') as 'vertical' | 'horizontal',
    allowedModSources: el.dataset.modSources?.split(',').map((s) => s.trim()).filter((v): v is ModulationSource => !!v) ?? [],
  };
}

function buildGlobalPanel(): void {
  const controls = document.getElementById('chaotic-global-controls');
  if (!controls) return;
  controls.querySelectorAll<HTMLElement>('.chaotic-slider').forEach((el) => {
    const param = el.dataset.param;
    if (param === 'bpm') {
      initSlider(el, { ...sliderOpts(el), onChange: (v) => { transport.setBpm(v); syncBeatIndicator(); } });
    } else if (param === 'master') {
      initSlider(el, {
        ...sliderOpts(el),
        onChange: (v) => engine.setMasterVolume(v),
        onModulationSourceChange: (source) => {
          const amplitude = modCtl(el)?.getAmplitude() ?? Number(el.dataset.amp ?? 0);
          engine.setMasterVolumeModulation(
            source ? { value: engine.getMasterVolume(), env: source, amplitude } : null,
          );
        },
        onAmplitude: (amplitude) => {
          const source = modCtl(el)?.getModulationSource() ?? null;
          if (source) {
            engine.setMasterVolumeModulation({
              value: engine.getMasterVolume(),
              env: source,
              amplitude,
            });
          }
        },
        onRequestPanel: modPanelRequest,
      });
    } else if (param === 'dynrate') {
      initSlider(el, { ...sliderOpts(el), onChange: (v) => { engine.lorenz?.setParameters({ rate: v }) } });
    }
  });
}

function buildTransport(): void {
  const container = document.getElementById('chaotic-transport-controls');
  const start = document.getElementById('chaotic-transport-start');
  if (!container || !start) return;
  const status = container.querySelector<HTMLElement>('.transport-status');
  const setStatus = (running: boolean): void => {
    start.textContent = running ? 'Stop' : 'Start';
    if (status) status.textContent = running ? 'running' : 'stopped';
  };
  initToggle(start, async (v) => {
    if (v) {
      await engine.resume();
      transport.start();
      setStatus(true);
    } else {
      transport.stop();
      setStatus(false);
    }
  });
}

// --- Beat indicator ------------------------------------------------------------

function syncBeatIndicator(): void {
  document.documentElement.style.setProperty('--chaotic-beat', `${60 / transport.bpm}s`);
}

// --- Background glow -------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

function readAccent(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0f766e';
}

let accentColor = readAccent();
window.addEventListener('themechange', () => {
  accentColor = readAccent();
});

function animateBackgrounds(): void {
  for (const row of instrumentRows) {
    const incoming = Math.min(row.inst.getLevel() * GLOW_GAIN, GLOW_MAX);
    row.smooth = GLOW_SMOOTHING * row.smooth + (1 - GLOW_SMOOTHING) * incoming;
    const opacity = row.smooth;
    row.el.style.backgroundColor = opacity > 0.001 ? hexToRgba(accentColor, opacity) : '';
  }
  requestAnimationFrame(animateBackgrounds);
}

// --- Shared modulation panel ------------------------------------------------------

interface ModCtl {
  getModulationSource: () => ModulationSource | null;
  setModulationSource: (kind: ModulationSource | null, fire?: boolean) => void;
  getAmplitude: () => number;
  setAmplitude: (amplitude: number, fire?: boolean) => void;
  getAllowedModSources: () => readonly ModulationSource[];
}

function modCtl(el: HTMLElement): ModCtl | null {
  return (el as unknown as { __chaoticModControl?: ModCtl }).__chaoticModControl ?? null;
}

let modTargetEl: HTMLElement | null = null;
let modVisible = false;

function wireModPanel(): void {
  const panel = document.getElementById('chaotic-mod-panel');
  if (!panel) return;
  const root = panel;
  const ampEl = panel.querySelector<HTMLElement>('.knob-panel-amp .chaotic-knob');
  const ampWrap = panel.querySelector<HTMLElement>('.knob-panel-amp');
  const toggles = Array.from(panel.querySelectorAll<HTMLButtonElement>('.knob-panel-toggle'));
  let ampWidget: ReturnType<typeof initKnob> | null = null;
  if (ampEl) {
    ampWidget = initKnob(ampEl, {
      label: 'Amplitude', min: -1, max: 1, step: 0.01, precision: 2, value: 0, noContextMenu: true,
      onChange: (a) => { const c = modTargetEl ? modCtl(modTargetEl) : null; if (c) c.setAmplitude(a); },
    });
  }

  function sync(): void {
    const c = modTargetEl ? modCtl(modTargetEl) : null;
    const activeSource = c?.getModulationSource() ?? null;
    const allowed = c?.getAllowedModSources() ?? [];
    toggles.forEach((b) => {
      const sourceRaw = b.dataset.modSource ?? '';
      const source = isModulationSource(sourceRaw) ? sourceRaw : null;
      const isAllowed = source !== null && allowed.includes(source);
      const row = b.closest<HTMLElement>('.knob-panel-row');
      if (row) row.hidden = !isAllowed;
      const active = isAllowed && source === activeSource;
      b.textContent = active ? 'on' : 'off';
      b.classList.toggle('active', active);
    });
    if (ampWrap) ampWrap.classList.toggle('knob-panel-amp--hidden', activeSource === null);
    if (ampWidget && c) ampWidget.setValue(c.getAmplitude());
  }

  function hide(): void {
    modVisible = false;
    modTargetEl = null;
    root.hidden = true;
    document.removeEventListener('pointerdown', onDocPointerDown);
    document.removeEventListener('keydown', onDocKeyDown);
  }
  function show(el: HTMLElement, x: number, y: number): void {
    modTargetEl = el;
    modVisible = true;
    root.hidden = false;
    root.style.left = `${Math.min(x, window.innerWidth - 190)}px`;
    root.style.top = `${Math.min(y + 8, window.innerHeight - 190)}px`;
    sync();
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onDocKeyDown);
  }
  function onDocPointerDown(e: PointerEvent): void {
    if (e.button === 2) return;
    if (!root.hidden && !root.contains(e.target as Node)) hide();
  }
  function onDocKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') hide();
  }

  toggles.forEach((b) => {
    b.addEventListener('click', () => {
      const c = modTargetEl ? modCtl(modTargetEl) : null;
      if (!c) return;
      const kindRaw = b.dataset.modSource ?? '';
      const kind = isModulationSource(kindRaw) ? kindRaw : null;
      if (!kind) return;
      c.setModulationSource(c.getModulationSource() === kind ? null : kind);
      sync();
    });
  });

  (window as unknown as { __chaoticModPanel?: { request: (el: HTMLElement, x: number, y: number) => void } }).__chaoticModPanel = {
    request: (el, x, y) => {
      if (modVisible && modTargetEl === el) hide();
      else show(el, x, y);
    },
  };
}

function modPanelRequest(el: HTMLElement, x: number, y: number): void {
  const api = (window as unknown as { __chaoticModPanel?: { request: (el: HTMLElement, x: number, y: number) => void } }).__chaoticModPanel;
  if (api) api.request(el, x, y);
}

// --- Boot ------------------------------------------------------------------------

function boot(): void {
  wireModPanel();
  bindInstruments();
  buildGlobalPanel();
  buildTransport();
  syncBeatIndicator();
  initLorenzVisualization(document.getElementById('chaotic-lorenz-viz'), () => engine.lorenz);
  requestAnimationFrame(animateBackgrounds);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
