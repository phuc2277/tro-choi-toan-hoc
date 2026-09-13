import React, { useState } from 'react';
import { QuestionBlock } from '../../../types/contentBlock';
import { MathRenderer } from '../../../games/components/MathRenderer';
import { HelpCircle, Eye, EyeOff, CheckCircle2, BookOpen } from 'lucide-react';

interface QuestionBlockRendererProps {
  block: QuestionBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: QuestionBlock['content']) => void;
  onOpenQuestionBankModal?: () => void;
}

export const QuestionBlockRenderer: React.FC<QuestionBlockRendererProps> = ({
  block,
  isEditor = false,
  onUpdate,
  onOpenQuestionBankModal,
}) => {
  const { content } = block;
  const [showAnswer, setShowAnswer] = useState(content.showAnswerByDefault || false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const options = content.options || [
    { id: 'opt_a', label: 'A', text: 'Phương án A' },
    { id: 'opt_b', label: 'B', text: 'Phương án B' },
    { id: 'opt_c', label: 'C', text: 'Phương án C' },
    { id: 'opt_d', label: 'D', text: 'Phương án D' },
  ];

  return (
    <div className="w-full h-full p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-orange-50/40 border-2 border-amber-200/90 shadow-md flex flex-col justify-between overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-100/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-900">
            {content.questionId ? 'Câu hỏi từ Ngân hàng' : 'Câu hỏi tương tác'}
          </span>
          {content.difficulty && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                content.difficulty === 'easy'
                  ? 'bg-emerald-100 text-emerald-700'
                  : content.difficulty === 'medium'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {content.difficulty === 'easy' ? 'Nhận biết' : content.difficulty === 'medium' ? 'Thông hiểu' : 'Vận dụng'}
            </span>
          )}
        </div>

        {isEditor ? (
          onOpenQuestionBankModal && (
            <button
              type="button"
              onClick={onOpenQuestionBankModal}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Đổi câu từ Ngân hàng</span>
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            {showAnswer ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ẩn đáp án</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Hiện đáp án</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Question Content */}
      <div className="my-3 text-slate-800 font-semibold text-sm sm:text-base leading-relaxed">
        {isEditor ? (
          <textarea
            value={content.content}
            onChange={(e) => onUpdate?.({ ...content, content: e.target.value })}
            placeholder="Nhập đề bài câu hỏi (hỗ trợ công thức KaTeX $...$)..."
            className="w-full p-2 bg-white border border-amber-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400"
            rows={2}
          />
        ) : (
          <MathRenderer text={content.content} />
        )}
      </div>

      {/* Options Grid (A, B, C, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
        {options.map((opt) => {
          const isCorrect = opt.label === content.correctAnswer;
          const isUserSelected = selectedChoice === opt.label;

          let optionStyle = 'bg-white border-slate-200 text-slate-800 hover:border-amber-300';
          if (showAnswer && isCorrect) {
            optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20';
          } else if (isUserSelected && !showAnswer) {
            optionStyle = 'bg-amber-50 border-amber-500 text-amber-900 font-bold ring-2 ring-amber-400/30';
          }

          return (
            <div
              key={opt.id}
              onClick={() => {
                if (!isEditor) {
                  setSelectedChoice(opt.label);
                }
              }}
              className={`p-2.5 rounded-xl border transition flex items-start gap-2.5 ${optionStyle} ${!isEditor ? 'cursor-pointer active:scale-98' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  showAnswer && isCorrect
                    ? 'bg-emerald-600 text-white'
                    : isUserSelected
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {opt.label}
              </div>
              <div className="flex-1 text-xs sm:text-sm font-medium pt-0.5">
                {isEditor ? (
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const updatedOpts = options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o));
                      onUpdate?.({ ...content, options: updatedOpts });
                    }}
                    className="w-full bg-transparent border-b border-transparent focus:border-amber-400 outline-none"
                  />
                ) : (
                  <MathRenderer text={opt.text} />
                )}
              </div>
              {showAnswer && isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Answer & Explanation (when revealed) */}
      {showAnswer && (
        <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm animate-in fade-in duration-200">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đáp án chính xác: Phương án {content.correctAnswer}</span>
          </div>
          {content.solution && (
            <div className="text-slate-700 leading-relaxed pl-5 font-normal">
              <span className="font-semibold text-emerald-700">Lời giải chi tiết: </span>
              <MathRenderer text={content.solution} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
