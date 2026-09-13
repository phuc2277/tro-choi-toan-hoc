import React, { useState, useMemo } from 'react';
import { Lesson, QuestionSetItem, GameSession } from '../../types/teacherLesson';
import { GameRegistry } from '../../games/registry/GameRegistry';
import { LessonGameMetadata } from '../../games/types/LessonGame';
import { GameSetupModal } from './GameSetupModal';
import {
  Gamepad2,
  Play,
  Layers,
  Sparkles,
  Disc,
  Swords,
  Trophy,
  Flame,
  Bell,
  KeyRound,
  Mountain,
  DoorOpen,
  Users,
  User,
  CheckCircle2,
  Info,
  ArrowRight,
  Plus,
  HelpCircle,
  FolderPlus,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';

interface GamesHubTabProps {
  lesson: Lesson;
  onLaunchGame: (
    gameCode: string,
    questionSet: QuestionSetItem,
    customConfig?: Record<string, any>,
    session?: GameSession
  ) => void;
  onNavigateToQuestionBank?: () => void;
}

export const GamesHubTab: React.FC<GamesHubTabProps> = ({
  lesson,
  onLaunchGame,
  onNavigateToQuestionBank,
}) => {
  // Modal State for Game Setup
  const [activeSetupGame, setActiveSetupGame] = useState<LessonGameMetadata | null>(null);

  // Filter for Games
  const [gameFilter, setGameFilter] = useState<'all' | 'ai' | 'multiplayer' | 'practice'>('all');

  // Dynamically query all 9 games available in Game Engine
  const allRegisteredGames: LessonGameMetadata[] = useMemo(() => {
    return GameRegistry.getAllGames();
  }, []);

  const filteredGames = useMemo(() => {
    if (gameFilter === 'ai') {
      return allRegisteredGames.filter((g) => g.code.includes('GESTURE') || g.name.includes('AI'));
    }
    if (gameFilter === 'multiplayer') {
      return allRegisteredGames.filter((g) => g.badge?.includes('Đấu') || g.code.includes('ARENA') || g.code.includes('BELL') || g.code.includes('RACING'));
    }
    if (gameFilter === 'practice') {
      return allRegisteredGames.filter((g) => !g.code.includes('GESTURE'));
    }
    return allRegisteredGames;
  }, [allRegisteredGames, gameFilter]);

  const hasQuestionSets = (lesson.questionSets || []).length > 0;

  // Player / Team capacity support text for each of the 9 games
  const getGameCapacityText = (code: string) => {
    switch (code) {
      case 'GESTURE_QUIZ_AI':
        return 'Cá nhân & Đội (1–4 người / 2–4 đội)';
      case 'WHEEL_GAME':
        return 'Cá nhân & Đội (2–4 người / đội)';
      case 'MATH_ARENA':
        return 'Đấu trường tốc độ (2–6 vận động viên)';
      case 'MILLIONAIRE':
        return 'Thử thách cá nhân (1 thí sinh chính)';
      case 'MATH_RACING':
        return 'Đua xe tốc độ (2–4 tay đua / đội)';
      case 'GOLDEN_BELL':
        return 'Sàn đấu loại trực tiếp (6–40 thí sinh)';
      case 'MATH_CROSSWORD':
        return 'Giải mã ô chữ (Cá nhân / Cả lớp)';
      case 'OBSTACLE_COURSE':
        return 'Thám hiểm leo núi (1 người / Đại diện)';
      case 'MYSTERY_DOORS':
        return 'Cánh cửa bí ẩn (2–4 người / đội)';
      default:
        return 'Cá nhân & Đội nhóm';
    }
  };

  // Game Card Icon
  const renderGameIcon = (code: string) => {
    switch (code) {
      case 'GESTURE_QUIZ_AI':
        return <Sparkles className="w-6 h-6 text-purple-600" />;
      case 'WHEEL_GAME':
        return <Disc className="w-6 h-6 text-blue-600" />;
      case 'MATH_ARENA':
        return <Swords className="w-6 h-6 text-rose-600" />;
      case 'MILLIONAIRE':
        return <Trophy className="w-6 h-6 text-amber-600" />;
      case 'MATH_RACING':
        return <Flame className="w-6 h-6 text-orange-600" />;
      case 'GOLDEN_BELL':
        return <Bell className="w-6 h-6 text-yellow-600" />;
      case 'MATH_CROSSWORD':
        return <KeyRound className="w-6 h-6 text-emerald-600" />;
      case 'OBSTACLE_COURSE':
        return <Mountain className="w-6 h-6 text-cyan-600" />;
      case 'MYSTERY_DOORS':
        return <DoorOpen className="w-6 h-6 text-indigo-600" />;
      default:
        return <Gamepad2 className="w-6 h-6 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                5. TRÒ CHƠI HỌC TẬP & ĐẤU TRƯỜNG ({allRegisteredGames.length} TRÒ CHƠI)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Quy trình: <strong>Chọn trò chơi</strong> → <strong>Hộp thoại thiết lập</strong> → <strong>Chọn đề đã tạo</strong> → <strong>Thiết lập luật/tham số</strong> → <strong>Bắt đầu chơi</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {hasQuestionSets ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>{lesson.questionSets.length} đề thi sẵn sàng</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Chưa có đề nào trong bài</span>
              </div>
            )}

            {onNavigateToQuestionBank && (
              <button
                id="btn-nav-create-exam"
                onClick={onNavigateToQuestionBank}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200/80"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tạo thêm đề ở Tab 4</span>
              </button>
            )}
          </div>
        </div>

        {/* Warning Banner if No Question Set Exists */}
        {!hasQuestionSets && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Chưa có đề để chơi
                </h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Trò chơi yêu cầu nạp từ bộ đề đã tạo ở <strong>Tab 4 – Tạo Đề</strong>. Vui lòng tạo đề trước khi khởi chạy trò chơi.
                </p>
              </div>
            </div>

            {onNavigateToQuestionBank && (
              <button
                onClick={onNavigateToQuestionBank}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
              >
                <span>Đến Tạo Đề Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 9 Games Bento Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Danh mục 9 trò chơi học tập tương tác
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bấm vào bất kỳ trò chơi nào để mở hộp thoại thiết lập luật chơi và nạp đề bài
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {[
              { id: 'all', label: 'Tất cả (9)' },
              { id: 'ai', label: '🤖 AI Cử chỉ' },
              { id: 'multiplayer', label: '⚔️ Đấu trường' },
              { id: 'practice', label: '⭐ Luyện tập' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setGameFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  gameFilter === f.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 9 Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game, index) => {
            const isAi = game.code.includes('GESTURE') || game.name.includes('AI');
            const isArena = game.badge?.includes('Đấu') || game.code.includes('ARENA');

            return (
              <div
                key={game.code}
                id={`game-card-${game.code}`}
                onClick={() => setActiveSetupGame(game)}
                className="p-5 rounded-3xl border-2 border-slate-200/80 hover:border-purple-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between bg-white group cursor-pointer relative overflow-hidden"
              >
                {/* Top card info */}
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-purple-50 group-hover:border-purple-200 flex items-center justify-center transition shadow-2xs">
                      {renderGameIcon(game.code)}
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        isAi
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isArena
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {game.badge || 'Trò chơi'}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition mb-1">
                    {index + 1}. {game.name}
                  </h4>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                    {game.description}
                  </p>
                </div>

                {/* Bottom Capacity & CTA Button */}
                <div className="pt-3.5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">{getGameCapacityText(game.code)}</span>
                  </div>

                  <button
                    id={`select-game-btn-${game.code}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSetupGame(game);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white text-xs font-bold transition shadow-2xs group-hover:bg-purple-600 group-hover:text-white cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Chọn trò chơi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GAME SETUP MODAL */}
      {activeSetupGame && (
        <GameSetupModal
          game={activeSetupGame}
          lesson={lesson}
          isOpen={!!activeSetupGame}
          onClose={() => setActiveSetupGame(null)}
          onStartGame={(gameCode, selectedExam, customConfig, session) => {
            setActiveSetupGame(null);
            onLaunchGame(gameCode, selectedExam, customConfig, session);
          }}
          onNavigateToCreateExam={onNavigateToQuestionBank}
        />
      )}
    </div>
  );
};
