import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Lesson,
  PresentationItem,
  StructuredLecture,
  SlideItem,
  ExtendedQuestionItem,
  QuestionSetItem,
} from '../../types/teacherLesson';
import {
  LessonPresentationPackage,
  ContentBlock,
} from '../../types/contentBlock';
import { StructuredPresentation } from '../../types/presentationStructure';
import { BlockRenderer } from './blocks/BlockRenderer';
import { AnimatedBlockWrapper } from './blocks/AnimatedBlockWrapper';
import { MathRenderer } from '../../games/components/MathRenderer';
import { QuizVoiceAnswerWidget } from './QuizVoiceAnswerWidget';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Target,
  Flame,
  Layers,
  Eye,
  EyeOff,
  PenTool,
  Eraser,
  Clock,
  Volume2,
  VolumeX,
  Grid,
  FileText,
  Gamepad2,
  Lightbulb,
  AlertTriangle,
  Info,
  Check,
  Award,
  Zap,
  Download,
} from 'lucide-react';

export interface PresentationViewerProps {
  lesson?: Lesson;
  presentation?: PresentationItem | StructuredPresentation;
  packageData?: LessonPresentationPackage;
  lecture?: StructuredLecture;
  slides?: SlideItem[];
  initialSlideIndex?: number;
  onClose: () => void;
  onLaunchGame?: (gameCode: string, questionSet?: QuestionSetItem) => void;
  onOpenExport?: () => void;
}

