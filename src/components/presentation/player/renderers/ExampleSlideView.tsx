import React from 'react';
import { HelpCircle, CheckCircle, FileText, ChevronRight } from 'lucide-react';
import { StructuredSlideItem } from '../../../../types/presentationStructure';
import { MathRenderer } from '../../../../games/components/MathRenderer';
import { MediaAssetRenderer } from './MediaAssetRenderer';

interface ExampleSlideViewProps {
  slide: StructuredSlideItem;
}

export const ExampleSlideView: React.FC<ExampleSlideViewProps> = ({ slide }) => {
  const examples = slide.examples || [];

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 md:p-12 text-white bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">
              Ví dụ mẫu & Phân tích giải
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
            <div className="text-sm md:text-base text-slate-300">
              <MathRenderer content={slide.content} />
            </div>
          )}

          {/* Example Boxes */}
          {examples.length > 0 ? (
            <div className="space-y-4">
              {examples.map((ex, exIdx) => (
                <div
                  key={exIdx}
                  className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 overflow-hidden shadow-lg"
                >
                  {/* Problem Statement */}
                  <div className="p-4 bg-cyan-950/40 border-b border-cyan-500/20 flex items-start gap-3">
                    <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-black text-xs shrink-0 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Bài toán</span>
                    </span>
                    <div className="text-sm md:text-base font-semibold text-cyan-100 leading-relaxed">
                      <MathRenderer content={ex.problem} />
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="p-4 bg-slate-950/80 flex items-start gap-3">
                    <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs shrink-0 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Lời giải</span>
                    </span>
                    <div className="text-sm md:text-base text-slate-200 leading-relaxed space-y-1">
                      <MathRenderer content={ex.solution} />
                      {ex.explanation && (
                        <div className="text-xs text-amber-300/90 italic pt-1 border-t border-white/5 mt-2 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3 shrink-0" />
                          <span>Lưu ý: {ex.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Fallback if examples array is empty but content has example
            slide.content && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 text-slate-200">
                <MathRenderer content={slide.content} />
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
        <span>Quan sát kỹ các bước biến đổi mẫu</span>
      </div>
    </div>
  );
};
