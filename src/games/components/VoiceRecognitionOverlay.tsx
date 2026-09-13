import React, { useEffect, useRef } from 'react';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { Mic, MicOff, Volume2, AlertCircle, Check, RefreshCw } from 'lucide-react';

interface VoiceRecognitionOverlayProps {
  onOptionRecognized: (option: QuizOptionKeyEnum) => void;
  isLocked: boolean;
  lockedOption: QuizOptionKeyEnum | null;
  isActive: boolean;
}

export const VoiceRecognitionOverlay: React.FC<VoiceRecognitionOverlayProps> = ({
  onOptionRecognized,
  isLocked,
  lockedOption,
  isActive,
}) => {
  const onOptionRecognizedRef = useRef(onOptionRecognized);
  useEffect(() => {
    onOptionRecognizedRef.current = onOptionRecognized;
  }, [onOptionRecognized]);

  const isLockedRef = useRef(isLocked);
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  const {
    isListening,
    isSupported,
    hasPermission,
    transcript,
    audioLevel,
    error,
    startListening,
    stopListening,
  } = useSpeechToText({
    lang: 'vi-VN',
    continuous: true,
    interimResults: true,
    autoRestart: true,
    enableAudioLevel: true,
    onAnswerDetected: (option) => {
      if (!isLockedRef.current && onOptionRecognizedRef.current) {
        onOptionRecognizedRef.current(option);
      }
    },
  });

  // Manage start/stop based on isActive and isLocked
  useEffect(() => {
    if (isActive && !isLocked) {
      startListening();
    } else {
      stopListening();
    }
  }, [isActive, isLocked, startListening, stopListening]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#0A0E17] border border-[#30363D] p-6 text-white shadow-2xl flex flex-col items-center justify-center min-h-[320px] text-center">
      {/* Animated Microphone Icon with audio level visualization */}
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => {
            if (!isLocked && isActive) {
              startListening();
            }
          }}
          disabled={isLocked}
          className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
            isLocked
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105 cursor-default'
              : isListening
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 cursor-pointer'
              : 'bg-[#21262D] text-amber-400 border border-amber-500/40 hover:bg-[#30363D] cursor-pointer'
          }`}
          title={isListening ? 'Microphone đang lắng nghe' : 'Nhấn để kích hoạt lại Micro'}
        >
          {isLocked ? (
            <Check className="w-10 h-10" />
          ) : isListening ? (
            <Mic className="w-10 h-10" />
          ) : (
            <MicOff className="w-10 h-10" />
          )}
        </button>

        {/* Dynamic Voice Wave Rings scaled by audioLevel */}
        {isListening && !isLocked && (
          <>
            <div
              className="absolute inset-0 rounded-2xl border-2 border-blue-400/50 transition-transform duration-75 pointer-events-none"
              style={{
                transform: `scale(${1 + Math.min(0.45, audioLevel / 160)})`,
                opacity: Math.max(0.2, audioLevel / 100),
              }}
            />
            <div
              className="absolute -inset-2 rounded-2xl border border-blue-500/30 animate-ping pointer-events-none"
              style={{ animationDuration: '2s' }}
            />
          </>
        )}
      </div>

      {/* Voice Status Heading */}
      {isLocked ? (
        <div className="space-y-1">
          <span className="inline-block rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-mono font-bold text-emerald-400 border border-emerald-500/40 shadow-inner">
            🔒 ĐÃ KHÓA ĐÁP ÁN: {lockedOption}
          </span>
          <p className="text-xs text-gray-400">Đã ghi nhận câu trả lời qua Micro thành công!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span>{isListening ? 'Đang lắng nghe câu trả lời qua Micro...' : 'Đang kết nối Micro...'}</span>
          </h3>

          {/* Equalizer Visualizer Bars */}
          {isListening && (
            <div className="flex items-center justify-center gap-1 h-5 py-1">
              {[0.4, 0.8, 1.2, 0.9, 0.6, 1.1, 0.5].map((multiplier, idx) => {
                const barHeight = Math.max(4, Math.min(20, (audioLevel * multiplier * 0.3) + 4));
                return (
                  <div
                    key={idx}
                    className="w-1 rounded-full bg-gradient-to-t from-blue-600 to-teal-400 transition-all duration-75"
                    style={{ height: `${barHeight}px` }}
                  />
                );
              })}
            </div>
          )}

          <div className="bg-[#161B22] p-3 rounded-xl border border-[#30363D] max-w-md mx-auto space-y-1.5 text-left">
            <p className="text-xs text-gray-300 font-medium text-center">
              Học sinh nói rõ vào Micro câu trả lời theo các mẫu:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono font-medium">
              <span className="bg-blue-950/60 border border-blue-800/40 text-blue-300 py-1.5 px-2 rounded-lg text-center">
                <strong>A:</strong> "A" hoặc "Ây"
              </span>
              <span className="bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 py-1.5 px-2 rounded-lg text-center">
                <strong>B:</strong> "Bê" hoặc "Bi"
              </span>
              <span className="bg-amber-950/60 border border-amber-800/40 text-amber-300 py-1.5 px-2 rounded-lg text-center">
                <strong>C:</strong> "Xê" hoặc "Xi"
              </span>
              <span className="bg-purple-950/60 border border-purple-800/40 text-purple-300 py-1.5 px-2 rounded-lg text-center">
                <strong>D:</strong> "Dê" hoặc "Đi"
              </span>
            </div>
          </div>

          {!isListening && !isLocked && (
            <button
              onClick={() => startListening()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition mt-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Bật lại Micro
            </button>
          )}
        </div>
      )}

      {/* Live Transcript Display */}
      {transcript && !isLocked && (
        <div className="mt-3 rounded-xl bg-[#161B22] px-4 py-2 text-xs text-gray-300 border border-[#30363D] animate-in fade-in duration-150">
          Nhận diện giọng nói: <span className="font-bold text-white tracking-wide">"{transcript}"</span>
        </div>
      )}

      {/* Error / Permission notification */}
      {(error || hasPermission === false || !isSupported) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/50 max-w-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            {!isSupported
              ? 'Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng bấm chọn đáp án bằng nút bên dưới.'
              : error || 'Vui lòng cho phép quyền truy cập Micro trên trình duyệt.'}
          </span>
        </div>
      )}

      {/* Fallback Buttons */}
      <div className="mt-4 w-full max-w-xs">
        <p className="text-[11px] text-gray-400 mb-1.5">Hoặc bấm chọn đáp án trực tiếp:</p>
        <div className="grid grid-cols-4 gap-2">
          {[QuizOptionKeyEnum.A, QuizOptionKeyEnum.B, QuizOptionKeyEnum.C, QuizOptionKeyEnum.D].map(
            (opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onOptionRecognized(opt)}
                disabled={isLocked}
                className={`rounded-xl py-2 text-xs font-mono font-bold transition border ${
                  lockedOption === opt
                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-md'
                    : 'border-[#30363D] bg-[#21262D] text-gray-200 hover:bg-[#30363D] hover:text-white disabled:opacity-40'
                }`}
              >
                {opt}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
