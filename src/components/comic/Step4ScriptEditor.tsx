import React, { useState } from 'react';
import { ComicScene, CharacterProfile, LessonKnowledgeProfile, StoryKernel } from '../../types/comicLesson';
import {
  Film,
  Sparkles,
  Edit,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Clock,
  MessageSquare,
  Smile,
  Video,
  Wand2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

interface Step4ScriptEditorProps {
  scenes: ComicScene[];
  characters: CharacterProfile[];
  onUpdateScenes: (scenes: ComicScene[]) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  knowledgeProfile?: LessonKnowledgeProfile;
  storyKernel?: StoryKernel;
}

export const Step4ScriptEditor: React.FC<Step4ScriptEditorProps> = ({
  scenes,
  characters,
  onUpdateScenes,
  onNextStep,
  onPrevStep,
  knowledgeProfile,
  storyKernel,
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [aiWorkingMode, setAiWorkingMode] = useState<string | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptGenError, setScriptGenError] = useState<string | null>(null);

  // AI Generate the entire 8-scene script from the knowledge profile + story kernel
  const handleGenerateFullScript = async () => {
    if (!knowledgeProfile || !storyKernel) {
      setScriptGenError('Cần hoàn tất Bước 1 & 2 trước khi AI sinh kịch bản.');
      return;
    }
    if (scenes.length > 0 && !confirm('AI sẽ tạo lại TOÀN BỘ 8 cảnh và ghi đè kịch bản hiện tại. Tiếp tục?')) {
      return;
    }
    setIsGeneratingScript(true);
    setScriptGenError(null);
    try {
      const res = await fetch('/api/comic/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeProfile, storyKernel, characters }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.scenes) && data.scenes.length > 0) {
        onUpdateScenes(data.scenes);
        setSelectedSceneIndex(0);
      } else {
        setScriptGenError(data.error || 'AI không thể tạo kịch bản lúc này. Vui lòng thử lại.');
      }
    } catch {
      setScriptGenError('Lỗi kết nối tới máy chủ AI. Vui lòng thử lại.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const currentScene = scenes[selectedSceneIndex] || scenes[0];

  const handleUpdateScene = (updatedFields: Partial<ComicScene>) => {
    const updated = [...scenes];
    updated[selectedSceneIndex] = {
      ...updated[selectedSceneIndex],
      ...updatedFields,
    };
    onUpdateScenes(updated);
  };

  // 6 Specialized AI Assistant Functions
  const handleAiAction = async (
    actionType: 'rewrite' | 'shorten' | 'humor' | 'grade6' | 'grade9' | 'knowledgeCheck'
  ) => {
    setAiWorkingMode(actionType);
    try {
      const res = await fetch('/api/comic/ai-edit-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          scene: currentScene,
          knowledgeProfile,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedScene) {
          handleUpdateScene(data.updatedScene);
        }
      } else {
        // Fallback local pedagogical refinement
        if (actionType === 'humor') {
          const newDialogue = [...currentScene.dialogue];
          newDialogue.push({
            characterId: 'char-nam',
            characterName: 'Nam',
            text: 'Haha, nếu không đo được chắc tớ phải thuê trực thăng thả thước dây xuống quá!',
            emotion: 'Hài hước',
          });
          handleUpdateScene({ dialogue: newDialogue });
        } else if (actionType === 'shorten') {
          handleUpdateScene({
            narration: currentScene.narration.slice(0, 80) + '...',
            estimatedDurationSec: Math.max(5, currentScene.estimatedDurationSec - 2),
          });
        } else if (actionType === 'grade6') {
          handleUpdateScene({
            educationalGoal: currentScene.educationalGoal + ' (Được đơn giản hóa trực quan cho lớp 6)',
          });
        }
      }
    } catch {
      console.log('AI action fallback');
    } finally {
      setTimeout(() => setAiWorkingMode(null), 400);
    }
  };

  const getSceneTypeBadge = (type: ComicScene['sceneType']) => {
    const map: Record<string, { label: string; color: string }> = {
      opening: { label: 'Cảnh 1: Mở Đầu', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
      problem: { label: 'Cảnh 2: Xuất Hiện Vấn Đề', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
      questioning: { label: 'Cảnh 3: Đặt Câu Hỏi', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
      hypothesis: { label: 'Cảnh 4: Thử Nghiệm / Suy Luận', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
      discovery: { label: 'Cảnh 5: Khám Phá Kiến Thức', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
      application: { label: 'Cảnh 6: Áp Dụng Thực Tiễn', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
      result: { label: 'Cảnh 7: Kết Quả', color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
      summary: { label: 'Cảnh 8: Chốt Kiến Thức', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
    };
    return map[type] || { label: 'Cảnh Truyện', color: 'text-slate-400 border-slate-700 bg-slate-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs uppercase tracking-wider border border-emerald-400/40">
              BƯỚC 4 — VIẾT KỊCH BẢN TRUYỆN TRANH (8 CẢNH CHUẨN)
            </span>
            <span className="text-xs text-slate-400 font-medium">Cấu Trúc Sư Phạm GDPT 2018</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Biên Kịch Từng Cảnh: Lời Bình, Hội Thoại, Hành Động & Video
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Mỗi cảnh được thiết kế chặt chẽ theo 8 giai đoạn nhận thức: từ xuất hiện vấn đề, thử nghiệm, khám phá định lý, đến thực hành đo đạc và chốt kiến thức.
          </p>
        </div>

        {/* AI Full-Script Generation + 6 Quick Assistant Buttons */}
        <div className="flex flex-col items-end gap-2 shrink-0 max-w-md">
          <button
            onClick={handleGenerateFullScript}
            disabled={isGeneratingScript}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingScript ? 'animate-spin' : ''}`} />
            {isGeneratingScript ? 'AI Đang Viết Kịch Bản 8 Cảnh...' : 'AI Sinh Toàn Bộ Kịch Bản 8 Cảnh'}
          </button>
          {scriptGenError && (
            <p className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-1 text-right">
              {scriptGenError}
            </p>
          )}
        <div className="flex flex-wrap gap-1.5 justify-end">
          <button
            onClick={() => handleAiAction('rewrite')}
            disabled={!!aiWorkingMode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600/30 border border-slate-700 hover:border-cyan-400 text-xs font-bold text-slate-300 hover:text-cyan-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" /> AI Viết Lại
          </button>
          <button
            onClick={() => handleAiAction('shorten')}
            disabled={!!aiWorkingMode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-400 text-xs font-bold text-slate-300 hover:text-amber-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" /> AI Rút Gọn
          </button>
          <button
            onClick={() => handleAiAction('humor')}
            disabled={!!aiWorkingMode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 border border-slate-700 hover:border-purple-400 text-xs font-bold text-slate-300 hover:text-purple-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Smile className="w-3 h-3 text-purple-400" /> AI Làm Hài Hước
          </button>
          <button
            onClick={() => handleAiAction('grade6')}
            disabled={!!aiWorkingMode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-400 text-xs font-bold text-slate-300 hover:text-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Wand2 className="w-3 h-3 text-emerald-400" /> AI Hợp Lớp 6
          </button>
          <button
            onClick={() => handleAiAction('grade9')}
            disabled={!!aiWorkingMode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-400 text-xs font-bold text-slate-300 hover:text-blue-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Wand2 className="w-3 h-3 text-blue-400" /> AI Nâng Cấp Lớp 9
          </button>
          <button
            onClick={() => handleAiAction('knowledgeCheck')}
            disabled={!!aiWorkingMode}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-all flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3" /> AI Kiểm Tra Kiến Thức
          </button>
        </div>
        </div>
      </div>

      {/* Main Container: 8 Scene Tabs on Top / Side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Scene Timeline List */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">
            Kịch Bản 8 Cảnh Chuẩn ({scenes.length} Cảnh)
          </span>

          <div className="space-y-2">
            {scenes.map((scene, idx) => {
              const isSelected = idx === selectedSceneIndex;
              const badge = getSceneTypeBadge(scene.sceneType);

              return (
                <div
                  key={scene.sceneId}
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badge.color}`}>
                      {scene.sceneId} • CẢNH {scene.sceneNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {scene.estimatedDurationSec}s
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {scene.sceneName}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {scene.educationalGoal}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Scene Script Editor */}
        {currentScene && (
          <div className="lg:col-span-3 eduverse-glass p-6 rounded-2xl border border-slate-800 space-y-5">
            {/* Top Scene Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/40">
                  {currentScene.sceneId}
                </span>
                <input
                  type="text"
                  value={currentScene.sceneName}
                  onChange={(e) => handleUpdateScene({ sceneName: e.target.value })}
                  className="text-base font-black text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Thời lượng:</span>
                  <input
                    type="number"
                    value={currentScene.estimatedDurationSec}
                    onChange={(e) =>
                      handleUpdateScene({ estimatedDurationSec: Number(e.target.value) })
                    }
                    className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                  />
                  <span>giây</span>
                </div>
              </div>
            </div>

            {/* Field 1: Educational Goal */}
            <div>
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Mục Tiêu Giáo Dục Của Cảnh:
              </label>
              <textarea
                rows={2}
                value={currentScene.educationalGoal}
                onChange={(e) => handleUpdateScene({ educationalGoal: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 leading-relaxed resize-none"
              />
            </div>

            {/* Field 2: Environment & Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Bối Cảnh (Environment)
                </label>
                <input
                  type="text"
                  value={currentScene.environmentName}
                  onChange={(e) => handleUpdateScene({ environmentName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Đạo Cụ / Dụng Cụ (Props)
                </label>
                <input
                  type="text"
                  value={currentScene.props.join(', ')}
                  onChange={(e) =>
                    handleUpdateScene({
                      props: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  placeholder="Thước cuộn, cọc gỗ 1m, sổ tay..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            {/* Field 3: Narration (Lời bình người dẫn truyện) */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" /> Lời Bình Người Dẫn Truyện (Narration Voiceover):
              </label>
              <textarea
                rows={2}
                value={currentScene.narration}
                onChange={(e) => handleUpdateScene({ narration: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/60 leading-relaxed resize-none font-medium"
              />
            </div>

            {/* Field 4: Dialogue Lines (Hội thoại các nhân vật) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Hội Thoại Các Nhân Vật (Dialogue):
                </label>

                <button
                  onClick={() => {
                    const newDialogue = [
                      ...currentScene.dialogue,
                      {
                        characterId: characters[0]?.id || 'char-minh',
                        characterName: characters[0]?.name || 'Minh',
                        text: 'Ý tưởng mới xuất hiện nè!',
                      },
                    ];
                    handleUpdateScene({ dialogue: newDialogue });
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold flex items-center gap-1 border border-amber-500/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Thêm Câu Thoại
                </button>
              </div>

              <div className="space-y-2">
                {currentScene.dialogue.map((diag, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                  >
                    <select
                      value={diag.characterId}
                      onChange={(e) => {
                        const next = [...currentScene.dialogue];
                        const matched = characters.find((c) => c.id === e.target.value);
                        next[dIdx] = {
                          ...next[dIdx],
                          characterId: e.target.value,
                          characterName: matched?.name || 'Nhân vật',
                        };
                        handleUpdateScene({ dialogue: next });
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-bold focus:outline-none"
                    >
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.grade})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={diag.text}
                      onChange={(e) => {
                        const next = [...currentScene.dialogue];
                        next[dIdx] = { ...next[dIdx], text: e.target.value };
                        handleUpdateScene({ dialogue: next });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 font-medium"
                    />

                    {currentScene.dialogue.length > 1 && (
                      <button
                        onClick={() => {
                          const next = currentScene.dialogue.filter((_, idx) => idx !== dIdx);
                          handleUpdateScene({ dialogue: next });
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Field 5: Action & Video Motion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Hành Động Của Nhân Vật (Action)
                </label>
                <textarea
                  rows={2}
                  value={currentScene.actionDescription}
                  onChange={(e) => handleUpdateScene({ actionDescription: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-600 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <Video className="w-3 h-3 text-cyan-400" /> Chuyển Động Máy Quay Video (Motion)
                </label>
                <textarea
                  rows={2}
                  value={currentScene.videoMotion}
                  onChange={(e) => handleUpdateScene({ videoMotion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrevStep}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          ← Quay Lại Bước 3
        </button>

        <button
          onClick={onNextStep}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Tiếp Tục Bước 5: Bảng Duyệt Storyboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};