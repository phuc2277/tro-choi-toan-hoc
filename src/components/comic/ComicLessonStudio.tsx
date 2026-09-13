import React, { useState } from 'react';
import {
  ComicLessonProject,
  LessonKnowledgeProfile,
  StoryKernel,
  CharacterProfile,
  ComicScene,
  ComicArtStyle,
} from '../../types/comicLesson';
import { DEFAULT_COMIC_PROJECT, SAMPLE_PHOTOSYNTHESIS_PROJECT } from '../../data/defaultComicLessons';
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
  Palette,
  Mic,
  Video,
  ChevronRight,
  FolderOpen,
  Plus,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface ComicLessonStudioProps {
  onBackToMain?: () => void;
}

export const ComicLessonStudio: React.FC<ComicLessonStudioProps> = ({ onBackToMain }) => {
  // Current active project
  const [project, setProject] = useState<ComicLessonProject>(() => {
    try {
      const cached = localStorage.getItem('cached_comic_lesson_project');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_COMIC_PROJECT;
  });

  // Current active step: 1 through 8
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Sync with localStorage
  const saveProject = (updated: ComicLessonProject) => {
    setProject(updated);
    try {
      localStorage.setItem('cached_comic_lesson_project', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to cache comic project:', e);
    }
  };

  // Step 1: Update Knowledge Profile
  const handleUpdateKnowledgeProfile = (updatedProfile: LessonKnowledgeProfile) => {
    saveProject({
      ...project,
      knowledgeProfile: updatedProfile,
      title: `Truyện Tranh: ${updatedProfile.lessonTitle}`,
      description: `Học bài học ${updatedProfile.lessonTitle} qua lăng kính truyện tranh sinh động.`,
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

  // Switch between projects
  const handleSwitchProject = (projId: string) => {
    if (projId === 'proj-thales-math8') {
      saveProject(DEFAULT_COMIC_PROJECT);
    } else if (projId === 'proj-photosynthesis-science7') {
      saveProject(SAMPLE_PHOTOSYNTHESIS_PROJECT);
    }
    setCurrentStep(1);
  };

  const stepsConfig = [
    { num: 1, label: 'Hồ Sơ Kiến Thức', icon: BookOpen, desc: 'Bóc tách GDPT 2018' },
    { num: 2, label: 'Hạt Nhân Truyện', icon: Compass, desc: 'Vấn đề trung tâm' },
    { num: 3, label: 'Kho Nhân Vật', icon: Users, desc: 'Character Library' },
    { num: 4, label: 'Viết Kịch Bản', icon: Film, desc: '8 Cảnh chuẩn sư phạm' },
    { num: 5, label: 'Duyệt Storyboard', icon: CheckSquare, desc: 'Bảng phê duyệt Frame' },
    { num: 6, label: 'Tạo Bộ Tranh', icon: Palette, desc: 'Visual Studio & KaTeX' },
    { num: 7, label: 'Audio & Lời Bình', icon: Mic, desc: 'Hội thoại & SFX' },
    { num: 8, label: 'Video & Đọc Truyện', icon: Video, desc: 'Chế độ chiếu & Tự học' },
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
                  AI TRUYỆN TRANH BÀI HỌC
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

        {/* Project Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold hidden md:inline">
            Dự Án:
          </span>
          <select
            value={project.id}
            onChange={(e) => handleSwitchProject(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none"
          >
            <option value="proj-thales-math8">📐 Toán 8: Định lý Thales (Đo chiều cao cây)</option>
            <option value="proj-photosynthesis-science7">🌱 KHTN 7: Quang hợp ở thực vật</option>
          </select>
        </div>
      </div>

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

        {currentStep === 5 && (
          <Step5StoryboardReview
            scenes={project.scenes}
            characters={project.characters}
            onUpdateScenes={handleUpdateScenes}
            onNextStep={() => setCurrentStep(6)}
            onPrevStep={() => setCurrentStep(4)}
            knowledgeProfile={project.knowledgeProfile}
          />
        )}

        {currentStep === 6 && (
          <Step6ComicArtStudio
            scenes={project.scenes}
            characters={project.characters}
            artStyle={project.artStyle || project.style || 'modern-comic'}
            onUpdateScenes={handleUpdateScenes}
            onUpdateArtStyle={handleUpdateArtStyle}
            onNextStep={() => setCurrentStep(7)}
            onPrevStep={() => setCurrentStep(5)}
          />
        )}

        {currentStep === 7 && (
          <Step7AudioDirector
            scenes={project.scenes}
            characters={project.characters}
            onUpdateScenes={handleUpdateScenes}
            onNextStep={() => setCurrentStep(8)}
            onPrevStep={() => setCurrentStep(6)}
          />
        )}

        {currentStep === 8 && (
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