interface InternalSlide {
  id: string;
  activityCode: string; // '01. KHỞI ĐỘNG', '02. HÌNH THÀNH KIẾN THỨC', etc.
  activityType: 'warmup' | 'knowledge' | 'example' | 'practice' | 'application' | 'summary' | 'game' | 'intro';
  title: string;
  subtitle?: string;
  badge?: string;
  objectives?: string[];
  content?: string;
  formula?: string;
  formulas?: string[];
  keyPoints?: string[];
  examples?: {
    problem: string;
    solution: string;
    note?: string;
  }[];
  practiceItems?: {
    question: string;
    hint?: string;
    answer?: string;
    options?: { key: string; text: string }[];
    correctKey?: string;
  }[];
  callout?: {
    type: 'tip' | 'warning' | 'info';
    text: string;
  };
  application?: string;
  summary?: string[];
  teacherNotes?: string;
  gameCode?: string;
  questionRef?: ExtendedQuestionItem;
  blocks?: ContentBlock[];
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  lesson,
  presentation,
  packageData,
  lecture,
  slides: explicitSlides,
  initialSlideIndex = 0,
  onClose,
  onLaunchGame,
  onOpenExport,
}) => {
  // 1. Build rich internal slide sequence from all available Lesson/Lecture/Presentation sources
  const internalSlides: InternalSlide[] = useMemo(() => {
    // 0. Priority 0: Standardized LessonPresentationPackage (activities -> slides -> contentBlocks)
    const effectivePackage = packageData || lesson?.presentationPackage;
    if (effectivePackage && effectivePackage.activities && effectivePackage.activities.length > 0) {
      const pkgSlides: InternalSlide[] = [];
      effectivePackage.activities.forEach((act, actIdx) => {
        (act.slides || []).forEach((sld, sldIdx) => {
          let actType: InternalSlide['activityType'] = 'knowledge';
          if (act.title.includes('KHỞI ĐỘNG')) actType = 'warmup';
          else if (act.title.includes('LUYỆN TẬP')) actType = 'practice';
          else if (act.title.includes('VẬN DỤNG')) actType = 'application';
          else if (act.title.includes('GHI NHỚ') || act.title.includes('CỦNG CỐ')) actType = 'summary';

          pkgSlides.push({
            id: sld.id,
            activityCode: act.title,
            activityType: actType,
            title: sld.title || `Hoạt động ${actIdx + 1} - Slide ${sldIdx + 1}`,
            subtitle: `${effectivePackage.subject} • Lớp ${effectivePackage.grade}`,
            badge: `Slide ${sldIdx + 1}`,
            teacherNotes: sld.notes,
            blocks: sld.blocks,
          });
        });
      });

      if (pkgSlides.length > 0) {
        return pkgSlides;
      }
    }

    // A. If explicit slides provided
    if (explicitSlides && explicitSlides.length > 0) {
      return explicitSlides.map((s, idx) => ({
        id: `slide-explicit-${idx}`,
        activityCode: s.type === 'warmup' ? '01. KHỞI ĐỘNG' :
                      s.type === 'section' ? '02. HÌNH THÀNH KIẾN THỨC' :
                      s.type === 'practice' ? '04. LUYỆN TẬP' :
                      s.type === 'summary' ? '06. CỦNG CỐ & GHI NHỚ' : '01. MỞ ĐẦU BÀI HỌC',
        activityType: s.type === 'warmup' ? 'warmup' :
                      s.type === 'section' ? 'knowledge' :
                      s.type === 'practice' ? 'practice' :
                      s.type === 'summary' ? 'summary' : 'intro',
        title: s.title,
        subtitle: s.subtitle,
        objectives: s.objectives,
        content: s.content || s.description || s.scenario,
        formula: s.formula,
        keyPoints: s.keyPoints,
        examples: s.examples,
        practiceItems: s.practiceItems?.map((p) => ({ question: p.question, hint: p.hint })),
        summary: s.summary,
        application: s.application,
        teacherNotes: s.notes,
        badge: s.badge,
      }));
    }

    // A.5. If StructuredPresentation with slides array provided
    const structSlides = (presentation && 'slides' in presentation && Array.isArray((presentation as any).slides) && (presentation as any).slides.length > 0)
      ? (presentation as any).slides
      : (lesson?.presentations?.find((p: any) => p?.slides && Array.isArray(p.slides) && p.slides.length > 0) as any)?.slides;

    if (structSlides && structSlides.length > 0) {
      return structSlides.map((s: any, idx: number) => {
        let actType: InternalSlide['activityType'] = 'knowledge';
        if (s.type === 'warmup') actType = 'warmup';
        else if (s.type === 'objective' || s.type === 'title') actType = 'intro';
        else if (s.type === 'knowledge') actType = 'knowledge';
        else if (s.type === 'example') actType = 'example';
        else if (s.type === 'practice' || s.type === 'activity') actType = 'practice';
        else if (s.type === 'application') actType = 'application';
        else if (s.type === 'summary' || s.type === 'assignment') actType = 'summary';
        else if (s.type === 'game') actType = 'game';

        const badge = s.badge || (
          actType === 'warmup' ? '01. KHỞI ĐỘNG' :
          actType === 'knowledge' ? `02. HÌNH THÀNH KIẾN THỨC #${idx + 1}` :
          actType === 'example' ? '03. VÍ DỤ MINH HỌA' :
          actType === 'practice' ? '04. LUYỆN TẬP' :
          actType === 'application' ? '05. VẬN DỤNG THỰC TẾ' :
          actType === 'summary' ? '06. CỦNG CỐ & GHI NHỚ' : '00. BÀI GIẢNG'
        );

        return {
          id: s.id || `struct-slide-${idx}`,
          activityCode: badge,
          activityType: actType,
          title: s.title,
          subtitle: s.subtitle || `${(presentation as any)?.subject || lesson?.subject || 'Toán học'} • Lớp ${(presentation as any)?.grade || lesson?.grade || 8}`,
          badge,
          objectives: s.objectives,
          content: s.content,
          formula: s.formulas?.[0],
          formulas: s.formulas,
          keyPoints: s.keyPoints,
          examples: s.examples,
          practiceItems: s.practiceItems,
          questionRef: s.questionRef,
          summary: s.summary,
          callout: s.callout,
          teacherNotes: s.teacherNotes,
          blocks: s.blocks,
        };
      });
    }

    // B. If presentation has structured presentation or lecture
    let effectiveLecture = lecture;
    if (!effectiveLecture && presentation && 'lecture' in presentation) {
      effectiveLecture = (presentation as any).lecture;
    }

    // C. Fallback to lesson's first AI presentation if available
    if (!effectiveLecture && lesson) {
      const aiPres = lesson.presentations.find((p) => p.sourceType === 'ai-structured');
      if (aiPres && 'lecture' in aiPres) {
        effectiveLecture = (aiPres as any).lecture;
      }
    }

    const lessonTitle = lesson?.title || presentation?.title || 'Đơn thức nhiều biến';
    const subjectName = lesson?.subject || 'Toán học';
    const gradeLevel = lesson?.grade || 8;

    const result: InternalSlide[] = [];

    // SLIDE 1: MỤC TIÊU BÀI HỌC & GIỚI THIỆU
    result.push({
      id: 'slide-intro',
      activityCode: '00. GIỚI THIỆU CHỦ ĐỀ',
      activityType: 'intro',
      title: effectiveLecture?.title || lessonTitle,
      subtitle: `${subjectName} Lớp ${gradeLevel} • Chương trình GDPT 2018`,
      badge: 'TIẾT HỌC CHUẨN',
      objectives: effectiveLecture?.objectives || [
        `Nhận biết và phân biệt chính xác khái niệm đơn thức, đơn thức nhiều biến trong ${subjectName}.`,
        `Nắm vững quy tắc xác định hệ số, phần biến và tính bậc của đơn thức thu gọn.`,
        `Thực hiện thành thạo phép cộng, trừ hai đơn thức đồng dạng và rút gọn biểu thức.`,
        `Vận dụng linh hoạt giải quyết các bài toán tính chu vi, diện tích và thể tích trong thực tế.`,
      ],
      content: effectiveLecture?.description || `Chào mừng các em học sinh đến với bài học "${lessonTitle}". Hãy chuẩn bị vở ghi, bút và tinh thần sẵn sàng khám phá những kiến thức toán học thú vị!`,
      teacherNotes: 'Giáo viên ổn định lớp, giới thiệu mục tiêu cần đạt của tiết học và tạo tâm thế hứng khởi cho học sinh.',
    });

    // SLIDE 2: KHỞI ĐỘNG (WARM-UP)
    if (effectiveLecture?.warmup) {
      result.push({
        id: 'slide-warmup',
        activityCode: '01. KHỞI ĐỘNG & TÌNH HUỐNG',
        activityType: 'warmup',
        title: effectiveLecture.warmup.title || 'Khởi động: Tình huống thực tế',
        subtitle: 'Kích hoạt tư duy và gợi mở bài học',
        badge: 'HOẠT ĐỘNG KHỞI ĐỘNG',
        content: effectiveLecture.warmup.scenario,
        practiceItems: effectiveLecture.warmup.question ? [
          {
            question: effectiveLecture.warmup.question,
            hint: 'Quan sát các thành phần trong biểu thức (các số và các biến, phép tính nhân/cộng).',
          }
        ] : undefined,
        teacherNotes: 'Cho học sinh 2 phút thảo luận theo cặp bàn để trả lời câu hỏi mở đầu. Mời 1-2 học sinh đại diện phát biểu ý kiến.',
      });
    } else {
      result.push({
        id: 'slide-warmup-default',
        activityCode: '01. KHỞI ĐỘNG & TÌNH HUỐNG',
        activityType: 'warmup',
        title: `Khởi động: Khám phá ${lessonTitle}`,
        subtitle: 'Kích hoạt tư duy và quan sát thực tế',
        badge: 'HOẠT ĐỘNG KHỞI ĐỘNG',
        content: `Trong một buổi sinh hoạt CLB Toán học, thầy giáo đưa ra một bảng ghi các biểu thức đại số: $3x^2y$; $-5x$; $7$; $x + 2y$; $\\frac{x}{y}$. Thầy yêu cầu các nhóm phân loại các biểu thức có cùng đặc điểm về phép tính.`,
        practiceItems: [
          {
            question: 'Các em hãy quan sát và cho biết những biểu thức nào CHỈ chứa phép nhân giữa các số và các biến?',
            hint: 'Biểu thức không chứa phép cộng, trừ giữa các biến hoặc biến ở mẫu thức.',
            answer: 'Các biểu thức chỉ chứa phép nhân là: $3x^2y$, $-5x$, và số $7$.',
          }
        ],
        teacherNotes: 'Dẫn dắt học sinh nhận thấy các biểu thức chỉ gồm tích giữa các số và các biến chính là ĐƠN THỨC.',
      });
    }

    // SLIDE 3+: HÌNH THÀNH KIẾN THỨC (SECTIONS & EXAMPLES)
    if (effectiveLecture?.sections && effectiveLecture.sections.length > 0) {
      effectiveLecture.sections.forEach((sec, idx) => {
        // Slide lý thuyết
        result.push({
          id: `slide-section-${sec.id || idx}`,
          activityCode: '02. HÌNH THÀNH KIẾN THỨC',
          activityType: 'knowledge',
          title: sec.title,
          subtitle: sec.subtitle || `Trọng tâm kiến thức phần ${idx + 1}`,
          badge: `KIẾN THỨC ${idx + 1}`,
          content: sec.content,
          formula: sec.formula,
          keyPoints: sec.keyPoints || [],
          callout: sec.callout,
          teacherNotes: 'Giáo viên phân tích định nghĩa, nhấn mạnh vào công thức đóng khung và các lưu ý quan trọng.',
        });

        // Nếu section có ví dụ minh họa -> tạo slide ví dụ riêng để trực quan
        if (sec.examples && sec.examples.length > 0) {
          result.push({
            id: `slide-example-${sec.id || idx}`,
            activityCode: '03. VÍ DỤ MINH HỌA',
            activityType: 'example',
            title: `Ví dụ áp dụng: ${sec.title}`,
            subtitle: 'Phân tích phương pháp giải chi tiết từng bước',
            badge: 'VÍ DỤ MẪU',
            examples: sec.examples,
            teacherNotes: 'Cho học sinh suy nghĩ đề bài 1 phút trước khi bấm "Hiện lời giải" để hướng dẫn trình bày chuẩn.',
          });
        }
      });
    } else {
      // Fallback default sections
      result.push({
        id: 'slide-knowledge-1',
        activityCode: '02. HÌNH THÀNH KIẾN THỨC',
        activityType: 'knowledge',
        title: '1. Khái niệm Đơn thức nhiều biến',
        subtitle: 'Định nghĩa và nhận diện đơn thức',
        badge: 'ĐỊNH NGHĨA',
        content: `Đơn thức là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến.`,
        formula: `A = a \\cdot x^m \\cdot y^n \\quad (a \\in \\mathbb{R}, m, n \\in \\mathbb{N})`,
        keyPoints: [
          `Mỗi số thực bất kỳ được coi là một đơn thức (ví dụ: $5$; $-7$; $0$).`,
          `Số 0 được gọi là đơn thức không (không có bậc).`,
          `Biểu thức có chứa phép cộng, phép trừ giữa các biến KHÔNG phải là đơn thức.`,
          `Biểu thức chứa biến ở mẫu thức (ví dụ: $\\frac{2}{x}$) không phải là đơn thức.`,
        ],
        callout: {
          type: 'tip',
          text: 'Để kiểm tra một biểu thức có phải đơn thức không: Hãy kiểm tra xem giữa các biến chỉ có duy nhất phép nhân hay không!',
        },
      });

      result.push({
        id: 'slide-knowledge-2',
        activityCode: '02. HÌNH THÀNH KIẾN THỨC',
        activityType: 'knowledge',
        title: '2. Đơn thức thu gọn & Bậc của đơn thức',
        subtitle: 'Quy tắc thu gọn và tính bậc chuẩn xác',
        badge: 'QUY TẮC',
        content: `Đơn thức thu gọn là đơn thức chỉ gồm tích của một số với các biến, mà mỗi biến đã được nâng lên lũy thừa với số mũ nguyên dương và chỉ viết một lần.`,
        formula: `P = 3x^2y^3z \\implies \\text{Hệ số: } 3, \\quad \\text{Phần biến: } x^2y^3z, \\quad \\text{Bậc: } 2+3+1 = 6`,
        keyPoints: [
          `Hệ số là thừa số bằng số (đặt ở vị trí đầu tiên).`,
          `Phần biến là tích các lũy thừa của các biến với số mũ nguyên dương.`,
          `Bậc của đơn thức (có hệ số khác 0) là TỔNG số mũ của tất cả các biến có mặt trong đơn thức đó.`,
        ],
      });

      result.push({
        id: 'slide-example-sample',
        activityCode: '03. VÍ DỤ MINH HỌA',
        activityType: 'example',
        title: 'Ví dụ 1: Thu gọn và tìm bậc của đơn thức',
        subtitle: 'Bài toán mẫu rèn luyện kỹ năng',
        badge: 'VÍ DỤ MẪU',
        examples: [
          {
            problem: 'Cho đơn thức $M = (-2x^2y) \\cdot (3xy^3) \\cdot z$. Hãy thu gọn đơn thức $M$, chỉ ra hệ số, phần biến và bậc của $M$.',
            solution: `Ta có:
$$M = [(-2) \\cdot 3] \\cdot (x^2 \\cdot x) \\cdot (y \\cdot y^3) \\cdot z$$
$$M = -6x^3y^4z$$
- Hệ số của $M$ là: $-6$
- Phần biến của $M$ là: $x^3y^4z$
- Bậc của $M$ là: $3 + 4 + 1 = 8$.`,
            note: 'Chú ý nhân các hệ số với nhau và nhóm các lũy thừa cùng cơ số để cộng số mũ.',
          }
        ],
      });
    }

    // SLIDE: LUYỆN TẬP TẠI LỚP (PRACTICE)
    if (effectiveLecture?.practice && effectiveLecture.practice.length > 0) {
      result.push({
        id: 'slide-practice',
        activityCode: '04. LUYỆN TẬP CỦNG CỐ',
        activityType: 'practice',
        title: 'Bài tập luyện tập tại lớp',
        subtitle: 'Rèn luyện kỹ năng giải toán & làm chủ kiến thức',
        badge: 'LUYỆN TẬP',
        practiceItems: effectiveLecture.practice.map((p) => ({
          question: p.question,
          hint: p.hint,
        })),
        teacherNotes: 'Yêu cầu học sinh làm việc độc lập trong 5 phút. Sau đó gọi học sinh lên bảng trình bày hoặc chữa nhanh.',
      });
    } else {
      result.push({
        id: 'slide-practice-default',
        activityCode: '04. LUYỆN TẬP CỦNG CỐ',
        activityType: 'practice',
        title: 'Bài tập luyện tập tại lớp',
        subtitle: 'Rèn luyện kỹ năng nhận biết và thu gọn đơn thức',
        badge: 'LUYỆN TẬP',
        practiceItems: [
          {
            question: 'Bài 1: Trong các biểu thức sau, biểu thức nào là đơn thức? $A = 4x^2y$; $B = 3x - 1$; $C = -\\frac{5}{2}xy^3$; $D = \\frac{2x}{y}$.',
            hint: 'Đơn thức không chứa phép cộng trừ giữa các biến và không chứa biến dưới mẫu.',
            answer: 'Các đơn thức là: $A = 4x^2y$ và $C = -\\frac{5}{2}xy^3$.',
          },
          {
            question: 'Bài 2: Thực hiện phép tính cộng: $5x^2y^3 + (-2x^2y^3) - 7x^2y^3$.',
            hint: 'Cộng trừ các hệ số và giữ nguyên phần biến $x^2y^3$.',
            answer: 'Kết quả: $(5 - 2 - 7)x^2y^3 = -4x^2y^3$.',
          }
        ],
      });
    }

    // SLIDE: CÂU HỎI TƯƠNG TÁC TRẮC NGHIỆM (INTERACTIVE QUIZ SLIDE)
    const bankQuestions = lesson?.questionBank || [];
    if (bankQuestions.length > 0) {
      const q1 = bankQuestions[0];
      result.push({
        id: `slide-quiz-interactive`,
        activityCode: '04. LUYỆN TẬP NHANH',
        activityType: 'practice',
        title: '❓ Thử thách nhanh: Câu hỏi trắc nghiệm',
        subtitle: 'Kiểm tra mức độ tiếp thu kiến thức tại chỗ',
        badge: 'TRẮC NGHIỆM TƯƠNG TÁC',
        content: q1.content,
        questionRef: q1,
        teacherNotes: 'Cho học sinh giơ tay chọn đáp án hoặc bấm chọn trực tiếp trên bảng tương tác.',
      });
    }

    // SLIDE: VẬN DỤNG THỰC TẾ (APPLICATION)
    if (effectiveLecture?.application) {
      result.push({
        id: 'slide-application',
        activityCode: '05. VẬN DỤNG THỰC TIỄN',
        activityType: 'application',
        title: 'Vận dụng: Toán học và Đời sống',
        subtitle: 'Ứng dụng kiến thức vào thực tế và các môn học khác',
        badge: 'VẬN DỤNG',
        content: effectiveLecture.application,
        teacherNotes: 'Khuyến khích học sinh liên hệ với các công thức tính diện tích, thể tích, vật lý hoặc kinh tế trong cuộc sống.',
      });
    } else {
      result.push({
        id: 'slide-application-default',
        activityCode: '05. VẬN DỤNG THỰC TIỄN',
        activityType: 'application',
        title: 'Vận dụng: Tính thể tích khối gỗ',
        subtitle: 'Ứng dụng biểu thức đơn thức trong kiến trúc & xây dựng',
        badge: 'VẬN DỤNG',
        content: `Một khối gỗ hình hộp chữ nhật có ba kích thước lần lượt là $2x$, $3y$ và $5xy$ (đơn vị: mét).
1. Hãy viết đơn thức biểu thị thể tích $V$ của khối gỗ đó.
2. Tính thể tích khối gỗ khi $x = 0.5\\text{ m}$ và $y = 1.2\\text{ m}$.`,
        practiceItems: [
          {
            question: 'Lời giải chi tiết:',
            answer: `1. Thể tích khối gỗ là:
$$V = (2x) \\cdot (3y) \\cdot (5xy) = (2 \\cdot 3 \\cdot 5) \\cdot (x \\cdot x) \\cdot (y \\cdot y) = 30x^2y^2 \\quad (\\text{m}^3)$$
2. Thay $x = 0.5$ và $y = 1.2$ vào $V$:
$$V = 30 \\cdot (0.5)^2 \\cdot (1.2)^2 = 30 \\cdot 0.25 \\cdot 1.44 = 10.8 \\quad (\\text{m}^3)$$
Vậy thể tích của khối gỗ là $10.8\\text{ m}^3$.`,
          }
        ],
      });
    }

    // SLIDE: CỦNG CỐ & GHI NHỚ (SUMMARY)
    result.push({
      id: 'slide-summary',
      activityCode: '06. CỦNG CỐ & DẶN DÒ',
      activityType: 'summary',
      title: 'Tổng kết bài học & Ghi nhớ trọng tâm',
      subtitle: 'Hệ thống hóa kiến thức toàn bài',
      badge: 'GHI NHỚ',
      summary: effectiveLecture?.summary || [
        'Đơn thức là biểu thức đại số chỉ gồm một số, một biến, hoặc tích giữa các số và biến.',
        'Đơn thức thu gọn: Mỗi biến chỉ xuất hiện 1 lần dưới dạng lũy thừa có số mũ nguyên dương.',
        'Bậc của đơn thức: Tổng số mũ của tất cả các biến có trong đơn thức đó.',
        'Hai đơn thức đồng dạng: Có hệ số khác 0 và CÙNG phần biến.',
        'Cộng trừ đơn thức đồng dạng: Cộng trừ các hệ số, giữ nguyên phần biến.',
      ],
      content: `📌 DẶN DÒ VỀ NHÀ:
- Học thuộc các định nghĩa, quy tắc tính bậc và cộng trừ đơn thức đồng dạng.
- Hoàn thành các bài tập trong Sách giáo khoa và Sách bài tập.
- Chuẩn bị trước bài học tiếp theo: "Đa thức nhiều biến".`,
      teacherNotes: 'Giáo viên nhấn mạnh lại 3 lỗi sai học sinh hay mắc phải và giao bài tập về nhà.',
    });

    // SLIDE: TRÒ CHƠI HỌC TẬP (GAME TIME)
    result.push({
      id: 'slide-game',
      activityCode: '07. HOẠT ĐỘNG TRÒ CHƠI',
      activityType: 'game',
      title: '🎮 Đấu Trường Toán Học: Về Đích',
      subtitle: 'Thi đua tương tác lớp học sôi nổi',
      badge: 'TRÒ CHƠI HỌC TẬP',
      content: `Để kết thúc tiết học một cách hào hứng, cả lớp sẽ cùng tham gia trò chơi tương tác với bộ câu hỏi đã chuẩn bị cho bài học "${lessonTitle}"!`,
      gameCode: 'GESTURE_QUIZ_AI',
      teacherNotes: 'Bấm nút "Kích hoạt Trò chơi lớp học" bên dưới để chuyển thẳng sang giao diện trò chơi toàn màn hình.',
    });

    return result;
  }, [lesson, presentation, lecture, explicitSlides]);

  // States
  const [currentSlideIndex, setCurrentSlideIndex] = useState(
    Math.min(Math.max(0, initialSlideIndex), Math.max(0, internalSlides.length - 1))
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showTeacherNotes, setShowTeacherNotes] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, string>>({});

  // Step-by-step reveal states (Avoiding showing all text at once)
  const [currentRevealStep, setCurrentRevealStep] = useState(1);
  const [showAllContent, setShowAllContent] = useState(false);
  const [isAutoPlayingSteps, setIsAutoPlayingSteps] = useState(false);
  const [autoPlayIntervalSec, setAutoPlayIntervalSec] = useState(3);

  // Presentation Tools (Laser pointer, Pen Annotation, Class Timer, Blackboard Mode)
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100 });
  const [penActive, setPenActive] = useState(false);
  const [penColor, setPenColor] = useState('#ef4444'); // red
  const [penSize, setPenSize] = useState(4);
  const [blackboardMode, setBlackboardMode] = useState<'none' | 'black' | 'white'>('none');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Countdown timer for student group discussion
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [countdownInitial, setCountdownInitial] = useState<number | null>(null);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSlide = internalSlides[currentSlideIndex] || internalSlides[0];

  // 2. Class Stopwatch Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdownSeconds !== null && countdownSeconds > 0) {
      interval = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev === null || prev <= 1) {
            // Play simple audio beep if supported
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              osc.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            } catch {
              // ignore audio error
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  // Format seconds into MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate maximum reveal steps for the current slide
  const maxRevealStep = useMemo(() => {
    if (!currentSlide) return 1;
    if (currentSlide.blocks && currentSlide.blocks.length > 0) {
      const visibleBlocks = currentSlide.blocks.filter((b) => b.visible !== false);
      if (visibleBlocks.length === 0) return 1;
      const orders = visibleBlocks.map((b, idx) => {
        if (typeof b.animation?.order === 'number' && b.animation.order > 0) return b.animation.order;
        if (typeof b.revealOrder === 'number' && b.revealOrder > 0) return b.revealOrder;
        if (typeof b.order === 'number' && b.order > 0) return b.order;
        return idx + 1;
      });
      return Math.max(1, ...orders);
    }

    // Step calculation for standard slide types:
    switch (currentSlide.activityType) {
      case 'intro': {
        const objCount = currentSlide.objectives?.length || 0;
        return objCount > 0 ? 1 + objCount : 1;
      }
      case 'warmup': {
        let count = currentSlide.content ? 1 : 0;
        if (currentSlide.practiceItems && currentSlide.practiceItems.length > 0) {
          currentSlide.practiceItems.forEach((item) => {
            count += 1; // question
            if (item.answer) count += 1; // answer/conclusion
          });
        }
        return Math.max(1, count);
      }
      case 'knowledge': {
        let count = currentSlide.content ? 1 : 0;
        if (currentSlide.formula || (currentSlide.formulas && currentSlide.formulas.length > 0)) {
          count += 1;
        }
        if (currentSlide.keyPoints && currentSlide.keyPoints.length > 0) {
          count += currentSlide.keyPoints.length;
        }
        if (currentSlide.callout) {
          count += 1;
        }
        return Math.max(1, count);
      }
      case 'example': {
        const exCount = currentSlide.examples?.length || 0;
        return exCount > 0 ? exCount * 2 : 1;
      }
      case 'practice': {
        if (currentSlide.questionRef) {
          return 3; // 1: question, 2: options A-D, 3: explanation & answer
        }
        const itemCount = currentSlide.practiceItems?.length || 0;
        return itemCount > 0 ? itemCount * 2 : 1;
      }
      case 'application': {
        let count = currentSlide.content ? 1 : 0;
        if (currentSlide.practiceItems && currentSlide.practiceItems.length > 0) {
          currentSlide.practiceItems.forEach((item) => {
            count += 1;
            if (item.answer) count += 1;
          });
        }
        return Math.max(1, count);
      }
      case 'summary': {
        const sumCount = currentSlide.summary?.length || 0;
        const extra = currentSlide.content ? 1 : 0;
        return Math.max(1, sumCount + extra);
      }
      default:
        return 1;
    }
  }, [currentSlide]);

  // Reset reveal step on slide change
  useEffect(() => {
    setCurrentRevealStep(1);
  }, [currentSlideIndex]);

  // Auto-play step advancing timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlayingSteps && !showAllContent) {
      timer = setInterval(() => {
        setCurrentRevealStep((prev) => {
          if (prev < maxRevealStep) {
            return prev + 1;
          } else {
            // Reached end of steps, advance to next slide if possible
            setCurrentSlideIndex((sIdx) => {
              if (sIdx < internalSlides.length - 1) {
                return sIdx + 1;
              }
              setIsAutoPlayingSteps(false);
              return sIdx;
            });
            return 1;
          }
        });
      }, autoPlayIntervalSec * 1000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlayingSteps, showAllContent, maxRevealStep, internalSlides.length, autoPlayIntervalSec]);

  // 3. Slide navigation callbacks
  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
    setCurrentRevealStep(1);
  }, []);

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(internalSlides.length - 1, prev + 1));
    setCurrentRevealStep(1);
  }, [internalSlides.length]);

  const handleNextStepOrSlide = useCallback(() => {
    if (!showAllContent && currentRevealStep < maxRevealStep) {
      setCurrentRevealStep((prev) => prev + 1);
    } else {
      handleNextSlide();
    }
  }, [showAllContent, currentRevealStep, maxRevealStep, handleNextSlide]);

  const handlePrevStepOrSlide = useCallback(() => {
    if (!showAllContent && currentRevealStep > 1) {
      setCurrentRevealStep((prev) => prev - 1);
    } else {
      handlePrevSlide();
    }
  }, [showAllContent, currentRevealStep, handlePrevSlide]);

  const handleGoToSlide = useCallback((index: number) => {
    if (index >= 0 && index < internalSlides.length) {
      setCurrentSlideIndex(index);
      setCurrentRevealStep(1);
      setShowDrawer(false);
    }
  }, [internalSlides.length]);

  // 4. Native Fullscreen toggle
  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any)?.webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
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

  // 5. Global Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Spacebar
        case 'PageDown':
          e.preventDefault();
          if (e.shiftKey) {
            handleNextSlide();
          } else {
            handleNextStepOrSlide();
          }
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
        case 'Backspace':
        case 'PageUp':
          e.preventDefault();
          if (e.shiftKey) {
            handlePrevSlide();
          } else {
            handlePrevStepOrSlide();
          }
          break;

        case 'a':
        case 'A':
          e.preventDefault();
          setShowAllContent((prev) => !prev);
          break;

        case 's':
        case 'S':
          e.preventDefault();
          setIsAutoPlayingSteps((prev) => !prev);
          break;

        case 'Home':
          e.preventDefault();
          handleGoToSlide(0);
          break;

        case 'End':
          e.preventDefault();
          handleGoToSlide(internalSlides.length - 1);
          break;

        case 'f':
        case 'F':
        case 'F11':
          e.preventDefault();
          handleToggleFullscreen();
          break;

        case 'Escape':
          if (blackboardMode !== 'none') {
            setBlackboardMode('none');
          } else if (showDrawer) {
            setShowDrawer(false);
          } else if (showHelpModal) {
            setShowHelpModal(false);
          } else if (showTeacherNotes) {
            setShowTeacherNotes(false);
          } else {
            onClose();
          }
          break;

        case 'b':
        case 'B':
          e.preventDefault();
          setBlackboardMode((prev) => (prev === 'black' ? 'none' : 'black'));
          break;

        case 'w':
        case 'W':
          e.preventDefault();
          setBlackboardMode((prev) => (prev === 'white' ? 'none' : 'white'));
          break;

        case 'l':
        case 'L':
          e.preventDefault();
          setLaserActive((prev) => !prev);
          setPenActive(false);
          break;

        case 'p':
        case 'P':
        case 'd':
        case 'D':
          e.preventDefault();
          setPenActive((prev) => !prev);
          setLaserActive(false);
          break;

        case 'n':
        case 'N':
          e.preventDefault();
          setShowTeacherNotes((prev) => !prev);
          break;

        case 'g':
        case 'G':
          e.preventDefault();
          setShowDrawer((prev) => !prev);
          break;

        case '?':
        case 'h':
        case 'H':
          e.preventDefault();
          setShowHelpModal((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNextSlide,
    handlePrevSlide,
    handleNextStepOrSlide,
    handlePrevStepOrSlide,
    handleGoToSlide,
    handleToggleFullscreen,
    internalSlides.length,
    blackboardMode,
    showDrawer,
    showHelpModal,
    showTeacherNotes,
    onClose,
  ]);

  // 6. Laser Pointer mouse tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (laserActive) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setLaserPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  // 7. Pen Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!penActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    lastPointRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(x, y, penSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = penColor;
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!penActive || !isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Resize canvas when window changes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Clear drawings when moving to next slide
  useEffect(() => {
    clearCanvas();
  }, [currentSlideIndex]);

  // Toggle reveal solution helper
  const toggleSolution = (slideId: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [slideId]: !prev[slideId],
    }));
  };

  // Quick activity background color styling
  const getActivityBgBadge = (type: InternalSlide['activityType']) => {
    switch (type) {
      case 'warmup':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'knowledge':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'example':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'practice':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'application':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'summary':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'game':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden font-sans"
    >
      {/* 1. TOP STATUS & NAVIGATION BAR */}
      <header className="h-14 px-4 sm:px-6 bg-slate-900/95 border-b border-slate-800/90 flex items-center justify-between z-30 shrink-0 backdrop-blur-md">
        {/* Left: Exit & Lesson Information */}
        <div className="flex items-center gap-3">
          <button
            id="btn-viewer-exit"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer shadow-sm active:scale-95"
            title="Thoát chế độ trình chiếu (Esc)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Thoát</span>
          </button>

          <div className="hidden md:flex items-center gap-2 border-l border-slate-700 pl-3">
            <span className="text-xs font-black text-teal-400 truncate max-w-[200px] lg:max-w-md">
              {lesson?.title || presentation?.title || 'Bài giảng điện tử'}
            </span>
            <span className="text-slate-600 text-xs">•</span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getActivityBgBadge(
                currentSlide.activityType
              )}`}
            >
              {currentSlide.activityCode}
            </span>
          </div>
        </div>

        {/* Center: Slide Progress & Quick Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowDrawer((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer"
            title="Mở danh sách tất cả các Slide (Phím G)"
          >
            <Grid className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Slide <strong className="text-teal-300 font-extrabold">{currentSlideIndex + 1}</strong> /{' '}
              {internalSlides.length}
            </span>
          </button>

          {/* Discussion Countdown / Class Timer */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-mono font-bold text-slate-200">
              {countdownSeconds !== null
                ? `⏱️ Thảo luận: ${formatTime(countdownSeconds)}`
                : `⏱️ Tiết dạy: ${formatTime(elapsedSeconds)}`}
            </span>
            {countdownSeconds !== null && (
              <button
                onClick={() => setCountdownSeconds(null)}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold ml-1 cursor-pointer"
                title="Tắt hẹn giờ thảo luận"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Tools (Laser, Pen, Notes, Fullscreen) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Discussion Timer Preset Buttons */}
          <div className="hidden lg:flex items-center gap-1 mr-1">
            {[1, 2, 3, 5].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setCountdownSeconds(mins * 60);
                  setCountdownInitial(mins * 60);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  countdownInitial === mins * 60 && countdownSeconds !== null
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={`Hẹn giờ đếm ngược ${mins} phút cho học sinh thảo luận`}
              >
                {mins}p
              </button>
            ))}
          </div>

          {/* Laser Pointer Toggle */}
          <button
            onClick={() => {
              setLaserActive((prev) => !prev);
              setPenActive(false);
            }}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              laserActive
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Con trỏ Laser ảo (Phím L)"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </button>

          {/* Drawing Pen Toggle */}
          <button
            onClick={() => {
              setPenActive((prev) => !prev);
              setLaserActive(false);
            }}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              penActive
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Bút vẽ chú thích trực tiếp lên Slide (Phím P hoặc D)"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {penActive && (
            <button
              onClick={clearCanvas}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
              title="Xóa toàn bộ nét vẽ trên Slide"
            >
              <Eraser className="w-3.5 h-3.5 text-slate-300" />
            </button>
          )}

          {/* Blackboard / Whiteboard toggle */}
          <button
            onClick={() => setBlackboardMode((prev) => (prev === 'black' ? 'none' : 'black'))}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              blackboardMode === 'black'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Bảng đen viết nháp (Phím B)"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          {/* Teacher Notes Drawer Toggle */}
          <button
            onClick={() => setShowTeacherNotes((prev) => !prev)}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              showTeacherNotes
                ? 'bg-teal-600 text-white border-teal-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Ghi chú sư phạm của giáo viên (Phím N)"
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
          </button>

          {/* Sequential Step Reveal Controls (Anti-rush: tránh hiện ồ ạt văn bản) */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setShowAllContent((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                showAllContent
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}
              title={
                showAllContent
                  ? 'Đang hiện toàn bộ (Phím A để chuyển sang chiếu từng bước)'
                  : 'Đang chiếu từng ý tránh hiện cả trang (Phím A để hiện hết)'
              }
            >
              {showAllContent ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Hiện hết</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    Từng bước ({currentRevealStep}/{maxRevealStep})
                  </span>
                </>
              )}
            </button>

            {!showAllContent && maxRevealStep > 1 && (
              <button
                type="button"
                onClick={() => setIsAutoPlayingSteps((prev) => !prev)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  isAutoPlayingSteps
                    ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title={
                  isAutoPlayingSteps
                    ? 'Đang tự động chuyển bước (Phím S để dừng)'
                    : `Tự động chuyển bước sau ${autoPlayIntervalSec}s (Phím S)`
                }
              >
                {isAutoPlayingSteps ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] hidden xl:inline">Tự động ({autoPlayIntervalSec}s)</span>
              </button>
            )}
          </div>

          {/* Quick Gesture Quiz Game */}
          {onLaunchGame && (
            <button
              id="btn-viewer-launch-gesture"
              onClick={() => {
                const targetSet = lesson?.questionSets?.[0];
                onLaunchGame('GESTURE_QUIZ_AI', targetSet);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Khởi động Trắc nghiệm Cử chỉ AI nhận diện qua Camera"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Game Cử chỉ</span>
            </button>
          )}

          {/* Export PPTX / PDF */}
          {onOpenExport && (
            <button
              id="btn-viewer-open-export"
              onClick={onOpenExport}
              className="px-2.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Xuất bài giảng sang PowerPoint (.pptx) / PDF Slides / Kế hoạch CV 5512"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Xuất PPTX</span>
            </button>
          )}

          {/* Help Shortcuts */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
            title="Hướng dẫn phím tắt (Phím ? hoặc H)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ màn hình (F11)' : 'Toàn màn hình trình chiếu (F11 / F)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-teal-300" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-teal-300" />
            )}
          </button>
        </div>
      </header>

      {/* 2. PROGRESS BAR (THIN TOP LINE) */}
      <div className="w-full bg-slate-900 h-1 z-20">
        <div
          className="bg-gradient-to-r from-teal-500 via-cyan-400 to-indigo-500 h-full transition-all duration-300"
          style={{
            width: `${((currentSlideIndex + 1) / internalSlides.length) * 100}%`,
          }}
        />
      </div>

      {/* 3. MAIN SLIDE CANVAS VIEWPORT */}
      <main className="flex-1 relative flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        {/* LASER POINTER CURSOR */}
        {laserActive && (
          <div
            className="pointer-events-none fixed z-50 w-5 h-5 rounded-full bg-rose-500 shadow-[0_0_20px_6px_rgba(244,63,94,0.9)] animate-pulse"
            style={{
              left: `${laserPos.x - 10}px`,
              top: `${laserPos.y - 10}px`,
            }}
          />
        )}

        {/* DRAWING ANNOTATION CANVAS LAYER */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`absolute inset-0 z-40 ${
            penActive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
          }`}
        />

        {/* BLACKBOARD / WHITEBOARD OVERLAY */}
        {blackboardMode !== 'none' && (
          <div
            className={`absolute inset-0 z-35 flex flex-col p-8 transition-all ${
              blackboardMode === 'black'
                ? 'bg-slate-950 text-emerald-400 border-4 border-amber-900/60'
                : 'bg-slate-100 text-slate-900 border-4 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2 text-sm font-black">
                <BookOpen className="w-5 h-5" />
                <span>
                  {blackboardMode === 'black'
                    ? '🎓 BẢNG ĐEN GIẢNG BÀI & NHÁP TOÁN'
                    : '📝 BẢNG TRẮNG CHÚ THÍCH'}
                </span>
              </div>
              <button
                onClick={() => setBlackboardMode('none')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                ✕ Đóng bảng (Esc / Phím B)
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center text-center p-8 text-slate-400">
              <div className="max-w-md">
                <p className="text-base font-medium mb-2">
                  Bật công cụ Bút vẽ (Phím P) để viết hoặc vẽ trực tiếp lên bảng này.
                </p>
                <p className="text-xs text-slate-500">
                  Dùng để chữa bài tập phụ, phân tích nháp các bước giải hoặc vẽ hình minh họa cho học sinh.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE CARD CONTAINER (16:9 PROPORTIONAL ELEVATED FRAME) */}
        <div className="w-full max-w-6xl aspect-[16/9] min-h-[520px] max-h-[85vh] bg-[#0f172a] rounded-3xl border-2 border-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 subpixel-antialiased select-text">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* SLIDE HEADER */}
          <div className="relative z-10 shrink-0">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-xl border ${getActivityBgBadge(
                    currentSlide.activityType
                  )}`}
                >
                  {currentSlide.badge || currentSlide.activityCode}
                </span>
                {currentSlide.subtitle && (
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 hidden sm:inline">
                    {currentSlide.subtitle}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-xs font-mono font-bold text-slate-300">
                {maxRevealStep > 1 && (
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                      showAllContent
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-900/30'
                    }`}
                  >
                    {showAllContent ? 'Hiện tất cả' : `Bước ${currentRevealStep}/${maxRevealStep}`}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200">
                  {currentSlideIndex + 1} / {internalSlides.length}
                </span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
              <MathRenderer text={currentSlide.title} />
            </h2>
          </div>

          {/* SLIDE BODY (DYNAMIC ACCORDING TO ACTIVITY TYPE OR CONTENT BLOCKS) */}
          <div className="flex-1 my-4 sm:my-6 overflow-y-auto relative z-10 flex flex-col justify-center">
            {/* 0. CONTENT BLOCKS ENGINE */}
            {currentSlide.blocks && currentSlide.blocks.length > 0 ? (
              <div className="w-full h-full flex flex-col gap-4 justify-center">
                {currentSlide.blocks
                  .filter((b) => b.visible !== false)
                  .map((block) => (
                    <AnimatedBlockWrapper
                      key={block.id}
                      block={block}
                      currentStep={currentRevealStep}
                      showAll={showAllContent}
                      isEditor={false}
                      onAutoAdvanceStep={() => {
                        if (currentRevealStep < maxRevealStep) {
                          setCurrentRevealStep((prev) => prev + 1);
                        }
                      }}
                    >
                      <div className="w-full">
                        <BlockRenderer
                          block={block}
                          isEditor={false}
                          isDarkTheme={true}
                          onLaunchGame={(gameType, qSetId) => {
                            const matchedSet = lesson?.questionSets?.find((qs) => qs.id === qSetId);
                            onLaunchGame?.(gameType, matchedSet);
                          }}
                        />
                      </div>
                    </AnimatedBlockWrapper>
                  ))}
              </div>
            ) : (
              <>
                {/* A. INTRO / OBJECTIVES SLIDE */}
                {currentSlide.activityType === 'intro' && (
                  <div className="space-y-6">
                    {currentSlide.content && (
                      <div className="text-base sm:text-lg lg:text-xl text-slate-100 leading-relaxed font-normal bg-slate-800/60 p-6 rounded-2xl border border-slate-700/80 shadow-md anim-entrance-fade">
                        <MathRenderer text={currentSlide.content} />
                      </div>
                    )}

                    {currentSlide.objectives && currentSlide.objectives.length > 0 && (
                      <div className="p-6 sm:p-8 rounded-2xl bg-teal-950/50 border border-teal-500/50 shadow-xl space-y-4">
                        <h3 className="text-xs sm:text-sm font-black text-teal-300 uppercase tracking-wider flex items-center gap-2">
                          <Target className="w-5 h-5 text-teal-400" />
                          Mục tiêu cần đạt trong tiết học:
                        </h3>
                        <ul className="space-y-3.5">
                          {currentSlide.objectives.map((obj, idx) => {
                            const isVisible = showAllContent || currentRevealStep >= idx + 2;
                            if (!isVisible) return null;
                            return (
                              <li
                                key={idx}
                                className="flex items-start gap-3.5 text-base sm:text-lg text-slate-100 font-medium anim-entrance-slide-up"
                              >
                                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-1" />
                                <span className="leading-relaxed">
                                  <MathRenderer text={obj} />
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* B. WARMUP SLIDE */}
                {currentSlide.activityType === 'warmup' && (
                  <div className="space-y-6">
                    {currentSlide.content && (
                      <div className="p-6 sm:p-7 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-slate-100 text-base sm:text-lg lg:text-xl leading-relaxed shadow-lg anim-entrance-fade">
                        <h3 className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          Tình huống thực tế mở đầu:
                        </h3>
                        <MathRenderer text={currentSlide.content} />
                      </div>
                    )}

                    {currentSlide.practiceItems && currentSlide.practiceItems.length > 0 && (
                      <div className="space-y-4">
                        {currentSlide.practiceItems.map((item, idx) => {
                          const qStep = (currentSlide.content ? 1 : 0) + idx * 2 + 1;
                          const aStep = qStep + 1;
                          const isQuestionVis = showAllContent || currentRevealStep >= qStep;
                          const isAnswerVis = showAllContent || currentRevealStep >= aStep || !!revealedSolutions[`${currentSlide.id}-${idx}`] || !!revealedSolutions[currentSlide.id];

                          if (!isQuestionVis) return null;

                          return (
                            <div
                              key={idx}
                              className="p-6 sm:p-7 rounded-2xl bg-slate-800/95 border border-slate-700 text-slate-100 shadow-xl anim-entrance-slide-up space-y-3.5"
                            >
                              <div className="text-xs sm:text-sm font-black text-teal-300 uppercase tracking-wider flex items-center gap-2">
                                <span>❓ Câu hỏi khởi động:</span>
                              </div>
                              <div className="text-base sm:text-lg lg:text-xl font-bold leading-relaxed text-white">
                                <MathRenderer text={item.question} />
                              </div>
                              {item.hint && (
                                <div className="text-sm text-amber-300/90 flex items-center gap-2 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                                  <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
                                  <span>Gợi ý: {item.hint}</span>
                                </div>
                              )}
                              {item.answer && (
                                <div className="pt-3 border-t border-slate-700/70">
                                  {isAnswerVis ? (
                                    <div className="text-base sm:text-lg text-emerald-200 font-semibold bg-emerald-950/50 p-4 rounded-xl border border-emerald-500/40 anim-entrance-slide-up">
                                      <div className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Nhận xét / Kết luận mở đầu:</span>
                                      </div>
                                      <MathRenderer text={item.answer} />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between py-1 bg-slate-900/40 px-3.5 rounded-xl border border-slate-800">
                                      <span className="text-xs text-slate-400">
                                        Học sinh quan sát, thảo luận cặp đôi...
                                      </span>
                                      <button
                                        onClick={() => toggleSolution(`${currentSlide.id}-${idx}`)}
                                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition cursor-pointer active:scale-95"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-teal-400" />
                                        <span>Hiện nhận xét mở đầu</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* C. KNOWLEDGE / SECTION SLIDE */}
                {currentSlide.activityType === 'knowledge' && (() => {
                  const hasContent = !!currentSlide.content;
                  const hasFormula = !!(currentSlide.formula || (currentSlide.formulas && currentSlide.formulas.length > 0));
                  const formulaStep = hasContent ? 2 : 1;
                  const keyPointsStart = (hasContent ? 1 : 0) + (hasFormula ? 1 : 0) + 1;
                  const calloutStep = keyPointsStart + (currentSlide.keyPoints?.length || 0);

                  const isContentVis = showAllContent || currentRevealStep >= 1;
                  const isFormulaVis = showAllContent || currentRevealStep >= formulaStep;
                  const isCalloutVis = showAllContent || currentRevealStep >= calloutStep;

                  return (
                    <div className="space-y-5">
                      {currentSlide.content && isContentVis && (
                        <div className="text-base sm:text-lg lg:text-xl text-slate-100 leading-relaxed font-normal bg-slate-800/60 p-5 sm:p-6 rounded-2xl border border-slate-700/80 shadow-md anim-entrance-fade">
                          <MathRenderer text={currentSlide.content} />
                        </div>
                      )}

                      {/* FORMULA HIGHLIGHT BOX */}
                      {hasFormula && isFormulaVis && (
                        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-indigo-950/80 border-2 border-teal-500/60 shadow-2xl text-center my-3 anim-entrance-slide-up">
                          <span className="text-xs font-black text-teal-400 uppercase tracking-widest block mb-3">
                            ⭐ CÔNG THỨC & QUY TẮC TRỌNG TÂM
                          </span>
                          <div className="text-lg sm:text-2xl lg:text-3xl font-black text-white">
                            {currentSlide.formula && <MathRenderer text={`$$${currentSlide.formula}$$`} block />}
                            {currentSlide.formulas && currentSlide.formulas.map((form, fIdx) => (
                              <div key={fIdx} className="my-2.5">
                                <MathRenderer text={`$$${form}$$`} block />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* KEY POINTS LIST */}
                      {currentSlide.keyPoints && currentSlide.keyPoints.length > 0 && (
                        <div className="space-y-3">
                          {currentSlide.keyPoints.map((kp, idx) => {
                            const kpStep = keyPointsStart + idx;
                            const isVisible = showAllContent || currentRevealStep >= kpStep;
                            if (!isVisible) return null;
                            return (
                              <div
                                key={idx}
                                className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-slate-800/85 border border-slate-700 text-base sm:text-lg text-slate-100 font-medium anim-entrance-slide-up shadow-md"
                              >
                                <span className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center shrink-0 text-xs sm:text-sm mt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="leading-relaxed flex-1">
                                  <MathRenderer text={kp} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* CALLOUT BOX */}
                      {currentSlide.callout && isCalloutVis && (
                        <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/50 border border-amber-500/50 text-base sm:text-lg text-amber-100 flex items-start gap-3.5 shadow-xl anim-entrance-slide-up">
                          <Lightbulb className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong className="font-bold text-amber-300">Lưu ý quan trọng: </strong>
                            <MathRenderer text={currentSlide.callout.text} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* D. EXAMPLE SLIDE (WITH STEP-BY-STEP REVEAL) */}
                {currentSlide.activityType === 'example' && currentSlide.examples && (
                  <div className="space-y-5">
                    {currentSlide.examples.map((ex, idx) => {
                      const probStep = idx * 2 + 1;
                      const solStep = idx * 2 + 2;
                      const isProbVis = showAllContent || currentRevealStep >= probStep;
                      const isSolVis = showAllContent || currentRevealStep >= solStep || !!revealedSolutions[`${currentSlide.id}-${idx}`];

                      if (!isProbVis) return null;

                      return (
                        <div
                          key={idx}
                          className="p-6 sm:p-8 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-2xl space-y-5 anim-entrance-slide-up"
                        >
                          <div>
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block mb-2">
                              📌 VÍ DỤ MINH HỌA #{idx + 1}:
                            </span>
                            <div className="text-base sm:text-lg lg:text-xl font-bold text-white leading-relaxed">
                              <MathRenderer text={ex.problem} />
                            </div>
                          </div>

                          {/* SOLUTION BOX */}
                          <div className="pt-4 border-t border-slate-700/70">
                            {isSolVis ? (
                              <div className="p-5 sm:p-6 rounded-xl bg-indigo-950/50 border border-indigo-500/50 text-slate-100 space-y-3 anim-entrance-slide-up shadow-inner">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm font-black text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                    HƯỚNG DẪN GIẢI CHI TIẾT TỪNG BƯỚC:
                                  </span>
                                  <button
                                    onClick={() =>
                                      setRevealedSolutions((prev) => ({
                                        ...prev,
                                        [`${currentSlide.id}-${idx}`]: false,
                                      }))
                                    }
                                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    <EyeOff className="w-3 h-3" />
                                    <span>Ẩn</span>
                                  </button>
                                </div>
                                <div className="text-base sm:text-lg leading-relaxed text-slate-100 font-medium">
                                  <MathRenderer text={ex.solution} block />
                                </div>
                                {ex.note && (
                                  <div className="text-sm text-amber-300 pt-2 border-t border-indigo-500/30">
                                    💡 Lưu ý phương pháp: {ex.note}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between py-2 bg-slate-900/50 px-4 rounded-xl border border-slate-800">
                                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                                  Học sinh suy nghĩ và trình bày ra nháp...
                                </span>
                                <button
                                  onClick={() =>
                                    setRevealedSolutions((prev) => ({
                                      ...prev,
                                      [`${currentSlide.id}-${idx}`]: true,
                                    }))
                                  }
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-900/30 transition cursor-pointer active:scale-95"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>👁️ Hiện lời giải</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* E. PRACTICE SLIDE */}
                {currentSlide.activityType === 'practice' && (
                  <div className="space-y-5">
                    {/* QUIZ QUESTION REFERENCE FROM QUESTION BANK */}
                    {currentSlide.questionRef ? (() => {
                      const isOptionsVis = showAllContent || currentRevealStep >= 2;
                      const isExplanationVis = showAllContent || currentRevealStep >= 3 || !!selectedQuizAnswers[currentSlide.id];

                      return (
                        <div className="p-6 sm:p-8 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-5 shadow-2xl anim-entrance-slide-up">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                              🎯 CÂU HỎI TRẮC NGHIỆM LUYỆN TẬP:
                            </span>
                            {currentSlide.questionRef.cognitiveLevel && (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {currentSlide.questionRef.cognitiveLevel}
                              </span>
                            )}
                          </div>

                          <div className="text-base sm:text-lg lg:text-xl font-bold text-white leading-relaxed">
                            <MathRenderer text={currentSlide.questionRef.content} />
                          </div>

                          {/* Options A, B, C, D */}
                          {currentSlide.questionRef.options && currentSlide.questionRef.options.length > 0 && (
                            isOptionsVis ? (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 anim-entrance-slide-up">
                                {currentSlide.questionRef.options.map((opt) => {
                                  const selectedKey = selectedQuizAnswers[currentSlide.id];
                                  const isSelected = selectedKey === opt.key;
                                  const isCorrect = currentSlide.questionRef?.correctAnswer === opt.key;
                                  const hasAnswered = !!selectedKey;

                                  let btnStyle = 'bg-slate-800/90 border-slate-700 text-slate-100 hover:bg-slate-700';
                                  if (hasAnswered) {
                                    if (isCorrect) {
                                      btnStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-900/30';
                                    } else if (isSelected && !isCorrect) {
                                      btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200';
                                    }
                                  }

                                  return (
                                    <button
                                      key={opt.key}
                                      onClick={() =>
                                        setSelectedQuizAnswers((prev) => ({
                                          ...prev,
                                          [currentSlide.id]: opt.key,
                                        }))
                                      }
                                      className={`p-4 rounded-xl border text-left font-semibold text-base sm:text-lg flex items-center gap-3.5 transition cursor-pointer ${btnStyle}`}
                                    >
                                      <span
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                          hasAnswered && isCorrect
                                            ? 'bg-emerald-500 text-slate-950'
                                            : hasAnswered && isSelected
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-slate-700 text-slate-200'
                                        }`}
                                      >
                                        {opt.key}
                                      </span>
                                      <div className="flex-1 leading-relaxed">
                                        <MathRenderer text={opt.text} />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Student Microphone Speech-to-Text Input Widget */}
                              <QuizVoiceAnswerWidget
                                options={currentSlide.questionRef.options.map((o) => ({ key: o.key, text: o.text }))}
                                selectedOption={selectedQuizAnswers[currentSlide.id] || null}
                                onSelectOption={(optKey) => {
                                  setSelectedQuizAnswers((prev) => ({
                                    ...prev,
                                    [currentSlide.id]: optKey,
                                  }));
                                }}
                              />
                            </>
                            ) : (
                              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-400 text-center font-medium">
                                Học sinh tự giải nháp trước khi xem các phương án trả lời... (Bấm Phím Cách hoặc Hiện ý tiếp)
                              </div>
                            )
                          )}

                          {/* Question Feedback & Explanation */}
                          {isExplanationVis && (
                            <div className="p-5 sm:p-6 rounded-xl bg-slate-900/95 border border-emerald-500/40 text-sm sm:text-base space-y-2 anim-entrance-slide-up">
                              <div className="font-bold text-emerald-400 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Đáp án đúng: {currentSlide.questionRef.correctAnswer}</span>
                              </div>
                              {currentSlide.questionRef.explanation && (
                                <div className="text-slate-200 leading-relaxed pt-1 text-base font-normal">
                                  <MathRenderer text={currentSlide.questionRef.explanation} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      /* Standard practice items */
                      currentSlide.practiceItems?.map((item, idx) => {
                        const qStep = idx * 2 + 1;
                        const aStep = idx * 2 + 2;
                        const isQVis = showAllContent || currentRevealStep >= qStep;
                        const isAVis = showAllContent || currentRevealStep >= aStep || !!revealedSolutions[`${currentSlide.id}-${idx}`];

                        if (!isQVis) return null;

                        return (
                          <div
                            key={idx}
                            className="p-6 sm:p-7 rounded-2xl bg-slate-800/90 border border-slate-700 text-slate-100 space-y-4 shadow-xl anim-entrance-slide-up"
                          >
                            <div className="text-base sm:text-lg lg:text-xl font-bold text-white leading-relaxed">
                              <MathRenderer text={item.question} />
                            </div>
                            {item.hint && (
                              <div className="text-xs sm:text-sm text-amber-300/90 flex items-center gap-2 bg-amber-950/30 p-3 rounded-xl border border-amber-500/30">
                                <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
                                <span>Gợi ý: {item.hint}</span>
                              </div>
                            )}
                            {item.answer && (
                              <div className="pt-3 border-t border-slate-700/60">
                                {isAVis ? (
                                  <div className="p-4 sm:p-5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-base sm:text-lg text-emerald-100 anim-entrance-slide-up">
                                    <strong className="text-emerald-300 block mb-1 font-bold">Đáp án & Hướng dẫn:</strong>
                                    <MathRenderer text={item.answer} />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between py-1 bg-slate-900/40 px-3.5 rounded-xl border border-slate-800">
                                    <span className="text-xs text-slate-400">Học sinh giải bài vào vở...</span>
                                    <button
                                      onClick={() =>
                                        setRevealedSolutions((prev) => ({
                                          ...prev,
                                          [`${currentSlide.id}-${idx}`]: true,
                                        }))
                                      }
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-teal-400" />
                                      <span>Hiện đáp án</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* F. APPLICATION SLIDE */}
                {currentSlide.activityType === 'application' && (
                  <div className="space-y-6">
                    {currentSlide.content && (
                      <div className="p-6 sm:p-7 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-slate-100 text-base sm:text-lg lg:text-xl leading-relaxed shadow-xl anim-entrance-fade">
                        <h3 className="text-xs sm:text-sm font-black text-purple-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Tình huống vận dụng thực tiễn:
                        </h3>
                        <MathRenderer text={currentSlide.content} />
                      </div>
                    )}

                    {currentSlide.practiceItems && currentSlide.practiceItems.length > 0 && (
                      <div className="space-y-4">
                        {currentSlide.practiceItems.map((item, idx) => {
                          const qStep = (currentSlide.content ? 1 : 0) + idx * 2 + 1;
                          const aStep = qStep + 1;
                          const isQVis = showAllContent || currentRevealStep >= qStep;
                          const isAVis = showAllContent || currentRevealStep >= aStep || !!revealedSolutions[`${currentSlide.id}-${idx}`] || !!revealedSolutions[currentSlide.id];

                          if (!isQVis) return null;

                          return (
                            <div
                              key={idx}
                              className="p-6 sm:p-7 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-4 anim-entrance-slide-up"
                            >
                              <div className="text-base sm:text-lg lg:text-xl font-bold text-white leading-relaxed">
                                <MathRenderer text={item.question} />
                              </div>
                              {item.answer && (
                                <div className="pt-2 border-t border-slate-700/60">
                                  {isAVis ? (
                                    <div className="p-5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-base sm:text-lg text-purple-100 anim-entrance-slide-up space-y-2">
                                      <span className="font-bold text-purple-300 block text-xs uppercase tracking-wider">
                                        💡 Lời giải mô hình hóa thực tế:
                                      </span>
                                      <MathRenderer text={item.answer} block />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between py-1 bg-slate-900/40 px-3.5 rounded-xl border border-slate-800">
                                      <span className="text-xs text-slate-400">
                                        Học sinh thảo luận và mô hình hóa bài toán thực tế...
                                      </span>
                                      <button
                                        onClick={() => toggleSolution(`${currentSlide.id}-${idx}`)}
                                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
                                      >
                                        <Eye className="w-4 h-4" />
                                        <span>Hiện lời giải chi tiết</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* G. SUMMARY SLIDE */}
                {currentSlide.activityType === 'summary' && (
                  <div className="space-y-6">
                    {currentSlide.summary && currentSlide.summary.length > 0 && (
                      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/40 shadow-2xl space-y-4">
                        <h3 className="text-xs sm:text-sm font-black text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                          Tổng kết kiến thức trọng tâm cần nhớ:
                        </h3>
                        <ul className="space-y-3.5">
                          {currentSlide.summary.map((sumItem, idx) => {
                            const isVisible = showAllContent || currentRevealStep >= idx + 1;
                            if (!isVisible) return null;
                            return (
                              <li
                                key={idx}
                                className="flex items-start gap-3.5 text-base sm:text-lg text-slate-100 font-medium anim-entrance-slide-up"
                              >
                                <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs sm:text-sm border border-indigo-500/30 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="leading-relaxed flex-1">
                                  <MathRenderer text={sumItem} />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {currentSlide.content && (
                      (showAllContent || currentRevealStep >= (currentSlide.summary?.length || 0) + 1) && (
                        <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-100 text-base sm:text-lg leading-relaxed shadow-lg anim-entrance-slide-up">
                          <strong className="font-bold text-amber-300 block mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Dặn dò & Nhiệm vụ học tập về nhà:
                          </strong>
                          <MathRenderer text={currentSlide.content} />
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* H. GAME SLIDE */}
            {currentSlide.activityType === 'game' && (
              <div className="text-center py-6 sm:py-10 space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/30 animate-bounce">
                  <Gamepad2 className="w-10 h-10" />
                </div>

                <div className="max-w-xl mx-auto">
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                    Khởi động Trò chơi Củng cố Tiết dạy
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Sử dụng bộ câu hỏi đã chuẩn bị trong bài học để thi đua trực tiếp giữa các học sinh/đội nhóm trong lớp!
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      if (onLaunchGame) {
                        const targetSet = lesson?.questionSets?.[0];
                        onLaunchGame('GESTURE_QUIZ_AI', targetSet);
                      }
                    }}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-yellow-500/20 transition cursor-pointer active:scale-95"
                  >
                    <Zap className="w-5 h-5 fill-slate-950" />
                    <span>BẮT ĐẦU CHƠI TRÒ CHƠI LỚP HỌC</span>
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>

          {/* SLIDE FOOTER BAR */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 relative z-10">
            <div className="flex items-center gap-2 font-medium">
              <span>{lesson?.subject || 'Toán học'} {lesson?.grade ? `Lớp ${lesson.grade}` : ''}</span>
              <span>•</span>
              <span className="truncate max-w-[200px] sm:max-w-md">{lesson?.title}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-slate-400">
                Dùng phím mũi tên <strong className="text-slate-200">← →</strong> hoặc <strong className="text-slate-200">Phím cách</strong>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 4. FLOATING BOTTOM CONTROL BAR */}
      <footer className="h-16 px-4 sm:px-6 bg-slate-900/95 border-t border-slate-800/90 flex items-center justify-between z-30 shrink-0 backdrop-blur-md gap-2">
        {/* Left: Previous Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-prev-slide"
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer active:scale-95"
            title="Quay lại Slide trước (Shift + ←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trang trước</span>
          </button>

          {!showAllContent && maxRevealStep > 1 && currentRevealStep > 1 && (
            <button
              onClick={() => setCurrentRevealStep((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
              title="Ẩn bớt ý vừa xuất hiện (Quay lại bước trước)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Lùi bước</span>
            </button>
          )}
        </div>

        {/* Center: Slide Jump Dots / Thumbnails & Step Dots */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[45vw] px-2 py-0.5">
            {internalSlides.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => handleGoToSlide(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'w-8 bg-teal-400 shadow-sm shadow-teal-500/50'
                      : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Nhảy tới Slide ${idx + 1}: ${slide.title}`}
                />
              );
            })}
          </div>

          {/* Step Progress Dots for current slide */}
          {!showAllContent && maxRevealStep > 1 && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
              <span>Ý/Bước:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: maxRevealStep }).map((_, sIdx) => {
                  const isCurrent = sIdx + 1 === currentRevealStep;
                  const isPassed = sIdx + 1 < currentRevealStep;
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setCurrentRevealStep(sIdx + 1)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-400 scale-125 ring-2 ring-indigo-400/50'
                          : isPassed
                          ? 'bg-teal-400'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      title={`Đến bước #${sIdx + 1}`}
                    />
                  );
                })}
              </div>
              <span className="text-indigo-300 font-mono">
                {currentRevealStep}/{maxRevealStep}
              </span>
            </div>
          )}
        </div>

        {/* Right: Next Step or Next Slide */}
        <div className="flex items-center gap-2">
          {!showAllContent && currentRevealStep < maxRevealStep ? (
            <>
              <button
                id="btn-next-step"
                onClick={handleNextStepOrSlide}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition shadow-md shadow-indigo-900/40 cursor-pointer active:scale-95 animate-pulse"
                title="Hiện ý / khối văn bản tiếp theo (Phím Cách hoặc Phím →)"
              >
                <Sparkles className="w-4 h-4" />
                <span>Hiện ý tiếp ({currentRevealStep + 1}/{maxRevealStep})</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextSlide}
                disabled={currentSlideIndex === internalSlides.length - 1}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer"
                title="Bỏ qua và sang thẳng slide tiếp theo (Shift + →)"
              >
                <span>Sang slide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              id="btn-next-slide"
              onClick={handleNextSlide}
              disabled={currentSlideIndex === internalSlides.length - 1}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-black transition shadow-md shadow-teal-900/30 cursor-pointer active:scale-95"
              title="Sang Slide tiếp theo (Phím → hoặc Phím cách)"
            >
              <span>Trang tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>

      {/* 5. SLIDE NAVIGATOR DRAWER (ALL SLIDES THUMBNAILS GRID) */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Grid className="w-4 h-4 text-teal-400" />
                <span>Tiến trình bài dạy ({internalSlides.length} Slide)</span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {internalSlides.map((slide, idx) => {
                const isSelected = idx === currentSlideIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={() => handleGoToSlide(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-teal-950/60 border-teal-500 text-white shadow-lg shadow-teal-950'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mb-1 ${getActivityBgBadge(
                          slide.activityType
                        )}`}
                      >
                        {slide.activityCode}
                      </span>
                      <div className="text-xs font-bold text-white truncate">
                        {slide.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. TEACHER SPEAKER NOTES MODAL / DRAWER */}
      {showTeacherNotes && (
        <div className="fixed bottom-20 right-6 z-50 w-full max-w-sm bg-slate-900/95 border border-teal-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-teal-300 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Ghi chú sư phạm (Slide {currentSlideIndex + 1})</span>
            </div>
            <button
              onClick={() => setShowTeacherNotes(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="pt-3 text-xs text-slate-200 leading-relaxed">
            {currentSlide.teacherNotes ||
              'Chưa có ghi chú sư phạm cho slide này. Giáo viên có thể hướng dẫn học sinh quan sát và trả lời các câu hỏi gợi mở.'}
          </div>
        </div>
      )}

      {/* 7. KEYBOARD SHORTCUTS HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2 text-base font-black text-white">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <span>Bảng phím tắt trình chiếu bài giảng</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Hiện ý tiếp theo</span>
                <kbd className="px-2 py-1 bg-slate-700 text-teal-300 rounded font-mono font-bold">→ / Space</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Sang thẳng slide tiếp</span>
                <kbd className="px-2 py-1 bg-slate-700 text-teal-300 rounded font-mono font-bold">Shift + →</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Bật/tắt hiện hết văn bản</span>
                <kbd className="px-2 py-1 bg-slate-700 text-amber-300 rounded font-mono font-bold">A</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Tự động chuyển bước</span>
                <kbd className="px-2 py-1 bg-slate-700 text-emerald-300 rounded font-mono font-bold">S</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Quay lại slide trước</span>
                <kbd className="px-2 py-1 bg-slate-700 text-teal-300 rounded font-mono font-bold">← / Backspace</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Toàn màn hình</span>
                <kbd className="px-2 py-1 bg-slate-700 text-teal-300 rounded font-mono font-bold">F / F11</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Con trỏ Laser đỏ</span>
                <kbd className="px-2 py-1 bg-slate-700 text-rose-300 rounded font-mono font-bold">L</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Bút vẽ chú thích</span>
                <kbd className="px-2 py-1 bg-slate-700 text-emerald-300 rounded font-mono font-bold">P / D</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Bảng đen giảng bài</span>
                <kbd className="px-2 py-1 bg-slate-700 text-indigo-300 rounded font-mono font-bold">B</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Xem tất cả slide</span>
                <kbd className="px-2 py-1 bg-slate-700 text-teal-300 rounded font-mono font-bold">G</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Ghi chú giáo viên</span>
                <kbd className="px-2 py-1 bg-slate-700 text-teal-300 rounded font-mono font-bold">N</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between col-span-full">
                <span className="text-slate-300">Thoát trình chiếu</span>
                <kbd className="px-2 py-1 bg-slate-700 text-rose-300 rounded font-mono font-bold">Escape</kbd>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
