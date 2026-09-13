import React, { useState } from 'react';
import { StoryKernel, LessonKnowledgeProfile } from '../../types/comicLesson';
import {
  Compass,
  Sparkles,
  Target,
  ShieldAlert,
  Key,
  Flame,
  Wrench,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface Step2StoryKernelProps {
  storyKernel: StoryKernel;
  knowledgeProfile: LessonKnowledgeProfile;
  onUpdateStoryKernel: (updated: StoryKernel) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export const Step2StoryKernel: React.FC<Step2StoryKernelProps> = ({
  storyKernel,
  knowledgeProfile,
  onUpdateStoryKernel,
  onNextStep,
  onPrevStep,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // AI Suggest Alternative Narrative Hook — calls the real Gemini-backed endpoint
  const handleGenerateCreativeHook = async () => {
    setIsRegenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/comic/generate-story-kernel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeProfile }),
      });
      const data = await res.json();
      if (res.ok && data.storyKernel) {
        onUpdateStoryKernel({
          ...storyKernel,
          ...data.storyKernel,
        });
      } else {
        setGenError(data.error || 'AI không thể tạo tình huống mới. Vui lòng thử lại.');
      }
    } catch {
      setGenError('Lỗi kết nối tới máy chủ AI. Vui lòng thử lại.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-xs uppercase tracking-wider border border-purple-400/40">
              BƯỚC 2 — HẠT NHÂN CÂU CHUYỆN (STORY KERNEL)
            </span>
            <span className="text-xs text-slate-400 font-medium">Biến Lý Thuyết Thành Vấn Đề Thực Tiễn</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Xác Định Tình Huống Thực Tế & Vấn Đề Trung Tâm
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Thay vì giảng dạy giáo điều, bài học được chuyển hóa thành một câu chuyện kịch tính: Nhân vật gặp khó khăn thực tế, và kiến thức bài học xuất hiện như <strong>chiếc chìa khóa duy nhất</strong> để giải quyết vấn đề!
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={handleGenerateCreativeHook}
            disabled={isRegenerating}
            className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'AI Đang Sáng Tạo...' : 'AI Gợi Ý Tình Huống Mới'}</span>
          </button>
          {genError && (
            <p className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-1 max-w-xs text-right">
              {genError}
            </p>
          )}
        </div>
      </div>

      {/* Story Kernel Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Problem Statement */}
        <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <span>1. Vấn Đề Thực Tế Trung Tâm:</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Tình huống mở đầu gây tò mò, gần gũi với lứa tuổi học sinh THCS.
          </p>
          <textarea
            rows={4}
            value={storyKernel.problemStatement}
            onChange={(e) =>
              onUpdateStoryKernel({ ...storyKernel, problemStatement: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 leading-relaxed resize-none"
          />
        </div>

        {/* 2. Goal */}
        <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span>2. Mục Tiêu Cần Đạt Của Nhân Vật:</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Kết quả cụ thể mà các nhân vật phải đạt được trong câu chuyện.
          </p>
          <textarea
            rows={4}
            value={storyKernel.goal}
            onChange={(e) =>
              onUpdateStoryKernel({ ...storyKernel, goal: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 leading-relaxed resize-none"
          />
        </div>

        {/* 3. Obstacles */}
        <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span>3. Trở Ngại / Khó Khăn:</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Vì sao không thể giải quyết bằng các cách thông thường (như trèo cây, kéo thước)?
          </p>
          <textarea
            rows={4}
            value={storyKernel.obstacles}
            onChange={(e) =>
              onUpdateStoryKernel({ ...storyKernel, obstacles: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500/60 leading-relaxed resize-none"
          />
        </div>

        {/* 4. Knowledge to Discover */}
        <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <span>4. Kiến Thức Cần Khám Phá (Chìa Khóa):</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Nội dung bài học cốt lõi giúp vượt qua trở ngại.
          </p>
          <textarea
            rows={4}
            value={storyKernel.knowledgeToDiscover}
            onChange={(e) =>
              onUpdateStoryKernel({ ...storyKernel, knowledgeToDiscover: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 leading-relaxed resize-none"
          />
        </div>

        {/* 5. Climax */}
        <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <span>5. Cao Trào / Nút Thắt Suy Luận:</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Khoảnh khắc "A-ha!" khi nhân vật lóe lên ý tưởng khoa học.
          </p>
          <textarea
            rows={3}
            value={storyKernel.climax}
            onChange={(e) =>
              onUpdateStoryKernel({ ...storyKernel, climax: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 leading-relaxed resize-none"
          />
        </div>

        {/* 6. Resolution & Conclusion */}
        <div className="eduverse-glass p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <span>6. Cách Giải Quyết & Kết Luận Kiến Thức:</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Kết quả số học đo được và bài học khái quát ghi nhớ lâu dài.
          </p>
          <textarea
            rows={3}
            value={storyKernel.resolution}
            onChange={(e) =>
              onUpdateStoryKernel({ ...storyKernel, resolution: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 leading-relaxed resize-none"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrevStep}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          ← Quay Lại Bước 1
        </button>

        <button
          onClick={onNextStep}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-900/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Tiếp Tục Bước 3: Xây Dựng Nhân Vật</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};