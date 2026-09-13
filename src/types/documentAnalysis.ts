import { DocumentType, DocumentScope } from './documentSource';

export type AnalysisStatus = 'unprocessed' | 'analyzing' | 'analyzed' | 'error' | 'needs_reanalysis';

export interface DocumentAnalysisChapter {
  id: string;
  number?: number | string;
  title: string;
  pageFrom?: number;
  pageTo?: number;
  lessonCount?: number;
  description?: string;
}

export interface DocumentAnalysisSectionItem {
  id: string;
  order: number;
  title: string;
  type: 'definition' | 'theorem' | 'property' | 'formula' | 'example' | 'exercise' | 'activity' | 'general';
  page?: number;
  contentSnippet: string;
  formulas?: string[];
  latexSnippets?: string[];
  keyTerms?: string[];
  inferred?: boolean;
}

export interface DocumentAnalysisLesson {
  id: string;
  number?: number | string;
  title: string;
  matchedLessonId?: string; // App's lesson ID if matched (e.g. 'toan8-b1')
  chapterTitle?: string;
  chapterNumber?: number | string;
  pageFrom: number;
  pageTo: number;
  confidence: number; // 0.0 to 1.0
  needsReview?: boolean;
  summary?: string;
  sections: DocumentAnalysisSectionItem[];
  keyFormulas?: string[];
  keyTheorems?: string[];
  topics?: string[];
}

export interface DocumentAnalysisFormula {
  id: string;
  latex: string;
  text: string;
  context: string;
  page?: number;
  lessonTitle?: string;
  sectionTitle?: string;
}

export interface DocumentAnalysisTable {
  id: string;
  title?: string;
  headers: string[];
  rows: string[][];
  page?: number;
  lessonTitle?: string;
}

export interface DocumentAnalysisImage {
  id: string;
  page?: number;
  caption?: string;
  context?: string;
  relatedSection?: string;
  type?: 'geometry' | 'chart' | 'diagram' | 'illustration' | 'table' | 'photo';
  needsReview?: boolean;
}

export interface DocumentAnalysisResult {
  id: string;
  documentId: string;
  sourceId: string;
  documentVersion: number;
  analysisVersion: number;
  status: AnalysisStatus;
  analyzedAt: number;
  errorMessage?: string;
  
  metadata: {
    title: string;
    originalName: string;
    subject: string;
    grade: number;
    documentType: DocumentType;
    pageCount?: number;
    wordCount?: number;
    scope: DocumentScope;
    lessonId?: string;
    lessonTitle?: string;
  };

  chapters: DocumentAnalysisChapter[];
  lessons: DocumentAnalysisLesson[];
  sections: DocumentAnalysisSectionItem[];
  formulas: DocumentAnalysisFormula[];
  tables: DocumentAnalysisTable[];
  images: DocumentAnalysisImage[];
  topics: string[];
  links: { url: string; title?: string; description?: string }[];
  warnings: string[];
  confidence: number; // 0.0 - 1.0
  summary: string;
  
  teacherEdited?: boolean;
  teacherNotes?: string;
}

/**
 * Structured data context prepared specifically for Phase 3 (AI Lesson Plan / Lecture Structure Generation)
 */
export interface StructuredLessonSourceRef {
  sourceId: string;
  documentName: string;
  scope: DocumentScope;
  isDefault: boolean;
  pageRange?: { from: number; to: number };
  matchedLessonTitle?: string;
  confidence: number;
  sections: DocumentAnalysisSectionItem[];
  formulas: DocumentAnalysisFormula[];
  tables: DocumentAnalysisTable[];
  images: DocumentAnalysisImage[];
  rawTextSnippet?: string;
}

export interface StructuredLessonContext {
  lessonId: string;
  lessonTitle: string;
  subject: string;
  grade: number;
  totalSourcesCount: number;
  sharedSources: StructuredLessonSourceRef[];
  lessonSources: StructuredLessonSourceRef[];
  combinedSummary: string;
  allKeyFormulas: string[];
  allKeyTheorems: string[];
  allTopics: string[];
  isReadyForPhase3: boolean;
}
