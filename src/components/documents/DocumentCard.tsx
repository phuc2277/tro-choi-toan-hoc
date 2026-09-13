import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Star, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  Check, 
  ExternalLink,
  BookOpen,
  Layers,
  Calendar,
  User,
  Sparkles,
  Cpu,
  RotateCw,
  BadgeCheck
} from 'lucide-react';
import { DocumentSource } from '../../types/documentSource';
import { DocumentAnalysisResult, AnalysisStatus } from '../../types/documentAnalysis';
import { DocumentAnalysisService } from '../../services/documentAnalysisService';

interface DocumentCardProps {
  document: DocumentSource;
  onView: (doc: DocumentSource) => void;
  onOpenAnalysis?: (doc: DocumentSource) => void;
  onToggleDefault?: (doc: DocumentSource) => void;
  onRename?: (doc: DocumentSource, newName: string) => void;
  onDelete: (doc: DocumentSource) => void;
  isCompact?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onOpenAnalysis,
  onToggleDefault,
  onRename,
  onDelete,
  isCompact = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(document.name);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('unprocessed');
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    DocumentAnalysisService.getAnalysis(document.id).then((res) => {
      if (isMounted && res) {
        setAnalysis(res);
        setAnalysisStatus(res.status);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [document.id, document.version]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  // Get icon and color palette by type
  const getTypeBadge = () => {
    switch (document.type) {
      case 'pdf':
        return {
          icon: <FileText className="w-5 h-5 text-red-600" />,
          bg: 'bg-red-50 border-red-200 text-red-700',
          label: 'PDF',
          accent: 'from-red-500 to-rose-600',
        };
      case 'docx':
      case 'doc':
        return {
          icon: <FileText className="w-5 h-5 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          label: 'Word',
          accent: 'from-blue-500 to-indigo-600',
        };
      case 'pptx':
        return {
          icon: <FileText className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          label: 'PowerPoint',
          accent: 'from-amber-500 to-orange-600',
        };
      case 'image':
        return {
          icon: <ImageIcon className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          label: 'Hình ảnh',
          accent: 'from-emerald-500 to-teal-600',
        };
      case 'link':
        return {
          icon: <LinkIcon className="w-5 h-5 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-200 text-purple-700',
          label: 'Trang Web',
          accent: 'from-purple-500 to-violet-600',
        };
      default:
        return {
          icon: <FileCode className="w-5 h-5 text-gray-600" />,
          bg: 'bg-gray-50 border-gray-200 text-gray-700',
          label: 'Văn bản',
          accent: 'from-gray-500 to-slate-600',
        };
    }
  };

  const typeConfig = getTypeBadge();

  const handleSaveRename = () => {
    if (editedName.trim() && editedName !== document.name && onRename) {
      onRename(document, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditedName(document.name);
      setIsEditing(false);
    }
  };

  const formattedDate = new Date(document.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div 
      id={`doc-card-${document.id}`}
      className={`relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${
        document.isDefault 
          ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-amber-100/50' 
          : 'border-gray-200 hover:border-blue-300'
      } ${isCompact ? 'p-3.5' : 'p-4 sm:p-5'}`}
    >
      {/* Top Header & Badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${typeConfig.bg}`}>
            {typeConfig.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${typeConfig.bg}`}>
                {typeConfig.label}
              </span>
              
              {/* Scope Badge */}
              {document.scope === 'shared' ? (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Kho chung
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Riêng bài
                </span>
              )}

              {/* Version Badge */}
              <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                v{document.version || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Star Button for Default Source (Shared scope) */}
        {document.scope === 'shared' && onToggleDefault && (
          <button
            id={`btn-toggle-default-${document.id}`}
            onClick={() => onToggleDefault(document)}
            title={document.isDefault ? 'Đang là Nguồn mặc định cho cả khối (Click để bỏ)' : 'Đánh dấu làm Nguồn mặc định'}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-medium ${
              document.isDefault
                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50'
            }`}
          >
            <Star className={`w-4 h-4 ${document.isDefault ? 'fill-amber-400 text-amber-500' : ''}`} />
            {document.isDefault && <span className="hidden sm:inline text-[11px]">Mặc định</span>}
          </button>
        )}
      </div>

      {/* Document Name */}
      <div className="mb-2">
        {isEditing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full text-sm font-semibold text-gray-800 border-2 border-blue-500 rounded-lg px-2.5 py-1 focus:outline-none"
            />
            <button
              onClick={handleSaveRename}
              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0"
              title="Lưu tên mới"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <h4 
            onClick={() => onView(document)}
            title={document.name}
            className="text-sm sm:text-base font-bold text-gray-800 hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug transition-colors"
          >
            {document.name}
          </h4>
        )}
        
        {document.originalName && document.originalName !== document.name && (
          <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5" title={document.originalName}>
            Tệp gốc: {document.originalName}
          </p>
        )}
      </div>

      {/* AI Analysis Status Badge */}
      <div className="mb-2.5">
        {analysisStatus === 'analyzed' ? (
          <button
            onClick={() => onOpenAnalysis && onOpenAnalysis(document)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition cursor-pointer"
            title="Nhấp để xem cấu trúc chỉ mục AI đã phân tích (Chương, Bài, Công thức LaTeX, Bảng số liệu)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>🟢 Đã phân tích AI ({analysis?.lessons.length || 0} bài • {analysis?.formulas.length || 0} công thức)</span>
          </button>
        ) : analysisStatus === 'analyzing' ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            <RotateCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>🟡 Đang phân tích AI qua Gemini...</span>
          </div>
        ) : analysisStatus === 'error' ? (
          <button
            onClick={() => onOpenAnalysis && onOpenAnalysis(document)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold transition cursor-pointer"
          >
            <span>🔴 Phân tích lỗi (Bấm để thử lại)</span>
          </button>
        ) : (
          <button
            onClick={() => onOpenAnalysis && onOpenAnalysis(document)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 text-[11px] font-semibold transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>⚪ Chưa phân tích AI (Bấm để phân tích)</span>
          </button>
        )}
      </div>

      {/* Snippet / Description Preview */}
      {document.extractedTextSnippet && !isCompact && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 bg-gray-50/80 rounded-lg p-2 border border-gray-100 italic">
          "{document.extractedTextSnippet}"
        </p>
      )}

      {/* Topics Tags (if present) */}
      {document.topics && document.topics.length > 0 && !isCompact && (
        <div className="flex flex-wrap gap-1 mb-3">
          {document.topics.slice(0, 3).map((topic, i) => (
            <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              #{topic}
            </span>
          ))}
          {document.topics.length > 3 && (
            <span className="text-[10px] text-gray-400">+{document.topics.length - 3}</span>
          )}
        </div>
      )}

      {/* Meta Stats Row */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5 mt-2">
        <div className="flex items-center gap-3 flex-wrap">
          {document.size > 0 && (
            <span className="font-medium text-gray-600">
              {formatSize(document.size)}
            </span>
          )}
          {document.pageCount && (
            <span>• {document.pageCount} trang</span>
          )}
          {document.wordCount ? (
            <span>• ~{document.wordCount.toLocaleString('vi-VN')} từ</span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-gray-100">
        <button
          id={`btn-view-doc-${document.id}`}
          onClick={() => onView(document)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Xem gốc</span>
        </button>

        {onOpenAnalysis && (
          <button
            onClick={() => onOpenAnalysis(document)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
            title="Mở bảng phân tích cấu trúc AI"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chỉ mục AI</span>
          </button>
        )}

        {document.type === 'link' && document.url && (
          <a
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Mở liên kết gốc"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {onRename && (
          <button
            id={`btn-rename-doc-${document.id}`}
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Đổi tên tài liệu"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}

        <button
          id={`btn-delete-doc-${document.id}`}
          onClick={() => onDelete(document)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Xóa tài liệu"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

