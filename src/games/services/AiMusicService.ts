// Audio service for AI-generated music and Web Audio synthesizer

export interface MusicComposition {
  title: string;
  tempo: number;
  scale?: string;
  mood?: string;
  melody: Array<{ note: string; duration: number; time: number }>;
  chords?: Array<{ chord: string[]; duration: number; time: number }>;
}

const NOTE_FREQUENCIES: Record<string, number> = {
  C3: 130.81, 'C#3': 138.59, D3: 146.83, 'D#3': 155.56, E3: 164.81, F3: 174.61, 'F#3': 185.0, G3: 196.0, 'G#3': 207.65, A3: 220.0, 'A#3': 233.08, B3: 246.94,
  C4: 261.63, 'C#4': 277.18, D4: 293.66, 'D#4': 311.13, E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.0, 'G#4': 415.3, A4: 440.0, 'A#4': 466.16, B4: 493.88,
  C5: 523.25, 'C#5': 554.37, D5: 587.33, 'D#5': 622.25, E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99, 'G#5': 830.61, A5: 880.0, 'A#5': 932.33, B5: 987.77,
  C6: 1046.5,
};

class AiMusicPlayer {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private activeTimeouts: NodeJS.Timeout[] = [];

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playBlobAudio(base64Data: string, mimeType: string = 'audio/wav'): HTMLAudioElement {
    this.stop();
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const audioUrl = URL.createObjectURL(blob);

    const audio = new Audio(audioUrl);
    this.currentAudioElement = audio;
    this.isPlaying = true;

    audio.play().catch((err) => console.warn('Audio autoplay prevented:', err));
    audio.onended = () => {
      this.isPlaying = false;
    };
    return audio;
  }

  public playComposition(comp: MusicComposition, loop: boolean = false) {
    this.stop();
    const ctx = this.getAudioContext();
    this.isPlaying = true;

    const beatDuration = 60 / (comp.tempo || 120);

    const playLoop = () => {
      if (!this.isPlaying) return;

      let maxEndTime = 0;

      // Play Chords
      if (comp.chords) {
        comp.chords.forEach((c) => {
          const startTime = ctx.currentTime + c.time * beatDuration;
          const dur = c.duration * beatDuration;
          if (c.time * beatDuration + dur > maxEndTime) {
            maxEndTime = c.time * beatDuration + dur;
          }

          c.chord.forEach((noteName) => {
            const freq = NOTE_FREQUENCIES[noteName] || 220;
            this.playTone(ctx, freq, startTime, dur, 'triangle', 0.08);
          });
        });
      }

      // Play Melody
      if (comp.melody) {
        comp.melody.forEach((m) => {
          const startTime = ctx.currentTime + m.time * beatDuration;
          const dur = m.duration * beatDuration;
          if (m.time * beatDuration + dur > maxEndTime) {
            maxEndTime = m.time * beatDuration + dur;
          }

          const freq = NOTE_FREQUENCIES[m.note] || 440;
          this.playTone(ctx, freq, startTime, dur, 'sine', 0.15);
        });
      }

      if (loop && maxEndTime > 0) {
        const timer = setTimeout(() => {
          if (this.isPlaying) {
            playLoop();
          }
        }, maxEndTime * 1000);
        this.activeTimeouts.push(timer);
      } else if (!loop && maxEndTime > 0) {
        const timer = setTimeout(() => {
          this.isPlaying = false;
        }, maxEndTime * 1000);
        this.activeTimeouts.push(timer);
      }
    };

    playLoop();
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    maxGain: number = 0.1
  ) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Envelope: attack -> decay -> sustain -> release
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(maxGain * 0.7, startTime + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch (e) {
      console.warn('Tone play error:', e);
    }
  }

  public stop() {
    this.isPlaying = false;
    this.activeTimeouts.forEach((t) => clearTimeout(t));
    this.activeTimeouts = [];

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const aiMusicPlayer = new AiMusicPlayer();
