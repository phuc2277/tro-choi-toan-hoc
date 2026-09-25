import React, { useState, useRef } from 'react';
import { ComicScene, ComicFrame, CharacterProfile, ComicArtStyle, LessonKnowledgeProfile } from '../../types/comicLesson';
import { VisualIllustrationRenderer } from './VisualIllustrationRenderer';
import { toPng } from 'html-to-image';
import { uploadFrameImage, uploadFrameVideo, uploadCharacterReference, fetchImageAsBase64 } from './comicStorage';
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
} from 'lucide-react';
interface Step6ComicArtStudioProps {
  scenes: ComicScene[];
  characters: CharacterProfile[];
  onUpdateCharacters: (characters: CharacterProfile[]) => void;
  projectId: string;   // <-- THÊM DÒNG NÀY: dùng làm đường dẫn lưu ảnh/video trên Firebase Storage
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
  onUpdateCharacters,
  projectId,   // <-- THÊM VÀO DANH SÁCH PROPS NHẬN VÀO
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

  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'prompt' | 'consistency'>('preview');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const frameStageRef = useRef<HTMLDivElement | null>(null);
  const [aiVideoStatus, setAiVideoStatus] = useState<'idle' | 'capturing' | 'submitting' | 'polling' | 'error'>('idle');
  const [aiVideoError, setAiVideoError] = useState<string | null>(null);
  const [bulkVideoRunning, setBulkVideoRunning] = useState(false);
  const [bulkVideoProgress, setBulkVideoProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [forceRegenerateVideo, setForceRegenerateVideo] = useState(false);
   const [bulkImageRunning, setBulkImageRunning] = useState(false);
  const [bulkImageProgress, setBulkImageProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkImageError, setBulkImageError] = useState<string | null>(null);
const [charRefRunning, setCharRefRunning] = useState(false);
const [charRefProgress, setCharRefProgress] = useState<{ current: number; total: number } | null>(null);
const [charRefError, setCharRefError] = useState<string | null>(null);
  // Tạo ảnh chân dung tham chiếu cho các nhân vật CHƯA có ảnh — dùng làm ảnh gốc
// để giữ nhất quán ngoại hình khi tạo ảnh khung hình ở bước sau.
const handleGenerateCharacterReferences = async () => {
  setCharRefRunning(true);
  setCharRefError(null);
  const missing = characters.filter((c) => !c.referenceImage);
  let updatedCharacters = characters;
  for (let i = 0; i < missing.length; i++) {
    const char = missing[i];
    setCharRefProgress({ current: i + 1, total: missing.length });
    try {
      const res = await fetch('/api/comic/generate-character-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: char }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageBase64) {
        throw new Error(data.error || 'AI không trả về ảnh tham chiếu.');
      }
      // Upload lên Firebase Storage, chỉ lưu URL vào state (không giữ base64 nặng).
      const imageUrl = await uploadCharacterReference(projectId, char.id, data.imageBase64, data.mimeType || 'image/png');
      updatedCharacters = updatedCharacters.map((c) =>
        c.id !== char.id
          ? c
          : { ...c, referenceImage: { imageUrl, mimeType: data.mimeType || 'image/png', generatedAt: new Date().toISOString() } }
      );
      onUpdateCharacters(updatedCharacters);
    } catch (err: any) {
      const msg = err?.message || 'Lỗi không xác định';
      console.error(`Lỗi tạo ảnh tham chiếu cho ${char.name}:`, err);
      if (/RESOURCE_EXHAUSTED|429|quota|NOT_FOUND|API key|403|401/i.test(msg)) {
        setCharRefError(`Dừng tạo ảnh tham chiếu ở nhân vật ${char.name}: ${msg}`);
        break;
      }
      setCharRefError(`Nhân vật ${char.name} lỗi: ${msg}`);
    }
  }
  setCharRefProgress(null);
  setCharRefRunning(false);
};
  const currentPair = allFrames[selectedFrameIndex] || allFrames[0];
  const currentFrame = currentPair?.frame;
  const currentScene = currentPair?.scene;

  const updateCurrentFrame = (partial: Partial<ComicFrame>) => {
    if (!currentScene || !currentFrame) return;
    const updated = scenes.map((s) => {
      if (s.sceneId !== currentScene.sceneId) return s;
      return {
        ...s,
        frames: s.frames.map((f) => (f.frameId === currentFrame.frameId ? { ...f, ...partial } : f)),
      };
    });
    onUpdateScenes(updated);
  };

  // AI Video (Veo): sinh video chuyển động thật từ ảnh khung hình hiện tại.
  // Chỉ dùng cho khung được đánh dấu "cần chuyển động thực sự" — Bước 8 sẽ ưu tiên
  // dùng clip này thay vì hiệu ứng Ken Burns tĩnh khi xuất video hoàn chỉnh.
  const handleGenerateAiVideo = async () => {
    if (!frameStageRef.current || !currentFrame) return;
    setAiVideoError(null);
    try {
      setAiVideoStatus('capturing');
      const imageDataUrl = await toPng(frameStageRef.current, { pixelRatio: 1, cacheBust: true, skipFonts: true } as any);

      setAiVideoStatus('submitting');
      const startRes = await fetch('/api/comic/generate-frame-video/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mimeType: 'image/png',
          prompt: currentFrame.promptDetails?.videoPrompt || '',
          durationSeconds: 6,
        }),
      });
      const startData = await startRes.json();
      if (!startRes.ok || !startData.operationName) {
        throw new Error(startData.error || 'AI không thể khởi tạo video lúc này.');
      }

