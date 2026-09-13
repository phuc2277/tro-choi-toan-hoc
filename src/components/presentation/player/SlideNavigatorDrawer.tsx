import React from 'react';
import { X, CheckCircle, BookOpen, Target, FileText, HelpCircle, Award } from 'lucide-react';
import { StructuredSlideItem, SlideType } from '../../../types/presentationStructure';
import { MathRenderer } from '../../../games/components/MathRenderer';

interface SlideNavigatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  slides: StructuredSlideItem[];
  currentSlideIndex: number;
  onSelectSlide: (index: number) => void;
}

const getSlideTypeIcon = (type: SlideType) => {
  switch (type) {
    case 'title':
      return <BookOpen className="w-4 h-4 text-indigo-400" />;
    case 'objective':
    case 'warmup':
      return <Target className="w-4 h-4 text-amber-400" />;
    case 'knowledge':
      return <FileText className="w-4 h-4 text-cyan-400" />;
    case 'example':
    case 'practice':
    case 'application':
      return <HelpCircle className="w-4 h-4 text-emerald-400" />;
    case 'summary':
    case 'assignment':
      return <Award className="w-4 h-4 text-purple-400" />;
    default:
      return <FileText className="w-4 h-4 text-slate-400" />;
  }
};

const getSlideTypeLabel = (type: SlideType) => {
  switch (type) {
    case 'title':
      return 'Trang bìa';
    case 'objective':
      return 'Mục tiêu';
    case 'warmup':
      return 'Khởi động';
    case 'knowledge':
      return 'Kiến thức';
    case 'example':
      return 'Ví dụ mẫu';
    case 'activity':
      return 'Hoạt động';
    case 'practice':
      return 'Luyện tập';
    case 'application':
      return 'Vận dụng';
    case 'summary':
      return 'Tổng kết';
    case 'assignment':
      return 'Dặn dò';
    default:
      return 'Slide';
  }
};

export const SlideNavigatorDrawer: React.FC<SlideNavigatorDrawerProps> = ({
  isOpen,
  onClose,
  slides,
  currentSlideIndex,
  onSelectSlide,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="flex-1 h-full" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-sm h-full bg-slate-900 border-l border-white/15 p-6 flex flex-col justify-between shadow-2xl text-white animate-slideLeft">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-black text-white">Mục lục bài giảng</h3>
            <p className="text-xs text-slate-400">Chọn slide để chuyển trực tiếp</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5 custom-scrollbar pr-1">
          {slides.map((slide, idx) => {
            const isCurrent = idx === currentSlideIndex;
            return (
              <button
                key={slide.id || idx}
                onClick={() => {
                  onSelectSlide(idx);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl text-left transition flex items-start gap-3 border cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-white/5 hover:border-white/20 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                {/* Order Badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* Content info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {getSlideTypeIcon(slide.type)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {getSlideTypeLabel(slide.type)}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate">
                    <MathRenderer content={slide.title || 'Slide không có tiêu đề'} />
                  </h4>
                </div>

                {isCurrent && (
                  <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <span>Tổng số: {slides.length} slide</span>
          <span className="text-indigo-400 font-semibold">GDPT 2018</span>
        </div>
      </div>
    </div>
  );
};
