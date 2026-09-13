import { QuizOptionKeyEnum } from '../types/GameEnums';

// Type declaration for browser SpeechRecognition
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export type SpeechCallback = (result: {
  detectedOption: QuizOptionKeyEnum | null;
  transcript: string;
  confidence: number;
}) => void;

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isActuallyRunning: boolean = false;
  private restartTimeout: any = null;
  private onResultCallback: SpeechCallback | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStateChangeCallback: ((isListening: boolean) => void) | null = null;

  constructor() {
    const win = typeof window !== 'undefined' ? (window as unknown as IWindow) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = 'vi-VN';

        this.recognition.onstart = () => {
          this.isActuallyRunning = true;
          if (this.onStateChangeCallback) {
            this.onStateChangeCallback(true);
          }
        };

        this.recognition.onresult = (event: any) => {
          let latestTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            latestTranscript += event.results[i][0].transcript;
          }

          const parsedOption = this.parseTranscriptToOption(latestTranscript);
          if (this.onResultCallback) {
            this.onResultCallback({
              detectedOption: parsedOption,
              transcript: latestTranscript.trim(),
              confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.9,
            });
          }
        };

        this.recognition.onerror = (event: any) => {
          // 'no-speech' and 'aborted' are normal in continuous speech flows
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            if (this.onErrorCallback) {
              this.onErrorCallback(event.error);
            }
          }
        };

        this.recognition.onend = () => {
          this.isActuallyRunning = false;

          // In Chrome/Edge, speech recognition stops after silence or utterance.
          // If we are in intentional isListening mode, keep the UI state as listening
          // and seamlessly restart behind the scenes without flickering the UI icon.
          if (this.isListening) {
            if (this.restartTimeout) clearTimeout(this.restartTimeout);
            this.restartTimeout = setTimeout(() => {
              if (this.isListening && this.recognition && !this.isActuallyRunning) {
                try {
                  this.recognition.start();
                } catch (e) {
                  // If already running or resetting, safely ignore
                  console.debug('Recognition restart notice:', e);
                }
              }
            }, 100);
          } else {
            if (this.onStateChangeCallback) {
              this.onStateChangeCallback(false);
            }
          }
        };
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public setOnStateChange(cb: (isListening: boolean) => void): void {
    this.onStateChangeCallback = cb;
  }

  public startListening(onResult: SpeechCallback, onError?: (err: string) => void): boolean {
    if (!this.recognition) return false;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.isListening = true;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(true);
    }

    if (!this.isActuallyRunning) {
      try {
        this.recognition.start();
      } catch (e) {
        // If recognition is already started, ignore error
      }
    }
    return true;
  }

  public stopListening(): void {
    this.isListening = false;
    this.onResultCallback = null;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition && this.isActuallyRunning) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isActuallyRunning = false;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  /**
   * Translates spoken phrase into option A, B, C, or D
   * Rules:
   * A: "a" hoặc "ây" (hoặc "chọn a", "đáp án a", "câu a")
   * B: "bê" hoặc "bi" (hoặc "chọn b", "đáp án b", "câu b")
   * C: "xê" hoặc "xi" (hoặc "chọn c", "đáp án c", "câu c")
   * D: "dê" hoặc "đi" / "đê" (hoặc "chọn d", "đáp án d", "câu d")
   */
  public parseTranscriptToOption(transcript: string): QuizOptionKeyEnum | null {
    if (!transcript) return null;
    const raw = transcript.toLowerCase().trim();
    if (!raw) return null;

    // Check A: a, ây, ay, chọn a, đáp án a, câu a, option a, chữ a, ây ây
    if (
      /\b(a|ây|ay|ei|chọn a|đáp án a|câu a|phương án a|option a|chữ a|chọn ây|đáp án ây|câu ây)\b/i.test(raw) ||
      raw.endsWith(' a') ||
      raw.endsWith(' ây') ||
      raw.endsWith(' ay') ||
      raw === 'a' ||
      raw === 'ây' ||
      raw === 'ay'
    ) {
      return QuizOptionKeyEnum.A;
    }

    // Check B: b, bê, bi, bee, chọn b, đáp án b, câu b, phương án b, option b, chữ b, đáp án bi, đáp án bê
    if (
      /\b(b|bê|bi|bee|bị|bì|bè|chọn b|đáp án b|câu b|phương án b|option b|chữ b|chọn bê|chọn bi|đáp án bê|đáp án bi|câu bê|câu bi)\b/i.test(raw) ||
      raw.endsWith(' b') ||
      raw.endsWith(' bê') ||
      raw.endsWith(' bi') ||
      raw === 'b' ||
      raw === 'bê' ||
      raw === 'bi'
    ) {
      return QuizOptionKeyEnum.B;
    }

    // Check C: c, xê, xi, si, cê, see, sea, xe, chọn c, đáp án c, câu c, phương án c, option c, chữ c, chọn xê, chọn xi, đáp án xê, đáp án xi
    if (
      /\b(c|xê|xi|si|cê|see|sea|xe|chọn c|đáp án c|câu c|phương án c|option c|chữ c|chọn xê|chọn xi|đáp án xê|đáp án xi|câu xê|câu xi)\b/i.test(raw) ||
      raw.endsWith(' c') ||
      raw.endsWith(' xê') ||
      raw.endsWith(' xi') ||
      raw === 'c' ||
      raw === 'xê' ||
      raw === 'xi'
    ) {
      return QuizOptionKeyEnum.C;
    }

    // Check D: d, đ, dê, đi, di, đê, dee, đề, chọn d, chọn đ, đáp án d, đáp án đ, câu d, câu đ, phương án d, option d, chữ d, chọn dê, chọn đi, đáp án dê, đáp án đi
    if (
      /\b(d|đ|dê|đi|di|đê|dee|đề|dè|chọn d|chọn đ|đáp án d|đáp án đ|câu d|câu đ|phương án d|option d|chữ d|chữ đ|chọn dê|chọn đi|đáp án dê|đáp án đi|câu dê|câu đi)\b/i.test(raw) ||
      raw.endsWith(' d') ||
      raw.endsWith(' đ') ||
      raw.endsWith(' dê') ||
      raw.endsWith(' đi') ||
      raw.endsWith(' đê') ||
      raw === 'd' ||
      raw === 'đ' ||
      raw === 'dê' ||
      raw === 'đi' ||
      raw === 'đê'
    ) {
      return QuizOptionKeyEnum.D;
    }

    return null;
  }
}

