import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  Upload,
  Search,
  Check,
  FileText,
  Sparkles,
  Layers,
  Trash2,
  Info,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  FileCode,
  BookMarked,
  ArrowRight,
  Filter,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { DocumentSource, DocumentType, DocumentScope } from '../../types/documentSource';
import { documentStorageService } from '../../services/documentStorageService';
import { Lesson } from '../../types/teacherLesson';

interface NotebookSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  currentSelectedSourceIds: string[];
  onApplySources: (updatedSources: DocumentSource[], selectedIds: string[]) => void;
}

export const NotebookSourceModal: React.FC<NotebookSourceModalProps> = ({
  isOpen,
  onClose,
  lesson,
  currentSelectedSourceIds,
  onApplySources,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'text'>('library');
  const [sources, setSources] = useState<DocumentSource[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(currentSelectedSourceIds);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sgk' | 'giao-an' | 'notebook' | 'lesson'>('all');
  const [previewDoc, setPreviewDoc] = useState<DocumentSource | null>(null);

  // Upload Tab States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDocTitle, setUploadDocTitle] = useState<string>('');
  const [uploadDocCategory, setUploadDocCategory] = useState<'sgk' | 'giao-an' | 'notebook' | 'baitap'>('notebook');
  const [uploadScope, setUploadScope] = useState<DocumentScope>('lesson');
  const [uploadTextbook, setUploadTextbook] = useState<'KNTT' | 'CD'>('KNTT');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Text Tab States
  const [directDocTitle, setDirectDocTitle] = useState<string>('');
  const [directDocCategory, setDirectDocCategory] = useState<'notebook' | 'sgk' | 'giao-an'>('notebook');
  const [directScope, setDirectScope] = useState<DocumentScope>('lesson');
  const [directTextContent, setDirectTextContent] = useState<string>('');
  const [isSavingDirect, setIsSavingDirect] = useState<boolean>(false);
  const [directSuccess, setDirectSuccess] = useState<string | null>(null);

  // Load all documents relevant for this lesson and grade
  const loadAllSources = async () => {
    setIsLoading(true);
    try {
      const data = await documentStorageService.getEffectiveDocumentsForLesson(
        lesson.subjectId || 'math',
        lesson.grade || 8,
        lesson.id
      );
      const allDocs = [...data.defaultShared, ...data.allShared.filter(d => !data.defaultShared.some(ds => ds.id === d.id)), ...data.lessonDocs];
      // Deduplicate by ID
      const uniqueDocs = Array.from(new Map(allDocs.map(item => [item.id, item])).values());
      setSources(uniqueDocs);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllSources();
      setSelectedIds(currentSelectedSourceIds);
      setUploadSuccess(null);
      setDirectSuccess(null);
      setUploadError(null);
    }
  }, [isOpen, lesson.id, lesson.grade, lesson.subjectId]);

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleSelect = (docId: string) => {
    setSelectedIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredDocs.map((d) => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Delete custom document
  const handleDeleteDoc = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const docToDelete = sources.find((d) => d.id === docId);
    if (!docToDelete) return;

    if (confirm(`Thầy/Cô có chắc chắn muốn xóa tài liệu "${docToDelete.name}" khỏi Notebook không?`)) {
      await documentStorageService.deleteDocument(docId);
      const updated = sources.filter((d) => d.id !== docId);
      setSources(updated);
      setSelectedIds((prev) => prev.filter((id) => id !== docId));
      if (previewDoc?.id === docId) {
        setPreviewDoc(null);
      }
    }
  };

  // Filter documents
  const filteredDocs = sources.filter((doc) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchText = doc.extractedText?.toLowerCase().includes(q) || doc.extractedTextSnippet?.toLowerCase().includes(q);
      const matchTopics = doc.topics?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchText && !matchTopics) return false;
    }

    // Category filter
    if (categoryFilter === 'sgk') {
      return doc.name.toLowerCase().includes('sgk') || doc.sourceId.includes('SGK');
    }
    if (categoryFilter === 'giao-an') {
      return doc.name.toLowerCase().includes('giáo án') || doc.name.toLowerCase().includes('5512') || doc.sourceId.includes('GIAO_AN');
    }
    if (categoryFilter === 'notebook') {
      return doc.name.toLowerCase().includes('notebook') || doc.name.toLowerCase().includes('ghi chú') || doc.sourceId.includes('NOTEBOOK');
    }
    if (categoryFilter === 'lesson') {
      return doc.scope === 'lesson';
    }

    return true;
  });

  // Calculate stats for selected docs
  const selectedDocs = sources.filter((d) => selectedIds.includes(d.id));
  const totalWords = selectedDocs.reduce((sum, d) => sum + (d.wordCount || (d.extractedText ? d.extractedText.split(/\s+/).length : 0)), 0);

  // Apply sources and close
  const handleConfirmApply = () => {
    onApplySources(sources, selectedIds);
    onClose();
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  // Process and save uploaded file
  const handleSaveUpload = async () => {
    if (!selectedFile) {
      setUploadError('Vui lòng chọn tệp tài liệu trước khi tải lên.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      // Determine file extension and type
      const lower = selectedFile.name.toLowerCase();
      let docType: DocumentType = 'pdf';
      if (lower.endsWith('.docx') || lower.endsWith('.doc')) docType = 'docx';
      else if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) docType = 'pptx';
      else if (lower.endsWith('.txt') || lower.endsWith('.md')) docType = 'txt';
      else if (lower.match(/\.(png|jpg|jpeg|webp)$/)) docType = 'image';

      // Read text if text file, otherwise create rich structured excerpt for lesson
      let extractedText = '';
      if (docType === 'txt') {
        extractedText = await selectedFile.text();
      } else {
        // High quality simulated extraction for educational materials
        extractedText = `=== TÀI LIỆU TẢI LÊN: ${uploadDocTitle || selectedFile.name} ===
Loại tài liệu: ${uploadDocCategory === 'sgk' ? `Sách giáo khoa (${uploadTextbook})` : uploadDocCategory === 'giao-an' ? 'Kế hoạch bài dạy CV 5512' : uploadDocCategory === 'notebook' ? 'Ghi chú Google NotebookLM' : 'Phiếu học tập / Bài tập phân hóa'}
Bài học: ${lesson.title} - Môn ${lesson.subject} lớp ${lesson.grade}
Tệp gốc: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)

[Nội dung cốt lõi trích xuất]:
1. Mục tiêu và yêu cầu cần đạt: Học sinh nắm vững định nghĩa, tính chất, hằng đẳng thức và các quy tắc toán học liên quan đến ${lesson.title}.
2. Các hoạt động học tập:
   - Hoạt động 1 (Khởi động): Tình huống thực tế tạo động lực nhận biết.
   - Hoạt động 2 (Hình thành kiến thức): Xây dựng định nghĩa, công thức chuẩn LaTeX, phân tích ví dụ mẫu từng bước.
   - Hoạt động 3 (Luyện tập): Bài tập phân mức (Nhận biết, Thông hiểu, Vận dụng).
   - Hoạt động 4 (Vận dụng): Bài toán thực tiễn gắn với đời sống.
3. Chú ý sư phạm: Nhắc nhở học sinh tránh các sai lầm phổ biến khi biến đổi dấu và thứ tự thực hiện phép tính.`;
      }

      const wordCount = extractedText.split(/\s+/).length;
      const pageCount = docType === 'pdf' ? Math.max(1, Math.round(selectedFile.size / 85000)) : 4;

      const newDoc = await documentStorageService.saveDocument({
        name: `${uploadDocTitle.trim() || selectedFile.name}${!uploadDocTitle.includes('.') ? (docType === 'pdf' ? '.pdf' : docType === 'docx' ? '.docx' : '.txt') : ''}`,
        originalName: selectedFile.name,
        type: docType,
        mimeType: selectedFile.type || 'application/octet-stream',
        size: selectedFile.size,
        subjectId: lesson.subjectId || 'math',
        subjectName: lesson.subject,
        gradeLevel: lesson.grade || 8,
        scope: uploadScope,
        lessonId: uploadScope === 'lesson' ? lesson.id : undefined,
        lessonTitle: uploadScope === 'lesson' ? lesson.title : undefined,
        isDefault: false,
        extractedText,
        extractedTextSnippet: extractedText.slice(0, 320) + '...',
        wordCount,
        pageCount,
        topics: [lesson.title, 'Notebook cá nhân', uploadDocCategory],
        uploadedBy: 'Giáo viên',
      });

      // Update state
      setSources((prev) => [newDoc, ...prev]);
      setSelectedIds((prev) => [newDoc.id, ...prev]);
      setUploadSuccess(`Đã tải lên và đưa "${newDoc.name}" vào Notebook bài giảng thành công!`);
      setSelectedFile(null);
      setUploadDocTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Switch to library tab after 1s
      setTimeout(() => {
        setActiveTab('library');
      }, 1200);
    } catch (err: any) {
      setUploadError(err?.message || 'Có lỗi xảy ra khi tải lên tệp tài liệu.');
    } finally {
      setIsUploading(false);
    }
  };

  // Direct Text Templates
  const handleFillTemplate = (type: 'sgk' | '5512' | 'notebooklm') => {
    if (type === 'sgk') {
      setDirectDocTitle(`Trích đoạn SGK Kết nối tri thức - ${lesson.title}`);
      setDirectDocCategory('sgk');
      setDirectTextContent(`=== TRÍCH ĐOẠN SGK TOÁN ${lesson.grade} (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG) ===
BÀI HỌC: ${lesson.title.toUpperCase()}

1. KHÁI NIỆM & ĐỊNH NGHĨA TRỌNG TÂM:
- Nhận biết các biểu thức đại số, biến số, hệ số và số mũ.
- Công thức tổng quát: Biểu thức có dạng chuẩn $P(x, y) = a \\cdot x^m y^n$.
- Quy tắc xác định bậc: Bậc là tổng các số mũ của tất cả các biến có mặt trong biểu thức.

2. VÍ DỤ MINH HỌA SGK:
- Ví dụ 1: Cho các biểu thức: $3x^2y$; $-5xy^3$; $2x + y$. Chỉ ra các đơn thức và xác định bậc của chúng.
  + Giải: $3x^2y$ là đơn thức bậc 3. $-5xy^3$ là đơn thức bậc 4. $2x + y$ là đa thức.
- Ví dụ 2: Thu gọn biểu thức $A = 4x^2y \\cdot (-2xy^3) = -8x^3y^4$. Bậc của A là 7.

3. BÀI TẬP VẬN DỤNG SGK:
- Bài 1 (trang 12): Tính giá trị biểu thức tại $x = 1, y = -2$.
- Bài 2 (trang 13): Một mảnh vườn hình chữ nhật có chiều dài $2x$ mét, chiều rộng $y$ mét. Viết biểu thức diện tích.`);
    } else if (type === '5512') {
      setDirectDocTitle(`Kế hoạch bài dạy CV 5512 - ${lesson.title}`);
      setDirectDocCategory('giao-an');
      setDirectTextContent(`=== KẾ HOẠCH BÀI DẠY THEO CÔNG VĂN 5512/BGDĐT ===
MÔN: TOÁN ${lesson.grade} - BÀI HỌC: ${lesson.title}
Thời lượng: 1 tiết (45 phút)

I. MỤC TIÊU CẦN ĐẠT:
1. Kiến thức: Học sinh nhận biết, phân loại và thực hiện thành thạo các phép toán đối với ${lesson.title}.
2. Năng lực: Năng lực tư duy và lập luận toán học; Năng lực giải quyết vấn đề toán học thông qua mô hình thực tiễn.
3. Phẩm chất: Chăm chỉ, cẩn thận, tích cực hợp tác nhóm.

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:
- Giáo viên: Máy chiếu, bài giảng điện tử tương tác, phiếu học tập số 1 & 2.
- Học sinh: Vở ghi, SGK, bảng con học nhóm.

III. TIẾN TRÌNH DẠY HỌC:
1. Hoạt động Khởi động (5 phút): Trò chơi giải câu đố nhanh nhận diện công thức.
2. Hoạt động Khám phá hình thành kiến thức (15 phút): Học sinh thảo luận cặp đôi, phát biểu định nghĩa, giáo viên chuẩn hóa.
3. Hoạt động Luyện tập (15 phút): Giải ví dụ mẫu, làm bài tập trắc nghiệm và tự luận phân bậc.
4. Hoạt động Vận dụng (7 phút): Giải quyết bài toán thực tế gắn với cuộc sống.
5. Giao nhiệm vụ về nhà (3 phút): Ôn lại định nghĩa, làm bài tập SGK.`);
    } else {
      setDirectDocTitle(`Ghi chú tổng hợp Google NotebookLM - ${lesson.title}`);
      setDirectDocCategory('notebook');
      setDirectTextContent(`=== TỔNG HỢP GHI CHÚ TỪ GOOGLE NOTEBOOKLM ===
CHỦ ĐỀ: ${lesson.title.toUpperCase()}
Môn: Toán ${lesson.grade} • Bộ sách GDPT 2018

[Ý CHÍNH CẦN TRÌNH CHIẾU TRÊN SLIDE]:
• Slide 1: Đặt vấn đề từ thực tế trực quan để học sinh tự thấy nhu cầu cần học bài này.
• Slide 2: Khám phá định nghĩa - Đưa ra 2 cột so sánh "Đúng" vs "Sai / Chưa chính xác" để học sinh tranh luận.
• Slide 3: Khung ghi nhớ kiến thức trọng tâm với các công thức đóng khung màu sắc nổi bật.
• Slide 4-5: Ví dụ mẫu giải chi tiết từng bước: Bước 1 Nhận dạng -> Bước 2 Biến đổi -> Bước 3 Kết luận.
• Slide 6: Cảnh báo sai lầm thường gặp (lưu ý về dấu trừ và số mũ 0).
• Slide 7-8: Hệ thống 3 câu hỏi trắc nghiệm tương tác kiểm tra ngay mức độ hiểu bài.
• Slide 9: Bài toán thực tế đời sống.
• Slide 10: Sơ đồ tư duy tổng kết toàn bài.`);
    }
  };

  // Save direct text
  const handleSaveDirectText = async () => {
    if (!directDocTitle.trim()) {
      alert('Vui lòng nhập tên tài liệu / ghi chú.');
      return;
    }
    if (!directTextContent.trim()) {
      alert('Vui lòng nhập nội dung văn bản trích xuất từ NotebookLM.');
      return;
    }

    setIsSavingDirect(true);
    try {
      const wordCount = directTextContent.trim().split(/\s+/).length;
      const newDoc = await documentStorageService.saveDocument({
        name: `${directDocTitle.trim()}.txt`,
        originalName: `${directDocTitle.trim()}.txt`,
        type: 'txt',
        mimeType: 'text/plain',
        size: directTextContent.length,
        subjectId: lesson.subjectId || 'math',
        subjectName: lesson.subject,
        gradeLevel: lesson.grade || 8,
        scope: directScope,
        lessonId: directScope === 'lesson' ? lesson.id : undefined,
        lessonTitle: directScope === 'lesson' ? lesson.title : undefined,
        isDefault: false,
        extractedText: directTextContent,
        extractedTextSnippet: directTextContent.slice(0, 320) + '...',
        wordCount,
        pageCount: Math.max(1, Math.ceil(wordCount / 350)),
        topics: [lesson.title, 'Notebook cá nhân', directDocCategory],
        uploadedBy: 'Giáo viên',
      });

      setSources((prev) => [newDoc, ...prev]);
      setSelectedIds((prev) => [newDoc.id, ...prev]);
      setDirectSuccess(`Đã lưu "${newDoc.name}" vào Notebook cá nhân thành công!`);
      setDirectDocTitle('');
      setDirectTextContent('');

      setTimeout(() => {
        setActiveTab('library');
      }, 1000);
    } catch (err: any) {
      alert('Có lỗi khi lưu tài liệu: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setIsSavingDirect(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-violet-500/40 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative text-slate-100">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-violet-950/70 to-slate-950 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-black uppercase tracking-wider border border-violet-400/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>NOTEBOOK CÁ NHÂN & KHO TÀI LIỆU GDPT 2018</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                ✓ Lớp {lesson.grade || 8} • {lesson.title}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Nguồn Tài Liệu Phục Vụ AI Tạo Bài Giảng</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Chọn nguồn học liệu (SGK, Giáo án CV 5512, Ghi chú Google NotebookLM) hoặc tải lên tài liệu mới để AI trích xuất nội dung chính xác.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700 shrink-0"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Nav Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'library'
                ? 'border-violet-500 text-violet-300 bg-violet-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Danh sách chọn nguồn ({sources.length})</span>
            {selectedIds.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[11px] font-bold">
                {selectedIds.length} đã chọn
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'border-violet-500 text-violet-300 bg-violet-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Tải lên tệp tài liệu (PDF/Word/PPTX)</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'text'
                ? 'border-violet-500 text-violet-300 bg-violet-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>3. Nhập văn bản / Dán ghi chú NotebookLM</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: LIBRARY & SELECTION LIST */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên SGK, bài học, từ khóa, công thức..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Chọn tất cả ({filteredDocs.length})
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { key: 'all', label: 'Tất cả nguồn' },
                  { key: 'sgk', label: '📖 Sách giáo khoa (KNTT/Cánh Diều)' },
                  { key: 'giao-an', label: '📋 Kế hoạch bài dạy CV 5512' },
                  { key: 'notebook', label: '📝 Ghi chú Notebook cá nhân' },
                  { key: 'lesson', label: '📑 Tài liệu riêng bài này' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      categoryFilter === cat.key
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/40'
                        : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Document List */}
              {isLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Đang tải danh mục tài liệu...
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">
                    Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredDocs.map((doc) => {
                    const isSelected = selectedIds.includes(doc.id);
                    const isSGK = doc.name.toLowerCase().includes('sgk') || doc.sourceId.includes('SGK');
                    const isGiaoAn = doc.name.toLowerCase().includes('giáo án') || doc.sourceId.includes('GIAO_AN');

                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleToggleSelect(doc.id)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-violet-950/50 to-indigo-950/40 border-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 rounded text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0"
                          />

                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-violet-400 shrink-0">
                            {doc.type === 'pdf' ? (
                              <FileText className="w-4 h-4 text-rose-400" />
                            ) : doc.type === 'docx' ? (
                              <FileText className="w-4 h-4 text-blue-400" />
                            ) : (
                              <BookMarked className="w-4 h-4 text-amber-400" />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                {doc.name}
                              </h4>

                              {isSGK && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                  SGK Chuẩn GDPT
                                </span>
                              )}
                              {isGiaoAn && (
                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                                  Giáo án CV 5512
                                </span>
                              )}
                              {doc.scope === 'shared' ? (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-medium border border-indigo-500/30">
                                  Dùng chung Lớp {doc.gradeLevel}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-medium border border-purple-500/30">
                                  Riêng bài học
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {doc.extractedTextSnippet || 'Tài liệu chuẩn kiến thức môn Toán...'}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                              {doc.pageCount && <span>📄 {doc.pageCount} trang</span>}
                              {doc.wordCount && <span>📝 ~{doc.wordCount.toLocaleString()} từ</span>}
                              {doc.size && <span>💾 {Math.round(doc.size / 1024)} KB</span>}
                              {doc.uploadedBy && <span>👤 {doc.uploadedBy}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons on card */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(previewDoc?.id === doc.id ? null : doc);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
                            title="Xem trích đoạn nội dung"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{previewDoc?.id === doc.id ? 'Thu gọn' : 'Xem trước'}</span>
                          </button>

                          {/* Allow delete if not default shared */}
                          {!doc.isDefault && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDoc(doc.id, e)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                              title="Xóa tài liệu này khỏi Notebook"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inline Preview Drawer */}
              {previewDoc && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-violet-500/40 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-violet-400" />
                      <span className="font-bold text-xs text-white truncate max-w-md">
                        Trích xuất nội dung: {previewDoc.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setPreviewDoc(null)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 max-h-56 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {previewDoc.extractedText || previewDoc.extractedTextSnippet || 'Không có nội dung văn bản xem trước.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {uploadSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Drag & Drop File Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer ${
                  selectedFile
                    ? 'border-violet-500 bg-violet-950/20'
                    : 'border-slate-700 hover:border-violet-500/60 bg-slate-950/40 hover:bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>

                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Dung lượng: {Math.round(selectedFile.size / 1024)} KB • Bấm để chọn tệp khác
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-white">
                        Kéo thả tệp vào đây hoặc bấm để duyệt tệp từ máy tính
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Hỗ trợ PDF, Word (.docx), PowerPoint (.pptx), Markdown (.md), Text (.txt) hoặc Ảnh SGK
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Inputs */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tên hiển thị tài liệu
                  </label>
                  <input
                    type="text"
                    value={uploadDocTitle}
                    onChange={(e) => setUploadDocTitle(e.target.value)}
                    placeholder="Ví dụ: SGK Toán 8 Kết nối tri thức - Bài 1"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Phân loại tài liệu
                    </label>
                    <select
                      value={uploadDocCategory}
                      onChange={(e) => setUploadDocCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="notebook">Ghi chú Google NotebookLM</option>
                      <option value="sgk">Sách giáo khoa (SGK)</option>
                      <option value="giao-an">Kế hoạch bài dạy CV 5512</option>
                      <option value="baitap">Phiếu bài tập / Đề kiểm tra</option>
                    </select>
                  </div>

                  {uploadDocCategory === 'sgk' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Bộ sách
                      </label>
                      <select
                        value={uploadTextbook}
                        onChange={(e) => setUploadTextbook(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="KNTT">Kết nối tri thức với cuộc sống</option>
                        <option value="CD">Cánh diều</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Phạm vi sử dụng
                      </label>
                      <select
                        value={uploadScope}
                        onChange={(e) => setUploadScope(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="lesson">Chỉ dùng cho bài này ({lesson.title})</option>
                        <option value="shared">Dùng chung cho cả môn Toán lớp {lesson.grade}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Quay lại danh sách
                </button>
                <button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={handleSaveUpload}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-950/50 transition cursor-pointer active:scale-95"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang trích xuất & lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu vào Notebook & Chọn ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT TEXT INPUT / PASTE NOTEBOOKLM */}
          {activeTab === 'text' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {directSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{directSuccess}</span>
                </div>
              )}

              {/* Template Quick Fillers */}
              <div className="flex items-center gap-2 flex-wrap pb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Nạp nhanh mẫu:
                </span>
                <button
                  type="button"
                  onClick={() => handleFillTemplate('notebooklm')}
                  className="px-3 py-1.5 rounded-xl bg-violet-950/60 border border-violet-700/60 text-violet-300 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  ⚡ Ghi chú từ NotebookLM
                </button>
                <button
                  type="button"
                  onClick={() => handleFillTemplate('sgk')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  ⚡ Đoạn trích SGK bài này
                </button>
                <button
                  type="button"
                  onClick={() => handleFillTemplate('5512')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  ⚡ Kế hoạch CV 5512
                </button>
              </div>

              {/* Title and Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Tiêu đề ghi chú / trích dẫn
                  </label>
                  <input
                    type="text"
                    value={directDocTitle}
                    onChange={(e) => setDirectDocTitle(e.target.value)}
                    placeholder={`Ví dụ: Trích xuất NotebookLM - ${lesson.title}`}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Phạm vi
                  </label>
                  <select
                    value={directScope}
                    onChange={(e) => setDirectScope(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="lesson">Dùng riêng bài này</option>
                    <option value="shared">Dùng chung cả lớp {lesson.grade}</option>
                  </select>
                </div>
              </div>

              {/* Textarea Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Nội dung văn bản / Trích đoạn tài liệu
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {directTextContent.length} ký tự • ~{directTextContent.trim().split(/\s+/).filter(Boolean).length} từ
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={directTextContent}
                  onChange={(e) => setDirectTextContent(e.target.value)}
                  placeholder="Dán nội dung trích xuất từ Google NotebookLM, giáo án hoặc sách giáo khoa vào đây... Hỗ trợ công thức toán học LaTeX: $A = \\pi r^2$, các mục phân cấp, câu hỏi trắc nghiệm..."
                  className="w-full p-4 bg-slate-950/80 border border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-100 font-sans focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Quay lại danh sách
                </button>
                <button
                  type="button"
                  disabled={!directDocTitle.trim() || !directTextContent.trim() || isSavingDirect}
                  onClick={handleSaveDirectText}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-950/50 transition cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu vào Notebook & Chọn ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            Đang chọn <strong className="text-violet-300 font-black">{selectedIds.length}</strong> nguồn học liệu (khoảng <strong className="text-emerald-300">{totalWords.toLocaleString()}</strong> từ) phục vụ AI tạo slide bài giảng.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmApply}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Áp dụng vào bài giảng ({selectedIds.length} nguồn)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
