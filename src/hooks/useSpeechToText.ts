import { useState, useEffect, useRef, useCallback } from 'react';
import { QuizOptionKeyEnum } from '../games/types/GameEnums';

// Type declaration for browser Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
  webkitAudioContext?: typeof AudioContext;
}

export interface CustomAnswerMatcher {
  option: QuizOptionKeyEnum | string;
  keywords: string[];
}

export interface UseSpeechToTextOptions {
  /** Language tag, defaults to 'vi-VN' */
  lang?: string;
  /** Keep listening continuously without stopping after single phrase */
  continuous?: boolean;
  /** Return interim streaming results */
  interimResults?: boolean;
  /** Automatically restart speech recognition if it stops while isListening is active */
  autoRestart?: boolean;
  /** Custom candidate answers or option texts to match against spoken speech */
  customAnswerMatchers?: CustomAnswerMatcher[];
  /** Callback fired whenever any recognized speech updates */
  onTranscriptChange?: (transcript: string, isFinal: boolean) => void;
  /** Callback fired when a quiz answer (e.g. A, B, C, D) is recognized from speech */
  onAnswerDetected?: (option: QuizOptionKeyEnum, rawTranscript: string, confidence: number) => void;
  /** Callback fired on speech error */
  onError?: (errorMessage: string, rawError?: any) => void;
  /** Enable audio level volume analysis (0 - 100) */
  enableAudioLevel?: boolean;
}

export interface UseSpeechToTextReturn {
  /** Whether microphone is currently active and listening */
  isListening: boolean;
  /** Whether browser supports Web Speech API */
  isSupported: boolean;
  /** Permission state: true = granted, false = denied, null = not requested yet */
  hasPermission: boolean | null;
  /** Complete full transcript recognized so far */
  transcript: string;
  /** Interim (streaming) transcript for current utterance */
  interimTranscript: string;
  /** Final confirmed transcript of the last completed phrase */
  finalTranscript: string;
  /** Detected quiz option ('A' | 'B' | 'C' | 'D' | null) */
  detectedOption: QuizOptionKeyEnum | null;
  /** Recognition confidence score (0 to 1) */
  confidence: number;
  /** Real-time microphone audio level (0 - 100) for visual feedback / equalizer */
  audioLevel: number;
  /** Error message if any occurred */
  error: string | null;
  /** Start listening for student speech */
  startListening: () => Promise<boolean>;
  /** Stop listening */
  stopListening: () => void;
  /** Clear transcript and detected option */
  resetTranscript: () => void;
  /** Toggle listening state */
  toggleListening: () => Promise<boolean>;
}

/**
 * Intelligent phonetic parsing for Vietnamese & English spoken answers:
 * - A: "a", "ây", "ay", "ei", "chọn a", "đáp án a", "câu a", "phương án a"
 * - B: "b", "bê", "bi", "bee", "chọn b", "đáp án b", "câu b", "phương án b"
 * - C: "c", "xê", "xi", "si", "chọn c", "đáp án c", "câu c", "phương án c"
 * - D: "d", "đ", "dê", "đi", "đê", "chọn d", "đáp án d", "câu d", "phương án d"
 */
