import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Menu,
  Play,
  Pause,
  BookOpen,
  FileText,
  PenTool,
  Download,
  Gamepad2,
  X,
} from 'lucide-react';

interface SlideControlsProps {
  currentSlideIndex: number;
  totalSlides: number;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isNavigatorOpen: boolean;
  onToggleNavigator: () => void;
  isAutoPlaying: boolean;
  onToggleAutoPlay: () => void;
  showTeacherNotes: boolean;
  onToggleTeacherNotes: () => void;
  showSourceInfo: boolean;
  onToggleSourceInfo: () => void;
  showTeachingTools: boolean;
  onToggleTeachingTools: () => void;
  onOpenExport?: () => void;
  onLaunchGame?: () => void;
  onExit: () => void;
  isVisible: boolean;
}

export const SlideControls: React.FC<SlideControlsProps> = ({
  currentSlideIndex,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  isFullscreen,
  onToggleFullscreen,
  isNavigatorOpen,
  onToggleNavigator,
  isAutoPlaying,
  onToggleAutoPlay,
  showTeacherNotes,
  onToggleTeacherNotes,
  showSourceInfo,
  onToggleSourceInfo,
  showTeachingTools,
  onToggleTeachingTools,
  onOpenExport,
  onLaunchGame,
  onExit,
  isVisible,
}) => {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl text-white">
        {/* Previous Slide */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevSlide();
          }}
          disabled={currentSlideIndex <= 0}
          title="Slide trước (← hoặc Phím cách)"
          className="p-2.5 rounded-xl hover:bg-white/15 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Slide Counter / Navigator Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleNavigator();
          }}
          title="Mở danh sách slide"
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
        >
          <Menu className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {currentSlideIndex + 1} / {totalSlides}
          </span>
        </button>

        {/* Next Slide */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNextSlide();
          }}
          disabled={currentSlideIndex >= totalSlides - 1}
          title="Slide tiếp (→ hoặc Enter)"
          className="p-2.5 rounded-xl hover:bg-white/15 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-6 bg-white/20 mx-1" />

        {/* Auto Play Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAutoPlay();
          }}
          title={isAutoPlaying ? 'Tạm dừng tự động chạy' : 'Bật tự động trình chiếu (5s/slide)'}
          className={`p-2 rounded-xl transition cursor-pointer ${
            isAutoPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'hover:bg-white/15 text-slate-300'
          }`}
        >
          {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Teacher Notes Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleTeacherNotes();
          }}
          title="Ghi chú giáo viên"
          className={`p-2 rounded-xl transition cursor-pointer ${
            showTeacherNotes
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'hover:bg-white/15 text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Source Reference Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSourceInfo();
          }}
          title="Xem nguồn tài liệu SGK"
          className={`p-2 rounded-xl transition cursor-pointer ${
            showSourceInfo
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'hover:bg-white/15 text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Teaching Tools Toggle (Pen, Laser, Timer, Focus Screen) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleTeachingTools();
          }}
          title={showTeachingTools ? 'Ẩn thanh công cụ trợ giảng' : 'Bật công cụ trợ giảng (Bút vẽ, Laser, Đồng hồ đếm ngược)'}
          className={`p-2 rounded-xl transition cursor-pointer ${
            showTeachingTools
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'hover:bg-white/15 text-slate-300'
          }`}
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* AI Gesture Game Quick Trigger */}
        {onLaunchGame && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLaunchGame();
            }}
            title="Bật Trò chơi Cử chỉ AI qua Camera (Học sinh giơ tay A/B/C/D)"
            className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border border-purple-500/40 transition cursor-pointer shadow-sm"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
        )}

        {/* Export PPTX / PDF Quick Trigger */}
        {onOpenExport && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenExport();
            }}
            title="Xuất bài giảng sang PowerPoint (.pptx) / PDF / Kế hoạch CV 5512"
            className="p-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/35 text-orange-300 border border-orange-500/40 transition cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F)'}
          className="p-2 rounded-xl hover:bg-white/15 text-slate-300 transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <div className="w-[1px] h-6 bg-white/20 mx-1" />

        {/* Exit Presentation */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExit();
          }}
          title="Thoát trình chiếu"
          className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-300 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
