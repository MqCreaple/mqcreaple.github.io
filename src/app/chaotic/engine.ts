// engine.ts — Web Audio engine for the "chaotic" app, built on Tone.js.
//
// Each instrument follows the conventional chain:
//   synth (one oscillator + one ADSR envelope)
//     -> filter
//     -> distortion (top of the FX chain; transparent at drive 0)
//     -> delay -> reverb
//     -> per-instrument compressor -> Channel (volume/pan/mute/solo)
// The Channel strip provides the final mute/solo/volume/pan controls.
//
// The master bus runs master gain -> master compressor -> destination.
// Tone.Transport + Tone.Sequence schedule the test pattern (one note per beat).

import * as Tone from 'tone';
import { VoiceSynth } from './voice-synth.ts';
import { ModulationConnection } from './modulation.ts';
import type { ModulationTarget } from './modulation.ts';
import type { ModulationSource } from './config.ts';
import { modulatedControlValue } from './modulation-range.ts';
import { getModulationRange as controlModulationRange, getModulationSource, modulationSourceCanModulate, modulationTargetScope } from './config.ts';
import { Lorenz } from './dynamics/lorenz.ts';

export interface OscillatorVoiceConfig {
  enabled: boolean;
  waveform: OscillatorType;
  detune: ModValue; // cents
  transpose: ModValue; // semitones
  volume: ModValue; // 0..1 mix level
}

export type { ModulationSource } from './config.ts';
export interface ModParam {
  value: number;
  env: ModulationSource;
  amplitude: number;
}

/** Plain number, or a base value with an optional env/LFO modulation. */
export type ModValue = number | ModParam;

/** Resolve the plain (base) number from a ModValue. */
export function resolveNumber(v: ModValue): number {
  return typeof v === 'number' ? v : v.value;
}


/** A modulation assignment, or null for a plain number. */
export interface LfoConfig {
  enabled: boolean;
  waveform: OscillatorType;
  rate: number; // Hz
}

export interface OscConfig {
  /** Number of simultaneous voices; one voice is monophonic. */
  voices: number;
  /** One glide setting shared by both oscillators in every voice. */
  portamento: { enabled: boolean; time: number };
  osc1: OscillatorVoiceConfig;
  osc2: OscillatorVoiceConfig;
}

export interface EnvConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  /** Envelope segment curves: 'linear' or 'exponential'. */
  curve: 'linear' | 'exponential';
}

export interface FilterConfig {
  type: BiquadFilterType;
  cutoff: ModValue;
  q: ModValue;
  /** Key tracking: the actual cutoff follows the played note (C3 = base). */
  keyTracking: boolean;
}

export interface DistortionConfig {
  /** Drive amount 0..1 that shapes the waveshaper curve. */
  drive: number;
  /** Dry/wet mix of the distortion; 0 keeps the stage transparent. */
  wet: ModValue;
}

export interface DelayConfig {
  time: ModValue;
  feedback: ModValue;
  wet: ModValue;
}

export interface ReverbConfig {
  wet: ModValue;
  decay: ModValue;
}

export interface CompConfig {
  threshold: ModValue;
  ratio: ModValue;
  attack: ModValue;
  release: ModValue;
}

export interface OutConfig {
  volume: ModValue; // linear 0..1
  pan: ModValue; // -1..1
}

export interface InstrumentConfig {
  id: string;
  name: string;
  osc: OscConfig;
  env: EnvConfig;
  /** Per-instrument LFO settings. */
  lfo: LfoConfig;
  filter: FilterConfig;
  /** Distortion stage at the top of the FX chain (drive + wet). */
  distortion: DistortionConfig;
  delay: DelayConfig;
  reverb: ReverbConfig;
  comp: CompConfig;
  out: OutConfig;
}

const midiToFreq = (midi: number): number => Tone.Frequency(midi, 'midi').toFrequency();

/** Frequency of C3 (MIDI 48), the key-tracking reference note. */
const C3_FREQ = midiToFreq(48);

/** Resolve a MIDI number or a note name (e.g. 'A3') to a MIDI number. */
export function noteToMidi(note: number | string): number {
  return typeof note === 'number' ? note : Tone.Frequency(note).toMidi();
}

export class Instrument {
  readonly id: string;
  readonly name: string;
  private voiceCount: number;
  private voiceBus: Tone.Gain;
  private channel: Tone.Channel;
  private outputGain: Tone.Gain;
  private meter: Tone.Meter;
  private voices: VoiceSynth[] = [];
  private busyUntil: number[] = [];
  private lfo: Tone.OmniOscillator<any>;
  private lfoGain: Tone.Gain;
  private lfoConfig: LfoConfig;
  private lfoStartedAt: number;
  private modulations = new Map<string, ModParam>();
  private voiceModulations = new Map<VoiceSynth, Map<string, ModulationConnection>>();
  private instrumentModulations = new Map<string, ModulationConnection>();
  private readonly engine: AudioEngine;