export function parseSpokenTextToOption(
  rawTranscript: string,
  customMatchers?: CustomAnswerMatcher[]
): { option: QuizOptionKeyEnum | null; matchedPhrase?: string } {
  if (!rawTranscript) return { option: null };
  const text = rawTranscript.toLowerCase().trim();
  if (!text) return { option: null };

  // 1. Check custom matchers first if provided (matching full phrases, e.g. "tam giác đều", "180 độ")
  if (customMatchers && customMatchers.length > 0) {
    for (const matcher of customMatchers) {
      for (const kw of matcher.keywords) {
        const cleanKw = kw.toLowerCase().trim();
        if (cleanKw && text.includes(cleanKw)) {
          const optEnum =
            matcher.option === 'A'
              ? QuizOptionKeyEnum.A
              : matcher.option === 'B'
              ? QuizOptionKeyEnum.B
              : matcher.option === 'C'
              ? QuizOptionKeyEnum.C
              : matcher.option === 'D'
              ? QuizOptionKeyEnum.D
              : null;
          if (optEnum) {
            return { option: optEnum, matchedPhrase: cleanKw };
          }
        }
      }
    }
  }

  // 2. Standard Vietnamese & English multiple-choice regex patterns
  // Pattern A
  const patternA =
    /\b(a|ây|ay|ei|chọn a|đáp án a|câu a|phương án a|ý a|option a|chữ a|chọn ây|đáp án ây|câu ây)\b/i;
  // Pattern B
  const patternB =
    /\b(b|bê|bi|bee|bị|bì|chọn b|đáp án b|câu b|phương án b|ý b|option b|chữ b|chọn bê|chọn bi|đáp án bê|đáp án bi|câu bê|câu bi)\b/i;
  // Pattern C
  const patternC =
    /\b(c|xê|xi|si|cê|see|sea|xe|chọn c|đáp án c|câu c|phương án c|ý c|option c|chữ c|chọn xê|chọn xi|đáp án xê|đáp án xi|câu xê|câu xi)\b/i;
  // Pattern D
  const patternD =
    /\b(d|đ|dê|đi|di|đê|dee|đề|dè|chọn d|chọn đ|đáp án d|đáp án đ|câu d|câu đ|phương án d|ý d|option d|chữ d|chữ đ|chọn dê|chọn đi|đáp án dê|đáp án đi|câu dê|câu đi)\b/i;

  // Exact matches or end-of-string phrases
  if (
    patternA.test(text) ||
    text === 'a' ||
    text === 'ây' ||
    text === 'ay' ||
    text.endsWith(' a') ||
    text.endsWith(' ây')
  ) {
    return { option: QuizOptionKeyEnum.A };
  }

  if (
    patternB.test(text) ||
    text === 'b' ||
    text === 'bê' ||
    text === 'bi' ||
    text.endsWith(' b') ||
    text.endsWith(' bê') ||
    text.endsWith(' bi')
  ) {
    return { option: QuizOptionKeyEnum.B };
  }

  if (
    patternC.test(text) ||
    text === 'c' ||
    text === 'xê' ||
    text === 'xi' ||
    text.endsWith(' c') ||
    text.endsWith(' xê') ||
    text.endsWith(' xi')
  ) {
    return { option: QuizOptionKeyEnum.C };
  }

  if (
    patternD.test(text) ||
    text === 'd' ||
    text === 'đ' ||
    text === 'dê' ||
    text === 'đi' ||
    text === 'đê' ||
    text.endsWith(' d') ||
    text.endsWith(' đ') ||
    text.endsWith(' dê') ||
    text.endsWith(' đi')
  ) {
    return { option: QuizOptionKeyEnum.D };
  }

  return { option: null };
}

