import React, { useState } from 'react';
import {
  X,
  Play,
  Maximize2,
  BookOpen,
  CheckCircle,
  FileText,
  HelpCircle,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  StructuredPresentation,
  StructuredSlideItem,
  SlideType,
} from '../../../types/presentationStructure';
import { SlideViewport } from './SlideViewport';
import { MathRenderer } from '../../../games/components/MathRenderer';

interface PresentationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: StructuredPresentation;
  onStartPresentation: (startSlideIndex?: number) => void;
}

const getSlideTypeBadge = (type: SlideType) => {
  switch (type) {
    case 'title':
      return { label: 'Trang bìa', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    case 'objective':
      return { label: 'Mục tiêu', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'warmup':
      return { label: 'Khởi động', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'knowledge':
      return { label: 'Kiến thức', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    case 'example':
      return { label: 'Ví dụ mẫu', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    case 'activity':
      return { label: 'Hoạt động', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'practice':
      return { label: 'Luyện tập', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'application':
      return { label: 'Vận dụng', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'summary':
      return { label: 'Củng cố', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'assignment':
      return { label: 'Dặn dò', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    default:
      return { label: 'Slide', color: 'bg-white/10 text-slate-300 border-white/10' };
  }
};

export const PresentationPreviewModal: React.FC<PresentationPreviewModalProps> = ({
  isOpen,
  onClose,
  presentation,
  onStartPresentation,
}) => {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  if (!isOpen) return null;

  const slides: StructuredSlideItem[] = presentation.slides || [];
  const currentSlide = slides[selectedSlideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-7xl h-[92vh] bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Navigation Bar */}
        <div className="p-4 md:px-6 bg-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {presentation.subject} • Lớp {presentation.grade}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {slides.length} slide • Bản v{presentation.version}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-white truncate max-w-xl">
                <MathRenderer content={presentation.title} />
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartPresentation(selectedSlideIndex)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt đầu trình chiếu</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Left Thumbnail List + Right 16:9 Viewport Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Thumbnail Column */}
          <div className="w-72 md:w-80 bg-slate-950/80 border-r border-white/10 flex flex-col">
            <div className="p-3.5 border-b border-white/5 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Danh sách slide</span>
              <span>{slides.length} mục</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {slides.map((slide, idx) => {
                const isSelected = idx === selectedSlideIndex;
                const badge = getSlideTypeBadge(slide.type);

                return (
                  <button
                    key={slide.id || idx}
                    onClick={() => setSelectedSlideIndex(idx)}
                    className={`w-full p-3 rounded-2xl text-left transition flex items-start gap-3 border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/15 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 truncate">
                        <MathRenderer content={slide.title || 'Slide không có tiêu đề'} />
                      </h4>
                    </div>

                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Preview Viewport */}
          <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden relative">
            {currentSlide ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-full h-full max-h-[80vh] flex items-center justify-center">
                  <SlideViewport
                    slide={currentSlide}
                    subjectName={presentation.subject}
                    gradeLevel={presentation.grade}
                    transitionEffect="fade"
                  />
                </div>

                {/* Bottom Quick Info & Fullscreen Button */}
                <div className="w-full max-w-4xl flex items-center justify-between pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>
                      Slide {selectedSlideIndex + 1} / {slides.length}
                    </span>
                    {currentSlide.sourceReferences && currentSlide.sourceReferences.length > 0 && (
                      <span className="text-cyan-400 flex items-center gap-1 font-medium">
                        <BookOpen className="w-3.5 h-3.5" />
                        Nguồn: {currentSlide.sourceReferences[0].documentName}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onStartPresentation(selectedSlideIndex)}
                    className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white font-bold transition cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Mở toàn màn hình</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Chưa có slide nào được chọn</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
