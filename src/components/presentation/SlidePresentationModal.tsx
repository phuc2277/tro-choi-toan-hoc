import React, { useState, useEffect } from 'react';
import { StructuredLecture, PresentationItem, SlideItem } from '../../types/teacherLesson';
import { INITIAL_LESSONS } from '../../data/teacherLessonData';
import { MathRenderer } from '../../games/components/MathRenderer';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Target,
  Flame,
  FileText,
  Layers,
  Wand2,
} from 'lucide-react';

export interface SlidePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture?: StructuredLecture;
  presentation?: PresentationItem;
  slides?: SlideItem[];
  lessonTitle: string;
  lessonSubject?: string;
  lessonGrade?: number;
}

export function buildSlidesFromPresentation(
  presentation?: PresentationItem,
  lecture?: StructuredLecture,
  slidesProp?: SlideItem[],
  lessonTitle: string = 'Bài giảng điện tử',
  lessonSubject: string = 'Toán học',
  lessonGrade: number = 8
): SlideItem[] {
  // 1. If explicit slides array passed
  if (slidesProp && slidesProp.length > 0) {
    return slidesProp;
  }

  // 2. If presentation has slides
  if (presentation && presentation.sourceType === 'upload-file' && presentation.slides && presentation.slides.length > 0) {
    return presentation.slides;
  }

  // 3. If lecture passed or presentation has lecture
  let effectiveLecture = lecture || (presentation && 'lecture' in presentation ? presentation.lecture : undefined);

  // If presentation is an uploaded file without embedded lecture, lookup matching structured lecture from lessons database
  if (!effectiveLecture) {
    const matchedLesson = INITIAL_LESSONS.find(
      (l) => l.title === lessonTitle || l.shortTitle === lessonTitle || lessonTitle.includes(l.shortTitle)
    );
    if (matchedLesson) {
      const aiPres = matchedLesson.presentations.find((p) => p.sourceType === 'ai-structured');
      if (aiPres && 'lecture' in aiPres && aiPres.lecture) {
        effectiveLecture = aiPres.lecture;
      }
    }
  }

  if (effectiveLecture) {
    return [
      {
        type: 'intro',
        title: effectiveLecture.title || lessonTitle,
        objectives: effectiveLecture.objectives || [],
        description: effectiveLecture.description,
      },
      ...(effectiveLecture.warmup
        ? [
            {
              type: 'warmup' as const,
              title: effectiveLecture.warmup.title,
              scenario: effectiveLecture.warmup.scenario,
              question: effectiveLecture.warmup.question,
            },
          ]
        : []),
      ...(effectiveLecture.sections || []).map((sec, idx) => ({
        type: 'section' as const,
        sectionNumber: idx + 1,
        title: sec.title,
        subtitle: sec.subtitle,
        content: sec.content,
        formula: sec.formula,
        keyPoints: sec.keyPoints || [],
        examples: sec.examples || [],
        callout: sec.callout,
      })),
      ...(effectiveLecture.practice && effectiveLecture.practice.length > 0
        ? [
            {
              type: 'practice' as const,
              title: 'Luyện tập & Củng cố kiến thức tại lớp',
              practiceItems: effectiveLecture.practice,
            },
          ]
        : []),
      {
        type: 'summary',
        title: 'Tổng kết & Ghi nhớ trọng tâm',
        summary: effectiveLecture.summary || [],
        application: effectiveLecture.application,
      },
    ];
  }

  // 4. Fallback for Uploaded File (PPTX, PDF, DOCX) or other presentations
  const fileName = presentation && 'fileName' in presentation ? presentation.fileName : lessonTitle;
  const isPpt = fileName.toLowerCase().endsWith('.pptx') || fileName.toLowerCase().endsWith('.ppt');
  const isPdf = fileName.toLowerCase().endsWith('.pdf');
  const isDocx = fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');

  const fileTypeLabel = isPpt ? 'PowerPoint Presentation' : isPdf ? 'Tài liệu PDF' : isDocx ? 'Giáo án Word (DOCX)' : 'Tài liệu bài giảng';

  return [
    {
      type: 'intro',
      title: presentation?.title || lessonTitle,
      subtitle: `${lessonSubject} Lớp ${lessonGrade} • ${fileTypeLabel}`,
      description: `Tài liệu trình chiếu: "${fileName}". Trình bày các kiến thức trọng tâm, hệ thống công thức, ví dụ giải mẫu và bài tập củng cố bám sát chương trình.`,
      objectives: [
        `Nắm vững các khái niệm và định nghĩa trọng tâm trong ${lessonTitle}.`,
        `Nhận biết và vận dụng thành thạo các công thức, phương pháp giải toán/khoa học chuẩn xác.`,
        `Rèn luyện kỹ năng phân tích, tư duy logic và giải quyết các bài toán vận dụng thực tiễn.`,
        `Tích cực, chủ động trao đổi và hoàn thành tốt các bài tập luyện tập tại lớp.`,
      ],
    },
    {
      type: 'warmup',
      title: `Khởi động & Mở đầu: Khám phá ${lessonTitle}`,
      scenario: `Trong giờ học thực hành, giáo viên đưa ra một tình huống toán học gắn với thực tế để học sinh quan sát, nhận xét và phát hiện vấn đề cần nghiên cứu trong bài học "${lessonTitle}".`,
      question: `Các em hãy quan sát biểu thức và nêu nhận xét về các thành phần (hệ số, biến, số mũ) để rút ra quy luật chung.`,
    },
    {
      type: 'section',
      sectionNumber: 1,
      title: `1. Khái niệm & Định nghĩa cốt lõi`,
      subtitle: `Hình thành kiến thức nền tảng`,
      content: `Biểu thức đại số gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến được gọi là đơn thức. Biểu thức có chứa phép cộng, trừ giữa các biến không phải là đơn thức. Số 0 được gọi là đơn thức không.`,
      formula: `A = a \\cdot x^m \\cdot y^n \\quad (a \\neq 0; m, n \\in \\mathbb{N})`,
      keyPoints: [
        `Mỗi số thực bất kỳ là một đơn thức (ví dụ: $5; -7; 0$).`,
        `Mỗi biến số đơn lẻ là một đơn thức (ví dụ: $x; y; z$).`,
        `Tích giữa các số và biến là đơn thức (ví dụ: $3x^2y; -\\frac{2}{3}xy^3$).`,
      ],
      examples: [
        {
          problem: `Trong các biểu thức sau: $3xy^2; x + 2y; -8; \\frac{5}{x}; 4x^3y$, biểu thức nào là đơn thức?`,
          solution: `Các biểu thức $3xy^2; -8; 4x^3y$ là các đơn thức. Biểu thức $x + 2y$ (có phép cộng) và $\\frac{5}{x}$ (chứa biến ở mẫu) không phải là đơn thức.`,
        },
      ],
    },
    {
      type: 'section',
      sectionNumber: 2,
      title: `2. Thu gọn, Hệ số, Phần biến & Bậc`,
      subtitle: `Quy tắc xác định thành phần đại số`,
      content: `Đơn thức thu gọn là đơn thức chỉ gồm tích của một số với các biến, mà mỗi biến đã được nâng lên lũy thừa với số mũ nguyên dương. Số đứng trước gọi là hệ số, phần còn lại là phần biến. Bậc là tổng số mũ của tất cả các biến có trong đơn thức đó.`,
      formula: `\\text{Bậc}(A = 3x^2y^3z) = 2 + 3 + 1 = 6`,
      keyPoints: [
        `Để thu gọn đơn thức, ta nhân các hệ số với nhau và nhân các lũy thừa của cùng một biến với nhau.`,
        `Số thực khác 0 là đơn thức có bậc bằng 0. Số 0 là đơn thức không có bậc.`,
      ],
      examples: [
        {
          problem: `Thu gọn đơn thức $P = (-2x^2y) \\cdot (3xy^3)$ và chỉ ra hệ số, phần biến cùng bậc của đơn thức thu gọn.`,
          solution: `$P = (-2 \\cdot 3) \\cdot (x^2 \\cdot x) \\cdot (y \\cdot y^3) = -6x^3y^4$. Hệ số: $-6$; Phần biến: $x^3y^4$; Bậc: $3 + 4 = 7$.`,
        },
      ],
    },
    {
      type: 'section',
      sectionNumber: 3,
      title: `3. Đơn thức đồng dạng & Phép toán cộng trừ`,
      subtitle: `Kỹ năng tính toán và rút gọn biểu thức`,
      content: `Hai đơn thức đồng dạng là hai đơn thức có hệ số khác 0 và có cùng phần biến. Để cộng (hay trừ) các đơn thức đồng dạng, ta cộng (hay trừ) các hệ số với nhau và giữ nguyên phần biến.`,
      formula: `a \\cdot X + b \\cdot X = (a + b) \\cdot X`,
      keyPoints: [
        `Hai số khác 0 cũng được coi là hai đơn thức đồng dạng.`,
        `Chỉ thực hiện được phép cộng trừ trực tiếp khi các đơn thức có cùng phần biến.`,
      ],
      examples: [
        {
          problem: `Thực hiện phép tính: $A = 5x^2y^3 - 9x^2y^3 + 2x^2y^3$`,
          solution: `$A = (5 - 9 + 2)x^2y^3 = -2x^2y^3$.`,
        },
      ],
    },
    {
      type: 'practice',
      title: `Luyện tập & Thực hành tại lớp`,
      practiceItems: [
        {
          question: `Cho các đơn thức: $A = 2x^2y; B = -5xy^2; C = 3x^2y$. Cặp đơn thức nào đồng dạng với nhau?`,
          hint: `So sánh phần biến của từng đơn thức: $A$ và $C$ đều có cùng phần biến là $x^2y$.`,
        },
        {
          question: `Tính giá trị của biểu thức $M = 4x^3y^2 - 7x^3y^2$ tại $x = 1, y = -1$.`,
          hint: `Thu gọn trước $M = -3x^3y^2$, sau đó thay số: $-3 \\cdot (1)^3 \\cdot (-1)^2 = -3$.`,
        },
        {
          question: `Tính tích của hai đơn thức $\\left(-\\frac{1}{3}x^2y\\right)$ và $(6xy^3z)$. Tìm bậc của tích thu được.`,
          hint: `Tích $= -2x^3y^4z$. Tổng số mũ $= 3 + 4 + 1 = 8$.`,
        },
      ],
    },
    {
      type: 'summary',
      title: `Tổng kết bài học & Dặn dò`,
      summary: [
        `Đơn thức là biểu thức đại số gồm một số, một biến hoặc tích giữa số và các biến.`,
        `Đơn thức thu gọn gồm hệ số và phần biến. Bậc là tổng số mũ của tất cả các biến.`,
        `Hai đơn thức đồng dạng có cùng phần biến. Cộng trừ: tính tổng hệ số, giữ nguyên phần biến.`,
      ],
      application: `Biểu thức đơn thức được ứng dụng rộng rãi trong việc tính diện tích tam giác, hình hộp chữ nhật, thể tích khối chóp, và tính toán công suất vật lý trong thực tiễn.`,
    },
  ];
}

