import { Lesson, PresentationItem, StructuredLecture } from '../types/teacherLesson';
import { StructuredPresentation, StructuredSlideItem } from '../types/presentationStructure';
import {
  LessonPresentationPackage,
  TeachingActivity,
  EditorSlide,
  ContentBlock,
  TextBlock,
  HeadingBlock,
  MathBlock,
  QuestionBlock,
  TableBlock,
  ImageBlock,
} from '../types/contentBlock';

/**
 * Generate a unique ID with an optional prefix
 */
export const generateBlockId = (prefix: string = 'blk'): string => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
};

export const generateSlideId = (): string => generateBlockId('sld');
export const generateActivityId = (): string => generateBlockId('act');

/**
 * Creates a default standardized pedagogical flow for a lesson
 */
export const createDefaultPresentationPackage = (lesson: Lesson): LessonPresentationPackage => {
  const lessonTitle = lesson.title || 'Bài giảng Toán học';
  const now = new Date().toISOString();

  // 1. Khởi động (Warm-up)
  const warmupSlide: EditorSlide = {
    id: generateBlockId('sld'),
    title: 'Tình huống khởi động',
    order: 1,
    layout: 'title-content',
    notes: 'Giáo viên chiếu tình huống thực tế hoặc câu đố ngắn khơi gợi sự tò mò của học sinh.',
    blocks: [
      {
        id: generateBlockId('blk_hdg'),
        type: 'heading',
        position: { x: 5, y: 8 },
        size: { width: 90, height: 12 },
        order: 1,
        visible: true,
        content: {
          text: `Hoạt động 1: KHỞI ĐỘNG — ${lessonTitle}`,
          level: 'h1',
          badge: 'Khởi động',
          color: '#0D9488',
        },
      } as HeadingBlock,
      {
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 5, y: 24 },
        size: { width: 90, height: 28 },
        order: 2,
        visible: true,
        content: {
          text: 'Trong đời sống và khoa học thực tiễn, việc tính toán và mô hình hóa các đại lượng thường dẫn đến các biểu thức toán học đặc biệt. Hãy quan sát và thảo luận tình huống sau đây...',
          fontSize: 20,
          lineHeight: 1.6,
          color: '#1E293B',
        },
      } as TextBlock,
      {
        id: generateBlockId('blk_math'),
        type: 'math',
        position: { x: 5, y: 56 },
        size: { width: 90, height: 32 },
        order: 3,
        visible: true,
        content: {
          latex: 'S = a \\cdot b + \\frac{1}{2} c \\cdot h',
          explanation: 'Biểu thức tính diện tích hình kết hợp thực tế',
          displayMode: 'block',
          isLarge: true,
        },
      } as MathBlock,
    ],
  };

  // 2. Hình thành kiến thức
  const knowledgeSlide: EditorSlide = {
    id: generateBlockId('sld'),
    title: 'Khái niệm & Định nghĩa trọng tâm',
    order: 1,
    layout: 'title-content',
    notes: 'Nhấn mạnh các định nghĩa toán học cốt lõi và ví dụ đối sánh.',
    blocks: [
      {
        id: generateBlockId('blk_hdg'),
        type: 'heading',
        position: { x: 5, y: 8 },
        size: { width: 90, height: 12 },
        order: 1,
        visible: true,
        content: {
          text: 'Định nghĩa & Tính chất trọng tâm',
          level: 'h1',
          badge: 'Kiến thức cốt lõi',
          color: '#2563EB',
        },
      } as HeadingBlock,
      {
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 5, y: 24 },
        size: { width: 90, height: 26 },
        order: 2,
        visible: true,
        content: {
          text: `Quy tắc cơ bản của bài học ${lessonTitle}: Cần chú ý phân biệt rõ giữa các thành phần số và biến, bậc của biểu thức và các trường hợp ngoại lệ.`,
          fontSize: 20,
          fontWeight: 'normal',
          lineHeight: 1.6,
          color: '#1E293B',
        },
      } as TextBlock,
      {
        id: generateBlockId('blk_math'),
        type: 'math',
        position: { x: 5, y: 54 },
        size: { width: 90, height: 35 },
        order: 3,
        visible: true,
        content: {
          latex: 'P(x) = a_n x^n + a_{n-1} x^{n-1} + \\dots + a_1 x + a_0',
          explanation: 'Dạng tổng quát biểu thức',
          displayMode: 'block',
          isLarge: true,
        },
      } as MathBlock,
    ],
  };

  // 3. Luyện tập
  const practiceSlide: EditorSlide = {
    id: generateBlockId('sld'),
    title: 'Câu hỏi tự luyện tại lớp',
    order: 1,
    layout: 'question-center',
    notes: 'Học sinh làm việc cá nhân trong 2 phút rồi giáo viên công bố đáp án.',
    blocks: [
      {
        id: generateBlockId('blk_hdg'),
        type: 'heading',
        position: { x: 5, y: 6 },
        size: { width: 90, height: 10 },
        order: 1,
        visible: true,
        content: {
          text: 'Luyện tập: Câu hỏi trắc nghiệm nhận biết',
          level: 'h2',
          badge: 'Luyện tập',
          color: '#D97706',
        },
      } as HeadingBlock,
      {
        id: generateBlockId('blk_ques'),
        type: 'question',
        position: { x: 5, y: 20 },
        size: { width: 90, height: 72 },
        order: 2,
        visible: true,
        content: {
          content: `Biểu thức nào sau đây minh họa đúng kiến thức bài học ${lessonTitle}?`,
          options: [
            { id: 'opt_a', label: 'A', text: 'Biểu thức chứa căn bậc hai ở mẫu' },
            { id: 'opt_b', label: 'B', text: 'Biểu thức tích các số thực và biến lũy thừa nguyên dương' },
            { id: 'opt_c', label: 'C', text: 'Tổng chứa phép chia cho biến x' },
            { id: 'opt_d', label: 'D', text: 'Biểu thức có biến số âm trong căn' },
          ],
          correctAnswer: 'B',
          solution: 'Theo định nghĩa chuẩn, biến phải có số mũ nguyên không âm và không chia cho biến.',
          difficulty: 'medium',
        },
      } as QuestionBlock,
    ],
  };

  // 4. Vận dụng
  const applicationSlide: EditorSlide = {
    id: generateBlockId('sld'),
    title: 'Bài toán thực tế',
    order: 1,
    layout: 'title-content',
    notes: 'Kết nối kiến thức toán học với các vấn đề kỹ thuật hoặc kinh tế gia đình.',
    blocks: [
      {
        id: generateBlockId('blk_hdg'),
        type: 'heading',
        position: { x: 5, y: 8 },
        size: { width: 90, height: 12 },
        order: 1,
        visible: true,
        content: {
          text: 'Vận dụng thực tiễn vào đời sống',
          level: 'h1',
          badge: 'Vận dụng',
          color: '#059669',
        },
      } as HeadingBlock,
      {
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 5, y: 24 },
        size: { width: 90, height: 65 },
        order: 2,
        visible: true,
        content: {
          text: 'Một xưởng sản xuất cần tối ưu hóa chi phí nguyên vật liệu bằng biểu thức bậc hai f(x). Hãy xác định giá trị x để chi phí đạt mức tối thiểu.',
          fontSize: 22,
          lineHeight: 1.6,
          color: '#1E293B',
        },
      } as TextBlock,
    ],
  };

  // 5. Củng cố
  const summarySlide: EditorSlide = {
    id: generateBlockId('sld'),
    title: 'Ghi nhớ trọng tâm & Dặn dò',
    order: 1,
    layout: 'title-content',
    notes: 'Tổng kết nội dung cần khắc sâu và giao bài tập về nhà.',
    blocks: [
      {
        id: generateBlockId('blk_hdg'),
        type: 'heading',
        position: { x: 5, y: 8 },
        size: { width: 90, height: 12 },
        order: 1,
        visible: true,
        content: {
          text: '05. Củng cố & Hướng dẫn học tập',
          level: 'h1',
          badge: 'Tổng kết',
          color: '#7C3AED',
        },
      } as HeadingBlock,
      {
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 5, y: 24 },
        size: { width: 90, height: 68 },
        order: 2,
        visible: true,
        content: {
          text: `1. Ghi nhớ định nghĩa và công thức tính trong bài ${lessonTitle}.\n2. Chú ý các điều kiện xác định và lỗi sai học sinh thường gặp.\n3. Hoàn thành bài tập SGK và chuẩn bị bài học tiếp theo.`,
          fontSize: 22,
          lineHeight: 1.8,
          color: '#1E293B',
        },
      } as TextBlock,
    ],
  };

  // 6. Trò chơi
  const gameSlide: EditorSlide = {
    id: generateBlockId('sld'),
    title: 'Đấu trường kiến thức',
    order: 1,
    layout: 'blank',
    notes: 'Kích hoạt trò chơi để tạo không khí sôi nổi cuối tiết học.',
    blocks: [
      {
        id: generateBlockId('blk_hdg'),
        type: 'heading',
        position: { x: 5, y: 15 },
        size: { width: 90, height: 15 },
        order: 1,
        visible: true,
        content: {
          text: '06. Đấu trường Toán học sôi nổi',
          level: 'h1',
          badge: 'Trò chơi',
          color: '#EA580C',
        },
      } as HeadingBlock,
      {
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 10, y: 35 },
        size: { width: 80, height: 40 },
        order: 2,
        visible: true,
        content: {
          text: 'Sẵn sàng tham gia vào các thử thách tương tác nhanh để củng cố kiến thức cùng cả lớp!',
          fontSize: 24,
          textAlign: 'center',
          color: '#334155',
        },
      } as TextBlock,
    ],
  };

  const activities: TeachingActivity[] = [
    {
      id: generateBlockId('act'),
      title: '01. KHỞI ĐỘNG',
      order: 1,
      timeMinutes: 5,
      description: 'Tạo hứng thú, kết nối kiến thức thực tế với bài học mới',
      slides: [warmupSlide],
    },
    {
      id: generateBlockId('act'),
      title: '02. HÌNH THÀNH KIẾN THỨC',
      order: 2,
      timeMinutes: 20,
      description: 'Định nghĩa, định lý, công thức toán học và ví dụ mẫu',
      slides: [knowledgeSlide],
    },
    {
      id: generateBlockId('act'),
      title: '03. LUYỆN TẬP',
      order: 3,
      timeMinutes: 10,
      description: 'Bài tập trắc nghiệm, tự luận củng cố nhanh tại lớp',
      slides: [practiceSlide],
    },
    {
      id: generateBlockId('act'),
      title: '04. VẬN DỤNG',
      order: 4,
      timeMinutes: 5,
      description: 'Bài toán gắn liền đời sống và ứng dụng thực tiễn',
      slides: [applicationSlide],
    },
    {
      id: generateBlockId('act'),
      title: '05. CỦNG CỐ',
      order: 5,
      timeMinutes: 3,
      description: 'Sơ đồ tư duy, ghi nhớ trọng tâm và dặn dò bài tập về nhà',
      slides: [summarySlide],
    },
    {
      id: generateBlockId('act'),
      title: '06. TRÒ CHƠI',
      order: 6,
      timeMinutes: 5,
      description: 'Hoạt động tương tác giải trí học tập',
      slides: [gameSlide],
    },
  ];

  return {
    id: generateBlockId('pkg'),
    lessonId: lesson.id,
    title: lesson.title,
    subject: lesson.subject || 'Toán học',
    grade: lesson.grade || 8,
    bookSeries: (lesson as any).bookSeries || 'Kết nối tri thức',
    chapter: lesson.chapter || 'Chương I',
    period: (lesson as any).period || 'Tiết 1',
    duration: (lesson as any).duration || '45 phút',
    objectives: (lesson as any).objectives || ['Nắm vững kiến thức trọng tâm', 'Vận dụng thành thạo bài tập'],
    teacherName: (lesson as any).teacherName || 'Giáo viên',
    schoolYear: '2025 - 2026',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    activities,
  };
};

