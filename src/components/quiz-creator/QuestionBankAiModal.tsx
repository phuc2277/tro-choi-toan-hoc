import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lesson, ExtendedQuestionItem } from '../../types/teacherLesson';
import { QuizOptionKeyEnum } from '../../games/types/GameEnums';
import { QuestionPreviewApprovalModal } from './QuestionPreviewApprovalModal';
import {
  Sparkles,
  X,
  Layers,
  Table,
  Cpu,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wand2,
} from 'lucide-react';

interface QuestionBankAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  onAddQuestionsToBank: (newQuestions: ExtendedQuestionItem[]) => void;
}

export const QuestionBankAiModal: React.FC<QuestionBankAiModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onAddQuestionsToBank,
}) => {
  // 3x3 Matrix Grid State
  const [matrix, setMatrix] = useState({
    multipleChoice: { recognition: 3, understanding: 2, application: 1, advanced: 0 },
    trueFalse: { recognition: 2, understanding: 1, application: 0, advanced: 0 },
    shortAnswer: { recognition: 0, understanding: 1, application: 1, advanced: 0 },
  });

  const [teacherNotes, setTeacherNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview Approval Modal State
  const [previewQuestions, setPreviewQuestions] = useState<ExtendedQuestionItem[] | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

  // Calculate totals
  const totalMC =
    matrix.multipleChoice.recognition +
    matrix.multipleChoice.understanding +
    matrix.multipleChoice.application +
    matrix.multipleChoice.advanced;

  const totalTF =
    matrix.trueFalse.recognition +
    matrix.trueFalse.understanding +
    matrix.trueFalse.application +
    matrix.trueFalse.advanced;

  const totalSA =
    matrix.shortAnswer.recognition +
    matrix.shortAnswer.understanding +
    matrix.shortAnswer.application +
    matrix.shortAnswer.advanced;

  const totalRecognition =
    matrix.multipleChoice.recognition +
    matrix.trueFalse.recognition +
    matrix.shortAnswer.recognition;

  const totalUnderstanding =
    matrix.multipleChoice.understanding +
    matrix.trueFalse.understanding +
    matrix.shortAnswer.understanding;

  const totalApplication =
    matrix.multipleChoice.application +
    matrix.trueFalse.application +
    matrix.shortAnswer.application;

  const totalAdvanced =
    matrix.multipleChoice.advanced +
    matrix.trueFalse.advanced +
    matrix.shortAnswer.advanced;

  const totalQuestions = totalMC + totalTF + totalSA;

  const handleApplyPreset = (preset: 'standard' | 'basic' | 'advanced') => {
    if (preset === 'standard') {
      setMatrix({
        multipleChoice: { recognition: 3, understanding: 2, application: 1, advanced: 0 },
        trueFalse: { recognition: 2, understanding: 1, application: 0, advanced: 0 },
        shortAnswer: { recognition: 0, understanding: 1, application: 1, advanced: 0 },
      });
    } else if (preset === 'basic') {
      setMatrix({
        multipleChoice: { recognition: 4, understanding: 3, application: 0, advanced: 0 },
        trueFalse: { recognition: 2, understanding: 1, application: 0, advanced: 0 },
        shortAnswer: { recognition: 0, understanding: 0, application: 0, advanced: 0 },
      });
    } else if (preset === 'advanced') {
      setMatrix({
        multipleChoice: { recognition: 1, understanding: 2, application: 3, advanced: 1 },
        trueFalse: { recognition: 0, understanding: 1, application: 1, advanced: 0 },
        shortAnswer: { recognition: 0, understanding: 1, application: 2, advanced: 1 },
      });
    }
  };

  const handleGenerate = async () => {
    if (totalQuestions <= 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 câu hỏi trong ma trận.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/generate-question-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          subject: lesson.subject,
          grade: lesson.grade,
          count: totalQuestions,
          matrix,
          teacherNotes,
        }),
      });

      if (!res.ok) {
        throw new Error('Lỗi tạo câu hỏi từ hệ thống AI');
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.questions)) {
        throw new Error(data.error || 'Dữ liệu trả về không hợp lệ');
      }

      const formattedQuestions: ExtendedQuestionItem[] = data.questions.map((q: any, idx: number) => ({
        id: `q-ai-${Date.now()}-${idx + 1}`,
        lessonId: lesson.id,
        subject: lesson.subject,
        grade: lesson.grade,
        chapter: lesson.chapter,
        lessonTitle: lesson.title,
        content: q.content,
        questionType: q.questionType || 'multiple-choice',
        cognitiveLevel: q.cognitiveLevel || 'Nhận biết',
        options: q.options || [
          { key: QuizOptionKeyEnum.A, text: 'A' },
          { key: QuizOptionKeyEnum.B, text: 'B' },
          { key: QuizOptionKeyEnum.C, text: 'C' },
          { key: QuizOptionKeyEnum.D, text: 'D' },
        ],
        correctAnswer: (q.correctAnswer as QuizOptionKeyEnum) || QuizOptionKeyEnum.A,
        shortAnswerKey: q.shortAnswerKey,
        explanation: q.explanation || 'Lời giải chi tiết do AI biên soạn.',
        usageCount: 0,
        createdAt: Date.now(),
      }));

      setPreviewQuestions(formattedQuestions);
      setShowPreviewModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Không thể tạo câu hỏi AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveQuestions = (approved: ExtendedQuestionItem[]) => {
    onAddQuestionsToBank(approved);
    onClose();
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold">
                <Wand2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>AI Tạo Câu hỏi theo Ma trận Chuẩn</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200">
                    GDPT 2018
                  </span>
                </h3>
                <p className="text-xs text-emerald-100/80">
                  Bài học: {lesson.title} ({lesson.subject} - Lớp {lesson.grade})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Bộ ma trận mẫu nhanh:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('standard')}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                >
                  ⚡ Chuẩn (10 câu)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('basic')}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition cursor-pointer"
                >
                  🌱 Cơ bản (10 câu)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('advanced')}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
                >
                  🔥 Nâng cao (12 câu)
                </button>
              </div>
            </div>

            {/* 3x3 MATRIX GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Table className="w-4 h-4 text-emerald-600" />
                  <span>Ma trận chi tiết (Loại câu hỏi × Cấp độ nhận thức)</span>
                </label>
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800">
                  Tổng cộng: {totalQuestions} câu
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Loại câu hỏi</th>
                      <th className="p-3 text-center">Nhận biết</th>
                      <th className="p-3 text-center">Thông hiểu</th>
                      <th className="p-3 text-center">Vận dụng</th>
                      <th className="p-3 text-center">Vận dụng cao</th>
                      <th className="p-3 text-center bg-slate-200/60">Tổng dòng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {/* Row 1: Multiple Choice */}
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <span>Nhiều lựa chọn (A,B,C,D)</span>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.multipleChoice.recognition}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              multipleChoice: { ...matrix.multipleChoice, recognition: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.multipleChoice.understanding}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              multipleChoice: { ...matrix.multipleChoice, understanding: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.multipleChoice.application}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              multipleChoice: { ...matrix.multipleChoice, application: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.multipleChoice.advanced}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              multipleChoice: { ...matrix.multipleChoice, advanced: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center font-bold text-blue-700 bg-slate-50">
                        {totalMC}
                      </td>
                    </tr>

                    {/* Row 2: True / False */}
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                        <span>Đúng / Sai</span>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.trueFalse.recognition}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              trueFalse: { ...matrix.trueFalse, recognition: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.trueFalse.understanding}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              trueFalse: { ...matrix.trueFalse, understanding: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.trueFalse.application}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              trueFalse: { ...matrix.trueFalse, application: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.trueFalse.advanced}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              trueFalse: { ...matrix.trueFalse, advanced: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center font-bold text-teal-700 bg-slate-50">
                        {totalTF}
                      </td>
                    </tr>

                    {/* Row 3: Short Answer */}
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Trả lời ngắn / Điền số</span>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.shortAnswer.recognition}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              shortAnswer: { ...matrix.shortAnswer, recognition: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.shortAnswer.understanding}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              shortAnswer: { ...matrix.shortAnswer, understanding: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.shortAnswer.application}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              shortAnswer: { ...matrix.shortAnswer, application: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={matrix.shortAnswer.advanced}
                          onChange={(e) =>
                            setMatrix({
                              ...matrix,
                              shortAnswer: { ...matrix.shortAnswer, advanced: Math.max(0, parseInt(e.target.value) || 0) },
                            })
                          }
                          className="w-14 p-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center font-bold text-amber-700 bg-slate-50">
                        {totalSA}
                      </td>
                    </tr>

                    {/* Column Totals */}
                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td className="p-3">Tổng theo cấp độ:</td>
                      <td className="p-2 text-center text-slate-700">{totalRecognition}</td>
                      <td className="p-2 text-center text-indigo-700">{totalUnderstanding}</td>
                      <td className="p-2 text-center text-purple-700">{totalApplication}</td>
                      <td className="p-2 text-center text-rose-700">{totalAdvanced}</td>
                      <td className="p-2 text-center bg-emerald-200/70 text-emerald-950 font-black text-sm">
                        {totalQuestions}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Teacher Extra Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yêu cầu bổ sung của Thầy/Cô cho AI (Tùy chọn):
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Tập trung vào dạng toán giải hệ phương trình bằng phương pháp thế, công thức LaTeX đầy đủ..."
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || totalQuestions === 0}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer ${
                isLoading || totalQuestions === 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gemini AI đang sinh {totalQuestions} câu hỏi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Tạo {totalQuestions} câu hỏi & Xem trước</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* STEP 2: MANDATORY PREVIEW & APPROVAL MODAL */}
      {showPreviewModal && previewQuestions && (
        <QuestionPreviewApprovalModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onApprove={handleApproveQuestions}
          initialQuestions={previewQuestions}
          title={`Phê duyệt ${previewQuestions.length} câu hỏi AI tạo cho bài học`}
          sourceType="Gemini 3.7 Flash AI Matrix"
        />
      )}
    </>,
    document.body
  );
};
