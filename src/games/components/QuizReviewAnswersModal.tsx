import React from 'react';
import { QuestionItem, RoundScoreItem } from '../types/GestureQuiz';
import { X, CheckCircle, XCircle, BookOpen, Lightbulb } from 'lucide-react';
import { QuizAnswerUtils } from '../gesture-quiz/utils/quizAnswerUtils';

interface QuizReviewAnswersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundHistory: RoundScoreItem[];
  subject: string;
}

export const QuizReviewAnswersModal: React.FC<QuizReviewAnswersModalProps> = ({
  isOpen,
  onClose,
  roundHistory,
  subject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-[#161B22] border border-[#30363D] shadow-2xl overflow-hidden text-white relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] bg-[#0A0E17]/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Chi Tiết Từng Câu Hỏi & Đáp Án</h2>
              <p className="text-xs text-gray-400">Môn học: {subject} • {roundHistory.length} câu đã thi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-[#21262D] hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {roundHistory.map((item, idx) => {
            const q = item.question;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#30363D] bg-[#0A0E17] p-5 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-mono font-bold text-blue-400 border border-blue-500/30">
                    Câu {idx + 1}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{q.subject}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-relaxed">{q.content}</h3>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt) => {
                    const isCorrect = opt.key === q.correctAnswer;
                    return (
                      <div
                        key={opt.key}
                        className={`rounded-xl p-3.5 text-sm sm:text-base flex items-center justify-between border ${
                          isCorrect
                            ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200 font-bold'
                            : 'border-[#30363D] bg-[#161B22] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-lg font-mono flex items-center justify-center font-black text-base ${
                              isCorrect ? 'bg-emerald-500 text-white' : 'bg-[#21262D] text-gray-400'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="font-semibold">{opt.text}</span>
                        </div>
                        {isCorrect && (
                          <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40 font-mono">
                            Đáp án chuẩn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="flex items-start gap-2 text-xs bg-[#161B22] p-3 rounded-xl border border-[#30363D] text-gray-300">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Giải thích:</strong> {q.explanation}
                    </div>
                  </div>
                )}

                {/* Player answers list */}
                <div className="border-t border-[#30363D] pt-3 flex flex-wrap gap-2">
                  <span className="text-[11px] font-bold text-gray-400 self-center">Kết quả học sinh:</span>
                  {item.playerAnswers.map((pa) => {
                    const isCorrect = pa.selectedOption === q.correctAnswer;
                    return (
                      <span
                        key={pa.playerId}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                          isCorrect
                            ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/30 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {isCorrect ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        <span>
                          {pa.playerName}: {pa.selectedOption ? `[ ${pa.selectedOption} ]` : 'Không chọn'}
                          {pa.timeSpentSeconds !== undefined ? ` (${pa.timeSpentSeconds}s)` : ''}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#30363D] bg-[#0A0E17]/60 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#21262D] border border-[#30363D] px-6 py-2 text-sm font-bold text-gray-200 hover:bg-[#30363D] hover:text-white transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
