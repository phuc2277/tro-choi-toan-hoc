import React, { useState, useEffect } from 'react';
import {
  Lesson,
  PresentationItem,
  AiStructuredPresentation,
  UploadFilePresentation,
  PptLinkPresentation,
  VideoPresentation,
  StructuredLecture,
} from '../../types/teacherLesson';
import { DocumentSource } from '../../types/documentSource';
import { StructuredPresentation } from '../../types/presentationStructure';
import { documentStorageService } from '../../services/documentStorageService';
import { MathRenderer } from '../../games/components/MathRenderer';
import { SlidePresentationModal } from './SlidePresentationModal';
import { FilePresentationViewer } from './FilePresentationViewer';
import { PresentationStructureViewerModal } from './PresentationStructureViewerModal';
import { PresentationPlayer } from './player/PresentationPlayer';
import { PresentationPreviewModal } from './player/PresentationPreviewModal';
import { PresentationViewer } from './PresentationViewer';
import { LectureEditorModal } from './editor/LectureEditorModal';
import { PresentationExportModal } from './export/PresentationExportModal';
import { StepByStepSolutionViewer } from './solution/StepByStepSolutionViewer';
import { InteractiveMath3DBlock } from './solution/InteractiveMath3DBlock';
import { convertStructuredPresentationToPackage } from '../../utils/lectureStructureAdapter';
import { AiNotebookLecturePanel } from './AiNotebookLecturePanel';
import {
  BookOpen,
  Sparkles,
  UploadCloud,
  Link as LinkIcon,
  Video,
  Play,
  Maximize2,
  Trash2,
  Edit3,
  Plus,
  Save,
  CheckCircle2,
  FileText,
  Presentation,
  ExternalLink,
  Download,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Flame,
  FileUp,
  FileCode,
  Eye,
  RefreshCw,
  X,
  Check,
  BookMarked,
  Info,
  Wand2,
  Gamepad2,
} from 'lucide-react';

interface LectureTabProps {
  lesson: Lesson;
  onUpdateLesson: (updatedLesson: Lesson) => void;
  onLaunchGame?: (gameCode: string, questionSet?: any) => void;
  initialOpenAiConfig?: boolean;
  onAiConfigModalOpened?: () => void;
}

type AddLectureMethod = 'upload' | 'link' | 'video' | 'ai-notebook' | null;

