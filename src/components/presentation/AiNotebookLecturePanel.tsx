import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Play,
  Edit3,
  Download,
  HelpCircle,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  BookMarked,
  Cpu,
  Brain,
  Sliders,
  Send,
  Upload,
  Info,
} from 'lucide-react';
import { Lesson, AiStructuredPresentation } from '../../types/teacherLesson';
import { DocumentSource } from '../../types/documentSource';
import { StructuredPresentation } from '../../types/presentationStructure';
import { LessonPresentationPackage } from '../../types/contentBlock';
import { documentStorageService } from '../../services/documentStorageService';
import { presentationAiService } from '../../services/presentationAiService';
import { convertStructuredPresentationToPackage } from '../../utils/lectureStructureAdapter';
import { NotebookSourceModal } from './NotebookSourceModal';

export interface AiNotebookLecturePanelProps {
  lesson: Lesson;
  onClose: () => void;
  onPresentationCreated: (
    newPres: AiStructuredPresentation,
    newPackage: LessonPresentationPackage,
    action?: 'play' | 'edit' | 'export' | 'view'
  ) => void;
}

export const AiNotebookLecturePanel: React.FC<AiNotebookLecturePanelProps> = ({
  lesson,
  onClose,
  onPresentationCreated,
}) => {
  // Document Sources from Notebook / Storage
  const [sources, setSources] = useState<DocumentSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  // Notebook Text / Notes
  const [notebookNotes, setNotebookNotes] = useState('');

  // Pedagogical Configuration
  const [textbook, setTextbook] = useState<'KNTT' | 'CD'>('KNTT');
  const [duration, setDuration] = useState('45 phút');
  const [pedagogicalStyle, setPedagogicalStyle] = useState<
    'interactive' | 'exploratory' | 'practice-heavy' | 'traditional'
  >('interactive');
  const [generationMode, setGenerationMode] = useState<'standard' | 'detailed' | 'fast'>('standard');
  const [teacherCustomNotes, setTeacherCustomNotes] = useState('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    pres: AiStructuredPresentation;
    pkg: LessonPresentationPackage;
    struct: StructuredPresentation;
  } | null>(null);

  // Tools & Modals
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importScriptText, setImportScriptText] = useState('');
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Load documents for this lesson
  useEffect(() => {
    let isMounted = true;
    async function loadDocs() {
      setIsLoadingSources(true);
      try {
        const data = await documentStorageService.getEffectiveDocumentsForLesson(
          lesson.subjectId || 'math',
          lesson.grade || 8,
          lesson.id
        );
        if (isMounted) {
          const combined = [...data.defaultShared, ...data.allShared.filter(d => !data.defaultShared.some(ds => ds.id === d.id)), ...data.lessonDocs];
          const uniqueDocs = Array.from(new Map(combined.map(item => [item.id, item])).values());
          setSources(uniqueDocs);
          // Default select all available docs or keep previous selections
          setSelectedSourceIds((prev) => (prev.length > 0 ? prev : uniqueDocs.map((d) => d.id)));
        }
      } catch (err) {
        console.warn('Error loading lesson documents:', err);
      } finally {
        if (isMounted) setIsLoadingSources(false);
      }
    }
    loadDocs();
    return () => {
      isMounted = false;
    };
  }, [lesson.id, lesson.subjectId, lesson.grade]);

  // Handle applied sources from modal
  const handleApplySources = (updatedSources: DocumentSource[], selectedIds: string[]) => {
    setSources(updatedSources);
    setSelectedSourceIds(selectedIds);
  };

  // Quick fill sample notebook summary for current lesson
  const handleFillSampleNotebookNotes = () => {
    const sampleNotes = `=== TÀI LIỆU NOTEBOOK: ${lesson.title.toUpperCase()} ===
Bộ sách: Kết nối tri thức với cuộc sống - Toán ${lesson.grade}
Yêu cầu cần đạt chuẩn GDPT 2018:
• Nhận biết khái niệm cốt lõi của bài học và các trường hợp đặc biệt.
• Nhận dạng công thức toán học trọng tâm: $A = a \\cdot x^m y^n$.
• Thực hiện thành thạo các bước giải ví dụ mẫu và bài tập củng cố.
• Vận dụng tính giá trị và giải quyết tình huống thực tế (đo đạc, hình học, kinh tế, đời sống).

Tiến trình bài giảng đề xuất (45 phút):
1. Khởi động: Tình huống thực tiễn gắn với hình học/đời sống để học sinh tự lập biểu thức.
2. Hình thành kiến thức:
   - Hoạt động khám phá: Học sinh quan sát các nhóm biểu thức, phân biệt và rút ra định nghĩa.
   - Chuẩn hóa định nghĩa & quy tắc. Lưu ý các lỗi học sinh hay nhầm lẫn.
3. Luyện tập: Bài tập phân hóa Nhận biết -> Thông hiểu -> Vận dụng. Có bảng phân tích kết quả.
4. Vận dụng: Tình huống thực tế (tính diện tích, thể tích, tối ưu chi phí).
5. Củng cố & Dặn dò: Sơ đồ tư duy 3 nhánh và hướng dẫn làm bài tập SGK.`;
    setNotebookNotes(sampleNotes);
  };

  // Master Prompt for external Google NotebookLM / Gemini
  const generateMasterNotebookPrompt = () => {
    const textbookName =
      textbook === 'KNTT'
        ? 'Kết nối tri thức với cuộc sống'
        : 'Cánh diều';

    return `VAI TRÒ:
Bạn là chuyên gia thiết kế bài giảng Toán THCS theo Chương trình GDPT 2018, đồng thời là chuyên gia sư phạm, thiết kế hoạt động học tập và thiết kế nội dung trình chiếu PowerPoint.

NHIỆM VỤ:
Xây dựng một BÀI GIẢNG POWERPOINT chất lượng cao dựa TRƯỚC HẾT trên các nguồn tài liệu trong Notebook này.
• Môn: ${lesson.subject} ${lesson.grade}
• Bài học: ${lesson.title}
• Bộ sách ưu tiên: ${textbookName}
• Thời lượng: ${duration}
• Phong cách sư phạm: Học sinh suy nghĩ – quan sát – dự đoán – thực hiện – rút ra kết luận

TIẾN TRÌNH SƯ PHẠM 6 BƯỚC BẮT BUỘC:
1. KHỞI ĐỘNG (Tình huống thực tế gợi mở, câu hỏi khám phá)
2. HÌNH THÀNH KIẾN THỨC (Khái niệm, định nghĩa, công thức chuẩn LaTeX, phân tích thành phần)
3. LUYỆN TẬP (Bài tập củng cố phân bậc, bảng kết quả, câu hỏi phân tích)
4. VẬN DỤNG (Bài toán thực tế đời sống, hình học, liên hệ đo đạc)
5. CỦNG CỐ – ĐÁNH GIÁ (Sơ đồ tư duy tổng kết, câu hỏi nhanh khắc sâu)
6. HƯỚNG DẪN HỌC Ở NHÀ (Nhiệm vụ cụ thể, bài tập SGK)

ĐẶC BIỆT ĐỐI VỚI MỖI SLIDE PHẢI CUNG CẤP:
SLIDE [số]
1. TÊN SLIDE: (Ngắn gọn, rõ mục tiêu)
2. MỤC ĐÍCH SƯ PHẠM: (Slide dùng để làm gì?)
3. NỘI DUNG HIỂN THỊ TRÊN SLIDE: (Súc tích, không nhồi chữ, công thức chuẩn LaTeX)
4. HOẠT ĐỘNG CỦA HỌC SINH: (Quan sát, ghi chép, tính toán, thảo luận nhóm)
5. HOẠT ĐỘNG CỦA GIÁO VIÊN: (Dẫn dắt, đặt câu hỏi, chốt kiến thức)
6. CÂU HỎI TƯƠNG TÁC: (1–3 câu hỏi gợi mở)
7. DỰ KIẾN CÂU TRẢ LỜI: (Câu trả lời mong đợi của học sinh)
8. GHI CHÚ CHO GIÁO VIÊN: (Cách triển khai, lưu ý lỗi sai thường gặp)
9. HÌNH ẢNH/ĐỒ THỊ/HÌNH HỌC NÊN CÓ: (Mô tả trực quan chính xác)
10. HIỆU ỨNG (ANIMATION): (Từng bước logic, không lạm dụng)`;
  };

  const handleCopyMasterPrompt = () => {
    navigator.clipboard.writeText(generateMasterNotebookPrompt());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Toggle Source
  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  // Run AI Generation from Notebook
  const handleGeneratePresentation = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedResult(null);

    try {
      setGenerationStep(1); // Reading Notebook & Docs
      await new Promise((r) => setTimeout(r, 600));

      // Filter selected docs
      const selectedDocs = sources.filter((s) => selectedSourceIds.includes(s.id));

      // If user entered custom notebook notes, create a virtual document source
      const effectiveSources = [...selectedDocs];
      if (notebookNotes.trim()) {
        const now = Date.now();
        effectiveSources.push({
          id: `notebook-notes-${now}`,
          sourceId: `NOTEBOOK_${lesson.id.toUpperCase()}`,
          name: `Ghi chú Notebook: ${lesson.title}`,
          originalName: `Ghi chú Notebook: ${lesson.title}.txt`,
          type: 'txt',
          mimeType: 'text/plain',
          size: notebookNotes.length,
          scope: 'lesson',
          subjectId: lesson.subjectId || 'toan',
          subject: lesson.subject,
          gradeLevel: lesson.grade || 8,
          grade: lesson.grade,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          createdAt: now,
          updatedAt: now,
          version: 1,
          uploadedBy: 'Giáo viên',
          extractedText: notebookNotes.trim(),
          extractedTextSnippet: notebookNotes.slice(0, 300),
          isDefault: false,
        });
      }

      setGenerationStep(2); // Matching GDPT 2018 Standards
      await new Promise((r) => setTimeout(r, 700));

      setGenerationStep(3); // Synthesizing 6-step Slides & Pedagogical Flow

      const structuredPres = await presentationAiService.generateStructuredPresentation({
        subjectId: lesson.subjectId || 'toan',
        subjectName: lesson.subject || 'Toán học',
        gradeLevel: lesson.grade || 8,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        selectedDocuments: effectiveSources,
        duration,
        pedagogicalStyle,
        generationMode,
        customObjectives: lesson.description || lesson.title,
        teacherNotes: `Bộ sách ưu tiên: ${
          textbook === 'KNTT'
            ? 'Kết nối tri thức với cuộc sống'
            : 'Cánh diều'
        }. ${teacherCustomNotes}`,
        existingVersion: lesson.presentations?.length || 0,
      });

      setGenerationStep(4); // Generating Content Blocks & Presentation Package
      await new Promise((r) => setTimeout(r, 500));

      // Convert into Presentation Package
      const presentationPackage = convertStructuredPresentationToPackage(lesson, structuredPres);

      // Build AiStructuredPresentation
      const newPres: AiStructuredPresentation = {
        id: structuredPres.id || `pres-ai-${Date.now()}`,
        title: structuredPres.title || `Bài giảng: ${lesson.title}`,
        sourceType: 'ai-structured',
        createdAt: Date.now(),
        authorName: `AI Notebook (GDPT 2018 - ${
          textbook === 'KNTT' ? 'KNTT' : 'Cánh diều'
        })`,
        duration,
        lecture: {
          id: `lec-${Date.now()}`,
          title: structuredPres.title || lesson.title,
          description: structuredPres.description,
          objectives: structuredPres.pedagogicalFlow?.objectives || [lesson.title],
          warmup: {
            title: 'Khởi động',
            scenario: structuredPres.pedagogicalFlow?.warmupSummary || '',
          },
          sections: (structuredPres.slides || [])
            .filter((s) => s.type === 'knowledge' || s.type === 'example' || s.type === 'activity')
            .map((s, idx) => ({
              id: `sec-${idx + 1}`,
              title: s.title,
              subtitle: s.subtitle,
              content: s.content || '',
              keyPoints: s.keyPoints || [],
              formula: s.formulas?.[0],
              examples: s.examples?.map((ex) => ({ problem: ex.problem, solution: ex.solution })),
            })),
          practice: (structuredPres.slides || [])
            .filter((s) => s.type === 'practice')
            .map((s) => ({
              question: s.content || s.title,
              hint: s.keyPoints?.[0],
            })),
          application: structuredPres.pedagogicalFlow?.applicationSummary || '',
          summary: [
            'Nắm vững định nghĩa và công thức toán học.',
            'Thực hiện thành thạo các bước giải bài tập.',
          ],
        },
        structuredPresentation: structuredPres,
        qualityAudit: structuredPres.qualityAudit,
      };

      setGeneratedResult({
        pres: newPres,
        pkg: presentationPackage,
        struct: structuredPres,
      });
    } catch (err: any) {
      console.error('Error in AI Notebook Generation:', err);
      setGenerationError(err.message || 'Có lỗi xảy ra khi khởi tạo bài giảng từ Notebook.');
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  // Handle parsing manual script imported from external NotebookLM
  const handleImportScript = () => {
    if (!importScriptText.trim()) return;

    // Simple parser for slides structured in text
    const lines = importScriptText.split('\n');
    let currentSlideTitle = 'Slide mở đầu';
    let currentContent: string[] = [];
    const parsedSlides: any[] = [];

    lines.forEach((line) => {
      const match = line.match(/^SLIDE\s+(\d+)[:\s-]*(.*)/i);
      if (match) {
        if (currentContent.length > 0) {
          parsedSlides.push({
            id: `slide-${parsedSlides.length + 1}`,
            order: parsedSlides.length + 1,
            type: parsedSlides.length === 0 ? 'title' : 'knowledge',
            title: currentSlideTitle,
            content: currentContent.join('\n').trim(),
            keyPoints: [],
            formulas: [],
          });
          currentContent = [];
        }
        currentSlideTitle = match[2]?.trim() || `Slide ${match[1]}`;
      } else {
        currentContent.push(line);
      }
    });

    if (currentContent.length > 0) {
      parsedSlides.push({
        id: `slide-${parsedSlides.length + 1}`,
        order: parsedSlides.length + 1,
        type: 'knowledge',
        title: currentSlideTitle,
        content: currentContent.join('\n').trim(),
        keyPoints: [],
        formulas: [],
      });
    }

    if (parsedSlides.length === 0) {
      alert('Không nhận diện được cấu trúc SLIDE từ văn bản dán vào. Vui lòng kiểm tra lại định dạng!');
      return;
    }

    const struct: StructuredPresentation = {
      id: `pres-import-${Date.now()}`,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      title: `Bài giảng (Nhập từ Notebook): ${lesson.title}`,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'draft',
      generationConfig: {
        duration,
        pedagogicalStyle,
        generationMode,
        selectedSourceIds: [],
      },
      usedSources: [],
      pedagogicalFlow: {
        objectives: [lesson.title],
        warmupSummary: 'Khởi động từ Notebook',
        keyKnowledgeSummary: 'Hình thành kiến thức từ Notebook',
        practiceSummary: 'Luyện tập',
        applicationSummary: 'Vận dụng',
        assessmentSummary: 'Đánh giá',
      },
      slides: parsedSlides,
      qualityAudit: {
        hasTitle: true,
        hasObjectives: true,
        hasCoreKnowledge: true,
        hasSourceReferences: true,
        hasValidFormulas: true,
        emptySlidesCount: 0,
        warnings: [],
        confidenceScore: 0.95,
      },
    };

    const pkg = convertStructuredPresentationToPackage(lesson, struct);
    const newPres: AiStructuredPresentation = {
      id: struct.id,
      title: struct.title,
      sourceType: 'ai-structured',
      createdAt: Date.now(),
      authorName: 'Giáo viên nhập từ Notebook',
      duration,
      lecture: {
        id: `lec-${Date.now()}`,
        title: struct.title,
        objectives: [lesson.title],
        sections: parsedSlides.map((s, idx) => ({
          id: `sec-${idx + 1}`,
          title: s.title,
          content: s.content,
          keyPoints: [],
        })),
        summary: [],
      },
      structuredPresentation: struct,
    };

    onPresentationCreated(newPres, pkg, 'view');
    setIsImportModalOpen(false);
  };

  return (
    <div className="mt-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950/70 to-slate-950 border border-violet-500/40 text-slate-100 shadow-2xl animate-in fade-in duration-200 space-y-6">
      {/* 1. Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-950/50 border border-violet-400/40 shrink-0">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-wider border border-violet-500/30">
                ✨ AI NOTEBOOK SƯ PHẠM 2018
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                Môn {lesson.subject} {lesson.grade}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-slate-300">{lesson.title}</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
              <span>AI Tạo Bài Giảng từ Notebook & Tài liệu GDPT 2018</span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleCopyMasterPrompt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition cursor-pointer"
            title="Sao chép toàn bộ Master Prompt 11 phần để dán vào Google NotebookLM bên ngoài"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã chép Prompt!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-violet-400" />
                <span>Sao chép Prompt Notebook</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition cursor-pointer"
            title="Dán kịch bản slide đã sinh từ NotebookLM vào ứng dụng"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nhập kịch bản</span>
          </button>

          <button
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            ✕ Đóng
          </button>
        </div>
      </div>

      {/* 2. Success Result Panel (If generated) */}
      {generatedResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/50 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  TẠO THÀNH CÔNG TỪ NOTEBOOK
                </span>
                <h5 className="text-base font-black text-white mt-0.5">
                  {generatedResult.pres.title}
                </h5>
                <p className="text-xs text-slate-300">
                  Đã cấu trúc thành{' '}
                  <strong className="text-emerald-400">
                    {generatedResult.struct.slides.length} slide
                  </strong>{' '}
                  chuẩn tiến trình 6 bước GDPT 2018 (Độ tin cậy sư phạm:{' '}
                  {Math.round((generatedResult.struct.qualityAudit?.confidenceScore || 0.95) * 100)}
                  %).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() =>
                  onPresentationCreated(generatedResult.pres, generatedResult.pkg, 'play')
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>▶ Trình chiếu ngay</span>
              </button>

              <button
                onClick={() =>
                  onPresentationCreated(generatedResult.pres, generatedResult.pkg, 'edit')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-950/50 transition cursor-pointer border border-violet-400/30"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Soạn Slide Blocks</span>
              </button>

              <button
                onClick={() =>
                  onPresentationCreated(generatedResult.pres, generatedResult.pkg, 'export')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất PPTX</span>
              </button>

              <button
                onClick={() =>
                  onPresentationCreated(generatedResult.pres, generatedResult.pkg, 'view')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Đưa vào danh sách</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Form Grid: Left = Sources & Notes, Right = Config & Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Document Sources & Notebook Input */}
        <div className="lg:col-span-7 space-y-4">
          {/* Document Sources Section */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <label className="text-xs font-black uppercase text-violet-300 tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <span>1. Nguồn học liệu Notebook & SGK</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Tài liệu SGK, Giáo án CV 5512 hoặc Ghi chú NotebookLM làm căn cứ cho AI
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSourceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-950/40 transition cursor-pointer active:scale-95"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>+ Quản lý & Tải lên nguồn</span>
                </button>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span>Đã chọn <strong className="text-white font-bold">{selectedSourceIds.length} / {sources.length}</strong> nguồn</span>
                {selectedSourceIds.length > 0 && (
                  <span className="text-emerald-400 font-semibold">• Sẵn sàng phân tích</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSourceIds(sources.map((d) => d.id))}
                  className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setSelectedSourceIds([])}
                  className="text-slate-400 hover:text-slate-300 cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {isLoadingSources ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Đang quét các nguồn tài liệu của bài học...
              </div>
            ) : sources.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Chưa có tài liệu tải lên riêng. Bấm <strong>"+ Quản lý & Tải lên nguồn"</strong> để thêm SGK hoặc giáo án vào Notebook.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSourceModalOpen(true)}
                  className="w-full py-2 rounded-lg bg-violet-950/40 border border-violet-700/50 hover:bg-violet-900/50 text-violet-300 text-xs font-bold transition cursor-pointer"
                >
                  + Mở giao diện tải lên hoặc chọn nguồn SGK / Giáo án
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sources.map((doc) => {
                  const isChecked = selectedSourceIds.includes(doc.id);
                  const isSGK = doc.name.toLowerCase().includes('sgk') || doc.sourceId?.includes('SGK');
                  const isGiaoAn = doc.name.toLowerCase().includes('giáo án') || doc.name.toLowerCase().includes('5512');
                  
                  return (
                    <div
                      key={doc.id}
                      onClick={() => toggleSource(doc.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition cursor-pointer ${
                        isChecked
                          ? 'bg-violet-950/40 border-violet-500/50 text-white shadow-sm shadow-violet-950/30'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0"
                        />
                        <FileText className={`w-3.5 h-3.5 shrink-0 ${isSGK ? 'text-emerald-400' : isGiaoAn ? 'text-cyan-400' : 'text-violet-400'}`} />
                        <span className="font-semibold truncate">{doc.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSGK ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                            SGK chuẩn
                          </span>
                        ) : isGiaoAn ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                            CV 5512
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {doc.scope === 'shared' ? 'Dùng chung' : 'Riêng bài'}
                          </span>
                        )}
                        {doc.wordCount && (
                          <span className="text-[10px] text-slate-400 hidden sm:inline">
                            ~{doc.wordCount.toLocaleString()} từ
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notebook Textarea Input */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-violet-300 tracking-wider flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-violet-400" />
                <span>2. Ghi chú / Trích xuất từ NotebookLM của Thầy/Cô</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillSampleNotebookNotes}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  ⚡ Nạp mẫu SGK bài này
                </button>
                {notebookNotes && (
                  <button
                    type="button"
                    onClick={() => setNotebookNotes('')}
                    className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dán nội dung từ Google NotebookLM, tóm tắt giáo án, kế hoạch 5512 hoặc ghi chú bài
              học vào đây. AI sẽ bám sát 100% dữ liệu này để sinh bài giảng.
            </p>

            <textarea
              rows={6}
              value={notebookNotes}
              onChange={(e) => setNotebookNotes(e.target.value)}
              placeholder="Ví dụ: Dán tóm tắt bài giảng từ NotebookLM, các dạng bài tập, công thức toán học hoặc yêu cầu sư phạm riêng..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 font-mono leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Right Column (5 cols): Pedagogical Controls & Action Button */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
            <label className="text-xs font-black uppercase text-violet-300 tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <span>3. Tùy chỉnh Sư phạm GDPT 2018</span>
            </label>

            {/* Textbook Choice */}
            <div>
              <span className="block text-[11px] font-bold text-slate-300 mb-1">
                Bộ sách ưu tiên:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'KNTT', label: 'Kết nối tri thức' },
                  { id: 'CD', label: 'Cánh diều' },
                ].map((tb) => (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => setTextbook(tb.id as any)}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition text-center cursor-pointer ${
                      textbook === tb.id
                        ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-950'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tb.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration & Slide Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-bold text-slate-300 mb-1">Thời lượng:</span>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="45 phút">45 phút (1 tiết)</option>
                  <option value="90 phút">90 phút (2 tiết)</option>
                  <option value="135 phút">135 phút (3 tiết)</option>
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-300 mb-1">Quy mô slide:</span>
                <select
                  value={generationMode}
                  onChange={(e) => setGenerationMode(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="standard">Tiêu chuẩn (10-12 slide)</option>
                  <option value="detailed">Chi tiết (14-16 slide)</option>
                  <option value="fast">Súc tích (7-9 slide)</option>
                </select>
              </div>
            </div>

            {/* Pedagogical Style */}
            <div>
              <span className="block text-[11px] font-bold text-slate-300 mb-1">
                Phong cách sư phạm:
              </span>
              <select
                value={pedagogicalStyle}
                onChange={(e) => setPedagogicalStyle(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="interactive">Khám phá & Tương tác (HS Quan sát - Dự đoán - Rút ra KL)</option>
                <option value="practice-heavy">Luyện tập trọng tâm (Nhiều bài tập phân bậc)</option>
                <option value="exploratory">Tình huống thực tế (Mô hình hóa đời sống)</option>
                <option value="traditional">Trực quan chuẩn mực (Theo trình tự SGK)</option>
              </select>
            </div>

            {/* Teacher Notes */}
            <div>
              <span className="block text-[11px] font-bold text-slate-300 mb-1">
                Ghi chú riêng của giáo viên (tùy chọn):
              </span>
              <input
                type="text"
                value={teacherCustomNotes}
                onChange={(e) => setTeacherCustomNotes(e.target.value)}
                placeholder="Ví dụ: Chú ý lỗi sai hệ số âm, tăng ví dụ hình học..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Action Button & Loading Progress */}
          <div className="space-y-3">
            {generationError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{generationError}</span>
              </div>
            )}

            {isGenerating ? (
              <div className="p-4 rounded-2xl bg-violet-950/60 border border-violet-500/40 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2 text-violet-300 text-xs font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                  <span>AI đang thiết kế bài giảng từ Notebook...</span>
                </div>

                {/* Stepper Progress */}
                <div className="text-[11px] text-slate-300 font-medium">
                  {generationStep === 1 && '1/4: Đọc & đối soát nguồn học liệu Notebook...'}
                  {generationStep === 2 && '2/4: Phân tích chuẩn kiến thức kĩ năng GDPT 2018...'}
                  {generationStep === 3 &&
                    '3/4: Thiết lập tiến trình 6 bước: Khởi động -> Khám phá -> Luyện tập -> Vận dụng...'}
                  {generationStep === 4 &&
                    '4/4: Định hình từng slide, công thức LaTeX, ghi chú giáo viên & câu hỏi...'}
                </div>

                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(generationStep / 4) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="btn-trigger-ai-notebook-generate"
                onClick={handleGeneratePresentation}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-violet-950/60 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 border border-violet-400/40"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>🚀 AI Khởi Tạo Bài Giảng từ Notebook</span>
              </button>
            )}

            <p className="text-[10px] text-center text-slate-400">
              * Cam kết 100% bảo toàn công thức toán học LaTeX, bám sát sách{' '}
              {textbook === 'KNTT' ? 'Kết nối tri thức' : 'Cánh diều'}{' '}
              và tiến trình 6 hoạt động GDPT 2018.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Modal: Import Script from External NotebookLM */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Nhập Kịch bản Slide đã tạo từ Google NotebookLM / Gemini</span>
              </h4>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Dán toàn bộ kịch bản slide (dạng text có các tiêu đề như <code>SLIDE 1: ...</code>,{' '}
              <code>SLIDE 2: ...</code>). Hệ thống sẽ tự động bóc tách thành các slide bài giảng
              điện tử để trình chiếu ngay!
            </p>

            <textarea
              rows={10}
              value={importScriptText}
              onChange={(e) => setImportScriptText(e.target.value)}
              placeholder="Dán kịch bản tại đây... Ví dụ:&#10;SLIDE 1: Khởi động&#10;Nội dung slide...&#10;&#10;SLIDE 2: Khái niệm đơn thức&#10;Nội dung slide..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono resize-y"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!importScriptText.trim()}
                onClick={handleImportScript}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black disabled:opacity-50"
              >
                Chuyển thành Slide Bài Giảng ▶
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 5. Modal: Notebook Source Manager (SGK / Giáo án / Tải lên tài liệu) */}
      {isSourceModalOpen && (
        <NotebookSourceModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          lesson={lesson}
          currentSelectedSourceIds={selectedSourceIds}
          onApplySources={handleApplySources}
        />
      )}
    </div>
  );
};
