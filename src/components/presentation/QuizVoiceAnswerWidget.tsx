import React, { useState } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSpeechQuizAnswer } from '../../hooks/useSpeechQuizAnswer';
import { QuizOptionKeyEnum } from '../../games/types/GameEnums';

interface QuizVoiceAnswerWidgetProps {
  options?: { key: string; text?: string }[];
  selectedOption: string | null;
  onSelectOption: (key: string) => void;
  disabled?: boolean;
}

export const QuizVoiceAnswerWidget: React.FC<QuizVoiceAnswerWidgetProps> = ({
  options = [],
  selectedOption,
  onSelectOption,
  disabled = false,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const formattedOptions = options.map((opt) => ({
    key: opt.key as QuizOptionKeyEnum,
    text: opt.text,
  }));

  const {
    isListening,
    isSupported,
    hasPermission,
    transcript,
    audioLevel,
    error,
    startListening,
    stopListening,
  } = useSpeechQuizAnswer({
    options: formattedOptions,
    isActive: isEnabled && !disabled && !selectedOption,
    isLocked: !!selectedOption || disabled,
    autoLock: true,
    onAnswerSubmit: (option) => {
      onSelectOption(option);
    },
  });

  const handleToggle = async () => {
    if (disabled || selectedOption) return;
    if (isEnabled) {
      setIsEnabled(false);
      stopListening();
    } else {
      setIsEnabled(true);
      await startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 p-3.5 transition-all text-xs">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled || !!selectedOption}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer active:scale-95 ${
              selectedOption
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 cursor-default'
                : isEnabled && isListening
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
            } disabled:opacity-50`}
          >
            {selectedOption ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Đã chọn: {selectedOption}</span>
              </>
            ) : isEnabled && isListening ? (
              <>
                <Mic className="w-4 h-4 text-white" />
                <span>Đang nghe Micro...</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-slate-400" />
                <span>Bật trả lời bằng giọng nói</span>
              </>
            )}
          </button>

          {/* Real-time sound wave equalizer bars */}
          {isEnabled && isListening && !selectedOption && (
            <div className="flex items-center gap-0.5 h-4 px-1.5 bg-slate-950/60 rounded-md border border-blue-500/30">
              {[0.5, 0.9, 1.3, 0.8, 1.1, 0.6].map((mult, idx) => {
                const height = Math.max(3, Math.min(16, audioLevel * mult * 0.25 + 3));
                return (
                  <div
                    key={idx}
                    className="w-1 bg-gradient-to-t from-blue-500 to-teal-300 rounded-full transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          )}

          <span className="text-slate-400 hidden sm:inline">
            {isEnabled && isListening
              ? 'Học sinh nói rõ "A", "B", "C" hoặc "D" vào Micro'
              : 'Dành cho học sinh phát biểu câu trả lời qua Micro'}
          </span>
        </div>

        {/* Live spoken phrase status */}
        {transcript && isEnabled && !selectedOption && (
          <div className="text-[11px] bg-slate-950/80 px-2.5 py-1 rounded-md text-slate-200 border border-slate-800 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Nghe được: <strong className="text-white">"{transcript}"</strong></span>
          </div>
        )}
      </div>

      {/* Permission alert */}
      {hasPermission === false && (
        <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1.5 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Vui lòng cấp quyền truy cập Micro trên trình duyệt để sử dụng tính năng trả lời bằng giọng nói.</span>
        </div>
      )}

      {error && hasPermission !== false && (
        <div className="mt-2 text-[11px] text-rose-300 flex items-center gap-1.5 bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
