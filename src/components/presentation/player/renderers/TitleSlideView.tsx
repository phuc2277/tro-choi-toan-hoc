import React from 'react';
import { BookOpen, Sparkles, Award } from 'lucide-react';
import { StructuredSlideItem } from '../../../../types/presentationStructure';
import { MathRenderer } from '../../../../games/components/MathRenderer';
import { MediaAssetRenderer } from './MediaAssetRenderer';

interface TitleSlideViewProps {
  slide: StructuredSlideItem;
  subjectName?: string;
  gradeLevel?: number;
}

export const TitleSlideView: React.FC<TitleSlideViewProps> = ({
  slide,
  subjectName = 'Toán học',
  gradeLevel = 8,
}) => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-10 md:p-14 text-white relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      {/* Top Meta Badge */}
      <div className="flex items-center justify-between relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 font-bold text-xs uppercase tracking-widest shadow-inner">
          <BookOpen className="w-3.5 h-3.5" />
          <span>
            {subjectName} • Lớp {gradeLevel}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
          <Award className="w-3.5 h-3.5" />
          <span>Chương trình GDPT 2018</span>
        </div>
      </div>

      {/* Center Main Title */}
      <div className="my-auto text-center relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 mb-4 text-indigo-400 font-extrabold text-sm uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>BÀI GIẢNG ĐIỆN TỬ TƯƠNG TÁC</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-4 drop-shadow-md">
          <MathRenderer content={slide.title} />
        </h1>

        {slide.subtitle && (
          <p className="text-lg md:text-2xl font-medium text-slate-300 max-w-3xl leading-relaxed mb-6">
            <MathRenderer content={slide.subtitle} />
          </p>
        )}

        {slide.content && (
          <div className="text-sm md:text-base text-slate-400 max-w-2xl font-light">
            <MathRenderer content={slide.content} />
          </div>
        )}

        {slide.visuals && slide.visuals.length > 0 && (
          <div className="max-w-md mt-4">
            <MediaAssetRenderer visuals={slide.visuals} />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10 relative z-10">
        <span>Bộ Giáo dục và Đào tạo</span>
        <span className="italic">Chuẩn tiến trình sư phạm 5 bước</span>
      </div>
    </div>
  );
};
