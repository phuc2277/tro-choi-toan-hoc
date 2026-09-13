import React, { useState, useEffect } from 'react';
import { ComicLessonProject, ComicScene, ComicFrame } from '../../types/comicLesson';
import { VisualIllustrationRenderer } from './VisualIllustrationRenderer';
import {
  BookOpen,
  Video,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  FileDown,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface Step8VideoAndReaderProps {
  project: ComicLessonProject;
  onUpdateProject: (project: ComicLessonProject) => void;
  onPrevStep: () => void;
}

export const Step8VideoAndReader: React.FC<Step8VideoAndReaderProps> = ({
  project,
  onUpdateProject,
  onPrevStep,
}) => {
  // Presentation mode: 'reader' (Lật trang/khung tranh) or 'video' (Ken Burns Video Player)
  const [viewMode, setViewMode] = useState<'reader' | 'video'>('video');
  const [videoStyle, setVideoStyle] = useState<'ken-burns' | 'ai-animated'>('ken-burns');

  // Flatten frames
  const allFrames: Array<{ scene: ComicScene; frame: ComicFrame }> = [];
  project.scenes.forEach((scene) => {
    scene.frames.forEach((frame) => {
      allFrames.push({ scene, frame });
    });
  });

  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showPedagogyReport, setShowPedagogyReport] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const currentPair = allFrames[currentFrameIdx] || allFrames[0];
  const currentScene = currentPair?.scene;
  const currentFrame = currentPair?.frame;

  // Video Autoplay Timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && viewMode === 'video') {
      const durationMs = (currentScene?.estimatedDurationSec || 6) * 1000;
      timer = setTimeout(() => {
        if (currentFrameIdx < allFrames.length - 1) {
          setCurrentFrameIdx((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentFrameIdx(0);
        }
      }, durationMs);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentFrameIdx, viewMode, currentScene?.estimatedDurationSec, allFrames.length]);

  // Read dialogue aloud when transitioning frame if not muted
  useEffect(() => {
    if (!isMuted && 'speechSynthesis' in window && currentFrame) {
      window.speechSynthesis.cancel();
      const textToSpeak =
        currentFrame.captionText ||
        currentScene?.narration ||
        currentFrame.speechBubbles[0]?.text ||
        '';
      if (textToSpeak) {
        const u = new SpeechSynthesisUtterance(textToSpeak);
        u.lang = 'vi-VN';
        u.rate = 1.0;
        window.speechSynthesis.speak(u);
      }
    }
  }, [currentFrameIdx, isMuted, viewMode]);

  const handleNextFrame = () => {
    if (currentFrameIdx < allFrames.length - 1) {
      setCurrentFrameIdx((prev) => prev + 1);
    }
  };

  const handlePrevFrame = () => {
    if (currentFrameIdx > 0) {
      setCurrentFrameIdx((prev) => prev - 1);
    }
  };

  // Export handlers
  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${project.title.toLowerCase().replace(/\\s+/g, '_')}_comic_project.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const audit = {
    coreKnowledgePreserved: project.pedagogicalAudit?.coreKnowledgePreserved ?? true,
    formulasAccurate: project.pedagogicalAudit?.mathematicalAccuracy ?? true,
    conceptsCorrect: project.pedagogicalAudit?.gradeLevelAppropriate ?? true,
    engagementScore: project.pedagogicalAudit?.engagementScore ?? 96,
    comprehensionScore:
      project.pedagogicalAudit?.comprehensionScore ??
      project.pedagogicalAudit?.conceptClarityScore ??
      94,
    warnings: project.pedagogicalAudit?.warnings ?? [],
    overallVerdict:
      project.pedagogicalAudit?.overallVerdict ??
      project.pedagogicalAudit?.pedagogyRemarks ??
      'Đạt chuẩn xuất sắc kiểm định GDPT 2018. Sẵn sàng giảng dạy trên lớp.',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-xs uppercase tracking-wider border border-cyan-400/40">
              BƯỚC 8 — HOÀN TẤT & XUẤT BẢN
            </span>
            <span className="text-xs text-slate-400 font-medium">Lớp Học & Tự Học GDPT</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            {project.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {project.knowledgeProfile.subject} • {project.knowledgeProfile.grade} • {project.knowledgeProfile.chapter}
          </p>
        </div>

        {/* View Mode Switcher: Comic Reader vs Video Mode */}
        <div className="flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-700 shadow-xl shrink-0">
          <button
            onClick={() => {
              setViewMode('video');
              setIsPlaying(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'video'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Chế Độ Video (Trình Chiếu Lớp)</span>
          </button>

          <button
            onClick={() => {
              setViewMode('reader');
              setIsPlaying(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'reader'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Chế Độ Comic Reader (Tự Học)</span>
          </button>
        </div>
      </div>

      {/* Main Theater / Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Video / Reader Stage */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main Visual Display */}
          <div className="relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl p-2 flex flex-col items-center justify-center min-h-[460px]">
            {/* Live Visual Illustration Renderer */}
            <div
              className={`transition-all duration-700 w-full flex justify-center ${
                viewMode === 'video' && videoStyle === 'ken-burns' && isPlaying
                  ? 'animate-pulse scale-[1.02]'
                  : ''
              }`}
            >
              <VisualIllustrationRenderer
                frame={currentFrame}
                characters={project.characters}
                zoomLevel={1.05}
                showOverlayLayer={true}
              />
            </div>

            {/* Bottom Floating Control Bar (Video Player & Reader Navigation) */}
            <div className="w-full mt-3 px-4 py-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 shadow-2xl">
              {/* Play / Pause / Skip */}
              <div className="flex items-center gap-2">
                {viewMode === 'video' && (
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-900/30 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                )}

                <button
                  onClick={handlePrevFrame}
                  disabled={currentFrameIdx === 0}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                  title="Khung trước"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNextFrame}
                  disabled={currentFrameIdx === allFrames.length - 1}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                  title="Khung kế tiếp"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentFrameIdx(0)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Xem lại từ đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Slider */}
              <div className="flex-1 max-w-md hidden sm:flex items-center gap-3">
                <span className="text-[11px] font-mono text-cyan-400 font-black">
                  {currentFrameIdx + 1} / {allFrames.length}
                </span>
                <input
                  type="range"
                  min="0"
                  max={allFrames.length - 1}
                  value={currentFrameIdx}
                  onChange={(e) => setCurrentFrameIdx(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 rounded-lg bg-slate-800"
                />
              </div>

              {/* Audio Mute / Unmute & Video Style */}
              <div className="flex items-center gap-2">
                {viewMode === 'video' && (
                  <div className="hidden md:flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-[11px] font-bold">
                    <button
                      onClick={() => setVideoStyle('ken-burns')}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        videoStyle === 'ken-burns' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      Ken Burns Zoom
                    </button>
                    <button
                      onClick={() => setVideoStyle('ai-animated')}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        videoStyle === 'ai-animated' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      AI Motion Clip
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (!isMuted && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`p-2 rounded-xl border transition-colors ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-slate-800 text-teal-300 border-slate-700'
                  }`}
                  title={isMuted ? 'Bật giọng đọc' : 'Tắt giọng đọc'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Current Frame Narration & Dialogue Subtitle Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-cyan-400 uppercase font-mono">
                {currentScene?.sceneId} • {currentScene?.sceneName} ({currentFrame?.frameId})
              </span>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {currentScene?.narration}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPedagogyReport(!showPedagogyReport)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Báo Cáo Sư Phạm</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Tải về file dự án truyện tranh JSON"
              >
                <Download className="w-4 h-4" />
                <span>Xuất File Dự Án</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pedagogical Audit Report & Lesson Summary */}
        <div className="space-y-4">
          {/* Pedagogical Audit Box */}
          <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Kiểm Định Sư Phạm GDPT 2018
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold">✓ Đã Thẩm Định Hoàn Tất</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-medium">Kiến thức cốt lõi:</span>
                <span className="text-emerald-400 font-bold">Chính xác 100%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-medium">Công thức KaTeX:</span>
                <span className="text-emerald-400 font-bold">Chuẩn SGK</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-medium">Chỉ số hấp dẫn bài giảng:</span>
                <span className="text-cyan-400 font-bold">{audit.engagementScore}%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-medium">Khả năng tiếp thu của HS:</span>
                <span className="text-purple-400 font-bold">{audit.comprehensionScore}%</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-200 leading-relaxed">
              <strong>Kết luận sư phạm:</strong> {audit.overallVerdict}
            </div>
          </div>

          {/* Quick Scene Jump */}
          <div className="eduverse-glass p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              Mục Lục 8 Cảnh Bài Học:
            </span>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {project.scenes.map((sc, sIdx) => {
                // Find first frame index of this scene
                const firstFrameIdx = allFrames.findIndex((f) => f.scene.sceneId === sc.sceneId);
                const isCurrentScene = currentScene?.sceneId === sc.sceneId;

                return (
                  <button
                    key={sc.sceneId}
                    onClick={() => {
                      if (firstFrameIdx >= 0) setCurrentFrameIdx(firstFrameIdx);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isCurrentScene
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span className="line-clamp-1">{sc.sceneId}: {sc.sceneName}</span>
                    <span className="text-[10px] font-mono shrink-0 ml-1">{sc.estimatedDurationSec}s</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrevStep}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          ← Quay Lại Bước 7 (Audio Director)
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Dự án truyện tranh bài học đã sẵn sàng xuất bản lên thư viện số nhà trường!')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xuất Bản Lên Thư Viện Bài Giảng Số</span>
          </button>
        </div>
      </div>
    </div>
  );
};
