// Vintage Camera Sound Generator using Web Audio API
// Generates authentic disposable camera sounds

class CameraSounds {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
  }

  init() {
    if (!this.initialized) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    }
  }

  async unlock() {
    this.init();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Audio unlock failed', error);
      }
    }
  }

  triggerHaptic(pattern) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // Mechanical shutter click sound - Sharp and crisp like a real camera
  playShutterClick() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Sharp initial click - like mirror slapping
    const bufferSize = ctx.sampleRate * 0.015;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate sharp click with quick attack
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.08));
      data[i] = (Math.random() * 2 - 1) * decay * 0.6;
    }

    const clickSource = ctx.createBufferSource();
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();

    clickFilter.type = 'bandpass';
    clickFilter.frequency.value = 2500;
    clickFilter.Q.value = 3;

    clickSource.buffer = buffer;
    clickGain.gain.setValueAtTime(0.8, now);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.015);

    clickSource.connect(clickFilter).connect(clickGain).connect(ctx.destination);
    clickSource.start(now);

    // Secondary mechanical thunk - shutter closing
    const bufferSize2 = ctx.sampleRate * 0.012;
    const buffer2 = ctx.createBuffer(1, bufferSize2, ctx.sampleRate);
    const data2 = buffer2.getChannelData(0);

    for (let i = 0; i < bufferSize2; i++) {
      const decay = Math.exp(-i / (bufferSize2 * 0.1));
      data2[i] = (Math.random() * 2 - 1) * decay * 0.4;
    }

    const thunkSource = ctx.createBufferSource();
    const thunkGain = ctx.createGain();
    const thunkFilter = ctx.createBiquadFilter();

    thunkFilter.type = 'lowpass';
    thunkFilter.frequency.value = 400;

    thunkSource.buffer = buffer2;
    thunkGain.gain.setValueAtTime(0.5, now + 0.018);
    thunkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    thunkSource.connect(thunkFilter).connect(thunkGain).connect(ctx.destination);
    thunkSource.start(now + 0.018);

    // Sharp haptic feedback
    this.triggerHaptic(40);
  }

  // Film advance/winding sound - Mechanical ratchet clicks
  playFilmAdvance() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create 5 distinct mechanical clicks for film advance
    for (let i = 0; i < 5; i++) {
      const bufferSize = ctx.sampleRate * 0.01;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate crisp mechanical click
      for (let j = 0; j < bufferSize; j++) {
        const decay = Math.exp(-j / (bufferSize * 0.15));
        data[j] = (Math.random() * 2 - 1) * decay * 0.4;
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 1800 - (i * 100);
      filter.Q.value = 2;

      source.buffer = buffer;
      gain.gain.setValueAtTime(0.35 - (i * 0.02), now + (i * 0.04));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.04) + 0.015);

      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start(now + (i * 0.04));
    }

    // Gentle haptic for winding
    this.triggerHaptic([25, 15, 25, 15, 25]);
  }

  // Flash charge sound (capacitor whine) - More realistic electrical whine
  playFlashCharge() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Main capacitor whine
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.7);
    filter.Q.value = 1.5;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.7);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
    gain.gain.setValueAtTime(0.08, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.72);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  // Flash fire sound - Sharp pop like a real flash
  playFlashFire() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create sharp flash pop
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate quick bright pop
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.08));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.value = 1500;
    filter.Q.value = 0.5;

    source.buffer = buffer;
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);

    // Sharp haptic
    this.triggerHaptic(50);
  }

  // Counter click sound - Subtle mechanical tick
  playCounterClick() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create short crisp tick
    const bufferSize = ctx.sampleRate * 0.008;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.12));
      data[i] = (Math.random() * 2 - 1) * decay * 0.3;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;

    source.buffer = buffer;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.012);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
  }

  // End of roll sound - Double mechanical thunk
  playEndOfRoll() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create two distinct mechanical thunks
    for (let i = 0; i < 2; i++) {
      const bufferSize = ctx.sampleRate * 0.025;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let j = 0; j < bufferSize; j++) {
        const decay = Math.exp(-j / (bufferSize * 0.12));
        data[j] = (Math.random() * 2 - 1) * decay * 0.6;
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.value = 350;
      filter.Q.value = 1;

      source.buffer = buffer;
      gain.gain.setValueAtTime(0.4, now + (i * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.03);

      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start(now + (i * 0.1));
    }

    // Double haptic feedback
    this.triggerHaptic([80, 60, 80]);
  }

  // Initial camera load/wind sound - Film loading mechanism
  playInitialWind() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Longer winding sequence with mechanical clicks
    for (let i = 0; i < 10; i++) {
      const bufferSize = ctx.sampleRate * 0.012;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let j = 0; j < bufferSize; j++) {
        const decay = Math.exp(-j / (bufferSize * 0.18));
        data[j] = (Math.random() * 2 - 1) * decay * 0.3;
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 1600 - (i * 80);
      filter.Q.value = 2.5;

      source.buffer = buffer;
      gain.gain.setValueAtTime(0.28 - (i * 0.01), now + (i * 0.06));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.06) + 0.02);

      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start(now + (i * 0.06));
    }
  }

  // Gallery slide advance sound - Gentle mechanical slide
  playSlideAdvance() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Soft mechanical slide click
    const bufferSize = ctx.sampleRate * 0.01;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.2));
      data[i] = (Math.random() * 2 - 1) * decay * 0.2;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.5;

    source.buffer = buffer;
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.015);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
  }
}

// Export singleton instance
export const cameraSounds = new CameraSounds();
