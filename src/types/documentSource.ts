export type DocumentType = 'pdf' | 'docx' | 'doc' | 'pptx' | 'image' | 'link' | 'txt';

export type DocumentScope = 'shared' | 'lesson';

export interface DocumentSourceReference {
  sourceId: string;
  page?: number;
  section?: string;
  excerpt?: string;
}

export interface DocumentVersionEntry {
  version: number;
  name: string;
  size: number;
  updatedAt: number;
  uploadedBy: string;
  note?: string;
}

export interface DocumentIndexStructure {
  chapters?: string[];
  lessons?: string[];
  pageRanges?: {
    lessonId: string;
    lessonTitle: string;
    fromPage: number;
    toPage: number;
  }[];
  topics?: string[];
  keywords?: string[];
}

export interface DocumentSource {
  id: string;
  sourceId: string; // Stable reference ID for AI and question references (e.g. "SGK_TOAN8_T1")
  name: string;
  title?: string;
  originalName: string;
  type: DocumentType;
  format?: string;
  mimeType: string;
  size: number; // in bytes
  fileSizeBytes?: number;
  
  // Subject & Grade identification
  subjectId: string;
  subject?: string; // Standard key according to spec
  subjectName?: string;
  gradeLevel: number;
  grade?: number; // Standard key according to spec
  
  // Scope: 'shared' (Kho chung môn/lớp) or 'lesson' (Kho riêng bài học)
  scope: DocumentScope;
  lessonId?: string; // Present when scope === 'lesson'
  lessonTitle?: string;
  
  // Storage & Content
  storageReference?: string;
  url?: string;
  fileDataUrl?: string; // base64 or blob url for preview / download
  
  // AI Preparation & Extraction
  isDefault: boolean; // ⭐ Nguồn mặc định (for shared documents)
  extractedText?: string;
  extractedTextSnippet?: string;
  wordCount?: number;
  pageCount?: number;
  
  // Metadata for AI Chapter / Lesson Indexing (Prepared for Phase 2)
  topics?: string[];
  chapters?: string[];
  documentIndex?: DocumentIndexStructure;
  pageRanges?: {
    lessonId: string;
    lessonTitle: string;
    fromPage: number;
    toPage: number;
  }[];
  
  // Versioning & Audit
  version: number;
  versionHistory?: DocumentVersionEntry[];
  uploadedBy: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp

  // Phase 2 & 3 extensions
  content?: string;
  analysis?: any;
}

export interface DocumentFilter {
  searchQuery: string;
  type?: DocumentType | 'all';
  isDefaultOnly?: boolean;
  scope?: DocumentScope | 'all';
  lessonId?: string;
}

export interface DocumentStats {
  totalCount: number;
  totalSize: number;
  totalWordCount: number;
  defaultCount: number;
  sharedCount: number;
  lessonCount: number;
}

