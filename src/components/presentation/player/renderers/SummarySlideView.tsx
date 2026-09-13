import React from 'react';
import { Award, CheckCircle2, Bookmark, Home } from 'lucide-react';
import { StructuredSlideItem } from '../../../../types/presentationStructure';
import { MathRenderer } from '../../../../games/components/MathRenderer';
import { MediaAssetRenderer } from './MediaAssetRenderer';

interface SummarySlideViewProps {
  slide: StructuredSlideItem;
}

export const SummarySlideView: React.FC<SummarySlideViewProps> = ({ slide }) => {
  const isAssignment = slide.type === 'assignment';

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 md:p-12 text-white bg-slate-950 relative overflow-hidden">
      {/* Background Accent */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isAssignment ? 'bg-purple-600/15' : 'bg-indigo-600/15'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-center shadow-lg ${
              isAssignment
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
            }`}
          >
            {isAssignment ? <Home className="w-6 h-6" /> : <Award className="w-6 h-6" />}
          </div>
          <div>
            <span
              className={`text-[11px] font-black uppercase tracking-widest ${
                isAssignment ? 'text-purple-400' : 'text-indigo-400'
              }`}
            >
              {isAssignment ? 'Hướng dẫn tự học & Dặn dò' : 'Bước 5 • Củng cố & Đánh giá'}
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
            <div className="p-4 md:p-5 rounded-2xl bg-slate-900/90 border border-white/15 text-slate-100 text-sm md:text-base leading-relaxed shadow-md">
              <MathRenderer content={slide.content} />
            </div>
          )}

          {/* Key points / Mindmap bullets */}
          {slide.keyPoints && slide.keyPoints.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAssignment ? 'Nhiệm vụ về nhà:' : 'Nội dung cốt lõi đã học:'}</span>
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {slide.keyPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs md:text-sm font-medium text-slate-200 shadow-sm"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isAssignment ? 'text-purple-400' : 'text-emerald-400'
                      }`}
                    />
                    <div className="leading-relaxed">
                      <MathRenderer content={pt} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
        <span>Chúc các em học tập tốt và hoàn thành bài tập đầy đủ!</span>
      </div>
    </div>
  );
};
