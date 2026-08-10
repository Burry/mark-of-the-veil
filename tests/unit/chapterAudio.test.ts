import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/app/defaults';
import { AudioDirector } from '../../src/game/audio/AudioDirector';
import {
  CHAPTER_AUDIO_IDS,
  CHAPTER_AUDIO_PROFILES,
  chapterBarLength,
  chapterMotifFrequency,
  chapterTempo,
  isChapterAccent,
} from '../../src/game/audio/chapterAudio';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chapter audio profiles', () => {
  it('locks one complete procedural profile to each campaign chapter', () => {
    expect(Object.keys(CHAPTER_AUDIO_PROFILES)).toEqual(CHAPTER_AUDIO_IDS);

    for (const chapterId of CHAPTER_AUDIO_IDS) {
      const profile = CHAPTER_AUDIO_PROFILES[chapterId];
      expect(profile.id).toBe(chapterId);
      expect(profile.tempo[0]).toBeGreaterThan(0);
      expect(profile.tempo[1]).toBeGreaterThan(profile.tempo[0]);
      expect(chapterBarLength(profile)).toBeGreaterThan(0);
      expect(profile.harmony.droneRatios).toHaveLength(3);
      expect(profile.harmony.choirRatios).toHaveLength(4);
      expect(profile.motif.semitones.length).toBeGreaterThan(0);
      expect(profile.ambience.noiseGain).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps tempo bounded by the authored stillness and combat values', () => {
    const orbit = CHAPTER_AUDIO_PROFILES['the-silent-orbit'];
    expect(chapterTempo(orbit, -10)).toBe(46);
    expect(chapterTempo(orbit, 0.5)).toBe(67);
    expect(chapterTempo(orbit, 10)).toBe(88);
  });

  it('resolves the Crown eleven-pulse meter as 3 + 3 + 3 + 2', () => {
    const crown = CHAPTER_AUDIO_PROFILES['crown-of-eidolon'];
    const accents = Array.from({ length: 11 }, (_, beat) => beat).filter((beat) =>
      isChapterAccent(crown, beat),
    );
    expect(chapterBarLength(crown)).toBe(11);
    expect(accents).toEqual([0, 3, 6, 9]);
    expect(isChapterAccent(crown, 11)).toBe(true);
  });

  it('authors audible rests into the final chapter motif', () => {
    const choir = CHAPTER_AUDIO_PROFILES['the-root-choir'];
    expect(chapterMotifFrequency(choir, 0)).toBeCloseTo(146.83, 2);
    expect(chapterMotifFrequency(choir, 1)).toBeCloseTo(220, 1);
    expect(chapterMotifFrequency(choir, 2)).toBeNull();
    expect(chapterMotifFrequency(choir, 6)).toBeCloseTo(146.83, 2);
  });

  it('gives every chapter a distinct tempo, meter, harmony, motif, and ambience signature', () => {
    const signatures = CHAPTER_AUDIO_IDS.map((chapterId) => {
      const profile = CHAPTER_AUDIO_PROFILES[chapterId];
      return JSON.stringify({
        tempo: profile.tempo,
        meter: profile.meter,
        root: profile.harmony.rootHz,
        detune: profile.harmony.droneDetune,
        motif: profile.motif.semitones,
        ambience: profile.ambience,
      });
    });
    expect(new Set(signatures).size).toBe(CHAPTER_AUDIO_IDS.length);
  });
});

let parameterTransitions = 0;

class FakeAudioParam {
  value = 0;

  cancelScheduledValues(): void {}

  setTargetAtTime(value: number): void {
    this.value = value;
    parameterTransitions += 1;
  }

  setValueAtTime(value: number): void {
    this.value = value;
  }

  exponentialRampToValueAtTime(value: number): void {
    this.value = value;
  }
}

class FakeAudioNode {
  connect<T>(destination: T): T {
    return destination;
  }

  disconnect(): void {}
}

class FakeScheduledSource extends FakeAudioNode {
  readonly stopTimes: Array<number | undefined> = [];
  private endedListener: EventListenerOrEventListenerObject | null = null;

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === 'ended') this.endedListener = listener;
  }

  start(): void {}

  stop(at?: number): void {
    this.stopTimes.push(at);
    if (at !== undefined || !this.endedListener) return;
    const event = new Event('ended');
    if (typeof this.endedListener === 'function') this.endedListener(event);
    else this.endedListener.handleEvent(event);
  }
}

class FakeOscillatorNode extends FakeScheduledSource {
  readonly frequency = new FakeAudioParam();
  readonly detune = new FakeAudioParam();
  type: OscillatorType = 'sine';
}

class FakeBufferSourceNode extends FakeScheduledSource {
  readonly playbackRate = new FakeAudioParam();
  buffer: AudioBuffer | null = null;
  loop = false;
}