/**
 * Custom React hook for speech-to-text input in educational quizzes & presentations.
 * Allows students to speak answers (A, B, C, D or custom phrases) using their microphone.
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const {
    lang = 'vi-VN',
    continuous = true,
    interimResults = true,
    autoRestart = true,
    customAnswerMatchers,
    onTranscriptChange,
    onAnswerDetected,
    onError,
    enableAudioLevel = true,
  } = options;

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [detectedOption, setDetectedOption] = useState<QuizOptionKeyEnum | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // References to keep callbacks current without retriggering effect listeners
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const shouldKeepListeningRef = useRef<boolean>(false);
  const restartTimerRef = useRef<any>(null);

  const onTranscriptChangeRef = useRef(onTranscriptChange);
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  const onAnswerDetectedRef = useRef(onAnswerDetected);
  useEffect(() => {
    onAnswerDetectedRef.current = onAnswerDetected;
  }, [onAnswerDetected]);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const customAnswerMatchersRef = useRef(customAnswerMatchers);
  useEffect(() => {
    customAnswerMatchersRef.current = customAnswerMatchers;
  }, [customAnswerMatchers]);

  // Audio analysis variables
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize SpeechRecognition instance on mount
  useEffect(() => {
    const win = typeof window !== 'undefined' ? (window as unknown as IWindow) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      setIsSupported(true);
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = lang;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          isListeningRef.current = true;
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';
          let latestConfidence = 0.9;

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const resultItem = event.results[i];
            const transcriptText = resultItem[0]?.transcript || '';
            latestConfidence = resultItem[0]?.confidence || 0.9;

            if (resultItem.isFinal) {
              currentFinal += transcriptText;
            } else {
              currentInterim += transcriptText;
            }
          }

          const combined = (currentFinal || currentInterim).trim();
          setInterimTranscript(currentInterim);
          if (currentFinal) {
            setFinalTranscript((prev) => (prev ? `${prev} ${currentFinal}` : currentFinal).trim());
          }
          if (combined) {
            setTranscript(combined);
            setConfidence(latestConfidence);

            if (onTranscriptChangeRef.current) {
              onTranscriptChangeRef.current(combined, !!currentFinal);
            }

            // Check if student spoke an answer (A, B, C, D)
            const parseResult = parseSpokenTextToOption(combined, customAnswerMatchersRef.current);
            if (parseResult.option) {
              setDetectedOption(parseResult.option);
              if (onAnswerDetectedRef.current) {
                onAnswerDetectedRef.current(parseResult.option, combined, latestConfidence);
              }
            }
          }
        };

        recognition.onerror = (event: any) => {
          const rawErr = event.error;
          // 'no-speech' and 'aborted' are benign interruptions in continuous classroom environments
          if (rawErr === 'no-speech' || rawErr === 'aborted') {
            return;
          }

          let friendlyMessage = 'Đã xảy ra lỗi khi nhận diện giọng nói.';
          if (rawErr === 'not-allowed' || rawErr === 'service-not-allowed') {
            friendlyMessage = 'Vui lòng cấp quyền truy cập Micro trên trình duyệt để sử dụng tính năng trả lời bằng giọng nói.';
            setHasPermission(false);
          } else if (rawErr === 'network') {
            friendlyMessage = 'Lỗi kết nối mạng khi xử lý giọng nói.';
          }

          setError(friendlyMessage);
          if (onErrorRef.current) {
            onErrorRef.current(friendlyMessage, rawErr);
          }
        };

        recognition.onend = () => {
          isListeningRef.current = false;

          // Seamless auto-restart if user still wants to listen (Chrome/Edge auto-stops after silence)
          if (shouldKeepListeningRef.current && autoRestart) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (shouldKeepListeningRef.current && recognitionRef.current && !isListeningRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  // Ignore if already active
                }
              }
            }, 150);
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      shouldKeepListeningRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [lang, continuous, interimResults, autoRestart]);

  // Clean up audio analyzer resources
  const stopAudioLevelMeter = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Start real-time audio volume analysis for visual feedback
  const startAudioLevelMeter = useCallback(async () => {
    if (!enableAudioLevel || typeof window === 'undefined') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setHasPermission(true);

      const win = window as unknown as IWindow;
      const AudioCtx = window.AudioContext || win.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (!shouldKeepListeningRef.current || !analyserRef.current) {
          setAudioLevel(0);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize to roughly 0 - 100
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch (err: any) {
      console.warn('Audio meter initialization notice:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setHasPermission(false);
      }
    }
  }, [enableAudioLevel]);

  // Start listening
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!recognitionRef.current) {
      setError('Trình duyệt chưa hỗ trợ Web Speech API.');
      return false;
    }

    try {
      setError(null);
      shouldKeepListeningRef.current = true;

      // Start audio analysis meter in parallel
      if (enableAudioLevel) {
        startAudioLevelMeter();
      }

      if (!isListeningRef.current) {
        recognitionRef.current.start();
      }
      setIsListening(true);
      return true;
    } catch (e: any) {
      // If already started, that is fine
      if (e?.name !== 'InvalidStateError') {
        setError('Không thể khởi động Micro.');
      }
      return false;
    }
  }, [enableAudioLevel, startAudioLevelMeter]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    isListeningRef.current = false;
    setIsListening(false);
    stopAudioLevelMeter();
  }, [stopAudioLevelMeter]);

  // Reset transcript and answers
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setDetectedOption(null);
    setConfidence(0);
  }, []);

  // Toggle listening
  const toggleListening = useCallback(async (): Promise<boolean> => {
    if (isListening) {
      stopListening();
      return false;
    } else {
      return await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopAudioLevelMeter();
    };
  }, [stopListening, stopAudioLevelMeter]);

  return {
    isListening,
    isSupported,
    hasPermission,
    transcript,
    interimTranscript,
    finalTranscript,
    detectedOption,
    confidence,
    audioLevel,
    error,
    startListening,
    stopListening,
    resetTranscript,
    toggleListening,
  };
}
