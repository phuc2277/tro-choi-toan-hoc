import React, { useState, useEffect, useMemo } from 'react';
import { QuestionItem } from '../../games/types/GestureQuiz';
import { QuizOptionKeyEnum } from '../../games/types/GameEnums';
import { MathRenderer } from '../../games/components/MathRenderer';
import { MathDiagramView } from '../../games/components/MathDiagramView';
import { fireCelebrationConfetti } from '../../utils/confetti';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Check,
  Zap,
} from 'lucide-react';

interface PracticeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  title: string;
  subject?: string;
  grade?: number;
}

export const PracticeQuizModal: React.FC<PracticeQuizModalProps> = ({
  isOpen,
  onClose,
  questions,
  title,
  subject,
  grade,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, QuizOptionKeyEnum | null>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const total = questions.length;
  const currentQ = questions[currentIndex];

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowExplanation(false);
      setIsCompleted(false);

      // Dispatch initial progress
      window.dispatchEvent(
        new CustomEvent('quiz-progress-update', {
          detail: { current: 1, total: questions.length, isFinished: false, quizTitle: title },
        })
      );
    }
  }, [isOpen, questions.length, title]);

  // Update progress as question index changes
  useEffect(() => {
    if (!isOpen || total === 0) return;

    if (isCompleted) {
      window.dispatchEvent(
        new CustomEvent('quiz-progress-update', {
          detail: { current: total, total, isFinished: true, quizTitle: title },
        })
      );
      window.dispatchEvent(
        new CustomEvent('quiz-finished', {
          detail: { total },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('quiz-progress-update', {
          detail: { current: currentIndex + 1, total, isFinished: false, quizTitle: title },
        })
      );
    }
  }, [currentIndex, isCompleted, isOpen, total, title]);

  if (!isOpen || total === 0 || !currentQ) return null;

  const handleSelectOption = (optKey: QuizOptionKeyEnum) => {
    if (isCompleted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optKey }));
  };

  const handleNext = () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      // Finished quiz!
      setIsCompleted(true);
      fireCelebrationConfetti();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setIsCompleted(false);
  };

  // Calculate score
  const correctCount = useMemo(() => {
    return questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);
  }, [questions, selectedAnswers]);

  const scorePercent = Math.round((correctCount / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white truncate max-w-md">{title}</h2>
              <p className="text-xs text-slate-400">
                {subject && `${subject} • `}
                {grade && `Lớp ${grade} • `}
                Luyện tập trực tiếp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isCompleted ? (
            <>
              {/* Question Box */}
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Câu {currentIndex + 1} / {total}
                  </span>
                  {selectedAnswers[currentIndex] && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn đáp án
                    </span>
                  )}
                </div>

                <div className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  <MathRenderer text={currentQ.content} />
                </div>

                {/* Math diagram if exists */}
                {currentQ.diagram && (
                  <div className="my-3 p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-center">
                    <MathDiagramView diagram={currentQ.diagram} />
                  </div>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAnswers[currentIndex] === opt.key;
                  const isCheckedCorrect = showExplanation && opt.key === currentQ.correctAnswer;
                  const isCheckedWrong = showExplanation && isSelected && opt.key !== currentQ.correctAnswer;

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isCheckedCorrect
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/40'
                          : isCheckedWrong
                          ? 'bg-rose-950/60 border-rose-500 text-rose-100 ring-2 ring-rose-500/40'
                          : isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-white ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCheckedCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : isCheckedWrong
                            ? 'bg-rose-500 text-white'
                            : isSelected
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <div className="text-sm font-medium flex-1 pt-0.5">
                        <MathRenderer text={opt.text} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation toggle */}
              {selectedAnswers[currentIndex] && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer"
                  >
                    {showExplanation ? 'Ẩn lời giải thích' : '💡 Xem lời giải thích câu này'}
                  </button>

                  {showExplanation && (
                    <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-sm text-cyan-200">
                      <div className="font-bold text-cyan-300 mb-1">
                        Đáp án đúng: {currentQ.correctAnswer}
                      </div>
                      <MathRenderer text={currentQ.explanation || 'Chưa có lời giải chi tiết cho câu hỏi này.'} />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Results Screen */
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                <Trophy className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">CHÚC MỪNG HOÀN THÀNH BÀI THI!</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Bạn đã hoàn thành tất cả {total} câu hỏi trong bài luyện tập.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-2xl font-black text-emerald-400">{correctCount}</div>
                  <div className="text-xs text-slate-400 mt-1">Câu đúng</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-2xl font-black text-rose-400">{total - correctCount}</div>
                  <div className="text-xs text-slate-400 mt-1">Câu sai</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-2xl font-black text-cyan-400">{scorePercent}%</div>
                  <div className="text-xs text-slate-400 mt-1">Độ chính xác</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => fireCelebrationConfetti()}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/30 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Bắn pháo hoa 🎉</span>
                </button>

                <button
                  onClick={handleRestart}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm lại từ đầu</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!isCompleted && (
          <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Câu trước</span>
            </button>

            <span className="text-xs text-slate-400 font-mono font-bold">
              {currentIndex + 1} / {total}
            </span>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition cursor-pointer"
            >
              <span>{currentIndex + 1 === total ? 'Nộp bài & Hoàn thành' : 'Câu tiếp theo'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