      setAiVideoStatus('polling');
      const operationName = startData.operationName;
      const maxAttempts = 30; // ~ 30 * 10s = 5 phút chờ tối đa
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, 10000));
        const statusRes = await fetch('/api/comic/generate-frame-video/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });
        const statusData = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusData.error || 'Lỗi kiểm tra trạng thái AI Video.');
        if (statusData.done) {
          if (statusData.error) throw new Error(statusData.error);
          setAiVideoStatus('polling'); // giữ trạng thái đang xử lý trong lúc upload lên Storage
          const videoUrl = await uploadFrameVideo(
            projectId,
            currentFrame.frameId,
            statusData.videoBase64,
            statusData.mimeType || 'video/mp4'
          );
          updateCurrentFrame({
            aiVideoClip: {
              videoUrl,
              mimeType: statusData.mimeType || 'video/mp4',
              prompt: currentFrame.promptDetails?.videoPrompt || '',
              generatedAt: new Date().toISOString(),
            },
          });
          setAiVideoStatus('idle');
          return;
        }
      }
      throw new Error('AI Video mất quá nhiều thời gian (>5 phút). Vui lòng thử lại sau.');
    } catch (err: any) {
      setAiVideoError(err.message || 'Lỗi không xác định khi tạo AI Video.');
      setAiVideoStatus('error');
    }
  };
    const handleGenerateAllFrameImages = async () => {
  setBulkImageRunning(true);
  setBulkImageError(null);
  let workingScenes = scenes;
  let failed = 0;
  // Cache base64 của ảnh tham chiếu theo nhân vật, để không tải lại nhiều lần khi
  // 1 nhân vật xuất hiện ở nhiều khung.
  const refBase64Cache = new Map<string, { base64: string; mimeType: string }>();
  for (let i = 0; i < allFrames.length; i++) {
    const { scene, frame } = allFrames[i];
    setBulkImageProgress({ current: i + 1, total: allFrames.length });
    if (frame.generatedImage) continue; // đã có ảnh thì bỏ qua

    // Ghép mô tả nhân vật + ảnh tham chiếu (nếu đã tạo ở Bước 0) để AI vẽ đúng ngoại hình.
    // Ảnh tham chiếu giờ chỉ lưu URL trên Storage, nên cần tải lại thành base64 trước
    // khi gửi cho server (Gemini yêu cầu ảnh dạng inline base64, không nhận URL).
    const frameCharacters = (frame.characterIds || [])
      .map((id) => characters.find((c) => c.id === id))
      .filter((c): c is CharacterProfile => !!c);
    const charDesc = frameCharacters.map((c) => `${c.name}: ${c.appearance}; ${c.outfit}`).join(' | ');
    const basePrompt = frame.promptDetails?.fullPrompt || frame.visualAction || frame.title || '';
    const prompt = charDesc ? `${basePrompt}. Characters (keep consistent): ${charDesc}` : basePrompt;

    try {
      const referenceImages: Array<{ imageBase64: string; mimeType: string; characterName: string }> = [];
      for (const c of frameCharacters) {
        if (!c.referenceImage) continue;
        if (!refBase64Cache.has(c.id)) {
          try {
            refBase64Cache.set(c.id, await fetchImageAsBase64(c.referenceImage.imageUrl));
          } catch (fetchErr: any) {
            console.warn(`Không tải được ảnh tham chiếu của ${c.name}, bỏ qua ảnh này:`, fetchErr?.message);
            continue;
          }
        }
        const cached = refBase64Cache.get(c.id);
        if (cached) referenceImages.push({ imageBase64: cached.base64, mimeType: cached.mimeType, characterName: c.name });
      }

      const res = await fetch('/api/comic/generate-frame-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, referenceImages }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageBase64) {
        throw new Error(data.error || 'AI không trả về ảnh.');
      }
      // Upload ảnh vừa tạo lên Firebase Storage, chỉ lưu URL vào state.
      const imageUrl = await uploadFrameImage(projectId, frame.frameId, data.imageBase64, data.mimeType || 'image/png');
      workingScenes = workingScenes.map((s) =>
        s.sceneId !== scene.sceneId
          ? s
          : {
              ...s,
              frames: s.frames.map((f) =>
                f.frameId !== frame.frameId
                  ? f
                  : { ...f, generatedImage: { imageUrl, mimeType: data.mimeType || 'image/png', generatedAt: new Date().toISOString() } }
              ),
            }
      );
      onUpdateScenes(workingScenes);
    } catch (err: any) {
      failed++;
      const msg = err?.message || 'Lỗi không xác định';
      console.error(`Lỗi tạo ảnh 3D cho ${frame.frameId}:`, err);
      // Lỗi quota/key/model sẽ lặp lại ở mọi khung -> dừng luôn
      if (/RESOURCE_EXHAUSTED|429|quota|NOT_FOUND|API key|403|401/i.test(msg)) {
        setBulkImageError(`Dừng tạo ảnh ở ${frame.frameId}: ${msg}`);
        break;
      }
      setBulkImageError(`Khung ${frame.frameId} lỗi: ${msg}`);
    }
  }
  setBulkImageProgress(null);
  setBulkImageRunning(false);
};
  // Tạo AI Video (Veo) cho TOÀN BỘ khung hình trong truyện, lần lượt từng khung một,
  // để đúng nội dung từng cảnh (không dùng chung 1 prompt cho tất cả).
  const handleGenerateAllAiVideos = async () => {
    setBulkVideoRunning(true);
    setAiVideoError(null);
    let workingScenes = scenes;

    for (let i = 0; i < allFrames.length; i++) {
      const { scene, frame } = allFrames[i];

      // Resume thông minh: khung đã có video từ lần chạy trước thì bỏ qua,
      // trừ khi người dùng tick "Tạo lại toàn bộ".
      if (!forceRegenerateVideo && frame.aiVideoClip) {
        continue;
      }

      setSelectedFrameIndex(i);
      setBulkVideoProgress({ current: i + 1, total: allFrames.length, message: `Đang chuẩn bị khung ${frame.frameId}...` });

      // Chờ React vẽ xong khung mới (đổi selectedFrameIndex) trước khi chụp ảnh
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 250));

      if (!frameStageRef.current) continue;

      try {
        setBulkVideoProgress({ current: i + 1, total: allFrames.length, message: `Đang chụp khung ${frame.frameId}...` });
        const imageDataUrl = await toPng(frameStageRef.current, { pixelRatio: 1, cacheBust: true, skipFonts: true } as any);

        setBulkVideoProgress({ current: i + 1, total: allFrames.length, message: `AI đang dựng video cho ${frame.frameId}...` });
        const startRes = await fetch('/api/comic/generate-frame-video/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageDataUrl,
            mimeType: 'image/png',
            prompt: frame.promptDetails?.videoPrompt || '',
            durationSeconds: 6,
          }),
        });
        const startData = await startRes.json();
        if (!startRes.ok || !startData.operationName) {
          throw new Error(startData.error || 'AI không thể khởi tạo video lúc này.');
        }

        const operationName = startData.operationName;
        const maxAttempts = 30; // ~5 phút chờ tối đa cho mỗi khung
        let clip: any = null;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise((r) => setTimeout(r, 10000));
          setBulkVideoProgress({
            current: i + 1,
            total: allFrames.length,
            message: `Đang chờ AI dựng video ${frame.frameId}... (${attempt + 1}0s)`,
          });
          const statusRes = await fetch('/api/comic/generate-frame-video/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });
          const statusData = await statusRes.json();
          if (!statusRes.ok) throw new Error(statusData.error || 'Lỗi kiểm tra trạng thái AI Video.');
          if (statusData.done) {
            if (statusData.error) throw new Error(statusData.error);
            setBulkVideoProgress({ current: i + 1, total: allFrames.length, message: `Đang lưu video ${frame.frameId}...` });
            const videoUrl = await uploadFrameVideo(
              projectId,
              frame.frameId,
              statusData.videoBase64,
              statusData.mimeType || 'video/mp4'
            );
            clip = {
              videoUrl,
              mimeType: statusData.mimeType || 'video/mp4',
              prompt: frame.promptDetails?.videoPrompt || '',
              generatedAt: new Date().toISOString(),
            };
            break;
          }
        }

        if (clip) {
          // Cập nhật đúng khung này trong bản scenes đang làm việc (tránh bị stale state)
          workingScenes = workingScenes.map((s) =>
            s.sceneId !== scene.sceneId
              ? s
              : {
                  ...s,
                  frames: s.frames.map((f) =>
                    f.frameId !== frame.frameId ? f : { ...f, needsAiVideo: true, aiVideoClip: clip }
                  ),
                }
          );
          onUpdateScenes(workingScenes);
        }
      } catch (err: any) {
  console.error(`Lỗi tạo AI Video cho ${frame.frameId}:`, err.message);

  // Lỗi cấu hình (sai model, sai key, hết quota) sẽ lặp lại ở mọi khung -> dừng cả vòng lặp
  if (/NOT_FOUND|not found|API key|quota|403|401/i.test(err.message || '')) {
    setAiVideoError(`Dừng tạo video: ${err.message}`);
    break;
  }

  // Lỗi riêng của 1 khung -> bỏ qua, tiếp tục khung sau
  setAiVideoError(`Khung ${frame.frameId} lỗi: ${err.message || 'không xác định'} (đã bỏ qua, tiếp tục khung sau)`);
}
    }

    setBulkVideoProgress(null);
    setBulkVideoRunning(false);
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

  const pendingVideoFrames = allFrames.filter(({ frame }) => forceRegenerateVideo || !frame.aiVideoClip);
  const doneVideoCount = allFrames.length - pendingVideoFrames.length;
  // Ước tính chi phí Veo: model 'fast' ~ $0.10/giây (720p) trên Gemini API, mỗi khung 6 giây.
  // Đây là số ước tính để tham khảo — giá thực tế có thể thay đổi theo model/độ phân giải,
  // xem giá mới nhất tại https://ai.google.dev/gemini-api/docs/pricing
  const VEO_SECONDS_PER_FRAME = 6;
  const VEO_COST_PER_SECOND_USD = 0.1;
  const estimatedVideoSeconds = pendingVideoFrames.length * VEO_SECONDS_PER_FRAME;
  const estimatedVideoCostUsd = estimatedVideoSeconds * VEO_COST_PER_SECOND_USD;

  // Bảo vệ khỏi trang trắng/crash: nếu dự án chưa có khung hình nào (chưa tạo
  // storyboard ở Bước 5, hoặc scenes rỗng), currentFrame/currentScene sẽ là
  // undefined — hiện thông báo thân thiện thay vì để JSX bên dưới đọc thẳng
  // currentFrame.frameId và làm crash toàn bộ trang.
  if (!currentFrame || !currentScene) {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-center">
          <p className="text-amber-200 font-bold mb-2">Chưa có khung hình nào để hiển thị.</p>
          <p className="text-xs text-slate-400 mb-4">
            Bạn cần tạo storyboard ở Bước 5 trước khi vào Studio Bộ Truyện Tranh.
          </p>
          <button
            onClick={onPrevStep}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            ← Quay Lại Bước 5
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-xs uppercase tracking-wider border border-cyan-400/40">
              BƯỚC 6 — BỘ TRUYỆN TRANH & VISUAL STUDIO
            </span>
            <span className="text-xs text-slate-400 font-medium">Layer Độc Lập + Kiểm Tra Nhất Quán</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Studio Kết Xuất Tranh & Layer Chữ / Công Thức KaTeX
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Các bong bóng thoại và công thức Toán học được đặt trên <strong>layer web riêng biệt</strong> giúp hình ảnh sắc nét, không lỗi chính tả hay lệch ký hiệu. AI tự động kiểm tra 5 tiêu chí nhất quán giữa các cảnh.
          </p>
        </div>

        {/* Art Style Selector */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Phong Cách Mỹ Thuật (Art Style):
          </label>
          <select
            value={artStyle}
            onChange={(e) => onUpdateArtStyle(e.target.value as ComicArtStyle)}
            className="bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:outline-none"
          >
            <option value="modern-comic">🎨 Modern Educational Comic (Chuẩn GDPT)</option>
            <option value="anime">🌟 Anime Giáo Dục Học Đường</option>
            <option value="2d-animation">🎬 Hoạt Hình 2D Điện Ảnh</option>
            <option value="cinematic">🎥 Comic Cinematic High Contrast</option>
            <option value="infographic">📊 Infographic Comic Trực Quan</option>
          </select>
        </div>
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

          {/* The High-Quality Visual Canvas */}
          <div ref={frameStageRef} className="w-full flex justify-center bg-slate-950/60 p-2 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <VisualIllustrationRenderer
              frame={currentFrame}
              characters={characters}
              zoomLevel={zoomLevel}
              showOverlayLayer={showOverlay}
            />
          </div>
                    <div className="mb-4 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-200">
                Bước 0: Tạo Ảnh Tham Chiếu Nhân Vật ({characters.filter((c) => c.referenceImage).length}/{characters.length})
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Làm bước này TRƯỚC bước 1. Ảnh tham chiếu giúp AI giữ đúng ngoại hình từng nhân vật xuyên suốt truyện.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {characters.map((c) => (
                <div key={c.id} className="flex flex-col items-center gap-1 w-16">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                    {c.referenceImage ? (
                      <img
                        src={c.referenceImage.imageUrl}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] text-slate-500 text-center px-1">Chưa có</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate w-full text-center">{c.name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleGenerateCharacterReferences}
              disabled={charRefRunning || characters.every((c) => !!c.referenceImage)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              {charRefRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {charRefRunning
                ? `Đang tạo ảnh tham chiếu... (${charRefProgress?.current}/${charRefProgress?.total})`
                : characters.every((c) => !!c.referenceImage)
                ? 'Đã có đủ ảnh tham chiếu'
                : 'Tạo Ảnh Tham Chiếu Cho Nhân Vật Còn Thiếu'}
            </button>
            {charRefError && <p className="text-xs text-rose-400 mt-2">{charRefError}</p>}
          </div>
                    <div className="mb-4 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-200">Bước 1: Tạo Ảnh Minh Họa 3D AI (thay cho tranh vẽ tay)</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Làm bước này trước, sau đó mới bấm "Tạo Video AI" bên dưới để có video 3D đúng nội dung.</p>
            <button
              onClick={handleGenerateAllFrameImages}
              disabled={bulkImageRunning}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
  
              {bulkImageRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {bulkImageRunning ? `Đang tạo ảnh 3D... (${bulkImageProgress?.current}/${bulkImageProgress?.total})` : 'Tạo Ảnh 3D AI Cho Tất Cả Khung Hình'}
            </button>
            {bulkImageError && <p className="text-xs text-rose-400 mt-2">{bulkImageError}</p>}
          </div>
          {/* Tạo AI Video (Veo) cho TOÀN BỘ truyện, từng khung một */}
          <div className="mb-4 p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Clapperboard className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-purple-200">
                Tạo Video AI (Veo) cho TOÀN BỘ {allFrames.length} khung hình ({doneVideoCount}/{allFrames.length} đã xong)
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Mỗi khung mất 1-5 phút, tổng thời gian có thể lên tới hàng chục phút. Không tắt trình duyệt trong lúc chạy.
              {doneVideoCount > 0 && !forceRegenerateVideo && (
                <> Sẽ chỉ tạo cho {pendingVideoFrames.length} khung còn thiếu, giữ nguyên {doneVideoCount} khung đã có.</>
              )}
            </p>
            <label className="flex items-center gap-2 text-xs text-slate-400 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={forceRegenerateVideo}
                onChange={(e) => setForceRegenerateVideo(e.target.checked)}
                className="accent-purple-500"
              />
              Tạo lại toàn bộ (bỏ qua {doneVideoCount} video đã có — sẽ tốn thêm quota/chi phí)
            </label>
            {pendingVideoFrames.length > 0 && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200">
                💰 Ước tính: {pendingVideoFrames.length} khung × {VEO_SECONDS_PER_FRAME}s = {estimatedVideoSeconds}s video
                Veo, khoảng <strong>${estimatedVideoCostUsd.toFixed(2)}</strong> (giá tham khảo, kiểm tra billing trước khi chạy).
              </div>
            )}
            <button
              onClick={handleGenerateAllAiVideos}
              disabled={bulkVideoRunning || pendingVideoFrames.length === 0}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {bulkVideoRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {bulkVideoRunning
                ? 'Đang tạo video AI...'
                : pendingVideoFrames.length === 0
                ? 'Tất cả khung đã có video'
                : `Tạo Video AI Cho ${pendingVideoFrames.length} Khung Còn Thiếu`}
            </button>
            
            {bulkVideoProgress && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-purple-300 mb-1">
                  <span>{bulkVideoProgress.message}</span>
                  <span>{bulkVideoProgress.current}/{bulkVideoProgress.total}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${(bulkVideoProgress.current / bulkVideoProgress.total) * 100}%` }}
                  />
                  
                </div>
              </div>
            )}
            {aiVideoError && <p className="text-xs text-rose-400 mt-2">{aiVideoError}</p>}
          </div>
          {/* AI Video (Veo) — chỉ dùng cho khung cần chuyển động thực sự */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!currentFrame.needsAiVideo}
                  onChange={(e) => updateCurrentFrame({ needsAiVideo: e.target.checked })}
                  className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
                />
                <Clapperboard className="w-4 h-4 text-fuchsia-400" />
                Khung này cần chuyển động thực sự (AI Video)
              </label>

              {currentFrame.needsAiVideo && (
                <button
                  onClick={handleGenerateAiVideo}
                  disabled={aiVideoStatus !== 'idle' && aiVideoStatus !== 'error'}
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
                    (currentFrame.aiVideoClip ? 'Tạo Lại AI Video' : 'AI Sinh Video Chuyển Động')}
                </button>
              )}
            </div>

            {aiVideoError && (
              <p className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                {aiVideoError}
              </p>
            )}

            {currentFrame.aiVideoClip && (
              <video
                key={currentFrame.aiVideoClip.generatedAt}
                src={currentFrame.aiVideoClip.videoUrl}
                controls
                loop
                muted
                className="w-full max-w-md rounded-xl border border-fuchsia-500/30 mx-auto"
              />
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
                return (
                  <button
                    key={frame.frameId}
                    onClick={() => setSelectedFrameIndex(idx)}
                    className={`shrink-0 w-28 rounded-xl p-2 border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg'
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
                      <span className="text-emerald-400 font-bold">✓</span>
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