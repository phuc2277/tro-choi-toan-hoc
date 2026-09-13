import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  FileCode,
  Printer,
  Download,
  CheckCircle2,
  Loader2,
  Settings2,
  Info,
  Presentation,
  Check,
} from 'lucide-react';
import { LessonPresentationPackage } from '../../../types/contentBlock';
import { Lesson } from '../../../types/teacherLesson';
import { StructuredPresentation } from '../../../types/presentationStructure';
import {
  exportToPptx,
  exportToSlideDeckPdf,
  exportToLessonPlanPdf,
  exportToStandaloneHtml,
  openPrintWindow,
  normalizeToPresentationPackage,
  ExportOptions,
} from '../../../utils/presentationExporter';

export interface PresentationExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  presentation?: LessonPresentationPackage | StructuredPresentation | any;
}

export type ExportFormat = 'pptx' | 'pdf-slides' | 'pdf-lessonplan' | 'html-offline' | 'print-slides' | 'print-plan';

export const PresentationExportModal: React.FC<PresentationExportModalProps> = ({
  isOpen,
  onClose,
  lesson,
  presentation,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pptx');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeSolutions, setIncludeSolutions] = useState(true);
  const [schoolName, setSchoolName] = useState('Trường THCS & THPT Thực Nghiệm');
  const [teacherName, setTeacherName] = useState((lesson as any).teacherName || 'Thầy/Cô bộ môn');
  const [schoolYear, setSchoolYear] = useState('2025 - 2026');

  if (!isOpen) return null;

  // Resolve standardized package
  const pkg: LessonPresentationPackage = normalizeToPresentationPackage(lesson, presentation);

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportSuccessMessage(null);

    const options: ExportOptions = {
      includeTeacherNotes: includeNotes,
      includeSolutions: includeSolutions,
      schoolName: schoolName.trim(),
    };

    const packageWithMeta: LessonPresentationPackage = {
      ...pkg,
      teacherName: teacherName.trim(),
      schoolYear: schoolYear.trim(),
    };

    try {
      // Allow UI to update before heavy export
      await new Promise((r) => setTimeout(r, 100));

      if (selectedFormat === 'pptx') {
        await exportToPptx(packageWithMeta, options);
        setExportSuccessMessage('Đã tạo và tải xuống tệp PowerPoint (.pptx) thành công!');
      } else if (selectedFormat === 'pdf-slides') {
        exportToSlideDeckPdf(packageWithMeta, options);
        setExportSuccessMessage('Đã tạo và tải xuống PDF Bản chiếu 16:9 thành công!');
      } else if (selectedFormat === 'pdf-lessonplan') {
        exportToLessonPlanPdf(packageWithMeta, options);
        setExportSuccessMessage('Đã tạo và tải xuống Kế hoạch bài dạy CV 5512 (A4 PDF) thành công!');
      } else if (selectedFormat === 'html-offline') {
        exportToStandaloneHtml(packageWithMeta, options);
        setExportSuccessMessage('Đã tạo và tải xuống file HTML Tự hành Offline thành công!');
      } else if (selectedFormat === 'print-slides') {
        openPrintWindow(packageWithMeta, 'slides', options);
        setExportSuccessMessage('Đã mở cửa sổ in ấn Bản chiếu slide!');
      } else if (selectedFormat === 'print-plan') {
        openPrintWindow(packageWithMeta, 'lesson-plan', options);
        setExportSuccessMessage('Đã mở cửa sổ in ấn Kế hoạch bài dạy A4!');
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMessage(err.message || 'Lỗi trong quá trình xuất bài giảng. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalSlides = pkg.activities.reduce((sum, act) => sum + act.slides.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-bold shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Xuất Bài Giảng Điện Tử</h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  GDPT 2018
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {pkg.title} • {totalSlides} slide • {pkg.activities.length} hoạt động
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Format Selection Grid */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              1. Chọn định dạng xuất bài giảng
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: PPTX */}
              <div
                onClick={() => setSelectedFormat('pptx')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  selectedFormat === 'pptx'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  {selectedFormat === 'pptx' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900">Microsoft PowerPoint (.pptx)</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Slide tỉ lệ 16:9 chuẩn chiếu lớp, có phân mục 4 hoạt động, công thức toán và ghi chú thuyết trình (Speaker Notes).
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">Khuyên dùng</span>
                  <span className="text-[10px] text-slate-400">PowerPoint & Google Slides</span>
                </div>
              </div>

              {/* Option 2: PDF Slide Deck */}
              <div
                onClick={() => setSelectedFormat('pdf-slides')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  selectedFormat === 'pdf-slides'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Presentation className="w-5 h-5" />
                  </div>
                  {selectedFormat === 'pdf-slides' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900">PDF Bản chiếu Slide (16:9)</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Trang ngang sắc nét, giữ nguyên định dạng trên mọi màn hình, thích hợp gửi học sinh xem trước hoặc in phát tay.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">PDF 16:9</span>
                  <span className="text-[10px] text-slate-400">Không bị vỡ font chữ</span>
                </div>
              </div>

              {/* Option 3: PDF Lesson Plan (A4) */}
              <div
                onClick={() => setSelectedFormat('pdf-lessonplan')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  selectedFormat === 'pdf-lessonplan'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  {selectedFormat === 'pdf-lessonplan' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900">Giáo án / Kế hoạch bài dạy (A4 PDF)</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Định dạng Kế hoạch bài dạy theo Công văn 5512 của Bộ GD&ĐT, bao gồm mục tiêu, 4 hoạt động, bài tập và đáp án.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">Công văn 5512</span>
                  <span className="text-[10px] text-slate-400">Nộp tổ chuyên môn</span>
                </div>
              </div>

              {/* Option 4: Standalone HTML Offline */}
              <div
                onClick={() => setSelectedFormat('html-offline')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  selectedFormat === 'html-offline'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileCode className="w-5 h-5" />
                  </div>
                  {selectedFormat === 'html-offline' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900">HTML Trình chiếu Tự Hành (Offline)</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Một tệp web duy nhất, lưu vào USB cắm máy tính lớp mở trực tiếp bằng Chrome/Edge không cần Internet hay cài đặt.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">100% Offline</span>
                  <span className="text-[10px] text-slate-400">Có phím tắt & Timer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Print Options Strip */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700">Hoặc In nhanh trực tiếp bằng máy in:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('print-slides');
                  handleExport();
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                In Trang Slide
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('print-plan');
                  handleExport();
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                In Giáo án A4
              </button>
            </div>
          </div>

          {/* Export Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="w-4 h-4 text-slate-500" />
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Tùy chọn nội dung xuất
              </label>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3.5">
              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Kèm ghi chú sư phạm (Speaker Notes)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSolutions}
                    onChange={(e) => setIncludeSolutions(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Kèm đáp án & lời giải trắc nghiệm
                  </span>
                </label>
              </div>

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Đơn vị / Trường học:
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Tên trường học..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Giáo viên giảng dạy:
                  </label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Họ và tên..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Năm học:
                  </label>
                  <input
                    type="text"
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="2025 - 2026"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {exportSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs font-bold">{exportSuccessMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center gap-3 animate-fadeIn">
              <Info className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-xs font-bold">{errorMessage}</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Tất cả định dạng đều tuân thủ cấu trúc bài dạy chuẩn GDPT 2018.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xuất tệp...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    Xuất{' '}
                    {selectedFormat === 'pptx'
                      ? 'PowerPoint (.pptx)'
                      : selectedFormat === 'pdf-slides'
                      ? 'PDF Slide 16:9'
                      : selectedFormat === 'pdf-lessonplan'
                      ? 'Giáo án A4 PDF'
                      : selectedFormat === 'html-offline'
                      ? 'HTML Tự Hành'
                      : 'In Ấn'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
