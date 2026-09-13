import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DocumentSource, DocumentScope, DocumentType } from '../../types/documentSource';
import { documentStorageService } from '../../services/documentStorageService';

interface DocumentUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedDoc: DocumentSource) => void;
  subjectId: string;
  subjectName: string;
  gradeLevel: number;
  currentLessonId?: string;
  currentLessonTitle?: string;
  initialScope?: DocumentScope;
  teacherName?: string;
}

export const DocumentUploaderModal: React.FC<DocumentUploaderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subjectId,
  subjectName,
  gradeLevel,
  currentLessonId,
  currentLessonTitle,
  initialScope = 'shared',
  teacherName = 'Thầy Nguyễn Quốc Phong',
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [scope, setScope] = useState<DocumentScope>(initialScope);
  const [isDefault, setIsDefault] = useState<boolean>(initialScope === 'shared');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Link state
  const [webUrl, setWebUrl] = useState<string>('');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<{
    text: string;
    wordCount: number;
    pageCount?: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const determineDocType = (fileName: string, mimeType: string): DocumentType => {
    const lower = fileName.toLowerCase();
    if (mimeType.includes('pdf') || lower.endsWith('.pdf')) return 'pdf';
    if (mimeType.includes('word') || lower.endsWith('.docx')) return 'docx';
    if (lower.endsWith('.doc')) return 'doc';
    if (mimeType.includes('presentation') || lower.endsWith('.pptx') || lower.endsWith('.ppt')) return 'pptx';
    if (mimeType.startsWith('image/') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) return 'image';
    return 'txt';
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setCustomName(file.name.replace(/\.[^/.]+$/, ''));
    setErrorMessage(null);
    setExtractedData(null);

    // If image, create object URL for preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcessAndSave = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      let docName = customName.trim();
      let extractedText = '';
      let wordCount = 0;
      let pageCount: number | undefined = undefined;
      let docType: DocumentType = 'pdf';
      let mimeType = 'application/pdf';
      let fileSize = 0;
      let originalName = '';
      let url: string | undefined = undefined;
      let fileDataUrl: string | undefined = undefined;

      if (activeTab === 'file') {
        if (!selectedFile) {
          setErrorMessage('Vui lòng chọn một tệp tài liệu để tải lên.');
          setIsProcessing(false);
          return;
        }

        originalName = selectedFile.name;
        if (!docName) docName = selectedFile.name;
        docType = determineDocType(selectedFile.name, selectedFile.type);
        mimeType = selectedFile.type || 'application/octet-stream';
        fileSize = selectedFile.size;

        // Step 1: Uploading
        setProgressStep('Đang đọc dữ liệu tệp...');
        setProgressPercent(30);

        // Step 2: Extracting Text
        setProgressStep('Đang trích xuất nội dung số hóa...');
        setProgressPercent(60);

        const extraction = await documentStorageService.extractTextFromFile(selectedFile);
        extractedText = extraction.text;
        wordCount = extraction.wordCount;
        pageCount = extraction.pageCount;

        if (docType === 'image' && filePreview) {
          fileDataUrl = filePreview;
        }

        setProgressPercent(90);
      } else {
        // Web Link Tab
        if (!webUrl.trim() || !webUrl.startsWith('http')) {
          setErrorMessage('Vui lòng nhập đường dẫn URL hợp lệ (bắt đầu bằng http:// hoặc https://)');
          setIsProcessing(false);
          return;
        }

        setProgressStep('Đang kết nối trang web và trích xuất nội dung...');
        setProgressPercent(50);

        const linkExtraction = await documentStorageService.extractUrlContent(webUrl.trim());
        originalName = webUrl.trim();
        if (!docName) docName = linkExtraction.title || webUrl.trim();
        docType = 'link';
        mimeType = 'text/html';
        fileSize = linkExtraction.text.length;
        extractedText = linkExtraction.text;
        wordCount = linkExtraction.wordCount;
        url = webUrl.trim();

        setProgressPercent(90);
      }

      // Step 3: Saving to Document Storage
      setProgressStep('Đang lưu trữ vào kho tài liệu...');
      setProgressPercent(100);

      const saved = await documentStorageService.saveDocument({
        name: docName,
        originalName,
        type: docType,
        mimeType,
        size: fileSize,
        subjectId,
        subjectName,
        gradeLevel,
        scope,
        lessonId: scope === 'lesson' ? currentLessonId : undefined,
        lessonTitle: scope === 'lesson' ? currentLessonTitle : undefined,
        isDefault: scope === 'shared' ? isDefault : false,
        url,
        fileDataUrl,
        extractedText,
        wordCount,
        pageCount,
        uploadedBy: teacherName,
      });

      setIsProcessing(false);
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Đã có lỗi xảy ra trong quá trình xử lý tài liệu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="modal-document-uploader"
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Thêm tài liệu mới vào Kho học liệu
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Môn <span className="font-semibold text-blue-700">{subjectName}</span> — Khối <span className="font-semibold text-blue-700">{gradeLevel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {/* Scope Selector: Shared vs Lesson */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              1. Chọn phạm vi lưu trữ
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setScope('shared');
                  setIsDefault(true);
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  scope === 'shared'
                    ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-400/20 shadow-sm'
                    : 'border-gray-200 hover:border-blue-200 bg-white'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${scope === 'shared' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">📚 Kho tài liệu chung Môn/Lớp</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    Dùng chung cho toàn bộ khối {gradeLevel} (SGK, Giáo án cả năm, PPCT...).
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScope('lesson');
                  setIsDefault(false);
                }}
                disabled={!currentLessonId}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  !currentLessonId ? 'opacity-50 cursor-not-allowed bg-gray-50' :
                  scope === 'lesson'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/20 shadow-sm'
                    : 'border-gray-200 hover:border-emerald-200 bg-white'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${scope === 'lesson' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    📁 Tài liệu riêng của bài học
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug truncate max-w-[200px]" title={currentLessonTitle}>
                    {currentLessonTitle ? `Gắn với: ${currentLessonTitle}` : 'Vui lòng mở một bài học cụ thể'}
                  </p>
                </div>
              </button>
            </div>

            {/* Default Source Checkbox (if scope is shared) */}
            {scope === 'shared' && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50/80 rounded-xl border border-amber-200/80">
                <input
                  type="checkbox"
                  id="chk-is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <label htmlFor="chk-is-default" className="text-xs font-semibold text-amber-900 cursor-pointer flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  Đánh dấu làm "⭐ Nguồn mặc định" (AI sẽ luôn ưu tiên dùng tài liệu này cho các bài học)
                </label>
              </div>
            )}
          </div>

          {/* Tab Selector: Upload File vs Web Link */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              2. Nguồn dữ liệu
            </label>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'file'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Tải tệp từ máy tính
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'link'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Liên kết trang Web
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          {activeTab === 'file' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-slate-50/70'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-2">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click để đổi tệp khác
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      Kéo thả tệp vào đây hoặc <span className="text-blue-600 underline">chọn từ máy tính</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Hỗ trợ: PDF, DOCX, DOC, PPTX, Ảnh (PNG, JPG), Bảng biểu, TXT (Tối đa 100MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Link Input Area */
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nhập đường dẫn trang web / tài liệu trực tuyến:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={webUrl}
                  onChange={(e) => {
                    setWebUrl(e.target.value);
                    if (!customName && e.target.value) {
                      setCustomName('Tài liệu Web: ' + e.target.value.replace(/https?:\/\//, '').split('/')[0]);
                    }
                  }}
                  placeholder="https://vi.wikipedia.org/wiki/Đơn_thức hoặc link bài viết..."
                  className="w-full text-sm px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Hệ thống sẽ tự động quét và trích xuất nội dung văn bản từ trang web này để lưu vào kho tài liệu.
              </p>
            </div>
          )}

          {/* Document Display Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Tên hiển thị tài liệu trong kho:
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="VD: SGK Toán 8 Tập 1 hoặc Phiếu bài tập nâng cao..."
              className="w-full text-sm font-medium px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Progress / Status Display */}
          {isProcessing && (
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  {progressStep}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/80 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleProcessAndSave}
            disabled={isProcessing || (activeTab === 'file' && !selectedFile) || (activeTab === 'link' && !webUrl.trim())}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý & lưu...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Lưu vào Kho tài liệu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