class FakeGainNode extends FakeAudioNode {
  readonly gain = new FakeAudioParam();
}

class FakeBiquadFilterNode extends FakeAudioNode {
  readonly frequency = new FakeAudioParam();
  readonly Q = new FakeAudioParam();
  type: BiquadFilterType = 'lowpass';
}

class FakeDynamicsCompressorNode extends FakeAudioNode {
  readonly threshold = new FakeAudioParam();
  readonly knee = new FakeAudioParam();
  readonly ratio = new FakeAudioParam();
  readonly attack = new FakeAudioParam();
  readonly release = new FakeAudioParam();
}

class FakeConvolverNode extends FakeAudioNode {
  buffer: AudioBuffer | null = null;
}

class FakePannerNode extends FakeAudioNode {
  panningModel: PanningModelType = 'HRTF';
  distanceModel: DistanceModelType = 'inverse';
  refDistance = 1;
  maxDistance = 10_000;
  rolloffFactor = 1;
  readonly positionX = new FakeAudioParam();
  readonly positionY = new FakeAudioParam();
  readonly positionZ = new FakeAudioParam();
}

class FakeAudioContext {
  static latest: FakeAudioContext | null = null;

  readonly currentTime = 0.5;
  readonly sampleRate = 2_000;
  readonly destination = new FakeAudioNode();
  readonly bufferSources: FakeBufferSourceNode[] = [];
  readonly listener = {
    positionX: new FakeAudioParam(),
    positionY: new FakeAudioParam(),
    positionZ: new FakeAudioParam(),
    forwardX: new FakeAudioParam(),
    forwardY: new FakeAudioParam(),
    forwardZ: new FakeAudioParam(),
    upX: new FakeAudioParam(),
    upY: new FakeAudioParam(),
    upZ: new FakeAudioParam(),
  };
  state = 'running';

  constructor() {
    FakeAudioContext.latest = this;
  }

  createGain(): FakeGainNode {
    return new FakeGainNode();
  }

  createDynamicsCompressor(): FakeDynamicsCompressorNode {
    return new FakeDynamicsCompressorNode();
  }

  createConvolver(): FakeConvolverNode {
    return new FakeConvolverNode();
  }

  createBiquadFilter(): FakeBiquadFilterNode {
    return new FakeBiquadFilterNode();
  }

  createOscillator(): FakeOscillatorNode {
    return new FakeOscillatorNode();
  }

  createBufferSource(): FakeBufferSourceNode {
    const source = new FakeBufferSourceNode();
    this.bufferSources.push(source);
    return source;
  }

  createPanner(): FakePannerNode {
    return new FakePannerNode();
  }

  createBuffer(numberOfChannels: number, length: number): AudioBuffer {
    const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
    return {
      numberOfChannels,
      getChannelData: (channel: number) => channels[channel] as Float32Array,
    } as AudioBuffer;
  }

  async resume(): Promise<void> {
    this.state = 'running';
  }

  async suspend(): Promise<void> {
    this.state = 'suspended';
  }

  async close(): Promise<void> {
    this.state = 'closed';
  }
}

describe('AudioDirector chapter transitions', () => {
  it('crossfades ambience and glides persistent voices without rebuilding the graph', async () => {
    parameterTransitions = 0;
    FakeAudioContext.latest = null;
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('webkitAudioContext', undefined);
    const director = new AudioDirector(DEFAULT_SETTINGS);
    director.setChapter('ashes-of-home');
    await director.start();

    const context = FakeAudioContext.latest as FakeAudioContext | null;
    expect(context).not.toBeNull();
    if (!context) throw new Error('Expected fake audio context to initialize.');
    expect(context.bufferSources).toHaveLength(1);
    const firstAmbience = context.bufferSources[0];
    const transitionsBefore = parameterTransitions;

    director.setChapter('the-silent-orbit');
    expect(context.bufferSources).toHaveLength(2);
    expect(firstAmbience?.stopTimes).toEqual([context.currentTime + 1.4]);
    expect(parameterTransitions).toBeGreaterThan(transitionsBefore);

    director.setChapter('the-silent-orbit');
    expect(context.bufferSources).toHaveLength(2);

    director.setChapter('the-memory-forge');
    expect(context.bufferSources).toHaveLength(3);
    expect(() => director.dispose()).not.toThrow();
  });

  it('remains safe when chapter selection precedes an unsupported audio environment', async () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    const director = new AudioDirector(DEFAULT_SETTINGS);
    for (const chapterId of CHAPTER_AUDIO_IDS) director.setChapter(chapterId);
    await expect(director.start()).resolves.toBeUndefined();
    expect(() => director.dispose()).not.toThrow();
  });
});
