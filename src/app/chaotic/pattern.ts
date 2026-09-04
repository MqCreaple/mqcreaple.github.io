// pattern.ts — the test melody for the "chaotic" app, recorded as a
// Tone.Sequence.
//
// Tone.Sequence treats nested arrays as *subdivisions* (notes spread
// sequentially across a step), NOT as simultaneous notes. To play a chord we
// therefore keep one sequence event per 8th-note step, where each event is a
// single { notes: [...] } object. The callback then triggers every note in
// that array at the same time.
//
//   { notes: [{ instrument: 0, note: 'E2', dur: 2 },
//             { instrument: 1, note: 'E3', dur: 7.5 }] }  // played together
//   { notes: [] }                                         // rest
//
// The outer array is one step per 8th note; `note` accepts a MIDI number or
// a note name like 'A3'; durations are in beats (`dur` defaults to 1).

import { Sequence } from 'tone';

export interface PatternNote {
  /** Index into AudioEngine.instruments (0 = bass, 1 = pad, 2 = pluck, 3 = lead). */
  instrument: number;
  /** MIDI number or note name, e.g. 57 or 'A3'. */
  note: number | string;
  /** Note duration in beats (optional, defaults to 1). */
  dur?: number;
  /** Velocity 0..1 (optional, defaults to 0.8). */
  velocity?: number;
}

/** One step: all `notes` ring out simultaneously (empty = rest). */
export interface PatternStep {
  notes: PatternNote[];
}

