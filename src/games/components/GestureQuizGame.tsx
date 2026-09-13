import React, { useState, useRef, useEffect } from 'react';
import {
  GestureQuizConfig,
  QuestionItem,
  GamePurpose,
} from '../types/GestureQuiz';
import { LessonUnit } from '../types/LessonGame';
import { useGestureQuiz } from '../gesture-quiz/hooks/useGestureQuiz';
import { ModeSelectionScreen } from './ModeSelectionScreen';
import { GameConfigScreen } from './GameConfigScreen';
import { QuestionBankModal } from './QuestionBankModal';
import { QuizActiveRound } from './QuizActiveRound';
import { QuizQuestionResultModal } from './QuizQuestionResultModal';
import { QuizResultScreen } from './QuizResultScreen';
import { QuizReviewAnswersModal } from './QuizReviewAnswersModal';
import { Sparkles, Trophy, LogOut, Maximize2, Minimize2 } from 'lucide-react';

interface GestureQuizGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
  onProgressUpdate?: (current: number, total: number, isFinished: boolean) => void;
}

export const GestureQuizGame: React.FC<GestureQuizGameProps> = ({ lessons, onExitToMenu, onProgressUpdate }) => {
  const [selectedLesson, setSelectedLesson] = useState<LessonUnit>(lessons[0]);
  const [purpose, setPurpose] = useState<GamePurpose>('warm-up');
  const [isPoolModalOpen, setIsPoolModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Initial question pool selected by teacher (defaults to all questions in the chosen lesson, e.g. 15 questions)
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>(
    selectedLesson.questionBank.map((q) => q.id)
  );

  // When lesson changes, reset pool selection
  const handleSelectLesson = (lesson: LessonUnit) => {
    setSelectedLesson(lesson);
    setSelectedPoolIds(lesson.questionBank.map((q) => q.id));
  };

  const {
    stage,
    setStage,
    config,
    roundQuestions,
    currentQuestionIndex,
    currentQuestion,
    timeLeft,
    countdownNumber,
    currentAnswers,
    roundHistory,
    players,
    teams,
    currentSequentialTeamIndex,
    individualLeaderboard,
    teamLeaderboard,
    startQuizWithConfig,
    recordPlayerAnswer,
    evaluateCurrentQuestion,
    nextQuestion,
    replayRound,
  } = useGestureQuiz({
    allAvailableQuestions: selectedLesson.questionBank,
  });

  // Synchronize question progress and quiz completion to LessonPage
  useEffect(() => {
    if (roundQuestions && roundQuestions.length > 0) {
      const isFinished = stage === 'final_result';
      const current = isFinished
        ? roundQuestions.length
        : Math.min(currentQuestionIndex + 1, roundQuestions.length);
      const total = roundQuestions.length;

      onProgressUpdate?.(current, total, isFinished);

      window.dispatchEvent(
        new CustomEvent('quiz-progress-update', {
          detail: {
            current,
            total,
            isFinished,
            quizTitle: config?.lessonTitle || selectedLesson.lessonTitle,
          },
        })
      );

      if (isFinished) {
        window.dispatchEvent(
          new CustomEvent('quiz-finished', {
            detail: { total },
          })
        );
      }
    }
  }, [
    stage,
    currentQuestionIndex,
    roundQuestions,
    config?.lessonTitle,
    selectedLesson.lessonTitle,
    onProgressUpdate,
  ]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0A0E17] text-white flex flex-col font-sans selection:bg-blue-500 selection:text-white"
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#161B22]/90 backdrop-blur-md border-b border-[#30363D]">
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  TRẮC NGHIỆM CỬ CHỈ AI
                </h1>
                <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  THCS CẤP 2
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Nhận diện cử chỉ 1, 2, 3, 4 ngón tay & giọng nói AI • Khởi động & Luyện tập
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stage !== 'mode_selection' && (
              <button
                onClick={() => setStage('mode_selection')}
                className="rounded-xl border border-[#30363D] bg-[#21262D] px-3.5 py-1.5 text-xs font-bold text-gray-200 hover:bg-[#30363D] hover:text-white transition cursor-pointer"
              >
                Về Đầu Trò Chơi
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-[#21262D] border border-[#30363D] text-gray-300 hover:text-white hover:bg-[#30363D] transition cursor-pointer"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {onExitToMenu && (
              <button
                onClick={onExitToMenu}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262D] border border-[#30363D] text-xs font-bold text-gray-300 hover:text-rose-400 hover:border-rose-500/40 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thoát Game</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-stretch justify-start">
        {/* Stage 1: Mode & Purpose Selection */}
        {stage === 'mode_selection' && (
          <ModeSelectionScreen
            lessons={lessons}
            selectedLesson={selectedLesson}
            onSelectLesson={handleSelectLesson}
            purpose={purpose}
            onSelectPurpose={setPurpose}
            onProceedToConfig={() => setStage('game_config')}
          />
        )}

        {/* Stage 2: Game Configuration (Number of questions, time limit, competition mode) */}
        {stage === 'game_config' && (
          <GameConfigScreen
            purpose={purpose}
            subject={selectedLesson.subject}
            lessonTitle={selectedLesson.lessonTitle}
            allLessonQuestions={selectedLesson.questionBank}
            selectedPoolIds={selectedPoolIds}
            onOpenPoolModal={() => setIsPoolModalOpen(true)}
            onBack={() => setStage('mode_selection')}
            onStartGame={startQuizWithConfig}
          />
        )}

        {/* Stage 3: Pre-Round 3..2..1 Countdown */}
        {stage === 'pre_round_countdown' && (
          <div className="text-center py-16 space-y-6 animate-fadeIn bg-[#161B22] border border-[#30363D] rounded-3xl p-10 max-w-2xl mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />
            <div className="inline-block rounded-full bg-blue-500/20 border border-blue-500/30 px-4 py-1.5 text-xs font-bold text-blue-400 tracking-wider uppercase">
              {config?.subject} • {config?.purpose === 'warm-up' ? '🚀 KHỞI ĐỘNG' : '🎯 LUYỆN TẬP'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {config?.individualConfig?.inputMode === 'keyboard_mouse' || config?.teamConfig?.inputMode === 'keyboard_mouse'
                ? 'CHUẨN BỊ CHUỘT & BÀN PHÍM!'
                : config?.individualConfig?.inputMode === 'voice'
                ? 'CHUẨN BỊ MICRO PHÁT ÂM!'
                : 'CHUẨN BỊ TRƯỚC CAMERA!'}
            </h2>
            <div className="text-8xl sm:text-9xl font-mono font-black text-blue-400 animate-ping duration-1000">
              {countdownNumber > 0 ? countdownNumber : 'GO!'}
            </div>
            <p className="text-sm text-gray-400 font-medium max-w-md mx-auto">
              {config?.individualConfig?.inputMode === 'keyboard_mouse' || config?.teamConfig?.inputMode === 'keyboard_mouse'
                ? 'Sử dụng phím 1, 2, 3, 4 (hoặc A, B, C, D) hoặc click chuột trực tiếp vào thẻ đáp án để chọn câu trả lời nhanh nhất!'
                : config?.individualConfig?.inputMode === 'voice'
                ? 'Nói to và rõ ràng các chữ cái A, B, C, D vào micro khi câu hỏi xuất hiện.'
                : 'Học sinh đứng vào đúng khu vực vị trí từ trái sang phải, giơ 1, 2, 3, 4 ngón tay tương ứng với đáp án A, B, C, D.'}
            </p>
          </div>
        )}

        {/* Stage 4: Active Question Answering */}
        {stage === 'active_question' && config && currentQuestion && (
          <QuizActiveRound
            config={config}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={roundQuestions.length}
            timeLeft={timeLeft}
            totalTimeLimit={config.timeLimitPerQuestion}
            currentAnswers={currentAnswers}
            onRecordAnswer={recordPlayerAnswer}
            players={players}
            teams={teams}
            currentSequentialTeamIndex={currentSequentialTeamIndex}
            onForceSubmit={evaluateCurrentQuestion}
          />
        )}

        {/* Stage 5: Per-Question Result Breakdown & Live Leaderboard */}
        {stage === 'question_result' && config && currentQuestion && (
          <QuizQuestionResultModal
            config={config}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={roundQuestions.length}
            lastRoundScore={roundHistory[currentQuestionIndex]}
            individualLeaderboard={individualLeaderboard}
            teamLeaderboard={teamLeaderboard}
            onNextQuestion={nextQuestion}
            isLastQuestion={currentQuestionIndex + 1 >= roundQuestions.length}
          />
        )}

        {/* Stage 6: Final Game Podium & Comprehensive Results */}
        {stage === 'final_result' && config && (
          <QuizResultScreen
            config={config}
            individualLeaderboard={individualLeaderboard}
            teamLeaderboard={teamLeaderboard}
            totalQuestions={roundQuestions.length}
            onReplay={replayRound}
            onViewReview={() => setIsReviewModalOpen(true)}
            onExit={() => setStage('mode_selection')}
          />
        )}
      </main>

      {/* Modal 1: Question Bank Pool Selector */}
      <QuestionBankModal
        isOpen={isPoolModalOpen}
        onClose={() => setIsPoolModalOpen(false)}
        allLessonQuestions={selectedLesson.questionBank}
        selectedPoolIds={selectedPoolIds}
        onSavePool={(newIds) => setSelectedPoolIds(newIds)}
        lessonTitle={selectedLesson.lessonTitle}
        subject={selectedLesson.subject}
        minRequired={purpose === 'warm-up' ? 5 : 5}
      />

      {/* Modal 2: Review Answers Details Modal */}
      <QuizReviewAnswersModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        roundHistory={roundHistory}
        subject={selectedLesson.subject}
      />

      {/* Footer */}
      <footer className="border-t border-[#30363D] bg-[#161B22] py-4 text-center text-xs text-gray-400">
        Hệ thống Trắc Nghiệm Cử Chỉ AI Cấp 2 • Thiết kế giao diện Bento Grid • Tích hợp MediaPipe Vision & Web Speech
      </footer>
    </div>
  );
};
