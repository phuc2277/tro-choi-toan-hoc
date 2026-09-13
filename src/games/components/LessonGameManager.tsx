import React, { useState } from 'react';
import { GameRegistry } from '../registry/GameRegistry';
import { GameFactory } from '../factories/GameFactory';
import { DEFAULT_LESSON_UNITS } from '../../data/defaultQuestionBanks';
import { LessonGameMetadata, LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { AiAssistantModal } from './AiAssistantModal';
import { AiMusicGeneratorModal } from './AiMusicGeneratorModal';
import {
  Gamepad2,
  Sparkles,
  Disc,
  Swords,
  Trophy,
  Layers,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Hand,
  Flame,
  Bell,
  KeyRound,
  Mountain,
  DoorOpen,
  Bot,
  Music,
} from 'lucide-react';

export const LessonGameManager: React.FC = () => {
  const [activeGameCode, setActiveGameCode] = useState<string | null>(null);
  const [lessonUnits, setLessonUnits] = useState<LessonUnit[]>(DEFAULT_LESSON_UNITS);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isAiMusicOpen, setIsAiMusicOpen] = useState<boolean>(false);

  // Handler to add AI-generated questions into lessonUnits
  const handleAddAiQuestions = (newQuestions: QuestionItem[], topicName: string) => {
    const newUnit: LessonUnit = {
      id: `ai-lesson-${Date.now()}`,
      grade: 8,
      chapter: 'Chương trình AI Soạn Thảo',
      subject: 'Toán THCS (AI Soạn Thảo)',
      lessonTitle: topicName || 'Bộ câu hỏi Toán học AI',
      questionBank: newQuestions,
    };

    setLessonUnits((prev) => [newUnit, ...prev]);
  };

  // Retrieve registered games dynamically from GameRegistry (Open-Closed Principle)
  const registeredGames: LessonGameMetadata[] = GameRegistry.getAllGames();

  // If a game is active, render via Factory
  if (activeGameCode) {
    const gameElement = GameFactory.createGameComponent(
      activeGameCode,
      lessonUnits,
      () => setActiveGameCode(null)
    );
    if (gameElement) {
      return (
        <>
          {gameElement}
          {/* Floating AI & Music Utility Buttons on active game screen */}
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl shadow-blue-500/30 flex items-center gap-1.5 transition hover:scale-105 active:scale-95 border border-blue-400/40 cursor-pointer"
              title="Mở Trợ lý AI Giáo viên Toán THCS"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Trợ Lý AI</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAiMusicOpen(true)}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-2xl shadow-purple-500/30 flex items-center gap-1.5 transition hover:scale-105 active:scale-95 border border-purple-400/40 cursor-pointer"
              title="Tạo Nhạc Trò Chơi Bằng AI"
            >
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Nhạc AI</span>
            </button>
          </div>

          <AiAssistantModal
            isOpen={isAiAssistantOpen}
            onClose={() => setIsAiAssistantOpen(false)}
            onAddGeneratedQuestions={handleAddAiQuestions}
          />
          <AiMusicGeneratorModal
            isOpen={isAiMusicOpen}
            onClose={() => setIsAiMusicOpen(false)}
          />
        </>
      );
    }
  }

  // Helper icon selector based on game code
  const renderGameIcon = (code: string) => {
    switch (code) {
      case 'GESTURE_QUIZ_AI':
      case 'gesture-quiz':
      case 'game-ai-gesture-quiz':
        return <Hand className="w-8 h-8 text-blue-400" />;
      case 'WHEEL_GAME':
      case 'wheel-game':
      case 'game-wheel-math':
        return <Disc className="w-8 h-8 text-amber-400" />;
      case 'MATH_ARENA':
      case 'math-arena':
      case 'game-math-arena':
        return <Swords className="w-8 h-8 text-rose-400" />;
      case 'MILLIONAIRE':
      case 'millionaire':
      case 'game-millionaire':
        return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 'MATH_RACING':
      case 'math-racing':
      case 'game-math-racing':
        return <Flame className="w-8 h-8 text-rose-500" />;
      case 'GOLDEN_BELL':
      case 'golden-bell':
      case 'game-golden-bell':
        return <Bell className="w-8 h-8 text-amber-400" />;
      case 'MATH_CROSSWORD':
      case 'math-crossword':
      case 'game-math-crossword':
        return <KeyRound className="w-8 h-8 text-indigo-400" />;
      case 'OBSTACLE_COURSE':
      case 'obstacle-course':
      case 'game-obstacle-course':
        return <Mountain className="w-8 h-8 text-emerald-400" />;
      case 'MYSTERY_DOORS':
      case 'mystery-doors':
      case 'game-mystery-doors':
        return <DoorOpen className="w-8 h-8 text-amber-400" />;
      default:
        return <Gamepad2 className="w-8 h-8 text-indigo-400" />;
    }
  };

  const renderBadgeColor = (code: string) => {
    switch (code) {
      case 'GESTURE_QUIZ_AI':
      case 'gesture-quiz':
      case 'game-ai-gesture-quiz':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'WHEEL_GAME':
      case 'wheel-game':
      case 'game-wheel-math':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MATH_ARENA':
      case 'math-arena':
      case 'game-math-arena':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'MILLIONAIRE':
      case 'millionaire':
      case 'game-millionaire':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'MATH_RACING':
      case 'math-racing':
      case 'game-math-racing':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'GOLDEN_BELL':
      case 'golden-bell':
      case 'game-golden-bell':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MATH_CROSSWORD':
      case 'math-crossword':
      case 'game-math-crossword':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'OBSTACLE_COURSE':
      case 'obstacle-course':
      case 'game-obstacle-course':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'MYSTERY_DOORS':
      case 'mystery-doors':
      case 'game-mystery-doors':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  const renderAccentGlow = (code: string) => {
    switch (code) {
      case 'GESTURE_QUIZ_AI':
      case 'gesture-quiz':
      case 'game-ai-gesture-quiz':
        return 'hover:border-blue-500/60 hover:shadow-blue-500/10';
      case 'WHEEL_GAME':
      case 'wheel-game':
      case 'game-wheel-math':
        return 'hover:border-amber-500/60 hover:shadow-amber-500/10';
      case 'MATH_ARENA':
      case 'math-arena':
      case 'game-math-arena':
        return 'hover:border-rose-500/60 hover:shadow-rose-500/10';
      case 'MILLIONAIRE':
      case 'millionaire':
      case 'game-millionaire':
        return 'hover:border-yellow-500/60 hover:shadow-yellow-500/10';
      case 'MATH_RACING':
      case 'math-racing':
      case 'game-math-racing':
        return 'hover:border-red-500/60 hover:shadow-red-500/10';
      case 'GOLDEN_BELL':
      case 'golden-bell':
      case 'game-golden-bell':
        return 'hover:border-amber-500/60 hover:shadow-amber-500/10';
      case 'MATH_CROSSWORD':
      case 'math-crossword':
      case 'game-math-crossword':
        return 'hover:border-indigo-500/60 hover:shadow-indigo-500/10';
      case 'OBSTACLE_COURSE':
      case 'obstacle-course':
      case 'game-obstacle-course':
        return 'hover:border-emerald-500/60 hover:shadow-emerald-500/10';
      case 'MYSTERY_DOORS':
      case 'mystery-doors':
      case 'game-mystery-doors':
        return 'hover:border-amber-500/60 hover:shadow-amber-500/10';
      default:
        return 'hover:border-purple-500/60 hover:shadow-purple-500/10';
    }
  };

  const totalQuestionsAvailable = DEFAULT_LESSON_UNITS.reduce(
    (acc, curr) => acc + curr.questionBank.length,
    0
  );

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Platform Header */}
      <header className="border-b border-[#30363D] bg-[#161B22]/90 backdrop-blur-md px-4 sm:px-8 py-4 sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  MATH GAME ARENA THCS
                </h1>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {registeredGames.length} Trò Chơi Tích Hợp
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Hệ Thống Đa Trò Chơi Giáo Dục & Ngân Hàng Câu Hỏi Toán Học THCS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer border border-blue-400/30"
              title="Mở Trợ lý AI Giáo viên Toán THCS"
            >
              <Bot className="w-4 h-4" />
              <span>Trợ Lý AI Toán</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAiMusicOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer border border-purple-400/30"
              title="Tạo Nhạc Trò Chơi Bằng AI"
            >
              <Music className="w-4 h-4" />
              <span>Tạo Nhạc AI</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-[#0A0E17] px-3.5 py-1.5 rounded-xl border border-[#30363D]">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>
                <strong className="text-white font-mono">{lessonUnits.length}</strong> bài học •{' '}
                <strong className="text-emerald-400 font-mono">
                  {lessonUnits.reduce((acc, curr) => acc + curr.questionBank.length, 0)}
                </strong>{' '}
                câu hỏi
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Bento Hub */}
      <main className="flex-1 w-full px-4 sm:px-8 py-6 space-y-8">
        {/* Banner Section */}
        <section className="bg-gradient-to-r from-[#161B22] via-[#1a2332] to-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nền Tảng Trò Chơi Toán Học Tương Tác</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Chọn Trò Chơi Để Bắt Đầu Tiết Học
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Tất cả {registeredGames.length} trò chơi đều sử dụng thống nhất Ngân hàng câu hỏi Toán THCS, hỗ trợ linh hoạt
              cho hoạt động <span className="text-amber-400 font-bold">Khởi động (Warm-up)</span> và{' '}
              <span className="text-blue-400 font-bold">Luyện tập (Practice)</span>.
            </p>
          </div>
        </section>

        {/* Games Bento Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              <span>Danh Mục Trò Chơi Đã Tích Hợp ({registeredGames.length})</span>
            </h3>
            <span className="text-xs text-gray-400">Chọn 1 trò chơi để cấu hình & thi đấu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
            {registeredGames.map((game) => {
              const badgeStyle = renderBadgeColor(game.code);
              const glowStyle = renderAccentGlow(game.code);

              return (
                <div
                  key={game.id}
                  onClick={() => setActiveGameCode(game.code)}
                  className={`bg-[#161B22] border border-[#30363D] rounded-3xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between cursor-pointer group ${glowStyle}`}
                >
                  <div className="space-y-4">
                    {/* Card Top */}
                    <div className="flex items-start justify-between">
                      <div className="p-3.5 rounded-2xl bg-[#0A0E17] border border-[#30363D] shadow-inner group-hover:scale-105 transition">
                        {renderGameIcon(game.code)}
                      </div>
                      {game.badge && (
                        <span
                          className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${badgeStyle}`}
                        >
                          {game.badge}
                        </span>
                      )}
                    </div>

                    {/* Game Details */}
                    <div>
                      <h4 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-blue-400 transition">
                        {game.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-3">
                        {game.description}
                      </p>
                    </div>

                    {/* Features checklist */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#30363D]/60 text-[11px] text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Ngân hàng THCS</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Khởi động / Luyện tập</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Tùy biến Pool</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Xếp hạng real-time</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-6 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200 transition">
                      Khởi chạy game ngay
                    </span>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs group-hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition">
                      <span>Vào Chơi</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* AI Assistant and AI Music Modals */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onAddGeneratedQuestions={handleAddAiQuestions}
      />
      <AiMusicGeneratorModal
        isOpen={isAiMusicOpen}
        onClose={() => setIsAiMusicOpen(false)}
      />
    </div>
  );
};