/**
 * Adapter: Convert existing legacy PresentationItem or StructuredLecture into LessonPresentationPackage
 */
export const convertLegacyPresentationToPackage = (
  lesson: Lesson,
  presentation: PresentationItem
): LessonPresentationPackage => {
  // If already packaged with activities
  if ((presentation as any).presentationPackage) {
    return (presentation as any).presentationPackage;
  }
  if ((presentation as any).activities && Array.isArray((presentation as any).activities)) {
    return {
      id: presentation.id,
      lessonId: lesson.id,
      title: presentation.title || lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      bookSeries: (lesson as any).bookSeries,
      chapter: lesson.chapter,
      period: (lesson as any).period,
      duration: (presentation as any).duration || '45 phút',
      objectives: (lesson as any).objectives || [],
      status: 'completed',
      createdAt: String(presentation.createdAt),
      updatedAt: String((presentation as any).updatedAt || presentation.createdAt),
      activities: (presentation as any).activities,
    };
  }

  // If it's an AI-structured lecture, convert sections into activities
  if (presentation.sourceType === 'ai-structured' && (presentation as any).lecture) {
    const lecture: StructuredLecture = (presentation as any).lecture;
    const activities: TeachingActivity[] = [];

    // 1. Khởi động
    const warmupBlocks: ContentBlock[] = [
      {
        id: generateBlockId('blk_hdg'),
        type: 'heading',
        position: { x: 5, y: 8 },
        size: { width: 90, height: 12 },
        order: 1,
        visible: true,
        content: {
          text: '01. KHỞI ĐỘNG',
          level: 'h1',
          badge: 'Khởi động',
          color: '#0D9488',
        },
      } as HeadingBlock,
      {
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 5, y: 25 },
        size: { width: 90, height: 35 },
        order: 2,
        visible: true,
        content: {
          text: lecture.warmup?.scenario || 'Tình huống mở đầu tạo hứng thú cho bài học.',
          fontSize: 22,
          lineHeight: 1.6,
          color: '#1E293B',
        },
      } as TextBlock,
    ];

    if (lecture.warmup?.question) {
      warmupBlocks.push({
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 5, y: 65 },
        size: { width: 90, height: 25 },
        order: 3,
        visible: true,
        content: {
          text: `❓ Câu hỏi thảo luận: ${lecture.warmup.question}`,
          fontSize: 20,
          fontWeight: 'bold',
          color: '#0D9488',
        },
      } as TextBlock);
    }

    activities.push({
      id: generateBlockId('act'),
      title: '01. KHỞI ĐỘNG',
      order: 1,
      timeMinutes: 5,
      slides: [
        {
          id: generateBlockId('sld'),
          title: 'Khởi động bài học',
          order: 1,
          blocks: warmupBlocks,
        },
      ],
    });

    // 2. Hình thành kiến thức
    const knowledgeSlides: EditorSlide[] = (lecture.sections || []).map((sec, idx) => {
      const secBlocks: ContentBlock[] = [
        {
          id: generateBlockId('blk_hdg'),
          type: 'heading',
          position: { x: 5, y: 6 },
          size: { width: 90, height: 12 },
          order: 1,
          visible: true,
          content: {
            text: sec.title,
            level: 'h1',
            badge: `Kiến thức ${idx + 1}`,
            color: '#2563EB',
          },
        } as HeadingBlock,
        {
          id: generateBlockId('blk_txt'),
          type: 'text',
          position: { x: 5, y: 22 },
          size: { width: 90, height: 32 },
          order: 2,
          visible: true,
          content: {
            text: sec.content,
            fontSize: 20,
            lineHeight: 1.6,
            color: '#1E293B',
          },
        } as TextBlock,
      ];

      if (sec.formula) {
        secBlocks.push({
          id: generateBlockId('blk_math'),
          type: 'math',
          position: { x: 5, y: 58 },
          size: { width: 90, height: 32 },
          order: 3,
          visible: true,
          content: {
            latex: sec.formula,
            explanation: 'Công thức toán học trọng tâm',
            displayMode: 'block',
            isLarge: true,
          },
        } as MathBlock);
      }

      return {
        id: generateBlockId('sld'),
        title: sec.title,
        order: idx + 1,
        blocks: secBlocks,
      };
    });

    activities.push({
      id: generateBlockId('act'),
      title: '02. HÌNH THÀNH KIẾN THỨC',
      order: 2,
      timeMinutes: 20,
      slides: knowledgeSlides.length > 0 ? knowledgeSlides : [
        {
          id: generateBlockId('sld'),
          title: 'Kiến thức trọng tâm',
          order: 1,
          blocks: [],
        },
      ],
    });

    // 3. Luyện tập
    const practiceBlocks: ContentBlock[] = [
      {
        id: generateBlockId('blk_hdg'),
        type: 'heading',
        position: { x: 5, y: 6 },
        size: { width: 90, height: 10 },
        order: 1,
        visible: true,
        content: {
          text: '03. LUYỆN TẬP',
          level: 'h1',
          badge: 'Luyện tập',
          color: '#D97706',
        },
      } as HeadingBlock,
    ];

    if (Array.isArray(lecture.practice) && lecture.practice.length > 0) {
      practiceBlocks.push({
        id: generateBlockId('blk_ques'),
        type: 'question',
        position: { x: 5, y: 20 },
        size: { width: 90, height: 72 },
        order: 2,
        visible: true,
        content: {
          content: lecture.practice[0].question,
          options: [
            { id: 'a', label: 'A', text: 'Đáp án A' },
            { id: 'b', label: 'B', text: 'Đáp án B' },
            { id: 'c', label: 'C', text: 'Đáp án C' },
            { id: 'd', label: 'D', text: 'Đáp án D' },
          ],
          correctAnswer: 'A',
          solution: lecture.practice[0].hint || 'Phân tích và suy luận từng bước theo định lý đã học.',
        },
      } as QuestionBlock);
    }

    activities.push({
      id: generateBlockId('act'),
      title: '03. LUYỆN TẬP',
      order: 3,
      timeMinutes: 10,
      slides: [
        {
          id: generateBlockId('sld'),
          title: 'Luyện tập củng cố',
          order: 1,
          blocks: practiceBlocks,
        },
      ],
    });

    // 4. Vận dụng
    activities.push({
      id: generateBlockId('act'),
      title: '04. VẬN DỤNG',
      order: 4,
      timeMinutes: 5,
      slides: [
        {
          id: generateBlockId('sld'),
          title: 'Vận dụng thực tiễn',
          order: 1,
          blocks: [
            {
              id: generateBlockId('blk_hdg'),
              type: 'heading',
              position: { x: 5, y: 8 },
              size: { width: 90, height: 12 },
              order: 1,
              visible: true,
              content: {
                text: '04. VẬN DỤNG',
                level: 'h1',
                badge: 'Thực tiễn',
                color: '#059669',
              },
            } as HeadingBlock,
            {
              id: generateBlockId('blk_txt'),
              type: 'text',
              position: { x: 5, y: 25 },
              size: { width: 90, height: 60 },
              order: 2,
              visible: true,
              content: {
                text: lecture.application || 'Vận dụng kiến thức giải quyết vấn đề thực tiễn đời sống.',
                fontSize: 22,
                lineHeight: 1.6,
                color: '#1E293B',
              },
            } as TextBlock,
          ],
        },
      ],
    });

    // 5. Củng cố
    activities.push({
      id: generateBlockId('act'),
      title: '05. CỦNG CỐ',
      order: 5,
      timeMinutes: 3,
      slides: [
        {
          id: generateBlockId('sld'),
          title: 'Ghi nhớ trọng tâm',
          order: 1,
          blocks: [
            {
              id: generateBlockId('blk_hdg'),
              type: 'heading',
              position: { x: 5, y: 8 },
              size: { width: 90, height: 12 },
              order: 1,
              visible: true,
              content: {
                text: '05. CỦNG CỐ & DẶN DÒ',
                level: 'h1',
                badge: 'Ghi nhớ',
                color: '#7C3AED',
              },
            } as HeadingBlock,
            {
              id: generateBlockId('blk_txt'),
              type: 'text',
              position: { x: 5, y: 25 },
              size: { width: 90, height: 60 },
              order: 2,
              visible: true,
              content: {
                text: (Array.isArray(lecture.summary) ? lecture.summary : (lecture.summary as any)?.keyPoints || []).join('\n• ') || 'Khắc sâu kiến thức trọng tâm của bài.',
                fontSize: 22,
                lineHeight: 1.8,
                color: '#1E293B',
              },
            } as TextBlock,
          ],
        },
      ],
    });

    // 6. Trò chơi
    activities.push({
      id: generateBlockId('act'),
      title: '06. TRÒ CHƠI',
      order: 6,
      timeMinutes: 5,
      slides: [
        {
          id: generateBlockId('sld'),
          title: 'Trò chơi tương tác',
          order: 1,
          blocks: [
            {
              id: generateBlockId('blk_hdg'),
              type: 'heading',
              position: { x: 5, y: 15 },
              size: { width: 90, height: 15 },
              order: 1,
              visible: true,
              content: {
                text: '06. HOẠT ĐỘNG TRÒ CHƠI LỚP HỌC',
                level: 'h1',
                badge: 'Đấu trường',
                color: '#EA580C',
              },
            } as HeadingBlock,
            {
              id: generateBlockId('blk_txt'),
              type: 'text',
              position: { x: 10, y: 35 },
              size: { width: 80, height: 40 },
              order: 2,
              visible: true,
              content: {
                text: 'Kích hoạt 1 trong 9 trò chơi học tập tương tác lấy dữ liệu từ đề ôn tập của bài.',
                fontSize: 24,
                textAlign: 'center',
                color: '#334155',
              },
            } as TextBlock,
          ],
        },
      ],
    });

    return {
      id: presentation.id,
      lessonId: lesson.id,
      title: presentation.title || lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      bookSeries: (lesson as any).bookSeries,
      chapter: lesson.chapter,
      period: (lesson as any).period,
      duration: (presentation as any).duration || (lesson as any).duration || '45 phút',
      objectives: lecture.objectives || (lesson as any).objectives || [],
      status: 'completed',
      createdAt: String(presentation.createdAt),
      updatedAt: String((presentation as any).updatedAt || presentation.createdAt),
      activities,
    };
  }

  // Default fallback
  return createDefaultPresentationPackage(lesson);
};

