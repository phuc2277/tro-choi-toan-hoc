import React, { useState } from 'react';
import { ComicScene, CharacterProfile } from '../../types/comicLesson';
import {
  Mic,
  Volume2,
  Music,
  Sparkles,
  Clock,
  Play,
  Square,
  CheckCircle2,
  ArrowRight,
  Sliders,
  VolumeX,
} from 'lucide-react';

interface Step7AudioDirectorProps {
  scenes: ComicScene[];
  characters: CharacterProfile[];
  onUpdateScenes: (scenes: ComicScene[]) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export const Step7AudioDirector: React.FC<Step7AudioDirectorProps> = ({
  scenes,
  characters,
  onUpdateScenes,
  onNextStep,
  onPrevStep,
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [bgmVolume, setBgmVolume] = useState<number>(40);
  const [selectedBgm, setSelectedBgm] = useState<string>('bright-school-acoustic');

  const currentScene = scenes[selectedSceneIndex] || scenes[0];

  // Web Speech API Voice synthesis
  const speakText = (text: string, voiceType: 'narrator' | 'male' | 'female' = 'narrator') => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API.');
      return;
    }

    window.speechSynthesis.cancel();
    if (speakingText === text) {
      setSpeakingText(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';

    if (voiceType === 'female') {
      utterance.pitch = 1.2;
      utterance.rate = 1.0;
    } else if (voiceType === 'male') {
      utterance.pitch = 0.9;
      utterance.rate = 1.05;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 0.95;
    }

    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = () => setSpeakingText(null);

    setSpeakingText(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleUpdateSceneAudio = (partial: Partial<ComicScene>) => {
    const updated = [...scenes];
    updated[selectedSceneIndex] = {
      ...updated[selectedSceneIndex],
      ...partial,
    };
    onUpdateScenes(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/40 via-emerald-950/30 to-slate-900 border border-teal-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-xs uppercase tracking-wider border border-teal-400/40">
              BƯỚC 7 — ĐẠO DIỄN ÂM THANH & LỜI BÌNH
            </span>
            <span className="text-xs text-slate-400 font-medium">Narration, Dialogue & SFX</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Thiết Kế Lời Bình, Giọng Nhân Vật & Nhạc Nền
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Mỗi cảnh được phân bổ chuẩn thời lượng: Lời dẫn chuyện truyền cảm, giọng đối thoại từng học sinh, hiệu ứng âm thanh sân trường và nhạc nền nhẹ nhàng.
          </p>
        </div>

        {/* Global BGM Control */}
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-3 shrink-0">
          <Music className="w-4 h-4 text-teal-400" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nhạc Nền (BGM):</span>
            <span className="text-xs font-bold text-white">Âm Hưởng Học Đường Vui Tươi</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="range"
              min="0"
              max="100"
              value={bgmVolume}
              onChange={(e) => setBgmVolume(Number(e.target.value))}
              className="w-16 accent-teal-400 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-slate-400">{bgmVolume}%</span>
          </div>
        </div>
      </div>

      {/* Main Studio View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 1 Col: Scene Selector */}
        <div className="space-y-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">
            Chọn Cảnh ({scenes.length} Cảnh):
          </span>

          <div className="space-y-2">
            {scenes.map((scene, idx) => {
              const isSelected = idx === selectedSceneIndex;
              return (
                <div
                  key={scene.sceneId}
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.25)] ring-1 ring-teal-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span className="text-teal-400">{scene.sceneId}</span>
                    <span className="font-mono">{scene.estimatedDurationSec}s</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{scene.sceneName}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{scene.narration}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 3 Cols: Audio Track Manager for Scene */}
        {currentScene && (
          <div className="lg:col-span-3 eduverse-glass p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase font-mono">
                  {currentScene.sceneId} • {currentScene.sceneName}
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Cấu Trúc Audio & Lời Thoại Của Cảnh
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Tổng thời lượng:</span>
                <span className="font-bold text-white text-sm">
                  {currentScene.estimatedDurationSec} giây
                </span>
              </div>
            </div>

            {/* Track 1: Narration (Người dẫn chuyện) */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-teal-300 uppercase tracking-wider">
                    Track 1: Lời Dẫn Chuyện (Narration)
                  </span>
                </div>

                <button
                  onClick={() => speakText(currentScene.narration, 'narrator')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    speakingText === currentScene.narration
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-teal-600/20 text-teal-300 hover:bg-teal-600/40 border border-teal-500/30'
                  }`}
                >
                  {speakingText === currentScene.narration ? (
                    <>
                      <Square className="w-3 h-3" /> Dừng Phát
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Nghe Giọng Đọc
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={2}
                value={currentScene.narration}
                onChange={(e) => handleUpdateSceneAudio({ narration: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500/60 leading-relaxed resize-none font-medium"
              />
            </div>

            {/* Track 2: Dialogue Lines (Hội thoại từng nhân vật) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5" /> Track 2: Hội Thoại Nhân Vật (Dialogue)
                </span>
                <span className="text-xs text-slate-400">
                  {currentScene.dialogue.length} câu thoại
                </span>
              </div>

              <div className="space-y-2.5">
                {currentScene.dialogue.map((item, dIdx) => {
                  const char = characters.find((c) => c.id === item.characterId);
                  const isSpeakingThis = speakingText === item.text;

                  return (
                    <div
                      key={dIdx}
                      className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md"
                          style={{ backgroundColor: char?.signatureColor || '#0284c7' }}
                        >
                          {char?.name[0] || 'NV'}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-black"
                              style={{ color: char?.signatureColor || '#38bdf8' }}
                            >
                              {item.characterName || char?.name}:
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (Giọng {char?.gender === 'female' ? 'Nữ THCS' : 'Nam THCS'})
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-200 mt-0.5">
                            “{item.text}”
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          speakText(item.text, char?.gender === 'female' ? 'female' : 'male')
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          isSpeakingThis
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-300 hover:bg-cyan-600 hover:text-white'
                        }`}
                      >
                        {isSpeakingThis ? (
                          <>
                            <Square className="w-3 h-3" /> Dừng
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" /> Nghe Thử
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Track 3: Sound Effects (SFX) & Timeline breakdown */}
            <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-black text-purple-300 uppercase tracking-wider block">
                Track 3: Hiệu Ứng Âm Thanh (Sound Effects - SFX)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px]">SFX Đầu Cảnh:</span>
                  <span className="text-purple-300 font-bold">Tiếng chim hót & gió nhẹ</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px]">SFX Cao Trào:</span>
                  <span className="text-amber-300 font-bold">Tiếng ding! ý tưởng lóe sáng</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px]">SFX Kết Cảnh:</span>
                  <span className="text-emerald-300 font-bold">Tiếng reo hò đập tay ăn mừng</span>
                </div>
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
          ← Quay Lại Bước 6
        </button>

        <button
          onClick={onNextStep}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-teal-900/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Tiến Hành Hoàn Tất & Xem Video / Đọc Truyện (Bước 8)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
