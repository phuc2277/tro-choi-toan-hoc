import { useState, useCallback, useEffect, useRef } from 'react';
import { QuizOptionKeyEnum } from '../games/types/GameEnums';
import { useSpeechToText, CustomAnswerMatcher } from './useSpeechToText';

export interface QuizOptionItem {
  key: QuizOptionKeyEnum | string;
  text?: string;
}

export interface UseSpeechQuizAnswerOptions {
  /** List of current question's options (e.g. [{ key: 'A', text: 'Tam giác đều' }, ...]) */
  options?: QuizOptionItem[];
  /** Whether the quiz is currently accepting answers */
  isActive?: boolean;
  /** Whether an answer is already submitted / locked */
  isLocked?: boolean;
  /** Auto-lock the answer as soon as recognized */
  autoLock?: boolean;
  /** Callback when student answers via microphone */
  onAnswerSubmit?: (option: QuizOptionKeyEnum, transcript: string) => void;
  /** Language for recognition, default 'vi-VN' */
  lang?: string;
}

export interface UseSpeechQuizAnswerReturn {
  isListening: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  transcript: string;
  interimTranscript: string;
  selectedOption: QuizOptionKeyEnum | null;
  audioLevel: number;
  error: string | null;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  resetAnswer: () => void;
  selectOptionManually: (option: QuizOptionKeyEnum) => void;
}

/**
 * High-level React hook specifically designed for students answering quiz questions using their microphone.
 * Handles recognition of A/B/C/D and matching of option text content.
 */
export function useSpeechQuizAnswer({
  options = [],
  isActive = true,
  isLocked = false,
  autoLock = true,
  onAnswerSubmit,
  lang = 'vi-VN',
}: UseSpeechQuizAnswerOptions = {}): UseSpeechQuizAnswerReturn {
  const [selectedOption, setSelectedOption] = useState<QuizOptionKeyEnum | null>(null);

  const onAnswerSubmitRef = useRef(onAnswerSubmit);
  useEffect(() => {
    onAnswerSubmitRef.current = onAnswerSubmit;
  }, [onAnswerSubmit]);

  const isLockedRef = useRef(isLocked);
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Convert option texts into custom keywords matcher
  const customMatchers: CustomAnswerMatcher[] = options
    .filter((opt) => opt.text && opt.text.trim().length > 1)
    .map((opt) => ({
      option: opt.key as QuizOptionKeyEnum,
      keywords: [opt.text!.trim()],
    }));

  const handleAnswerDetected = useCallback(
    (option: QuizOptionKeyEnum, rawTranscript: string) => {
      if (isLockedRef.current) return;

      setSelectedOption(option);

      if (autoLock && onAnswerSubmitRef.current) {
        onAnswerSubmitRef.current(option, rawTranscript);
      }
    },
    [autoLock]
  );

  const speech = useSpeechToText({
    lang,
    continuous: true,
    interimResults: true,
    autoRestart: true,
    customAnswerMatchers: customMatchers,
    onAnswerDetected: handleAnswerDetected,
    enableAudioLevel: true,
  });

  // Automatically manage listening based on isActive & isLocked
  useEffect(() => {
    if (isActive && !isLocked) {
      speech.startListening();
    } else {
      speech.stopListening();
    }
  }, [isActive, isLocked]);

  const resetAnswer = useCallback(() => {
    setSelectedOption(null);
    speech.resetTranscript();
  }, [speech]);

  const selectOptionManually = useCallback(
    (option: QuizOptionKeyEnum) => {
      setSelectedOption(option);
      if (onAnswerSubmitRef.current) {
        onAnswerSubmitRef.current(option, 'Thao tác chọn trực tiếp');
      }
    },
    []
  );

  return {
    isListening: speech.isListening,
    isSupported: speech.isSupported,
    hasPermission: speech.hasPermission,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,
    selectedOption,
    audioLevel: speech.audioLevel,
    error: speech.error,
    startListening: speech.startListening,
    stopListening: speech.stopListening,
    resetAnswer,
    selectOptionManually,
  };
}
