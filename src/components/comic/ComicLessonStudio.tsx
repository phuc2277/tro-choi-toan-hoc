import React, { useState, useEffect, useRef } from 'react';
import {
  ComicLessonProject,
  LessonKnowledgeProfile,
  StoryKernel,
  CharacterProfile,
  ComicScene,
  ComicArtStyle,
} from '../../types/comicLesson';
import { DEFAULT_COMIC_PROJECT, SAMPLE_PHOTOSYNTHESIS_PROJECT, DEFAULT_CHARACTERS } from '../../data/defaultComicLessons';
import { DON_THUC_COMIC_PROJECT } from '../../data/donThucComicLesson';
import { useTeacherAuth } from './useTeacherAuth';
import {
  createCloudProject,
  saveProjectToCloud,
  listCloudProjects,
  loadProjectFromCloud,
  deleteCloudProject,
  addCollaborator,
  removeCollaborator,
  CloudProjectSummary,
} from './comicCloudStore';
import { Step1KnowledgeProfile } from './Step1KnowledgeProfile';
import { Step2StoryKernel } from './Step2StoryKernel';
import { Step3CharacterLibrary } from './Step3CharacterLibrary';
import { Step4ScriptEditor } from './Step4ScriptEditor';
import { Step5StoryboardReview } from './Step5StoryboardReview';
import { Step6ComicArtStudio } from './Step6ComicArtStudio';
import { Step7AudioDirector } from './Step7AudioDirector';
import { Step8VideoAndReader } from './Step8VideoAndReader';
import {
  Sparkles,
  BookOpen,
  Compass,
  Users,
  Film,
  CheckSquare,
  Mic,
  Video,
  ChevronRight,
  FolderOpen,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  Loader2,
  Share2,
  Trash2,
  X,
  UserPlus,
} from 'lucide-react';

// Thông tin bài học đang được chọn ở trang bài học (LessonPage truyền xuống)
export interface ComicLessonContext {
  subject: string;
  grade: string;
  chapter?: string;
  lessonTitle: string;
  sourceText?: string;
}

interface ComicLessonStudioProps {
  onBackToMain?: () => void;
  initialLessonContext?: ComicLessonContext;
}

const LEGACY_CACHE_KEY = 'cached_comic_lesson_project';
const LESSON_OPTION = '__current_lesson__';
const cacheKeyFor = (projectId: string) => `${LEGACY_CACHE_KEY}:${projectId}`;

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

// Mỗi bài học (môn + lớp + tên bài) có 1 id dự án riêng, ổn định giữa các lần mở
const makeLessonProjectId = (ctx: ComicLessonContext) =>
  `proj-lesson-${slugify(ctx.subject)}-${slugify(ctx.grade)}-${slugify(ctx.lessonTitle)}`;

const readCachedProject = (key: string): ComicLessonProject | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id ? parsed : null;
  } catch {
    return null;
  }
};