  // resolved parameter bases, pushed into every voice
  private osc1: { enabled: boolean; waveform: OscillatorType; detune: number; transpose: number; volume: number };
  private osc2: { enabled: boolean; waveform: OscillatorType; detune: number; transpose: number; volume: number };
  private portamento: { enabled: boolean; time: number };
  private env: EnvConfig;
  private filterBase: { type: BiquadFilterType; cutoff: number; q: number };
  private filterKeytrack: boolean;
  private distortionBase: { drive: number; wet: number };
  private delayBase: { time: number; feedback: number; wet: number };
  private reverbBase: { wet: number; decay: number };
  private compBase: { threshold: number; ratio: number; attack: number; release: number };
  private outBase: { volume: number; pan: number };
  private distortion: Tone.Distortion;
  private delaySend: Tone.Gain;
  private delay: Tone.FeedbackDelay;
  private delayMix: Tone.Gain;
  private reverbSend: Tone.Gain;
  private reverb: Tone.Reverb;
  private reverbMix: Tone.Gain;
  private comp: Tone.Compressor;
  /** A disconnected filter used only for the animated response preview. */
  private responseFilter: Tone.Filter;
  private activeVoiceIndex = 0;
  private reverbDecayTimer: ReturnType<typeof setTimeout> | null = null;
  private distortionCurveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: InstrumentConfig, bus: Tone.Gain, engine: AudioEngine) {
    this.id = config.id;
    this.name = config.name;
    this.engine = engine;
    this.voiceCount = Math.min(8, Math.max(1, Math.round(config.osc.voices)));

    this.osc1 = { ...config.osc.osc1, detune: resolveNumber(config.osc.osc1.detune), transpose: resolveNumber(config.osc.osc1.transpose), volume: resolveNumber(config.osc.osc1.volume) };
    this.osc2 = { ...config.osc.osc2, detune: resolveNumber(config.osc.osc2.detune), transpose: resolveNumber(config.osc.osc2.transpose), volume: resolveNumber(config.osc.osc2.volume) };
    this.portamento = { ...config.osc.portamento };
    this.env = { ...config.env };
    this.filterBase = {
      type: config.filter.type,
      cutoff: resolveNumber(config.filter.cutoff),
      q: resolveNumber(config.filter.q),
    };
    this.filterKeytrack = config.filter.keyTracking ?? false;
    this.distortionBase = { drive: config.distortion.drive, wet: resolveNumber(config.distortion.wet) };
    this.delayBase = {
      time: resolveNumber(config.delay.time),
      feedback: resolveNumber(config.delay.feedback),
      wet: resolveNumber(config.delay.wet),
    };
    this.reverbBase = { wet: resolveNumber(config.reverb.wet), decay: resolveNumber(config.reverb.decay) };
    this.compBase = {
      threshold: resolveNumber(config.comp.threshold),
      ratio: resolveNumber(config.comp.ratio),
      attack: resolveNumber(config.comp.attack),
      release: resolveNumber(config.comp.release),
    };
    this.outBase = { volume: resolveNumber(config.out.volume), pan: resolveNumber(config.out.pan) };
    this.lfoConfig = { ...config.lfo };

    // Channel strip: volume/pan/mute/solo live at instrument level.
    this.channel = new Tone.Channel({
      volume: 0,
      pan: this.outBase.pan,
      mute: false,
      solo: false,
    });
    this.voiceBus = new Tone.Gain(1);
    this.outputGain = new Tone.Gain(this.outBase.volume);
    this.lfo = new Tone.OmniOscillator<any>({ type: this.lfoConfig.waveform as any, frequency: this.lfoConfig.rate });
    this.lfoGain = new Tone.Gain(this.lfoConfig.enabled ? 1 : 0);
    this.lfoStartedAt = Tone.now();
    this.lfo.connect(this.lfoGain);
    this.lfo.start(this.lfoStartedAt);
    this.delayMix = new Tone.Gain(1);
    this.reverbMix = new Tone.Gain(1);
    this.delaySend = new Tone.Gain(this.delayBase.wet);
    this.delay = new Tone.FeedbackDelay({
      delayTime: this.delayBase.time,
      feedback: this.delayBase.feedback,
      wet: 1,
    });
    this.reverbSend = new Tone.Gain(this.reverbBase.wet);
    this.reverb = new Tone.Reverb({ decay: this.reverbBase.decay, wet: 1 });
    this.comp = new Tone.Compressor(this.compBase);
    this.responseFilter = new Tone.Filter({
      type: this.filterBase.type,
      frequency: this.filterBase.cutoff,
      Q: this.filterBase.q,
    });

    // Mix all voices before the expensive effects. This makes the chains
    // per-instrument instead of per-voice (4 chains rather than 14).
    //
    // Effect order follows the UI and configuration:
    //   distortion -> delay -> reverb -> compressor
    // Each stage keeps the dry signal at unity and adds its fully-wet
    // effect tail scaled by the send gain, so the wet knobs keep their
    // send semantics while the delay tail also feeds the reverb.
    this.distortion = new Tone.Distortion({
      distortion: this.distortionBase.drive,
      wet: this.distortionBase.wet,
    });
    this.voiceBus.connect(this.distortion);
    this.distortion.connect(this.delayMix);
    this.distortion.connect(this.delaySend);
    this.delaySend.connect(this.delay);
    this.delay.connect(this.delayMix);
    this.delayMix.connect(this.reverbMix);
    this.delayMix.connect(this.reverbSend);
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.reverbMix);
    this.reverbMix.connect(this.comp);
    this.comp.connect(this.outputGain);
    this.outputGain.connect(this.channel);
    this.channel.connect(bus);

    this.meter = new Tone.Meter({ normalRange: true, smoothing: 0.8 });
    this.channel.connect(this.meter);

    this.captureInitialModulations(config);
    this.rebuildPool();
    this.refreshInstrumentModulations();
  }

  private voiceOptions() {
    return {
      osc1: { waveform: this.osc1.waveform, detune: this.osc1.detune, transpose: this.osc1.transpose, volume: this.osc1.volume },
      osc2: { waveform: this.osc2.waveform, detune: this.osc2.detune, transpose: this.osc2.transpose, volume: this.osc2.volume },
      portamento: { ...this.portamento },
      envelope: {
        attack: this.env.attack,
        decay: this.env.decay,
        sustain: this.env.sustain,
        release: this.env.release,
        curve: this.env.curve,
      },
      filter: { ...this.filterBase },
    };
  }

  private captureInitialModulations(config: InstrumentConfig): void {
    const values: Array<[string, ModValue]> = [
      ['osc.osc1.detune', config.osc.osc1.detune],
      ['osc.osc1.transpose', config.osc.osc1.transpose],
      ['osc.osc1.volume', config.osc.osc1.volume],
      ['osc.osc2.detune', config.osc.osc2.detune],
      ['osc.osc2.transpose', config.osc.osc2.transpose],
      ['osc.osc2.volume', config.osc.osc2.volume],
      ['filter.cutoff', config.filter.cutoff],
      ['filter.q', config.filter.q],
      ['distortion.wet', config.distortion.wet],
      ['delay.time', config.delay.time],
      ['delay.feedback', config.delay.feedback],
      ['delay.wet', config.delay.wet],
      ['reverb.wet', config.reverb.wet],
      ['comp.threshold', config.comp.threshold],
      ['comp.ratio', config.comp.ratio],
      ['comp.attack', config.comp.attack],
      ['comp.release', config.comp.release],
      ['out.volume', config.out.volume],
      ['out.pan', config.out.pan],
    ];
    for (const [path, value] of values) {
      if (typeof value !== 'number') this.modulations.set(path, { ...value });
    }
  }

  private isVoiceModulation(path: string): boolean {
    return modulationTargetScope(path) === 'voice';
  }

  /** Resolve a modulation source id to its audio node. */
  private getModulationSourceNode(id: ModulationSource, voice?: VoiceSynth): Tone.ToneAudioNode | null {
    const spec = getModulationSource(id);
    if (!spec) return null;
    if (spec.scope === 'voice') return voice ? voice.envelope : null;
    if (spec.scope === 'instrument') return this.lfoGain;
    return this.engine.getGlobalModulationSource(id);
  }

  private getBase(path: string): number | null {
    switch (path) {
      case 'osc.osc1.detune': return this.osc1.detune;
      case 'osc.osc1.transpose': return this.osc1.transpose;
      case 'osc.osc1.volume': return this.osc1.volume;
      case 'osc.osc2.detune': return this.osc2.detune;
      case 'osc.osc2.transpose': return this.osc2.transpose;
      case 'osc.osc2.volume': return this.osc2.volume;
      case 'filter.cutoff': return this.filterBase.cutoff;
      case 'filter.q': return this.filterBase.q;
      case 'distortion.drive': return this.distortionBase.drive;
      case 'distortion.wet': return this.distortionBase.wet;
      case 'delay.time': return this.delayBase.time;
      case 'delay.feedback': return this.delayBase.feedback;
      case 'delay.wet': return this.delayBase.wet;
      case 'reverb.wet': return this.reverbBase.wet;
      case 'comp.threshold': return this.compBase.threshold;
      case 'comp.ratio': return this.compBase.ratio;
      case 'comp.attack': return this.compBase.attack;
      case 'comp.release': return this.compBase.release;
      case 'out.volume': return this.outBase.volume;
      case 'out.pan': return this.outBase.pan;
      default: return null;
    }
  }

  private getInstrumentModulationTarget(path: string): ModulationTarget | null {
    switch (path) {
      case 'distortion.wet': return this.distortion.wet;
      case 'delay.time': return this.delay.delayTime;
      case 'delay.feedback': return this.delay.feedback;
      case 'delay.wet': return this.delaySend.gain;
      case 'reverb.wet': return this.reverbSend.gain;
      case 'comp.threshold': return this.comp.threshold;
      case 'comp.ratio': return this.comp.ratio;
      case 'comp.attack': return this.comp.attack;
      case 'comp.release': return this.comp.release;
      case 'out.volume': return this.outputGain.gain;
      case 'out.pan': return this.channel.pan;
      default: return null;
    }
  }

  private disposeVoiceModulations(): void {
    for (const connections of this.voiceModulations.values()) {
      for (const connection of connections.values()) connection.dispose();
    }
    this.voiceModulations.clear();
  }

  private refreshVoiceModulation(path: string): void {
    const modulation = this.modulations.get(path);
    for (const voice of this.voices) {
      let connections = this.voiceModulations.get(voice);
      if (!connections) {
        connections = new Map();
        this.voiceModulations.set(voice, connections);
      }
      connections.get(path)?.dispose();
      connections.delete(path);
      const target = voice.getModulationTarget(path);
      const range = controlModulationRange(path);
      if (!modulation || !target || !range) continue;
      const source = this.getModulationSourceNode(modulation.env, voice);
      if (!source) continue;
      connections.set(path, new ModulationConnection({
        source,
        sourceKind: modulation.env,
        target,
        range,
        base: modulation.value,
        amplitude: modulation.amplitude,
        setBase: !path.endsWith('.transpose'),
        outputScale: path.endsWith('.transpose') ? 100 : 1,
      }));
    }
  }

  private refreshAllVoiceModulations(): void {
    for (const path of this.modulations.keys()) {
      if (this.isVoiceModulation(path)) this.refreshVoiceModulation(path);
    }
  }

  private refreshInstrumentModulation(path: string): void {
    const old = this.instrumentModulations.get(path);
    old?.dispose();
    this.instrumentModulations.delete(path);

    const modulation = this.modulations.get(path);
    const sourceSpec = modulation ? getModulationSource(modulation.env) : undefined;
    const target = this.getInstrumentModulationTarget(path);
    const range = controlModulationRange(path);
    if (!modulation || !target || !range || !sourceSpec || !modulationSourceCanModulate(sourceSpec.scope, 'instrument')) return;
    const source = this.getModulationSourceNode(modulation.env);
    if (!source) return;
    this.instrumentModulations.set(path, new ModulationConnection({
      source,
      sourceKind: modulation.env,
      target,
      range,
      base: modulation.value,
      amplitude: modulation.amplitude,
    }));
  }

  private refreshInstrumentModulations(): void {
    for (const path of this.modulations.keys()) {
      if (!this.isVoiceModulation(path)) this.refreshInstrumentModulation(path);
    }
  }


  /** Recreate all active modulation connections (called after global sources become ready). */
  refreshModulationSources(): void {
    this.refreshAllVoiceModulations();
    this.refreshInstrumentModulations();
  }

  /** Set or clear one modulation assignment, respecting source/target scopes. */
  setModulation(path: string, modulation: ModParam | null): void {
    const voiceTarget = this.isVoiceModulation(path);
    const targetScope = modulationTargetScope(path);
    const sourceSpec = modulation ? getModulationSource(modulation.env) : undefined;
    if (modulation && (!sourceSpec || !targetScope || !modulationSourceCanModulate(sourceSpec.scope, targetScope))) return;
    if (modulation && !voiceTarget && !this.getInstrumentModulationTarget(path)) return;

    if (modulation) this.modulations.set(path, { ...modulation });
    else this.modulations.delete(path);

    if (voiceTarget) this.refreshVoiceModulation(path);
    else this.refreshInstrumentModulation(path);

    if (!modulation) {
      const base = this.getBase(path);
      if (base !== null) this.setParam(path, base);
    }
  }

  private updateModulationBase(path: string, value: number): void {
    const modulation = this.modulations.get(path);
    if (!modulation) return;
    modulation.value = value;
    if (this.isVoiceModulation(path)) {
      for (const connections of this.voiceModulations.values()) {
        connections.get(path)?.update(modulation.value, modulation.amplitude);
      }
    } else {
      this.instrumentModulations.get(path)?.update(modulation.value, modulation.amplitude);
    }
  }
  /** Rebuild the pool after changing the requested number of voices. */
  private rebuildPool(): void {
    this.disposeVoiceModulations();
    for (const v of this.voices) v.dispose();
    this.voices = [];
    this.busyUntil = [];
    const count = this.voiceCount;
    for (let i = 0; i < count; i++) {
      const v = new VoiceSynth(this.voiceOptions());
      v.connectTo(this.voiceBus);
      this.voices.push(v);
      this.busyUntil.push(0);
    }
    this.refreshAllVoiceModulations();
  }

  private pushToVoices(path: string): void {
    let update: ((voice: VoiceSynth) => void) | undefined;
    switch (path) {
      case 'osc.osc1.waveform':
        update = (voice) => voice.setOsc1Waveform(this.osc1.waveform);
        break;
      case 'osc.osc1.detune':
        update = (voice) => voice.setOsc1Detune(this.osc1.detune);
        break;
      case 'osc.osc1.transpose':
        update = (voice) => voice.setOsc1Transpose(this.osc1.transpose);
        break;
      case 'osc.osc1.enabled':
        update = (voice) => voice.setOsc1Enabled(this.osc1.enabled);
        break;
      case 'osc.osc1.volume':
        update = (voice) => voice.setOsc1Volume(this.osc1.volume);
        break;
      case 'osc.osc2.waveform':
        update = (voice) => voice.setOsc2Waveform(this.osc2.waveform);
        break;
      case 'osc.osc2.detune':
        update = (voice) => voice.setOsc2Detune(this.osc2.detune);
        break;
      case 'osc.osc2.transpose':
        update = (voice) => voice.setOsc2Transpose(this.osc2.transpose);
        break;
      case 'osc.osc2.enabled':
        update = (voice) => voice.setOsc2Enabled(this.osc2.enabled);
        break;
      case 'osc.osc2.volume':
        update = (voice) => voice.setOsc2Volume(this.osc2.volume);
        break;
      case 'osc.portamento.enabled':
        update = (voice) => voice.setPortamentoEnabled(this.portamento.enabled);
        break;
      case 'osc.portamento.time':
        update = (voice) => voice.setPortamentoTime(this.portamento.time);
        break;
      case 'env.attack':
        update = (voice) => voice.setEnvelopeAttack(this.env.attack);
        break;
      case 'env.decay':
        update = (voice) => voice.setEnvelopeDecay(this.env.decay);
        break;
      case 'env.sustain':
        update = (voice) => voice.setEnvelopeSustain(this.env.sustain);
        break;
      case 'env.release':
        update = (voice) => voice.setEnvelopeRelease(this.env.release);
        break;
      case 'env.curve':
        update = (voice) => voice.setEnvelopeCurve(this.env.curve);
        break;
      case 'filter.type':
        update = (voice) => voice.setFilterType(this.filterBase.type);
        break;
      case 'filter.cutoff':
        update = (voice) => voice.setFilterCutoff(this.filterBase.cutoff);
        break;
      case 'filter.q':
        update = (voice) => voice.setFilterQ(this.filterBase.q);
        break;
      default:
        return;
    }

    for (const voice of this.voices) update(voice);
  }

  /** Rebuild convolution reverb only after a burst of decay edits settles. */
  private scheduleReverbDecay(): void {
    if (this.reverbDecayTimer !== null) clearTimeout(this.reverbDecayTimer);
    this.reverbDecayTimer = setTimeout(() => {
      this.reverb.decay = this.reverbBase.decay;
      this.reverbDecayTimer = null;
    }, 150);
  }

  /** Rebuild the distortion waveshaper curve only after drive edits settle. */
  private scheduleDistortionCurve(): void {
    if (this.distortionCurveTimer !== null) clearTimeout(this.distortionCurveTimer);
    this.distortionCurveTimer = setTimeout(() => {
      this.distortion.distortion = this.distortionBase.drive;
      this.distortionCurveTimer = null;
    }, 150);
  }

  /** Update any parameter by dotted path (see main.ts SECTIONS). */
  setParam(path: string, value: number | string | boolean): void {
    switch (path) {
      case 'osc.osc1.waveform':
        this.osc1.waveform = value as OscillatorType;
        break;
      case 'osc.osc1.detune':
        this.osc1.detune = value as number;
        break;
      case 'osc.osc1.transpose':
        this.osc1.transpose = value as number;
        break;
      case 'osc.osc1.enabled':
        this.osc1.enabled = value as boolean;
        break;
      case 'osc.osc1.volume':
        this.osc1.volume = value as number;
        break;
      case 'osc.osc2.waveform':
        this.osc2.waveform = value as OscillatorType;
        break;
      case 'osc.osc2.detune':
        this.osc2.detune = value as number;
        break;
      case 'osc.osc2.transpose':
        this.osc2.transpose = value as number;
        break;
      case 'osc.osc2.enabled':
        this.osc2.enabled = value as boolean;
        break;
      case 'osc.osc2.volume':
        this.osc2.volume = value as number;
        break;
      case 'osc.portamento.enabled':
        this.portamento.enabled = value as boolean;
        break;
      case 'osc.portamento.time':
        this.portamento.time = value as number;
        break;
      case 'osc.voices': {
        const nextVoiceCount = Math.min(8, Math.max(1, Math.round(value as number)));
        if (nextVoiceCount === this.voiceCount) break;
        this.voiceCount = nextVoiceCount;
        this.rebuildPool();
        break;
      }
      case 'lfo.enabled':
        this.lfoConfig.enabled = value as boolean;
        this.lfoGain.gain.rampTo(this.lfoConfig.enabled ? 1 : 0, 0.02);
        break;
      case 'lfo.waveform':
        this.lfoConfig.waveform = value as OscillatorType;
        this.lfo.type = this.lfoConfig.waveform as any;
        break;
      case 'lfo.rate':
        this.lfoConfig.rate = value as number;
        this.lfo.frequency.rampTo(this.lfoConfig.rate, 0.02);
        break;
      case 'env.attack':
      case 'env.decay':
      case 'env.sustain':
      case 'env.release':
        this.env[path.slice(4) as 'attack' | 'decay' | 'sustain' | 'release'] = value as number;
        break;
      case 'env.curve':
        this.env.curve = value as 'linear' | 'exponential';
        break;
      case 'filter.type':
        this.filterBase.type = value as BiquadFilterType;
        break;
      case 'filter.cutoff':
        this.filterBase.cutoff = value as number;
        break;
      case 'filter.q':
        this.filterBase.q = value as number;
        break;
      case 'filter.keyTracking':
        this.filterKeytrack = value as boolean;
        break;
      case 'distortion.drive':
        this.distortionBase.drive = value as number;
        // Rebuilding the waveshaper curve is expensive; wait for the drag to settle.
        this.scheduleDistortionCurve();
        break;
      case 'distortion.wet':
        this.distortionBase.wet = value as number;
        this.distortion.wet.rampTo(this.distortionBase.wet, 0.05);
        break;
      case 'delay.time':
        this.delayBase.time = value as number;
        this.delay.delayTime.rampTo(this.delayBase.time, 0.05);
        break;
      case 'delay.feedback':
        this.delayBase.feedback = value as number;
        this.delay.feedback.rampTo(this.delayBase.feedback, 0.05);
        break;
      case 'delay.wet':
        this.delayBase.wet = value as number;
        this.delaySend.gain.rampTo(this.delayBase.wet, 0.05);
        break;
      case 'reverb.wet':
        this.reverbBase.wet = value as number;
        this.reverbSend.gain.rampTo(this.reverbBase.wet, 0.05);
        break;
      case 'reverb.decay':
        this.reverbBase.decay = value as number;
        this.scheduleReverbDecay();
        break;
      case 'comp.threshold':
      case 'comp.ratio':
      case 'comp.attack':
      case 'comp.release':
        this.compBase[path.slice(5) as 'threshold' | 'ratio' | 'attack' | 'release'] = value as number;
        this.comp[path.slice(5) as 'threshold' | 'ratio' | 'attack' | 'release'].rampTo(value as number, 0.05);
        break;
      case 'out.volume':
        this.outBase.volume = value as number;
        this.outputGain.gain.rampTo(this.outBase.volume, 0.1);
        break;
      case 'out.pan':
        this.outBase.pan = value as number;
        this.channel.pan.rampTo(this.outBase.pan, 0.1);
        break;
      default:
        break;
    }
    // Effect/output edits already target their shared instrument nodes directly.
    if (
      path !== 'osc.voices' && path !== 'filter.keyTracking'
      && (path.startsWith('osc.') || path.startsWith('env.') || path.startsWith('filter.'))
    ) {
      this.pushToVoices(path);
    }
    if (typeof value === 'number') this.updateModulationBase(path, value);
  }

  setMuted(muted: boolean): void {
    this.channel.mute = muted;
  }

  get isSoloed(): boolean {
    return this.channel.solo;
  }

  setSoloed(soloed: boolean): void {
    this.channel.solo = soloed;
  }

  /** Pick a voice for a note at `time`; a full pool steals the least-busy voice. */
  private pickVoice(time: number): number {
    if (this.voiceCount <= 1 || this.voices.length <= 1) return 0;
    for (let i = 0; i < this.voices.length; i++) {
      if (this.busyUntil[i] <= time) {
        return i;
      }
    }
    // all busy: steal the one that frees up first
    let best = 0;
    for (let i = 1; i < this.voices.length; i++) {
      if (this.busyUntil[i] < this.busyUntil[best]) best = i;
    }
    return best;
  }

  trigger(midi: number, time: number, dur: number, velocity = 1.0): void {
    const idx = this.pickVoice(time);
    const voice = this.voices[idx];
    this.activeVoiceIndex = idx;

    // key tracking: cutoff follows the played note on this voice's own filter
    if (this.filterKeytrack && voice) {
      const freq = midiToFreq(midi);
      const cutoff = Math.min(Math.max(this.filterBase.cutoff * (freq / C3_FREQ), 20), 20000);
      const modulation = this.modulations.get('filter.cutoff');
      const connection = this.voiceModulations.get(voice)?.get('filter.cutoff');
      voice.setFilterCutoffAtTime(cutoff, time);
      if (modulation && connection) connection.update(cutoff, modulation.amplitude);
    }
    if (voice) voice.triggerAttackRelease(midi, Math.max(dur, 0.01), time, velocity);

    const release = this.env.release + 0.1;
    this.busyUntil[idx] = time + Math.max(dur, 0.01) + release;
  }

  /** Current output level of the channel, normalized to 0..1. */
  getLevel(): number {
    const value = this.meter.getValue();
    return typeof value === 'number' ? value : 0;
  }

  private activeVoice(): VoiceSynth | null {
    return this.voices[this.activeVoiceIndex] ?? this.voices[0] ?? null;
  }

  private lfoValueAt(time: number): number {
    if (!this.lfoConfig.enabled) return 0;
    const phase = ((time - this.lfoStartedAt) * this.lfoConfig.rate) % 1;
    const p = phase < 0 ? phase + 1 : phase;
    switch (this.lfoConfig.waveform) {
      case 'triangle': return 1 - 4 * Math.abs(((p + 0.25) % 1) - 0.5);
      case 'sawtooth': return 2 * p - 1;
      case 'square': return p < 0.5 ? 1 : -1;
      default: return Math.sin(2 * Math.PI * p);
    }
  }

  private currentFilterValue(voice: VoiceSynth, path: 'filter.cutoff' | 'filter.q', time: number): number {
    const base = path === 'filter.cutoff' ? voice.getFilterCutoffBase() : voice.getFilterQBase();
    const modulation = this.modulations.get(path);
    if (!modulation) return base;
    const range = controlModulationRange(path);
    if (!range) return base;
    const source = this.modulationValueAt(voice, time, modulation.env);
    return modulatedControlValue(base, modulation.amplitude, modulation.env, source, range);
  }

  /**
   * Sample the current output of whichever modulator is wired to this filter
   * path. Audio-rate nodes cannot be read from the main thread, so each source
   * kind is mirrored from its own main-thread state: the voice envelope from
   * its Tone automation, the instrument LFO from its oscillator configuration,
   * and the global Lorenz attractor from the state its worklet posts back.
   */
  private modulationValueAt(voice: VoiceSynth, time: number, sourceId: ModulationSource): number {
    const spec = getModulationSource(sourceId);
    if (!spec) return 0;
    switch (spec.kind) {
      case 'envelope': return voice.envelope.getValueAtTime(time);
      case 'lfo': return this.lfoValueAt(time);
      case 'lorenz': return this.engine.getGlobalModulationValue(sourceId);
      default: return 0;
    }
  }

  private currentFilterParameters(time = Tone.now()): { cutoff: number; q: number } {
    const voice = this.activeVoice();
    if (!voice) return { cutoff: this.filterBase.cutoff, q: this.filterBase.q };
    return {
      cutoff: Math.min(20000, Math.max(20, this.currentFilterValue(voice, 'filter.cutoff', time))),
      q: Math.max(0.0001, this.currentFilterValue(voice, 'filter.q', time)),
    };
  }

  /** Whether the response needs periodic samples instead of a static redraw. */
  hasAnimatedFilterResponse(): boolean {
    return this.modulations.has('filter.cutoff') || this.modulations.has('filter.q');
  }

  /** Linear magnitude response at the active voice's current modulated values. */
  getFilterResponse(len: number): Float32Array {
    const { cutoff, q } = this.currentFilterParameters();
    this.responseFilter.type = this.filterBase.type;
    this.responseFilter.frequency.value = cutoff;
    this.responseFilter.Q.value = q;
    return this.responseFilter.getFrequencyResponse(len);
  }

  /** Current actual cutoff of the active voice's filter (Hz). */
  getFilterCutoff(): number {
    return this.currentFilterParameters().cutoff;
  }

}
export class AudioEngine {
  readonly instruments: Instrument[] = [];
  private _lorenz: Lorenz | null = null;