export const SlidePresentationModal: React.FC<SlidePresentationModalProps> = ({
  isOpen,
  onClose,
  lecture,
  presentation,
  slides: passedSlides,
  lessonTitle,
  lessonSubject = 'Toán học',
  lessonGrade = 8,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const slides = buildSlidesFromPresentation(
    presentation,
    lecture,
    passedSlides,
    lessonTitle,
    lessonSubject,
    lessonGrade
  );

  const toggleModalFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        const modal = document.getElementById('slide-presentation-fullscreen-modal') || document.documentElement;
        if (modal.requestFullscreen) {
          await modal.requestFullscreen();
        } else if ((modal as any).webkitRequestFullscreen) {
          await (modal as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (e) {
      setIsFullscreen((prev) => !prev);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlideIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlideIndex(slides.length - 1);
      } else if (e.key === 'f' || e.key === 'F' || e.key === 'F11') {
        e.preventDefault();
        toggleModalFullscreen();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isOpen, slides.length, onClose]);

  if (!isOpen) return null;

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div
      id="slide-presentation-fullscreen-modal"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col text-white animate-in fade-in duration-200 select-none"
    >
      {/* Presentation Top Bar */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-lg bg-indigo-600 font-bold text-xs tracking-wider shadow-sm flex items-center gap-1.5">
            <span>Slide</span>
            <span>{currentSlideIndex + 1}/{slides.length}</span>
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white leading-tight truncate max-w-xs sm:max-w-md md:max-w-lg">
              {lessonTitle}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Chế độ trình chiếu bài giảng lớp học • {lessonSubject} {lessonGrade}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowThumbnails((prev) => !prev)}
            className={`p-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              showThumbnails
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Danh sách các Slide"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Mục lục Slide</span>
          </button>

          <button
            onClick={toggleModalFullscreen}
            className={`p-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              isFullscreen
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isFullscreen ? 'Thu nhỏ (F / F11)' : 'Toàn màn hình (F / F11)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden lg:inline text-xs">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
            title="Đóng trình chiếu (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Area + Optional Thumbnail Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar / Drawer */}
        {showThumbnails && (
          <div className="w-64 bg-slate-900 border-r border-slate-800 p-3 overflow-y-auto shrink-0 animate-in slide-in-from-left duration-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Danh sách Slide ({slides.length})</span>
              <button
                onClick={() => setShowThumbnails(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {slides.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setShowThumbnails(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-start gap-2.5 ${
                  idx === currentSlideIndex
                    ? 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="truncate">
                  <div className="font-bold truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{s.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Slide Canvas Area */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-8 md:p-12">
          <div className="max-w-5xl w-full bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-10 md:p-12 min-h-[460px] sm:min-h-[520px] flex flex-col justify-between transition-all">
            {/* 1. Intro Slide */}
            {currentSlide.type === 'intro' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    <Target className="w-3.5 h-3.5" />
                    Mục tiêu bài học
                  </span>
                  {currentSlide.subtitle && (
                    <span className="text-xs text-slate-400 font-medium">
                      {currentSlide.subtitle}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {currentSlide.title}
                </h1>

                {currentSlide.description && (
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                    {currentSlide.description}
                  </p>
                )}

                {currentSlide.objectives && currentSlide.objectives.length > 0 && (
                  <div className="bg-slate-800/90 rounded-2xl p-5 sm:p-6 border border-slate-700 space-y-3 shadow-inner">
                    <h3 className="text-xs sm:text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Yêu cầu cần đạt sau bài học:
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentSlide.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 2. Warmup Slide */}
            {currentSlide.type === 'warmup' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Hoạt động Khởi động
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {currentSlide.title}
                </h2>

                <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 space-y-4 shadow-inner">
                  <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-medium">
                    {currentSlide.scenario}
                  </p>

                  {currentSlide.question && (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-sm font-semibold flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Câu hỏi suy ngẫm: {currentSlide.question}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Section Slide */}
            {currentSlide.type === 'section' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
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

                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {currentSlide.title}
                </h2>

                {currentSlide.content && (
                  <div className="text-base sm:text-lg text-slate-200 leading-relaxed">
                    <MathRenderer text={currentSlide.content} />
                  </div>
                )}

                {/* Formula highlight box */}
                {currentSlide.formula && (
                  <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-center shadow-lg">
                    <div className="text-lg sm:text-2xl font-bold text-indigo-200">
                      <MathRenderer text={currentSlide.formula} />
                    </div>
                  </div>
                )}

                {/* Key points */}
                {currentSlide.keyPoints && currentSlide.keyPoints.length > 0 && (
                  <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ghi nhớ trọng tâm:
                    </h4>
                    <ul className="space-y-2">
                      {currentSlide.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                          <span>
                            <MathRenderer text={pt} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Examples */}
                {currentSlide.examples && currentSlide.examples.length > 0 && (
                  <div className="space-y-3">
                    {currentSlide.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-2"
                      >
                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Ví dụ minh họa {idx + 1}:
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          <MathRenderer text={ex.problem} />
                        </div>
                        <div className="text-xs sm:text-sm text-emerald-200/90 pt-2 border-t border-emerald-500/20">
                          <strong>Lời giải:</strong> <MathRenderer text={ex.solution} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Practice Slide */}
            {currentSlide.type === 'practice' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Luyện tập tại lớp
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {currentSlide.title}
                </h2>

                <div className="space-y-4">
                  {currentSlide.practiceItems?.map((pr, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2 shadow-inner"
                    >
                      <div className="text-xs font-bold text-purple-400 uppercase">
                        Bài tập {idx + 1}:
                      </div>
                      <p className="text-sm sm:text-base text-white font-medium">
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

            {/* 5. Summary Slide */}
            {currentSlide.type === 'summary' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Tổng kết bài học
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {currentSlide.title}
                </h2>

                <div className="bg-slate-800/90 rounded-2xl p-5 sm:p-6 border border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Các kiến thức cốt lõi đã học:
                  </h4>
                  <ul className="space-y-2.5">
                    {currentSlide.summary?.map((sum, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
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
        </div>
      </div>

      {/* Presentation Bottom Navigation Controls */}
      <div className="h-16 px-4 sm:px-6 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/90 shrink-0">
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlideIndex === 0}
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Trang trước (←)</span>
        </button>

        {/* Slide Indicator Dots */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-xs sm:max-w-md py-1 px-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlideIndex(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === currentSlideIndex
                  ? 'w-6 sm:w-8 bg-indigo-500'
                  : 'w-2 sm:w-2.5 bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.min(prev + 1, slides.length - 1))}
          disabled={currentSlideIndex === slides.length - 1}
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white transition cursor-pointer shadow-md shadow-indigo-600/30"
        >
          <span>Trang kế tiếp (→)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
