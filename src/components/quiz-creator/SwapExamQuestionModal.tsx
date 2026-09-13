import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExtendedQuestionItem } from '../../types/teacherLesson';
import { MathRenderer } from '../../games/components/MathRenderer';
import {
  RefreshCw,
  X,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface SwapExamQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestion: ExtendedQuestionItem;
  questionIndex: number;
  bank: ExtendedQuestionItem[];
  currentExamQuestionIds: string[];
  onSelectReplacement: (newQuestion: ExtendedQuestionItem) => void;
}

export const SwapExamQuestionModal: React.FC<SwapExamQuestionModalProps> = ({
  isOpen,
  onClose,
  currentQuestion,
  questionIndex,
  bank,
  currentExamQuestionIds,
  onSelectReplacement,
}) => {
  const [filterStrict, setFilterStrict] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const candidates = useMemo(() => {
    const examIdSet = new Set(currentExamQuestionIds);
    return bank.filter((q) => {
      // Exclude questions already in the exam
      if (examIdSet.has(q.id)) return false;

      // Strict matrix matching: same type and same cognitive level
      if (filterStrict) {
        const typeMatch = (q.questionType || 'multiple-choice') === (currentQuestion.questionType || 'multiple-choice');
        const levelMatch = (q.cognitiveLevel || 'Nhận biết') === (currentQuestion.cognitiveLevel || 'Nhận biết');
        if (!typeMatch || !levelMatch) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = (q.content || '').toLowerCase().includes(query);
        if (!contentMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize unused or least used
      const aUsed = a.usageCount || 0;
      const bUsed = b.usageCount || 0;
      return aUsed - bUsed;
    });
  }, [bank, currentExamQuestionIds, currentQuestion, filterStrict, searchQuery]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Đổi câu hỏi #{questionIndex + 1} trong đề thi</span>
              </h3>
              <p className="text-xs text-amber-100/80">
                Chọn câu hỏi tương đương từ Ngân hàng để bảo toàn ma trận đề thi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Question Summary */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-amber-900">Câu hỏi hiện tại đang cần thay thế:</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                {currentQuestion.questionType === 'true-false'
                  ? 'Đúng/Sai'
                  : currentQuestion.questionType === 'short-answer'
                  ? 'Trả lời ngắn'
                  : 'Nhiều lựa chọn'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                {currentQuestion.cognitiveLevel || 'Nhận biết'}
              </span>
            </div>
          </div>
          <div className="text-slate-800 font-semibold truncate">
            <MathRenderer content={currentQuestion.content} />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi thay thế..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold select-none">
            <input
              type="checkbox"
              checked={filterStrict}
              onChange={(e) => setFilterStrict(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <span>Khóa chuẩn ma trận (Cùng loại & Cùng cấp độ)</span>
          </label>
        </div>

        {/* Candidate Questions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {candidates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-amber-500/80" />
              <p className="font-bold text-sm text-slate-700">
                Không tìm thấy câu hỏi thay thế phù hợp trong Ngân hàng
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {filterStrict
                  ? 'Thầy/Cô có thể bỏ chọn "Khóa chuẩn ma trận" hoặc sinh thêm câu hỏi vào Ngân hàng.'
                  : 'Hãy nhập thêm câu hỏi vào Ngân hàng câu hỏi của bài học.'}
              </p>
            </div>
          ) : (
            candidates.map((candidate, idx) => (
              <div
                key={candidate.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 bg-white transition shadow-2xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                      {candidate.questionType === 'true-false'
                        ? 'Đúng / Sai'
                        : candidate.questionType === 'short-answer'
                        ? 'Trả lời ngắn'
                        : 'Nhiều lựa chọn'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                      {candidate.cognitiveLevel || 'Nhận biết'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Đã dùng: {candidate.usageCount || 0} lần
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-900 leading-relaxed">
                    <MathRenderer content={candidate.content} />
                  </div>

                  {/* Options Preview */}
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                    {candidate.options?.slice(0, 4).map((opt) => (
                      <div
                        key={opt.key}
                        className={opt.key === candidate.correctAnswer ? 'font-bold text-emerald-700' : ''}
                      >
                        {opt.key}. {opt.text} {opt.key === candidate.correctAnswer && '✓'}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectReplacement(candidate);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-200 transition cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chọn câu này</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">
            Có {candidates.length} câu hỏi hợp lệ sẵn sàng thay thế
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