  /** The single global Lorenz attractor shared by all instruments. */
  get lorenz(): Lorenz | null {
    return this._lorenz;
  }
  private masterComp: Tone.Compressor;
  private masterGain: Tone.Gain;
  private masterVolume = 0.8;
  private masterModulation: ModParam | null = null;
  private masterModulationConnection: ModulationConnection | null = null;

  constructor() {
    this.masterComp = new Tone.Compressor({
      threshold: -12,
      ratio: 6,
      attack: 0.003,
      release: 0.25,
    });
    this.masterGain = new Tone.Gain(this.masterVolume);
    this.masterGain.connect(this.masterComp);
    this.masterComp.connect(Tone.getDestination());
  }

  addInstrument(config: InstrumentConfig): Instrument {
    const inst = new Instrument(config, this.masterGain, this);
    this.instruments.push(inst);
    return inst;
  }

  /** Current master volume, used as the base when modulation is active. */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.min(1, Math.max(0, volume));
    const modulation = this.masterModulation;
    if (modulation) modulation.value = this.masterVolume;
    if (modulation && this.masterModulationConnection) {
      this.masterModulationConnection.update(this.masterVolume, modulation.amplitude);
      return;
    }
    this.masterGain.gain.rampTo(this.masterVolume, 0.1);
  }

  /** Set or clear modulation on the master gain. */
  setMasterVolumeModulation(modulation: ModParam | null): void {
    const source = modulation ? getModulationSource(modulation.env) : undefined;
    if (modulation && (!source || source.scope !== 'global')) return;
    this.masterModulation = modulation ? { ...modulation } : null;
    this.refreshMasterModulation();
  }

  private refreshMasterModulation(): void {
    this.masterModulationConnection?.dispose();
    this.masterModulationConnection = null;

    const modulation = this.masterModulation;
    if (!modulation) {
      this.masterGain.gain.rampTo(this.masterVolume, 0.1);
      return;
    }

    const source = this.getGlobalModulationSource(modulation.env);
    const range = controlModulationRange('master');
    if (!source || !range) return;
    this.masterModulationConnection = new ModulationConnection({
      source,
      sourceKind: modulation.env,
      target: this.masterGain.gain,
      range,
      base: modulation.value,
      amplitude: modulation.amplitude,
    });
  }

  /** Resolve an AudioEngine-owned source (Lorenz) for an instrument modulation. */
  getGlobalModulationSource(id: ModulationSource): Tone.ToneAudioNode | null {
    const spec = getModulationSource(id);
    if (!this.lorenz || spec?.scope !== 'global' || spec.kind !== 'lorenz' || !spec.axis) return null;
    return this.lorenz[spec.axis] ?? null;
  }

  /** Latest [-1, 1] value of a global (engine-owned) modulation source, for display probes. */
  getGlobalModulationValue(id: ModulationSource): number {
    const spec = getModulationSource(id);
    if (!this.lorenz || spec?.kind !== 'lorenz' || !spec.axis) return 0;
    return this.lorenz.getSignal(spec.axis);
  }

  /** Load the worklet and create the shared Lorenz attractor exactly once. */
  private async ensureLorenz(): Promise<void> {
    if (this._lorenz) return;
    this._lorenz = await Lorenz.create();
    for (const inst of this.instruments) inst.refreshModulationSources();
    this.refreshMasterModulation();
  }

  /** Resume the audio context (must be called from a user gesture). */
  async resume(): Promise<void> {
    await Tone.start();
    await this.ensureLorenz();
  }
}

/**
 * BPM-driven scheduler that plays a Tone.Sequence on the shared Transport.
 * The sequence itself is defined elsewhere (see pattern.ts) so it can use
 * Tone's event notation; this class just attaches and starts/stops it.
 */
export class ChaoticTransport {
  readonly engine: AudioEngine;
  bpm: number;
  running = false;
  private seq: Tone.Sequence<any> | null = null;

  constructor(engine: AudioEngine, { bpm = 120 }: { bpm?: number } = {}) {
    this.engine = engine;
    this.bpm = bpm;
    Tone.getTransport().bpm.value = bpm;
  }

  /** Attach the note sequence that the transport plays (loops forever). */
  setSequence(seq: Tone.Sequence<any>): void {
    this.seq = seq;
    seq.loop = true;
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
    Tone.getTransport().bpm.value = bpm;
  }

  start(): void {
    if (this.running || !this.seq) return;
    this.seq.start(0);
    Tone.getTransport().start();
    this.running = true;
  }

  stop(): void {
    Tone.getTransport().stop();
    this.seq?.stop();
    this.running = false;
  }
}
