import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Upload, 
  Search, 
  Star, 
  FileText, 
  Sparkles, 
  Filter, 
  Layers, 
  Trash2, 
  Check, 
  Info,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { DocumentSource, DocumentFilter, DocumentType, DocumentStats } from '../../types/documentSource';
import { documentStorageService } from '../../services/documentStorageService';
import { DocumentCard } from './DocumentCard';
import { DocumentViewerModal } from './DocumentViewerModal';
import { DocumentUploaderModal } from './DocumentUploaderModal';
import { DocumentAnalysisModal } from './DocumentAnalysisModal';

interface SharedDocumentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
  gradeLevel: number;
  teacherName?: string;
  onDocumentCountChange?: (count: number) => void;
}

export const SharedDocumentLibraryModal: React.FC<SharedDocumentLibraryModalProps> = ({
  isOpen,
  onClose,
  subjectId,
  subjectName,
  gradeLevel,
  teacherName = 'Thầy Nguyễn Quốc Phong',
  onDocumentCountChange,
}) => {
  const [documents, setDocuments] = useState<DocumentSource[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    totalCount: 0,
    totalSize: 0,
    totalWordCount: 0,
    defaultCount: 0,
    sharedCount: 0,
    lessonCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [defaultOnlyFilter, setDefaultOnlyFilter] = useState<boolean>(false);

  // Modals state
  const [viewingDoc, setViewingDoc] = useState<DocumentSource | null>(null);
  const [analysisDoc, setAnalysisDoc] = useState<DocumentSource | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const [deletingDoc, setDeletingDoc] = useState<DocumentSource | null>(null);

  // Load documents
  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await documentStorageService.getSharedDocuments(subjectId, gradeLevel);
      const calculatedStats = await documentStorageService.calculateStats(subjectId, gradeLevel);
      setDocuments(docs);
      setStats(calculatedStats);
      if (onDocumentCountChange) {
        onDocumentCountChange(docs.length);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, subjectId, gradeLevel]);

  if (!isOpen) return null;

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (defaultOnlyFilter && !doc.isDefault) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchText = doc.extractedText?.toLowerCase().includes(q);
      const matchTopic = doc.topics?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchText && !matchTopic) return false;
    }
    return true;
  });

  const handleToggleDefault = async (doc: DocumentSource) => {
    await documentStorageService.toggleDefault(doc.id);
    await loadDocuments();
  };

  const handleRename = async (doc: DocumentSource, newName: string) => {
    await documentStorageService.updateDocument(doc.id, { name: newName });
    await loadDocuments();
  };

  const handleConfirmDelete = async () => {
    if (deletingDoc) {
      await documentStorageService.deleteDocument(deletingDoc.id);
      setDeletingDoc(null);
      await loadDocuments();
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="modal-shared-doc-library"
        className="bg-slate-50 rounded-3xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  TẦNG 1: KHO CHUNG
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  Khối {gradeLevel}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                Kho tài liệu chung — {subjectName} Lớp {gradeLevel}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              id="btn-upload-shared-doc"
              onClick={() => setIsUploaderOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              <span>+ Tải tài liệu lên kho chung</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats & Architectural Guidance Banner */}
        <div className="px-5 sm:px-6 py-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Nguyên tắc Một file — Nhiều nơi dùng:</strong> SGK & Giáo án tại đây tự động làm tài liệu nguồn cho tất cả bài học Lớp {gradeLevel}.
            </span>
          </div>

          {/* Mini Stats Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-white/80 border border-blue-200 px-2.5 py-1 rounded-xl font-semibold text-gray-700">
              Tổng: <strong className="text-blue-600">{documents.length}</strong> tài liệu
            </span>
            <span className="bg-white/80 border border-amber-200 px-2.5 py-1 rounded-xl font-semibold text-amber-900 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <strong>{documents.filter((d) => d.isDefault).length}</strong> Nguồn mặc định
            </span>
            <span className="bg-white/80 border border-slate-200 px-2.5 py-1 rounded-xl font-medium text-gray-600">
              Dung lượng: <strong>{formatSize(stats.totalSize)}</strong>
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm kiếm tên tài liệu, SGK, chuyên đề, từ khóa..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-2xl border border-gray-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            <button
              onClick={() => {
                setTypeFilter('all');
                setDefaultOnlyFilter(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'all' && !defaultOnlyFilter
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả ({documents.length})
            </button>

            <button
              onClick={() => setDefaultOnlyFilter(!defaultOnlyFilter)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                defaultOnlyFilter
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              Nguồn mặc định ({documents.filter((d) => d.isDefault).length})
            </button>

            <button
              onClick={() => setTypeFilter(typeFilter === 'pdf' ? 'all' : 'pdf')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'pdf'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              PDF
            </button>

            <button
              onClick={() => setTypeFilter(typeFilter === 'docx' ? 'all' : 'docx')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'docx'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              Word (DOCX)
            </button>

            <button
              onClick={() => setTypeFilter(typeFilter === 'image' ? 'all' : 'image')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'image'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Hình ảnh
            </button>

            <button
              onClick={() => setTypeFilter(typeFilter === 'link' ? 'all' : 'link')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'link'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              Liên kết Web
            </button>
          </div>
        </div>

        {/* Document Grid Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm font-medium">Đang tải kho tài liệu...</p>
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onView={(d) => setViewingDoc(d)}
                  onOpenAnalysis={(d) => setAnalysisDoc(d)}
                  onToggleDefault={handleToggleDefault}
                  onRename={handleRename}
                  onDelete={(d) => setDeletingDoc(d)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-gray-300 p-8">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl mb-3">
                <FolderOpen className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-gray-800">
                {searchQuery.trim() || typeFilter !== 'all' || defaultOnlyFilter
                  ? 'Không tìm thấy tài liệu phù hợp với bộ lọc'
                  : `Kho tài liệu chung môn ${subjectName} Lớp ${gradeLevel} đang trống`}
              </h4>
              <p className="text-xs text-gray-500 max-w-md mt-1 mb-5">
                Hãy tải lên SGK Tập 1, Tập 2, Giáo án cả năm hoặc Phân phối chương trình để làm nền tảng học liệu và xây dựng ngân hàng câu hỏi.
              </p>
              <button
                onClick={() => setIsUploaderOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                <Upload className="w-4 h-4" />
                <span>Tải tài liệu đầu tiên lên kho chung</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            ⭐ <strong>Nguồn mặc định:</strong> Tài liệu được đánh dấu ngôi sao vàng sẽ luôn được AI tự động sử dụng làm ngữ cảnh cho mọi bài học.
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold transition-colors"
          >
            Đóng Kho tài liệu
          </button>
        </div>
      </div>

      {/* Sub-modal: Document Viewer */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onToggleDefault={handleToggleDefault}
        />
      )}

      {/* Sub-modal: Document AI Analysis */}
      {analysisDoc && (
        <DocumentAnalysisModal
          document={analysisDoc}
          isOpen={!!analysisDoc}
          onClose={() => setAnalysisDoc(null)}
          onAnalysisUpdated={() => loadDocuments()}
        />
      )}

      {/* Sub-modal: Document Uploader */}
      {isUploaderOpen && (
        <DocumentUploaderModal
          isOpen={isUploaderOpen}
          onClose={() => setIsUploaderOpen(false)}
          onSuccess={() => {
            loadDocuments();
          }}
          subjectId={subjectId}
          subjectName={subjectName}
          gradeLevel={gradeLevel}
          initialScope="shared"
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
                Bạn có chắc chắn muốn xóa tài liệu <strong className="text-gray-900 font-semibold">"{deletingDoc.name}"</strong> khỏi Kho tài liệu chung?
              </p>

              {deletingDoc.isDefault && (
                <div className="mt-3 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs text-left flex items-start gap-2">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cảnh báo:</strong> Đây là <strong>Nguồn mặc định</strong> đang được các bài học khối {gradeLevel} tham chiếu. Khi xóa, các bài học sẽ không còn kế thừa tài liệu này.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-500/20 transition-colors"
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