/**
 * Adapter: Convert StructuredPresentation (AI Phase 3) into LessonPresentationPackage (Canvas Editor)
 */
export const convertStructuredPresentationToPackage = (
  lesson: Lesson,
  structuredPres: StructuredPresentation
): LessonPresentationPackage => {
  const slides = structuredPres.slides || [];
  const now = new Date().toISOString();

  // Helper to convert StructuredSlideItem into EditorSlide
  const mapSlideToEditorSlide = (slide: StructuredSlideItem, order: number): EditorSlide => {
    const blocks: ContentBlock[] = [];

    // 1. Heading block
    let badge = 'Kiến thức';
    let headingColor = '#2563EB';
    if (slide.type === 'warmup') {
      badge = 'Khởi động';
      headingColor = '#0D9488';
    } else if (slide.type === 'objective') {
      badge = 'Mục tiêu';
      headingColor = '#4F46E5';
    } else if (slide.type === 'knowledge') {
      badge = 'Trọng tâm';
      headingColor = '#2563EB';
    } else if (slide.type === 'example') {
      badge = 'Ví dụ';
      headingColor = '#0891B2';
    } else if (slide.type === 'practice') {
      badge = 'Luyện tập';
      headingColor = '#E11D48';
    } else if (slide.type === 'application') {
      badge = 'Vận dụng';
      headingColor = '#059669';
    } else if (slide.type === 'summary') {
      badge = 'Củng cố';
      headingColor = '#7C3AED';
    }

    blocks.push({
      id: generateBlockId('blk_hdg'),
      type: 'heading',
      position: { x: 5, y: 6 },
      size: { width: 90, height: 12 },
      order: 1,
      visible: true,
      content: {
        text: slide.title,
        level: 'h1',
        badge,
        color: headingColor,
      },
    } as HeadingBlock);

    let currentOrder = 2;

    // 2. Content / Subtitle block
    if (slide.content) {
      blocks.push({
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 5, y: 22 },
        size: { width: 90, height: Math.min(40, Math.max(20, Math.ceil(slide.content.length / 25) * 4)) },
        order: currentOrder++,
        visible: true,
        content: {
          text: slide.content,
          fontSize: 20,
          lineHeight: 1.6,
          color: '#1E293B',
        },
      } as TextBlock);
    }

    // 3. LaTeX Formulas
    if (slide.formulas && slide.formulas.length > 0) {
      slide.formulas.forEach((form, fIdx) => {
        blocks.push({
          id: generateBlockId('blk_math'),
          type: 'math',
          position: { x: 5, y: 25 + fIdx * 20 },
          size: { width: 90, height: 22 },
          order: currentOrder++,
          visible: true,
          content: {
            latex: form,
            displayMode: 'block',
            isLarge: true,
            color: '#1E293B',
          },
        } as MathBlock);
      });
    }

    // 4. Key points / Bullet list
    if (slide.keyPoints && slide.keyPoints.length > 0) {
      blocks.push({
        id: generateBlockId('blk_txt'),
        type: 'text',
        position: { x: 5, y: 55 },
        size: { width: 90, height: 35 },
        order: currentOrder++,
        visible: true,
        content: {
          text: slide.keyPoints.map((kp) => `• ${kp}`).join('\n'),
          fontSize: 19,
          lineHeight: 1.8,
          color: '#0F172A',
        },
      } as TextBlock);
    }

    // 5. Examples
    if (slide.examples && slide.examples.length > 0) {
      slide.examples.forEach((ex) => {
        blocks.push({
          id: generateBlockId('blk_txt'),
          type: 'text',
          position: { x: 5, y: 50 },
          size: { width: 90, height: 40 },
          order: currentOrder++,
          visible: true,
          content: {
            text: `📌 Ví dụ: ${ex.problem}\n\n💡 Lời giải:\n${ex.solution}${ex.explanation ? `\n\n(Lưu ý: ${ex.explanation})` : ''}`,
            fontSize: 18,
            lineHeight: 1.6,
            color: '#1E293B',
          },
        } as TextBlock);
      });
    }

    // Notes composition
    const notesArr: string[] = [];
    if (slide.teacherNotes) notesArr.push(`[Ghi chú GV] ${slide.teacherNotes}`);
    if (slide.teachingActivity?.teacherActivity) notesArr.push(`[Hoạt động GV] ${slide.teachingActivity.teacherActivity}`);
    if (slide.teachingActivity?.studentActivity) notesArr.push(`[Hoạt động HS] ${slide.teachingActivity.studentActivity}`);
    if (slide.teachingActivity?.expectedResponse) notesArr.push(`[Kết quả cần đạt] ${slide.teachingActivity.expectedResponse}`);

    return {
      id: slide.id || generateSlideId(),
      title: slide.title,
      order,
      layout: 'title-content',
      notes: notesArr.join('\n\n') || undefined,
      blocks,
    };
  };

  // Divide into 4 GDPT 2018 Pedagogical Activities
  const warmupSlides = slides.filter((s) => s.type === 'title' || s.type === 'objective' || s.type === 'warmup');
  const knowledgeSlides = slides.filter((s) => s.type === 'knowledge' || s.type === 'example');
  const practiceSlides = slides.filter((s) => s.type === 'practice' || s.type === 'activity');
  const applicationSlides = slides.filter(
    (s) => s.type === 'application' || s.type === 'summary' || s.type === 'assignment' || s.type === 'custom'
  );

  const activities: TeachingActivity[] = [
    {
      id: generateBlockId('act'),
      title: '01. KHỞI ĐỘNG',
      order: 1,
      timeMinutes: 5,
      description: 'Mục tiêu, tình huống mở đầu kết nối kiến thức thực tiễn',
      slides: warmupSlides.map((s, idx) => mapSlideToEditorSlide(s, idx + 1)),
    },
    {
      id: generateBlockId('act'),
      title: '02. HÌNH THÀNH KIẾN THỨC',
      order: 2,
      timeMinutes: 20,
      description: 'Khái niệm, định lý, công thức trọng tâm và ví dụ minh họa',
      slides: knowledgeSlides.map((s, idx) => mapSlideToEditorSlide(s, idx + 1)),
    },
    {
      id: generateBlockId('act'),
      title: '03. LUYỆN TẬP',
      order: 3,
      timeMinutes: 12,
      description: 'Thực hành bài tập, thảo luận nhóm củng cố kiến thức tại lớp',
      slides: practiceSlides.map((s, idx) => mapSlideToEditorSlide(s, idx + 1)),
    },
    {
      id: generateBlockId('act'),
      title: '04. VẬN DỤNG & CỦNG CỐ',
      order: 4,
      timeMinutes: 8,
      description: 'Vận dụng thực tế, sơ đồ ghi nhớ và dặn dò bài học tiếp theo',
      slides: applicationSlides.map((s, idx) => mapSlideToEditorSlide(s, idx + 1)),
    },
  ].filter((act) => act.slides.length > 0);

  // If no slides grouped, make sure at least one activity has slides
  if (activities.length === 0) {
    activities.push({
      id: generateBlockId('act'),
      title: '01. BÀI GIẢNG',
      order: 1,
      timeMinutes: 45,
      description: 'Tiến trình bài giảng',
      slides: slides.map((s, idx) => mapSlideToEditorSlide(s, idx + 1)),
    });
  }

  return {
    id: structuredPres.id || generateBlockId('pkg'),
    lessonId: lesson.id,
    title: structuredPres.title || lesson.title,
    subject: lesson.subject,
    grade: lesson.grade,
    bookSeries: (lesson as any).bookSeries || 'Kết nối tri thức',
    chapter: lesson.chapter,
    period: (lesson as any).period,
    duration: '45 phút',
    objectives: structuredPres.pedagogicalFlow?.objectives || (lesson as any).objectives || [],
    teacherName: (lesson as any).teacherName || 'Giáo viên',
    schoolYear: '2025 - 2026',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    activities,
  };
};

