// voice-synth.ts — a self-contained, per-note synth voice.
//
// Each voice is an independent chain:
//   osc1, osc2 -> per-oscillator gains -> amplitude gain -> filter -> output
// One per-note Tone.Envelope drives the amplitude gain and also serves as this
// voice's modulation source. Time-based effects and compression are shared by
// the owning instrument rather than duplicated for every polyphonic voice.
//
// Oscillators run continuously. When portamento is enabled, a per-voice
// frequency Signal follows note changes and feeds both oscillators; otherwise
// each oscillator is tuned directly. Silence comes from the amplitude envelope.

import * as Tone from 'tone';

export interface VoiceOptions {
  osc1: { waveform: OscillatorType; detune: number; transpose: number; volume: number };
  osc2: { waveform: OscillatorType; detune: number; transpose: number; volume: number };
  portamento: { enabled: boolean; time: number };
  envelope: {
    attack: number; decay: number; sustain: number; release: number;
    curve: 'linear' | 'exponential';
  };
  filter: { type: BiquadFilterType; cutoff: number; q: number };
}

export class VoiceSynth {
  readonly osc1: Tone.OmniOscillator<any>;
  readonly osc2: Tone.OmniOscillator<any>;
  readonly osc1Gain: Tone.Gain;
  readonly osc2Gain: Tone.Gain;
  /** Shared base-frequency follower for the two oscillators in this voice. */
  readonly frequencyFollower: Tone.Signal<'frequency'>;
  private osc1FrequencyScale: Tone.Multiply;
  private osc2FrequencyScale: Tone.Multiply;
  readonly envelope: Tone.Envelope;
  readonly ampGain: Tone.Gain;
  readonly filter: Tone.Filter;
  readonly output: Tone.Gain;
  private osc1Transpose: number;
  private osc2Transpose: number;
  private filterCutoffBase: number;
  private filterQBase: number;
  private enabled1 = true;
  private enabled2 = true;
  private portamentoEnabled: boolean;
  private portamentoTime: number;
  /**
   * The note that owns this voice's next release. A scheduled release is kept
   * here until its audio-clock callback runs, so future attacks can determine
   * whether it will have finished at their own scheduled time.
   */
  private activeNote: { id: number; midi: number; releaseTime: number | null } | null = null;
  private nextNoteId = 0;
  private releaseTimeouts = new Set<number>();

  constructor(options: VoiceOptions) {
    this.osc1 = new Tone.OmniOscillator<any>({
      type: options.osc1.waveform as any,
      detune: options.osc1.detune,
    });
    this.osc2 = new Tone.OmniOscillator<any>({
      type: options.osc2.waveform as any,
      detune: options.osc2.detune,
    });
    this.osc1Gain = new Tone.Gain(options.osc1.volume);
    this.osc2Gain = new Tone.Gain(options.osc2.volume);
    this.frequencyFollower = new Tone.Signal<'frequency'>({ value: 440, units: 'frequency' });
    this.osc1FrequencyScale = new Tone.Multiply(VoiceSynth.transposeRatio(options.osc1.transpose));
    this.osc2FrequencyScale = new Tone.Multiply(VoiceSynth.transposeRatio(options.osc2.transpose));
    this.osc1Transpose = options.osc1.transpose;
    this.osc2Transpose = options.osc2.transpose;
    this.portamentoEnabled = options.portamento.enabled;
    this.portamentoTime = options.portamento.time;
    this.filterCutoffBase = options.filter.cutoff;
    this.filterQBase = options.filter.q;

    const env = {
      attack: options.envelope.attack,
      decay: options.envelope.decay,
      sustain: options.envelope.sustain,
      release: options.envelope.release,
      attackCurve: options.envelope.curve,
      decayCurve: options.envelope.curve,
      releaseCurve: options.envelope.curve,
    };
    // One ADSR is both the gate and the per-voice control signal.
    this.envelope = new Tone.Envelope(env);
    this.ampGain = new Tone.Gain(0);
    this.envelope.connect(this.ampGain.gain);

    this.filter = new Tone.Filter({
      type: options.filter.type,
      frequency: options.filter.cutoff,
      Q: options.filter.q,
    });

    this.output = new Tone.Gain(1);

    // Routing
    this.osc1.connect(this.osc1Gain);
    this.osc1Gain.connect(this.ampGain);
    this.osc2.connect(this.osc2Gain);
    this.osc2Gain.connect(this.ampGain);
    this.ampGain.connect(this.filter);
    this.filter.connect(this.output);

    // Multipliers apply the individual oscillator transpositions to a shared
    // base pitch without duplicating portamento automation per oscillator.
    this.frequencyFollower.connect(this.osc1FrequencyScale);
    this.frequencyFollower.connect(this.osc2FrequencyScale);
    if (this.portamentoEnabled) this.connectPortamento();

    // Oscillators run continuously; amplitude is gated by the envelope.
    this.osc1.start();
    this.osc2.start();
  }

