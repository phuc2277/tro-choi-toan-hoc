import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  Upload, 
  Star, 
  Sparkles, 
  FileText, 
  Eye, 
  Trash2, 
  Plus, 
  Info,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Sigma,
  BadgeCheck,
  ChevronRight,
  Play,
} from 'lucide-react';
import { DocumentSource } from '../../types/documentSource';
import { StructuredLessonContext } from '../../types/documentAnalysis';
import { documentStorageService } from '../../services/documentStorageService';
import { DocumentAnalysisService } from '../../services/documentAnalysisService';
import { DocumentCard } from './DocumentCard';
import { DocumentViewerModal } from './DocumentViewerModal';
import { DocumentUploaderModal } from './DocumentUploaderModal';
import { DocumentAnalysisModal } from './DocumentAnalysisModal';

interface LessonDocumentSectionProps {
  subjectId: string;
  subjectName: string;
  gradeLevel: number;
  lessonId: string;
  lessonTitle: string;
  teacherName?: string;
  onOpenSharedLibrary: () => void;
  onNavigateToPhase3?: () => void;
  onNavigateToPhase4?: () => void;
}

export const LessonDocumentSection: React.FC<LessonDocumentSectionProps> = ({
  subjectId,
  subjectName,
  gradeLevel,
  lessonId,
  lessonTitle,
  teacherName = 'Thầy Nguyễn Quốc Phong',
  onOpenSharedLibrary,
  onNavigateToPhase3,
  onNavigateToPhase4,
}) => {
  const [defaultSharedDocs, setDefaultSharedDocs] = useState<DocumentSource[]>([]);
  const [lessonDocs, setLessonDocs] = useState<DocumentSource[]>([]);
  const [structuredContext, setStructuredContext] = useState<StructuredLessonContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Modals
  const [viewingDoc, setViewingDoc] = useState<DocumentSource | null>(null);
  const [analysisDoc, setAnalysisDoc] = useState<DocumentSource | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const [deletingDoc, setDeletingDoc] = useState<DocumentSource | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await documentStorageService.getEffectiveDocumentsForLesson(subjectId, gradeLevel, lessonId);
      setDefaultSharedDocs(data.defaultShared);
      setLessonDocs(data.lessonDocs);

      // Load structured AI context for this lesson
      const ctx = await DocumentAnalysisService.getStructuredLessonContext(
        subjectId,
        gradeLevel,
        lessonId,
        lessonTitle
      );
      setStructuredContext(ctx);
    } catch (err) {
      console.error('Error loading lesson docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subjectId, gradeLevel, lessonId, lessonTitle]);

  const handleRename = async (doc: DocumentSource, newName: string) => {
    await documentStorageService.updateDocument(doc.id, { name: newName });
    await loadData();
  };

  const handleConfirmDelete = async () => {
    if (deletingDoc) {
      await documentStorageService.deleteDocument(deletingDoc.id);
      setDeletingDoc(null);
      await loadData();
    }
  };

  // Calculate total AI context words
  const totalContextWords = 
    defaultSharedDocs.reduce((acc, d) => acc + (d.wordCount || 0), 0) +
    lessonDocs.reduce((acc, d) => acc + (d.wordCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Hệ thống Kho tài liệu 2 tầng • Giai đoạn 2
            </span>
            <span className="text-xs text-blue-100 font-medium">
              Môn {subjectName} • Lớp {gradeLevel}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight">
            Kho tài liệu học tập — {lessonTitle}
          </h3>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            Kết hợp tự động giữa <strong>Nguồn chung của Môn/Lớp</strong> (SGK, Giáo án cả năm) và <strong>Tài liệu riêng của bài</strong> để hỗ trợ giảng dạy và xây dựng học liệu chuẩn xác nhất.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsUploaderOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tải tài liệu riêng của bài</span>
          </button>
        </div>
      </div>

      {/* PHASE 2 AI STRUCTURED INDEXING PREVIEW FOR THIS LESSON */}
      {structuredContext && (
        <div className="p-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl text-white shadow-xl border border-indigo-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    🟢 AI ĐÃ LẬP CHỈ MỤC BÀI HỌC
                  </span>
                  <span className="text-xs text-indigo-200/70">
                    Sẵn sàng phục vụ học liệu & ngân hàng câu hỏi
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                  Chỉ mục dữ liệu có cấu trúc dành riêng cho: {lessonTitle}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {defaultSharedDocs[0] && (
                <button
                  onClick={() => setAnalysisDoc(defaultSharedDocs[0])}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer border border-indigo-400/30 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem chỉ mục SGK</span>
                </button>
              )}
              {onNavigateToPhase4 && (
                <button
                  id="btn-goto-phase4"
                  onClick={onNavigateToPhase4}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95 border border-emerald-300/40"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Sang Ngân hàng câu hỏi ▶</span>
                </button>
              )}
            </div>
          </div>

          {/* Key Reference Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Textbook Page Range */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="text-indigo-300 font-semibold flex items-center gap-1.5 text-[11px]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Trang SGK & Giáo án đối ứng:</span>
              </div>
              <div className="space-y-1">
                {structuredContext.sharedSources.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-white font-medium">
                    <span className="truncate max-w-[180px] text-slate-300 text-[11px]">{s.documentName}</span>
                    {s.pageRange ? (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 font-mono font-bold text-[10px]">
                        Trang {s.pageRange.from} → {s.pageRange.to}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Toàn bộ tệp</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted LaTeX Formulas */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="text-purple-300 font-semibold flex items-center gap-1.5 text-[11px]">
                <Sigma className="w-3.5 h-3.5" />
                <span>Công thức trọng tâm (LaTeX):</span>
              </div>
              {(structuredContext.allKeyFormulas || []).length > 0 ? (
                <div className="space-y-1">
                  {(structuredContext.allKeyFormulas || []).slice(0, 2).map((form, fIdx) => (
                    <div key={fIdx} className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-200 font-mono text-[11px] truncate">
                      ${form}$
                    </div>
                  ))}
                  {(structuredContext.allKeyFormulas || []).length > 2 && (
                    <div className="text-[10px] text-purple-300/80 italic">
                      +{(structuredContext.allKeyFormulas || []).length - 2} công thức khác đã được lập chỉ mục
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Chưa có công thức chuyên biệt</p>
              )}
            </div>

            {/* Core Topics & Competencies */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="text-emerald-300 font-semibold flex items-center gap-1.5 text-[11px]">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Từ khóa & Mục tiêu bài học:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(structuredContext.allTopics || []).length > 0 ? (
                  (structuredContext.allTopics || []).slice(0, 5).map((top, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 text-[10px] font-medium border border-emerald-500/30">
                      #{top}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">Đơn thức, bậc, đa thức, quy tắc cộng trừ</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TẦNG 1: NGUỒN CHUNG KẾ THỪA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                1. Nguồn chung kế thừa từ {subjectName} Lớp {gradeLevel} ({defaultSharedDocs.length})
              </h4>
              <p className="text-[11px] text-gray-500">
                Các tài liệu được đánh dấu ⭐ Nguồn mặc định trong Kho tài liệu chung.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSharedLibrary}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
          >
            <span>Mở Kho tài liệu chung</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs">Đang tải tài liệu kế thừa...</p>
          </div>
        ) : defaultSharedDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {defaultSharedDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={(d) => setViewingDoc(d)}
                onOpenAnalysis={(d) => setAnalysisDoc(d)}
                onDelete={() => {}} // Do not delete shared doc directly from lesson view
                isCompact
              />
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
            Chưa có tài liệu chung nào được đánh dấu ⭐ Nguồn mặc định.{' '}
            <button onClick={onOpenSharedLibrary} className="text-blue-600 font-semibold underline cursor-pointer">
              Nhấp vào đây để mở Kho chung và đánh dấu SGK/Giáo án.
            </button>
          </div>
        )}
      </div>

      {/* TẦNG 2: TÀI LIỆU RIÊNG CỦA BÀI */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                2. Tài liệu riêng của bài học ({lessonDocs.length})
              </h4>
              <p className="text-[11px] text-gray-500">
                Phiếu học tập, bài tập nâng cao, hình ảnh minh họa, sơ đồ tư duy hoặc link bổ trợ riêng cho bài này.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUploaderOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm tài liệu riêng</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs">Đang tải tài liệu riêng...</p>
          </div>
        ) : lessonDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {lessonDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={(d) => setViewingDoc(d)}
                onOpenAnalysis={(d) => setAnalysisDoc(d)}
                onRename={handleRename}
                onDelete={(d) => setDeletingDoc(d)}
                isCompact
              />
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-dashed border-gray-300 text-center space-y-2">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-700">
              Chưa có tài liệu riêng cho bài học này
            </p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              Bạn có thể tải thêm phiếu bài tập nâng cao, sơ đồ minh họa hoặc link bài viết bổ trợ.
            </p>
            <button
              onClick={() => setIsUploaderOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải tài liệu riêng cho bài này</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-modal: Document Viewer */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Sub-modal: Document AI Analysis */}
      {analysisDoc && (
        <DocumentAnalysisModal
          document={analysisDoc}
          isOpen={!!analysisDoc}
          onClose={() => setAnalysisDoc(null)}
          onAnalysisUpdated={() => loadData()}
        />
      )}

      {/* Sub-modal: Document Uploader */}
      {isUploaderOpen && (
        <DocumentUploaderModal
          isOpen={isUploaderOpen}
          onClose={() => setIsUploaderOpen(false)}
          onSuccess={() => {
            loadData();
          }}
          subjectId={subjectId}
          subjectName={subjectName}
          gradeLevel={gradeLevel}
          currentLessonId={lessonId}
          currentLessonTitle={lessonTitle}
          initialScope="lesson"
          teacherName={teacherName}
        />
      )}

      {/* Sub-modal: Delete Confirmation */}
      {deletingDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-gray-900">Xác nhận xóa tài liệu</h4>
              <p className="text-xs text-gray-600 mt-1">
                Bạn có chắc chắn muốn xóa tài liệu <strong className="text-gray-900 font-semibold">"{deletingDoc.name}"</strong> của bài học này?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-500/20 transition-colors cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

