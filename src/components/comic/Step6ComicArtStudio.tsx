import React, { useState, useRef, useEffect } from 'react';
import { ComicScene, ComicFrame, CharacterProfile, ComicArtStyle, LessonKnowledgeProfile } from '../../types/comicLesson';
import { VisualIllustrationRenderer } from './VisualIllustrationRenderer';
import { toPng } from 'html-to-image';
import {
  Palette,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Video,
  ArrowRight,
  Eye,
  Sliders,
  Clapperboard,
  Loader2,
  Film,
  StopCircle,
} from 'lucide-react';

interface Step6ComicArtStudioProps {
  scenes: ComicScene[];
  characters: CharacterProfile[];
  artStyle: ComicArtStyle;
  onUpdateScenes: (scenes: ComicScene[]) => void;
  onUpdateArtStyle: (style: ComicArtStyle) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  knowledgeProfile?: LessonKnowledgeProfile;
}

export const Step6ComicArtStudio: React.FC<Step6ComicArtStudioProps> = ({
  scenes,
  characters,
  artStyle,
  onUpdateScenes,
  onUpdateArtStyle,
  onNextStep,
  onPrevStep,
  knowledgeProfile,
}) => {
  // Extract all frames
  const allFrames: Array<{ scene: ComicScene; frame: ComicFrame }> = [];
  scenes.forEach((scene) => {
    scene.frames.forEach((frame) => {
      allFrames.push({ scene, frame });
    });
  });
  const totalFrameCount = allFrames.length;
  const framesWithVideoCount = allFrames.filter((p) => !!p.frame.aiVideoClip).length;

  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [showSourceArt, setShowSourceArt] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'prompt' | 'consistency'>('preview');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const frameStageRef = useRef<HTMLDivElement | null>(null);
  const [aiVideoStatus, setAiVideoStatus] = useState<'idle' | 'capturing' | 'submitting' | 'polling' | 'error'>('idle');
  const [aiVideoError, setAiVideoError] = useState<string | null>(null);

  // Luôn giữ bản mới nhất của `scenes` trong ref — vòng lặp tạo video hàng loạt chạy
  // trong nhiều phút, nếu chỉ dùng closure `scenes` ban đầu sẽ bị dữ liệu cũ đè mất.
  const scenesRef = useRef(scenes);
  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  // Trạng thái tạo hàng loạt cho TẤT CẢ khung hình
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, currentFrameId: '' });
  const bulkCancelRef = useRef(false);

  const currentPair = allFrames[selectedFrameIndex] || allFrames[0];
  const currentFrame = currentPair?.frame;
  const currentScene = currentPair?.scene;

  const updateFrameInScenes = (sceneId: string, frameId: string, partial: Partial<ComicFrame>) => {
    const updated = scenesRef.current.map((s) => {
      if (s.sceneId !== sceneId) return s;
      return {
        ...s,
        frames: s.frames.map((f) => (f.frameId === frameId ? { ...f, ...partial } : f)),
      };
    });
    scenesRef.current = updated;
    onUpdateScenes(updated);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // AI Video (Veo): sinh video chuyển động thật cho MỘT khung hình cụ thể (dùng cho cả
  // nút từng khung và vòng lặp tạo hàng loạt). Luôn chuyển khung đang xem về đúng khung
  // này trước khi chụp, để thầy/cô xem được tiến trình trực quan khi chạy hàng loạt.
  const generateVideoForFrameAt = async (targetIndex: number): Promise<boolean> => {
    const pair = allFrames[targetIndex];
    if (!pair || !frameStageRef.current) return false;
    const { scene: targetScene, frame: targetFrame } = pair;

    setSelectedFrameIndex(targetIndex);
    setShowSourceArt(true);
    // Chờ React vẽ xong đúng khung này trước khi chụp ảnh làm ảnh gốc cho Veo
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(200);

    setAiVideoError(null);
    try {
      setAiVideoStatus('capturing');
      const imageDataUrl = await toPng(frameStageRef.current, { pixelRatio: 1, cacheBust: true, skipFonts: true } as any);

      setAiVideoStatus('submitting');
      const styleHint = `Art direction: ${artStyle}.`;
      const startRes = await fetch('/api/comic/generate-frame-video/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mimeType: 'image/png',
          prompt: `${styleHint} ${targetFrame.promptDetails?.videoPrompt || ''}`.trim(),
          durationSeconds: 6,
        }),
      });
      const startData = await startRes.json();
      if (!startRes.ok || !startData.operationName) {
        throw new Error(startData.error || 'AI không thể khởi tạo video lúc này.');
      }

      setAiVideoStatus('polling');
      const operationName = startData.operationName;
      const maxAttempts = 30; // ~ 30 * 10s = 5 phút chờ tối đa / khung
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (bulkCancelRef.current) throw new Error('Đã huỷ theo yêu cầu.');
        await sleep(10000);
        const statusRes = await fetch('/api/comic/generate-frame-video/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });
        const statusData = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusData.error || 'Lỗi kiểm tra trạng thái AI Video.');
        if (statusData.done) {
          if (statusData.error) throw new Error(statusData.error);
          updateFrameInScenes(targetScene.sceneId, targetFrame.frameId, {
            aiVideoClip: {
              videoUrl: statusData.videoUrl,
              mimeType: statusData.mimeType || 'video/mp4',
              prompt: targetFrame.promptDetails?.videoPrompt || '',
              generatedAt: new Date().toISOString(),
            },
          });
          setAiVideoStatus('idle');
          setShowSourceArt(false);
          return true;
        }
      }
      throw new Error('AI Video mất quá nhiều thời gian (>5 phút). Vui lòng thử lại sau.');
    } catch (err: any) {
      setAiVideoError(`${targetFrame.frameId}: ${err.message || 'Lỗi không xác định khi tạo AI Video.'}`);
      setAiVideoStatus('error');
      return false;
    }
  };

  const handleGenerateAiVideo = () => generateVideoForFrameAt(selectedFrameIndex);

  // Sinh video AI cho TOÀN BỘ khung hình của truyện, lần lượt từng khung (Veo xử lý tuần tự,
  // không thể song song nhiều video cùng lúc với chi phí hợp lý). Bỏ qua khung đã có sẵn video
  // trừ khi forceRegenerate.
  const handleBulkGenerateVideos = async (forceRegenerate: boolean) => {
    const targets = allFrames
      .map((pair, idx) => ({ pair, idx }))
      .filter(({ pair }) => forceRegenerate || !pair.frame.aiVideoClip);

    if (targets.length === 0) {
      alert('Tất cả khung hình đã có video AI rồi. Dùng nút "Tạo Lại Toàn Bộ" nếu muốn sinh lại từ đầu.');
      return;
    }

    const estLow = targets.length * 1.5;
    const estHigh = targets.length * 3;
    if (
      !confirm(
        `Sắp tạo video AI (Veo) cho ${targets.length} khung hình, lần lượt từng khung.\n\n` +
          `Thời gian dự kiến: khoảng ${Math.ceil(estLow)}–${Math.ceil(estHigh)} phút.\n` +
          `Chi phí: Veo tính phí theo giây video — ${targets.length} khung × ~6 giây sẽ tốn chi phí API đáng kể.\n\n` +
          `Giữ tab này mở trong suốt quá trình. Tiếp tục?`
      )
    ) {
      return;
    }

    bulkCancelRef.current = false;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length, currentFrameId: '' });

    for (let i = 0; i < targets.length; i++) {
      if (bulkCancelRef.current) break;
      const { idx, pair } = targets[i];
      setBulkProgress({ done: i, total: targets.length, currentFrameId: pair.frame.frameId });
      await generateVideoForFrameAt(idx);
    }

    setBulkRunning(false);
    setBulkProgress({ done: targets.length, total: targets.length, currentFrameId: '' });
  };

  const handleCancelBulk = () => {
    bulkCancelRef.current = true;
  };

  // Run Consistency Check on Current Frame — calls the real AI quality-check endpoint
  // across the whole project (kiến thức + nhất quán nhân vật/bối cảnh) and applies the
  // result for this frame.
  const handleRunConsistencyCheck = async () => {
    if (!knowledgeProfile) {
      setAuditError('Thiếu hồ sơ kiến thức bài học để đối chiếu.');
      return;
    }
    setIsAuditing(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/comic/quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeProfile, characters, scenes }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.frameChecks)) {
        const checkMap: Record<string, any> = {};
        data.frameChecks.forEach((fc: any) => {
          checkMap[fc.frameId] = fc.consistencyCheck;
        });
        const updated = scenes.map((s) => ({
          ...s,
          frames: s.frames.map((f) => (checkMap[f.frameId] ? { ...f, consistencyCheck: checkMap[f.frameId] } : f)),
        }));
        onUpdateScenes(updated);
      } else {
        setAuditError(data.error || 'AI không thể kiểm tra nhất quán lúc này.');
      }
    } catch {
      setAuditError('Lỗi kết nối tới máy chủ AI. Vui lòng thử lại.');
    } finally {
      setIsAuditing(false);
    }
  };

  const consistency = currentFrame?.consistencyCheck || {
    characterScore: 0,
    sceneScore: 0,
    objectScore: 0,
    accuracyScore: 0,
    continuityScore: 0,
    feedback: 'Chưa chạy kiểm tra AI cho khung hình này. Bấm "Kiểm Tra Lại" để AI đối chiếu kiến thức và tính nhất quán nhân vật/bối cảnh.',
    passed: false,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-slate-900 border border-fuchsia-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-extrabold text-xs uppercase tracking-wider border border-fuchsia-400/40">
              BƯỚC 6 — STUDIO TẠO VIDEO AI (VEO)
            </span>
            <span className="text-xs text-slate-400 font-medium">Mỗi khung hình → 1 video chuyển động thật</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Sinh Video AI Cho Toàn Bộ Khung Hình Của Truyện
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Mỗi khung được dựng thành một video ngắn có chuyển động thật bằng Veo, dùng chính hình minh họa làm ảnh gốc để giữ đúng nhân vật/bối cảnh. Bong bóng thoại và công thức KaTeX vẫn hiển thị trên layer web riêng, sắc nét tuyệt đối.
          </p>
        </div>

        {/* Art Style Selector */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Phong Cách Hình Ảnh (ảnh gốc cho Veo):
          </label>
          <select
            value={artStyle}
            onChange={(e) => onUpdateArtStyle(e.target.value as ComicArtStyle)}
            className="bg-slate-900 border border-fuchsia-500/40 rounded-xl px-3 py-2 text-xs text-fuchsia-300 font-bold focus:outline-none"
          >
            <option value="modern-comic">🎨 Modern Educational Comic (Chuẩn GDPT)</option>
            <option value="anime">🌟 Anime Giáo Dục Học Đường</option>
            <option value="2d-animation">🎬 Hoạt Hình 2D Điện Ảnh</option>
            <option value="cinematic">🎥 Comic Cinematic High Contrast</option>
            <option value="infographic">📊 Infographic Comic Trực Quan</option>
          </select>
        </div>
      </div>

      {/* Bulk AI Video Generation Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-fuchsia-500/20 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-fuchsia-400" />
            <span className="text-sm font-black text-white">
              Tiến Độ Video AI: {framesWithVideoCount}/{totalFrameCount} khung
            </span>
          </div>

          <div className="flex items-center gap-2">
            {bulkRunning ? (
              <button
                onClick={handleCancelBulk}
                className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5" /> Dừng Lại
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleBulkGenerateVideos(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Tạo Video Cho Khung Còn Thiếu ({totalFrameCount - framesWithVideoCount})
                </button>
                {framesWithVideoCount > 0 && (
                  <button
                    onClick={() => handleBulkGenerateVideos(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Tạo Lại Toàn Bộ
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-fuchsia-500 to-purple-500 h-full rounded-full transition-all"
            style={{ width: `${totalFrameCount > 0 ? (framesWithVideoCount / totalFrameCount) * 100 : 0}%` }}
          />
        </div>

        {bulkRunning && (
          <p className="text-[11px] text-fuchsia-300 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang xử lý khung {bulkProgress.done + 1}/{bulkProgress.total} ({bulkProgress.currentFrameId}) — giữ tab này mở...
          </p>
        )}
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Visual Canvas with Toolbar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar: Zoom, Toggle Layer, Fullscreen */}
          <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white font-mono">
                {currentFrame.frameId}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-semibold line-clamp-1">
                {currentScene.sceneName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Web Layer */}
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  showOverlay
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
                title="Bật/Tắt Layer chữ & KaTeX trên website"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Layer Thoại & KaTeX</span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.1))}
                  className="p-1 hover:text-cyan-300 text-slate-400 transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-slate-300 font-bold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
                  className="p-1 hover:text-cyan-300 text-slate-400 transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* The High-Quality Visual Canvas — video AI là hiển thị chính; ảnh gốc (SVG)
              chỉ hiện khi chưa có video, hoặc khi thầy/cô chủ động bấm xem/chụp lại. */}
          {currentFrame.aiVideoClip && !showSourceArt ? (
            <div className="w-full flex justify-center bg-slate-950/60 p-2 rounded-3xl border border-fuchsia-500/30 overflow-hidden shadow-2xl relative">
              <video
                key={currentFrame.aiVideoClip.generatedAt}
                src={currentFrame.aiVideoClip.videoUrl}
                crossOrigin="anonymous"
                controls
                loop
                autoPlay
                muted
                className="w-full aspect-[16/9] rounded-2xl"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-fuchsia-600/90 text-white text-[10px] font-black uppercase flex items-center gap-1 shadow-lg">
                <Film className="w-3 h-3" /> Video AI
              </span>
            </div>
          ) : (
            <div ref={frameStageRef} className="w-full flex justify-center bg-slate-950/60 p-2 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
              <VisualIllustrationRenderer
                frame={currentFrame}
                characters={characters}
                zoomLevel={zoomLevel}
                showOverlayLayer={showOverlay}
              />
              {!currentFrame.aiVideoClip && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg">
                  <Clapperboard className="w-3 h-3" /> Ảnh gốc — chưa có video
                </span>
              )}
            </div>
          )}

          {/* Điều khiển AI Video cho khung đang chọn */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Clapperboard className="w-4 h-4 text-fuchsia-400" />
                Khung {currentFrame.frameId}{' '}
                {currentFrame.aiVideoClip ? (
                  <span className="text-emerald-400">— đã có video AI</span>
                ) : (
                  <span className="text-amber-400">— chưa có video</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentFrame.aiVideoClip && (
                  <button
                    onClick={() => setShowSourceArt((v) => !v)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                  >
                    {showSourceArt ? 'Xem Video' : 'Xem Ảnh Gốc'}
                  </button>
                )}
                <button
                  onClick={handleGenerateAiVideo}
                  disabled={(aiVideoStatus !== 'idle' && aiVideoStatus !== 'error') || bulkRunning}
                  className="px-3 py-1.5 rounded-xl bg-fuchsia-600/30 hover:bg-fuchsia-600/50 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  {aiVideoStatus === 'idle' || aiVideoStatus === 'error' ? (
                    <Sparkles className="w-3.5 h-3.5" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {aiVideoStatus === 'capturing' && 'Đang chụp khung...'}
                  {aiVideoStatus === 'submitting' && 'Đang gửi AI Video...'}
                  {aiVideoStatus === 'polling' && 'AI đang dựng video (~1-3 phút)...'}
                  {(aiVideoStatus === 'idle' || aiVideoStatus === 'error') &&
                    (currentFrame.aiVideoClip ? 'Tạo Lại Video Này' : 'AI Sinh Video Cho Khung Này')}
                </button>
              </div>
            </div>

            {aiVideoError && (
              <p className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                {aiVideoError}
              </p>
            )}
          </div>

          {/* Filmstrip of all frames */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider">
                Dải Khung Hình Toàn Bộ Truyện ({allFrames.length} Frames):
              </span>
              <span>Khung {selectedFrameIndex + 1} / {allFrames.length}</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {allFrames.map(({ frame }, idx) => {
                const isSelected = idx === selectedFrameIndex;
                const isProcessingThis = bulkRunning && bulkProgress.currentFrameId === frame.frameId;
                return (
                  <button
                    key={frame.frameId}
                    onClick={() => setSelectedFrameIndex(idx)}
                    className={`shrink-0 w-28 rounded-xl p-2 border transition-all text-left cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 border-fuchsia-400 ring-2 ring-fuchsia-500/50 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-black text-cyan-400 block">
                      {frame.frameId}
                    </span>
                    <span className="text-[11px] text-white font-bold block line-clamp-1 mt-0.5">
                      {frame.title || `Khung ${idx + 1}`}
                    </span>
                    <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                      <span>{frame.speechBubbles.length} thoại</span>
                      {isProcessingThis ? (
                        <Loader2 className="w-3 h-3 text-fuchsia-400 animate-spin" />
                      ) : frame.aiVideoClip ? (
                        <Film className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Clapperboard className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Prompt Inspector & Consistency Audit */}
        <div className="space-y-4">
          {/* Subtabs */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chi Tiết Khung
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'prompt'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cấu Trúc Prompt
            </button>
            <button
              onClick={() => setActiveTab('consistency')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'consistency'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kiểm Tra Nhất Quán
            </button>
          </div>

          {/* Subtab 1: Details */}
          {activeTab === 'preview' && (
            <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Thành Phần Của Khung Hình:
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Hành Động:</span>
                  <p className="text-slate-200 font-medium mt-0.5">{currentFrame.visualAction}</p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bối Cảnh & Đạo Cụ:</span>
                  <p className="text-slate-200 font-medium mt-0.5">{currentFrame.backgroundName}</p>
                </div>

                {currentFrame.captionText && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Caption Dẫn Truyện:</span>
                    <p className="text-cyan-200 font-medium mt-0.5">{currentFrame.captionText}</p>
                  </div>
                )}

                {currentFrame.mathFormulaLayer && (
                  <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/40">
                    <span className="text-amber-400 block text-[10px] uppercase font-bold">Layer Toán Học KaTeX:</span>
                    <code className="text-xs text-amber-200 font-mono mt-1 block">
                      {currentFrame.mathFormulaLayer.latex}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab 2: Complete Prompt Structure (As required in prompt) */}
          {activeTab === 'prompt' && (
            <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Cấu Trúc Prompt Chuẩn
                </h3>
              </div>

              <div className="space-y-2 text-xs max-h-[420px] overflow-y-auto pr-1">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Character:</span>
                  <p className="text-slate-300 mt-0.5 font-mono text-[11px] leading-relaxed">
                    {currentFrame.promptDetails.character}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Environment:</span>
                  <p className="text-slate-300 mt-0.5 font-mono text-[11px]">
                    {currentFrame.promptDetails.environment}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Camera & Composition:</span>
                  <p className="text-slate-300 mt-0.5 font-mono text-[11px]">
                    {currentFrame.promptDetails.camera} • {currentFrame.promptDetails.composition}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Lighting & Emotion:</span>
                  <p className="text-slate-300 mt-0.5 font-mono text-[11px]">
                    {currentFrame.promptDetails.lighting} • {currentFrame.promptDetails.emotion}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">Consistency Information:</span>
                  <p className="text-slate-300 mt-0.5 font-mono text-[11px]">
                    {currentFrame.promptDetails.consistencyInfo}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-cyan-500/40">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                    <Video className="w-3 h-3" /> Video Motion Prompt (Tạo Hoạt Cảnh):
                  </span>
                  <p className="text-emerald-200 mt-1 font-mono text-[11px] leading-relaxed">
                    {currentFrame.promptDetails.videoPrompt}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: 5-Point Consistency Audit */}
          {activeTab === 'consistency' && (
            <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Hệ Thống Kiểm Tra Nhất Quán
                </h3>
                <button
                  onClick={handleRunConsistencyCheck}
                  disabled={isAuditing}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} /> {isAuditing ? 'AI Đang Kiểm Tra...' : 'Kiểm Tra Lại'}
                </button>
              </div>

              {auditError && (
                <p className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                  {auditError}
                </p>
              )}

              {/* 5 Criteria Gauges */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-300">1. Character Consistency (Nhân vật)</span>
                    <span className="text-emerald-400 font-mono">{consistency.characterScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${consistency.characterScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-300">2. Scene Consistency (Bối cảnh)</span>
                    <span className="text-cyan-400 font-mono">{consistency.sceneScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${consistency.sceneScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-300">3. Object Consistency (Đạo cụ)</span>
                    <span className="text-amber-400 font-mono">{consistency.objectScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${consistency.objectScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-300">4. Educational Accuracy (Kiến thức GDPT)</span>
                    <span className="text-purple-400 font-mono">{consistency.accuracyScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-400 h-full rounded-full"
                      style={{ width: `${consistency.accuracyScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-300">5. Story Continuity (Mạch truyện)</span>
                    <span className="text-blue-400 font-mono">{consistency.continuityScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full"
                      style={{ width: `${consistency.continuityScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Feedback box */}
              <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-200 leading-relaxed">
                <strong>Đánh giá của AI:</strong> {consistency.feedback}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrevStep}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          ← Quay Lại Bước 5
        </button>

        <button
          onClick={onNextStep}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-900/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Tiếp Tục Bước 7: Lời Bình, Hội Thoại & Audio Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};