  private static midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private static transposeRatio(semitones: number): number {
    return Math.pow(2, semitones / 12);
  }

  private connectPortamento(): void {
    this.osc1FrequencyScale.connect(this.osc1.frequency);
    this.osc2FrequencyScale.connect(this.osc2.frequency);
  }

  private disconnectPortamento(): void {
    this.osc1FrequencyScale.disconnect(this.osc1.frequency);
    this.osc2FrequencyScale.disconnect(this.osc2.frequency);
  }

  private setDirectFrequency(midi: number, time: number): void {
    if (this.enabled1) {
      this.osc1.frequency.setValueAtTime(VoiceSynth.midiToFreq(midi + this.osc1Transpose), time);
    }
    if (this.enabled2) {
      this.osc2.frequency.setValueAtTime(VoiceSynth.midiToFreq(midi + this.osc2Transpose), time);
    }
  }

  private noteIsActiveAt(time: number): boolean {
    return this.activeNote !== null
      && (this.activeNote.releaseTime === null || this.activeNote.releaseTime > time);
  }

  connectTo(bus: Tone.Gain): void {
    this.output.connect(bus);
  }

  triggerAttack(midi: number, time: number, velocity = 0.8): number {
    // Hard-cut: drop any pending automation from a previous note on this voice
    // so the new attack starts from a clean envelope (no stale release drags it
    // back down). Retriggering an exponential Tone envelope mid-release without
    // this leaves the old release ramp scheduled and corrupts later notes.
    this.envelope.cancel(time);
    const frequency = VoiceSynth.midiToFreq(midi);
    if (this.portamentoEnabled) {
      if (!this.noteIsActiveAt(time) || this.portamentoTime <= 0) {
        // The previous note has finished: start the new note at its own pitch.
        this.frequencyFollower.cancelScheduledValues(time);
        this.frequencyFollower.setValueAtTime(frequency, time);
      } else {
        // Tone's frequency Signal uses an exponential frequency ramp, giving a
        // constant-pitch-rate glide while preserving any in-progress glide.
        this.frequencyFollower.exponentialRampTo(frequency, this.portamentoTime, time);
      }
    } else {
      // Keep the follower current so toggling portamento on mid-note is stable,
      // but route the note directly to each oscillator while it is disabled.
      this.frequencyFollower.cancelScheduledValues(time);
      this.frequencyFollower.setValueAtTime(frequency, time);
      this.setDirectFrequency(midi, time);
    }
    const noteId = ++this.nextNoteId;
    this.activeNote = { id: noteId, midi, releaseTime: null };
    this.envelope.triggerAttack(time, velocity);
    return noteId;
  }

  triggerRelease(midi: number, time: number, noteId?: number): void {
    // A newer note may already own this voice. Its predecessor's scheduled
    // release must not end the newer note or mark its portamento as finished.
    if (this.activeNote?.midi !== midi || (noteId !== undefined && this.activeNote.id !== noteId)) return;
    this.activeNote = null;
    this.envelope.triggerRelease(time);
  }

  triggerAttackRelease(midi: number, duration: number, time: number, velocity = 0.8): void {
    const noteId = this.triggerAttack(midi, time, velocity);
    const releaseTime = time + Math.max(duration, 0.01);
    if (this.activeNote?.id === noteId) this.activeNote.releaseTime = releaseTime;

    // Transport callbacks schedule ahead of playback. Use Tone's audio-clock
    // timeout so the MIDI comparison happens at release time, not when it is
    // first scheduled; this prevents an old release from ending a new note.
    const context = Tone.getContext();
    let timeoutId = 0;
    timeoutId = context.setTimeout(() => {
      this.releaseTimeouts.delete(timeoutId);
      this.triggerRelease(midi, releaseTime, noteId);
    }, Math.max(0, releaseTime - context.now()));
    this.releaseTimeouts.add(timeoutId);
  }

  setOsc1Waveform(type: OscillatorType): void {
    this.osc1.type = type as any;
  }

  setOsc1Detune(detune: number): void {
    this.osc1.detune.value = detune;
  }

