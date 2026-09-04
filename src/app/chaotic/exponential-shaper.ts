// exponential-shaper.ts — a Tone.WaveShaper-based exponential "2^x" block.
//
// Its input is a normalized modulator in [-1, 1] and its output is
//
//   2 ^ (min + (max - min) * (input + 1) / 2)
//
// Tone.WaveShaper owns the native WaveShaperNode, including its compatible
// input/output endpoints. Supplying a mapping function avoids creating or
// connecting wrapper gains ourselves.

import * as Tone from 'tone';

export interface ExpShaperRange {
  /** Exponent at input -1. */
  min: number;
  /** Exponent at input +1. */
  max: number;
}

const CURVE_LENGTH = 1024;

function mapExponential(input: number, min: number, max: number): number {
  const exponent = min + (max - min) * ((input + 1) / 2);
  return Math.pow(2, exponent);
}

/** A native Tone wave shaper whose output is 2 raised to a mapped exponent. */
export class ExponentialShaper extends Tone.WaveShaper {
  private range: ExpShaperRange = { min: 0, max: 1 };

  constructor(range?: Partial<ExpShaperRange>) {
    const min = range?.min ?? 0;
    const max = range?.max ?? 1;
    super((input) => mapExponential(input, min, max), CURVE_LENGTH);
    this.range = { min, max };
    this.oversample = 'none';
  }

  /** Update the mapping only when its exponent range changes. */
  setRange(min: number, max: number): void {
    this.range = { min, max };
    this.setMap((input) => mapExponential(input, min, max), CURVE_LENGTH);
  }

  getRange(): ExpShaperRange {
    return { ...this.range };
  }
}
