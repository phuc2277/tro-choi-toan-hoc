import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { WheelSector, WheelPlayerState, WheelGameConfig } from '../types/GamePlatform';
import { QuestionSelectionService } from '../services/QuestionSelectionService';
import { WheelGameService, DEFAULT_WHEEL_SECTORS } from '../services/WheelGameService';
import { QuestionBankModal } from './QuestionBankModal';
import { CameraGestureOverlay } from './CameraGestureOverlay';
import { VoiceRecognitionOverlay } from './VoiceRecognitionOverlay';
import { GameInputSelector, InputModeType } from './GameInputSelector';
import { MathRenderer } from './MathRenderer';
import { MathDiagramView } from './MathDiagramView';
import { soundEffects } from '../services/SoundEffects';
import { useMediaPipeHands } from '../gesture-quiz/hooks/useMediaPipeHands';
import {
  Disc,
  Trophy,
  Play,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  User,
  Settings,
  ArrowRight,
  Maximize2,
  Minimize2,
  LogOut,
  Sparkles,
  BookOpen,
  Award,
  Compass,
  Eye,
  EyeOff,
  MousePointer,
  X,
} from 'lucide-react';

interface WheelGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
}

export const WheelGame: React.FC<WheelGameProps> = ({ lessons, onExitToMenu }) => {
  // 1. Setup & Configuration State
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const currentLesson = lessons[selectedLessonIndex] || lessons[0];

  const [config, setConfig] = useState<WheelGameConfig>({
    purpose: 'warm-up',
    subject: currentLesson.subject,
    lessonTitle: currentLesson.lessonTitle,
    questionPoolIds: currentLesson.questionBank.map((q) => q.id),
    questionsPerRound: 8,
    timeLimitPerQuestion: 20,
    competitionMode: 'individual',
    playerNames: ['Học sinh 1', 'Học sinh 2', 'Học sinh 3', 'Học sinh 4'],
  });

  // Lifecycle
  const [gameState, setGameState] = useState<
    'configuring' | 'ready' | 'spinning' | 'question' | 'question_result' | 'finished'
  >('configuring');

  // Question Pool Modal
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState<boolean>(false);

  // Active Game State
  const [roundQuestions, setRoundQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [recentHistoryIds, setRecentHistoryIds] = useState<string[]>([]);

  // Wheel State
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [activeSector, setActiveSector] = useState<WheelSector | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Players State
  const [players, setPlayers] = useState<WheelPlayerState[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);

  // Input Mode: Camera / Voice / Manual (Default to camera for AI gesture detection)
  const [inputMode, setInputMode] = useState<InputModeType>('camera');
  const [showCameraHud, setShowCameraHud] = useState<boolean>(true);

  // Timer & Selected Answer
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [selectedAnswer, setSelectedAnswer] = useState<QuizOptionKeyEnum | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    message: string;
    scoreDelta: number;
  } | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    zoneCount: 1,
    isActive: inputMode === 'camera' && gameState !== 'finished',
    onZoneAnswerLocked: (_zIdx, option) => {
      if (gameState === 'question' && selectedAnswer === null) {
        handleAnswerSubmit(option);
      }
    },
  });

  // Update config when lesson changes
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

  // Start game with Question Pool validation
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

    // Init players
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];
    const initialPlayers: WheelPlayerState[] = config.playerNames.map((name, i) => ({
      id: `p-${i + 1}`,
      name: name.trim() || `Người chơi ${i + 1}`,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      isTurnLost: false,
      avatarColor: colors[i % colors.length],
    }));

    setPlayers(initialPlayers);
    setCurrentPlayerIndex(0);
    setActiveSector(null);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setGameState('ready');
  };

  // Spin Wheel Action
  const handleSpinWheel = () => {
    if (isSpinning || gameState !== 'ready') return;

    setIsSpinning(true);
    setGameState('spinning');
    setSelectedAnswer(null);
    setAnswerFeedback(null);

    const { targetAngle, selectedSector } = WheelGameService.calculateSpinTarget(
      wheelRotation,
      DEFAULT_WHEEL_SECTORS
    );

    setWheelRotation(targetAngle);

    // Animation ends after 4 seconds
    setTimeout(() => {
      setIsSpinning(false);
      setActiveSector(selectedSector);

      if (selectedSector.type === 'lose_turn') {
        // Lose turn immediately
        setAnswerFeedback({
          isCorrect: false,
          message: `Ô Mất Lượt! ${players[currentPlayerIndex]?.name} bị mất lượt này.`,
          scoreDelta: 0,
        });
        setGameState('question_result');
      } else {
        // Proceed to Question
        setGameState('question');
        setTimeLeft(config.timeLimitPerQuestion);
      }
    }, 4200);
  };

  // Timer countdown during question
  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (gameState === 'question' && timeLeft === 0 && selectedAnswer === null) {
      // Time expired
      handleAnswerSubmit(null);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft, selectedAnswer]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (gameState === 'ready' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleSpinWheel();
      } else if (gameState === 'question' && selectedAnswer === null) {
        const key = e.key.toUpperCase();
        let chosen: QuizOptionKeyEnum | null = null;
        if (key === '1' || key === 'A') chosen = QuizOptionKeyEnum.A;
        else if (key === '2' || key === 'B') chosen = QuizOptionKeyEnum.B;
        else if (key === '3' || key === 'C') chosen = QuizOptionKeyEnum.C;
        else if (key === '4' || key === 'D') chosen = QuizOptionKeyEnum.D;

        if (chosen) {
          e.preventDefault();
          handleAnswerSubmit(chosen);
        }
      } else if (gameState === 'question_result' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleNextTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedAnswer, isSpinning]);

  // Handle answer submission
  const handleAnswerSubmit = (option: QuizOptionKeyEnum | null) => {
    if (gameState !== 'question' || selectedAnswer !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(option);
    const activeQ = roundQuestions[currentQuestionIndex];
    const isCorrect = option === activeQ.correctAnswer;
    const activePlayer = players[currentPlayerIndex];

    const { updatedScore, scoreDelta, message } = WheelGameService.resolveAnswerScore(
      activePlayer,
      activeSector || DEFAULT_WHEEL_SECTORS[0],
      isCorrect
    );

    // Update player stats
    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx === currentPlayerIndex) {
          return {
            ...p,
            score: updatedScore,
            correctCount: isCorrect ? p.correctCount + 1 : p.correctCount,
            wrongCount: !isCorrect ? p.wrongCount + 1 : p.wrongCount,
          };
        }
        return p;
      })
    );

    if (isCorrect) {
      soundEffects.playCorrect();
    } else {
      soundEffects.playWrong();
    }

    setAnswerFeedback({ isCorrect, message, scoreDelta });
    setGameState('question_result');
  };

  // Advance to next turn / question
  const handleNextTurn = () => {
    const isFreeTurn = activeSector?.type === 'free_turn' && answerFeedback?.isCorrect;
    const nextPlayerIdx = isFreeTurn
      ? currentPlayerIndex
      : (currentPlayerIndex + 1) % players.length;

    const nextQIdx = currentQuestionIndex + 1;

    if (nextQIdx >= roundQuestions.length) {
      soundEffects.playVictory();
      setGameState('finished');
    } else {
      setCurrentPlayerIndex(nextPlayerIdx);
      setCurrentQuestionIndex(nextQIdx);
      setActiveSector(null);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
      setGameState('ready');
      resetZoneStates();
    }
  };

  // Fullscreen toggle
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
  const activePlayer = players[currentPlayerIndex];
  const sortedPlayers = WheelGameService.rankPlayers(players);

  // SVG Wheel drawing math
  const sectorCount = DEFAULT_WHEEL_SECTORS.length;
  const sectorAngle = 360 / sectorCount;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0A0E17] text-white flex flex-col font-sans select-none overflow-x-hidden"
    >
      {/* Top Header Bar */}
      <header className="border-b border-[#30363D] bg-[#161B22]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  CHIẾC NÓN KỲ DIỆU
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Toán THCS
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
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-stretch justify-start">
        {/* ==================================================== */}
        {/* 1. CONFIGURATION SCREEN                              */}
        {/* ==================================================== */}
        {gameState === 'configuring' && (
          <div className="w-full max-w-4xl mx-auto bg-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                CẤU HÌNH VÒNG QUAY TOÁN HỌC
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Thiết Lập Chiếc Nón Kỳ Diệu
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                Tùy chỉnh bài học, ngân hàng câu hỏi và danh sách người chơi/đội thi trước khi bắt đầu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lesson Selection */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Chọn Bài Học THCS:</span>
                </label>
                <select
                  value={selectedLessonIndex}
                  onChange={(e) => handleLessonChange(Number(e.target.value))}
                  className="w-full bg-[#161B22] border border-[#30363D] text-white text-xs rounded-xl p-2.5 focus:border-blue-500 focus:outline-hidden"
                >
                  {lessons.map((les, idx) => (
                    <option key={les.id} value={idx}>
                      Lớp {les.grade} - {les.lessonTitle} ({les.questionBank.length} câu)
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose & Competition */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Mục Đích Hoạt Động:</span>
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
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
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
                    Đã chọn: <span className="font-mono text-emerald-400 font-bold">{config.questionPoolIds.length}</span> / {currentLesson.questionBank.length} câu
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuestionBankOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-600 hover:text-white transition cursor-pointer"
                >
                  Tùy Chọn Đề
                </button>
              </div>

              {/* Questions per Round */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300">Số Lượt/Câu Hỏi Mỗi Trận:</label>
                <div className="flex gap-2">
                  {[6, 8, 10, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, questionsPerRound: num }))}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                        config.questionsPerRound === num
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-[#161B22] text-gray-400 border-[#30363D]'
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Players Setup */}
            <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Danh Sách Người Chơi / Đội ({config.playerNames.length}):</span>
                </label>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        const newNames = Array.from({ length: count }, (_, i) =>
                          config.playerNames[i] || `Người chơi ${i + 1}`
                        );
                        setConfig((p) => ({ ...p, playerNames: newNames }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition ${
                        config.playerNames.length === count
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
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
                    placeholder={`Tên người chơi ${i + 1}`}
                    className="bg-[#161B22] border border-[#30363D] text-white text-xs rounded-xl p-2 focus:border-emerald-500 focus:outline-hidden"
                  />
                ))}
              </div>
            </div>

            {/* Input Mode Selector in Setup */}
            <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-400" />
                <span>Phương Thức Trả Lời (Thiết Lập Trước Khi Quay)</span>
              </label>
              <GameInputSelector
                currentMode={inputMode}
                onModeChange={setInputMode}
                allowedModes={config.playerNames.length === 1 ? ['camera', 'voice', 'manual'] : ['camera', 'manual']}
                playerCount={config.playerNames.length}
                onTurnOffCamera={() => setInputMode('manual')}
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
                    onTurnOffCamera={() => setInputMode('manual')}
                    availableCameras={availableCameras}
                    activeDeviceId={activeDeviceId}
                    onSelectCamera={setActiveDeviceId}
                    playerLabels={config.playerNames}
                  />
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-slate-950 font-black text-base tracking-wide shadow-xl shadow-amber-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>BẮT ĐẦU VÒNG QUAY CHIẾC NÓN KỲ DIỆU</span>
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. PLAYING / READY / SPINNING / QUESTION SCREEN      */}
        {/* ==================================================== */}
        {(gameState === 'ready' ||
          gameState === 'spinning' ||
          gameState === 'question' ||
          gameState === 'question_result') && (
          <div className="w-full space-y-4">
            {/* When In Question Mode: Prioritize Big Question & Answers */}
            {gameState === 'question' || gameState === 'question_result' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
                {/* Main: Question and Answers (Huge, high-contrast, classroom-optimized) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                    {/* Header Info */}
                    <div className="flex items-center justify-between border-b border-[#30363D] pb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-black px-3.5 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          CÂU {currentQuestionIndex + 1}/{roundQuestions.length}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-gray-300">
                          Lượt trả lời:{' '}
                          <strong className="text-amber-400 font-extrabold text-base sm:text-lg">
                            {activePlayer?.name}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeSector && (
                          <span
                            className="text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl border border-white/20 shadow-md"
                            style={{ backgroundColor: activeSector.color, color: activeSector.textColor }}
                          >
                            Ô Thưởng: {activeSector.label}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 font-mono text-base font-black text-amber-400 bg-[#0A0E17] px-4 py-1.5 rounded-xl border border-[#30363D]">
                          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                          <span>{timeLeft}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Question Content with MathRenderer & Diagram/Table */}
                    <div className="space-y-4">
                      <div className="bg-[#0A0E17] border-2 border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-inner">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-relaxed tracking-tight text-center sm:text-left">
                          <MathRenderer text={currentQ?.content || ''} />
                        </h2>

                        {/* Math Geometry Diagram or Data Table */}
                        {(currentQ?.diagram || currentQ?.tableData) && (
                          <div className="mt-4 pt-4 border-t border-[#30363D] flex justify-center">
                            <MathDiagramView
                              diagram={currentQ.diagram}
                              tableData={currentQ.tableData}
                            />
                          </div>
                        )}
                      </div>

                      {/* 4 Massive Options in 2x2 Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {currentQ?.options.map((opt) => {
                          const isSelected = selectedAnswer === opt.key;
                          const isCorrect = opt.key === currentQ.correctAnswer;
                          const isLocked = selectedAnswer !== null;

                          let btnStyle =
                            'bg-[#0A0E17] border-2 border-[#30363D] text-gray-100 hover:border-amber-400 hover:bg-[#1f242c] hover:scale-[1.01]';

                          if (isLocked) {
                            if (isCorrect) {
                              btnStyle =
                                'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-100 font-black shadow-lg shadow-emerald-500/20';
                            } else if (isSelected && !isCorrect) {
                              btnStyle =
                                'bg-rose-950/80 border-2 border-rose-400 text-rose-100 font-bold';
                            } else {
                              btnStyle =
                                'bg-[#0A0E17]/40 border-[#30363D]/60 opacity-30 text-gray-500';
                            }
                          }

                          return (
                            <button
                              key={opt.key}
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleAnswerSubmit(opt.key)}
                              className={`p-6 sm:p-7 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between cursor-pointer min-h-[90px] sm:min-h-[110px] ${btnStyle}`}
                            >
                              <div className="flex items-center gap-4">
                                <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-mono font-black flex items-center justify-center bg-[#21262D] border-2 border-[#30363D] text-2xl sm:text-3xl shrink-0 text-amber-400 shadow-md">
                                  {opt.key}
                                </span>
                                <span className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug">
                                  <MathRenderer text={opt.text} />
                                </span>
                              </div>
                              {isLocked && isCorrect && (
                                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 shrink-0" />
                              )}
                              {isLocked && isSelected && !isCorrect && (
                                <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Feedback Box & Next Turn */}
                    {gameState === 'question_result' && answerFeedback && (
                      <div className="p-6 rounded-2xl bg-[#0A0E17] border-2 border-[#30363D] space-y-4 animate-fadeIn">
                        <div className="flex items-start gap-4">
                          {answerFeedback.isCorrect ? (
                            <CheckCircle2 className="w-9 h-9 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-9 h-9 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="text-lg sm:text-xl font-black text-white">
                              {answerFeedback.message}
                            </div>
                            {currentQ?.explanation && (
                              <div className="text-base text-gray-300 mt-2.5 bg-[#161B22] p-4 rounded-xl border border-[#30363D] leading-relaxed">
                                <strong className="text-amber-400 font-bold">Giải thích: </strong>
                                <MathRenderer text={currentQ.explanation} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={handleNextTurn}
                            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base transition flex items-center gap-2.5 cursor-pointer shadow-xl shadow-blue-500/25"
                          >
                            <span>Tiếp Tục Lượt Tiếp Theo</span>
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side HUD: Input Mode & Camera/Voice & Score Summary */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Mode Selector */}
                  <div className="bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Phương Thức Trả Lời:
                      </span>
                      {inputMode === 'camera' && (
                        <button
                          type="button"
                          onClick={() => setShowCameraHud((p) => !p)}
                          className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/15 px-2.5 py-1 rounded-lg border border-blue-500/30 cursor-pointer"
                        >
                          {showCameraHud ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showCameraHud ? 'Thu gọn Camera' : 'Hiện Camera'}</span>
                        </button>
                      )}
                    </div>

                    <GameInputSelector
                      currentMode={inputMode}
                      onModeChange={setInputMode}
                      allowedModes={['manual', 'camera', 'voice']}
                      playerCount={1}
                      onTurnOffCamera={() => setInputMode('manual')}
                    />

                    {/* Camera Video Overlay */}
                    {inputMode === 'camera' && showCameraHud && (
                      <div className="animate-fadeIn pt-2">
                        <CameraGestureOverlay
                          videoRef={videoRef}
                          canvasRef={canvasRef}
                          mediaStream={mediaStream}
                          isCameraActive={isCameraActive}
                          isLoadingModel={isLoadingModel}
                          cameraError={cameraError}
                          zoneCount={1}
                          zoneDetections={zoneDetections}
                          onManualTrigger={(_zIdx, opt) => handleAnswerSubmit(opt)}
                          onRetryCamera={retryCamera}
                          onTurnOffCamera={() => setInputMode('manual')}
                          availableCameras={availableCameras}
                          activeDeviceId={activeDeviceId}
                          onSelectCamera={setActiveDeviceId}
                          playerLabels={[activePlayer?.name || 'Người chơi']}
                        />
                      </div>
                    )}

                    {inputMode === 'voice' && (
                      <div className="animate-fadeIn pt-2">
                        <VoiceRecognitionOverlay
                          isActive={gameState === 'question'}
                          isLocked={selectedAnswer !== null}
                          lockedOption={selectedAnswer}
                          onOptionRecognized={(opt) => {
                            if (gameState === 'question' && selectedAnswer === null) {
                              handleAnswerSubmit(opt);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Compact Player Status Box */}
                  <div className="bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-5 shadow-xl space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Điểm Số Các Người Chơi</span>
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </h4>
                    <div className="space-y-2">
                      {players.map((p, idx) => {
                        const isCurrent = idx === currentPlayerIndex;
                        return (
                          <div
                            key={p.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                              isCurrent
                                ? 'bg-blue-950/60 border-blue-400 ring-2 ring-blue-500/30'
                                : 'bg-[#0A0E17] border-[#30363D]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                                style={{ backgroundColor: p.avatarColor }}
                              >
                                {idx + 1}
                              </div>
                              <span className="text-sm font-bold text-white">
                                {p.name} {isCurrent && '🎯'}
                              </span>
                            </div>
                            <span className="font-mono font-black text-amber-400 text-sm">
                              {p.score}đ
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* When In Wheel Spin Mode */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Players Dashboard */}
                <div className="lg:col-span-4 bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-[#30363D]">
                    <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2.5">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
                      <span>BẢNG ĐIỂM LƯỢT CHƠI</span>
                    </h3>
                    <span className="text-xs sm:text-sm font-mono font-black text-blue-400 bg-blue-500/15 px-3 py-1 rounded-xl border border-blue-500/30">
                      Câu {currentQuestionIndex + 1}/{roundQuestions.length}
                    </span>
                  </div>

                  {/* Players List */}
                  <div className="space-y-3">
                    {players.map((p, idx) => {
                      const isCurrent = idx === currentPlayerIndex;
                      return (
                        <div
                          key={p.id}
                          className={`p-4 sm:p-5 rounded-3xl border-2 transition-all flex items-center justify-between shadow-lg ${
                            isCurrent
                              ? 'bg-blue-950/60 border-blue-400 ring-4 ring-blue-500/40 shadow-blue-500/20'
                              : 'bg-[#0A0E17] border-[#30363D] hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center font-mono font-black text-lg sm:text-xl text-white shadow-md shrink-0 border border-white/20"
                              style={{ backgroundColor: p.avatarColor }}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                                <span>{p.name}</span>
                                {isCurrent && (
                                  <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black tracking-wide animate-pulse">
                                    Đang Lượt
                                  </span>
                                )}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-300 font-semibold mt-0.5">
                                Đã đúng: <strong className="text-emerald-400 font-bold">{p.correctCount}</strong> câu
                              </div>
                            </div>
                          </div>

                          <div className="text-right pl-2">
                            <div className="text-xl sm:text-3xl md:text-4xl font-mono font-black text-amber-400 tracking-tight">
                              {p.score}đ
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Sector Info */}
                  {activeSector && (
                    <div className="bg-[#0A0E17] border-2 border-[#30363D] rounded-3xl p-4 sm:p-5 text-center space-y-2 shadow-inner">
                      <span className="text-xs sm:text-sm text-gray-300 font-extrabold uppercase tracking-wider block">
                        🎯 Ô TRÚNG THƯỞNG HIỆN TẠI:
                      </span>
                      <div
                        className="text-lg sm:text-2xl font-black py-2 px-6 rounded-2xl inline-block shadow-lg border-2 border-white/25"
                        style={{ backgroundColor: activeSector.color, color: activeSector.textColor }}
                      >
                        {activeSector.label}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: The Interactive Wheel */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Wheel Canvas Bento Container - Expanded Size for High Visibility */}
                  <div className="bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden space-y-4">
                  <div className="text-center space-y-1.5">
                    <span className="text-sm sm:text-base font-black text-amber-400 tracking-wider uppercase bg-amber-500/10 px-4 py-1 rounded-xl border border-amber-500/20 inline-block">
                      🎯 LƯỢT QUAY: {activePlayer?.name?.toUpperCase()}
                    </span>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                      Nhấn Nút "QUAY NÓN" Để Bắt Đầu!
                    </h3>
                  </div>

                  {/* Wheel Outer Container - Significantly Enlarged */}
                  <div className="relative w-80 h-80 sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] lg:w-[520px] lg:h-[520px] flex items-center justify-center my-2">
                    {/* Top Pointer Indicator - Sharp arrow pointing directly down into rim */}
                    <div className="absolute -top-5 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_6px_14px_rgba(0,0,0,0.9)]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border-3 border-white shadow-xl z-10 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                      </div>
                      <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-amber-400 -mt-1.5 filter drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
                    </div>

                    {/* Spinning SVG Wheel */}
                    <div
                      className="w-full h-full rounded-full border-6 border-amber-400 shadow-2xl shadow-amber-500/30 overflow-hidden"
                      style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        transition: isSpinning
                          ? 'transform 4.2s cubic-bezier(0.15, 0.9, 0.2, 1)'
                          : 'none',
                      }}
                    >
                      <svg viewBox="0 0 400 400" className="w-full h-full">
                        {DEFAULT_WHEEL_SECTORS.map((sector, i) => {
                          const startAngle = (i * sectorAngle * Math.PI) / 180;
                          const endAngle = (((i + 1) * sectorAngle) * Math.PI) / 180;
                          const x1 = 200 + 200 * Math.cos(startAngle);
                          const y1 = 200 + 200 * Math.sin(startAngle);
                          const x2 = 200 + 200 * Math.cos(endAngle);
                          const y2 = 200 + 200 * Math.sin(endAngle);

                          const textAngle = ((i + 0.5) * sectorAngle);
                          const rad = (textAngle * Math.PI) / 180;
                          const textX = 200 + 130 * Math.cos(rad);
                          const textY = 200 + 130 * Math.sin(rad);

                          return (
                            <g key={sector.id}>
                              <path
                                d={`M200,200 L${x1},${y1} A200,200 0 0,1 ${x2},${y2} Z`}
                                fill={sector.color}
                                stroke="#161B22"
                                strokeWidth="2.5"
                              />
                              <text
                                x={textX}
                                y={textY}
                                fill={sector.textColor}
                                fontSize="16"
                                fontWeight="900"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                                style={{
                                  paintOrder: 'stroke',
                                  stroke: sector.textColor === '#FFFFFF' ? '#000000' : 'none',
                                  strokeWidth: sector.textColor === '#FFFFFF' ? '1px' : '0px',
                                }}
                              >
                                {sector.label}
                              </text>
                            </g>
                          );
                        })}
                        {/* Center Hub */}
                        <circle cx="200" cy="200" r="42" fill="#0A0E17" stroke="#F59E0B" strokeWidth="5" />
                        <circle cx="200" cy="200" r="20" fill="#F59E0B" />
                        <circle cx="200" cy="200" r="8" fill="#FFFFFF" />
                      </svg>
                    </div>
                  </div>

                  {/* Spin Action Button */}
                  <button
                    type="button"
                    disabled={isSpinning || gameState !== 'ready'}
                    onClick={handleSpinWheel}
                    className={`mt-2 px-10 sm:px-14 py-4 sm:py-5 rounded-3xl font-black text-base sm:text-xl tracking-wider uppercase transition-all flex items-center gap-3 cursor-pointer shadow-2xl ${
                      isSpinning
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-slate-950 hover:scale-105 shadow-amber-500/30 ring-4 ring-amber-400/30 animate-pulse'
                    }`}
                  >
                    <Disc className={`w-6 h-6 sm:w-7 sm:h-7 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>{isSpinning ? 'Đang quay...' : 'QUAY NÓN KỲ DIỆU'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* ==================================================== */}
        {/* 3. FINISHED / PODIUM SCREEN                          */}
        {/* ==================================================== */}
        {gameState === 'finished' && (
          <div className="w-full max-w-5xl mx-auto bg-[#161B22] border border-[#30363D] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                TỔNG KẾT VÒNG QUAY TOÁN HỌC
              </span>
              <h2 className="text-3xl font-black text-white">BẢNG XẾP HẠNG CHUNG CUỘC</h2>
              <p className="text-xs text-gray-400">
                Chúc mừng tất cả người chơi đã xuất sắc hoàn thành các thử thách câu hỏi!
              </p>
            </div>

            {/* Podium Top 3 */}
            <div className="grid grid-cols-3 gap-3 items-end max-w-md mx-auto pt-4">
              {/* Silver #2 */}
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

              {/* Gold #1 */}
              {sortedPlayers[0] && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl animate-bounce">👑 🥇</span>
                  <div className="font-extrabold text-sm text-amber-300 truncate max-w-full">
                    {sortedPlayers[0].name}
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {sortedPlayers[0].score}đ
                  </div>
                  <div className="h-24 w-full rounded-t-xl bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-sm shadow-lg shadow-amber-500/20">
                    QUÁN QUÂN
                  </div>
                </div>
              )}

              {/* Bronze #3 */}
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
                    <th className="p-3">Người Chơi</th>
                    <th className="p-3 text-center">Câu Đúng</th>
                    <th className="p-3 text-center">Câu Sai</th>
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
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">
                        {p.correctCount}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-rose-400">
                        {p.wrongCount}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-400 text-sm">
                        {p.score} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={handleStartGame}
                className="py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại Vòng Khác</span>
              </button>

              <button
                type="button"
                onClick={() => setGameState('configuring')}
                className="py-3 px-4 rounded-xl bg-[#21262D] border border-[#30363D] text-gray-300 font-bold text-xs hover:bg-[#30363D] hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Cấu Hình Bài Khác</span>
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
