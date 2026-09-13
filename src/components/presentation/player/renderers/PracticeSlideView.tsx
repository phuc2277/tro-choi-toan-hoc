import React, { useState } from 'react';
import { PenTool, HelpCircle, Check, Eye, EyeOff } from 'lucide-react';
import { StructuredSlideItem } from '../../../../types/presentationStructure';
import { MathRenderer } from '../../../../games/components/MathRenderer';
import { MediaAssetRenderer } from './MediaAssetRenderer';

interface PracticeSlideViewProps {
  slide: StructuredSlideItem;
}

export const PracticeSlideView: React.FC<PracticeSlideViewProps> = ({ slide }) => {
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const isApplication = slide.type === 'application';
  const questions = slide.interactionQuestions || [];

  const toggleReveal = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSelectOption = (qIdx: number, oIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
    // Auto reveal feedback when selected
    setRevealedAnswers((prev) => ({ ...prev, [qIdx]: true }));
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 md:p-12 text-white bg-slate-950 relative overflow-hidden">
      {/* Background Accent */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isApplication ? 'bg-amber-600/10' : 'bg-emerald-600/10'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-center shadow-lg ${
              isApplication
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <span
              className={`text-[11px] font-black uppercase tracking-widest ${
                isApplication ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isApplication ? 'Bước 4 • Vận dụng thực tiễn' : 'Bước 3 • Luyện tập & Củng cố'}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              <MathRenderer content={slide.title} />
            </h2>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="my-auto py-4 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className={`${slide.visuals?.length ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {slide.content && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-slate-200 text-sm md:text-base leading-relaxed">
              <MathRenderer content={slide.content} />
            </div>
          )}

          {/* Interactive Questions Display */}
          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((q, qIdx) => {
                const isRevealed = revealedAnswers[qIdx] || false;
                return (
                  <div
                    key={qIdx}
                    className="p-4 md:p-5 rounded-2xl bg-slate-900/90 border border-white/15 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="p-1 px-2 rounded-lg bg-indigo-500/20 text-indigo-300 font-black text-xs shrink-0 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Câu {qIdx + 1}</span>
                        </span>
                        <div className="text-sm md:text-base font-bold text-white leading-relaxed">
                          <MathRenderer content={q.questionText} />
                        </div>
                      </div>

                      {q.answer && (
                        <button
                          onClick={() => toggleReveal(qIdx)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-slate-300 font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{isRevealed ? 'Ẩn đáp án' : 'Xem đáp án'}</span>
                        </button>
                      )}
                    </div>

                    {/* Options if Multiple Choice */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isSelected = selectedAnswers[qIdx] === oIdx;
                          const cleanAns = (q.answer || '').trim().toUpperCase();
                          const optText = typeof opt === 'string' ? opt : (opt.text || opt.key || '');
                          const isThisCorrect = cleanAns === letter || cleanAns.startsWith(letter + '.') || (optText && cleanAns.includes(optText.trim().toUpperCase()));
                          
                          let styleClasses = 'bg-black/40 border-white/10 hover:border-cyan-400/50 hover:bg-slate-800/60 text-slate-200';
                          if (isRevealed) {
                            if (isThisCorrect) {
                              styleClasses = 'bg-emerald-950/70 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400';
                            } else if (isSelected) {
                              styleClasses = 'bg-rose-950/70 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.2)] ring-1 ring-rose-400';
                            }
                          } else if (isSelected) {
                            styleClasses = 'bg-cyan-950/70 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400';
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleSelectOption(qIdx, oIdx)}
                              className={`p-2.5 px-3 rounded-xl border text-xs md:text-sm text-left flex items-center gap-2.5 transition cursor-pointer active:scale-98 ${styleClasses}`}
                            >
                              <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 transition ${
                                isRevealed && isThisCorrect
                                  ? 'bg-emerald-500 text-slate-950 font-bold'
                                  : isRevealed && isSelected
                                  ? 'bg-rose-500 text-white font-bold'
                                  : isSelected
                                  ? 'bg-cyan-500 text-slate-950 font-bold'
                                  : 'bg-white/10 text-slate-300'
                              }`}>
                                {letter}
                              </span>
                              <div className="leading-snug font-medium flex-1">
                                <MathRenderer content={opt} />
                              </div>
                              {isRevealed && isThisCorrect && (
                                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Revealed Answer Box */}
                    {isRevealed && q.answer && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs md:text-sm text-emerald-200 flex items-start gap-2 animate-fadeIn">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Đáp án đúng: </span>
                          <MathRenderer content={q.answer} />
                          {q.explanation && (
                            <p className="text-xs text-slate-300 mt-1 italic">
                              Giải thích: {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            slide.keyPoints && (
              <div className="space-y-2">
                {slide.keyPoints.map((pt, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs md:text-sm text-slate-200"
                  >
                    <MathRenderer content={pt} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {slide.visuals && slide.visuals.length > 0 && (
          <div className="lg:col-span-5">
            <MediaAssetRenderer visuals={slide.visuals} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-400 flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
        <span>Làm bài tập vào vở hoặc bảng con</span>
      </div>
    </div>
  );
};
