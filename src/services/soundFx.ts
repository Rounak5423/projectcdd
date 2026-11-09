// =============================================================================
// CIVORA — AAA Master Web Audio Engine
// Warm, cinematic, non-clipping analog-modeled sound synthesis
// Zero external dependencies, pure Web Audio with master compressor & limiter
// =============================================================================

class SoundFX {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;
  private lastClickTime: number = 0;

  private initContext() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // 1. Master Output Dynamics Compressor / Limiter
        // Mathematically eliminates hard digital clipping, speaker distortion, and crackles
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

        // 2. Master Warmth Low-Pass Filter
        // Cuts harsh digital aliasing over 7.5 kHz, giving rich, warm, analog acoustic presence
        this.masterFilter = this.ctx.createBiquadFilter();
        this.masterFilter.type = 'lowpass';
        this.masterFilter.frequency.setValueAtTime(7500, this.ctx.currentTime);
        this.masterFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

        // 3. Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.42, this.ctx.currentTime);

        // Audio Graph: [Effects] -> masterFilter -> compressor -> masterGain -> destination
        this.masterFilter.connect(this.compressor);
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getDestination(): AudioNode | null {
    this.initContext();
    return this.masterFilter || (this.ctx ? this.ctx.destination : null);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.42, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // ---------------------------------------------------------------------------
  // 1. Crisp, tactile, smooth UI click (Wood/Parchment tactile click)
  // Replaces harsh 600Hz triangle frequency pop with smooth marimba click
  // ---------------------------------------------------------------------------
  public playClick() {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastClickTime < 35) return; // Debounce rapid click spam
    this.lastClickTime = nowMs;

    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // Soft tactile click: gentle dual sine pop with instant exponential decay
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.024);

      // Smooth anti-pop attack and natural acoustic decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.032);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 2. Day / Turn Advance: Resonant orchestral drum + warm horn chime
  // ---------------------------------------------------------------------------
  public playTurnAdvance() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // 1. Warm felt timpani drum impact
      const drumOsc = this.ctx.createOscillator();
      const drumGain = this.ctx.createGain();
      const drumFilter = this.ctx.createBiquadFilter();

      drumFilter.type = 'lowpass';
      drumFilter.frequency.setValueAtTime(220, now);

      drumOsc.type = 'sine';
      drumOsc.frequency.setValueAtTime(120, now);
      drumOsc.frequency.exponentialRampToValueAtTime(42, now + 0.22);

      drumGain.gain.setValueAtTime(0.0001, now);
      drumGain.gain.linearRampToValueAtTime(0.24, now + 0.006);
      drumGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      drumOsc.connect(drumFilter);
      drumFilter.connect(drumGain);
      drumGain.connect(dest);
      drumOsc.start(now);
      drumOsc.stop(now + 0.3);

      // 2. Warm acoustic brass horn resonance (C4 + G4)
      [261.63, 392.0].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.04);

        gain.gain.setValueAtTime(0.0001, now + 0.04);
        gain.gain.linearRampToValueAtTime(0.07 / (i + 1), now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + 0.04);
        osc.stop(now + 0.45);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 3. Celebratory Reward & Success Claim: Crystalline glockenspiel arpeggio
  // ---------------------------------------------------------------------------
  public playRewardClaim() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const noteTime = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.36);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(noteTime);
        osc.stop(noteTime + 0.38);
      });
    } catch (e) {}
  }

  public playReward() {
    this.playRewardClaim();
  }

  public playSuccess() {
    this.playRewardClaim();
  }

  // ---------------------------------------------------------------------------
  // 4. Eureka Breakthrough: Celestial harmonic chime
  // ---------------------------------------------------------------------------
  public playEureka() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      [523.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0.0001, now + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.1 / (i + 1), now + i * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.45);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.5);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 5. Research Start: Warm resonant acoustic chord
  // Replaces harsh buzzing sawtooth
  // ---------------------------------------------------------------------------
  public playResearchStart() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      [329.63, 440.0, 659.25].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 6. Construction / Hammer: Warm stone masonry tap
  // ---------------------------------------------------------------------------
  public playHammerBuild() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // Wooden mallet on stone tap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(680, now);
      filter.Q.setValueAtTime(2.0, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 7. Error / Insufficient Funds: Soft muted marimba low dyad
  // Replaces harsh 120Hz sawtooth buzz that sounded like broken speakers
  // ---------------------------------------------------------------------------
  public playError() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // Soft muted wooden marimba clunk
      [180, 165].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 8. Imperial Gavel: Deep polished mahogany gavel strike
  // ---------------------------------------------------------------------------
  public playGavel() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // Heavy wood impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 9. Protest & Civic Chants: Soft distant civic crowd ambience
  // ---------------------------------------------------------------------------
  public playCrowdChant() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // Rhythmic distant marching cadence
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.16);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 10. Grand Carnival & Festive Cheering
  // ---------------------------------------------------------------------------
  public playCarnivalCheer() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      const fanfareNotes = [392, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6

      fanfareNotes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const noteTime = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.linearRampToValueAtTime(0.09, noteTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.32);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 11. Fireworks Detonation
  // ---------------------------------------------------------------------------
  public playFireworksExplosion() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // Soft aerial pop
      const boomOsc = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);

      boomOsc.type = 'sine';
      boomOsc.frequency.setValueAtTime(140, now);
      boomOsc.frequency.exponentialRampToValueAtTime(36, now + 0.3);

      boomGain.gain.setValueAtTime(0.0001, now);
      boomGain.gain.linearRampToValueAtTime(0.2, now + 0.008);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      boomOsc.connect(filter);
      filter.connect(boomGain);
      boomGain.connect(dest);

      boomOsc.start(now);
      boomOsc.stop(now + 0.38);
    } catch (e) {}
  }

  public playExplosion() {
    this.playFireworksExplosion();
  }

  // ---------------------------------------------------------------------------
  // 12. Heroic Overture: Cinematic imperial brass swell
  // ---------------------------------------------------------------------------
  public playHeroicOverture() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // Imperial brass chord swell: C3 (130.81), G3 (196.00), C4 (261.63), E4 (329.63)
      const chord = [130.81, 196.0, 261.63, 329.63];
      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.02);

        gain.gain.setValueAtTime(0.0001, now + 0.02);
        gain.gain.linearRampToValueAtTime(0.06 / (i + 1), now + 0.22);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + 0.02);
        osc.stop(now + 0.9);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 13. Triumphant Royal Fanfare
  // ---------------------------------------------------------------------------
  public playHeroicFanfare() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      const fanfareNotes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4, E4, G4, C5, E5

      fanfareNotes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const noteTime = now + i * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.linearRampToValueAtTime(0.09, noteTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.32);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 14. Heavy Stone Gate Rumble: Filtered cinematic sub-bass
  // ---------------------------------------------------------------------------
  public playStoneGateRumble() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {}
  }
}

export const soundFx = new SoundFX();
