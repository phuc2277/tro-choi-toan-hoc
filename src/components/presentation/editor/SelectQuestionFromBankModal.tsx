import React, { useState } from 'react';
import { Lesson, ExtendedQuestionItem } from '../../../types/teacherLesson';
import { QuestionOption } from '../../../types/contentBlock';
import { MathRenderer } from '../../../games/components/MathRenderer';
import { X, Search, Check, HelpCircle, BookOpen } from 'lucide-react';

interface SelectQuestionFromBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  onSelectQuestion: (questionData: {
    questionId: string;
    content: string;
    options: QuestionOption[];
    correctAnswer: string;
    solution?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) => void;
}

export const SelectQuestionFromBankModal: React.FC<SelectQuestionFromBankModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onSelectQuestion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiff, setSelectedDiff] = useState<string>('all');

  if (!isOpen) return null;

  const questionBank = lesson.questionBank || [];

  const getOptionText = (opt: any): string => {
    if (typeof opt === 'string') return opt;
    if (opt && typeof opt === 'object') return opt.text || opt.content || '';
    return '';
  };

  const filteredQuestions = questionBank.filter((q) => {
    const matchesSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q as any).topic?.toLowerCase().includes(searchTerm.toLowerCase());
    const qDiff = (q as any).difficulty || (q.cognitiveLevel === 'Nhận biết' ? 'easy' : q.cognitiveLevel === 'Thông hiểu' ? 'medium' : 'hard');
    const matchesDiff = selectedDiff === 'all' || qDiff === selectedDiff;
    return matchesSearch && matchesDiff;
  });

  const handleChoose = (q: ExtendedQuestionItem) => {
    // Map options
    const mappedOptions: QuestionOption[] = (q.options || []).map((opt, idx) => {
      const label = ['A', 'B', 'C', 'D'][idx] || `L${idx + 1}`;
      return {
        id: `opt_${idx}`,
        label,
        text: getOptionText(opt),
      };
    });

    const correctLabel = String(q.correctAnswer || ['A', 'B', 'C', 'D'][(q as any).correctOptionIndex ?? 0] || 'A');

    onSelectQuestion({
      questionId: q.id,
      content: q.content,
      options: mappedOptions,
      correctAnswer: correctLabel,
      solution: q.explanation || (q as any).solution || '',
      difficulty: ((q as any).difficulty || (q.cognitiveLevel === 'Nhận biết' ? 'easy' : q.cognitiveLevel === 'Thông hiểu' ? 'medium' : 'hard')) as any,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chọn câu hỏi từ Ngân hàng câu hỏi
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Bài học: <span className="font-bold text-amber-600">{lesson.title}</span> ({questionBank.length} câu)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-2">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nội dung câu hỏi..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDiff(diff)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  selectedDiff === diff
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {diff === 'all' ? 'Tất cả' : diff === 'easy' ? 'Nhận biết' : diff === 'medium' ? 'Thông hiểu' : 'Vận dụng'}
              </button>
            ))}
          </div>
        </div>

        {/* List of questions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">Không tìm thấy câu hỏi phù hợp trong Ngân hàng</p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Câu {idx + 1}
                    </span>
                    {(q.cognitiveLevel || (q as any).difficulty) && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {q.cognitiveLevel || ((q as any).difficulty === 'easy' ? 'Nhận biết' : (q as any).difficulty === 'medium' ? 'Thông hiểu' : 'Vận dụng')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 leading-relaxed">
                    <MathRenderer text={q.content} />
                  </div>
                  {/* Options sample */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                    {(q.options || []).map((opt, oIdx) => {
                      const optText = getOptionText(opt);
                      const optLabel = ['A', 'B', 'C', 'D'][oIdx] || '';
                      const isCorrect = q.correctAnswer === optLabel || (q as any).correctOptionIndex === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded-lg border text-[11px] ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="font-bold mr-1">{optLabel}.</span>
                          <MathRenderer text={optText} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleChoose(q)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Chèn câu này vào Slide</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
