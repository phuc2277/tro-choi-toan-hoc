import React from 'react';
import { Target, Flame, Lightbulb, Compass } from 'lucide-react';
import { StructuredSlideItem } from '../../../../types/presentationStructure';
import { MathRenderer } from '../../../../games/components/MathRenderer';
import { MediaAssetRenderer } from './MediaAssetRenderer';

interface ObjectiveWarmupSlideViewProps {
  slide: StructuredSlideItem;
}

export const ObjectiveWarmupSlideView: React.FC<ObjectiveWarmupSlideViewProps> = ({ slide }) => {
  const isWarmup = slide.type === 'warmup';

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 md:p-12 text-white bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isWarmup ? 'bg-amber-600/15' : 'bg-emerald-600/15'
        }`}
      />

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 relative z-10">
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-center shadow-lg ${
            isWarmup
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}
        >
          {isWarmup ? <Flame className="w-6 h-6" /> : <Target className="w-6 h-6" />}
        </div>
        <div>
          <span
            className={`text-[11px] font-black uppercase tracking-widest ${
              isWarmup ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {isWarmup ? 'Bước 1 • Khởi động & Tạo hứng thú' : 'Mục tiêu bài học cần đạt'}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            <MathRenderer content={slide.title} />
          </h2>
        </div>
      </div>

      {/* Content Body */}
      <div className="my-auto py-4 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className={`${slide.visuals?.length ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {slide.content && (
            <div
              className={`p-4 md:p-5 rounded-2xl border text-sm md:text-base leading-relaxed ${
                isWarmup
                  ? 'bg-amber-950/20 border-amber-800/30 text-amber-100'
                  : 'bg-emerald-950/20 border-emerald-800/30 text-emerald-100'
              }`}
            >
              <MathRenderer content={slide.content} />
            </div>
          )}

          {slide.keyPoints && slide.keyPoints.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isWarmup ? 'Nhiệm vụ khởi động:' : 'Yêu cầu cần đạt:'}</span>
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {slide.keyPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/20 transition shadow-sm"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isWarmup
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="text-sm md:text-base font-medium text-slate-200 leading-snug">
                      <MathRenderer content={point} />
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

      {/* Footer Notes */}
      <div className="text-xs text-slate-400 flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Học sinh chủ động tiếp nhận và ghi nhớ mục tiêu</span>
        </span>
      </div>
    </div>
  );
};
