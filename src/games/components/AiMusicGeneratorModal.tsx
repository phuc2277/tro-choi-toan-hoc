import React, { useState, useEffect } from 'react';
import { aiMusicPlayer, MusicComposition } from '../services/AiMusicService';
import {
  Music,
  Play,
  Square,
  Sparkles,
  Volume2,
  VolumeX,
  Repeat,
  Loader2,
  X,
  Wand2,
  Download,
  Flame,
  CheckCircle,
  Radio,
} from 'lucide-react';

interface AiMusicGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PROMPTS = [
  {
    title: 'Hồi Hộp Ai Là Triệu Phú',
    prompt: 'Suspenseful dramatic orchestral quiz show background music with deep bass pulses and ticking clock tension',
    icon: '💡',
  },
  {
    title: 'Chiến Thắng Rực Rỡ',
    prompt: 'Triumphant celebratory victory fanfare with bright brass horns, joyful melody and cheering vibes',
    icon: '🏆',
  },
  {
    title: 'Vòng Quay May Mắn',
    prompt: 'Upbeat carnival game show wheel spinning music, cheerful marimba and playful energetic brass',
    icon: '🎡',
  },
  {
    title: 'Đua Xe Tốc Độ Cao',
    prompt: 'Fast-paced energetic synthwave electronic gaming soundtrack with driving bass and arcade arpeggios',
    icon: '🏎️',
  },
  {
    title: 'Tập Trung Giải Toán',
    prompt: 'Gentle lofi calm ambient focus music for solving mathematics equations with peaceful chords',
    icon: '📐',
  },
  {
    title: 'Rung Chuông Vàng Hào Hùng',
    prompt: 'Grand epic arena championship battle music with energetic percussion and heroic brass anthem',
    icon: '🔔',
  },
];

export const AiMusicGeneratorModal: React.FC<AiMusicGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [prompt, setPrompt] = useState<string>(PRESET_PROMPTS[0].prompt);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedInfo, setLastGeneratedInfo] = useState<{
    title?: string;
    model?: string;
    mood?: string;
    tempo?: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      aiMusicPlayer.stop();
    };
  }, []);

  if (!isOpen) return null;

  const handleGenerate = async (targetPrompt?: string) => {
    const activePrompt = targetPrompt || prompt;
    if (!activePrompt.trim()) return;

    aiMusicPlayer.stop();
    setIsPlaying(false);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          durationSeconds: 30,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Lỗi tạo nhạc từ server');
      }

      if (data.audioBase64) {
        aiMusicPlayer.playBlobAudio(data.audioBase64, data.mimeType || 'audio/wav');
        setIsPlaying(true);
        setLastGeneratedInfo({
          title: 'Bản nhạc AI (Lyria)',
          model: data.model || 'lyria-3-clip-preview',
        });
      } else if (data.composition) {
        const comp: MusicComposition = data.composition;
        aiMusicPlayer.playComposition(comp, isLooping);
        setIsPlaying(true);
        setLastGeneratedInfo({
          title: comp.title || 'Giai điệu AI Toán học',
          model: 'Gemini Synth Synthesizer',
          mood: comp.mood,
          tempo: comp.tempo,
        });
      }
    } catch (err: any) {
      console.error('Music generate error:', err);
      setError(err.message || 'Không thể tạo nhạc AI lúc này.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      aiMusicPlayer.stop();
      setIsPlaying(false);
    } else {
      handleGenerate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161B22] border-2 border-purple-500/40 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            aiMusicPlayer.stop();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Tạo Nhạc Trò Chơi Bằng AI</span>
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                Lyria & Synth
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Tạo nhạc nền độc quyền, giai điệu hào hứng cho lớp học & sàn đấu Toán học
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Mẫu nhạc gợi ý theo trò chơi:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_PROMPTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(preset.prompt);
                  handleGenerate(preset.prompt);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-1.5 ${
                  prompt === preset.prompt
                    ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-md shadow-purple-500/20'
                    : 'bg-[#21262D] border-[#30363D] hover:border-purple-500/50 hover:bg-[#282e38] text-gray-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  <span>{preset.icon}</span>
                  <span className="line-clamp-1">{preset.title}</span>
                </div>
                <span className="text-[10px] text-gray-400 line-clamp-1">
                  Nhấn để tạo & phát
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Tùy chỉnh phong cách âm nhạc (Prompt):</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Mô tả phong cách âm nhạc bạn muốn AI sáng tác (ví dụ: nhạc chiến thắng vui tươi, nhạc sôi động đếm ngược...)"
            className="w-full bg-[#0A0E17] border-2 border-[#30363D] focus:border-purple-500 rounded-2xl p-3.5 text-sm text-white placeholder-gray-500 focus:outline-none transition"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Generated Track Info & Visualizer */}
        {lastGeneratedInfo && (
          <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isPlaying ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-[#21262D] text-gray-400'}`}>
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lastGeneratedInfo.title}</span>
                  {lastGeneratedInfo.mood && (
                    <span className="text-[10px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                      {lastGeneratedInfo.mood}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2 font-mono">
                  <span>Model: {lastGeneratedInfo.model}</span>
                  {lastGeneratedInfo.tempo && <span>• {lastGeneratedInfo.tempo} BPM</span>}
                </div>
              </div>
            </div>

            {/* Loop Toggle */}
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                isLooping
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                  : 'bg-[#21262D] border-[#30363D] text-gray-400'
              }`}
              title="Lặp lại bản nhạc"
            >
              <Repeat className="w-4 h-4" />
              <span className="hidden sm:inline">Lặp lại</span>
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleGenerate()}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang Sáng Tác Âm Nhạc AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Tạo Nhạc AI Mới</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`p-3.5 rounded-2xl border-2 font-bold transition flex items-center justify-center gap-2 ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 border-rose-400 text-white shadow-lg shadow-rose-500/30'
                : 'bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-white'
            }`}
            title={isPlaying ? 'Dừng phát' : 'Phát nhạc'}
          >
            {isPlaying ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span className="text-xs font-black">Dừng</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span className="text-xs font-black">Phát</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
