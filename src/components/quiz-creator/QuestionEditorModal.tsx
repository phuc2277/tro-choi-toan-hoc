import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExtendedQuestionItem, CognitiveLevel, QuestionType } from '../../types/teacherLesson';
import { QuizOptionKeyEnum } from '../../games/types/GameEnums';
import { MathRenderer } from '../../games/components/MathRenderer';
import { MathDiagramView } from '../../games/components/MathDiagramView';
import { MathFormulaToolbar } from './MathFormulaToolbar';
import { MathDiagram } from '../../games/types/GestureQuiz';
import {
  Edit3,
  Plus,
  Save,
  X,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ListOrdered,
  Layers,
  FileQuestion,
  Shapes,
  Table as TableIcon,
} from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  question?: ExtendedQuestionItem | null;
  lessonTitle: string;
  subject: string;
  grade: number;
  onSaveQuestion: (question: ExtendedQuestionItem) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  question,
  lessonTitle,
  subject,
  grade,
  onSaveQuestion,
}) => {
  const isEditMode = !!question;

  const [content, setContent] = useState(question?.content || '');
  const [questionType, setQuestionType] = useState<QuestionType>(
    question?.questionType || 'multiple-choice'
  );
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(
    question?.cognitiveLevel || 'Thông hiểu'
  );
  const [correctAnswer, setCorrectAnswer] = useState<QuizOptionKeyEnum>(
    question?.correctAnswer || QuizOptionKeyEnum.A
  );

  const [optA, setOptA] = useState(
    question?.options.find((o) => o.key === QuizOptionKeyEnum.A)?.text || ''
  );
  const [optB, setOptB] = useState(
    question?.options.find((o) => o.key === QuizOptionKeyEnum.B)?.text || ''
  );
  const [optC, setOptC] = useState(
    question?.options.find((o) => o.key === QuizOptionKeyEnum.C)?.text || ''
  );
  const [optD, setOptD] = useState(
    question?.options.find((o) => o.key === QuizOptionKeyEnum.D)?.text || ''
  );

  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [shortAnswerKey, setShortAnswerKey] = useState(question?.shortAnswerKey || '');
  const [diagramType, setDiagramType] = useState<string>(question?.diagram?.type || 'none');
  const [diagramTitle, setDiagramTitle] = useState(question?.diagram?.title || '');
  const [activeInputTarget, setActiveInputTarget] = useState<'content' | 'optA' | 'optB' | 'optC' | 'optD' | 'explanation'>('content');

  const handleInsertSnippet = (snippet: string) => {
    if (activeInputTarget === 'content') setContent((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + snippet);
    else if (activeInputTarget === 'optA') setOptA((prev) => prev + snippet);
    else if (activeInputTarget === 'optB') setOptB((prev) => prev + snippet);
    else if (activeInputTarget === 'optC') setOptC((prev) => prev + snippet);
    else if (activeInputTarget === 'optD') setOptD((prev) => prev + snippet);
    else if (activeInputTarget === 'explanation') setExplanation((prev) => prev + snippet);
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let options = [
      { key: QuizOptionKeyEnum.A, text: optA.trim() || 'A' },
      { key: QuizOptionKeyEnum.B, text: optB.trim() || 'B' },
      { key: QuizOptionKeyEnum.C, text: optC.trim() || 'C' },
      { key: QuizOptionKeyEnum.D, text: optD.trim() || 'D' },
    ];

    if (questionType === 'true-false') {
      options = [
        { key: QuizOptionKeyEnum.A, text: optA.trim() || 'Đúng' },
        { key: QuizOptionKeyEnum.B, text: optB.trim() || 'Sai' },
      ];
    }

    let diagramObj: MathDiagram | undefined = undefined;
    if (diagramType && diagramType !== 'none') {
      diagramObj = {
        type: diagramType as any,
        title: diagramTitle.trim() || undefined,
      };
    }

    const savedQuestion: ExtendedQuestionItem = {
      id: question?.id || `q-custom-${Date.now()}`,
      subject,
      grade,
      lessonTitle,
      content: content.trim(),
      questionType,
      cognitiveLevel,
      options,
      correctAnswer,
      shortAnswerKey: shortAnswerKey.trim() || undefined,
      explanation: explanation.trim() || undefined,
      diagram: diagramObj,
    };

    onSaveQuestion(savedQuestion);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditMode ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {lessonTitle} • {subject} Lớp {grade}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Metadata Row: Question Type & Cognitive Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Loại câu hỏi
              </label>
              <select
                value={questionType}
                onChange={(e) => {
                  const val = e.target.value as QuestionType;
                  setQuestionType(val);
                  if (val === 'true-false') {
                    setOptA('Đúng');
                    setOptB('Sai');
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="multiple-choice">Nhiều lựa chọn (A, B, C, D)</option>
                <option value="true-false">Đúng / Sai</option>
                <option value="short-answer">Trả lời ngắn (Tự luận ngắn)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Cấp độ nhận thức
              </label>
              <select
                value={cognitiveLevel}
                onChange={(e) => setCognitiveLevel(e.target.value as CognitiveLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="Nhận biết">1. Nhận biết</option>
                <option value="Thông hiểu">2. Thông hiểu</option>
                <option value="Vận dụng">3. Vận dụng</option>
                <option value="Vận dụng cao">4. Vận dụng cao</option>
              </select>
            </div>
          </div>

          {/* Question Content & Math Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Nội dung câu hỏi *
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Hỗ trợ KaTeX, Bảng biểu & Hình vẽ</span>
              </span>
            </div>

            {/* Quick Math Toolbar */}
            <div className="mb-2">
              <MathFormulaToolbar
                onInsert={handleInsertSnippet}
                previewText={content}
              />
            </div>

            <textarea
              required
              rows={3}
              placeholder="Nhập câu hỏi (ví dụ: Cho tam giác $\triangle ABC$ vuông tại $A$ có $AB=3\text{cm}, AC=4\text{cm}$. Tính độ dài $BC$...)"
              value={content}
              onFocus={() => setActiveInputTarget('content')}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-indigo-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/30 font-medium bg-slate-50/50"
            />
          </div>

          {/* Optional Geometric Diagram / Drawing Attachment */}
          <div className="p-3.5 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-pink-50/70 border border-purple-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-purple-900 uppercase flex items-center gap-1.5">
                <Shapes className="w-4 h-4 text-purple-600" />
                <span>Hình vẽ minh họa toán học (Tùy chọn)</span>
              </label>
              {diagramType !== 'none' && (
                <button
                  type="button"
                  onClick={() => setDiagramType('none')}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Xóa hình vẽ
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <select
                value={diagramType}
                onChange={(e) => setDiagramType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-400"
              >
                <option value="none">-- Không đính kèm hình vẽ --</option>
                <option value="right-triangle">📐 Tam giác vuông (Pythagoras)</option>
                <option value="triangle-angles">🔺 Tam giác với 3 góc A, B, C</option>
                <option value="parallel-transversal">⚡ Hai đường thẳng song song & cát tuyến</option>
                <option value="angle-bisector">✨ Tia phân giác góc xOy</option>
                <option value="circle-radius">⭕ Đường tròn tâm O bán kính R</option>
                <option value="rectangular-box">📦 Hình hộp chữ nhật 3D</option>
                <option value="coordinate-plane">📈 Hệ trục tọa độ Oxy</option>
                <option value="number-line">➖ Trục số thực</option>
                <option value="communicating-vessels">🧪 Bình thông nhau</option>
              </select>

              {diagramType !== 'none' && (
                <input
                  type="text"
                  placeholder="Tiêu đề hình vẽ (ví dụ: Hình 1. Tam giác ABC)"
                  value={diagramTitle}
                  onChange={(e) => setDiagramTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium text-slate-800"
                />
              )}
            </div>

            {diagramType !== 'none' && (
              <div className="mt-2 p-2 bg-white/80 rounded-xl border border-purple-200">
                <MathDiagramView
                  diagram={{
                    type: diagramType as any,
                    title: diagramTitle || 'Hình vẽ minh họa xem trước',
                  }}
                />
              </div>
            )}
          </div>

          {/* Options input */}
          {questionType === 'true-false' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Đáp án Đúng / Sai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    correctAnswer === QuizOptionKeyEnum.A
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="correct-tf"
                    checked={correctAnswer === QuizOptionKeyEnum.A}
                    onChange={() => setCorrectAnswer(QuizOptionKeyEnum.A)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <span className="text-xs sm:text-sm font-bold text-slate-900">A. Đúng</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    correctAnswer === QuizOptionKeyEnum.B
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="correct-tf"
                    checked={correctAnswer === QuizOptionKeyEnum.B}
                    onChange={() => setCorrectAnswer(QuizOptionKeyEnum.B)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <span className="text-xs sm:text-sm font-bold text-slate-900">B. Sai</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Các phương án lựa chọn & Chọn đáp án đúng *
              </label>

              {/* Option A */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <input
                  type="radio"
                  name="correct-answer"
                  id="opt-a-radio"
                  checked={correctAnswer === QuizOptionKeyEnum.A}
                  onChange={() => setCorrectAnswer(QuizOptionKeyEnum.A)}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 w-5">A:</span>
                <input
                  type="text"
                  required
                  placeholder="Nội dung phương án A (ví dụ: $x = 2$ hoặc $\frac{1}{2}$)"
                  value={optA}
                  onFocus={() => setActiveInputTarget('optA')}
                  onChange={(e) => setOptA(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900"
                />
                {optA.trim() && (
                  <div className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 hidden sm:block">
                    <MathRenderer text={optA} />
                  </div>
                )}
              </div>

              {/* Option B */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <input
                  type="radio"
                  name="correct-answer"
                  id="opt-b-radio"
                  checked={correctAnswer === QuizOptionKeyEnum.B}
                  onChange={() => setCorrectAnswer(QuizOptionKeyEnum.B)}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 w-5">B:</span>
                <input
                  type="text"
                  required
                  placeholder="Nội dung phương án B"
                  value={optB}
                  onFocus={() => setActiveInputTarget('optB')}
                  onChange={(e) => setOptB(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900"
                />
                {optB.trim() && (
                  <div className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 hidden sm:block">
                    <MathRenderer text={optB} />
                  </div>
                )}
              </div>

              {/* Option C */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <input
                  type="radio"
                  name="correct-answer"
                  id="opt-c-radio"
                  checked={correctAnswer === QuizOptionKeyEnum.C}
                  onChange={() => setCorrectAnswer(QuizOptionKeyEnum.C)}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 w-5">C:</span>
                <input
                  type="text"
                  required
                  placeholder="Nội dung phương án C"
                  value={optC}
                  onFocus={() => setActiveInputTarget('optC')}
                  onChange={(e) => setOptC(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900"
                />
                {optC.trim() && (
                  <div className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 hidden sm:block">
                    <MathRenderer text={optC} />
                  </div>
                )}
              </div>

              {/* Option D */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <input
                  type="radio"
                  name="correct-answer"
                  id="opt-d-radio"
                  checked={correctAnswer === QuizOptionKeyEnum.D}
                  onChange={() => setCorrectAnswer(QuizOptionKeyEnum.D)}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 w-5">D:</span>
                <input
                  type="text"
                  required
                  placeholder="Nội dung phương án D"
                  value={optD}
                  onFocus={() => setActiveInputTarget('optD')}
                  onChange={(e) => setOptD(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900"
                />
                {optD.trim() && (
                  <div className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 hidden sm:block">
                    <MathRenderer text={optD} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Short answer key (if short answer) */}
          {questionType === 'short-answer' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Đáp án ngắn chuẩn (Key)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 7x^2y^3 hoặc -5 hoặc \frac{1}{2}"
                value={shortAnswerKey}
                onChange={(e) => setShortAnswerKey(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Lời giải thích chi tiết (Hỗ trợ KaTeX, bảng biểu)
            </label>
            <textarea
              rows={2}
              placeholder="Giải thích các bước biến đổi hoặc định lý áp dụng (ví dụ: Áp dụng định lý Pythagoras: $BC = \sqrt{AB^2 + AC^2} = \sqrt{3^2 + 4^2} = 5\text{cm}$)..."
              value={explanation}
              onFocus={() => setActiveInputTarget('explanation')}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
            />
            {explanation.trim() && (
              <div className="mt-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Xem trước lời giải:
                </span>
                <MathRenderer text={explanation} />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl btn-3d-indigo text-xs font-extrabold text-white cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditMode ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
