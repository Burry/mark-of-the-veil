import type { GameSettings } from '../types/GameTypes';
import { clamp01, deriveAdaptiveAudioMix, deterministicUnit } from './audioMath';
import type { AudioEvent, AudioSpatialPosition, FeedbackSettingsSource } from './types';

const SILENCE = 0.0001;

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

interface LegacyAudioListener {
  setPosition?: (x: number, y: number, z: number) => void;
  setOrientation?: (
    forwardX: number,
    forwardY: number,
    forwardZ: number,
    upX: number,
    upY: number,
    upZ: number,
  ) => void;
}

interface ToneOptions {
  at?: number;
  frequency: number;
  endFrequency?: number;
  duration: number;
  attack?: number;
  gain: number;
  type?: OscillatorType;
  detune?: number;
  filterHz?: number;
  position?: AudioSpatialPosition;
}

interface NoiseOptions {
  at?: number;
  duration: number;
  attack?: number;
  gain: number;
  filterType?: BiquadFilterType;
  filterHz?: number;
  q?: number;
  position?: AudioSpatialPosition;
  seed?: number;
}

function audioContextConstructor(): AudioContextConstructor | null {
  const scope = globalThis as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

function setAudioParam(
  parameter: AudioParam,
  value: number,
  at: number,
  timeConstant = 0.03,
): void {
  parameter.cancelScheduledValues(at);
  parameter.setTargetAtTime(value, at, timeConstant);
}

export class AudioDirector {
  private settings: GameSettings;
  private readonly settingsGetter: (() => GameSettings) | null;
  private context: AudioContext | null = null;
  private masterBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private effectsBus: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private reverbGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private droneGain: GainNode | null = null;
  private choirGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private startPromise: Promise<void> | null = null;
  private nextBeatAt = 0;
  private beat = 0;
  private intensity = 0.18;
  private paused = false;
  private disposed = false;

  constructor(settings: FeedbackSettingsSource) {
    this.settingsGetter = typeof settings === 'function' ? settings : null;
    this.settings = typeof settings === 'function' ? settings() : settings;
  }

  async start(): Promise<void> {
    if (this.disposed) return;

    if (this.context) {
      await this.resumeContext();
      return;
    }

    if (!this.startPromise) {
      this.startPromise = this.initialize().finally(() => {
        this.startPromise = null;
      });
    }
    await this.startPromise;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    this.applyMix(settings);
  }

  setIntensity(intensity: number): void {
    this.intensity = clamp01(intensity);
    this.applyMix(this.currentSettings());
  }

  play(event: AudioEvent, position?: AudioSpatialPosition): void {
    const context = this.context;
    if (
      this.disposed ||
      this.paused ||
      !context ||
      context.state !== 'running' ||
      !this.effectsBus
    ) {
      return;
    }

    this.applyMix(this.currentSettings());
    const now = context.currentTime + 0.006;

    switch (event) {
      case 'shot':
        this.noise({
          at: now,
          duration: 0.075,
          gain: 0.19,
          filterType: 'highpass',
          filterHz: 850,
          position,
          seed: this.beat + 11,
        });
        this.tone({
          at: now,
          frequency: 150,
          endFrequency: 54,
          duration: 0.11,
          gain: 0.22,
          type: 'sawtooth',
          filterHz: 1_100,
          position,
        });
        this.tone({
          at: now,
          frequency: 1_850,
          endFrequency: 920,
          duration: 0.035,
          gain: 0.055,
          type: 'square',
          position,
        });
        break;
      case 'hit':
        this.tone({
          at: now,
          frequency: 280,
          endFrequency: 108,
          duration: 0.09,
          gain: 0.18,
          type: 'triangle',
          position,
        });
        this.noise({
          at: now,
          duration: 0.06,
          gain: 0.12,
          filterType: 'bandpass',
          filterHz: 1_700,
          q: 0.8,
          position,
          seed: this.beat + 23,
        });
        break;
      case 'critical':
        this.tone({
          at: now,
          frequency: 760,
          endFrequency: 1_360,
          duration: 0.2,
          gain: 0.16,
          type: 'sine',
          position,
        });
        this.tone({
          at: now + 0.045,
          frequency: 1_140,
          endFrequency: 1_880,
          duration: 0.22,
          gain: 0.1,
          type: 'sine',
          position,
        });
        this.noise({
          at: now,
          duration: 0.12,
          gain: 0.14,
          filterType: 'highpass',
          filterHz: 2_200,
          position,
          seed: this.beat + 37,
        });
        break;
      case 'reload':
        for (const [index, delay] of [0, 0.16, 0.39].entries()) {
          this.tone({
            at: now + delay,
            frequency: 1_150 + index * 280,
            endFrequency: 540,
            duration: 0.055,
            gain: 0.09,
            type: 'square',
            filterHz: 2_800,
            position,
          });
          this.noise({
            at: now + delay,
            duration: 0.035,
            gain: 0.05,
            filterType: 'highpass',
            filterHz: 1_900,
            position,
            seed: this.beat + index + 41,
          });
        }
        break;
      case 'dash':
        this.noise({
          at: now,
          duration: 0.32,
          attack: 0.035,
          gain: 0.23,
          filterType: 'bandpass',
          filterHz: 720,
          q: 0.55,
          position,
          seed: this.beat + 53,
        });
        this.tone({
          at: now,
          frequency: 96,
          endFrequency: 42,
          duration: 0.28,
          attack: 0.035,
          gain: 0.2,
          type: 'sine',
          position,
        });
        break;
      case 'pulse':
        this.tone({
          at: now,
          frequency: 58,
          endFrequency: 31,
          duration: 0.62,
          attack: 0.012,
          gain: 0.34,
          type: 'sine',
          position,
        });
        this.tone({
          at: now + 0.02,
          frequency: 280,
          endFrequency: 1_120,
          duration: 0.42,
          attack: 0.08,
          gain: 0.16,
          type: 'sawtooth',
          filterHz: 1_450,
          position,
        });
        this.noise({
          at: now + 0.04,
          duration: 0.46,
          attack: 0.06,
          gain: 0.18,
          filterType: 'lowpass',
          filterHz: 1_800,
          position,
          seed: this.beat + 67,
        });
        break;
      case 'playerDamage':
        this.noise({
          at: now,
          duration: 0.28,
          gain: 0.28,
          filterType: 'bandpass',
          filterHz: 430,
          q: 0.7,
          position,
          seed: this.beat + 71,
        });
        this.tone({
          at: now,
          frequency: 82,
          endFrequency: 38,
          duration: 0.32,
          gain: 0.32,
          type: 'sawtooth',
          filterHz: 520,
          position,
        });
        break;
      case 'enemyAttack':
        this.tone({
          at: now,
          frequency: 116,
          endFrequency: 57,
          duration: 0.3,
          attack: 0.06,
          gain: 0.22,
          type: 'sawtooth',
          filterHz: 720,
          position,
        });
        this.noise({
          at: now,
          duration: 0.26,
          attack: 0.05,
          gain: 0.13,
          filterType: 'bandpass',
          filterHz: 640,
          q: 1.4,
          position,
          seed: this.beat + 83,
        });
        break;
      case 'enemyDeath':
        this.tone({
          at: now,
          frequency: 190,
          endFrequency: 34,
          duration: 0.42,
          gain: 0.24,
          type: 'triangle',
          position,
        });
        this.noise({
          at: now + 0.03,
          duration: 0.34,
          gain: 0.16,
          filterType: 'lowpass',
          filterHz: 1_200,
          position,
          seed: this.beat + 97,
        });
        break;
      case 'seal':
        [196, 293.66, 440, 587.33].forEach((frequency, index) => {
          this.tone({
            at: now + index * 0.075,
            frequency,
            endFrequency: frequency * 2,
            duration: 0.88,
            attack: 0.11,
            gain: 0.11,
            type: 'sine',
            position,
          });
        });
        this.noise({
          at: now,
          duration: 0.72,
          attack: 0.18,
          gain: 0.14,
          filterType: 'highpass',
          filterHz: 2_600,
          position,
          seed: this.beat + 101,
        });
        break;
      case 'boss':
        this.tone({
          at: now,
          frequency: 46,
          endFrequency: 29,
          duration: 1.25,
          attack: 0.13,
          gain: 0.4,
          type: 'sawtooth',
          filterHz: 310,
          position,
        });
        this.tone({
          at: now + 0.16,
          frequency: 69,
          endFrequency: 41,
          duration: 1.1,
          attack: 0.18,
          gain: 0.2,
          type: 'triangle',
          position,
        });
        this.noise({
          at: now,
          duration: 0.9,
          attack: 0.12,
          gain: 0.2,
          filterType: 'lowpass',
          filterHz: 680,
          position,
          seed: this.beat + 113,
        });
        break;
      case 'victory':
        [55, 82.41, 123.47, 185, 277.18].forEach((frequency, index) => {
          this.tone({
            at: now + index * 0.18,
            frequency,
            endFrequency: frequency * (index % 2 === 0 ? 1.018 : 0.982),
            duration: 3.8 - index * 0.24,
            attack: 0.38,
            gain: 0.1,
            type: index % 2 ? 'triangle' : 'sine',
            filterHz: 1_800 + index * 620,
          });
        });
        [1_173.66, 1_244.51, 1_318.51].forEach((frequency, index) => {
          this.tone({
            at: now + 0.85 + index * 0.075,
            frequency,
            endFrequency: frequency * 0.48,
            duration: 2.1,
            attack: 0.28,
            gain: 0.035,
            type: 'sine',
            filterHz: 3_800,
          });
        });
        this.noise({
          at: now,
          duration: 4.2,
          attack: 0.72,
          gain: 0.075,
          filterType: 'bandpass',
          filterHz: 420,
          seed: this.beat + 211,
        });
        break;
      case 'defeat':
        [146.83, 123.47, 92.5, 73.42].forEach((frequency, index) => {
          this.tone({
            at: now + index * 0.18,
            frequency,
            endFrequency: frequency * 0.72,
            duration: 0.72,
            attack: 0.06,
            gain: 0.13,
            type: 'triangle',
          });
        });
        break;
      case 'ui':
        this.tone({
          at: now,
          frequency: 690,
          endFrequency: 860,
          duration: 0.045,
          gain: 0.045,
          type: 'sine',
        });
        break;
    }
  }

  setListener(
    position: AudioSpatialPosition,
    forward: AudioSpatialPosition = { x: 0, y: 0, z: -1 },
    up: AudioSpatialPosition = { x: 0, y: 1, z: 0 },
  ): void {
    const context = this.context;
    if (!context) return;
    const listener = context.listener;
    const now = context.currentTime;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(position.x, now);
      listener.positionY.setValueAtTime(position.y, now);
      listener.positionZ.setValueAtTime(position.z, now);
      listener.forwardX.setValueAtTime(forward.x, now);
      listener.forwardY.setValueAtTime(forward.y, now);
      listener.forwardZ.setValueAtTime(forward.z, now);
      listener.upX.setValueAtTime(up.x, now);
      listener.upY.setValueAtTime(up.y, now);
      listener.upZ.setValueAtTime(up.z, now);
    } else {
      const legacyListener = listener as unknown as LegacyAudioListener;
      legacyListener.setPosition?.(position.x, position.y, position.z);
      legacyListener.setOrientation?.(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  pause(): void {
    if (this.disposed || this.paused) return;
    this.paused = true;
    if (this.context?.state === 'running') void this.context.suspend().catch(() => undefined);
  }

  async resume(): Promise<void> {
    if (this.disposed) return;
    this.paused = false;
    await this.start();
    await this.resumeContext();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.paused = true;
    if (this.scheduler !== null) clearInterval(this.scheduler);
    this.scheduler = null;

    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // A scheduled source may already have stopped.
      }
      try {
        source.disconnect();
      } catch {
        // Ignore browser cleanup races.
      }
    }
    this.activeSources.clear();

    for (const node of [
      this.droneGain,
      this.choirGain,
      this.musicFilter,
      this.musicBus,
      this.effectsBus,
      this.ambienceBus,
      this.reverbGain,
      this.reverb,
      this.masterBus,
    ]) {
      try {
        node?.disconnect();
      } catch {
        // Nodes can already be disconnected after a context failure.
      }
    }

    const context = this.context;
    this.context = null;
    this.masterBus = null;
    this.musicBus = null;
    this.effectsBus = null;
    this.ambienceBus = null;
    this.reverbGain = null;
    this.reverb = null;
    this.droneGain = null;
    this.choirGain = null;
    this.musicFilter = null;
    this.noiseBuffer = null;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }

  private async initialize(): Promise<void> {
    const AudioContextClass = audioContextConstructor();
    if (!AudioContextClass || this.disposed) return;

    let context: AudioContext;
    try {
      context = new AudioContextClass({ latencyHint: 'interactive' });
      this.context = context;
      this.createGraph(context);
      this.createSoundscape(context);
      this.applyMix(this.currentSettings());
      this.nextBeatAt = context.currentTime + 0.08;
      this.scheduler = setInterval(() => this.scheduleMusic(), 100);
    } catch {
      this.disposeFailedInitialization();
      return;
    }

    await this.resumeContext();
  }

  private createGraph(context: AudioContext): void {
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const music = context.createGain();
    const effects = context.createGain();
    const ambience = context.createGain();
    const reverbGain = context.createGain();
    const reverb = context.createConvolver();
    const musicFilter = context.createBiquadFilter();
    const drone = context.createGain();
    const choir = context.createGain();

    compressor.threshold.value = -10;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    musicFilter.type = 'lowpass';
    musicFilter.Q.value = 0.55;
    reverb.buffer = this.createImpulseResponse(context, 2.25, 2.7, 0x7665696c);

    drone.connect(musicFilter);
    choir.connect(musicFilter);
    musicFilter.connect(music);
    music.connect(master);
    effects.connect(master);
    ambience.connect(master);
    music.connect(reverb);
    effects.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(master);
    master.connect(compressor);
    compressor.connect(context.destination);

    this.masterBus = master;
    this.musicBus = music;
    this.effectsBus = effects;
    this.ambienceBus = ambience;
    this.reverbGain = reverbGain;
    this.reverb = reverb;
    this.musicFilter = musicFilter;
    this.droneGain = drone;
    this.choirGain = choir;
    this.noiseBuffer = this.createNoiseBuffer(context, 2.4, 0x6d61726b);
  }

  private createSoundscape(context: AudioContext): void {
    if (!this.droneGain || !this.choirGain || !this.ambienceBus || !this.noiseBuffer) return;

    [36.71, 55, 73.42].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 1 ? -7 : index === 2 ? 5 : 0;
      voiceGain.gain.value = [0.44, 0.2, 0.12][index] ?? 0.1;
      oscillator.connect(voiceGain);
      voiceGain.connect(this.droneGain as GainNode);
      this.trackSource(oscillator, [voiceGain]);
      oscillator.start();
    });

    [110, 146.83, 164.81, 220].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const formant = context.createBiquadFilter();
      const voiceGain = context.createGain();
      oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = [-11, 7, -4, 13][index] ?? 0;
      formant.type = 'bandpass';
      formant.frequency.value = index % 2 === 0 ? 740 : 1_150;
      formant.Q.value = 1.15;
      voiceGain.gain.value = 0.24;
      oscillator.connect(formant);
      formant.connect(voiceGain);
      voiceGain.connect(this.choirGain as GainNode);
      this.trackSource(oscillator, [formant, voiceGain]);
      oscillator.start();
    });

    const wind = context.createBufferSource();
    const windFilter = context.createBiquadFilter();
    const windGain = context.createGain();
    wind.buffer = this.noiseBuffer;
    wind.loop = true;
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 310;
    windFilter.Q.value = 0.32;
    windGain.gain.value = 0.16;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambienceBus);
    this.trackSource(wind, [windFilter, windGain]);
    wind.start(0, 0.37);

    const machinery = context.createOscillator();
    const machineryGain = context.createGain();
    machinery.type = 'sine';
    machinery.frequency.value = 28;
    machineryGain.gain.value = 0.1;
    machinery.connect(machineryGain);
    machineryGain.connect(this.ambienceBus);
    this.trackSource(machinery, [machineryGain]);
    machinery.start();
  }

  private scheduleMusic(): void {
    const context = this.context;
    if (this.disposed || this.paused || !context || context.state !== 'running' || !this.musicBus) {
      return;
    }

    const mix = deriveAdaptiveAudioMix(this.currentSettings(), this.intensity);
    const beatDuration = 60 / mix.tempo;
    if (this.nextBeatAt < context.currentTime - beatDuration)
      this.nextBeatAt = context.currentTime + 0.04;

    while (this.nextBeatAt < context.currentTime + 0.28) {
      const accent = this.beat % 4 === 0;
      if (accent || this.intensity > 0.58) this.percussion(this.nextBeatAt, accent, mix.percussion);

      if (this.intensity > 0.38 && this.beat % 2 === 1) {
        const pitch = 880 + deterministicUnit(this.beat + 331) * 360;
        this.musicNoise(this.nextBeatAt, 0.026, 0.035 + this.intensity * 0.03, pitch);
      }

      this.beat += 1;
      this.nextBeatAt += beatDuration * (this.intensity > 0.72 ? 0.5 : 1);
    }
  }

  private percussion(at: number, accent: boolean, level: number): void {
    const context = this.context;
    const destination = this.musicBus;
    if (!context || !destination) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(accent ? 76 : 104, at);
    oscillator.frequency.exponentialRampToValueAtTime(accent ? 34 : 58, at + 0.16);
    gain.gain.setValueAtTime(SILENCE, at);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(SILENCE, level * (accent ? 0.42 : 0.2)),
      at + 0.006,
    );
    gain.gain.exponentialRampToValueAtTime(SILENCE, at + (accent ? 0.3 : 0.16));
    oscillator.connect(gain);
    gain.connect(destination);
    this.trackSource(oscillator, [gain]);
    oscillator.start(at);
    oscillator.stop(at + 0.34);
  }

  private musicNoise(at: number, duration: number, gainAmount: number, frequency: number): void {
    const context = this.context;
    const destination = this.musicBus;
    if (!context || !destination || !this.noiseBuffer) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(Math.max(SILENCE, gainAmount), at);
    gain.gain.exponentialRampToValueAtTime(SILENCE, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    this.trackSource(source, [filter, gain]);
    source.start(at, deterministicUnit(this.beat + 401) * 1.6, duration);
  }

  private tone(options: ToneOptions): void {
    const context = this.context;
    const destination = this.effectsBus;
    if (!context || !destination) return;
    const at = options.at ?? context.currentTime;
    const end = at + options.duration;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const cleanup: AudioNode[] = [envelope];
    let output: AudioNode = oscillator;

    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(Math.max(1, options.frequency), at);
    if (options.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), end);
    }
    oscillator.detune.value = options.detune ?? 0;

    if (options.filterHz) {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = options.filterHz;
      filter.Q.value = 0.8;
      oscillator.connect(filter);
      output = filter;
      cleanup.push(filter);
    }

    output.connect(envelope);
    this.applyEnvelope(envelope.gain, at, end, options.attack ?? 0.004, options.gain);
    this.connectOutput(envelope, destination, options.position, cleanup);
    this.trackSource(oscillator, cleanup);
    oscillator.start(at);
    oscillator.stop(end + 0.025);
  }

  private noise(options: NoiseOptions): void {
    const context = this.context;
    const destination = this.effectsBus;
    if (!context || !destination || !this.noiseBuffer) return;
    const at = options.at ?? context.currentTime;
    const end = at + options.duration;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const cleanup: AudioNode[] = [filter, envelope];
    source.buffer = this.noiseBuffer;
    filter.type = options.filterType ?? 'bandpass';
    filter.frequency.value = options.filterHz ?? 900;
    filter.Q.value = options.q ?? 0.7;
    source.connect(filter);
    filter.connect(envelope);
    this.applyEnvelope(envelope.gain, at, end, options.attack ?? 0.004, options.gain);
    this.connectOutput(envelope, destination, options.position, cleanup);
    this.trackSource(source, cleanup);
    const offset = deterministicUnit(options.seed ?? this.beat + 503) * 1.5;
    source.start(at, offset, options.duration + 0.012);
  }

  private connectOutput(
    output: AudioNode,
    destination: AudioNode,
    position: AudioSpatialPosition | undefined,
    cleanup: AudioNode[],
  ): void {
    if (!position || !this.context) {
      output.connect(destination);
      return;
    }

    const panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1.5;
    panner.maxDistance = 85;
    panner.rolloffFactor = 1.25;
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;
    output.connect(panner);
    panner.connect(destination);
    cleanup.push(panner);
  }

  private applyEnvelope(
    parameter: AudioParam,
    at: number,
    end: number,
    attack: number,
    gain: number,
  ): void {
    const peak = Math.max(SILENCE, gain);
    const attackEnd = Math.min(end - 0.002, at + Math.max(0.001, attack));
    parameter.setValueAtTime(SILENCE, at);
    parameter.exponentialRampToValueAtTime(peak, attackEnd);
    parameter.exponentialRampToValueAtTime(SILENCE, end);
  }

  private applyMix(settings: GameSettings): void {
    const context = this.context;
    if (!context) return;
    const mix = deriveAdaptiveAudioMix(settings, this.intensity);
    const now = context.currentTime;
    if (this.masterBus) setAudioParam(this.masterBus.gain, mix.master, now);
    if (this.musicBus) setAudioParam(this.musicBus.gain, mix.music, now);
    if (this.effectsBus) setAudioParam(this.effectsBus.gain, mix.effects, now);
    if (this.ambienceBus) setAudioParam(this.ambienceBus.gain, mix.ambience, now);
    if (this.reverbGain) setAudioParam(this.reverbGain.gain, mix.reverb, now, 0.12);
    if (this.droneGain) setAudioParam(this.droneGain.gain, mix.drone, now, 0.18);
    if (this.choirGain) setAudioParam(this.choirGain.gain, mix.choir, now, 0.25);
    if (this.musicFilter) setAudioParam(this.musicFilter.frequency, mix.musicFilterHz, now, 0.22);
  }

  private currentSettings(): GameSettings {
    if (!this.settingsGetter) return this.settings;
    try {
      return this.settingsGetter();
    } catch {
      return this.settings;
    }
  }

  private async resumeContext(): Promise<void> {
    const context = this.context;
    if (!context || this.disposed || this.paused || context.state === 'closed') return;
    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        // Browsers may reject until the next explicit user gesture; resume() can be retried safely.
      }
    }
  }

  private trackSource(source: AudioScheduledSourceNode, cleanupNodes: AudioNode[]): void {
    this.activeSources.add(source);
    source.addEventListener(
      'ended',
      () => {
        this.activeSources.delete(source);
        try {
          source.disconnect();
        } catch {
          // Ignore browser cleanup races.
        }
        for (const node of cleanupNodes) {
          try {
            node.disconnect();
          } catch {
            // Ignore browser cleanup races.
          }
        }
      },
      { once: true },
    );
  }

  private createNoiseBuffer(context: AudioContext, seconds: number, seed: number): AudioBuffer {
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let state = seed >>> 0;
    let brown = 0;
    for (let index = 0; index < length; index += 1) {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      const white = (state / 0xffffffff) * 2 - 1;
      brown = (brown + white * 0.055) / 1.045;
      channel[index] = Math.max(-1, Math.min(1, white * 0.58 + brown * 0.85));
    }
    return buffer;
  }

  private createImpulseResponse(
    context: AudioContext,
    seconds: number,
    decay: number,
    seed: number,
  ): AudioBuffer {
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channelIndex = 0; channelIndex < impulse.numberOfChannels; channelIndex += 1) {
      const channel = impulse.getChannelData(channelIndex);
      let state = (seed + channelIndex * 0x9e3779b9) >>> 0;
      for (let sampleIndex = 0; sampleIndex < length; sampleIndex += 1) {
        state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
        const noise = (state / 0xffffffff) * 2 - 1;
        const envelope = (1 - sampleIndex / length) ** decay;
        channel[sampleIndex] = noise * envelope;
      }
    }
    return impulse;
  }

  private disposeFailedInitialization(): void {
    const context = this.context;
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // The partial graph may contain an already-ended source.
      }
      try {
        source.disconnect();
      } catch {
        // Ignore cleanup errors from an incomplete browser implementation.
      }
    }
    this.activeSources.clear();
    this.context = null;
    this.masterBus = null;
    this.musicBus = null;
    this.effectsBus = null;
    this.ambienceBus = null;
    this.reverbGain = null;
    this.reverb = null;
    this.droneGain = null;
    this.choirGain = null;
    this.musicFilter = null;
    this.noiseBuffer = null;
    if (this.scheduler !== null) clearInterval(this.scheduler);
    this.scheduler = null;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }
}