  setOsc1Transpose(transpose: number): void {
    this.osc1Transpose = transpose;
    this.osc1FrequencyScale.factor.value = VoiceSynth.transposeRatio(transpose);
  }

  setOsc1Enabled(enabled: boolean): void {
    this.enabled1 = enabled;
  }

  setOsc1Volume(volume: number): void {
    this.osc1Gain.gain.value = volume;
  }

  setOsc2Waveform(type: OscillatorType): void {
    this.osc2.type = type as any;
  }

  setOsc2Detune(detune: number): void {
    this.osc2.detune.value = detune;
  }

  setOsc2Transpose(transpose: number): void {
    this.osc2Transpose = transpose;
    this.osc2FrequencyScale.factor.value = VoiceSynth.transposeRatio(transpose);
  }

  setOsc2Enabled(enabled: boolean): void {
    this.enabled2 = enabled;
  }

  setOsc2Volume(volume: number): void {
    this.osc2Gain.gain.value = volume;
  }

  setPortamentoEnabled(enabled: boolean): void {
    if (this.portamentoEnabled === enabled) return;
    this.portamentoEnabled = enabled;
    const time = Tone.now();
    const activeMidi = this.noteIsActiveAt(time) ? this.activeNote?.midi ?? null : null;
    if (enabled) {
      if (activeMidi !== null) {
        this.frequencyFollower.cancelScheduledValues(time);
        this.frequencyFollower.setValueAtTime(VoiceSynth.midiToFreq(activeMidi), time);
      }
      this.connectPortamento();
    } else {
      this.disconnectPortamento();
      if (activeMidi !== null) this.setDirectFrequency(activeMidi, time);
    }
  }

  setPortamentoTime(time: number): void {
    this.portamentoTime = Math.max(0, time);
  }

  setEnvelopeAttack(attack: number): void {
    this.envelope.attack = attack;
  }

  setEnvelopeDecay(decay: number): void {
    this.envelope.decay = decay;
  }

  setEnvelopeSustain(sustain: number): void {
    this.envelope.sustain = sustain;
  }

  setEnvelopeRelease(release: number): void {
    this.envelope.release = release;
  }

  setEnvelopeCurve(curve: 'linear' | 'exponential'): void {
    this.envelope.attackCurve = curve;
    this.envelope.decayCurve = curve;
    this.envelope.releaseCurve = curve;
  }

  setFilterType(type: BiquadFilterType): void {
    this.filter.type = type;
  }

  setFilterCutoff(cutoff: number): void {
    this.filterCutoffBase = cutoff;
    this.filter.frequency.value = cutoff;
  }

  setFilterCutoffAtTime(cutoff: number, time: number): void {
    this.filterCutoffBase = cutoff;
    this.filter.frequency.setValueAtTime(cutoff, time);
  }

  setFilterQ(q: number): void {
    this.filterQBase = q;
    this.filter.Q.value = q;
  }

  /** Base values are retained separately because modulated Params are zeroed. */
  getFilterCutoffBase(): number {
    return this.filterCutoffBase;
  }

  getFilterQBase(): number {
    return this.filterQBase;
  }

  /** Audio-rate controls which can be modulated per voice. */
  getModulationTarget(path: string): Tone.Param<any> | Tone.Signal<any> | null {
    switch (path) {
      case 'osc.osc1.detune': return this.osc1.detune;
      case 'osc.osc1.transpose': return this.osc1.detune;
      case 'osc.osc1.volume': return this.osc1Gain.gain;
      case 'osc.osc2.detune': return this.osc2.detune;
      case 'osc.osc2.transpose': return this.osc2.detune;
      case 'osc.osc2.volume': return this.osc2Gain.gain;
      case 'filter.cutoff': return this.filter.frequency;
      case 'filter.q': return this.filter.Q;
      default: return null;
    }
  }

  dispose(): void {
    const context = Tone.getContext();
    for (const timeoutId of this.releaseTimeouts) context.clearTimeout(timeoutId);
    this.releaseTimeouts.clear();
    this.osc1.stop();
    this.osc2.stop();
    this.osc1.dispose();
    this.osc2.dispose();
    this.osc1Gain.dispose();
    this.osc2Gain.dispose();
    this.frequencyFollower.dispose();
    this.osc1FrequencyScale.dispose();
    this.osc2FrequencyScale.dispose();
    this.envelope.dispose();
    this.ampGain.dispose();
    this.filter.dispose();
    this.output.dispose();
  }
}
