// CIVORA Original Orchestral Sound Engine
// Procedural Web Audio API soundscape designed specifically for CIVORA's 5-scene cinematic reveal.
// Zero external mp3 dependencies, completely original orchestral synthesis.

export class CivoraIntroSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private isInitialized: boolean = false;

  constructor() {
    // Lazy initialized on first user gesture or invocation
  }

  public init() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isInitialized = true;
    } catch (e) {
      // Audio fallback safe
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : 0.65,
        this.ctx.currentTime,
        0.05
      );
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // ================= SCENE 1 (0–2s): The Age Before Civilisation =================
  // Low subterranean drone, distant cinematic wind, distant metallic resonance
  public playScene1() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Sub-bass atmospheric drone (38.8Hz D0 & 73.4Hz D1)
      const droneOsc1 = this.ctx.createOscillator();
      const droneOsc2 = this.ctx.createOscillator();
      const droneGain = this.ctx.createGain();
      droneOsc1.type = 'sine';
      droneOsc1.frequency.setValueAtTime(38.89, now);
      droneOsc2.type = 'triangle';
      droneOsc2.frequency.setValueAtTime(73.42, now);

      droneGain.gain.setValueAtTime(0.001, now);
      droneGain.gain.linearRampToValueAtTime(0.25, now + 1.2);

      droneOsc1.connect(droneGain);
      droneOsc2.connect(droneGain);
      droneGain.connect(this.masterGain);

      droneOsc1.start(now);
      droneOsc2.start(now);
      this.activeNodes.push(droneOsc1, droneOsc2, droneGain);

      // 2. Distant cinematic wind resonance (filtered white noise)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(80, now);
      windFilter.frequency.linearRampToValueAtTime(140, now + 2);

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.01, now);
      windGain.gain.linearRampToValueAtTime(0.09, now + 1.5);

      whiteNoise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.masterGain);

      whiteNoise.start(now);
      this.activeNodes.push(whiteNoise, windFilter, windGain);

      // 3. Single distant metallic resonance ping (antique bronze bell)
      const bellOsc = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(587.33, now + 0.6); // D5
      bellGain.gain.setValueAtTime(0.001, now);
      bellGain.gain.setValueAtTime(0.08, now + 0.6);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      bellOsc.connect(bellGain);
      bellGain.connect(this.masterGain);

      bellOsc.start(now + 0.6);
      bellOsc.stop(now + 2.6);
    } catch (e) {}
  }

  // ================= SCENE 2 (2–4s): The Ancient Gates =================
  // Deep stone movement rumble, cinematic low brass, powerful orchestral swell
  public playScene2() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Tectonic stone grinding movement (sub-frequency sweep)
      const stoneOsc = this.ctx.createOscillator();
      const stoneGain = this.ctx.createGain();
      stoneOsc.type = 'sawtooth';
      stoneOsc.frequency.setValueAtTime(45, now);
      stoneOsc.frequency.linearRampToValueAtTime(65, now + 1.2);
      stoneOsc.frequency.linearRampToValueAtTime(32, now + 2.2);

      stoneGain.gain.setValueAtTime(0.01, now);
      stoneGain.gain.linearRampToValueAtTime(0.24, now + 0.6);
      stoneGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      stoneOsc.connect(stoneGain);
      stoneGain.connect(this.masterGain);

      stoneOsc.start(now);
      stoneOsc.stop(now + 2.5);

      // 2. Low orchestral brass swell (D2: 73.42Hz, A2: 110Hz, D3: 146.83Hz)
      const brassTones = [73.42, 110.0, 146.83];
      brassTones.forEach((freq) => {
        const bOsc = this.ctx!.createOscillator();
        const bGain = this.ctx!.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(freq, now + 0.2);
        bGain.gain.setValueAtTime(0.001, now);
        bGain.gain.linearRampToValueAtTime(0.12, now + 1.4);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

        bOsc.connect(bGain);
        bGain.connect(this.masterGain!);

        bOsc.start(now + 0.2);
        bOsc.stop(now + 2.9);
      });
    } catch (e) {}
  }

  // ================= SCENE 3 (4–7s): The Emblem Forging =================
  // Rising strings progression, French horns rising theme, war drum / timpani impact at emblem reveal
  public playScene3() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Rising strings progression (Dm -> Gm -> A)
      const stringChords = [
        { time: 0, notes: [146.83, 174.61, 220.0] }, // Dm (D3, F3, A3)
        { time: 1.2, notes: [196.0, 233.08, 293.66] }, // Gm (G3, Bb3, D4)
        { time: 2.2, notes: [220.0, 277.18, 329.63] }, // A maj (A3, C#4, E4)
      ];

      stringChords.forEach((chord) => {
        chord.notes.forEach((freq) => {
          const sOsc = this.ctx!.createOscillator();
          const sGain = this.ctx!.createGain();
          sOsc.type = 'triangle';
          sOsc.frequency.setValueAtTime(freq, now + chord.time);
          sGain.gain.setValueAtTime(0.001, now + chord.time);
          sGain.gain.linearRampToValueAtTime(0.09, now + chord.time + 0.4);
          sGain.gain.exponentialRampToValueAtTime(0.001, now + chord.time + 1.6);

          sOsc.connect(sGain);
          sGain.connect(this.masterGain!);

          sOsc.start(now + chord.time);
          sOsc.stop(now + chord.time + 1.7);
        });
      });

      // 2. Warm French horns rising motif (D3 -> A3 -> D4 -> F#4)
      const hornNotes = [146.83, 220.0, 293.66, 369.99];
      hornNotes.forEach((freq, idx) => {
        const hOsc = this.ctx!.createOscillator();
        const hGain = this.ctx!.createGain();
        hOsc.type = 'sawtooth';
        hOsc.frequency.setValueAtTime(freq, now + 0.4 + idx * 0.45);

        const hornFilter = this.ctx!.createBiquadFilter();
        hornFilter.type = 'lowpass';
        hornFilter.frequency.setValueAtTime(650, now);

        hGain.gain.setValueAtTime(0.001, now + 0.4 + idx * 0.45);
        hGain.gain.linearRampToValueAtTime(0.08, now + 0.4 + idx * 0.45 + 0.2);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + idx * 0.45 + 1.1);

        hOsc.connect(hornFilter);
        hornFilter.connect(hGain);
        hGain.connect(this.masterGain!);

        hOsc.start(now + 0.4 + idx * 0.45);
        hOsc.stop(now + 0.4 + idx * 0.45 + 1.2);
      });

      // 3. Orchestral Timpani / War Drum Impact (at ~5.6s of total intro)
      const impactTime = now + 1.6;
      const timpaniOsc = this.ctx.createOscillator();
      const timpaniGain = this.ctx.createGain();
      timpaniOsc.type = 'sine';
      timpaniOsc.frequency.setValueAtTime(135, impactTime);
      timpaniOsc.frequency.exponentialRampToValueAtTime(36, impactTime + 0.45);

      timpaniGain.gain.setValueAtTime(0.38, impactTime);
      timpaniGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.9);

      timpaniOsc.connect(timpaniGain);
      timpaniGain.connect(this.masterGain);

      timpaniOsc.start(impactTime);
      timpaniOsc.stop(impactTime + 0.95);
    } catch (e) {}
  }

  // ================= SCENE 4 (7–9s): The Name of a Civilisation =================
  // Heroic climax: Choir formant vocal pad + royal trumpet triad + radiant shimmer
  public playScene4() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Triumphant Sovereign Chord (D major royal octave: D3, A3, D4, F#4)
      const climaxChord = [146.83, 220.0, 293.66, 369.99, 440.0];
      climaxChord.forEach((freq, idx) => {
        const cOsc = this.ctx!.createOscillator();
        const cGain = this.ctx!.createGain();
        cOsc.type = 'triangle';
        cOsc.frequency.setValueAtTime(freq, now);

        cGain.gain.setValueAtTime(0.001, now);
        cGain.gain.linearRampToValueAtTime(0.12 / (idx * 0.3 + 1), now + 0.3);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        cOsc.connect(cGain);
        cGain.connect(this.masterGain!);

        cOsc.start(now);
        cOsc.stop(now + 2.3);
      });

      // 2. Choir-like ethereal formant texture (human "Ahhh" vowel filter at 750Hz)
      const choirOsc = this.ctx.createOscillator();
      const choirFilter = this.ctx.createBiquadFilter();
      const choirGain = this.ctx.createGain();

      choirOsc.type = 'sawtooth';
      choirOsc.frequency.setValueAtTime(293.66, now); // D4

      choirFilter.type = 'bandpass';
      choirFilter.frequency.setValueAtTime(750, now);
      choirFilter.Q.setValueAtTime(4.0, now);

      choirGain.gain.setValueAtTime(0.001, now);
      choirGain.gain.linearRampToValueAtTime(0.07, now + 0.4);
      choirGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      choirOsc.connect(choirFilter);
      choirFilter.connect(choirGain);
      choirGain.connect(this.masterGain);

      choirOsc.start(now);
      choirOsc.stop(now + 2.1);

      // 3. Radiant compass star shimmer (sparkling harmonics: 1174Hz, 1479Hz, 1760Hz)
      const shimmers = [1174.66, 1479.98, 1760.0];
      shimmers.forEach((freq, i) => {
        const sOsc = this.ctx!.createOscillator();
        const sGain = this.ctx!.createGain();
        sOsc.type = 'sine';
        sOsc.frequency.setValueAtTime(freq, now + 0.2 + i * 0.1);

        sGain.gain.setValueAtTime(0.04, now + 0.2 + i * 0.1);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.1 + 0.8);

        sOsc.connect(sGain);
        sGain.connect(this.masterGain!);

        sOsc.start(now + 0.2 + i * 0.1);
        sOsc.stop(now + 0.2 + i * 0.1 + 0.85);
      });
    } catch (e) {}
  }

  // ================= SCENE 5 (9–12s): Transition into the World =================
  // Music resolves into majestic atmospheric passage that gently flows into the landing page
  public playScene5() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    try {
      // Gentle warm resolved chord: D3, F#3, A3, D4 with smooth 2.5s fade
      const resolveNotes = [146.83, 184.99, 220.0, 293.66];
      resolveNotes.forEach((freq) => {
        const rOsc = this.ctx!.createOscillator();
        const rGain = this.ctx!.createGain();
        rOsc.type = 'sine';
        rOsc.frequency.setValueAtTime(freq, now);

        rGain.gain.setValueAtTime(0.08, now);
        rGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

        rOsc.connect(rGain);
        rGain.connect(this.masterGain!);

        rOsc.start(now);
        rOsc.stop(now + 2.9);
      });
    } catch (e) {}
  }

  // Stop & Clean Up
  public stop() {
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      } catch (e) {}
    }
  }
}

export const introSoundEngine = new CivoraIntroSoundEngine();

