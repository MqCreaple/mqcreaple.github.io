// widgets.ts — behaviour for server-rendered (and dynamically created)
// controls. The *init* functions attach interactivity to existing DOM that
// matches the markup produced by the Astro components (src/app/chaotic/
// components), and the small *build* helpers create the few controls that are
// still generated at runtime (global BPM/master, transport start, the
// amplitude knob inside the modulation panel).

import { modulationExtrema, toRangeNorm } from './modulation-range.ts';

import { getModulationSource } from './config.ts';
import type { ModulationSource } from './config.ts';

export interface WidgetOptions {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  log?: boolean;
  precision?: number;
  unit?: string;
  orientation?: 'vertical' | 'horizontal';
  modulation?: { env?: ModulationSource; amplitude?: number };
  onAmplitude?: (amplitude: number) => void;
  onModulationSourceChange?: (kind: ModulationSource | null) => void;
  allowedModSources?: ModulationSource[];
  noContextMenu?: boolean;
  /** Called on right-click so the shared modulation panel can open at this knob. */
  onRequestPanel?: (el: HTMLElement, clientX: number, clientY: number) => void;
  onChange?: (value: number) => void;
}

export interface Widget<T> {
  el: HTMLElement;
  getValue: () => T;
  setValue: (value: T) => void;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function toNorm(v: number, min: number, max: number, log: boolean): number {
  if (log && min > 0 && max > 0) return Math.log(v / min) / Math.log(max / min);
  return max === min ? 0 : (v - min) / (max - min);
}
function fromNorm(n: number, min: number, max: number, log: boolean): number {
  if (log && min > 0 && max > 0) return min * Math.pow(max / min, n);
  return min + n * (max - min);
}

// --- geometry ------------------------------------------------------------

const KNOB_SIZE = 44;
const KNOB_RADIUS = 16;
const OUTER_R = 19;
const SWEEP = 135;

function pointAt(r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: KNOB_SIZE / 2 + r * Math.sin(rad), y: KNOB_SIZE / 2 - r * Math.cos(rad) };
}

