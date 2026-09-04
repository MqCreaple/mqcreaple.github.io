// modulation.ts — reusable, bounded audio-rate modulation connections.

import * as Tone from 'tone';
import { ExponentialShaper } from './exponential-shaper.ts';
import { fromRangeNorm, rangeInputTransform } from './modulation-range.ts';
import type { ModulationRange } from './modulation-range.ts';

import type { ModulationSource } from './config.ts';
export type { ModulationSource };
export type ModulationTarget = Tone.Param<any> | Tone.Signal<any>;

export interface ModulationConnectionOptions {
  source: Tone.ToneAudioNode;
  sourceKind: ModulationSource;
  target: ModulationTarget;
  range: ModulationRange;
  base: number;
  amplitude: number;
  /** Keep the physical target's existing base (e.g. transpose -> detune). */
  setBase?: boolean;
  /** Convert a control-space delta to the physical target's unit. */
  outputScale?: number;
}

/**
 * A bounded modulation transfer. Tone.Multiply and Tone.Add form the affine
 * signal u = 2 * (base + amplitude * source) - 1. A WaveShaper then performs
 * the missing clamp operation. For logarithmic controls that same shaper maps
 * the normalized coordinate exponentially; linear controls map it back to a
 * bounded additive delta.
 */
export class ModulationConnection {
  private readonly source: Tone.ToneAudioNode;
  private readonly sourceKind: ModulationSource;
  private readonly target: ModulationTarget;
  private readonly range: ModulationRange;
  private readonly setBase: boolean;
  private readonly outputScale: number;
  private readonly scaler: Tone.Multiply;
  private readonly offset: Tone.Add;
  private readonly shaper: Tone.WaveShaper;

  constructor(options: ModulationConnectionOptions) {
    this.source = options.source;
    this.sourceKind = options.sourceKind;
    this.target = options.target;
    this.range = options.range;
    this.setBase = options.setBase ?? true;
    this.outputScale = options.outputScale ?? 1;

    this.scaler = new Tone.Multiply(0);
    this.offset = new Tone.Add(0);
    this.shaper = this.range.logarithmic
      ? new ExponentialShaper({
        min: Math.log2(this.range.min),
        max: Math.log2(this.range.max),
      })
      : new Tone.WaveShaper();

    this.source.connect(this.scaler);
    // These public helpers resolve to the ordinary Gain endpoints, avoiding
    // Signal.connect()'s "take over the destination Param" semantics.
    Tone.connect(this.scaler.output, this.offset);
    Tone.connect(this.offset.output, this.shaper);
    Tone.connect(this.shaper, this.target);
    this.update(options.base, options.amplitude);
  }

  update(base: number, amplitude: number): void {
    const transform = rangeInputTransform(base, amplitude, this.sourceKind, this.range);
    this.scaler.factor.value = transform.scale;
    this.offset.addend.value = transform.offset;

    if (this.range.logarithmic) {
      // ExponentialShaper maps the saturated normalized coordinate directly
      // onto [min, max], so the target's intrinsic base must be zero.
      this.target.value = 0;
      return;
    }

    // The target retains its base. The shaper contributes only the bounded
    // difference between the modulated value and that base.
    this.shaper.setMap((input) =>
      (fromRangeNorm((input + 1) / 2, this.range) - transform.base) * this.outputScale,
    );
    if (this.setBase) this.target.value = transform.base;
  }

  dispose(): void {
    this.source.disconnect(this.scaler);
    Tone.disconnect(this.scaler.output, this.offset);
    Tone.disconnect(this.offset.output, this.shaper);
    Tone.disconnect(this.shaper, this.target);
    this.scaler.dispose();
    this.offset.dispose();
    this.shaper.dispose();
  }
}
