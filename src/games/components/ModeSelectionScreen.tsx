import React from 'react';
import { GamePurpose } from '../types/GestureQuiz';
import { LessonUnit } from '../types/LessonGame';
import { Sparkles, Target, ChevronRight } from 'lucide-react';

interface ModeSelectionScreenProps {
  lessons: LessonUnit[];
  selectedLesson: LessonUnit;
  onSelectLesson: (lesson: LessonUnit) => void;
  purpose: GamePurpose;
  onSelectPurpose: (purpose: GamePurpose) => void;
  onProceedToConfig: () => void;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  selectedLesson,
  purpose,
  onSelectPurpose,
  onProceedToConfig,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn py-2">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-bold tracking-wide">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>HỆ THỐNG TRÒ CHƠI GIÁO DỤC CẤP 2 — TRẮC NGHIỆM CỬ CHỈ AI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          Chọn Mục Đích Trò Chơi
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed font-medium">
          Đang nạp đề bài học: <span className="text-blue-300 font-bold">{selectedLesson.lessonTitle}</span> ({selectedLesson.questionBank.length} câu hỏi).
        </p>
      </div>

      {/* Bento Grid: Chọn Mục Đích (Khởi động vs Luyện tập) */}
      <div className="bg-[#161B22] rounded-2xl p-6 border border-[#30363D] space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
            ★
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Chọn Mục Đích Tiết Học</h2>
            <p className="text-xs text-gray-400">Trò chơi phục vụ hai mục đích sư phạm chính theo đặc tả chuẩn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Khởi động */}
          <div
            onClick={() => onSelectPurpose('warm-up')}
            className={`cursor-pointer rounded-2xl p-5 border transition flex flex-col justify-between ${
              purpose === 'warm-up'
                ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-400/20 shadow-md'
                : 'border-[#30363D] bg-[#21262D] hover:border-gray-500 hover:bg-[#282e38]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                {purpose === 'warm-up' && (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full">
                    Đang chọn
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">1. Khởi Động (Warm-up)</h3>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Mục tiêu nhanh, vui, khuấy động không khí lớp học, kích thích phản xạ và kiểm tra kiến thức nền.
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/15 border border-amber-500/25 p-2.5 text-xs text-amber-300 font-medium">
                ⚡ Mặc định đề xuất: <span className="font-bold text-amber-200">5 câu / lượt</span> (Thời gian nhanh 10–15s).
              </div>
            </div>
          </div>

          {/* Luyện tập */}
          <div
            onClick={() => onSelectPurpose('practice')}
            className={`cursor-pointer rounded-2xl p-5 border transition flex flex-col justify-between ${
              purpose === 'practice'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20 shadow-md'
                : 'border-[#30363D] bg-[#21262D] hover:border-gray-500 hover:bg-[#282e38]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Target className="w-5 h-5" />
                </div>
                {purpose === 'practice' && (
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-full">
                    Đang chọn
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">2. Luyện Tập (Practice)</h3>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Mục tiêu đào sâu kiến thức bài học, rèn luyện tư duy, kỹ năng phân tích và củng cố vững chắc.
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/15 border border-blue-500/25 p-2.5 text-xs text-blue-300 font-medium">
                🎯 Tùy chọn linh hoạt: <span className="font-bold text-blue-200">10 – 15 câu / lượt</span> theo cấu hình giáo viên.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation CTA */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onProceedToConfig}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-7 py-3 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span>Tiếp Tục Cấu Hình Game</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
