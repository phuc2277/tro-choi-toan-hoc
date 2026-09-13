import React, { useState, useEffect, useRef } from 'react';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { ArenaPlayerState, MathArenaConfig } from '../types/GamePlatform';
import { QuestionSelectionService } from '../services/QuestionSelectionService';
import { MathArenaService } from '../services/MathArenaService';
import { QuestionBankModal } from './QuestionBankModal';
import { CameraGestureOverlay } from './CameraGestureOverlay';
import { VoiceRecognitionOverlay } from './VoiceRecognitionOverlay';
import { GameInputSelector, InputModeType } from './GameInputSelector';
import { soundEffects } from '../services/SoundEffects';
import { useMediaPipeHands } from '../gesture-quiz/hooks/useMediaPipeHands';
import { MathRenderer } from './MathRenderer';
import { MathDiagramView } from './MathDiagramView';
import {
  Swords,
  Trophy,
  Play,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Flame,
  Zap,
  Maximize2,
  Minimize2,
  LogOut,
  Settings,
  ArrowRight,
  BookOpen,
  Sparkles,
  Award,
} from 'lucide-react';

interface MathArenaGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
}

export const MathArenaGame: React.FC<MathArenaGameProps> = ({ lessons, onExitToMenu }) => {
  // 1. Lesson & Config State
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const currentLesson = lessons[selectedLessonIndex] || lessons[0];

  const [config, setConfig] = useState<MathArenaConfig>({
    purpose: 'practice',
    subject: currentLesson.subject,
    lessonTitle: currentLesson.lessonTitle,
    questionPoolIds: currentLesson.questionBank.map((q) => q.id),
    questionsPerRound: 10,
    timeLimitPerQuestion: 15,
    competitionMode: 'individual',
    playerNames: ['Vận động viên 1', 'Vận động viên 2', 'Vận động viên 3', 'Vận động viên 4'],
    speedBonusEnabled: true,
  });

  // Input Mode: Camera / Voice / Manual (Default to camera for AI gesture detection)
  const [inputMode, setInputMode] = useState<InputModeType>('camera');

  // Game Lifecycle State
  const [gameState, setGameState] = useState<
    'configuring' | 'ready' | 'playing' | 'question_result' | 'finished'
  >('configuring');

  // Question Pool Modal
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState<boolean>(false);

  // Active Game State
  const [roundQuestions, setRoundQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [recentHistoryIds, setRecentHistoryIds] = useState<string[]>([]);

  // Arena Players
  const [players, setPlayers] = useState<ArenaPlayerState[]>([]);
  const playersRef = useRef<ArenaPlayerState[]>([]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // MediaPipe hook for Camera Gesture recognition
  const {
    videoRef,
    canvasRef,
    isLoadingModel,
    cameraError,
    isCameraActive,
    mediaStream,
    zoneDetections,
    resetZoneStates,
    retryCamera,
    availableCameras,
    activeDeviceId,
    setActiveDeviceId,
  } = useMediaPipeHands({
    zoneCount: config.playerNames.length || 2,
    isActive: inputMode === 'camera' && gameState !== 'finished',
    onZoneAnswerLocked: (zoneIdx, option) => {
      if (gameState !== 'playing') return;
      const currentPlayer = playersRef.current[zoneIdx];
      if (currentPlayer && currentPlayer.selectedOption === null) {
        handlePlayerChooseOption(currentPlayer.id, option);
      }
    },
  });

  // Timer & Response time tracking
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle lesson change
  const handleLessonChange = (idx: number) => {
    setSelectedLessonIndex(idx);
    const les = lessons[idx];
    setConfig((prev) => ({
      ...prev,
      subject: les.subject,
      lessonTitle: les.lessonTitle,
      questionPoolIds: les.questionBank.map((q) => q.id),
    }));
  };

  // Start Arena
  const handleStartGame = () => {
    const poolQuestions = QuestionSelectionService.filterPoolQuestions(
      currentLesson.questionBank,
      config.questionPoolIds
    );

    const validation = QuestionSelectionService.validatePool(
      poolQuestions.length,
      config.questionsPerRound
    );

    if (!validation.isValid) {
      alert(validation.errorMessage);
      return;
    }

    const { selectedQuestions, updatedHistory } = QuestionSelectionService.selectRoundQuestions(
      poolQuestions,
      config.questionsPerRound,
      recentHistoryIds
    );

    setRoundQuestions(selectedQuestions);
    setRecentHistoryIds(updatedHistory);
    setCurrentQuestionIndex(0);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];
    const initialPlayers: ArenaPlayerState[] = config.playerNames.map((name, i) => ({
      id: `arena-p-${i + 1}`,
      name: name.trim() || `Đấu sĩ ${i + 1}`,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      currentStreak: 0,
      maxStreak: 0,
      avatarColor: colors[i % colors.length],
      selectedOption: null,
      responseTimeMs: 0,
      lastScoreGain: 0,
    }));

    setPlayers(initialPlayers);
    setGameState('playing');
    setTimeLeft(config.timeLimitPerQuestion);
    startTimeRef.current = Date.now();
    resetZoneStates();
  };

  // Countdown timer for active question
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      // Time expired: finalize all unanswered players
      handleRoundTimeUp();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  // Player answers during the round
  const handlePlayerChooseOption = (playerId: string, option: QuizOptionKeyEnum) => {
    if (gameState !== 'playing') return;

    const responseMs = Date.now() - startTimeRef.current;
    const currentQ = roundQuestions[currentQuestionIndex];
    const isCorrect = option === currentQ.correctAnswer;

    if (isCorrect) {
      soundEffects.playCorrect();
    } else {
      soundEffects.playWrong();
    }

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId && p.selectedOption === null) {
          const { scoreGain, streak } = MathArenaService.calculateQuestionScore(
            isCorrect,
            responseMs,
            config.timeLimitPerQuestion,
            config.speedBonusEnabled,
            p.currentStreak
          );

          return {
            ...p,
            selectedOption: option,
            responseTimeMs: responseMs,
            lastScoreGain: scoreGain,
            score: p.score + scoreGain,
            correctCount: isCorrect ? p.correctCount + 1 : p.correctCount,
            wrongCount: !isCorrect ? p.wrongCount + 1 : p.wrongCount,
            currentStreak: streak,
            maxStreak: Math.max(p.maxStreak, streak),
          };
        }
        return p;
      })
    );
  };

  // When time runs out or all players have answered
  const handleRoundTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('question_result');
  };

  // Check if all players answered
  useEffect(() => {
    if (gameState === 'playing' && players.length > 0) {
      const allAnswered = players.every((p) => p.selectedOption !== null);
      if (allAnswered) {
        handleRoundTimeUp();
      }
    }
  }, [players, gameState]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (gameState === 'question_result' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleNextQuestion();
      } else if (gameState === 'playing') {
        const key = e.key.toUpperCase();
        // Player 1: 1, 2, 3, 4 or A, B, C, D
        if (players.length > 0 && players[0].selectedOption === null) {
          if (key === '1' || key === 'A') handlePlayerChooseOption(players[0].id, QuizOptionKeyEnum.A);
          else if (key === '2' || key === 'B') handlePlayerChooseOption(players[0].id, QuizOptionKeyEnum.B);
          else if (key === '3' || key === 'C') handlePlayerChooseOption(players[0].id, QuizOptionKeyEnum.C);
          else if (key === '4' || key === 'D') handlePlayerChooseOption(players[0].id, QuizOptionKeyEnum.D);
        }
        // Player 2: 5, 6, 7, 8 or J, K, L, ;
        if (players.length > 1 && players[1].selectedOption === null) {
          if (key === '5' || key === 'J') handlePlayerChooseOption(players[1].id, QuizOptionKeyEnum.A);
          else if (key === '6' || key === 'K') handlePlayerChooseOption(players[1].id, QuizOptionKeyEnum.B);
          else if (key === '7' || key === 'L') handlePlayerChooseOption(players[1].id, QuizOptionKeyEnum.C);
          else if (key === '8' || key === ';') handlePlayerChooseOption(players[1].id, QuizOptionKeyEnum.D);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, players]);

  // Next question
  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= roundQuestions.length) {
      soundEffects.playVictory();
      setGameState('finished');
    } else {
      setCurrentQuestionIndex(nextIdx);
      // Reset player per-round states
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          selectedOption: null,
          responseTimeMs: 0,
          lastScoreGain: 0,
        }))
      );
      setGameState('playing');
      setTimeLeft(config.timeLimitPerQuestion);
      startTimeRef.current = Date.now();
      resetZoneStates();
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentQ = roundQuestions[currentQuestionIndex];
  const sortedPlayers = MathArenaService.rankPlayers(players);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0A0E17] text-white flex flex-col font-sans select-none overflow-x-hidden"
    >
      {/* Top Header Bar */}
      <header className="border-b border-[#30363D] bg-[#161B22]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-rose-500/20">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                ĐẤU TRƯỜNG TOÁN HỌC
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Live Arena
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {config.subject} • {config.lessonTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#21262D] border border-[#30363D] text-xs font-bold text-gray-300 hover:text-rose-400 hover:border-rose-500/40 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Thoát Game</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-stretch justify-start">
        {/* ==================================================== */}
        {/* 1. CONFIGURATION SCREEN                              */}
        {/* ==================================================== */}
        {gameState === 'configuring' && (
          <div className="w-full max-w-4xl mx-auto bg-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                SÂN ĐẤU THỜI GIAN THỰC
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Thiết Lập Đấu Trường Toán Học
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                Cùng lúc so tài tốc độ nhẩm và kiến thức Toán THCS với điểm thưởng chuỗi thắng (Streak)!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lesson Selection */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  <span>Bài Học THCS:</span>
                </label>
                <select
                  value={selectedLessonIndex}
                  onChange={(e) => handleLessonChange(Number(e.target.value))}
                  className="w-full bg-[#161B22] border border-[#30363D] text-white text-xs rounded-xl p-2.5 focus:border-rose-500 focus:outline-hidden"
                >
                  {lessons.map((les, idx) => (
                    <option key={les.id} value={idx}>
                      Lớp {les.grade} - {les.lessonTitle} ({les.questionBank.length} câu)
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Mục Đích Thi Đấu:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, purpose: 'warm-up' }))}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      config.purpose === 'warm-up'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-[#161B22] text-gray-400 border-[#30363D]'
                    }`}
                  >
                    🚀 Khởi Động
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, purpose: 'practice' }))}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      config.purpose === 'practice'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-[#161B22] text-gray-400 border-[#30363D]'
                    }`}
                  >
                    🎯 Luyện Tập
                  </button>
                </div>
              </div>

              {/* Question Pool / Exam Set Setting */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Bạn chọn đề nào</div>
                  <div className="text-xs text-gray-400">
                    Số câu đã chọn: <span className="font-mono text-emerald-400 font-bold">{config.questionPoolIds.length}</span> câu
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuestionBankOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-600 hover:text-white transition cursor-pointer"
                >
                  Tùy Chọn Đề
                </button>
              </div>

              {/* Speed Bonus Toggle & Round length */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>Thưởng Tốc Độ (Speed Bonus):</span>
                  <input
                    type="checkbox"
                    checked={config.speedBonusEnabled}
                    onChange={(e) => setConfig((p) => ({ ...p, speedBonusEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-rose-500"
                  />
                </label>
                <div className="flex gap-2 pt-1">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, questionsPerRound: count }))}
                      className={`flex-1 py-1 rounded-xl text-xs font-mono font-bold border transition ${
                        config.questionsPerRound === count
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-[#161B22] text-gray-400 border-[#30363D]'
                      }`}
                    >
                      {count} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Players List Config */}
            <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Danh Sách Đấu Sĩ / Đội ({config.playerNames.length}):</span>
                </label>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        const newNames = Array.from({ length: count }, (_, i) =>
                          config.playerNames[i] || `Đấu sĩ ${i + 1}`
                        );
                        setConfig((p) => ({ ...p, playerNames: newNames }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition ${
                        config.playerNames.length === count
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#161B22] text-gray-400 border-[#30363D]'
                      }`}
                    >
                      {count} người
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {config.playerNames.map((name, i) => (
                  <input
                    key={i}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const updated = [...config.playerNames];
                      updated[i] = e.target.value;
                      setConfig((p) => ({ ...p, playerNames: updated }));
                    }}
                    placeholder={`Tên đấu sĩ ${i + 1}`}
                    className="bg-[#161B22] border border-[#30363D] text-white text-xs rounded-xl p-2 focus:border-rose-500 focus:outline-hidden"
                  />
                ))}
              </div>
            </div>

            {/* Input Mode Selector in Setup */}
            <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-rose-400" />
                <span>Phương Thức Trả Lời (Thiết Lập Trước Khi Vào Đấu Trường)</span>
              </label>
              <GameInputSelector
                currentMode={inputMode}
                onModeChange={setInputMode}
                allowedModes={config.playerNames.length === 1 ? ['camera', 'voice', 'manual'] : ['camera', 'manual']}
                playerCount={config.playerNames.length}
              />
              {inputMode === 'camera' && (
                <div className="animate-fadeIn">
                  <CameraGestureOverlay
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    mediaStream={mediaStream}
                    isCameraActive={isCameraActive}
                    isLoadingModel={isLoadingModel}
                    cameraError={cameraError}
                    zoneCount={config.playerNames.length}
                    zoneDetections={zoneDetections}
                    onManualTrigger={(_zIdx, _opt) => {}}
                    onRetryCamera={retryCamera}
                    availableCameras={availableCameras}
                    activeDeviceId={activeDeviceId}
                    onSelectCamera={setActiveDeviceId}
                    playerLabels={config.playerNames}
                  />
                </div>
              )}
            </div>

            {/* Start Arena */}
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-red-600 text-white font-black text-base tracking-wide shadow-xl shadow-rose-500/25 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords className="w-5 h-5" />
              <span>KHỞI TRANH ĐẤU TRƯỜNG TOÁN HỌC</span>
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. PLAYING / ACTIVE QUESTION SCREEN                  */}
        {/* ==================================================== */}
        {(gameState === 'playing' || gameState === 'question_result') && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT / CENTER: THE MAIN QUESTION STAGE (Dominant visual weight for classroom viewing) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* Question Banner Box */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
                {/* Question Header: Round Counter, Topic & Countdown Timer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363D] pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      CÂU {currentQuestionIndex + 1}/{roundQuestions.length}
                    </span>
                    {config.speedBonusEnabled && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Thưởng tốc độ</span>
                      </span>
                    )}
                  </div>

                  {/* Countdown Timer with animated urgency indicator */}
                  <div
                    className={`flex items-center gap-2 font-mono text-sm sm:text-base font-black px-4 py-1.5 rounded-xl border transition-all ${
                      timeLeft <= 5
                        ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
                        : timeLeft <= 10
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-[#0A0E17] border-[#30363D] text-emerald-400'
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
                    <span>{timeLeft}s</span>
                  </div>
                </div>

                {/* Question Content (Large Typography & Math Formatter) */}
                <div className="py-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed tracking-tight">
                    <MathRenderer text={currentQ?.content || ''} isLarge />
                  </h2>
                </div>

                {/* Optional Mathematical Geometry Diagram or Table View */}
                {(currentQ?.diagram || currentQ?.tableData) && (
                  <div className="p-3 bg-[#0A0E17] rounded-2xl border border-[#30363D] flex justify-center overflow-x-auto">
                    <MathDiagramView
                      diagram={currentQ.diagram}
                      tableData={currentQ.tableData}
                      className="w-full"
                    />
                  </div>
                )}

                {/* 4 Large Options (2x2 Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 pt-1">
                  {currentQ?.options.map((opt) => {
                    const isRevealed = gameState === 'question_result';
                    const isCorrect = opt.key === currentQ.correctAnswer;

                    return (
                      <div
                        key={opt.key}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between ${
                          isRevealed && isCorrect
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 font-bold ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-900/30'
                            : 'bg-[#0A0E17] border-[#30363D] text-gray-100 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-mono font-black flex items-center justify-center text-lg sm:text-xl shrink-0 ${
                              isRevealed && isCorrect
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-400/20'
                                : 'bg-[#21262D] border border-[#30363D] text-rose-400'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="text-base sm:text-lg md:text-xl font-bold leading-relaxed">
                            <MathRenderer text={opt.text} />
                          </span>
                        </div>
                        {isRevealed && isCorrect && (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Question Result Reveal & Next Question CTA */}
                {gameState === 'question_result' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0E17] border border-emerald-500/50 space-y-3 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="text-sm sm:text-base text-gray-200 space-y-1.5 flex-1">
                        <div>
                          Đáp án đúng là:{' '}
                          <strong className="text-emerald-400 font-mono text-base sm:text-lg">
                            [ {currentQ.correctAnswer} ] -{' '}
                            <MathRenderer
                              text={currentQ.options.find((o) => o.key === currentQ.correctAnswer)?.text || ''}
                            />
                          </strong>
                        </div>
                        {currentQ.explanation && (
                          <div className="text-xs sm:text-sm text-gray-300 bg-[#161B22] p-2.5 rounded-xl border border-[#30363D]">
                            <strong className="text-amber-400">💡 Giải thích:</strong>{' '}
                            <MathRenderer text={currentQ.explanation} />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-sm sm:text-base hover:opacity-95 transition flex items-center gap-2 cursor-pointer shadow-xl shadow-rose-600/30 shrink-0 animate-pulse"
                      >
                        <span>Câu Tiếp Theo</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: LIVE ARENA HUD, CAMERA AI & BUZZ PADS */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              {/* Input Mode Selector Bar */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-2.5">
                <GameInputSelector
                  currentMode={inputMode}
                  onModeChange={setInputMode}
                  allowedModes={players.length === 1 ? ['camera', 'voice', 'manual'] : ['camera', 'manual']}
                  playerCount={players.length}
                  onTurnOffCamera={() => setInputMode('manual')}
                />
              </div>

              {/* Compact Camera AI Preview when in camera mode */}
              {inputMode === 'camera' && (
                <div className="animate-fadeIn">
                  <CameraGestureOverlay
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    mediaStream={mediaStream}
                    isCameraActive={isCameraActive}
                    isLoadingModel={isLoadingModel}
                    cameraError={cameraError}
                    zoneCount={players.length}
                    zoneDetections={zoneDetections}
                    onManualTrigger={(zIdx, opt) => {
                      if (players[zIdx]) handlePlayerChooseOption(players[zIdx].id, opt);
                    }}
                    onRetryCamera={retryCamera}
                    onTurnOffCamera={() => setInputMode('manual')}
                    availableCameras={availableCameras}
                    activeDeviceId={activeDeviceId}
                    onSelectCamera={setActiveDeviceId}
                    playerLabels={players.map((p) => p.name)}
                    compact={true}
                  />
                </div>
              )}

              {inputMode === 'voice' && players.length === 1 && (
                <div className="animate-fadeIn">
                  <VoiceRecognitionOverlay
                    isActive={gameState === 'playing'}
                    isLocked={players[0]?.selectedOption !== null}
                    lockedOption={players[0]?.selectedOption || null}
                    onOptionRecognized={(opt) => {
                      if (gameState === 'playing' && players[0]?.selectedOption === null) {
                        handlePlayerChooseOption(players[0].id, opt);
                      }
                    }}
                  />
                </div>
              )}

              {/* Live Leaderboard & Player Buzz Controls */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#30363D]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Bảng Điểm & Chuỗi Thắng</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    {players.filter((p) => p.selectedOption !== null).length}/{players.length} đã chốt
                  </span>
                </div>

                {/* Player Cards with Fast Buzz Buttons */}
                <div className="space-y-3">
                  {sortedPlayers.map((p, idx) => {
                    const isLocked = p.selectedOption !== null || gameState === 'question_result';
                    const isCorrect = p.selectedOption === currentQ.correctAnswer;

                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-[#0A0E17] border border-[#30363D] space-y-2.5 transition hover:border-gray-600"
                      >
                        {/* Player Header Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg font-mono font-extrabold text-xs flex items-center justify-center shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                                  : idx === 1
                                  ? 'bg-gray-300 text-slate-950'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-[#21262D] text-gray-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: p.avatarColor }}
                                />
                                <span className="truncate">{p.name}</span>
                                {p.currentStreak >= 2 && (
                                  <span className="flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-md border border-amber-500/20 shrink-0">
                                    <Flame className="w-3 h-3 fill-amber-400" />
                                    <span>x{p.currentStreak}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm sm:text-base font-mono font-black text-rose-400">
                              {p.score}đ
                            </div>
                            {gameState === 'question_result' && p.lastScoreGain > 0 && (
                              <div className="text-[10px] font-mono text-emerald-400 font-bold animate-bounce">
                                +{p.lastScoreGain}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Player Answer Status & Fast Click/Touch Buttons */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 font-medium">Bấm đáp án nhanh:</span>
                            {p.selectedOption ? (
                              <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã chọn: [{p.selectedOption}]</span>
                              </span>
                            ) : (
                              <span className="text-amber-400/80 font-mono italic text-[10px]">
                                ⏳ Đang suy nghĩ...
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            {[QuizOptionKeyEnum.A, QuizOptionKeyEnum.B, QuizOptionKeyEnum.C, QuizOptionKeyEnum.D].map(
                              (optKey) => {
                                const isThisSelected = p.selectedOption === optKey;
                                let btnClass =
                                  'bg-[#161B22] border-[#30363D] text-gray-300 hover:bg-[#21262D] hover:text-white';

                                if (isThisSelected) {
                                  if (gameState === 'question_result') {
                                    btnClass = isCorrect
                                      ? 'bg-emerald-600 text-white font-black border-emerald-400 shadow-md shadow-emerald-500/20'
                                      : 'bg-rose-600 text-white font-black border-rose-400';
                                  } else {
                                    btnClass = 'bg-blue-600 text-white font-black border-blue-400 shadow-md shadow-blue-500/20';
                                  }
                                }

                                return (
                                  <button
                                    key={optKey}
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => handlePlayerChooseOption(p.id, optKey)}
                                    className={`py-1.5 sm:py-2 rounded-xl text-sm sm:text-base font-mono font-black border transition cursor-pointer ${btnClass} disabled:cursor-default disabled:opacity-50`}
                                  >
                                    {optKey}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Keyboard Shortcut Help Tip */}
                <div className="pt-2 border-t border-[#30363D] text-[11px] text-gray-400 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span>💡 Phím tắt VĐV 1:</span>
                    <span className="font-mono text-gray-300">[1, 2, 3, 4] hoặc [A, B, C, D]</span>
                  </div>
                  {players.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span>💡 Phím tắt VĐV 2:</span>
                      <span className="font-mono text-gray-300">[5, 6, 7, 8] hoặc [J, K, L, ;]</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. FINISHED ARENA SCREEN                             */}
        {/* ==================================================== */}
        {gameState === 'finished' && (
          <div className="w-full max-w-5xl mx-auto bg-[#161B22] border border-[#30363D] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                KẾT QUẢ ĐẤU TRƯỜNG TOÁN HỌC
              </span>
              <h2 className="text-3xl font-black text-white">VINH DANH ĐẤU SĨ QUÁN QUÂN</h2>
            </div>

            {/* Podium */}
            <div className="grid grid-cols-3 gap-3 items-end max-w-md mx-auto pt-4">
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center">
                  <span className="text-2xl">🥈</span>
                  <div className="font-bold text-xs text-gray-300 truncate max-w-full">
                    {sortedPlayers[1].name}
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-400">
                    {sortedPlayers[1].score}đ
                  </div>
                  <div className="h-16 w-full rounded-t-xl bg-[#21262D] border-t border-x border-[#30363D] flex items-center justify-center font-bold text-gray-400 text-xs">
                    Hạng 2
                  </div>
                </div>
              )}

              {sortedPlayers[0] && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl animate-bounce">👑 🥇</span>
                  <div className="font-extrabold text-sm text-amber-300 truncate max-w-full">
                    {sortedPlayers[0].name}
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-400">
                    {sortedPlayers[0].score}đ
                  </div>
                  <div className="h-24 w-full rounded-t-xl bg-gradient-to-b from-rose-600 to-amber-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-rose-500/20">
                    CHIẾN BINH TOÁN HỌC
                  </div>
                </div>
              )}

              {sortedPlayers[2] && (
                <div className="flex flex-col items-center">
                  <span className="text-2xl">🥉</span>
                  <div className="font-bold text-xs text-gray-300 truncate max-w-full">
                    {sortedPlayers[2].name}
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-400">
                    {sortedPlayers[2].score}đ
                  </div>
                  <div className="h-12 w-full rounded-t-xl bg-[#21262D] border-t border-x border-[#30363D] flex items-center justify-center font-bold text-amber-500/80 text-xs">
                    Hạng 3
                  </div>
                </div>
              )}
            </div>

            {/* Summary Table for all players */}
            <div className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#0A0E17]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161B22] text-gray-400 font-semibold border-b border-[#30363D]">
                  <tr>
                    <th className="p-3 text-center w-14">Hạng</th>
                    <th className="p-3">Đấu Sĩ</th>
                    <th className="p-3 text-center">Chuỗi Đúng Tối Đa</th>
                    <th className="p-3 text-center">Đúng / Tổng</th>
                    <th className="p-3 text-right">Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262D]">
                  {sortedPlayers.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-[#161B22]/50 transition">
                      <td className="p-3 text-center font-mono font-bold text-gray-300">
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                      </td>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: p.avatarColor }}
                        />
                        <span>{p.name}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-400">
                        🔥 {p.maxStreak}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">
                        {p.correctCount} / {roundQuestions.length}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-rose-400 text-sm">
                        {p.score} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={handleStartGame}
                className="py-3 px-4 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/25"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thi Đấu Lại Vòng Khác</span>
              </button>

              <button
                type="button"
                onClick={() => setGameState('configuring')}
                className="py-3 px-4 rounded-xl bg-[#21262D] border border-[#30363D] text-gray-300 font-bold text-xs hover:bg-[#30363D] hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Cấu Hình Bài Mới</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Question Bank Modal */}
      {isQuestionBankOpen && (
        <QuestionBankModal
          isOpen={isQuestionBankOpen}
          subject={currentLesson.subject}
          lessonTitle={currentLesson.lessonTitle}
          allLessonQuestions={currentLesson.questionBank}
          selectedQuestionIds={config.questionPoolIds}
          minRequired={config.questionsPerRound}
          onClose={() => setIsQuestionBankOpen(false)}
          onSavePool={(newIds) => {
            setConfig((prev) => ({ ...prev, questionPoolIds: newIds }));
            setIsQuestionBankOpen(false);
          }}
        />
      )}
    </div>
  );
};
