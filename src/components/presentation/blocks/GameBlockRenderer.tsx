import React from 'react';
import { GameBlock } from '../../../types/contentBlock';
import { Gamepad2, Play, Sparkles, Trophy } from 'lucide-react';

interface GameBlockRendererProps {
  block: GameBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: GameBlock['content']) => void;
  onLaunchGame?: (gameType: string, questionSetId: string) => void;
  onOpenGameSelectModal?: () => void;
}

export const GameBlockRenderer: React.FC<GameBlockRendererProps> = ({
  block,
  isEditor = false,
  onLaunchGame,
  onOpenGameSelectModal,
}) => {
  const { content } = block;

  const gameNames: Record<string, string> = {
    GESTURE_QUIZ_AI: 'Đấu trường Cử chỉ AI (AI Vision)',
    WHEEL_FORTUNE: 'Vòng quay May mắn',
    GOLDEN_BELL_CHALLENGE: 'Rung chuông vàng',
    MILLIONAIRE_QUIZ: 'Ai là Triệu phú Toán học',
    CROSSWORD_PUZZLE: 'Ô chữ Bí mật',
    MYSTERY_DOORS: 'Cánh cửa Bí ẩn',
    OBSTACLE_COURSE: 'Vượt chướng ngại vật',
    MATH_RACING: 'Đua xe Toán học',
    MATH_ARENA: 'Đấu trường Kiến thức',
  };

  const displayName = gameNames[content.gameType] || content.gameTitle || 'Trò chơi học tập tương tác';

  return (
    <div className="w-full h-full p-5 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden border-2 border-purple-500/40">
      {/* Visual background sparkles */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-800/60 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 flex items-center justify-center font-black shadow-md">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hoạt động tương tác lớp học</span>
            </span>
            <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
              {displayName}
            </h4>
          </div>
        </div>

        {isEditor && onOpenGameSelectModal && (
          <button
            type="button"
            onClick={onOpenGameSelectModal}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 transition cursor-pointer"
          >
            Đổi trò chơi / Đề
          </button>
        )}
      </div>

      {/* Main launch badge */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-2 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shadow-xl shadow-purple-900/50 mb-3 flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white">
            <Gamepad2 className="w-8 h-8 text-pink-400" />
          </div>
        </div>

        <p className="text-xs sm:text-sm text-purple-200/90 max-w-md font-medium mb-1">
          Dữ liệu câu hỏi tự động lấy từ đề ôn tập của bài học. Cả lớp cùng tham gia thi đua và ghi điểm!
        </p>

        {content.questionCount && (
          <div className="text-[11px] font-bold text-amber-400 font-mono">
            {content.questionCount} câu hỏi sẵn sàng
          </div>
        )}
      </div>

      {/* Footer / CTA Button */}
      <div className="pt-3 border-t border-purple-800/60 flex items-center justify-center relative z-10">
        {!isEditor ? (
          <button
            type="button"
            onClick={() => onLaunchGame?.(content.gameType, content.questionSetId)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:to-pink-400 text-slate-950 font-black text-sm shadow-lg shadow-orange-950/40 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>KÍCH HOẠT TRÒ CHƠI CHO CẢ LỚP</span>
          </button>
        ) : (
          <div className="text-xs text-purple-300 font-medium">
            Trong chế độ trình chiếu, nút bấm này sẽ mở ngay trò chơi cho cả lớp.
          </div>
        )}
      </div>
    </div>
  );
};
