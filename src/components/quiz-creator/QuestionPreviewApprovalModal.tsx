import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExtendedQuestionItem, CognitiveLevel, QuestionType } from '../../types/teacherLesson';
import { QuizOptionKeyEnum } from '../../games/types/GameEnums';
import { MathRenderer } from '../../games/components/MathRenderer';
import {
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Plus,
  Sparkles,
  Layers,
  HelpCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface QuestionPreviewApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (approvedQuestions: ExtendedQuestionItem[]) => void;
  initialQuestions: ExtendedQuestionItem[];
  title?: string;
  sourceType?: string;
}

export const QuestionPreviewApprovalModal: React.FC<QuestionPreviewApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  initialQuestions,
  title = 'Xem trước & Phê duyệt Câu hỏi',
  sourceType = 'AI tạo tự động',
}) => {
  const [questions, setQuestions] = useState<ExtendedQuestionItem[]>(initialQuestions);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Edit draft state
  const [editDraft, setEditDraft] = useState<ExtendedQuestionItem | null>(null);

  // Lock body scroll when modal is open to keep view stable
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

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditDraft(JSON.parse(JSON.stringify(questions[index])));
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editDraft) {
      const next = [...questions];
      next[editingIndex] = editDraft;
      setQuestions(next);
      setEditingIndex(null);
      setEditDraft(null);
    }
  };

  const handleDelete = (index: number) => {
    const next = questions.filter((_, idx) => idx !== index);
    setQuestions(next);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleConfirmAll = () => {
    onApprove(questions);
    onClose();
  };

  const totalMC = questions.filter((q) => q.questionType === 'multiple-choice' || !q.questionType).length;
  const totalTF = questions.filter((q) => q.questionType === 'true-false').length;
  const totalSA = questions.filter((q) => q.questionType === 'short-answer').length;

  const totalRec = questions.filter((q) => q.cognitiveLevel === 'Nhận biết' || !q.cognitiveLevel).length;
  const totalUnd = questions.filter((q) => q.cognitiveLevel === 'Thông hiểu').length;
  const totalApp = questions.filter((q) => q.cognitiveLevel === 'Vận dụng').length;
  const totalAdv = questions.filter((q) => q.cognitiveLevel === 'Vận dụng cao').length;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {questions.length} câu hỏi
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80">
                Nguồn: {sourceType}. Vui lòng kiểm tra, chỉnh sửa nội dung hoặc loại bỏ câu không phù hợp trước khi thêm vào Ngân hàng.
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

        {/* Statistics Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Phân bố loại câu:</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold">
              Nhiều lựa chọn: {totalMC}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 font-semibold">
              Đúng/Sai: {totalTF}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-semibold">
              Trả lời ngắn: {totalSA}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Cấp độ nhận thức:</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-semibold">
              Nhận biết: {totalRec}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-semibold">
              Thông hiểu: {totalUnd}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold">
              Vận dụng: {totalApp}
            </span>
            {totalAdv > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-semibold">
                Vận dụng cao: {totalAdv}
              </span>
            )}
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-sm">Không còn câu hỏi nào trong danh sách phê duyệt.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isExpanded = expandedIndex === idx;
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={q.id || idx}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition shadow-2xs overflow-hidden"
                >
                  {/* Item Header Bar */}
                  <div
                    className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  >
                    <div className="flex items-center gap-2.5 flex-1 pr-3 overflow-hidden">
                      <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                          {q.questionType === 'true-false'
                            ? 'Đúng / Sai'
                            : q.questionType === 'short-answer'
                            ? 'Trả lời ngắn'
                            : 'Nhiều lựa chọn'}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                          {q.cognitiveLevel || 'Nhận biết'}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800 truncate flex-1">
                        <MathRenderer content={q.content} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(idx);
                        }}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer"
                        title="Chỉnh sửa câu hỏi này"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(idx);
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button className="p-1.5 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && !isEditing && (
                    <div className="p-5 space-y-4">
                      <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                        <MathRenderer content={q.content} />
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options?.map((opt) => {
                          const isCorrect = opt.key === q.correctAnswer;
                          return (
                            <div
                              key={opt.key}
                              className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-black shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <div className="flex-1">
                                <MathRenderer content={opt.text} />
                              </div>
                              {isCorrect && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.shortAnswerKey && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          <span className="font-bold">Đáp án ngắn chuẩn: </span>
                          <span className="font-mono font-bold text-amber-800">{q.shortAnswerKey}</span>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                          <span className="font-bold text-indigo-800 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" /> Lời giải chi tiết:
                          </span>
                          <MathRenderer content={q.explanation} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline Editing Form */}
                  {isEditing && editDraft && (
                    <div className="p-5 bg-indigo-50/30 border-t border-indigo-100 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                        <span className="text-xs font-bold text-indigo-900">✏️ Chỉnh sửa Câu hỏi #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                          >
                            Lưu chỉnh sửa
                          </button>
                        </div>
                      </div>

                      {/* Content Input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi:</label>
                        <textarea
                          rows={3}
                          value={editDraft.content}
                          onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })}
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-sans"
                        />
                      </div>

                      {/* Question Type & Level Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Loại câu hỏi:</label>
                          <select
                            value={editDraft.questionType || 'multiple-choice'}
                            onChange={(e) => setEditDraft({ ...editDraft, questionType: e.target.value as QuestionType })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300"
                          >
                            <option value="multiple-choice">Nhiều lựa chọn (4 phương án A, B, C, D)</option>
                            <option value="true-false">Đúng / Sai (2 phương án A, B)</option>
                            <option value="short-answer">Trả lời ngắn / Điền đáp số</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Cấp độ nhận thức:</label>
                          <select
                            value={editDraft.cognitiveLevel || 'Nhận biết'}
                            onChange={(e) => setEditDraft({ ...editDraft, cognitiveLevel: e.target.value as CognitiveLevel })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300"
                          >
                            <option value="Nhận biết">Nhận biết</option>
                            <option value="Thông hiểu">Thông hiểu</option>
                            <option value="Vận dụng">Vận dụng</option>
                            <option value="Vận dụng cao">Vận dụng cao</option>
                          </select>
                        </div>
                      </div>

                      {/* Options Editing */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">Các phương án & Đáp án đúng:</label>
                        {editDraft.options?.map((opt, oIdx) => (
                          <div key={opt.key} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${idx}`}
                              checked={editDraft.correctAnswer === opt.key}
                              onChange={() => setEditDraft({ ...editDraft, correctAnswer: opt.key as QuizOptionKeyEnum })}
                              className="w-4 h-4 text-indigo-600 cursor-pointer"
                            />
                            <span className="w-6 font-bold text-xs text-slate-700">{opt.key}.</span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const nextOpts = [...(editDraft.options || [])];
                                nextOpts[oIdx] = { ...nextOpts[oIdx], text: e.target.value };
                                setEditDraft({ ...editDraft, options: nextOpts });
                              }}
                              className="flex-1 p-2 text-xs rounded-xl border border-slate-300"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Lời giải chi tiết:</label>
                        <textarea
                          rows={2}
                          value={editDraft.explanation || ''}
                          onChange={(e) => setEditDraft({ ...editDraft, explanation: e.target.value })}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirmAll}
            disabled={questions.length === 0}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer ${
              questions.length === 0
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác nhận thêm {questions.length} câu vào Ngân hàng câu hỏi</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
