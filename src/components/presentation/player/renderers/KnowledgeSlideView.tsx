import React from 'react';
import { BookOpen, Key, Zap, CheckCircle2 } from 'lucide-react';
import { StructuredSlideItem } from '../../../../types/presentationStructure';
import { MathRenderer } from '../../../../games/components/MathRenderer';
import { MediaAssetRenderer } from './MediaAssetRenderer';

interface KnowledgeSlideViewProps {
  slide: StructuredSlideItem;
}

export const KnowledgeSlideView: React.FC<KnowledgeSlideViewProps> = ({ slide }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-8 md:p-12 text-white bg-slate-950 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">
              Bước 2 • Hình thành kiến thức mới
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              <MathRenderer content={slide.title} />
            </h2>
          </div>
        </div>

        {slide.formulas && slide.formulas.length > 0 && (
          <div className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-indigo-950/80 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Trọng tâm lý thuyết</span>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="my-auto py-4 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className={`${slide.visuals?.length ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {/* Main concept / definition */}
          {slide.content && (
            <div className="p-4 md:p-5 rounded-2xl bg-slate-900/90 border border-white/15 text-slate-100 text-sm md:text-base leading-relaxed shadow-md">
              <MathRenderer content={slide.content} />
            </div>
          )}

          {/* Formulas / Equations Box */}
          {slide.formulas && slide.formulas.length > 0 && (
            <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900/90 border-2 border-indigo-500/40 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Công thức / Quy tắc trọng tâm:</span>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                {slide.formulas.map((formula, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-3 bg-black/40 rounded-xl border border-indigo-500/20 text-base md:text-xl font-bold text-center text-amber-300 overflow-x-auto"
                  >
                    <MathRenderer content={formula} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {slide.keyPoints && slide.keyPoints.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Điểm cốt lõi cần nhớ:</span>
              </span>
              <div className="grid grid-cols-1 gap-2">
                {slide.keyPoints.map((point, kIdx) => (
                  <div
                    key={kIdx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/30 transition text-xs md:text-sm font-medium text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <MathRenderer content={point} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visual Assets if available */}
        {slide.visuals && slide.visuals.length > 0 && (
          <div className="lg:col-span-5">
            <MediaAssetRenderer visuals={slide.visuals} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-400 flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
        <span>Ghi chép nội dung trọng tâm vào vở</span>
      </div>
    </div>
  );
};
