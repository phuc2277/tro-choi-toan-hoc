import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StructuredPresentation,
  StructuredSlideItem,
} from '../../../types/presentationStructure';
import { SlideViewport } from './SlideViewport';
import { SlideControls } from './SlideControls';
import { SlideNavigatorDrawer } from './SlideNavigatorDrawer';
import { BookOpen, FileText, X, AlertCircle, Moon, Sun } from 'lucide-react';
import { MathRenderer } from '../../../games/components/MathRenderer';
import {
  LiveTeachingCanvas,
  TeachingTool,
  DrawingStroke,
} from './teaching/LiveTeachingCanvas';
import { TeachingToolbar } from './teaching/TeachingToolbar';
import { CountdownTimerWidget } from './teaching/CountdownTimerWidget';

interface PresentationPlayerProps {
  presentation: StructuredPresentation;
  initialSlideIndex?: number;
  onExit: () => void;
  isInitialFullscreen?: boolean;
  onOpenExport?: () => void;
  onLaunchGame?: () => void;
}

export const PresentationPlayer: React.FC<PresentationPlayerProps> = ({
  presentation,
  initialSlideIndex = 0,
  onExit,
  isInitialFullscreen = false,
  onOpenExport,
  onLaunchGame,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showTeacherNotes, setShowTeacherNotes] = useState(false);
  const [showSourceInfo, setShowSourceInfo] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [transitionEffect] = useState<'fade' | 'slide' | 'none'>('fade');

  // Teaching Toolkit States
  const [showTeachingTools, setShowTeachingTools] = useState(true);
  const [teachingTool, setTeachingTool] = useState<TeachingTool>('pointer');
  const [penColor, setPenColor] = useState<string>('#ef4444');
  const [penWidth, setPenWidth] = useState<number>(4.5);
  const [highlighterColor, setHighlighterColor] = useState<string>('rgba(250, 204, 21, 0.45)');
  const [highlighterWidth, setHighlighterWidth] = useState<number>(26);
  const [strokesMap, setStrokesMap] = useState<Record<string, DrawingStroke[]>>({});
  const [laserPosition, setLaserPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState<boolean>(false);
  const [focusScreenMode, setFocusScreenMode] = useState<'none' | 'black' | 'white'>('none');

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  const slides: StructuredSlideItem[] = presentation.slides || [];
  const currentSlide = slides[currentSlideIndex];
  const currentSlideKey = currentSlide?.id || `slide-${currentSlideIndex}`;
  const currentSlideStrokes = strokesMap[currentSlideKey] || [];

  // Auto-hide controls logic on inactivity
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3500);
  }, []);

  // Slide navigation handlers
  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
    showControlsTemporarily();
  }, [slides.length, showControlsTemporarily]);

  const handleGoToFirstSlide = useCallback(() => {
    setCurrentSlideIndex(0);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleGoToLastSlide = useCallback(() => {
    setCurrentSlideIndex(Math.max(0, slides.length - 1));
    showControlsTemporarily();
  }, [slides.length, showControlsTemporarily]);

  // Fullscreen management using native Fullscreen API
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.warn('Error attempting to enable fullscreen:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Error attempting to exit fullscreen:', err);
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto enter fullscreen if requested
  useEffect(() => {
    if (isInitialFullscreen && containerRef.current && !document.fullscreenElement) {
      try {
        containerRef.current.requestFullscreen().catch(() => {});
      } catch (e) {}
    }
  }, [isInitialFullscreen]);

  // Auto-play slideshow timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => {
          if (prev >= slides.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000); // 5 seconds per slide
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, slides.length]);

  // Stroke handlers for current slide
  const handleStrokesChange = useCallback((slideKey: string, newStrokes: DrawingStroke[]) => {
    setStrokesMap((prev) => ({
      ...prev,
      [slideKey]: newStrokes,
    }));
  }, []);

  const handleClearSlideStrokes = useCallback(() => {
    setStrokesMap((prev) => ({
      ...prev,
      [currentSlideKey]: [],
    }));
  }, [currentSlideKey]);

  const handleUndoStroke = useCallback(() => {
    setStrokesMap((prev) => {
      const current = prev[currentSlideKey] || [];
      if (current.length === 0) return prev;
      return {
        ...prev,
        [currentSlideKey]: current.slice(0, -1),
      };
    });
  }, [currentSlideKey]);

  // Keyboard navigation & Teaching Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If in focus screen mode, any key resumes presentation
      if (focusScreenMode !== 'none') {
        setFocusScreenMode('none');
        return;
      }

      // If modal drawer is open, let ESC close drawer first
      if (isNavigatorOpen || showTeacherNotes || showSourceInfo || isTimerOpen) {
        if (e.key === 'Escape') {
          setIsNavigatorOpen(false);
          setShowTeacherNotes(false);
          setShowSourceInfo(false);
          setIsTimerOpen(false);
          return;
        }
      }

      // Check if user is typing in an input
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ': // Space
        case 'Enter':
          e.preventDefault();
          handleNextSlide();
          break;

        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          handlePrevSlide();
          break;

        case 'Home':
          e.preventDefault();
          handleGoToFirstSlide();
          break;

        case 'End':
          e.preventDefault();
          handleGoToLastSlide();
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          handleToggleFullscreen();
          break;

        // Teaching Shortcuts
        case 'l':
        case 'L':
          e.preventDefault();
          setTeachingTool((prev) => (prev === 'laser' ? 'pointer' : 'laser'));
          break;

        case 'p':
        case 'P':
          e.preventDefault();
          setTeachingTool((prev) => (prev === 'pen' ? 'pointer' : 'pen'));
          break;

        case 'h':
        case 'H':
          e.preventDefault();
          setTeachingTool((prev) => (prev === 'highlighter' ? 'pointer' : 'highlighter'));
          break;

        case 'e':
        case 'E':
          e.preventDefault();
          setTeachingTool((prev) => (prev === 'eraser' ? 'pointer' : 'eraser'));
          break;

        case 'c':
        case 'C':
          e.preventDefault();
          handleClearSlideStrokes();
          break;

        case 't':
        case 'T':
          e.preventDefault();
          setIsTimerOpen((prev) => !prev);
          break;

        case 'b':
        case 'B':
          e.preventDefault();
          setFocusScreenMode((prev) => (prev === 'black' ? 'none' : 'black'));
          break;

        case 'w':
        case 'W':
          e.preventDefault();
          setFocusScreenMode((prev) => (prev === 'white' ? 'none' : 'white'));
          break;

        case 'Escape':
          // If a drawing tool is active, switch back to normal pointer
          if (teachingTool !== 'pointer') {
            setTeachingTool('pointer');
            return;
          }
          // Esc exits fullscreen natively, or exits player if not in fullscreen
          if (!document.fullscreenElement) {
            onExit();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleNextSlide,
    handlePrevSlide,
    handleGoToFirstSlide,
    handleGoToLastSlide,
    handleToggleFullscreen,
    handleClearSlideStrokes,
    isNavigatorOpen,
    showTeacherNotes,
    showSourceInfo,
    isTimerOpen,
    focusScreenMode,
    teachingTool,
    onExit,
  ]);

  // Touch Swipe for Tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextSlide(); // swipe left -> next
      } else {
        handlePrevSlide(); // swipe right -> prev
      }
    }
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Bài giảng chưa có dữ liệu slide</h2>
        <p className="text-sm text-slate-400 mb-6">Vui lòng tạo hoặc tải lại bài giảng để tiếp tục.</p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={showControlsTemporarily}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden"
    >
      {/* 16:9 Slide Viewport with Live Teaching Canvas Overlay */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <SlideViewport
          slide={currentSlide}
          subjectName={presentation.subject}
          gradeLevel={presentation.grade}
          transitionEffect={transitionEffect}
        />

        {/* Live Inking & Laser Pointer Canvas */}
        <LiveTeachingCanvas
          currentSlideId={currentSlideKey}
          tool={teachingTool}
          penColor={penColor}
          penWidth={penWidth}
          highlighterColor={highlighterColor}
          highlighterWidth={highlighterWidth}
          strokesMap={strokesMap}
          onStrokesChange={handleStrokesChange}
          laserPosition={laserPosition}
          onLaserMove={setLaserPosition}
        />
      </div>

      {/* Focus Screen Overlay (Blackout / Whiteout) */}
      {focusScreenMode === 'black' && (
        <div
          onClick={() => setFocusScreenMode('none')}
          className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center cursor-pointer select-none text-slate-500 animate-in fade-in duration-150"
        >
          <Moon className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
          <p className="text-sm font-bold text-slate-400 tracking-wide">MÀN HÌNH TẠM DỪNG TẬP TRUNG</p>
          <p className="text-xs text-slate-600 mt-1">Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[10px]">B</kbd> hoặc nhấp chuột để tiếp tục trình chiếu</p>
        </div>
      )}

      {focusScreenMode === 'white' && (
        <div
          onClick={() => setFocusScreenMode('none')}
          className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center cursor-pointer select-none text-slate-400 animate-in fade-in duration-150"
        >
          <Sun className="w-10 h-10 text-amber-400 mb-3 animate-pulse" />
          <p className="text-sm font-bold text-slate-700 tracking-wide">BẢNG TRẮNG TẠM DỪNG</p>
          <p className="text-xs text-slate-400 mt-1">Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-[10px]">W</kbd> hoặc nhấp chuột để tiếp tục trình chiếu</p>
        </div>
      )}

      {/* Live Teaching Toolbar (Floats above bottom controls) */}
      {showTeachingTools && (
        <div
          className={`fixed bottom-22 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${
            controlsVisible || isNavigatorOpen || teachingTool !== 'pointer'
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <TeachingToolbar
            currentTool={teachingTool}
            onSelectTool={(t) => setTeachingTool(t)}
            penColor={penColor}
            onChangePenColor={setPenColor}
            penWidth={penWidth}
            onChangePenWidth={setPenWidth}
            highlighterColor={highlighterColor}
            onChangeHighlighterColor={setHighlighterColor}
            hasStrokesOnCurrentSlide={currentSlideStrokes.length > 0}
            onClearSlideStrokes={handleClearSlideStrokes}
            onUndoStroke={handleUndoStroke}
            isTimerOpen={isTimerOpen}
            onToggleTimer={() => setIsTimerOpen((prev) => !prev)}
            focusScreenMode={focusScreenMode}
            onToggleFocusScreen={(mode) => setFocusScreenMode((prev) => (prev === mode ? 'none' : mode))}
          />
        </div>
      )}

      {/* Slide Navigation & Controls Overlay */}
      <SlideControls
        currentSlideIndex={currentSlideIndex}
        totalSlides={slides.length}
        onPrevSlide={handlePrevSlide}
        onNextSlide={handleNextSlide}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isNavigatorOpen={isNavigatorOpen}
        onToggleNavigator={() => setIsNavigatorOpen((prev) => !prev)}
        isAutoPlaying={isAutoPlaying}
        onToggleAutoPlay={() => setIsAutoPlaying((prev) => !prev)}
        showTeacherNotes={showTeacherNotes}
        onToggleTeacherNotes={() => setShowTeacherNotes((prev) => !prev)}
        showSourceInfo={showSourceInfo}
        onToggleSourceInfo={() => setShowSourceInfo((prev) => !prev)}
        showTeachingTools={showTeachingTools}
        onToggleTeachingTools={() => setShowTeachingTools((prev) => !prev)}
        onOpenExport={onOpenExport}
        onLaunchGame={onLaunchGame}
        onExit={onExit}
        isVisible={controlsVisible || isNavigatorOpen || teachingTool !== 'pointer'}
      />

      {/* Activity Countdown Timer Floating Widget */}
      <CountdownTimerWidget
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />

      {/* Slide Drawer Navigator */}
      <SlideNavigatorDrawer
        isOpen={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        slides={slides}
        currentSlideIndex={currentSlideIndex}
        onSelectSlide={(idx) => setCurrentSlideIndex(idx)}
      />

      {/* Teacher Notes Modal / Drawer */}
      {showTeacherNotes && (
        <div className="fixed top-6 right-6 z-50 w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-3xl p-5 shadow-2xl text-white animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Ghi chú sư phạm dành cho giáo viên</span>
            </div>
            <button
              onClick={() => setShowTeacherNotes(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs md:text-sm text-slate-200 leading-relaxed max-h-72 overflow-y-auto pr-1">
            {currentSlide.teacherNotes ? (
              <MathRenderer content={currentSlide.teacherNotes} />
            ) : (
              <p className="text-slate-400 italic">
                Chưa có ghi chú đặc biệt cho slide này. Giáo viên có thể tự do phát triển hoạt động giảng dạy.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Source Reference Modal / Drawer */}
      {showSourceInfo && (
        <div className="fixed top-6 left-6 z-50 w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-3xl p-5 shadow-2xl text-white animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Nguồn tài liệu SGK & Giáo án</span>
            </div>
            <button
              onClick={() => setShowSourceInfo(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-xs text-slate-200 max-h-72 overflow-y-auto pr-1">
            {currentSlide.sourceReferences && currentSlide.sourceReferences.length > 0 ? (
              currentSlide.sourceReferences.map((src, sIdx) => (
                <div key={sIdx} className="p-3 bg-slate-950/80 rounded-xl border border-white/10 space-y-1">
                  <div className="font-bold text-cyan-300 flex items-center justify-between">
                    <span>{src.documentName}</span>
                    {src.page && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-200">
                        Trang {src.page}
                      </span>
                    )}
                  </div>
                  {src.sectionTitle && (
                    <p className="text-[11px] text-slate-400 italic">Mục: {src.sectionTitle}</p>
                  )}
                  {src.isDirectQuote && (
                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300">
                      Trích dẫn nguyên văn
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">
                Nội dung được chuẩn hóa tổng hợp theo chuẩn kiến thức kỹ năng môn {presentation.subject} lớp{' '}
                {presentation.grade}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
