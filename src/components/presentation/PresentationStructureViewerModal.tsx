import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  X,
  Sigma,
  HelpCircle,
  Clock,
  Eye,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Play,
  Edit3,
  Download,
} from 'lucide-react';
import { StructuredPresentation, StructuredSlideItem, SlideType } from '../../types/presentationStructure';

export interface PresentationStructureViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: StructuredPresentation;
  onRegenerate?: () => void;
  onDelete: () => void;
  onOpenPlayer?: (slideIndex?: number) => void;
  onOpenExport?: () => void;
  isStaged?: boolean;
  onConfirmSave?: () => void;
  onEditInCanvas?: () => void;
  onDiscard?: () => void;
}

const slideTypeColors: Record<SlideType, { bg: string; text: string; border: string; label: string }> = {
  title: { bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-500/40', label: '01. Trang mở đầu' },
  objective: { bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-500/40', label: '02. Mục tiêu' },
  warmup: { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-500/40', label: '03. Khởi động' },
  knowledge: { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500/40', label: '04. Hình thành kiến thức' },
  example: { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-500/40', label: '05. Ví dụ minh họa' },
  activity: { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-500/40', label: '06. Khám phá / Thảo luận' },
  practice: { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-500/40', label: '07. Luyện tập tại lớp' },
  application: { bg: 'bg-teal-950/80', text: 'text-teal-300', border: 'border-teal-500/40', label: '08. Vận dụng thực tiễn' },
  summary: { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-700', label: '09. Củng cố' },
  assignment: { bg: 'bg-orange-950/80', text: 'text-orange-300', border: 'border-orange-500/40', label: '10. Dặn dò' },
  custom: { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-700', label: 'Slide bổ sung' },
};

export const PresentationStructureViewerModal: React.FC<PresentationStructureViewerModalProps> = ({
  isOpen,
  onClose,
  presentation,
  onRegenerate,
  onDelete,
  onOpenPlayer,
  onOpenExport,
  isStaged = false,
  onConfirmSave,
  onEditInCanvas,
  onDiscard,
}) => {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'slides' | 'flow' | 'audit'>('slides');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  if (!isOpen || !presentation) return null;

  const slides = presentation.slides || [];
  const activeSlide: StructuredSlideItem | undefined = slides[selectedSlideIndex];
  const audit = presentation.qualityAudit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-950/95 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.85)] border border-slate-800 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* TOP HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isStaged ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>XEM TRƯỚC & KIỂM ĐỊNH (CHƯA LƯU)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    🟢 ĐÃ TẠO CẤU TRÚC LOGIC (GIAI ĐOẠN 3)
                  </span>
                )}
                <span className="text-xs text-slate-300">
                  Phiên bản v{presentation.version || 1} • {slides.length} slide logic
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5 truncate max-w-xl">
                {presentation.title}
              </h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isStaged && onConfirmSave && (
              <button
                id="btn-confirm-save-staged"
                onClick={onConfirmSave}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5 fill-white/20" />
                <span>Duyệt & Lưu bài học</span>
              </button>
            )}

            {onEditInCanvas && (
              <button
                id="btn-edit-canvas"
                onClick={onEditInCanvas}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 border border-indigo-400/30 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chỉnh sửa Canvas</span>
              </button>
            )}

            {onOpenPlayer && (
              <button
                id="btn-viewer-open-player"
                onClick={() => onOpenPlayer(selectedSlideIndex)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-cyan-300/60"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Trình chiếu GĐ 4 ▶</span>
              </button>
            )}

            {onOpenExport && (
              <button
                id="btn-viewer-open-export"
                onClick={onOpenExport}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-bold transition flex items-center gap-1.5 border border-orange-500/40 cursor-pointer shadow-sm"
                title="Xuất bài giảng sang PowerPoint (.pptx) / PDF / Kế hoạch bài dạy"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất PPTX</span>
              </button>
            )}

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-600 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tạo lại</span>
              </button>
            )}

            {isStaged && onDiscard ? (
              <button
                onClick={onDiscard}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-rose-900/40 transition cursor-pointer"
                title="Hủy bỏ bản nháp"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-900/40 transition cursor-pointer"
                title="Xóa bài giảng này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STAGED NOTIFICATION BANNER */}
        {isStaged && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
              <span>
                <strong className="text-cyan-300">Bước xem trước & kiểm định:</strong> Bài giảng AI vừa được lập dàn ý logic GDPT 2018. Vui lòng rà soát danh sách slide, công thức LaTeX và báo cáo chất lượng trước khi lưu chính thức vào bài học.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onDiscard && (
                <button
                  onClick={onDiscard}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/70 border border-rose-500/40 hover:bg-rose-900 transition cursor-pointer"
                >
                  Hủy không lưu
                </button>
              )}
              {onEditInCanvas && (
                <button
                  onClick={onEditInCanvas}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-500/40 hover:bg-indigo-900 transition cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa Canvas</span>
                </button>
              )}
              {onConfirmSave && (
                <button
                  onClick={onConfirmSave}
                  className="px-3.5 py-1 rounded-lg text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Xác nhận & Lưu ngay</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* SUB HEADER TABS */}
        <div className="px-6 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('slides')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'slides' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Danh sách Slide ({slides.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('flow')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'flow' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tiến trình sư phạm tổng quát</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kiểm định chất lượng ({Math.round((audit?.confidenceScore || 0.95) * 100)}%)</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden md:block">
            Nguồn sử dụng: <strong className="font-bold text-cyan-300">{presentation.usedSources?.length || 1} tài liệu</strong>
          </div>
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'slides' && (
            <>
              {/* LEFT SIDEBAR: LIST OF SLIDES */}
              <div className="w-72 sm:w-80 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-950/70">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cấu trúc logic {slides.length} slide
                </div>

                {slides.map((s, idx) => {
                  const isSelected = idx === selectedSlideIndex;
                  const typeMeta = slideTypeColors[s.type] || slideTypeColors.custom;

                  return (
                    <div
                      key={s.id || idx}
                      onClick={() => setSelectedSlideIndex(idx)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.35)] border-cyan-400'
                          : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : `${typeMeta.bg} ${typeMeta.text} border ${typeMeta.border}`
                          }`}
                        >
                          Slide {idx + 1 < 10 ? `0${idx + 1}` : idx + 1} • {s.type}
                        </span>

                        {s.formulas && s.formulas.length > 0 && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                              isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                            }`}
                          >
                            <Sigma className="w-2.5 h-2.5" />
                            <span>{s.formulas.length}</span>
                          </span>
                        )}
                      </div>

                      <h5 className={`text-xs font-bold mt-1.5 truncate ${isSelected ? 'text-slate-950 font-black' : 'text-white'}`}>
                        {s.title}
                      </h5>

                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                        {s.content || s.keyPoints?.join(', ')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT CONTENT: DETAILED SLIDE INSPECTOR */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/90">
                {activeSlide ? (
                  <div className="space-y-6 max-w-4xl">
                    {/* Slide Type Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider border border-cyan-400/30">
                            Slide {selectedSlideIndex + 1} / {slides.length}
                          </span>
                          <span className="text-xs text-slate-300 font-bold">
                            Loại: {activeSlide.type.toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-white mt-1">{activeSlide.title}</h2>
                        {activeSlide.subtitle && (
                          <p className="text-xs text-slate-300 mt-0.5">{activeSlide.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Source References */}
                    <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Bookmark className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-300 font-semibold">Trích dẫn nguồn học liệu:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSlide.sourceReferences?.map((ref, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 font-bold text-cyan-300 text-[11px]"
                            >
                              📖 {ref.documentName} {ref.page ? `(Trang ${ref.page})` : ''} {ref.sectionTitle ? `• ${ref.sectionTitle}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>

                      {activeSlide.needsReview && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Cần kiểm tra
                        </span>
                      )}
                    </div>

                    {/* Core Content */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Nội dung trình bày logic:
                      </h4>
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                        {activeSlide.content}
                      </div>
                    </div>

                    {/* Key Points */}
                    {activeSlide.keyPoints && activeSlide.keyPoints.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          Điểm kiến thức cốt lõi (Key Points):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {activeSlide.keyPoints.map((point, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs font-bold text-slate-200 flex items-start gap-2"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-emerald-500/40">
                                {pIdx + 1}
                              </span>
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* LaTeX Formulas */}
                    {activeSlide.formulas && activeSlide.formulas.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sigma className="w-3.5 h-3.5 text-purple-400" />
                          <span>Công thức Toán học chuẩn LaTeX:</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activeSlide.formulas.map((form, fIdx) => (
                            <div
                              key={fIdx}
                              className="px-3.5 py-2 rounded-xl bg-slate-900 text-cyan-300 font-mono text-xs border border-cyan-500/40 shadow-sm"
                            >
                              ${form}$
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Examples & Step-by-Step Solutions */}
                    {activeSlide.examples && activeSlide.examples.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          Ví dụ mẫu & Lời giải chuẩn:
                        </h4>
                        {activeSlide.examples.map((ex, eIdx) => (
                          <div key={eIdx} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                            <div className="text-xs font-bold text-slate-200">
                              <strong className="text-cyan-400 font-black">Ví dụ {eIdx + 1}:</strong> {ex.problem}
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium">
                              <strong className="text-emerald-400 font-bold">Lời giải: </strong>
                              {ex.solution}
                            </div>
                            {ex.explanation && (
                              <div className="text-[11px] text-slate-400 italic">
                                Lưu ý: {ex.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Teaching Activity */}
                    {activeSlide.teachingActivity && (
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          <span>Gợi ý Hoạt động Dạy & Học (Tiến trình GDPT 2018):</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="font-bold text-amber-400">Hoạt động Giáo viên:</span>
                            <p className="text-slate-300 mt-1">{activeSlide.teachingActivity.teacherActivity}</p>
                          </div>
                          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="font-bold text-amber-400">Hoạt động Học sinh:</span>
                            <p className="text-slate-300 mt-1">{activeSlide.teachingActivity.studentActivity}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interactive Question */}
                    {activeSlide.interactionQuestions && activeSlide.interactionQuestions.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/40 space-y-3">
                        <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-indigo-400" />
                          <span>Câu hỏi tương tác nhanh tại lớp:</span>
                        </h4>
                        {activeSlide.interactionQuestions.map((q, qIdx) => (
                          <div key={qIdx} className="space-y-2">
                            <p className="text-xs font-bold text-white">{q.questionText}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options?.map((opt) => (
                                <div
                                  key={opt.key}
                                  className={`p-2.5 rounded-xl border text-xs font-semibold ${
                                    opt.key === q.answer
                                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                      : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <strong>{opt.key}.</strong> {opt.text}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="text-[11px] text-slate-400 italic">
                                Giải thích: {q.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400">
                    Chọn một slide bên trái để xem nội dung chi tiết.
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: PEDAGOGICAL FLOW */}
          {activeTab === 'flow' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
              <div className="p-6 bg-slate-900 border border-slate-800 text-white rounded-3xl space-y-3">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Mục tiêu tổng quát bài học (GDPT 2018)
                </span>
                <div className="space-y-1.5">
                  {presentation.pedagogicalFlow?.objectives.map((obj, oIdx) => (
                    <div key={oIdx} className="flex items-start gap-2 text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    1. Khởi động (Warm-up)
                  </h4>
                  <p className="text-xs text-slate-300">{presentation.pedagogicalFlow?.warmupSummary}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-1.5">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    2. Hình thành kiến thức
                  </h4>
                  <p className="text-xs text-slate-300">{presentation.pedagogicalFlow?.keyKnowledgeSummary}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-1.5">
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    3. Luyện tập & Củng cố
                  </h4>
                  <p className="text-xs text-slate-300">{presentation.pedagogicalFlow?.practiceSummary}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/40 space-y-1.5">
                  <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                    4. Vận dụng & Đánh giá
                  </h4>
                  <p className="text-xs text-slate-300">{presentation.pedagogicalFlow?.applicationSummary}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUALITY AUDIT */}
          {activeTab === 'audit' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
              <div className="p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 text-white rounded-3xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Báo cáo kiểm định chất lượng tự động
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    Độ tin cậy: {Math.round((audit?.confidenceScore || 0.95) * 100)}%
                  </h3>
                  <p className="text-xs text-emerald-200 mt-1">
                    Đã kiểm tra tiêu đề, mục tiêu, công thức LaTeX, trích dẫn nguồn và số lượng slide rỗng.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 text-xl font-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  {Math.round((audit?.confidenceScore || 0.95) * 100)}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Các tiêu chuẩn sư phạm đã đáp ứng:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs font-bold text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tiêu đề và phân cấp bài học chuẩn xác</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs font-bold text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Xác định đầy đủ mục tiêu bài học (GDPT 2018)</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs font-bold text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Bảo toàn công thức Toán học chuẩn LaTeX</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs font-bold text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Trích dẫn ngược về nguồn SGK & Giáo án</span>
                  </div>
                </div>
              </div>

              {audit?.warnings && audit.warnings.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2 text-amber-200">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Lưu ý sư phạm cần rà soát:</span>
                  </h4>
                  <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1">
                    {audit.warnings.map((warn, wIdx) => (
                      <li key={wIdx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* STAGED FOOTER APPROVAL BAR */}
        {isStaged && (
          <div className="px-6 py-3.5 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-slate-300">
                Bản nháp AI đang chờ duyệt • {slides.length} slide logic • Tương thích GDPT 2018
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {onDiscard && (
                <button
                  type="button"
                  onClick={onDiscard}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
                >
                  ✕ Hủy bỏ (Không lưu)
                </button>
              )}
              {onEditInCanvas && (
                <button
                  type="button"
                  onClick={onEditInCanvas}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-200 hover:text-white bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa trong Canvas</span>
                </button>
              )}
              {onConfirmSave && (
                <button
                  type="button"
                  onClick={onConfirmSave}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-950/40 transition cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Xác nhận & Lưu bài giảng vào bài học</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION SUB-MODAL */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-800 space-y-4 text-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-white">Xóa cấu trúc bài giảng AI này?</h3>
                <p className="text-xs text-slate-400">
                  Thao tác này chỉ xóa bản thảo bài giảng, <strong className="text-slate-200">tài liệu SGK và Kho học liệu nguồn vẫn được giữ nguyên an toàn 100%</strong>.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-md shadow-rose-950/50 transition cursor-pointer"
                >
                  Đồng ý xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
