/**
 * Procedural Web Audio Engine Sound Synthesizer
 * Simulates starter cranking, harmonic cylinder pulses, mechanical cam noise,
 * turbo spool, blow-off valve, rev limiter spark cut, and exhaust pops.
 */

class EngineSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;

  // Oscillators and nodes for engine rumble
  private fundamentalOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private camNoiseNode: AudioNode | null = null;
  private turboWhistleOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  private engineFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;

  private cylinderCount: number = 8;
  private isLimiterHitting: boolean = false;
  private lastRpm: number = 800;

  private isMuted: boolean = false;
  private currentVolume: number = 0.75;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public playStarterClick() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public start(cylinderCount: number, idleRpm: number) {
    this.initContext();
    if (!this.ctx) return;
    if (this.isRunning) return;

    this.cylinderCount = cylinderCount;
    this.isRunning = true;
    const now = this.ctx.currentTime;

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, now);
    this.masterGain.connect(this.ctx.destination);

    // Engine Filter - shapes exhaust tone
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(550, now);
    this.engineFilter.Q.setValueAtTime(2.5, now);

    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.setValueAtTime(0.01, now);
    this.rumbleGain.gain.linearRampToValueAtTime(0.45, now + 0.6); // Crank & catch fire ramp

    this.engineFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.masterGain);

    // Fundamental Firing Frequency = (RPM / 60) * (cylinders / 2)
    const baseFreq = (idleRpm / 60) * (this.cylinderCount / 2);

    // 1. Fundamental firing pulse (sawtooth provides rich harmonics)
    this.fundamentalOsc = this.ctx.createOscillator();
    this.fundamentalOsc.type = 'sawtooth';
    this.fundamentalOsc.frequency.setValueAtTime(baseFreq * 0.5, now);
    this.fundamentalOsc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.45);
    this.fundamentalOsc.connect(this.engineFilter);
    this.fundamentalOsc.start(now);

    // 2. Sub-bass cylinder thump (triangle wave)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'triangle';
    this.subOsc.frequency.setValueAtTime(baseFreq * 0.5, now);
    this.subOsc.connect(this.engineFilter);
    this.subOsc.start(now);

    // 3. Higher mechanical harmonic (triangle/sine)
    this.harmonicOsc = this.ctx.createOscillator();
    this.harmonicOsc.type = 'sine';
    this.harmonicOsc.frequency.setValueAtTime(baseFreq * 2.0, now);
    this.harmonicOsc.connect(this.engineFilter);
    this.harmonicOsc.start(now);

    // 4. Turbo whine setup
    this.turboWhistleOsc = this.ctx.createOscillator();
    this.turboWhistleOsc.type = 'sine';
    this.turboWhistleOsc.frequency.setValueAtTime(800, now);
    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0, now);
    this.turboWhistleOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);
    this.turboWhistleOsc.start(now);

    // Cranking starter burst sound
    this.triggerCrankStarter();
  }

  private triggerCrankStarter() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Cranking click pulses
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.1;
      const starterOsc = this.ctx.createOscillator();
      const starterG = this.ctx.createGain();
      starterOsc.type = 'sawtooth';
      starterOsc.frequency.setValueAtTime(90, t);
      starterOsc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
      starterG.gain.setValueAtTime(0.35, t);
      starterG.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      starterOsc.connect(starterG);
      starterG.connect(this.masterGain!);
      starterOsc.start(t);
      starterOsc.stop(t + 0.09);
    }
  }

  public updateRpm(rpm: number, redlineRpm: number, hasTurbo: boolean, boostBar: number = 0) {
    if (!this.isRunning || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Firing frequency formula: (RPM / 60) * (Cylinders / 2)
    // For V8 at 800 RPM: (800 / 60) * 4 = 53.3 Hz
    // For V8 at 7000 RPM: (7000 / 60) * 4 = 466.6 Hz
    const firingFreq = (rpm / 60) * (this.cylinderCount / 2);

    if (this.fundamentalOsc && this.subOsc && this.harmonicOsc) {
      this.fundamentalOsc.frequency.setTargetAtTime(firingFreq, now, 0.03);
      this.subOsc.frequency.setTargetAtTime(firingFreq * 0.5, now, 0.03);
      this.harmonicOsc.frequency.setTargetAtTime(firingFreq * 2.0, now, 0.03);
    }

    // Filter cutoff opens up as RPM rises (louder, raspier exhaust)
    if (this.engineFilter) {
      const targetFilter = 400 + Math.pow(rpm / redlineRpm, 1.3) * 2600;
      this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.04);
    }

    // Turbo whistle
    if (this.turboWhistleOsc && this.turboGain) {
      if (hasTurbo && boostBar > 0.1) {
        const turboPitch = 1200 + boostBar * 1800 + (rpm / redlineRpm) * 1200;
        this.turboWhistleOsc.frequency.setTargetAtTime(turboPitch, now, 0.05);
        this.turboGain.gain.setTargetAtTime(Math.min(0.2, boostBar * 0.08), now, 0.05);
      } else {
        this.turboGain.gain.setTargetAtTime(0, now, 0.08);
      }
    }

    // Rev Limiter Bouncing Check ("tatata")
    if (rpm >= redlineRpm - 40) {
      if (!this.isLimiterHitting) {
        this.isLimiterHitting = true;
        this.triggerLimiterCut();
      }
    } else {
      this.isLimiterHitting = false;
    }

    // Check throttle lift-off for pop & bang
    if (this.lastRpm > 4500 && rpm < this.lastRpm - 800) {
      this.triggerBackfirePop();
      if (hasTurbo && boostBar > 0.4) {
        this.triggerBlowOffSurge();
      }
    }

    this.lastRpm = rpm;
  }

  private triggerLimiterCut() {
    if (!this.ctx || !this.rumbleGain) return;
    const now = this.ctx.currentTime;
    // Fast stutter cut
    this.rumbleGain.gain.setValueAtTime(0.05, now);
    this.rumbleGain.gain.setValueAtTime(0.55, now + 0.04);
    this.rumbleGain.gain.setValueAtTime(0.05, now + 0.08);
    this.rumbleGain.gain.setValueAtTime(0.5, now + 0.12);

    // Bang sound
    this.triggerBackfirePop();
  }

  public triggerBackfirePop() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.09);

    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public triggerBlowOffSurge() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    // Compressor flutter / whoosh
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.3);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    // Flutter modulation
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.35);
  }

  public stop() {
    if (!this.isRunning || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.rumbleGain) {
      this.rumbleGain.gain.setValueAtTime(this.rumbleGain.gain.value, now);
      this.rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    }
    setTimeout(() => {
      try {
        this.fundamentalOsc?.stop();
        this.subOsc?.stop();
        this.harmonicOsc?.stop();
        this.turboWhistleOsc?.stop();
        this.fundamentalOsc?.disconnect();
        this.subOsc?.disconnect();
        this.harmonicOsc?.disconnect();
        this.turboWhistleOsc?.disconnect();
        this.masterGain?.disconnect();
      } catch {
        // no-op
      }
      this.isRunning = false;
      this.fundamentalOsc = null;
      this.subOsc = null;
      this.harmonicOsc = null;
      this.turboWhistleOsc = null;
    }, 450);
  }
}

export const engineSound = new EngineSoundSynthesizer();
