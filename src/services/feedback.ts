// Sound and Haptic feedback engine for LG Remote

class FeedbackService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const storedSound = localStorage.getItem('lg_remote_sound');
    if (storedSound !== null) {
      this.soundEnabled = storedSound === 'true';
    }
    const storedHaptics = localStorage.getItem('lg_remote_haptics');
    if (storedHaptics !== null) {
      this.hapticsEnabled = storedHaptics === 'true';
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('lg_remote_sound', String(enabled));
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    localStorage.setItem('lg_remote_haptics', String(enabled));
  }

  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Subtle mechanical tactile click sound
   */
  public playClick(type: 'standard' | 'power' | 'nav' | 'app' = 'standard') {
    if (this.hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'power') {
        navigator.vibrate([30, 40, 60]);
      } else if (type === 'nav') {
        navigator.vibrate(10);
      } else {
        navigator.vibrate(15);
      }
    }

    if (!this.soundEnabled) return;

    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime;

      if (type === 'power') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'nav') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'app') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else {
        // Standard mechanical button click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {
      // Audio might be blocked until user interaction
    }
  }
}

export const feedback = new FeedbackService();