const STEPS: ((PatternStep | PatternStep[])[] | PatternStep)[] = [
  // bar 1
  [
    // to simulate arpeggio
    { notes: [
      { instrument: 0, note: 'E2', dur: 2.5 },
      { instrument: 2, note: 'B3', dur: 3.0 },
      { instrument: 1, note: 'E3', dur: 7.5, velocity: 0.6 },
      { instrument: 1, note: 'G3', dur: 7.5, velocity: 0.6 },
      { instrument: 1, note: 'B3', dur: 7.5, velocity: 0.6 },
    ] },
    { notes: [ { instrument: 2, note: 'G3', dur: 3.0 }, ] },
    { notes: [ { instrument: 2, note: 'E3', dur: 3.0 }, ] },
    { notes: [] },
  ],
  { notes: [] },
  { notes: [] },
  { notes: [] },
  { notes: [ { instrument: 0, note: 'E3', dur: 2.5 }, ] },
  { notes: [] },
  { notes: [] },
  { notes: [] },
  // bar 2
  { notes: [] },
  { notes: [] },
  { notes: [
    { instrument: 0, note: 'E2', dur: 2.5 },
    { instrument: 2, note: 'B2', dur: 3.0, velocity: 0.5 },
  ] },
  { notes: [ { instrument: 2, note: 'B3', dur: 3.0 }, ] },
  { notes: [
    { instrument: 0, note: 'E3', dur: 2.5 },
    { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.5 },
  ] },
  { notes: [ { instrument: 2, note: 'G3', dur: 3.0 }, ] },
  { notes: [] },
  { notes: [] },
  // bar 3
  { notes: [
    { instrument: 0, note: 'A2', dur: 2.5 },
    { instrument: 2, note: 'A2', dur: 3.0 },
    { instrument: 1, note: 'A3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'C#4', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'E4', dur: 7.5, velocity: 0.6 },
  ] },
  { notes: [] },
  { notes: [ { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.3 }, ] },
  { notes: [ { instrument: 2, note: 'A3', dur: 3.0, velocity: 0.7 }, ] },
  { notes: [
    { instrument: 0, note: 'E3', dur: 2.5 },
    { instrument: 2, note: 'C#4', dur: 3.0 },
  ] },
  { notes: [] },
  { notes: [] },
  { notes: [] },
  // bar 4
  { notes: [ { instrument: 0, note: 'C2', dur: 2.5 }, ] },
  { notes: [] },
  { notes: [
    { instrument: 0, note: 'C#2', dur: 2.5 },
    { instrument: 2, note: 'A3', dur: 3.0, velocity: 0.3 },
  ] },
  { notes: [ { instrument: 2, note: 'D4', dur: 3.0 }, ] },
  { notes: [ { instrument: 0, note: 'D2', dur: 2.5 }, ] },
  { notes: [ { instrument: 2, note: 'C#4', dur: 3.0 }, ] },
  { notes: [ { instrument: 0, note: 'D#2', dur: 2.5 }, ] },
  { notes: [] },

  // bar 5
  { notes: [
    { instrument: 0, note: 'E2', dur: 2.5 },
    { instrument: 2, note: 'E2', dur: 3.0 },
    { instrument: 1, note: 'E3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'G3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'B3', dur: 7.5, velocity: 0.6 },
  ] },
  { notes: [] },
  [
    { notes: [ { instrument: 2, note: 'B3', dur: 3.0 }, ] },
    { notes: [ { instrument: 2, note: 'G3', dur: 3.0 }, ] },
    { notes: [ { instrument: 2, note: 'F#3', dur: 3.0 }, ] },
    { notes: [ { instrument: 2, note: 'E3', dur: 3.0 }, ] },
  ],
  { notes: [] },
  { notes: [ { instrument: 0, note: 'E3', dur: 2.5 }, ] },
  { notes: [] },
  { notes: [] },
  { notes: [] },
  // bar 6
  { notes: [] },
  { notes: [] },
  { notes: [ { instrument: 0, note: 'E2', dur: 2.5 }, ] },
  { notes: [ { instrument: 2, note: 'E4', dur: 3.0 }, ] },
  { notes: [
    { instrument: 0, note: 'E3', dur: 2.5 },
    { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.3 },
  ] },
  { notes: [ { instrument: 2, note: 'B3', dur: 3.0 }, ] },
  { notes: [] },
  { notes: [] },
  // bar 7
  { notes: [
    { instrument: 0, note: 'A2', dur: 2.5 },
    { instrument: 2, note: 'A2', dur: 3.0 },
    { instrument: 1, note: 'A3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'C#4', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'E4', dur: 7.5, velocity: 0.6 },
  ] },
  { notes: [] },
  { notes: [ { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.5 }, ] },
  { notes: [ { instrument: 2, note: 'A3', dur: 3.0, velocity: 0.7 }, ] },
  { notes: [ { instrument: 2, note: 'C#4', dur: 3.0 }, ] },
  { notes: [] },
  { notes: [ { instrument: 2, note: 'A2', dur: 3.0, velocity: 0.5 }, ] },
  [
    { notes: [ { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.7 }, ] },
    { notes: [ { instrument: 2, note: 'G3', dur: 3.0, velocity: 0.5 }, ] }
  ],
  // bar 8
  { notes: [
    { instrument: 0, note: 'C2', dur: 2.5 },
    { instrument: 2, note: 'D4', dur: 3.0 },
  ] },
  { notes: [ { instrument: 2, note: 'G3', dur: 3.0, velocity: 0.6 }, ] },
  { notes: [
    { instrument: 0, note: 'C#2', dur: 2.5 },
    { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.6 },
  ] },
  { notes: [ { instrument: 2, note: 'C#4', dur: 3.0 }, ] },
  { notes: [ { instrument: 0, note: 'D2', dur: 2.5 }, ] },
  { notes: [ { instrument: 2, note: 'G3', dur: 3.0, velocity: 0.6 }, ] },
  { notes: [
    { instrument: 0, note: 'D#2', dur: 2.5 },
    { instrument: 2, note: 'E2', dur: 3.0, velocity: 0.6 },
  ] },
  { notes: [] },

  // bar 9
  { notes: [
    { instrument: 0, note: 'E2', dur: 2.5 },
    { instrument: 2, note: 'E2', dur: 3.0 },
    { instrument: 1, note: 'E3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'G3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'B3', dur: 7.5, velocity: 0.6 },
    { instrument: 3, note: 'B4', dur: 4.0 },
    { instrument: 3, note: 'E5', dur: 4.0 },
  ] },
  { notes: [] },
  [
    { notes: [ { instrument: 2, note: 'B3', dur: 3.0 }, ] },
    { notes: [ { instrument: 2, note: 'G3', dur: 3.0 }, ] },
    { notes: [ { instrument: 2, note: 'E3', dur: 3.0 }, ] },
    { notes: [] },
  ],
  { notes: [] },
  { notes: [ { instrument: 0, note: 'E3', dur: 2.5 }, ] },
  { notes: [] },
  { notes: [] },
  { notes: [] },
  // bar 10
  { notes: [] },
  { notes: [] },
  { notes: [
    { instrument: 0, note: 'E2', dur: 2.5 },
    { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.5 },
  ] },
  { notes: [ { instrument: 2, note: 'E4', dur: 3.0 }, ] },
  { notes: [
    { instrument: 0, note: 'E3', dur: 2.5 },
    { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.5 },
    { instrument: 3, note: 'G4', dur: 2.0 },
    { instrument: 3, note: 'B4', dur: 2.0 },
  ] },
  { notes: [ { instrument: 2, note: 'B3', dur: 3.0 }, ] },
  { notes: [
    { instrument: 3, note: 'A4', dur: 3.0 },
    { instrument: 3, note: 'C#5', dur: 3.0 },
  ] },
  { notes: [] },
  // bar 11
  { notes: [
    { instrument: 0, note: 'A2', dur: 2.5 },
    { instrument: 2, note: 'A2', dur: 3.0 },
    { instrument: 1, note: 'A3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'C#4', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'E4', dur: 7.5, velocity: 0.6 },
  ] },
  { notes: [] },
  { notes: [ { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.5 }, ] },
  { notes: [ { instrument: 2, note: 'A3', dur: 3.0, velocity: 0.7 }, ] },
  { notes: [ { instrument: 2, note: 'C#4', dur: 3.0 }, ] },
  { notes: [] },
  { notes: [ { instrument: 2, note: 'A2', dur: 3.0, velocity: 0.5 }, ] },
  { notes: [ { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.7 }, ] },
  // bar 12
  { notes: [
    { instrument: 0, note: 'C2', dur: 2.5 },
    { instrument: 2, note: 'D4', dur: 3.0 },
  ] },
  { notes: [ { instrument: 2, note: 'A3', dur: 3.0, velocity: 0.6 }, ] },
  { notes: [
    { instrument: 0, note: 'C#2', dur: 2.5 },
    { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.6 },
  ] },
  { notes: [ { instrument: 2, note: 'C#4', dur: 3.0 }, ] },
  { notes: [ { instrument: 0, note: 'D2', dur: 2.5 }, ] },
  { notes: [ { instrument: 2, note: 'A3', dur: 3.0, velocity: 0.6 }, ] },
  { notes: [
    { instrument: 0, note: 'D#2', dur: 2.5 },
    { instrument: 2, note: 'E2', dur: 3.0, velocity: 0.6 },
  ] },
  { notes: [] },

  // bar 13
  { notes: [
    { instrument: 0, note: 'E2', dur: 2.5 },
    { instrument: 2, note: 'E2', dur: 3.0 },
    { instrument: 1, note: 'E3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'G3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'B3', dur: 7.5, velocity: 0.6 },
    { instrument: 3, note: 'B4', dur: 4.0 },
    { instrument: 3, note: 'E5', dur: 4.0 },
  ] },
  { notes: [] },
  [
    { notes: [ { instrument: 2, note: 'E4', dur: 3.0 }, ] },
    { notes: [ { instrument: 2, note: 'B3', dur: 3.0 }, ] },
    { notes: [ { instrument: 2, note: 'G3', dur: 3.0 }, ] },
    { notes: [] },
  ],
  { notes: [] },
  { notes: [ { instrument: 0, note: 'E3', dur: 2.5 }, ] },
  { notes: [] },
  { notes: [] },
  { notes: [] },
  // bar 14
  { notes: [] },
  { notes: [] },
  { notes: [
    { instrument: 0, note: 'E2', dur: 2.5 },
    { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.5 },
  ] },
  { notes: [ { instrument: 2, note: 'B3', dur: 3.0 }, ] },
  { notes: [
    { instrument: 0, note: 'E3', dur: 2.5 },
    { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.5 },
    { instrument: 3, note: 'G4', dur: 2.0 },
    { instrument: 3, note: 'B4', dur: 2.0 },
  ] },
  { notes: [ { instrument: 2, note: 'G3', dur: 3.0 }, ] },
  { notes: [
    { instrument: 3, note: 'A4', dur: 3.0 },
    { instrument: 3, note: 'C#5', dur: 3.0 },
  ] },
  { notes: [] },
  // bar 15
  { notes: [
    { instrument: 0, note: 'A2', dur: 2.5 },
    { instrument: 2, note: 'A2', dur: 3.0 },
    { instrument: 1, note: 'A3', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'C#4', dur: 7.5, velocity: 0.6 },
    { instrument: 1, note: 'E4', dur: 7.5, velocity: 0.6 },
  ] },
  { notes: [] },
  { notes: [ { instrument: 2, note: 'E3', dur: 3.0, velocity: 0.5 }, ] },
  { notes: [ { instrument: 2, note: 'A3', dur: 3.0, velocity: 0.7 }, ] },
  { notes: [ { instrument: 2, note: 'C#4', dur: 3.0 }, ] },
  { notes: [] },
  { notes: [] },
  { notes: [] },
  // bar 16
  { notes: [
    { instrument: 0, note: 'C2', dur: 2.5 },
  ] },
  { notes: [] },
  { notes: [ { instrument: 0, note: 'C#2', dur: 2.5 }, ] },
  { notes: [
    { instrument: 2, note: 'A3', dur: 3.0 },
    { instrument: 2, note: 'D4', dur: 3.0 },
  ] },
  { notes: [ { instrument: 0, note: 'D2', dur: 2.5 }, ] },
  { notes: [ { instrument: 2, note: 'C#4', dur: 3.0 }, ] },
  { notes: [ { instrument: 0, note: 'D#2', dur: 2.5 }, ] },
  { notes: [] },
];

/**
 * Builds the pattern as a Tone.Sequence at one step per 8th note. Each event
 * is a leaf PatternStep; `play` is invoked once per step with the chord, and
 * the caller triggers all its notes at the same `time`.
 */
export function createTestPattern(play: (step: PatternStep, time: number) => void): Sequence<PatternStep> {
  return new Sequence<PatternStep>(
    (time, step) => play(step, time),
    STEPS,
    '8n',
  );
}