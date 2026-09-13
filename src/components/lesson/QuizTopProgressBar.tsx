import React from 'react';
import { Trophy, Sparkles, CheckCircle2, Award, Zap, HelpCircle } from 'lucide-react';
import { fireCelebrationConfetti } from '../../utils/confetti';

export interface QuizTopProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  isFinished?: boolean;
  quizTitle?: string;
  className?: string;
  onExit?: () => void;
  showDetails?: boolean;
}

export const QuizTopProgressBar: React.FC<QuizTopProgressBarProps> = ({
  currentQuestion,
  totalQuestions,
  isFinished = false,
  quizTitle,
  className = '',
  onExit,
  showDetails = true,
}) => {
  const safeTotal = Math.max(totalQuestions, 1);
  const safeCurrent = isFinished ? safeTotal : Math.min(Math.max(currentQuestion, 1), safeTotal);
  const progressPercent = Math.min(Math.round((safeCurrent / safeTotal) * 100), 100);

  return (
    <div
      id="quiz-top-progress-container"
      className={`w-full bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/30 px-4 py-2.5 sm:px-6 sm:py-3 transition-all duration-300 z-40 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top Info Row */}
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Left: Question status & badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            {isFinished ? (
              <div
                id="quiz-status-finished-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Hoàn thành tất cả câu hỏi!</span>
              </div>
            ) : (
              <div
                id="quiz-status-active-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-extrabold text-xs shadow-[0_0_10px_rgba(6,182,212,0.25)]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="tracking-wide">
                  Câu hỏi <strong className="text-white text-sm">{safeCurrent}</strong> / {safeTotal}
                </span>
              </div>
            )}

            {quizTitle && (
              <span className="hidden md:inline-block text-slate-400 truncate max-w-[220px] text-xs font-medium border-l border-slate-700/80 pl-2.5">
                {quizTitle}
              </span>
            )}
          </div>

          {/* Right: Percentage & Celebratory Confetti Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isFinished && (
              <button
                id="btn-retrigger-confetti"
                type="button"
                onClick={() => fireCelebrationConfetti()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Bắn pháo hoa ăn mừng lần nữa"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bắn pháo hoa 🎉</span>
              </button>
            )}

            <div
              id="quiz-progress-percentage-pill"
              className={`font-mono font-bold px-2.5 py-0.5 rounded-lg text-xs border ${
                isFinished
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-cyan-300 border-slate-700'
              }`}
            >
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Middle: Progress Bar Track */}
        <div className="relative w-full h-2.5 sm:h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
          <div
            id="quiz-progress-fill-bar"
            className={`h-full rounded-full transition-all duration-500 ease-out relative ${
              isFinished
                ? 'bg-gradient-to-r from-teal-400 via-emerald-400 to-green-500 shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          >
            {/* Shimmer light effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_infinite]" />
          </div>
        </div>

        {/* Bottom: Question Step Indicator Dots (when total <= 25) */}
        {showDetails && safeTotal <= 25 && (
          <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 pt-0.5 justify-between overflow-x-auto pb-0.5">
            {Array.from({ length: safeTotal }).map((_, idx) => {
              const qNum = idx + 1;
              const isPast = isFinished || qNum < safeCurrent;
              const isCurrent = !isFinished && qNum === safeCurrent;

              return (
                <div
                  key={idx}
                  className={`flex-1 h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                    isPast
                      ? 'bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                      : isCurrent
                      ? 'bg-cyan-400 ring-2 ring-cyan-400/40 animate-pulse'
                      : 'bg-slate-800/80'
                  }`}
                  title={`Câu ${qNum}${isPast ? ' (Đã làm)' : isCurrent ? ' (Đang làm)' : ''}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
