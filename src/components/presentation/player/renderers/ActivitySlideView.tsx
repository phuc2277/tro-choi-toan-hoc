import React from 'react';
import { Users, Compass, CheckSquare, Clock } from 'lucide-react';
import { StructuredSlideItem } from '../../../../types/presentationStructure';
import { MathRenderer } from '../../../../games/components/MathRenderer';
import { MediaAssetRenderer } from './MediaAssetRenderer';

interface ActivitySlideViewProps {
  slide: StructuredSlideItem;
}

export const ActivitySlideView: React.FC<ActivitySlideViewProps> = ({ slide }) => {
  const act = slide.teachingActivity;

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 md:p-12 text-white bg-slate-950 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-400">
              Hoạt động tương tác & Thảo luận nhóm
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              <MathRenderer content={slide.title} />
            </h2>
          </div>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Thời gian: 3 - 5 phút</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="my-auto py-4 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className={`${slide.visuals?.length ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {slide.content && (
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/30 text-purple-100 text-sm md:text-base leading-relaxed">
              <MathRenderer content={slide.content} />
            </div>
          )}

          {act ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Teacher Task */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>Nhiệm vụ của Giáo viên:</span>
                </span>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  <MathRenderer content={act.teacherActivity || 'Hướng dẫn học sinh thảo luận'} />
                </p>
              </div>

              {/* Student Task */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Nhiệm vụ của Học sinh:</span>
                </span>
                <p className="text-xs md:text-sm text-purple-100 leading-relaxed">
                  <MathRenderer content={act.studentActivity || 'Thực hiện nhiệm vụ nhóm'} />
                </p>
              </div>

              {/* Expected Result if available */}
              {act.expectedResponse && (
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs md:text-sm text-emerald-200 flex items-start gap-2.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Sản phẩm kỳ vọng: </span>
                    <MathRenderer content={act.expectedResponse} />
                  </div>
                </div>
              )}
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
        <span>Thảo luận sôi nổi, tích cực phát biểu</span>
      </div>
    </div>
  );
};
