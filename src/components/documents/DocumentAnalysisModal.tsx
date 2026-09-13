import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Edit3,
  Save,
  Sigma,
  Table as TableIcon,
  Image as ImageIcon,
  Layers,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  FileText,
  BadgeCheck,
  Cpu,
} from 'lucide-react';
import { DocumentSource } from '../../types/documentSource';
import { DocumentAnalysisResult, DocumentAnalysisLesson } from '../../types/documentAnalysis';
import { DocumentAnalysisService } from '../../services/documentAnalysisService';

interface DocumentAnalysisModalProps {
  document: DocumentSource | null;
  isOpen: boolean;
  onClose: () => void;
  onAnalysisUpdated?: (updated: DocumentAnalysisResult) => void;
}

export const DocumentAnalysisModal: React.FC<DocumentAnalysisModalProps> = ({
  document,
  isOpen,
  onClose,
  onAnalysisUpdated,
}) => {
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'structure' | 'formulas' | 'tables' | 'summary'>('structure');
  
  // Lesson expand/collapse state
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  
  // Teacher inline editing state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; pageFrom: number; pageTo: number }>({
    title: '',
    pageFrom: 1,
    pageTo: 1,
  });

  useEffect(() => {
    if (!isOpen || !document) {
      setAnalysis(null);
      setError(null);
      return;
    }

    loadAnalysis();
  }, [isOpen, document?.id]);

  const loadAnalysis = async () => {
    if (!document) return;
    setLoading(true);
    setError(null);
    try {
      let result = await DocumentAnalysisService.getAnalysis(document.id);
      if (!result) {
        // If not analyzed yet, trigger automatic initial analysis
        result = await DocumentAnalysisService.triggerDocumentAnalysis(document, false);
      }
      setAnalysis(result);
      // Auto-expand first 2 lessons
      if (result.lessons.length > 0) {
        setExpandedLessons({
          [result.lessons[0].id]: true,
          ...(result.lessons[1] ? { [result.lessons[1].id]: true } : {}),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải kết quả phân tích AI');
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!document) return;
    setReanalyzing(true);
    setError(null);
    try {
      const freshResult = await DocumentAnalysisService.triggerDocumentAnalysis(document, true);
      setAnalysis(freshResult);
      if (onAnalysisUpdated) onAnalysisUpdated(freshResult);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi yêu cầu phân tích lại');
    } finally {
      setReanalyzing(false);
    }
  };

  const toggleLessonExpand = (id: string) => {
    setExpandedLessons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditLesson = (lesson: DocumentAnalysisLesson) => {
    setEditingLessonId(lesson.id);
    setEditForm({
      title: lesson.title,
      pageFrom: lesson.pageFrom,
      pageTo: lesson.pageTo,
    });
  };

  const saveEditLesson = async () => {
    if (!analysis || !document || !editingLessonId) return;

    const chaptersList = Array.isArray(analysis?.chapters) ? analysis.chapters : [];
    const lessonsList = Array.isArray(analysis?.lessons) ? analysis.lessons : [];
    const formulasList = Array.isArray(analysis?.formulas) ? analysis.formulas : [];
    const tablesList = Array.isArray(analysis?.tables) ? analysis.tables : [];
    const imagesList = Array.isArray(analysis?.images) ? analysis.images : [];

    const updatedLessons = lessonsList.map((l) =>
      l.id === editingLessonId
        ? {
            ...l,
            title: editForm.title,
            pageFrom: Number(editForm.pageFrom) || l.pageFrom,
            pageTo: Number(editForm.pageTo) || l.pageTo,
            needsReview: false,
          }
        : l
    );

    try {
      const updated = await DocumentAnalysisService.updateAnalysisByTeacher(document.id, {
        lessons: updatedLessons,
      });
      if (updated) {
        setAnalysis(updated);
        setEditingLessonId(null);
        if (onAnalysisUpdated) onAnalysisUpdated(updated);
      }
    } catch (err: any) {
      setError('Lỗi khi lưu chỉnh sửa: ' + err.message);
    }
  };

  if (!isOpen || !document) return null;

  const confidencePercent = Math.round((analysis?.confidence || 0.95) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Cpu className="w-6 h-6 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  GIAI ĐOẠN 2: AI ĐỌC & LẬP CHỈ MỤC
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  <span>Phiên bản tài liệu: v{document.version}</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1 leading-snug line-clamp-1">
                {document.name}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {document.subjectName || document.subject} • Khối {document.gradeLevel || document.grade} • {document.scope === 'shared' ? '📚 Kho chung Môn/Lớp' : `📁 Tài liệu riêng bài: ${document.lessonTitle || document.lessonId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 border border-white/10"
              title="Gửi yêu cầu phân tích lại tài liệu này qua Gemini AI"
            >
              <RotateCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Đang phân tích...' : 'Phân tích lại'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS BAR & CONFIDENCE */}
        {analysis && (
          <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>{(analysis.chapters || []).length} Chương</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>{(analysis.lessons || []).length} Bài học</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Sigma className="w-4 h-4 text-purple-600" />
                <span>{(analysis.formulas || []).length} Công thức (LaTeX)</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <TableIcon className="w-4 h-4 text-emerald-600" />
                <span>{(analysis.tables || []).length} Bảng số liệu</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>{(analysis.images || []).length} Hình vẽ/Sơ đồ</span>
              </div>
            </div>

            {/* AI Confidence Meter */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-600 font-semibold text-[11px]">Độ tin cậy AI:</span>
              <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
              <span className="font-black text-emerald-700 text-[11px]">{confidencePercent}%</span>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'structure'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 Cấu trúc Bài & Chương ({analysis?.lessons.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'formulas'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sigma className="w-4 h-4" />
            <span>📐 Công thức Toán LaTeX ({analysis?.formulas.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'tables'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>📊 Bảng & Hình vẽ ({((analysis?.tables.length || 0) + (analysis?.images.length || 0))})</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📝 Tóm tắt & Cảnh báo</span>
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Lỗi trong quá trình xử lý:</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {loading || reanalyzing ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg shadow-indigo-200">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-800">
                {reanalyzing ? 'Đang đọc lại và lập chỉ mục qua Gemini AI...' : 'Đang tải dữ liệu phân tích...'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                Hệ thống đang trích xuất mục lục, phạm vi số trang, công thức toán học LaTeX và bảo toàn bảng số liệu chuẩn GDPT 2018...
              </p>
            </div>
          ) : !analysis ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Chưa có dữ liệu phân tích cho tài liệu này.</p>
              <button
                onClick={handleReanalyze}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
              >
                ⚡ Bắt đầu phân tích AI ngay
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: CẤU TRÚC CHƯƠNG & BÀI HỌC (CHỈ MỤC TRANG) */}
              {activeTab === 'structure' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 leading-relaxed">
                      <span className="font-bold">Chỉ mục phân đoạn theo Bài học:</span> AI đã tự động phân đoạn các bài học kèm khoảng trang tương ứng. Giáo viên có thể bấm vào bài học để xem các mục kiến thức con, hoặc bấm nút <span className="font-bold underline">Sửa</span> để điều chỉnh phạm vi số trang nếu cần.
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(analysis.lessons || []).map((lesson, idx) => {
                      const isExpanded = !!expandedLessons[lesson.id];
                      const isEditing = editingLessonId === lesson.id;

                      return (
                        <div
                          key={lesson.id || idx}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition hover:border-indigo-300"
                        >
                          {/* Lesson Item Header */}
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-100">
                            <div
                              onClick={() => !isEditing && toggleLessonExpand(lesson.id)}
                              className="flex items-start sm:items-center gap-2.5 cursor-pointer flex-1"
                            >
                              <button className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              <div>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="px-3 py-1.5 rounded-lg border border-indigo-400 text-xs font-bold text-slate-800 w-full sm:w-80 bg-white"
                                  />
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-black text-slate-800">{lesson.title}</span>
                                    {lesson.chapterTitle && (
                                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                                        {lesson.chapterTitle}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-slate-500">Trang:</span>
                                    <input
                                      type="number"
                                      value={editForm.pageFrom}
                                      onChange={(e) => setEditForm({ ...editForm, pageFrom: Number(e.target.value) })}
                                      className="w-14 px-2 py-1 rounded border border-slate-300 text-xs text-center font-bold"
                                    />
                                    <span>→</span>
                                    <input
                                      type="number"
                                      value={editForm.pageTo}
                                      onChange={(e) => setEditForm({ ...editForm, pageTo: Number(e.target.value) })}
                                      className="w-14 px-2 py-1 rounded border border-slate-300 text-xs text-center font-bold"
                                    />
                                  </div>
                                  <button
                                    onClick={saveEditLesson}
                                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                                    title="Lưu thay đổi"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingLessonId(null)}
                                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                                    title="Hủy"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-black border border-slate-200">
                                    📖 Trang {lesson.pageFrom} → {lesson.pageTo}
                                  </span>
                                  <button
                                    onClick={() => startEditLesson(lesson)}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                    title="Điều chỉnh số trang hoặc tên bài"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Lesson Expanded Content */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 space-y-4 bg-white">
                              {lesson.summary && (
                                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  💡 {lesson.summary}
                                </p>
                              )}

                              {/* Key Formulas of Lesson */}
                              {lesson.keyFormulas && lesson.keyFormulas.length > 0 && (
                                <div>
                                  <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Sigma className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Công thức trọng tâm của bài:</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {lesson.keyFormulas.map((form, fIdx) => (
                                      <div
                                        key={fIdx}
                                        className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 font-mono text-xs text-purple-950 font-bold"
                                      >
                                        ${form}$
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Sub-sections of Lesson */}
                              <div>
                                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                                  Các mục kiến thức (Sections):
                                </div>
                                <div className="space-y-2">
                                  {lesson.sections?.map((sec, sIdx) => (
                                    <div
                                      key={sec.id || sIdx}
                                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-800">{sec.title}</span>
                                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px] uppercase">
                                          {sec.type}
                                        </span>
                                      </div>
                                      <p className="text-slate-600 leading-relaxed">{sec.contentSnippet}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: CÔNG THỨC TOÁN HỌC (LATEX) */}
              {activeTab === 'formulas' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex items-start gap-3">
                    <Sigma className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-900 leading-relaxed">
                      <span className="font-bold">Bảo toàn công thức Toán học chuẩn LaTeX:</span> Hệ thống bảo toàn chính xác ký hiệu lũy thừa ($x^2, x^3$), phân số, căn thức, góc ($\angle$), tính vuông góc/song song ($\perp, \parallel$) chuẩn mực cho giáo dục.
                    </div>
                  </div>

                  {(analysis.formulas || []).length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Không tìm thấy công thức toán học chuyên biệt nào trong tài liệu này.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(analysis.formulas || []).map((formula, fIdx) => (
                        <div
                          key={formula.id || fIdx}
                          className="bg-white rounded-2xl border border-purple-200 p-4 shadow-2xs flex flex-col justify-between hover:border-purple-400 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-bold text-slate-700">{formula.text}</span>
                              {formula.page && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                  Trang {formula.page}
                                </span>
                              )}
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs sm:text-sm font-black overflow-x-auto tracking-wide">
                              ${formula.latex}$
                            </div>
                          </div>
                          {formula.context && (
                            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 line-clamp-2">
                              📍 {formula.context}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BẢNG SỐ LIỆU & HÌNH VẼ */}
              {activeTab === 'tables' && (
                <div className="space-y-6">
                  {/* TABLES */}
                  <div>
                    <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-emerald-600" />
                      <span>Bảng số liệu ({(analysis.tables || []).length})</span>
                    </h4>

                    {(analysis.tables || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Không phát hiện bảng số liệu trong tài liệu.</p>
                    ) : (
                      <div className="space-y-4">
                        {(analysis.tables || []).map((table, tIdx) => (
                          <div
                            key={table.id || tIdx}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                          >
                            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 font-bold text-xs text-emerald-950 flex items-center justify-between">
                              <span>{table.title || `Bảng dữ liệu ${tIdx + 1}`}</span>
                              {table.page && (
                                <span className="text-[10px] text-emerald-700">Trang {table.page}</span>
                              )}
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                                    {(table.headers || []).map((h, hIdx) => (
                                      <th key={hIdx} className="p-2.5 border-r border-slate-200 last:border-r-0">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(table.rows || []).map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                                      {(row || []).map((cell, cIdx) => (
                                        <td
                                          key={cIdx}
                                          className="p-2.5 text-slate-700 border-r border-slate-100 last:border-r-0"
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* IMAGES & DIAGRAMS */}
                  <div>
                    <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      <span>Hình vẽ hình học & Sơ đồ minh họa ({(analysis.images || []).length})</span>
                    </h4>

                    {(analysis.images || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Không có metadata hình vẽ nào được đánh dấu.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(analysis.images || []).map((img, iIdx) => (
                          <div
                            key={img.id || iIdx}
                            className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-slate-800">{img.caption}</span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                                {img.type || 'Hình học'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{img.context}</p>
                            {img.page && (
                              <div className="text-[10px] text-slate-400 font-semibold">Vị trí: Trang {img.page}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: TÓM TẮT & CẢNH BÁO */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Tóm tắt nội dung tài liệu</span>
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{analysis.summary}</p>
                  </div>

                  {analysis.topics && analysis.topics.length > 0 && (
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                      <h4 className="text-sm font-black text-slate-800">Các chủ đề trọng tâm (Topics Index)</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-100"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.warnings && analysis.warnings.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Lưu ý & Cảnh báo từ AI:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                        {analysis.warnings.map((w, wIdx) => (
                          <li key={wIdx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Dữ liệu lập chỉ mục này sẽ tự động cung cấp ngữ cảnh cho <strong>việc giảng dạy và ngân hàng câu hỏi</strong>.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
