import { DocumentScope } from './documentSource';

export type SlideType =
  | 'title'           // Trang mở đầu / Tên bài
  | 'objective'       // Mục tiêu cần đạt
  | 'warmup'          // Khởi động / Tình huống thực tế
  | 'knowledge'       // Hình thành kiến thức / Khái niệm / Định lý
  | 'example'         // Ví dụ minh họa có giải chi tiết
  | 'activity'        // Hoạt động khám phá / Thảo luận
  | 'practice'        // Luyện tập củng cố tại lớp
  | 'application'     // Vận dụng thực tiễn
  | 'summary'         // Củng cố / Sơ đồ kiến thức
  | 'assignment'      // Dặn dò / Nhiệm vụ về nhà
  | 'custom';

export interface SlideSourceReference {
  documentId?: string;
  documentName: string;
  scope?: DocumentScope;
  page?: number;
  sectionTitle?: string;
  isDirectQuote?: boolean;
}

export interface SlideInteractionQuestion {
  id: string;
  questionText: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options: { key: string; text: string }[];
  answer: string;
  explanation: string;
  source: 'presentation-only'; // Phân biệt rõ với Ngân hàng câu hỏi
}

export interface SlideVisualAsset {
  type: 'source-image' | 'math-diagram' | 'table' | 'visual-request' | 'video-ref';
  sourceDocId?: string;
  page?: number;
  caption?: string;
  latexFormulas?: string[];
  tableData?: { headers: string[]; rows: string[][] };
  visualRequest?: {
    required: boolean;
    description: string;
    purpose: string;
  };
  url?: string;
}

export interface StructuredSlideItem {
  id: string;
  order: number;
  type: SlideType;
  title: string;
  subtitle?: string;
  objective?: string;
  
  // Nội dung kiến thức trọng tâm
  content: string;
  keyPoints: string[];
  formulas: string[]; // Lưu chuẩn LaTeX như \frac{a}{b}, x^2, \sqrt{x}, \Delta
  
  // Ví dụ & Lời giải
  examples?: {
    problem: string;
    solution: string;
    explanation?: string;
  }[];

  // Hoạt động dạy & học
  teachingActivity?: {
    teacherActivity: string; // Giáo viên giao việc / Đặt câu hỏi
    studentActivity: string; // Học sinh thực hiện / Thảo luận
    expectedResponse?: string;
  };

  // Câu hỏi tương tác trong slide
  interactionQuestions?: SlideInteractionQuestion[];

  // Yếu tố trực quan (bảng, hình SGK, yêu cầu tạo hình)
  visuals?: SlideVisualAsset[];

  // Trích dẫn nguồn ngược về SGK/Giáo án
  sourceReferences: SlideSourceReference[];
  needsReview?: boolean;

  // Ghi chú sư phạm của giáo viên
  teacherNotes?: string;
}

export interface PresentationQualityAudit {
  hasTitle: boolean;
  hasObjectives: boolean;
  hasCoreKnowledge: boolean;
  hasSourceReferences: boolean;
  hasValidFormulas: boolean;
  emptySlidesCount: number;
  warnings: string[];
  confidenceScore: number; // 0.0 - 1.0
}

export interface StructuredPresentation {
  id: string;
  lessonId: string;
  lessonTitle: string;
  subject: string;
  grade: number;
  title: string;
  description?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'generated' | 'reviewed';
  
  // Thiết lập sư phạm từ giáo viên
  generationConfig: {
    duration: string;              // "45 phút", "90 phút"
    pedagogicalStyle: 'traditional' | 'interactive' | 'exploratory' | 'practice-heavy';
    generationMode: 'fast' | 'standard' | 'detailed';
    customObjectives?: string;
    teacherNotes?: string;
    selectedSourceIds: string[];  // Danh sách ID tài liệu giáo viên chọn dùng
  };

  // Nguồn tham chiếu thực tế đã sử dụng
  usedSources: {
    documentId: string;
    documentTitle: string;
    scope: DocumentScope;
    pageRange?: { from: number; to: number };
    matchedSectionsCount: number;
  }[];

  // Tiến trình bài học tổng quát
  pedagogicalFlow: {
    objectives: string[];
    warmupSummary: string;
    keyKnowledgeSummary: string;
    practiceSummary: string;
    applicationSummary: string;
    assessmentSummary: string;
  };

  // Danh sách slide logic (dữ liệu có cấu trúc cho Giai đoạn 4)
  slides: StructuredSlideItem[];

  // Kết quả kiểm tra chất lượng tự động
  qualityAudit: PresentationQualityAudit;
}
