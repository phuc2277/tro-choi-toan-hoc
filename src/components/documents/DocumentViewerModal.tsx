import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  Calendar, 
  User, 
  Layers, 
  BookOpen, 
  Star,
  Download,
  Sparkles,
  Info
} from 'lucide-react';
import { DocumentSource } from '../../types/documentSource';

interface DocumentViewerModalProps {
  document: DocumentSource | null;
  onClose: () => void;
  onToggleDefault?: (doc: DocumentSource) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
  onToggleDefault,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'metadata'>('content');

  if (!document) return null;

  const handleCopy = () => {
    if (document.extractedText) {
      navigator.clipboard.writeText(document.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formattedDate = new Date(document.createdAt).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="modal-document-viewer"
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 bg-blue-100/80 text-blue-700 rounded-2xl shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {document.type.toUpperCase()}
                </span>
                
                {document.scope === 'shared' ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Kho chung Môn/Lớp
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Tài liệu riêng bài học
                  </span>
                )}

                {document.isDefault && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" /> Nguồn mặc định
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate" title={document.name}>
                {document.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {document.scope === 'shared' && onToggleDefault && (
              <button
                onClick={() => onToggleDefault(document)}
                className={`p-2 rounded-xl border transition-all ${
                  document.isDefault
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-white text-gray-500 border-gray-200 hover:text-amber-600'
                }`}
                title={document.isDefault ? 'Bỏ đánh dấu mặc định' : 'Đánh dấu Nguồn mặc định'}
              >
                <Star className={`w-5 h-5 ${document.isDefault ? 'fill-amber-500 text-amber-600' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection & Search Bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'content'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nội dung trích xuất ({document.wordCount ? `${document.wordCount.toLocaleString('vi-VN')} từ` : 'Văn bản'})
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'metadata'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Thông tin chi tiết & Cấu trúc
            </button>
          </div>

          {activeTab === 'content' && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm từ khóa trong văn bản..."
                  className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'content' ? (
            <div>
              {/* If Link type */}
              {document.type === 'link' && document.url && (
                <div className="mb-4 p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-purple-600 font-semibold">Liên kết nguồn trực tuyến</p>
                      <a 
                        href={document.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm font-medium text-purple-900 hover:underline break-all"
                      >
                        {document.url}
                      </a>
                    </div>
                  </div>
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 shrink-0"
                  >
                    Truy cập trang
                  </a>
                </div>
              )}

              {/* If Image type */}
              {document.type === 'image' && document.fileDataUrl && (
                <div className="mb-6 flex justify-center bg-slate-100 p-4 rounded-2xl border">
                  <img 
                    src={document.fileDataUrl} 
                    alt={document.name} 
                    className="max-h-80 object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Extracted Text Viewer */}
              {document.extractedText ? (
                <div className="bg-slate-50 rounded-2xl p-5 border border-gray-200 font-sans text-sm text-gray-800 leading-relaxed whitespace-pre-wrap selection:bg-blue-100 selection:text-blue-900">
                  {searchTerm.trim() ? (
                    // Highlight searched terms
                    document.extractedText.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === searchTerm.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-300 text-slate-900 px-0.5 rounded font-bold">
                          {part}
                        </mark>
                      ) : (
                        part
                      )
                    )
                  ) : (
                    document.extractedText
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Info className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Chưa có văn bản trích xuất cho tài liệu này.</p>
                </div>
              )}
            </div>
          ) : (
            /* Metadata Tab */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông số kỹ thuật</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mã định danh nguồn (sourceId):</span>
                      <span className="font-mono font-semibold text-gray-800">{document.sourceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dung lượng:</span>
                      <span className="font-semibold text-gray-800">{formatSize(document.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Số lượng trang:</span>
                      <span className="font-semibold text-gray-800">{document.pageCount ? `${document.pageCount} trang` : 'Không xác định'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tổng số từ ước tính:</span>
                      <span className="font-semibold text-gray-800">{document.wordCount ? `~${document.wordCount.toLocaleString('vi-VN')} từ` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phiên bản tài liệu:</span>
                      <span className="font-mono font-semibold text-blue-600">v{document.version || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phân loại & Giáo viên</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Môn học & Khối:</span>
                      <span className="font-semibold text-gray-800">{document.subjectName || document.subjectId} — Khối {document.gradeLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phạm vi lưu trữ:</span>
                      <span className="font-semibold text-gray-800">
                        {document.scope === 'shared' ? 'Kho tài liệu chung Môn/Lớp' : `Tài liệu riêng: ${document.lessonTitle || document.lessonId}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Người tải lên:</span>
                      <span className="font-semibold text-gray-800">{document.uploadedBy || 'Giáo viên'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ngày tạo:</span>
                      <span className="font-semibold text-gray-800">{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Index Preparedness Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-blue-900">Sẵn sàng kết nối AI Giai đoạn 2</h5>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Tài liệu này đã được đánh số định danh <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-blue-800">{document.sourceId}</code> và trích xuất dữ liệu sạch. 
                    Khi giáo viên yêu cầu tạo ngân hàng câu hỏi hoặc đề kiểm tra, hệ thống sẽ tự động bám sát nội dung từ nguồn này.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Tài liệu số hóa phục vụ giảng dạy môn {document.subjectName || 'Toán học'} Lớp {document.gradeLevel}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
