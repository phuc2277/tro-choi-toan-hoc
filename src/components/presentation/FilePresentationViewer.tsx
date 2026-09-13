import React, { useState } from 'react';
import { UploadFilePresentation, SlideItem, StructuredLecture } from '../../types/teacherLesson';
import { buildSlidesFromPresentation } from './SlidePresentationModal';
import { MathRenderer } from '../../games/components/MathRenderer';
import {
  Play,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  FileText,
  BookOpen,
  Target,
  Flame,
  CheckCircle2,
  HelpCircle,
  Layers,
  Wand2,
  Loader2,
  Check,
  Eye,
  Trash2,
} from 'lucide-react';

interface FilePresentationViewerProps {
  presentation: UploadFilePresentation;
  lessonTitle: string;
  lessonSubject?: string;
  lessonGrade?: number;
  onOpenFullscreen: () => void;
  onDelete?: () => void;
}

export const FilePresentationViewer: React.FC<FilePresentationViewerProps> = ({
  presentation,
  lessonTitle,
  lessonSubject = 'Toán học',
  lessonGrade = 8,
  onOpenFullscreen,
  onDelete,
}) => {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [showAllSlidesGrid, setShowAllSlidesGrid] = useState(false);
  const [showRawTextModal, setShowRawTextModal] = useState(false);

  const slides: SlideItem[] = buildSlidesFromPresentation(
    presentation,
    presentation.lecture,
    presentation.slides,
    lessonTitle,
    lessonSubject,
    lessonGrade
  );

  const currentSlide = slides[activeSlideIdx] || slides[0];

  const handleDownload = () => {
    const downloadUrl = presentation.fileData || presentation.fileUrl;
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = presentation.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create a text file with presentation content if raw fileUrl is not available
      const content = slides
        .map(
          (s, i) =>
            `--- SLIDE ${i + 1}: ${s.title} ---\n${s.description || ''}\n${s.content || ''}\n${
              s.keyPoints?.map((p) => `• ${p}`).join('\n') || ''
            }\n`
        )
        .join('\n\n');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentation.fileName.replace(/\.[^/.]+$/, '')}_NoiDungSlide.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const isPpt =
    presentation.fileType === 'pptx' ||
    presentation.fileType === 'ppt' ||
    presentation.fileName.toLowerCase().endsWith('.pptx') ||
    presentation.fileName.toLowerCase().endsWith('.ppt');

  const isPdf =
    presentation.fileType === 'pdf' ||
    presentation.fileName.toLowerCase().endsWith('.pdf');

  const isDocx =
    presentation.fileType === 'docx' ||
    presentation.fileName.toLowerCase().endsWith('.docx') ||
    presentation.fileName.toLowerCase().endsWith('.doc');

  return (
    <div className="space-y-5">
      {/* Top Document Header & Quick Actions Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
              isPpt
                ? 'bg-amber-600 text-white shadow-amber-900/40'
                : isPdf
                ? 'bg-rose-600 text-white shadow-rose-900/40'
                : isDocx
                ? 'bg-blue-600 text-white shadow-blue-900/40'
                : 'bg-indigo-600 text-white shadow-indigo-900/40'
            }`}
          >
            {isPpt ? 'PPTX' : isPdf ? 'PDF' : isDocx ? 'DOCX' : 'FILE'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {presentation.title}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                {isPpt ? 'PowerPoint' : isPdf ? 'Tài liệu PDF' : isDocx ? 'Giáo án Word' : 'Tập tin'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
              <span>Tệp: <strong className="text-slate-200">{presentation.fileName}</strong></span>
              <span>•</span>
              <span>Dung lượng: <strong className="text-slate-200">{presentation.fileSizeFormatted}</strong></span>
              <span>•</span>
              <span>Số slide/trang: <strong className="text-indigo-300">{slides.length} Slide</strong></span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            id="btn-open-presentation-modal"
            type="button"
            onClick={onOpenFullscreen}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/40 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Mở trình chiếu (F5)</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            title="Tải tệp về máy"
          >
            <Download className="w-4 h-4" />
          </button>

          {onDelete && (
            <button
              id="btn-file-viewer-delete"
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-900/90 text-red-300 hover:text-white border border-red-800/80 transition cursor-pointer text-xs sm:text-sm font-bold shadow-sm"
              title="Xóa tệp bài giảng này"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Xóa tệp</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Presentation Canvas Viewport */}
      <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-xl overflow-hidden flex flex-col">
        {/* Viewport Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-[11px] font-bold text-white tracking-wider flex items-center gap-1.5 shadow-xs">
              <span>SLIDE</span>
              <span>{activeSlideIdx + 1}/{slides.length}</span>
            </div>
            <div className="text-xs font-semibold text-slate-300 truncate max-w-xs sm:max-w-md">
              {currentSlide.title}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllSlidesGrid((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                showAllSlidesGrid
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tất cả Slide</span>
            </button>

            <button
              type="button"
              onClick={onOpenFullscreen}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Phóng to toàn màn hình (F)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Slide Content Body */}
        {showAllSlidesGrid ? (
          /* Grid View of all slides */
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto bg-slate-950/60">
            {slides.map((s, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveSlideIdx(idx);
                  setShowAllSlidesGrid(false);
                }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[140px] ${
                  idx === activeSlideIdx
                    ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/50'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300">
                      Slide {idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{s.type}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                    {s.title}
                  </h4>
                  {s.content && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-medium">
                      {s.content}
                    </p>
                  )}
                </div>
                <div className="text-[10px] text-indigo-400 font-bold mt-2 pt-2 border-t border-slate-800">
                  Nhấp để xem slide này →
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single Active Slide Display */
          <div className="p-6 sm:p-10 md:p-12 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between bg-slate-900/90">
            {/* Intro Slide */}
            {currentSlide.type === 'intro' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  <Target className="w-3.5 h-3.5" />
                  Mục tiêu bài học
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {currentSlide.title}
                </h2>
                {currentSlide.description && (
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                    {currentSlide.description}
                  </p>
                )}
                {currentSlide.objectives && currentSlide.objectives.length > 0 && (
                  <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-2.5">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Yêu cầu cần đạt:
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentSlide.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Warmup Slide */}
            {currentSlide.type === 'warmup' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Hoạt động Khởi động
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {currentSlide.title}
                </h2>
                <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 space-y-4">
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                    {currentSlide.scenario}
                  </p>
                  {currentSlide.question && (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-semibold flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>Câu hỏi: {currentSlide.question}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section Slide */}
            {currentSlide.type === 'section' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    <BookOpen className="w-3.5 h-3.5" />
                    Mục {currentSlide.sectionNumber || 1}
                  </div>
                  {currentSlide.subtitle && (
                    <span className="text-xs text-slate-400 font-medium">
                      {currentSlide.subtitle}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {currentSlide.title}
                </h2>

                {currentSlide.content && (
                  <div className="text-sm sm:text-base text-slate-200 leading-relaxed">
                    <MathRenderer text={currentSlide.content} />
                  </div>
                )}

                {currentSlide.formula && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-center shadow-lg">
                    <div className="text-base sm:text-xl font-bold text-indigo-200">
                      <MathRenderer text={currentSlide.formula} />
                    </div>
                  </div>
                )}

                {currentSlide.keyPoints && currentSlide.keyPoints.length > 0 && (
                  <div className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ghi nhớ trọng tâm:
                    </h4>
                    <ul className="space-y-1.5">
                      {currentSlide.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                          <span>
                            <MathRenderer text={pt} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentSlide.examples && currentSlide.examples.length > 0 && (
                  <div className="space-y-2.5">
                    {currentSlide.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-1.5"
                      >
                        <div className="text-xs font-bold text-emerald-400 uppercase">
                          Ví dụ {idx + 1}:
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          <MathRenderer text={ex.problem} />
                        </div>
                        <div className="text-xs sm:text-sm text-emerald-200/90 pt-1.5 border-t border-emerald-500/20">
                          <strong>Lời giải:</strong> <MathRenderer text={ex.solution} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Practice Slide */}
            {currentSlide.type === 'practice' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Luyện tập tại lớp
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {currentSlide.title}
                </h2>
                <div className="space-y-3">
                  {currentSlide.practiceItems?.map((pr, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-1.5"
                    >
                      <div className="text-xs font-bold text-purple-400 uppercase">
                        Bài tập {idx + 1}:
                      </div>
                      <p className="text-xs sm:text-sm text-white font-medium">
                        <MathRenderer text={pr.question} />
                      </p>
                      {pr.hint && (
                        <p className="text-xs text-slate-400 italic">
                          💡 Gợi ý: <MathRenderer text={pr.hint} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Slide */}
            {currentSlide.type === 'summary' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Tổng kết bài học
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {currentSlide.title}
                </h2>
                <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Các kiến thức cốt lõi đã học:
                  </h4>
                  <ul className="space-y-2">
                    {currentSlide.summary?.map((sum, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <MathRenderer text={sum} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {currentSlide.application && (
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs sm:text-sm">
                    <strong>Ứng dụng thực tiễn:</strong> {currentSlide.application}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Viewport Bottom Controls */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveSlideIdx((prev) => Math.max(prev - 1, 0))}
            disabled={activeSlideIdx === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Slide trước</span>
          </button>

          {/* Quick Slide Indicator Pills */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-xs sm:max-w-sm py-1 px-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveSlideIdx(i);
                  setShowAllSlidesGrid(false);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === activeSlideIdx
                    ? 'w-6 bg-indigo-500'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveSlideIdx((prev) => Math.min(prev + 1, slides.length - 1))}
            disabled={activeSlideIdx === slides.length - 1}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white transition cursor-pointer"
          >
            <span>Slide tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