function arcPath(fromDeg: number, toDeg: number, r: number): string {
  const a = pointAt(r, fromDeg);
  const b = pointAt(r, toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  const sweep = toDeg > fromDeg ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export function initKnob(el: HTMLElement, options: WidgetOptions): Widget<number> {
  const {
    label = '',
    min = 0,
    max = 1,
    step = 0.01,
    value = 0,
    log = false,
    precision = 2,
    unit = '',
    modulation,
    onAmplitude,
    onModulationSourceChange,
    noContextMenu = false,
    allowedModSources = [],
    onChange,
  } = options;

  const labelEl = el.querySelector<HTMLElement>('.chaotic-knob-label');
  const valueEl = el.querySelector<HTMLElement>('.chaotic-knob-value');
  const dash = el.querySelector<SVGLineElement>('.knob-dash');
  let arc = el.querySelector<SVGPathElement>('.knob-mod-arc');
  if (!arc) {
    const svg = el.querySelector('svg.knob-svg');
    const ring = el.querySelector('.knob-ring');
    if (svg) {
      arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arc.setAttribute('class', 'knob-mod-arc');
      if (ring) svg.insertBefore(arc, ring);
      else svg.appendChild(arc);
    }
  }
  const hint = el.querySelector<HTMLElement>('.knob-hint');
  if (labelEl) labelEl.textContent = label;

  const snap = (v: number): number => (log ? v : Math.round(v / step) * step);
  const format = (v: number): string => {
    const text = log || !Number.isInteger(step) ? v.toFixed(precision) : String(Math.round(v));
    return unit ? `${text} ${unit}` : text;
  };

  let val = value;
  let modulationSource: ModulationSource | null = modulation?.env ?? null;
  let amplitude = modulation?.amplitude ?? 0;

  const isModulated = (): boolean => modulationSource !== null;
  const isDisabled = (): boolean => el.getAttribute('aria-disabled') === 'true'
    || el.closest('.voice-block--disabled') !== null;

  function currentDeg(): number {
    return -SWEEP + clamp(toNorm(val, min, max, log), 0, 1) * 2 * SWEEP;
  }

  function renderArc(): void {
    if (!arc) {
      return;
    }
    const source = modulationSource;
    if (!source) {
      arc.setAttribute('d', '');
      return;
    }
    const range = { min, max, logarithmic: log };
    const [from, to] = modulationExtrema(val, amplitude, source, range);
    arc.setAttribute('d', arcPath(
      -SWEEP + toRangeNorm(from, range) * 2 * SWEEP,
      -SWEEP + toRangeNorm(to, range) * 2 * SWEEP,
      OUTER_R,
    ));
  }

  function render(): void {
    const deg = currentDeg();
    const p = pointAt(KNOB_RADIUS, deg);
    if (dash) {
      dash.setAttribute('x2', p.x.toFixed(2));
      dash.setAttribute('y2', p.y.toFixed(2));
    }
    renderArc();
    if (valueEl) valueEl.textContent = format(snap(val));
    el.setAttribute('aria-valuenow', snap(val).toFixed(4));
    el.setAttribute('aria-valuemin', String(min));
    el.setAttribute('aria-valuemax', String(max));
    el.classList.toggle('knob--modulated', isModulated());
  }

  function setValue(v: number, fire = true): void {
    const nv = snap(fromNorm(clamp(toNorm(v, min, max, log), 0, 1), min, max, log));
    if (nv === val) return;
    val = nv;
    render();
    if (fire && onChange) onChange(val);
  }

  function setModulationSource(kind: ModulationSource | null, fire = true): void {
    if (kind && !allowedModSources.includes(kind)) return;
    if (kind === modulationSource) return;
    modulationSource = kind;
    render();
    updateHint();
    if (fire && onModulationSourceChange) onModulationSourceChange(kind);
  }

  function setAmplitude(a: number, fire = true): void {
    const na = clamp(Math.round(a * 100) / 100, -1, 1);
    if (na === amplitude) return;
    amplitude = na;
    render();
    updateHint();
    if (fire && onAmplitude) onAmplitude(amplitude);
  }

  let lastX = 0;
  let lastY = 0;
  let hovered = false;

  function overOuterRing(): boolean {
    if (!isModulated()) return false;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(lastX - cx, lastY - cy);
    const scale = rect.width / KNOB_SIZE || 1;
    return dist >= KNOB_RADIUS * scale * 0.9 && dist <= OUTER_R * scale * 1.25;
  }

  function updateHint(): void {
    if (!hint) return;
    if (hovered && isModulated()) {
      const name = modulationSource ? (getModulationSource(modulationSource)?.name ?? modulationSource) : '';
      hint.textContent = `${name} · amp ${amplitude >= 0 ? '+' : ''}${amplitude.toFixed(2)}`;
      hint.removeAttribute('hidden');
    } else {
      hint.setAttribute('hidden', '');
    }
  }

  // Controller exposed to the single shared modulation panel.
  const controller = {
    getModulationSource: (): ModulationSource | null => modulationSource,
    setModulationSource,
    getAmplitude: (): number => amplitude,
    setAmplitude,
    getAllowedModSources: (): readonly ModulationSource[] => allowedModSources,
  };
  (el as unknown as { __chaoticKnob: typeof controller }).__chaoticKnob = controller;
  (el as unknown as { __chaoticModControl: typeof controller }).__chaoticModControl = controller;

  el.addEventListener('contextmenu', (e) => {
    if (isDisabled() || noContextMenu || allowedModSources.length === 0) return;
    e.preventDefault();
    if (options.onRequestPanel) options.onRequestPanel(el, e.clientX, e.clientY);
  });

  let dragging = false;
  let startY = 0;
  let startNorm = 0;

  el.addEventListener('pointerdown', (e) => {
    if (isDisabled() || e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    startNorm = toNorm(val, min, max, log);
    el.classList.add('chaotic-knob--active');
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    if (dragging) {
      const dy = startY - e.clientY;
      const factor = e.shiftKey ? 0.1 : 1;
      const norm = clamp(startNorm + (dy / 150) * factor, 0, 1);
      setValue(fromNorm(norm, min, max, log));
    }
  });
  const endDrag = (e: PointerEvent): void => {
    dragging = false;
    el.classList.remove('chaotic-knob--active');
    if (el.releasePointerCapture) el.releasePointerCapture(e.pointerId);
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('pointerenter', () => { hovered = true; updateHint(); });
  el.addEventListener('pointerleave', () => { hovered = false; updateHint(); });
  el.addEventListener('dblclick', () => {
    if (!isDisabled()) setValue(value);
  });
  el.addEventListener('wheel', (e) => {
    if (isDisabled()) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const factor = e.shiftKey ? 0.1 : 1;
    if (overOuterRing()) {
      setAmplitude(amplitude + dir * 0.05 * factor);
      updateHint();
    } else {
      setValue(log ? val * (1 + dir * 0.03 * factor) : val + dir * step * 10 * factor);
    }
  }, { passive: false });
  el.addEventListener('keydown', (e) => {
    if (isDisabled()) return;
    const up = ['ArrowUp', 'ArrowRight'].includes(e.key);
    const down = ['ArrowDown', 'ArrowLeft'].includes(e.key);
    if (!up && !down) return;
    e.preventDefault();
    const factor = e.shiftKey ? 0.1 : 1;
    if (e.altKey && isModulated()) {
      setAmplitude(amplitude + (up ? 1 : -1) * 0.05 * factor);
      updateHint();
      return;
    }
    setValue(log ? val * (up ? 1 + 0.03 * factor : 1 - 0.03 * factor) : val + (up ? 1 : -1) * step * 10 * factor);
  });

  render();

  return {
    el,
    getValue: () => val,
    setValue: (v: number) => setValue(v),
  };
}

/** Create a knob element (used by the modulation panel). */
// --- slider --------------------------------------------------------------

export function initSlider(el: HTMLElement, options: WidgetOptions): Widget<number> {
  const {
    min = 0, max = 100, step = 1, value = 0, log = false,
    precision = 0, unit = '', orientation = 'vertical', modulation, onAmplitude,
    onModulationSourceChange, noContextMenu = false, allowedModSources = [], onChange,
  } = options;
  const horizontal = orientation === 'horizontal';
  const track = el.querySelector<HTMLElement>('.slider-track');
  const thumb = el.querySelector<HTMLElement>('.slider-thumb');
  const modRange = el.querySelector<HTMLElement>('.slider-mod-range');
  const valueEl = el.querySelector<HTMLElement>('.chaotic-knob-value');
  const labelEl = el.querySelector<HTMLElement>('.chaotic-knob-label');
  if (labelEl) labelEl.textContent = options.label ?? '';

  const snap = (v: number): number => (log ? v : Math.round(v / step) * step);
  const format = (v: number): string => `${v.toFixed(precision)}${unit ? ' ' + unit : ''}`;
  let val = value;
  let modulationSource: ModulationSource | null = modulation?.env ?? null;
  let amplitude = modulation?.amplitude ?? 0;
  const isModulated = (): boolean => modulationSource !== null;
  const isDisabled = (): boolean => el.getAttribute('aria-disabled') === 'true'
    || el.closest('.voice-block--disabled') !== null;

  function renderModRange(): void {
    if (!modRange) return;
    const range = { min, max, logarithmic: log };
    const [from, to] = modulationSource
      ? modulationExtrema(val, amplitude, modulationSource, range)
      : [val, val];
    const lower = toRangeNorm(from, range);
    const upper = toRangeNorm(to, range);
    if (horizontal) {
      modRange.style.left = `${lower * 100}%`;
      modRange.style.width = `${(upper - lower) * 100}%`;
    } else {
      modRange.style.top = `${(1 - upper) * 100}%`;
      modRange.style.height = `${(upper - lower) * 100}%`;
    }
    el.classList.toggle('slider--modulated', isModulated());
  }

  function render(): void {
    const norm = clamp(toNorm(val, min, max, log), 0, 1);
    renderModRange();
    if (thumb) {
      if (horizontal) thumb.style.left = `${norm * 100}%`;
      else thumb.style.top = `${(1 - norm) * 100}%`;
    }
    if (valueEl) valueEl.textContent = format(snap(val));
    el.setAttribute('aria-valuenow', snap(val).toFixed(4));
  }

  function setValue(v: number, fire = true): void {
    const nv = snap(fromNorm(clamp(toNorm(v, min, max, log), 0, 1), min, max, log));
    if (nv === val) return;
    val = nv;
    render();
    if (fire && onChange) onChange(val);
  }

  function setModulationSource(kind: ModulationSource | null, fire = true): void {
    if (kind && !allowedModSources.includes(kind)) return;
    if (kind === modulationSource) return;
    modulationSource = kind;
    render();
    if (fire && onModulationSourceChange) onModulationSourceChange(kind);
  }

  function setAmplitude(a: number, fire = true): void {
    const next = clamp(Math.round(a * 100) / 100, -1, 1);
    if (next === amplitude) return;
    amplitude = next;
    render();
    if (fire && onAmplitude) onAmplitude(amplitude);
  }

  const controller = {
    getModulationSource: (): ModulationSource | null => modulationSource,
    setModulationSource,
    getAmplitude: (): number => amplitude,
    setAmplitude,
    getAllowedModSources: (): readonly ModulationSource[] => allowedModSources,
  };
  (el as unknown as { __chaoticModControl: typeof controller }).__chaoticModControl = controller;

  el.addEventListener('contextmenu', (e) => {
    if (isDisabled() || noContextMenu || allowedModSources.length === 0) return;
    e.preventDefault();
    options.onRequestPanel?.(el, e.clientX, e.clientY);
  });

  function valueFromPointer(clientX: number, clientY: number): number {
    const rect = track?.getBoundingClientRect();
    let ratio = 0;
    if (rect && (rect.width > 0 || rect.height > 0)) {
      ratio = horizontal
        ? (clientX - rect.left) / rect.width
        : 1 - (clientY - rect.top) / rect.height;
    }
    return fromNorm(clamp(ratio, 0, 1), min, max, log);
  }

  let dragging = false;
  el.addEventListener('pointerdown', (e) => {
    if (isDisabled() || e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    setValue(valueFromPointer(e.clientX, e.clientY));
    el.classList.add('chaotic-slider--active');
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (dragging) setValue(valueFromPointer(e.clientX, e.clientY));
  });
  const endDrag = (e: PointerEvent): void => {
    dragging = false;
    el.classList.remove('chaotic-slider--active');
    if (el.releasePointerCapture) el.releasePointerCapture(e.pointerId);
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('wheel', (e) => {
    if (isDisabled()) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const factor = e.shiftKey ? 0.1 : 1;
    setValue(log ? val * (1 + dir * 0.03 * factor) : val + dir * step * 10 * factor);
  }, { passive: false });
  el.addEventListener('keydown', (e) => {
    if (isDisabled()) return;
    const up = ['ArrowUp', 'ArrowRight'].includes(e.key);
    const down = ['ArrowDown', 'ArrowLeft'].includes(e.key);
    if (!up && !down) return;
    e.preventDefault();
    const factor = e.shiftKey ? 0.1 : 1;
    if (e.altKey && isModulated()) {
      setAmplitude(amplitude + (up ? 1 : -1) * 0.05 * factor);
      return;
    }
    setValue(log ? val * (up ? 1 + 0.03 * factor : 1 - 0.03 * factor) : val + (up ? 1 : -1) * step * 10 * factor);
  });

  render();
  return { el, getValue: () => val, setValue: (v: number) => setValue(v) };
}

// --- toggle (buttons) ----------------------------------------------------

export function initToggle(el: HTMLElement, onChange: (active: boolean) => void): void {
  el.addEventListener('click', () => {
    const now = !el.classList.contains('active');
    el.classList.toggle('active', now);
    onChange(now);
  });
}