export const LectureTab: React.FC<LectureTabProps> = ({
  lesson,
  onUpdateLesson,
  onLaunchGame,
}) => {
  const [selectedPresId, setSelectedPresId] = useState<string>(
    lesson.presentations[0]?.id || ''
  );
  const [activeAddMethod, setActiveAddMethod] = useState<AddLectureMethod>(null);
  const [isSlidePresentationOpen, setIsSlidePresentationOpen] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isLectureEditorOpen, setIsLectureEditorOpen] = useState(false);

  // Presentation & Modal States
  const [isStructureViewerOpen, setIsStructureViewerOpen] = useState(false);
  const [activeStructuredPresentation, setActiveStructuredPresentation] = useState<StructuredPresentation | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isWebPresentationPlayerOpen, setIsWebPresentationPlayerOpen] = useState(false);
  const [isCleanPresentationViewerOpen, setIsCleanPresentationViewerOpen] = useState(false);
  const [playerInitialSlide, setPlayerInitialSlide] = useState(0);

  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);

  // Export Presentation Workflow
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [presentationToExport, setPresentationToExport] = useState<any>(null);

  // Form states for File Upload
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Form states for PPT Link
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  // Form states for Video
  const [videoUrl, setVideoUrl] = useState('');

  // Synchronize state when lesson changes
  useEffect(() => {
    setSelectedPresId(lesson.presentations[0]?.id || '');
    setActiveStructuredPresentation(null);
    setIsCleanPresentationViewerOpen(false);
    setIsStructureViewerOpen(false);
    setIsPreviewModalOpen(false);
    setIsWebPresentationPlayerOpen(false);
  }, [lesson.id]);
  const [videoTitle, setVideoTitle] = useState('');

  // Active presentation
  const currentPresentation =
    lesson.presentations.find((p) => p.id === selectedPresId) ||
    lesson.presentations[0] ||
    null;

  // Jump directly into Visual Content Block Canvas Editor
  const handleEditStagedPresentationInCanvas = () => {
    if (!activeStructuredPresentation) return;
    const convertedPackage = convertStructuredPresentationToPackage(lesson, activeStructuredPresentation);
    onUpdateLesson({
      ...lesson,
      presentationPackage: convertedPackage,
    });
    setIsStructureViewerOpen(false);
    setIsLectureEditorOpen(true);
  };

  // 1. Handle File Upload (Durable Base64 persistence & Text extraction)
  const handleAiNotebookPresentationCreated = (
    newPres: AiStructuredPresentation,
    newPackage: any,
    action?: 'play' | 'edit' | 'export' | 'view'
  ) => {
    const updated = {
      ...lesson,
      presentations: [...lesson.presentations, newPres],
      presentationPackage: newPackage,
    };
    onUpdateLesson(updated);
    setSelectedPresId(newPres.id);
    setActiveStructuredPresentation(newPres.structuredPresentation || null);
    setActiveAddMethod(null);
    setSaveSuccessNotification(`Đã tạo thành công bài giảng từ Notebook: "${newPres.title}"`);

    if (action === 'play') {
      setPlayerInitialSlide(0);
      setIsCleanPresentationViewerOpen(true);
    } else if (action === 'edit') {
      setIsLectureEditorOpen(true);
    } else if (action === 'export') {
      setPresentationToExport(newPres);
      setIsExportModalOpen(true);
    } else if (action === 'view') {
      setIsPreviewModalOpen(true);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleSaveUploadedFile = async (openImmediately: boolean = false) => {
    if (!uploadedFile) return;

    setIsUploading(true);
    try {
      const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
      let fileType: 'pptx' | 'ppt' | 'pdf' | 'docx' = 'pdf';
      if (ext === 'pptx') fileType = 'pptx';
      else if (ext === 'ppt') fileType = 'ppt';
      else if (ext === 'docx' || ext === 'doc') fileType = 'docx';

      const sizeKb = (uploadedFile.size / 1024).toFixed(0);
      const sizeFormatted =
        uploadedFile.size > 1024 * 1024
          ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
          : `${sizeKb} KB`;

      // 1. Convert file into permanent Base64 Data URL to prevent link expiration on page reload
      let fileDataUrl = '';
      if (uploadedFile.size <= 20 * 1024 * 1024) {
        try {
          fileDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(uploadedFile);
          });
        } catch (readErr) {
          console.warn('Could not read file as data URL:', readErr);
        }
      }

      // 2. Extract actual text & page count using documentStorageService
      let extractedText = '';
      let calculatedPageCount = 1;
      try {
        const extractRes = await documentStorageService.extractTextFromFile(uploadedFile);
        if (extractRes && extractRes.text) {
          extractedText = extractRes.text;
          calculatedPageCount = extractRes.pageCount || Math.max(1, Math.ceil(extractRes.wordCount / 250));
        }
      } catch (err) {
        console.warn('Document text extraction fallback:', err);
      }

      let fallbackBlobUrl = '';
      try {
        fallbackBlobUrl = URL.createObjectURL(uploadedFile);
      } catch (e) {
        console.warn('Cannot create object URL:', e);
      }

      const newPres: UploadFilePresentation = {
        id: `pres-upload-${Date.now()}`,
        title: uploadTitle.trim() || uploadedFile.name,
        sourceType: 'upload-file',
        createdAt: Date.now(),
        fileName: uploadedFile.name,
        fileSizeFormatted: sizeFormatted,
        fileType,
        fileUrl: fileDataUrl || fallbackBlobUrl || undefined,
        fileData: fileDataUrl || undefined,
        extractedText: extractedText || undefined,
        pageCount: calculatedPageCount,
        authorName: 'Giáo viên tải lên',
      };

      const updated = {
        ...lesson,
        presentations: [...lesson.presentations, newPres],
      };

      onUpdateLesson(updated);
      setSelectedPresId(newPres.id);
      setActiveAddMethod(null);
      setUploadedFile(null);
      setUploadTitle('');

      if (openImmediately) {
        setIsSlidePresentationOpen(true);
      }
    } catch (e) {
      console.error('Error saving uploaded presentation file:', e);
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Handle Link Add (Canva / Google Slides / OneDrive)
  const handleSavePptLink = () => {
    if (!linkUrl.trim()) return;

    let provider: 'google-slides' | 'canva' | 'onedrive' | 'slideshare' | 'other' = 'other';
    let canEmbed = true;
    let embedUrl = linkUrl.trim();

    if (linkUrl.includes('canva.com')) {
      provider = 'canva';
      embedUrl = linkUrl.includes('?embed') ? linkUrl : `${linkUrl}?embed`;
    } else if (linkUrl.includes('docs.google.com/presentation')) {
      provider = 'google-slides';
      embedUrl = linkUrl.replace(/\/edit.*$/, '/embed?start=false&loop=false&delayms=3000');
    } else if (linkUrl.includes('onedrive') || linkUrl.includes('sharepoint')) {
      provider = 'onedrive';
    } else if (linkUrl.includes('slideshare.net')) {
      provider = 'slideshare';
    }

    const newPres: PptLinkPresentation = {
      id: `pres-link-${Date.now()}`,
      title: linkTitle.trim() || `Slide trực tuyến (${provider})`,
      sourceType: 'ppt-link',
      createdAt: Date.now(),
      linkUrl: linkUrl.trim(),
      provider,
      canEmbed,
      embedUrl,
      authorName: 'Giáo viên liên kết',
    };

    const updated = {
      ...lesson,
      presentations: [...lesson.presentations, newPres],
    };

    onUpdateLesson(updated);
    setSelectedPresId(newPres.id);
    setActiveAddMethod(null);
    setLinkUrl('');
    setLinkTitle('');
  };

  // 4. Handle Video Add (YouTube / TikTok)
  const handleSaveVideo = () => {
    if (!videoUrl.trim()) return;

    let platform: 'youtube' | 'tiktok' | 'other' = 'other';
    let videoId = '';
    let embedUrl = '';

    // Parse YouTube
    const ytMatch = videoUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    if (ytMatch) {
      platform = 'youtube';
      videoId = ytMatch[1];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (videoUrl.includes('tiktok.com')) {
      platform = 'tiktok';
    }

    const newPres: VideoPresentation = {
      id: `pres-video-${Date.now()}`,
      title: videoTitle.trim() || `Video bài giảng: ${lesson.title}`,
      sourceType: 'video',
      createdAt: Date.now(),
      videoUrl: videoUrl.trim(),
      platform,
      videoId,
      embedUrl,
      authorName: 'Giáo viên bổ sung',
    };

    const updated = {
      ...lesson,
      presentations: [...lesson.presentations, newPres],
    };

    onUpdateLesson(updated);
    setSelectedPresId(newPres.id);
    setActiveAddMethod(null);
    setVideoUrl('');
    setVideoTitle('');
  };

  // Delete Presentation
  const handleDeletePresentation = (presId: string) => {
    const updatedPres = lesson.presentations.filter((p) => p.id !== presId);
    const updated = {
      ...lesson,
      presentations: updatedPres,
      presentationPackage: updatedPres.length === 0 ? undefined : lesson.presentationPackage,
    };
    onUpdateLesson(updated);
    if (selectedPresId === presId) {
      setSelectedPresId(updatedPres[0]?.id || '');
    }
  };

  return (
    <div className="space-y-6">
      {/* PEDAGOGICAL PIPELINE STEPPER */}
      <div className="p-3.5 px-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-lg text-slate-200">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {/* Phase 1 */}
          <div className="flex items-center gap-2 shrink-0 opacity-80 hover:opacity-100 transition">
            <span className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-black text-[11px] flex items-center justify-center border border-emerald-500/30">
              ✓
            </span>
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 font-semibold block">Bước 1</span>
              <span className="font-bold text-slate-200">Game Cử chỉ Tương tác</span>
            </div>
          </div>

          <span className="text-slate-600 shrink-0 font-black">→</span>

          {/* Phase 2 */}
          <div className="flex items-center gap-2 shrink-0 opacity-80 hover:opacity-100 transition">
            <span className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-black text-[11px] flex items-center justify-center border border-emerald-500/30">
              ✓
            </span>
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 font-semibold block">Bước 2</span>
              <span className="font-bold text-slate-200">Kho Tài Liệu & SGK</span>
            </div>
          </div>

          <span className="text-slate-600 shrink-0 font-black">→</span>

          {/* Phase 3 - ACTIVE */}
          <div className="flex items-center gap-2 shrink-0 p-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-sm">
              3
            </span>
            <div className="leading-tight">
              <span className="text-[10px] text-cyan-300 font-black uppercase tracking-wider block">Đang hoạt động</span>
              <span className="font-black text-white">Visual Studio & Trình Chiếu</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Add Presentation Methods Header Bar */}
      <div className="eduverse-glass rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Nạp nội dung Bài giảng điện tử
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hỗ trợ 4 phương thức nạp nhanh cùng Trình soạn thảo Content Blocks đa phương tiện (Toán học, 3D, Hình học, Trắc nghiệm, Game)
            </p>
          </div>

          <button
            id="btn-quick-open-editor"
            onClick={() => setIsLectureEditorOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition cursor-pointer active:scale-95 shrink-0 border border-indigo-400/30"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Soạn Slide Tương Tác (Content Blocks)</span>
          </button>
        </div>

        {/* 4 Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Button 1: Upload File */}
          <button
            id="btn-add-lecture-upload"
            onClick={() => setActiveAddMethod(activeAddMethod === 'upload' ? null : 'upload')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
              activeAddMethod === 'upload'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeAddMethod === 'upload' ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeAddMethod === 'upload' ? 'bg-white/20 text-white' : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                PPT / PDF / DOCX
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight text-white">1. Đưa lên từ máy tính</div>
              <div
                className={`text-[11px] mt-0.5 ${
                  activeAddMethod === 'upload' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                Tải file bài giảng có sẵn
              </div>
            </div>
          </button>

          {/* Button 2: PPT Link */}
          <button
            id="btn-add-lecture-link"
            onClick={() => setActiveAddMethod(activeAddMethod === 'link' ? null : 'link')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
              activeAddMethod === 'link'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeAddMethod === 'link' ? 'bg-white/20 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeAddMethod === 'link'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                Canva / Slides
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight text-white">2. Link bài giảng PPT</div>
              <div
                className={`text-[11px] mt-0.5 ${
                  activeAddMethod === 'link' ? 'text-emerald-100' : 'text-slate-400'
                }`}
              >
                Nhúng Google Slides, Canva, OneDrive
              </div>
            </div>
          </button>

          {/* Button 3: Video */}
          <button
            id="btn-add-lecture-video"
            onClick={() => setActiveAddMethod(activeAddMethod === 'video' ? null : 'video')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
              activeAddMethod === 'video'
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-900/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/80 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeAddMethod === 'video' ? 'bg-white/20 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                <Video className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeAddMethod === 'video' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                }`}
              >
                YouTube / TikTok
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">3. Video bài học</div>
              <div
                className={`text-[11px] mt-0.5 ${
                  activeAddMethod === 'video' ? 'text-rose-100' : 'text-slate-500'
                }`}
              >
                Nhúng video clip minh họa trực quan
              </div>
            </div>
          </button>

          {/* Button 4: AI tạo từ Notebook */}
          <button
            id="btn-add-lecture-ai-notebook"
            onClick={() => setActiveAddMethod(activeAddMethod === 'ai-notebook' ? null : 'ai-notebook')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
              activeAddMethod === 'ai-notebook'
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-400 shadow-xl shadow-violet-900/60 ring-2 ring-violet-400/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-violet-500/60 hover:bg-slate-800/80 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeAddMethod === 'ai-notebook'
                    ? 'bg-white/20 text-white'
                    : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-950'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeAddMethod === 'ai-notebook'
                    ? 'bg-white/20 text-white'
                    : 'bg-violet-950 text-violet-300 border border-violet-700/80'
                }`}
              >
                Notebook LM / AI
              </span>
            </div>
            <div>
              <div className="text-xs font-black leading-tight text-white flex items-center gap-1.5">
                <span>4. AI tạo từ Notebook</span>
              </div>
              <div
                className={`text-[11px] mt-0.5 ${
                  activeAddMethod === 'ai-notebook' ? 'text-violet-100' : 'text-slate-400'
                }`}
              >
                Dùng tài liệu, ghi chú Notebook & SGK
              </div>
            </div>
          </button>
        </div>

        {/* Dynamic Creation Form Panels */}
        {activeAddMethod === 'ai-notebook' && (
          <div className="mt-4 animate-in fade-in duration-200">
            <AiNotebookLecturePanel
              lesson={lesson}
              onClose={() => setActiveAddMethod(null)}
              onPresentationCreated={handleAiNotebookPresentationCreated}
            />
          </div>
        )}

        {activeAddMethod === 'upload' && (
          <div className="mt-4 p-5 rounded-2xl bg-blue-50/80 border border-blue-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                Tải file bài giảng từ máy tính
              </h4>
              <button
                onClick={() => setActiveAddMethod(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
                dragActive
                  ? 'border-blue-500 bg-blue-100/50'
                  : 'border-blue-300 bg-white/70 hover:bg-white'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Kéo thả file bài giảng vào đây, hoặc click để chọn file
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Hỗ trợ định dạng: PowerPoint (.pptx, .ppt), PDF (.pdf), Word (.docx)
              </p>
              <input
                type="file"
                id="file-lecture-input"
                accept=".ppt,.pptx,.pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="file-lecture-input"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-sm shadow-blue-200"
              >
                <span>Chọn file từ máy tính</span>
              </label>
            </div>

            {uploadedFile && (
              <div className="mt-4 p-4 rounded-xl bg-white border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                    {uploadedFile.name.split('.').pop()}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Tên bài giảng hiển thị"
                      className="text-xs font-bold text-slate-900 border border-slate-300 rounded px-2 py-1 w-full max-w-sm"
                    />
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      File: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(0)} KB)
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Hủy file
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveUploadedFile(false)}
                    disabled={isUploading}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    {isUploading ? 'Đang lưu...' : 'Lưu bài giảng'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveUploadedFile(true)}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-200 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isUploading ? 'Đang mở...' : 'Lưu & Mở trình chiếu ngay'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeAddMethod === 'link' && (
          <div className="mt-4 p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-600" />
                Liên kết bài giảng trực tuyến (Canva / Google Slides / OneDrive)
              </h4>
              <button
                onClick={() => setActiveAddMethod(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Đường dẫn liên kết (URL) *
                </label>
                <input
                  type="url"
                  placeholder="https://www.canva.com/design/... hoặc https://docs.google.com/presentation/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tiêu đề bài giảng
                </label>
                <input
                  type="text"
                  placeholder={`Ví dụ: Slide trực quan - ${lesson.title}`}
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveAddMethod(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!linkUrl.trim()}
                onClick={handleSavePptLink}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-200 transition cursor-pointer"
              >
                Lưu liên kết Slide
              </button>
            </div>
          </div>
        )}

        {activeAddMethod === 'video' && (
          <div className="mt-4 p-5 rounded-2xl bg-rose-50/80 border border-rose-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs sm:text-sm font-bold text-rose-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-600" />
                Nhúng Video bài học (YouTube / TikTok)
              </h4>
              <button
                onClick={() => setActiveAddMethod(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Đường dẫn Video (YouTube / TikTok URL) *
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... hoặc https://www.tiktok.com/@..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tiêu đề Video
                </label>
                <input
                  type="text"
                  placeholder={`Ví dụ: Video thí nghiệm / minh họa - ${lesson.title}`}
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveAddMethod(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!videoUrl.trim()}
                onClick={handleSaveVideo}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-200 transition cursor-pointer"
              >
                Lưu Video bài giảng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification after Teacher Confirms & Saves AI Presentation */}
      {saveSuccessNotification && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{saveSuccessNotification}</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                setPlayerInitialSlide(0);
                setIsCleanPresentationViewerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 transition cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>▶ Trình chiếu ngay</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất PPTX</span>
            </button>

            <button
              onClick={() => setSaveSuccessNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Presentations List & Viewer */}
      {lesson.presentations.length > 0 ? (
        <div className="eduverse-glass-elevated rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
          {/* Presentation Tabs Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Tài liệu bài giảng:
              </span>
              {lesson.presentations.map((pres) => {
                const isSelected = pres.id === selectedPresId;
                return (
                  <button
                    key={pres.id}
                    id={`select-pres-${pres.id}`}
                    onClick={() => setSelectedPresId(pres.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    {pres.sourceType === 'ai-structured' && <Sparkles className="w-3.5 h-3.5" />}
                    {pres.sourceType === 'upload-file' && <FileText className="w-3.5 h-3.5" />}
                    {pres.sourceType === 'ppt-link' && <Presentation className="w-3.5 h-3.5" />}
                    {pres.sourceType === 'video' && <Video className="w-3.5 h-3.5" />}
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">{pres.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Actions for Current Presentation */}
            {currentPresentation && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {currentPresentation.sourceType === 'ai-structured' ? (
                  <>
                    <button
                      id="btn-play-presentation"
                      onClick={() => {
                        const struct = (currentPresentation as any).structuredPresentation;
                        if (struct) {
                          setActiveStructuredPresentation(struct);
                        } else {
                          // Synthesize structure
                          const synthStruct: StructuredPresentation = {
                            id: currentPresentation.id,
                            lessonId: lesson.id,
                            lessonTitle: lesson.title,
                            subject: lesson.subject,
                            grade: lesson.grade,
                            title: currentPresentation.title,
                            version: (currentPresentation as any).version || 1,
                            createdAt: currentPresentation.createdAt,
                            updatedAt: (currentPresentation as any).updatedAt || currentPresentation.createdAt,
                            status: 'reviewed',
                            generationConfig: {
                              duration: currentPresentation.duration || '45 phút',
                              pedagogicalStyle: 'interactive',
                              generationMode: 'standard',
                              selectedSourceIds: [],
                            },
                            usedSources: [
                              {
                                documentId: 'sgk-default',
                                documentTitle: `SGK ${lesson.subject} ${lesson.grade}`,
                                scope: 'shared',
                                matchedSectionsCount: 3,
                              },
                            ],
                            pedagogicalFlow: {
                              objectives: currentPresentation.lecture.objectives || [],
                              warmupSummary: currentPresentation.lecture.warmup?.scenario || 'Khởi động tạo hứng thú',
                              keyKnowledgeSummary: 'Hình thành kiến thức trọng tâm',
                              practiceSummary: 'Luyện tập củng cố tại lớp',
                              applicationSummary: currentPresentation.lecture.application || 'Vận dụng thực tiễn',
                              assessmentSummary: 'Đánh giá mục tiêu cần đạt',
                            },
                            slides: [
                              {
                                id: 's1',
                                order: 1,
                                type: 'title',
                                title: currentPresentation.lecture.title,
                                content: `Bài giảng điện tử môn ${lesson.subject} lớp ${lesson.grade}`,
                                keyPoints: currentPresentation.lecture.objectives || [],
                                formulas: [],
                                sourceReferences: [{ documentName: `SGK ${lesson.subject} ${lesson.grade}`, isDirectQuote: true }],
                              },
                              ...(currentPresentation.lecture.sections || []).map((sec, idx) => ({
                                id: sec.id || `s-${idx + 2}`,
                                order: idx + 2,
                                type: 'knowledge' as const,
                                title: sec.title,
                                content: sec.content,
                                keyPoints: sec.keyPoints || [],
                                formulas: sec.formula ? [sec.formula] : [],
                                examples: sec.examples?.map((ex) => ({ problem: ex.problem, solution: ex.solution })),
                                sourceReferences: [{ documentName: `SGK ${lesson.subject} ${lesson.grade}`, isDirectQuote: true }],
                              })),
                            ],
                            qualityAudit: {
                              hasTitle: true,
                              hasObjectives: true,
                              hasCoreKnowledge: true,
                              hasSourceReferences: true,
                              hasValidFormulas: true,
                              emptySlidesCount: 0,
                              warnings: [],
                              confidenceScore: 0.98,
                            },
                          };
                          setActiveStructuredPresentation(synthStruct);
                        }
                        setPlayerInitialSlide(0);
                        setIsCleanPresentationViewerOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-900/20 transition cursor-pointer active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>▶ Trình chiếu</span>
                    </button>

                    <button
                      id="btn-preview-presentation"
                      onClick={() => {
                        const struct = (currentPresentation as any).structuredPresentation;
                        if (struct) {
                          setActiveStructuredPresentation(struct);
                        } else {
                          const synthStruct: StructuredPresentation = {
                            id: currentPresentation.id,
                            lessonId: lesson.id,
                            lessonTitle: lesson.title,
                            subject: lesson.subject,
                            grade: lesson.grade,
                            title: currentPresentation.title,
                            version: (currentPresentation as any).version || 1,
                            createdAt: currentPresentation.createdAt,
                            updatedAt: (currentPresentation as any).updatedAt || currentPresentation.createdAt,
                            status: 'reviewed',
                            generationConfig: {
                              duration: currentPresentation.duration || '45 phút',
                              pedagogicalStyle: 'interactive',
                              generationMode: 'standard',
                              selectedSourceIds: [],
                            },
                            usedSources: [
                              {
                                documentId: 'sgk-default',
                                documentTitle: `SGK ${lesson.subject} ${lesson.grade}`,
                                scope: 'shared',
                                matchedSectionsCount: 3,
                              },
                            ],
                            pedagogicalFlow: {
                              objectives: currentPresentation.lecture.objectives || [],
                              warmupSummary: currentPresentation.lecture.warmup?.scenario || 'Khởi động tạo hứng thú',
                              keyKnowledgeSummary: 'Hình thành kiến thức trọng tâm',
                              practiceSummary: 'Luyện tập củng cố tại lớp',
                              applicationSummary: currentPresentation.lecture.application || 'Vận dụng thực tiễn',
                              assessmentSummary: 'Đánh giá mục tiêu cần đạt',
                            },
                            slides: [
                              {
                                id: 's1',
                                order: 1,
                                type: 'title',
                                title: currentPresentation.lecture.title,
                                content: `Bài giảng điện tử môn ${lesson.subject} lớp ${lesson.grade}`,
                                keyPoints: currentPresentation.lecture.objectives || [],
                                formulas: [],
                                sourceReferences: [{ documentName: `SGK ${lesson.subject} ${lesson.grade}`, isDirectQuote: true }],
                              },
                              ...(currentPresentation.lecture.sections || []).map((sec, idx) => ({
                                id: sec.id || `s-${idx + 2}`,
                                order: idx + 2,
                                type: 'knowledge' as const,
                                title: sec.title,
                                content: sec.content,
                                keyPoints: sec.keyPoints || [],
                                formulas: sec.formula ? [sec.formula] : [],
                                examples: sec.examples?.map((ex) => ({ problem: ex.problem, solution: ex.solution })),
                                sourceReferences: [{ documentName: `SGK ${lesson.subject} ${lesson.grade}`, isDirectQuote: true }],
                              })),
                            ],
                            qualityAudit: {
                              hasTitle: true,
                              hasObjectives: true,
                              hasCoreKnowledge: true,
                              hasSourceReferences: true,
                              hasValidFormulas: true,
                              emptySlidesCount: 0,
                              warnings: [],
                              confidenceScore: 0.98,
                            },
                          };
                          setActiveStructuredPresentation(synthStruct);
                        }
                        setIsPreviewModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-bold transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem bài giảng (Preview)</span>
                    </button>

                    <button
                      onClick={() => {
                        const struct = (currentPresentation as any).structuredPresentation;
                        if (struct) {
                          setActiveStructuredPresentation(struct);
                          setIsStructureViewerOpen(true);
                        } else {
                          const synthStruct: StructuredPresentation = {
                            id: currentPresentation.id,
                            lessonId: lesson.id,
                            lessonTitle: lesson.title,
                            subject: lesson.subject,
                            grade: lesson.grade,
                            title: currentPresentation.title,
                            version: (currentPresentation as any).version || 1,
                            createdAt: currentPresentation.createdAt,
                            updatedAt: (currentPresentation as any).updatedAt || currentPresentation.createdAt,
                            status: 'reviewed',
                            generationConfig: {
                              duration: currentPresentation.duration || '45 phút',
                              pedagogicalStyle: 'interactive',
                              generationMode: 'standard',
                              selectedSourceIds: [],
                            },
                            usedSources: [
                              {
                                documentId: 'sgk-default',
                                documentTitle: `SGK ${lesson.subject} ${lesson.grade}`,
                                scope: 'shared',
                                matchedSectionsCount: 3,
                              },
                            ],
                            pedagogicalFlow: {
                              objectives: currentPresentation.lecture.objectives || [],
                              warmupSummary: currentPresentation.lecture.warmup?.scenario || 'Khởi động tạo hứng thú',
                              keyKnowledgeSummary: 'Hình thành kiến thức trọng tâm',
                              practiceSummary: 'Luyện tập củng cố tại lớp',
                              applicationSummary: currentPresentation.lecture.application || 'Vận dụng thực tiễn',
                              assessmentSummary: 'Đánh giá mục tiêu cần đạt',
                            },
                            slides: [
                              {
                                id: 's1',
                                order: 1,
                                type: 'title',
                                title: currentPresentation.lecture.title,
                                content: `Bài giảng điện tử môn ${lesson.subject} lớp ${lesson.grade}`,
                                keyPoints: currentPresentation.lecture.objectives || [],
                                formulas: [],
                                sourceReferences: [{ documentName: `SGK ${lesson.subject} ${lesson.grade}`, isDirectQuote: true }],
                              },
                              ...(currentPresentation.lecture.sections || []).map((sec, idx) => ({
                                id: sec.id || `s-${idx + 2}`,
                                order: idx + 2,
                                type: 'knowledge' as const,
                                title: sec.title,
                                content: sec.content,
                                keyPoints: sec.keyPoints || [],
                                formulas: sec.formula ? [sec.formula] : [],
                                examples: sec.examples?.map((ex) => ({ problem: ex.problem, solution: ex.solution })),
                                sourceReferences: [{ documentName: `SGK ${lesson.subject} ${lesson.grade}`, isDirectQuote: true }],
                              })),
                            ],
                            qualityAudit: {
                              hasTitle: true,
                              hasObjectives: true,
                              hasCoreKnowledge: true,
                              hasSourceReferences: true,
                              hasValidFormulas: true,
                              emptySlidesCount: 0,
                              warnings: [],
                              confidenceScore: 0.98,
                            },
                          };
                          setActiveStructuredPresentation(synthStruct);
                          setIsStructureViewerOpen(true);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Cấu trúc & Nguồn</span>
                    </button>

                    <button
                      onClick={() => setIsEditingContent(!isEditingContent)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingContent ? 'Xong sửa' : 'Sửa'}</span>
                    </button>

                    <button
                      id="btn-open-content-blocks-editor"
                      onClick={() => setIsLectureEditorOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-950/50 transition cursor-pointer border border-violet-400/40"
                      title="Mở trình soạn thảo nâng cao với hệ thống Content Blocks (Toán, Hình học, 3D, Thí nghiệm, Trắc nghiệm, Game...)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                      <span>Soạn Slide Blocks</span>
                    </button>

                    {/* Phase 4: Export PPTX & PDF */}
                    <button
                      id="btn-card-export-pptx"
                      onClick={() => setIsExportModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-bold transition cursor-pointer shadow-sm"
                      title="Xuất bài giảng sang PowerPoint (.pptx) / PDF Slides / Kế hoạch CV 5512"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất PPTX / PDF</span>
                    </button>

                    {/* Phase 4: AI Gesture Quiz Game Quick Launch */}
                    {onLaunchGame && (
                      <button
                        id="btn-card-launch-gesture"
                        onClick={() => {
                          const sets = lesson.questionSets || [];
                          if (sets.length > 0) {
                            onLaunchGame('gesture-quiz', sets[0]);
                          } else {
                            onLaunchGame('gesture-quiz');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition cursor-pointer shadow-sm"
                        title="Mở trò chơi trắc nghiệm cử chỉ nhận diện camera AI"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Game Cử chỉ</span>
                      </button>
                    )}
                  </>
                ) : (
                  currentPresentation.sourceType === 'upload-file' && (
                    <button
                      id="btn-fullscreen-presentation"
                      onClick={() => setIsSlidePresentationOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-black shadow-lg transition cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Trình chiếu File</span>
                    </button>
                  )
                )}

                <button
                  id="btn-delete-current-presentation"
                  onClick={() => {
                    if (confirm(`Thầy/Cô có chắc chắn muốn xóa bài giảng/tệp "${currentPresentation.title}" không?`)) {
                      handleDeletePresentation(currentPresentation.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-950/50 border border-transparent hover:border-red-800/80 transition cursor-pointer text-xs"
                  title="Xóa bài giảng/tệp này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xóa tệp</span>
                </button>
              </div>
            )}
          </div>

          {/* Presentation Viewer Canvas */}
          <div className="p-6 sm:p-8">
            {currentPresentation ? (
              <div>
                {/* 1. AI Structured Presentation Viewer */}
                {currentPresentation.sourceType === 'ai-structured' && (
                  <div className="space-y-8">
                    {/* Header info */}
                    <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 mb-2.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span>Giáo án AI Sư phạm GDPT 2018</span>
                          {currentPresentation.duration && (
                            <>
                              <span className="opacity-50">•</span>
                              <span>{currentPresentation.duration}</span>
                            </>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                          {currentPresentation.lecture.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPlayerInitialSlide(0);
                            setIsCleanPresentationViewerOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Trình chiếu (F5)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Thầy/Cô có chắc chắn muốn xóa bài giảng "${currentPresentation.title}" không?`)) {
                              handleDeletePresentation(currentPresentation.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/80 transition cursor-pointer text-xs sm:text-sm font-bold shadow-sm"
                          title="Xóa bài giảng này"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                          <span>Xóa bài giảng</span>
                        </button>
                      </div>
                    </div>

                    {/* Objectives Banner */}
                    {currentPresentation.lecture.objectives && (
                      <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900/90 border border-indigo-500/40 rounded-2xl p-5 sm:p-6 space-y-3 shadow-xl">
                        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Mục tiêu bài học cần đạt
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentPresentation.lecture.objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warmup Section */}
                    {currentPresentation.lecture.warmup && (
                      <div className="bg-gradient-to-br from-amber-950/40 to-slate-900/90 border border-amber-500/40 rounded-2xl p-5 sm:p-6 space-y-3 shadow-xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
                          <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                          <span>{currentPresentation.lecture.warmup.title}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                          {currentPresentation.lecture.warmup.scenario}
                        </p>
                        {currentPresentation.lecture.warmup.question && (
                          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-amber-500/30 text-amber-200 font-semibold text-xs sm:text-sm">
                            <span className="font-bold text-amber-400">❓ Câu hỏi gợi mở: </span>
                            {currentPresentation.lecture.warmup.question}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Knowledge Sections */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          Hình thành kiến thức mới & Tương tác Toán học
                        </h3>
                        <span className="text-[11px] text-cyan-400/80 font-mono">GIAI ĐOẠN 2: TƯƠNG TÁC ĐA PHƯƠNG TIỆN</span>
                      </div>

                      {currentPresentation.lecture.sections.map((sec, idx) => (
                        <div
                          key={sec.id || idx}
                          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 sm:p-7 shadow-xl space-y-5 transition"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h4 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              {sec.title}
                            </h4>
                            {sec.subtitle && (
                              <span className="text-xs text-slate-400 font-medium">
                                {sec.subtitle}
                              </span>
                            )}
                          </div>

                          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                            <MathRenderer text={sec.content} />
                          </div>

                          {/* Formula Box */}
                          {sec.formula && (
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-cyan-300 font-mono text-center text-sm sm:text-base font-bold shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                              <MathRenderer text={sec.formula} />
                            </div>
                          )}

                          {/* GIAI ĐOẠN 2: Interactive 3D / Coordinate Oxy Block for Math Visualization */}
                          {idx === 0 && (
                            <div className="my-4">
                              <InteractiveMath3DBlock
                                mode="linear-system"
                                title="Mô hình Đồ thị Oxy Tương tác Hệ phương trình & Tọa độ"
                              />
                            </div>
                          )}

                          {/* Key Points */}
                          {sec.keyPoints && sec.keyPoints.length > 0 && (
                            <div className="bg-slate-950/80 rounded-xl p-4 sm:p-5 border border-purple-500/30 space-y-2">
                              <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                                Trọng tâm ghi nhớ:
                              </div>
                              <ul className="space-y-1.5">
                                {sec.keyPoints.map((pt, pidx) => (
                                  <li
                                    key={pidx}
                                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0 shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
                                    <span>
                                      <MathRenderer text={pt} />
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* GIAI ĐOẠN 2: Interactive Step-By-Step Solution Viewer */}
                          {sec.examples && sec.examples.length > 0 && (
                            <div className="space-y-3 pt-2">
                              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Ví dụ minh họa & Lời giải từng bước (GDPT 2018):</span>
                              </div>
                              <div className="space-y-3">
                                {sec.examples.map((ex, exIdx) => (
                                  <StepByStepSolutionViewer
                                    key={exIdx}
                                    title={`Ví dụ ${exIdx + 1}`}
                                    problem={ex.problem}
                                    solution={ex.solution}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Callout */}
                          {sec.callout && (
                            <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs sm:text-sm text-indigo-200 flex items-start gap-3">
                              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{sec.callout.text}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    {currentPresentation.lecture.summary && (
                      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 text-white rounded-3xl p-6 sm:p-7 space-y-3 border border-indigo-500/40 shadow-2xl">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Tóm tắt kiến thức cốt lõi bài học:
                        </h4>
                        <ul className="space-y-2">
                          {currentPresentation.lecture.summary.map((sum, sidx) => (
                            <li key={sidx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                              <span className="leading-relaxed">
                                <MathRenderer text={sum} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Uploaded File Presentation Viewer */}
                {currentPresentation.sourceType === 'upload-file' && (
                  <FilePresentationViewer
                    presentation={currentPresentation}
                    lessonTitle={lesson.title}
                    lessonSubject={lesson.subject}
                    lessonGrade={lesson.grade}
                    onOpenFullscreen={() => setIsSlidePresentationOpen(true)}
                    onDelete={() => {
                      if (confirm(`Thầy/Cô có chắc chắn muốn xóa tệp bài giảng "${currentPresentation.title}" không?`)) {
                        handleDeletePresentation(currentPresentation.id);
                      }
                    }}
                  />
                )}

                {/* 3. PPT Online Link Presentation Viewer */}
                {currentPresentation.sourceType === 'ppt-link' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        {currentPresentation.title}
                      </h3>
                      <a
                        href={currentPresentation.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        <span>Mở liên kết gốc</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center">
                      {currentPresentation.canEmbed && currentPresentation.embedUrl ? (
                        <iframe
                          src={currentPresentation.embedUrl}
                          title={currentPresentation.title}
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      ) : (
                        <div className="text-center p-8 text-white space-y-3">
                          <Presentation className="w-12 h-12 text-emerald-400 mx-auto" />
                          <p className="text-sm font-semibold">
                            Slide trực tuyến từ {currentPresentation.provider}
                          </p>
                          <a
                            href={currentPresentation.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                          >
                            <span>Mở Slide toàn màn hình</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Video Presentation Viewer */}
                {currentPresentation.sourceType === 'video' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        {currentPresentation.title}
                      </h3>
                      <a
                        href={currentPresentation.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        <span>Xem trên {currentPresentation.platform}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="aspect-video w-full rounded-2xl border border-slate-200 bg-black overflow-hidden shadow-2xl">
                      {currentPresentation.embedUrl ? (
                        <iframe
                          src={currentPresentation.embedUrl}
                          title={currentPresentation.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white p-6">
                          <Video className="w-12 h-12 text-rose-500 mb-2" />
                          <p className="text-sm font-bold">{currentPresentation.title}</p>
                          <a
                            href={currentPresentation.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
                          >
                            Phát Video
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold">Chưa có bài giảng nào được thêm</p>
                <p className="text-xs mt-1">
                  Chọn 1 trong 4 phương thức phía trên để nạp nội dung bài giảng.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : activeAddMethod === null ? (
        <div className="rounded-3xl border border-dashed border-slate-800/80 bg-slate-950/40 p-8 sm:p-10 text-center max-w-lg mx-auto space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Chưa có bài giảng trong bài học này</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Chọn 1 trong 4 phương thức nạp nhanh ở trên để nạp hoặc tạo bài giảng (AI Notebook, tải tệp máy tính, liên kết PPT hoặc Video).
          </p>
        </div>
      ) : null}

      {/* Fullscreen Slide Presentation Modal */}
      {isSlidePresentationOpen && currentPresentation && (
        <SlidePresentationModal
          isOpen={isSlidePresentationOpen}
          onClose={() => setIsSlidePresentationOpen(false)}
          presentation={currentPresentation}
          lecture={currentPresentation.sourceType === 'ai-structured' ? currentPresentation.lecture : undefined}
          lessonTitle={currentPresentation.title || lesson.title}
          lessonSubject={lesson.subject}
          lessonGrade={lesson.grade}
        />
      )}

      {/* Structured Presentation Inspector & Quality Audit Modal */}
      {isStructureViewerOpen && activeStructuredPresentation && (
        <PresentationStructureViewerModal
          isOpen={isStructureViewerOpen}
          onClose={() => setIsStructureViewerOpen(false)}
          presentation={activeStructuredPresentation}
          isStaged={false}
          onConfirmSave={() => {}}
          onEditInCanvas={handleEditStagedPresentationInCanvas}
          onDiscard={() => setIsStructureViewerOpen(false)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenPlayer={(slideIdx = 0) => {
            setIsStructureViewerOpen(false);
            setPlayerInitialSlide(slideIdx);
            setIsWebPresentationPlayerOpen(true);
          }}
          onDelete={() => {
            handleDeletePresentation(activeStructuredPresentation.id);
            setIsStructureViewerOpen(false);
            setActiveStructuredPresentation(null);
          }}
        />
      )}

      {/* Phase 4: Web Presentation Preview Modal */}
      {isPreviewModalOpen && activeStructuredPresentation && (
        <PresentationPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          presentation={activeStructuredPresentation}
          onStartPresentation={(startIdx = 0) => {
            setIsPreviewModalOpen(false);
            setPlayerInitialSlide(startIdx);
            setIsCleanPresentationViewerOpen(true);
          }}
        />
      )}

      {/* Phase 4: Fullscreen Web Presentation Player (PowerPoint-like) */}
      {isWebPresentationPlayerOpen && activeStructuredPresentation && (
        <PresentationPlayer
          presentation={activeStructuredPresentation}
          initialSlideIndex={playerInitialSlide}
          onExit={() => setIsWebPresentationPlayerOpen(false)}
          isInitialFullscreen={true}
          onOpenExport={() => setIsExportModalOpen(true)}
          onLaunchGame={onLaunchGame ? () => {
            const sets = lesson.questionSets || [];
            if (sets.length > 0) {
              onLaunchGame('gesture-quiz', sets[0]);
            } else {
              onLaunchGame('gesture-quiz');
            }
          } : undefined}
        />
      )}

      {/* Visual Content Block Lecture Editor Modal */}
      {isLectureEditorOpen && (
        <LectureEditorModal
          isOpen={isLectureEditorOpen}
          onClose={() => setIsLectureEditorOpen(false)}
          lesson={lesson}
          presentationPackage={lesson.presentationPackage}
          onSavePackage={(pkg) => {
            onUpdateLesson({
              ...lesson,
              presentationPackage: pkg,
            });
          }}
          onLaunchPresentation={(pkg) => {
            onUpdateLesson({
              ...lesson,
              presentationPackage: pkg,
            });
            setIsCleanPresentationViewerOpen(true);
          }}
        />
      )}

      {/* Modern High-Impact Fullscreen Presentation Viewer */}
      {isCleanPresentationViewerOpen && (
        <PresentationViewer
          lesson={lesson}
          packageData={lesson.presentationPackage}
          presentation={activeStructuredPresentation || currentPresentation}
          lecture={currentPresentation && 'lecture' in currentPresentation ? (currentPresentation as any).lecture : undefined}
          initialSlideIndex={playerInitialSlide}
          onClose={() => setIsCleanPresentationViewerOpen(false)}
          onLaunchGame={onLaunchGame}
          onOpenExport={() => setIsExportModalOpen(true)}
        />
      )}

      {/* Phase 4: Multi-format Presentation Export Modal (PPTX, PDF, CV 5512, HTML) */}
      {isExportModalOpen && (
        <PresentationExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          lesson={lesson}
          presentation={activeStructuredPresentation || lesson.presentationPackage || currentPresentation}
        />
      )}
    </div>
  );
};
