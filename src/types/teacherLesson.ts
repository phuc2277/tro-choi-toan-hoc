import { QuizOptionKeyEnum } from '../games/types/GameEnums';
import { MathDiagram, MathTableData, QuizOption } from '../games/types/GestureQuiz';
import type { LessonPresentationPackage } from './contentBlock';

export type CognitiveLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface ExtendedQuestionItem {
  id: string; // Database unique questionId (e.g. "q-math9-b1-01")
  lessonId?: string;
  subject: string;
  grade: number;
  chapter?: string;
  lessonTitle: string;
  content: string; // Math content with LaTeX support
  questionType?: QuestionType;
  cognitiveLevel?: CognitiveLevel;
  options: QuizOption[];
  correctAnswer: QuizOptionKeyEnum;
  shortAnswerKey?: string;
  shortAnswerAlternatives?: string[];
  explanation?: string;
  diagram?: MathDiagram;
  tableData?: MathTableData;
  imageUrl?: string;
  images?: string[];
  videos?: string[];
  mathContent?: string;
  tables?: any[];
  usageCount?: number; // Number of times used in exams
  lastUsedAt?: number; // Timestamp when last included in an exam
  createdAt?: number;
  updatedAt?: number;
}

export interface LectureSection {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  keyPoints: string[];
  formula?: string;
  examples?: {
    problem: string;
    solution: string;
    note?: string;
  }[];
  callout?: {
    type: 'tip' | 'warning' | 'info';
    text: string;
  };
}

export interface StructuredLecture {
  id: string;
  title: string;
  description?: string;
  objectives: string[];
  warmup?: {
    title: string;
    scenario: string;
    question?: string;
  };
  sections: LectureSection[];
  practice?: {
    question: string;
    hint?: string;
  }[];
  application?: string;
  summary: string[];
}

export type PresentationSourceType = 'ai-structured' | 'upload-file' | 'ppt-link' | 'video';

export interface BasePresentationItem {
  id: string;
  title: string;
  description?: string;
  sourceType: PresentationSourceType;
  createdAt: number;
  authorName?: string;
}

export interface AiStructuredPresentation extends BasePresentationItem {
  sourceType: 'ai-structured';
  lecture: StructuredLecture;
  duration?: string;
  structuredPresentation?: any; // StructuredPresentation from Phase 3
  version?: number;
  updatedAt?: number;
  qualityAudit?: any;
}

export interface SlideItem {
  type: 'intro' | 'warmup' | 'section' | 'practice' | 'summary' | 'custom';
  title: string;
  subtitle?: string;
  content?: string;
  description?: string;
  sectionNumber?: number;
  objectives?: string[];
  scenario?: string;
  question?: string;
  formula?: string;
  keyPoints?: string[];
  examples?: { problem: string; solution: string }[];
  practiceItems?: { question: string; hint?: string }[];
  summary?: string[];
  application?: string;
  badge?: string;
  notes?: string;
}

export interface UploadFilePresentation extends BasePresentationItem {
  sourceType: 'upload-file';
  fileName: string;
  fileSizeFormatted: string;
  fileType: 'pptx' | 'ppt' | 'pdf' | 'docx';
  fileUrl?: string; // Blob or Firestore storage download URL
  fileData?: string;
  pageCount?: number;
  extractedText?: string;
  slides?: SlideItem[];
  lecture?: StructuredLecture;
}

export interface PptLinkPresentation extends BasePresentationItem {
  sourceType: 'ppt-link';
  linkUrl: string;
  provider: 'google-slides' | 'canva' | 'onedrive' | 'slideshare' | 'other';
  canEmbed: boolean;
  embedUrl?: string;
}

export interface VideoPresentation extends BasePresentationItem {
  sourceType: 'video';
  videoUrl: string;
  platform: 'youtube' | 'tiktok' | 'other';
  videoId?: string;
  embedUrl?: string;
  durationSeconds?: number;
}

export type PresentationItem =
  | AiStructuredPresentation
  | UploadFilePresentation
  | PptLinkPresentation
  | VideoPresentation;

export interface QuestionSetItem {
  id: string; // examId
  lessonId?: string;
  title: string; // Exam title
  description: string;
  type: 'warm-up' | 'practice' | 'advanced' | 'all' | 'custom';
  createdAt: number;
  updatedAt?: number;
  timePerQuestion?: number; // In seconds, default 20s
  questionCount: number; // totalQuestions
  questionIds?: string[]; // Source of truth: Array of question IDs referenced from Question Bank
  questions: ExtendedQuestionItem[]; // Resolved cache for convenience and backward compatibility
  cognitiveDistribution?: {
    recognition: number;
    understanding: number;
    application: number;
    advanced?: number;
  };
  typeDistribution?: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
  };
  stats?: {
    recognition: number;
    understanding: number;
    application: number;
    advanced?: number;
  };
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  iconName: string;
  color: string;
  description: string;
  grades: number[]; // [6, 7, 8, 9]
}

export interface GradeItem {
  id: string;
  level: number;
  name: string;
  shortName: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  gradeId: string;
  grade: number;
  subject: string;
  chapterId?: string;
  chapter: string;
  lessonNumber: number;
  code: string;
  title: string;
  shortTitle: string;
  description?: string;
  presentations: PresentationItem[];
  presentationPackage?: LessonPresentationPackage;
  questionBank?: ExtendedQuestionItem[];
  questionSets: QuestionSetItem[];
}

export interface TeacherUser {
  id: string;
  name: string;
  title: string;
  school: string;
  avatarUrl: string;
  subject: string;
  gradesTeaching: number[];
  email: string;
}

export interface GameSession {
  gameSessionId: string;
  gameId: string;
  gameType: string;
  examId: string;
  questionIds: string[];
  mode?: string;
  settings?: Record<string, any>;
  createdAt: string;
}
