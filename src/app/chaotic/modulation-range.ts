// modulation-range.ts — shared control-space modulation conversions.
//
// Modulation depth is always a fraction of a control's displayed range. These
// helpers are used by the audio graph and by knob/slider range indicators so
// they cannot drift apart.

import { getModulationSource } from './config.ts';
import type { ModulationSource } from './config.ts';

export interface ModulationRange {
  min: number;
  max: number;
  logarithmic: boolean;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function toRangeNorm(value: number, range: ModulationRange): number {
  const { min, max, logarithmic } = range;
  if (logarithmic && min > 0 && max > 0) {
    return Math.log(clamp(value, min, max) / min) / Math.log(max / min);
  }
  return max === min ? 0 : (clamp(value, min, max) - min) / (max - min);
}

export function fromRangeNorm(norm: number, range: ModulationRange): number {
  const n = clamp(norm, 0, 1);
  const { min, max, logarithmic } = range;
  return logarithmic && min > 0 && max > 0
    ? min * Math.pow(max / min, n)
    : min + n * (max - min);
}

/** Convert the raw source output to its specified control-space value. */
export function modulatedControlValue(
  base: number,
  amplitude: number,
  source: ModulationSource,
  rawSignal: number,
  range: ModulationRange,
): number {
  const signal = getModulationSource(source)?.range === 'bipolar' ? rawSignal * 0.5 : rawSignal;
  return fromRangeNorm(toRangeNorm(base, range) + amplitude * signal, range);
}

/** The two extrema represented by a knob arc or slider modulation line. */
export function modulationExtrema(
  base: number,
  amplitude: number,
  source: ModulationSource,
  range: ModulationRange,
): readonly [number, number] {
  const first = modulatedControlValue(base, amplitude, source, getModulationSource(source)?.range === 'bipolar' ? -1 : 0, range);
  const second = modulatedControlValue(base, amplitude, source, 1, range);
  return first <= second ? [first, second] : [second, first];
}

/** Affine signal transform that produces a WaveShaper input in [-1, 1]. */
export function rangeInputTransform(
  base: number,
  amplitude: number,
  source: ModulationSource,
  range: ModulationRange,
): { offset: number; scale: number; base: number; baseNorm: number } {
  const boundedBase = clamp(base, range.min, range.max);
  const baseNorm = toRangeNorm(boundedBase, range);
  return {
    // u = 2 * (baseNorm + amplitude * sourceSignal) - 1
    // where an LFO's raw range is first narrowed to [-0.5, 0.5].
    offset: 2 * baseNorm - 1,
    scale: getModulationSource(source)?.range === 'bipolar' ? amplitude : 2 * amplitude,
    base: boundedBase,
    baseNorm,
  };
}