// Dự án mới cho đúng bài học đang chọn. Bài "Đơn thức" (Toán 8) dùng bộ mẫu có sẵn;
// các bài khác bắt đầu trống (chưa có cảnh) để AI sinh nội dung đúng bài đó.
const buildProjectForLesson = (ctx: ComicLessonContext): ComicLessonProject => {
  const id = makeLessonProjectId(ctx);
  const isDonThuc = ctx.lessonTitle.toLowerCase().includes('đơn thức') && /8/.test(ctx.grade);
  if (isDonThuc) {
    return { ...DON_THUC_COMIC_PROJECT, id };
  }
  const now = new Date().toISOString();
  return {
    id,
    title: `Video: ${ctx.lessonTitle}`,
    description: `Học ${ctx.lessonTitle} qua video AI sinh động.`,
    subject: ctx.subject,
    grade: ctx.grade,
    style: 'modern-comic',
    humorLevel: 'natural',
    currentStep: 1,
    knowledgeProfile: {
      subject: ctx.subject,
      grade: ctx.grade,
      chapter: ctx.chapter || '',
      lessonTitle: ctx.lessonTitle,
      objectives: [],
      coreKnowledge: [],
      concepts: [],
      formulas: [],
      examples: [],
      problemSolvingProcess: [],
      importantDiagrams: [],
      keyTerms: [],
      commonMisconceptions: [],
      teacherNotes: '',
    },
    storyKernel: {
      problemStatement: '',
      protagonistNames: [],
      goal: '',
      obstacles: '',
      knowledgeToDiscover: '',
      climax: '',
      resolution: '',
      knowledgeConclusion: '',
    },
    characters: DEFAULT_CHARACTERS,
    scenes: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const ComicLessonStudio: React.FC<ComicLessonStudioProps> = ({ onBackToMain, initialLessonContext }) => {
  const teacherAuth = useTeacherAuth();

  // Current active project
  const [project, setProject] = useState<ComicLessonProject>(() => {
    // Có bài học được chọn → mở bản nháp riêng của bài đó (hoặc tạo mới), KHÔNG dùng bản cũ của bài khác
    if (initialLessonContext) {
      return readCachedProject(cacheKeyFor(makeLessonProjectId(initialLessonContext))) || buildProjectForLesson(initialLessonContext);
    }
    return readCachedProject(LEGACY_CACHE_KEY) || DEFAULT_COMIC_PROJECT;
  });
  // Chỉ tự đồng bộ lên đám mây sau khi giáo viên thật sự chỉnh sửa (tránh tạo dự án trống cho mỗi bài vừa mở)
  const hasEditedRef = useRef(false);

  // Current active step: 1 through 8
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Cloud sync state
  const [cloudProjects, setCloudProjects] = useState<CloudProjectSummary[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [shareBusy, setShareBusy] = useState(false);
  const saveTimerRef = useRef<any>(null);

  // Thông tin đồng bộ của dự án đang mở (nếu đã có trên đám mây): tôi có phải chủ sở hữu không,
  // và danh sách đồng nghiệp đang được chia sẻ cùng.
  const currentCloudSummary = cloudProjects.find((p) => p.id === project.id);
  const isRegisteredInCloud = !!currentCloudSummary;
  const isOwner = !currentCloudSummary || currentCloudSummary.isOwner;

  // Nạp danh sách dự án đám mây (của tôi + được chia sẻ cho tôi) khi giáo viên đăng nhập
  const refreshCloudProjects = async () => {
    if (!teacherAuth.user) return;
    try {
      const list = await listCloudProjects(teacherAuth.user.uid, teacherAuth.user.email);
      setCloudProjects(list);
    } catch {
      // im lặng — không chặn UI nếu load danh sách lỗi
    }
  };

  useEffect(() => {
    if (!teacherAuth.user) {
      setCloudProjects([]);
      return;
    }
    refreshCloudProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherAuth.user]);

  // Tự động lưu lên Firestore mỗi khi dự án thay đổi (debounce 2.5s), nếu đã đăng nhập.
  // Nếu dự án CHƯA từng tồn tại trên đám mây → tạo mới (gán quyền sở hữu cho tôi).
  // Nếu ĐÃ tồn tại → chỉ cập nhật nội dung, không đụng tới ownerUid/collaboratorEmails.
  useEffect(() => {
    if (!teacherAuth.user || !hasEditedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        if (isRegisteredInCloud) {
          await saveProjectToCloud(project);
        } else {
          await createCloudProject(teacherAuth.user!.uid, teacherAuth.user!.email, teacherAuth.user!.displayName, project);
          await refreshCloudProjects();
        }
        setSyncStatus('saved');
        setSyncError(null);
      } catch (err: any) {
        setSyncStatus('error');
        setSyncError(err.message || 'Lỗi đồng bộ lên đám mây.');
      }
    }, 2500);
    return () => clearTimeout(saveTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, teacherAuth.user]);

  // Sync with localStorage
  const saveProject = (updated: ComicLessonProject) => {
    hasEditedRef.current = true;
    setProject(updated);
    try {
      localStorage.setItem(cacheKeyFor(updated.id), JSON.stringify(updated));
      if (!initialLessonContext) localStorage.setItem(LEGACY_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to cache comic project:', e);
    }
  };

  // Step 1: Update Knowledge Profile
  const handleUpdateKnowledgeProfile = (updatedProfile: LessonKnowledgeProfile) => {
    saveProject({
      ...project,
      knowledgeProfile: updatedProfile,
      title: `Video: ${updatedProfile.lessonTitle}`,
      description: `Học bài học ${updatedProfile.lessonTitle} qua video AI sinh động.`,
    });
  };

  // Step 2: Update Story Kernel
  const handleUpdateStoryKernel = (updatedKernel: StoryKernel) => {
    saveProject({
      ...project,
      storyKernel: updatedKernel,
    });
  };

  // Step 3: Update Characters
  const handleUpdateCharacters = (updatedCharacters: CharacterProfile[]) => {
    saveProject({
      ...project,
      characters: updatedCharacters,
    });
  };

  // Step 4 & 5: Update Scenes & Storyboard
  const handleUpdateScenes = (updatedScenes: ComicScene[]) => {
    saveProject({
      ...project,
      scenes: updatedScenes,
    });
  };

  // Step 6: Update Art Style
  const handleUpdateArtStyle = (updatedStyle: ComicArtStyle) => {
    saveProject({
      ...project,
      style: updatedStyle,
      artStyle: updatedStyle,
    });
  };

  // Switch between built-in sample projects
  const handleSwitchProject = (projId: string) => {
    if (projId === LESSON_OPTION && initialLessonContext) {
      saveProject(readCachedProject(cacheKeyFor(makeLessonProjectId(initialLessonContext))) || buildProjectForLesson(initialLessonContext));
    } else if (projId === 'proj-thales-math8') {
      saveProject(DEFAULT_COMIC_PROJECT);
    } else if (projId === 'proj-photosynthesis-science7') {
      saveProject(SAMPLE_PHOTOSYNTHESIS_PROJECT);
    }
    setCurrentStep(1);
  };

  // Lưu thủ công dự án hiện tại lên đám mây ngay lập tức (không chờ debounce)
  const handleSaveToCloudNow = async () => {
    if (!teacherAuth.user) return;
    setSyncStatus('saving');
    try {
      if (isRegisteredInCloud) {
        await saveProjectToCloud(project);
      } else {
        await createCloudProject(teacherAuth.user.uid, teacherAuth.user.email, teacherAuth.user.displayName, project);
      }
      await refreshCloudProjects();
      setSyncStatus('saved');
      setSyncError(null);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || 'Lỗi lưu lên đám mây.');
    }
  };

  // Mở một dự án đã lưu trên đám mây (của tôi hoặc được chia sẻ), thay thế dự án đang chỉnh sửa
  const handleOpenCloudProject = async (projectId: string) => {
    if (!teacherAuth.user) return;
    try {
      const loaded = await loadProjectFromCloud(projectId);
      if (loaded) {
        saveProject(loaded);
        setCurrentStep(1);
      }
    } catch (err: any) {
      setSyncError(err.message || 'Không thể mở dự án từ đám mây.');
    } finally {
      setShowProjectPicker(false);
    }
  };

  // Xoá dự án khỏi đám mây (chỉ chủ sở hữu mới thấy được nút này)
  const handleDeleteCloudProject = async (projectId: string, title: string) => {
    if (!teacherAuth.user) return;
    if (!confirm(`Xoá vĩnh viễn dự án "${title}" khỏi đám mây? Hành động này không thể hoàn tác.`)) return;
    try {
      await deleteCloudProject(projectId);
      await refreshCloudProjects();
    } catch (err: any) {
      setSyncError(err.message || 'Không thể xoá dự án.');
    }
  };

  // Thêm đồng nghiệp vào danh sách được xem/sửa chung dự án hiện tại
  const handleAddCollaborator = async () => {
    const email = collaboratorInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    setShareBusy(true);
    try {
      await addCollaborator(project.id, email);
      await refreshCloudProjects();
      setCollaboratorInput('');
    } catch (err: any) {
      setSyncError(err.message || 'Không thể chia sẻ dự án.');
    } finally {
      setShareBusy(false);
    }
  };

  const handleRemoveCollaborator = async (email: string) => {
    setShareBusy(true);
    try {
      await removeCollaborator(project.id, email);
      await refreshCloudProjects();
    } catch (err: any) {
      setSyncError(err.message || 'Không thể gỡ chia sẻ.');
    } finally {
      setShareBusy(false);
    }
  };

  // Tạo dự án trống mới (dựa trên mẫu Thales) để bắt đầu bài học mới
  const handleCreateNewProject = () => {
    const fresh: ComicLessonProject = {
      ...DEFAULT_COMIC_PROJECT,
      id: `proj-${Date.now()}`,
      title: 'Dự Án Video Mới',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProject(fresh);
    setCurrentStep(1);
    setShowProjectPicker(false);
  };

  const hasScenes = project.scenes.length > 0;
  const hasFrames = project.scenes.some((sc) => sc.frames.length > 0);

  // Bước 5-8 cần có cảnh/khung hình — nếu bài học mới chưa có thì hướng dẫn quay lại bước tạo
  const renderEmptyState = (step: number) => {
    const needFrames = step === 6 || step === 8;
    const backStep = needFrames && hasScenes ? 5 : 4;
    return (
      <div className="max-w-xl mx-auto text-center p-8 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <p className="text-sm font-black text-white">
          {backStep === 4 ? 'Bài học này chưa có kịch bản (cảnh).' : 'Bài học này chưa có khung hình (storyboard).'}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {backStep === 4
            ? 'Hoàn tất Bước 1–3, sau đó vào Bước 4 bấm "AI Sinh Toàn Bộ Kịch Bản 8 Cảnh".'
            : 'Vào Bước 5, bấm "AI Tạo Storyboard" trên từng cảnh để AI chia cảnh thành các khung hình.'}
        </p>
        <button
          onClick={() => setCurrentStep(backStep)}
          className="px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-bold cursor-pointer"
        >
          Đến Bước {backStep}
        </button>
      </div>
    );
  };

  const stepsConfig = [
    { num: 1, label: 'Hồ Sơ Kiến Thức', icon: BookOpen, desc: 'Bóc tách GDPT 2018' },
    { num: 2, label: 'Hạt Nhân Truyện', icon: Compass, desc: 'Vấn đề trung tâm' },
    { num: 3, label: 'Kho Nhân Vật', icon: Users, desc: 'Character Library' },
    { num: 4, label: 'Viết Kịch Bản', icon: Film, desc: '8 Cảnh chuẩn sư phạm' },
    { num: 5, label: 'Duyệt Storyboard', icon: CheckSquare, desc: 'Bảng phê duyệt Frame' },
    { num: 6, label: 'Tạo Video AI', icon: Video, desc: 'Veo Studio & KaTeX' },
    { num: 7, label: 'Audio & Lời Bình', icon: Mic, desc: 'Hội thoại & SFX' },
    { num: 8, label: 'Xem & Xuất Video', icon: Video, desc: 'Trình chiếu, .webm, .pptx' },
  ];

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col">
      {/* Top Breadcrumb & Project Bar */}
      <div className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Quay lại Bài Học Chính"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay Lại</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white tracking-wide">
                  AI TẠO VIDEO BÀI HỌC
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-500/30 uppercase">
                  GDPT 2018 THCS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {project.title} • {project.knowledgeProfile.subject} ({project.knowledgeProfile.grade})
              </p>
            </div>
          </div>
        </div>

        {/* Project Switcher + Cloud Sync */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-bold hidden md:inline">
            Dự Án Mẫu:
          </span>
          <select
            value={
              initialLessonContext && project.id === makeLessonProjectId(initialLessonContext)
                ? LESSON_OPTION
                : project.id === 'proj-thales-math8' || project.id === 'proj-photosynthesis-science7'
                ? project.id
                : ''
            }
            onChange={(e) => handleSwitchProject(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none"
          >
            {initialLessonContext && (
              <option value={LESSON_OPTION}>📘 {initialLessonContext.lessonTitle} ({initialLessonContext.grade}) — bài đang chọn</option>
            )}
            {!(initialLessonContext && project.id === makeLessonProjectId(initialLessonContext)) &&
              project.id !== 'proj-thales-math8' &&
              project.id !== 'proj-photosynthesis-science7' && (
                <option value="" disabled>
                  Dự án đã lưu: {project.title}
                </option>
              )}
            <option value="proj-thales-math8">📐 Toán 8: Định lý Thales (Đo chiều cao cây)</option>
            <option value="proj-photosynthesis-science7">🌱 KHTN 7: Quang hợp ở thực vật</option>
          </select>

          {/* Cloud Sync / Auth */}
          {teacherAuth.isConfigured ? (
            teacherAuth.loading ? (
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
            ) : teacherAuth.user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProjectPicker((v) => !v)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  title={syncStatus === 'saving' ? 'Đang đồng bộ...' : syncStatus === 'error' ? syncError || 'Lỗi đồng bộ' : 'Đã đồng bộ đám mây'}
                >
                  {teacherAuth.user.photoURL ? (
                    <img src={teacherAuth.user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-[9px] font-black text-white">
                      {(teacherAuth.user.displayName || teacherAuth.user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-slate-200 max-w-[100px] truncate hidden sm:inline">
                    {teacherAuth.user.displayName || teacherAuth.user.email}
                  </span>
                  {syncStatus === 'saving' && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                  {syncStatus === 'saved' && <Cloud className="w-3.5 h-3.5 text-emerald-400" />}
                  {syncStatus === 'error' && <CloudOff className="w-3.5 h-3.5 text-rose-400" />}
                </button>

                {showProjectPicker && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 overflow-hidden">
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-300 uppercase">Dự Án Đám Mây Của Tôi</span>
                      <button
                        onClick={handleCreateNewProject}
                        className="px-2 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Mới
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {cloudProjects.length === 0 ? (
                        <p className="p-3 text-[11px] text-slate-500">
                          Chưa có dự án nào trên đám mây. Bấm "Lưu Lên Đám Mây" bên dưới để lưu dự án hiện tại.
                        </p>
                      ) : (
                        cloudProjects.map((p) => (
                          <div
                            key={p.id}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors border-b border-slate-800/60 last:border-0 flex items-center justify-between gap-2 group ${
                              p.id === project.id ? 'bg-slate-800/60' : ''
                            }`}
                          >
                            <button onClick={() => handleOpenCloudProject(p.id)} className="flex-1 text-left cursor-pointer min-w-0">
                              <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                                {p.title}
                                {!p.isOwner && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase shrink-0">
                                    Chia sẻ
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {p.subject} • {p.grade}
                                {!p.isOwner && p.ownerName ? ` • của ${p.ownerName}` : ''}
                              </p>
                            </button>
                            {p.isOwner && (
                              <button
                                onClick={() => handleDeleteCloudProject(p.id, p.title)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                                title="Xoá dự án"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2.5 border-t border-slate-800 flex items-center gap-2">
                      <button
                        onClick={handleSaveToCloudNow}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Cloud className="w-3.5 h-3.5" /> Lưu Lên Đám Mây
                      </button>
                      {isRegisteredInCloud && isOwner && (
                        <button
                          onClick={() => {
                            setShowShareModal(true);
                            setShowProjectPicker(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Chia sẻ dự án này cho đồng nghiệp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => teacherAuth.signOutTeacher()}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Đăng xuất"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => teacherAuth.signInWithGoogle()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                title="Đăng nhập Google để lưu dự án lên đám mây, không mất khi đổi máy/trình duyệt"
              >
                <LogIn className="w-3.5 h-3.5" /> Đăng Nhập Để Đồng Bộ
              </button>
            )
          ) : null}
        </div>
      </div>

      {teacherAuth.error && (
        <div className="px-4 sm:px-8 py-2 bg-rose-950/30 border-b border-rose-500/30 text-rose-300 text-xs">
          {teacherAuth.error}
        </div>
      )}

      {/* Share Modal — chia sẻ dự án hiện tại cho đồng nghiệp bằng email */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" /> Chia Sẻ Dự Án Cho Đồng Nghiệp
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Đồng nghiệp cần đăng nhập bằng đúng địa chỉ Google email dưới đây để xem và cùng chỉnh sửa dự án
                "<span className="text-slate-200 font-bold">{project.title}</span>".
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={collaboratorInput}
                  onChange={(e) => setCollaboratorInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
                  placeholder="email.dongnghiep@gmail.com"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAddCollaborator}
                  disabled={shareBusy || !collaboratorInput.includes('@')}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Đang chia sẻ với ({currentCloudSummary?.collaboratorEmails.length || 0}):
                </span>
                {(currentCloudSummary?.collaboratorEmails.length || 0) === 0 ? (
                  <p className="text-xs text-slate-600">Chưa chia sẻ với ai.</p>
                ) : (
                  currentCloudSummary!.collaboratorEmails.map((email) => (
                    <div key={email} className="flex items-center justify-between px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-xs text-slate-300">{email}</span>
                      <button
                        onClick={() => handleRemoveCollaborator(email)}
                        disabled={shareBusy}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8-Step Navigation Stepper */}
      <div className="bg-slate-950/40 border-b border-slate-800/80 px-4 sm:px-8 py-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {stepsConfig.map((s, idx) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            const Icon = s.icon;

            return (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : isDone
                      ? 'bg-slate-900/80 text-emerald-300 border border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/60 text-slate-400 border border-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      isActive
                        ? 'bg-cyan-500 text-white'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  <span>{s.label}</span>
                </button>

                {idx < stepsConfig.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentStep === 1 && (
          <Step1KnowledgeProfile
            knowledgeProfile={project.knowledgeProfile}
            onUpdateKnowledgeProfile={handleUpdateKnowledgeProfile}
            onNextStep={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2StoryKernel
            storyKernel={project.storyKernel}
            knowledgeProfile={project.knowledgeProfile}
            onUpdateStoryKernel={handleUpdateStoryKernel}
            onNextStep={() => setCurrentStep(3)}
            onPrevStep={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3CharacterLibrary
            characters={project.characters}
            onUpdateCharacters={handleUpdateCharacters}
            onNextStep={() => setCurrentStep(4)}
            onPrevStep={() => setCurrentStep(2)}
            knowledgeProfile={project.knowledgeProfile}
            storyKernel={project.storyKernel}
            teacherUid={teacherAuth.user?.uid}
          />
        )}

        {currentStep === 4 && (
          <Step4ScriptEditor
            scenes={project.scenes}
            characters={project.characters}
            onUpdateScenes={handleUpdateScenes}
            onNextStep={() => setCurrentStep(5)}
            onPrevStep={() => setCurrentStep(3)}
            knowledgeProfile={project.knowledgeProfile}
            storyKernel={project.storyKernel}
          />
        )}

        {currentStep === 5 && !hasScenes && renderEmptyState(5)}
        {currentStep === 5 && hasScenes && (
          <Step5StoryboardReview
            scenes={project.scenes}
            characters={project.characters}
            onUpdateScenes={handleUpdateScenes}
            onNextStep={() => setCurrentStep(6)}
            onPrevStep={() => setCurrentStep(4)}
            knowledgeProfile={project.knowledgeProfile}
          />
        )}

        {currentStep === 6 && !hasFrames && renderEmptyState(6)}
        {currentStep === 6 && hasFrames && (
          <Step6ComicArtStudio
            scenes={project.scenes}
            characters={project.characters}
            artStyle={project.artStyle || project.style || 'modern-comic'}
            onUpdateScenes={handleUpdateScenes}
            onUpdateArtStyle={handleUpdateArtStyle}
            onNextStep={() => setCurrentStep(7)}
            onPrevStep={() => setCurrentStep(5)}
            knowledgeProfile={project.knowledgeProfile}
            projectId={project.id}
          />
        )}

        {currentStep === 7 && !hasScenes && renderEmptyState(7)}
        {currentStep === 7 && hasScenes && (
          <Step7AudioDirector
            scenes={project.scenes}
            characters={project.characters}
            onUpdateScenes={handleUpdateScenes}
            onNextStep={() => setCurrentStep(8)}
            onPrevStep={() => setCurrentStep(6)}
          />
        )}

        {currentStep === 8 && !hasFrames && renderEmptyState(8)}
        {currentStep === 8 && hasFrames && (
          <Step8VideoAndReader
            project={project}
            onUpdateProject={saveProject}
            onPrevStep={() => setCurrentStep(7)}
          />
        )}
      </main>
    </div>
  );
};