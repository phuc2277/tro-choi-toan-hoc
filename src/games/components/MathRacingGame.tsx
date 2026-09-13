import React, { useState, useEffect, useRef } from 'react';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { RacingPlayerState, RacingGameConfig } from '../types/GamePlatform';
import { MathRacingService } from '../services/MathRacingService';
import { QuestionSelectionService } from '../services/QuestionSelectionService';
import { QuizScoringService } from '../services/QuizScoringService';
import { CameraGestureOverlay } from './CameraGestureOverlay';
import { VoiceRecognitionOverlay } from './VoiceRecognitionOverlay';
import { GameInputSelector, InputModeType } from './GameInputSelector';
import { soundEffects } from '../services/SoundEffects';
import { useMediaPipeHands } from '../gesture-quiz/hooks/useMediaPipeHands';
import { MathRenderer } from './MathRenderer';
import { MathDiagramView } from './MathDiagramView';
import {
  Trophy,
  RotateCcw,
  LogOut,
  Sparkles,
  Zap,
  Clock,
  Gauge,
  Flag,
  Users,
  Layers,
  Award,
  ChevronRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  Play,
  Volume2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface MathRacingGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
}

export const MathRacingGame: React.FC<MathRacingGameProps> = ({
  lessons,
  onExitToMenu,
}) => {
  // 1. Configuration State
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons[0]?.id || ''
  );
  const currentLesson =
    lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  const [gameConfig, setGameConfig] = useState<RacingGameConfig>({
    purpose: 'warm-up',
    subject: currentLesson?.subject || 'Toán THCS',
    lessonTitle: currentLesson?.lessonTitle || '',
    questionPoolIds: currentLesson?.questionBank.map((q) => q.id) || [],
    questionsPerRound: 8,
    timeLimitPerQuestion: 15,
    competitionMode: 'individual',
    playerNames: ['Tay Đua Đỏ', 'Tay Đua Xanh'],
    trackLengthLaps: 1,
  });

  // Input Mode: Camera / Voice / Manual (Default to camera for AI gesture detection)
  const [inputMode, setInputMode] = useState<InputModeType>('camera');

  // Game Lifecycle State
  const [stage, setStage] = useState<
    'config' | 'countdown' | 'racing' | 'round-result' | 'podium'
  >('config');
  const [countdown, setCountdown] = useState<number>(3);

  // Active Race State
  const [raceQuestions, setRaceQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [racers, setRacers] = useState<RacingPlayerState[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [lastRoundFeedbacks, setLastRoundFeedbacks] = useState<
    {
      racerId: string;
      isCorrect: boolean;
      advance: number;
      isNitro: boolean;
      scoreGain: number;
    }[]
  >([]);
  const [raceTotalStartTime, setRaceTotalStartTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const questionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const racersRef = useRef<RacingPlayerState[]>([]);

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

  // Keep racersRef synchronized with state
  useEffect(() => {
    racersRef.current = racers;
  }, [racers]);

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
    zoneCount: gameConfig.playerNames.length || 2,
    isActive: inputMode === 'camera' && stage !== 'podium',
    onZoneAnswerLocked: (zoneIdx, option) => {
      const currentRacer = racersRef.current[zoneIdx];
      if (stage === 'racing' && currentRacer && currentRacer.selectedOption === null) {
        handleRacerSelect(currentRacer.id, option);
      }
    },
  });

  // Sync config when lesson changes
  useEffect(() => {
    if (currentLesson) {
      setGameConfig((prev) => ({
        ...prev,
        subject: currentLesson.subject,
        lessonTitle: currentLesson.lessonTitle,
        questionPoolIds: currentLesson.questionBank.map((q) => q.id),
      }));
    }
  }, [selectedLessonId, currentLesson]);

  // Handle countdown
  useEffect(() => {
    if (stage === 'countdown') {
      if (countdown > 0) {
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
      } else {
        setStage('racing');
        setTimeLeft(gameConfig.timeLimitPerQuestion);
        questionStartTimeRef.current = Date.now();
        setIsTimerRunning(true);
      }
    }
  }, [stage, countdown, gameConfig.timeLimitPerQuestion]);

  // Main Question Countdown Timer
  useEffect(() => {
    if (stage === 'racing' && isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [stage, isTimerRunning]);

  // Start Race Handler
  const handleStartRace = () => {
    const pool = QuestionSelectionService.filterPoolQuestions(
      currentLesson.questionBank,
      gameConfig.questionPoolIds
    );
    const validation = QuestionSelectionService.validatePool(
      pool.length,
      gameConfig.questionsPerRound
    );

    if (!validation.isValid) {
      alert(validation.errorMessage);
      return;
    }

    const { selectedQuestions } = QuestionSelectionService.selectRoundQuestions(
      pool,
      gameConfig.questionsPerRound
    );

    setRaceQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    const initialRacers = MathRacingService.initRacingPlayers(
      gameConfig.playerNames
    );
    setRacers(initialRacers);
    setCountdown(3);
    setRaceTotalStartTime(Date.now());
    resetZoneStates();
    setStage('countdown');
  };

  // Driver chooses option
  const handleRacerSelect = (racerId: string, option: QuizOptionKeyEnum) => {
    if (stage !== 'racing') return;

    const now = Date.now();
    const elapsedMs = now - questionStartTimeRef.current;

    const updated = racersRef.current.map((r) => {
      if (r.id === racerId && r.selectedOption === null) {
        return {
          ...r,
          selectedOption: option,
          responseTimeMs: elapsedMs,
        };
      }
      return r;
    });

    racersRef.current = updated;
    setRacers(updated);

    // If all racers have answered, immediately evaluate round
    const allAnswered = updated.every((r) => r.selectedOption !== null);
    if (allAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);
      evaluateRoundAnswers(updated);
    }
  };

  // Time-up or all racers submitted
  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    evaluateRoundAnswers(racersRef.current);
  };

  // Evaluate Round
  const evaluateRoundAnswers = (currentRacersList?: RacingPlayerState[]) => {
    const activeRacers = currentRacersList || racersRef.current;
    const currentQ = raceQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const roundFeedbacks: {
      racerId: string;
      isCorrect: boolean;
      advance: number;
      isNitro: boolean;
      scoreGain: number;
    }[] = [];

    const updated = activeRacers.map((racer) => {
      const isCorrect = QuizScoringService.evaluateIndividualAnswer(
        racer.selectedOption,
        currentQ.correctAnswer,
        currentQ.options
      );
      const responseTimeSec = racer.responseTimeMs
        ? racer.responseTimeMs / 1000
        : gameConfig.timeLimitPerQuestion;

      const calc = MathRacingService.calculateAdvance(
        isCorrect,
        responseTimeSec,
        gameConfig.timeLimitPerQuestion,
        raceQuestions.length
      );

      roundFeedbacks.push({
        racerId: racer.id,
        isCorrect,
        advance: calc.advancePercent,
        isNitro: calc.isNitro,
        scoreGain: calc.scoreGain,
      });

      const newPos = Math.min(100, racer.trackPositionPercent + calc.advancePercent);
      const isFinished = newPos >= 100;
      const nowTotalSec = (Date.now() - raceTotalStartTime) / 1000;

      return {
        ...racer,
        trackPositionPercent: newPos,
        score: racer.score + calc.scoreGain,
        speed: calc.speedKmH,
        nitroBoost: calc.isNitro ? racer.nitroBoost + 1 : racer.nitroBoost,
        correctCount: isCorrect ? racer.correctCount + 1 : racer.correctCount,
        wrongCount: !isCorrect ? racer.wrongCount + 1 : racer.wrongCount,
        status: (isFinished
          ? 'finished'
          : calc.isNitro
          ? 'turbo'
          : isCorrect
          ? 'accelerating'
          : 'stalled') as RacingPlayerState['status'],
        finishTimeSec:
          isFinished && !racer.finishTimeSec ? Number(nowTotalSec.toFixed(1)) : racer.finishTimeSec,
      };
    });

    racersRef.current = updated;
    setRacers(updated);
    setLastRoundFeedbacks(roundFeedbacks);

    const anyCorrect = roundFeedbacks.some((f) => f.isCorrect);
    if (anyCorrect) {
      soundEffects.playCorrect();
    } else {
      soundEffects.playWrong();
    }

    setStage('round-result');
  };

  // Keyboard navigation for P1 and quick transitions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (stage === 'round-result' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleNextQuestion();
      } else if (stage === 'racing') {
        const key = e.key.toUpperCase();
        // Racer 1: 1, 2, 3, 4 or A, B, C, D
        if (racers.length > 0 && racers[0].selectedOption === null) {
          if (key === '1' || key === 'A') handleRacerSelect(racers[0].id, QuizOptionKeyEnum.A);
          else if (key === '2' || key === 'B') handleRacerSelect(racers[0].id, QuizOptionKeyEnum.B);
          else if (key === '3' || key === 'C') handleRacerSelect(racers[0].id, QuizOptionKeyEnum.C);
          else if (key === '4' || key === 'D') handleRacerSelect(racers[0].id, QuizOptionKeyEnum.D);
        }
        // Racer 2: 5, 6, 7, 8 or J, K, L, ;
        if (racers.length > 1 && racers[1].selectedOption === null) {
          if (key === '5' || key === 'J') handleRacerSelect(racers[1].id, QuizOptionKeyEnum.A);
          else if (key === '6' || key === 'K') handleRacerSelect(racers[1].id, QuizOptionKeyEnum.B);
          else if (key === '7' || key === 'L') handleRacerSelect(racers[1].id, QuizOptionKeyEnum.C);
          else if (key === '8' || key === ';') handleRacerSelect(racers[1].id, QuizOptionKeyEnum.D);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, racers, currentQuestionIndex, raceQuestions.length]);

  // Continue to next question or Finish line podium
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= raceQuestions.length) {
      // Finish Race
      soundEffects.playVictory();
      const ranked = MathRacingService.rankRacers(racers);
      setRacers(ranked);
      setStage('podium');
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      // Reset choices for next lap
      setRacers((prev) =>
        prev.map((r) => ({
          ...r,
          selectedOption: null,
          responseTimeMs: 0,
          status: 'idle',
        }))
      );
      setTimeLeft(gameConfig.timeLimitPerQuestion);
      questionStartTimeRef.current = Date.now();
      setIsTimerRunning(true);
      setStage('racing');
      resetZoneStates();
    }
  };

  const currentQ = raceQuestions[currentQuestionIndex];
  const rankedRacers = MathRacingService.rankRacers(racers);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#070B14] text-white flex flex-col font-sans selection:bg-rose-500 selection:text-white"
    >
      {/* Race Top Bar */}
      <header className="border-b border-[#21262D] bg-[#0E131F]/90 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <span className="text-xl">🏎️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Đua Xe Toán Học THCS
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {gameConfig.purpose === 'warm-up' ? 'Khởi Động' : 'Luyện Tập'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {gameConfig.subject} • {gameConfig.lessonTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stage !== 'config' && (
              <button
                onClick={() => setStage('config')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161B22] border border-[#30363D] hover:bg-[#21262D] text-xs font-semibold text-gray-300 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cấu Hình Lại</span>
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-[#161B22] border border-[#30363D] text-gray-300 hover:text-white hover:bg-[#21262D] transition cursor-pointer"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {onExitToMenu && (
              <button
                onClick={onExitToMenu}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold text-rose-300 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Rời Trò Chơi</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-stretch justify-start">
        {/* ================= CONFIGURATION STAGE ================= */}
        {stage === 'config' && (
          <div className="max-w-4xl mx-auto w-full bg-[#111622] border border-[#21262D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-[#21262D] pb-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-2xl">🏎️</span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Thiết Lập Cuộc Đua Toán Học
                </h2>
                <p className="text-xs text-gray-400">
                  Cấu hình đường đua, tay đua và bộ câu hỏi bài học
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Lesson Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bài Học Mục Tiêu</span>
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.subject} (Lớp {lesson.grade}) - {lesson.lessonTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mục Đích Hoạt Động</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGameConfig((prev) => ({ ...prev, purpose: 'warm-up' }))
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      gameConfig.purpose === 'warm-up'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-[#0A0E17] border-[#30363D] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    🔥 Khởi Động
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGameConfig((prev) => ({ ...prev, purpose: 'practice' }))
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      gameConfig.purpose === 'practice'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'bg-[#0A0E17] border-[#30363D] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    📘 Luyện Tập
                  </button>
                </div>
              </div>

              {/* Questions per Race */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Số Chặng Đua (Câu Hỏi)</span>
                </label>
                <select
                  value={gameConfig.questionsPerRound}
                  onChange={(e) =>
                    setGameConfig((prev) => ({
                      ...prev,
                      questionsPerRound: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value={5}>5 chặng đua ngắn</option>
                  <option value={8}>8 chặng đua chuẩn</option>
                  <option value={10}>10 chặng đua lớn</option>
                  <option value={15}>15 chặng Grand Prix</option>
                </select>
              </div>

              {/* Time Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Thời Gian Mỗi Chặng</span>
                </label>
                <select
                  value={gameConfig.timeLimitPerQuestion}
                  onChange={(e) =>
                    setGameConfig((prev) => ({
                      ...prev,
                      timeLimitPerQuestion: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value={10}>10 giây (Tốc độ cao)</option>
                  <option value={15}>15 giây (Tiêu chuẩn)</option>
                  <option value={20}>20 giây (Bình tĩnh)</option>
                  <option value={30}>30 giây (Thong thả)</option>
                </select>
              </div>
            </div>

            {/* Racers Roster Setup */}
            <div className="space-y-3 pt-3 border-t border-[#21262D]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span>Danh Sách Tay Đua ({gameConfig.playerNames.length} xe)</span>
                </label>
                <div className="flex gap-1.5">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        const newNames = Array.from(
                          { length: num },
                          (_, i) => `Tay Đua ${i + 1}`
                        );
                        setGameConfig((prev) => ({
                          ...prev,
                          playerNames: newNames,
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        gameConfig.playerNames.length === num
                          ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                          : 'bg-[#0A0E17] border-[#30363D] text-gray-400'
                      }`}
                    >
                      {num} Xe
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {gameConfig.playerNames.map((name, index) => {
                  const style =
                    MathRacingService.DEFAULT_CAR_COLORS[
                      index % MathRacingService.DEFAULT_CAR_COLORS.length
                    ];
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-[#0A0E17] p-2.5 rounded-xl border border-[#30363D]"
                    >
                      <span className="text-lg">{style.icon}</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const updated = [...gameConfig.playerNames];
                          updated[index] = e.target.value;
                          setGameConfig((prev) => ({
                            ...prev,
                            playerNames: updated,
                          }));
                        }}
                        className="bg-transparent text-xs text-white font-bold focus:outline-none flex-1"
                        placeholder={`Tên tay đua ${index + 1}`}
                      />
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: style.color }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input Mode Selector in Setup */}
            <div className="space-y-3 pt-3 border-t border-[#21262D]">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-rose-400" />
                <span>Phương Thức Trả Lời (Thiết Lập Trước Khi Xuất Phát)</span>
              </label>
              <GameInputSelector
                currentMode={inputMode}
                onModeChange={setInputMode}
                allowedModes={gameConfig.playerNames.length === 1 ? ['camera', 'voice', 'manual'] : ['camera', 'manual']}
                playerCount={gameConfig.playerNames.length}
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
                    zoneCount={gameConfig.playerNames.length}
                    zoneDetections={zoneDetections}
                    onManualTrigger={(_zIdx, _opt) => {}}
                    onRetryCamera={retryCamera}
                    availableCameras={availableCameras}
                    activeDeviceId={activeDeviceId}
                    onSelectCamera={setActiveDeviceId}
                    playerLabels={gameConfig.playerNames}
                  />
                </div>
              )}
            </div>

            {/* Start Race Button */}
            <button
              onClick={handleStartRace}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-rose-600/30 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <span>Khởi Động Động Cơ & Vào Đua</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= COUNTDOWN STAGE ================= */}
        {stage === 'countdown' && (
          <div className="text-center space-y-4 my-auto">
            <div className="text-8xl font-black text-rose-500 animate-ping">
              {countdown > 0 ? countdown : 'XUẤT PHÁT!'}
            </div>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">
              Đèn xanh bật sáng — Chuẩn bị tăng tốc!
            </p>
          </div>
        )}

        {/* ================= RACING & ROUND-RESULT STAGE ================= */}
        {(stage === 'racing' || stage === 'round-result') && currentQ && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* ==================================================== */}
            {/* CỘT TRÁI (LEFT): HỘP CHẶNG ĐUA, CÂU HỎI & KẾT QUẢ/GIẢI THÍCH */}
            {/* ==================================================== */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-3.5">
              {/* 1. HỘP CHẶNG ĐUA THU NHỎ (CHUYỂN SANG TRÁI) */}
              <div className="bg-[#111622] border border-[#21262D] rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xl space-y-2.5">
                {/* Header Chặng Đua & Đồng Hồ */}
                <div className="flex items-center justify-between text-xs text-gray-300 px-1">
                  <div className="flex items-center gap-1.5 font-black text-white">
                    <Flag className="w-4 h-4 text-rose-400" />
                    <span className="text-xs sm:text-sm">
                      Chặng {currentQuestionIndex + 1}/{raceQuestions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1 font-mono font-black text-xs px-2.5 py-0.5 rounded-lg border transition-all ${
                        timeLeft <= 5
                          ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
                          : 'bg-[#0A0E17] border-[#30363D] text-emerald-400'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}s</span>
                    </div>

                    <div className="w-16 sm:w-20 bg-[#0A0E17] h-2 rounded-full overflow-hidden border border-[#30363D]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          timeLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${(timeLeft / gameConfig.timeLimitPerQuestion) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Highway Track Container (Gọn gàng) */}
                <div className="bg-[#0A0E17] border border-[#30363D] rounded-xl p-2 relative overflow-hidden space-y-1.5">
                  {/* Track Checkpoints indicators */}
                  <div className="flex justify-between text-[9px] font-mono text-gray-500 px-2 border-b border-[#21262D] pb-0.5">
                    <span>🚦 START</span>
                    <span>🚩 25%</span>
                    <span>🚩 50%</span>
                    <span>🚩 75%</span>
                    <span className="text-amber-400 font-bold">🏁 FINISH</span>
                  </div>

                  {/* Lanes for each racer */}
                  {racers.map((racer) => {
                    const posPercent = Math.min(88, racer.trackPositionPercent);
                    return (
                      <div
                        key={racer.id}
                        className="relative h-8 sm:h-9 bg-[#141926] rounded-lg border border-[#21262D] flex items-center px-2 overflow-hidden"
                      >
                        {/* Lane background dashed line */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-[#30363D]" />

                        {/* Moving Car */}
                        <div
                          className="absolute flex items-center gap-1 transition-all duration-700 ease-out z-10"
                          style={{ left: `${posPercent}%` }}
                        >
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg shadow-md border text-[10px] sm:text-[11px] font-bold ${
                              racer.status === 'turbo'
                                ? 'bg-amber-500 text-black border-yellow-200 animate-bounce'
                                : racer.status === 'stalled'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700/50 opacity-80'
                                : 'bg-[#1C2333] text-white border-[#3B82F6]'
                            }`}
                            style={{ borderColor: racer.color }}
                          >
                            <span className="text-sm">{racer.carIcon}</span>
                            <span className="truncate max-w-[65px] sm:max-w-[80px]">
                              {racer.name}
                            </span>
                            {racer.status === 'turbo' && (
                              <span className="text-[8px] bg-red-600 text-white font-black px-1 rounded">
                                🔥
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score & Progress Badge on Right */}
                        <div className="absolute right-2 z-20 flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="text-gray-400 font-bold">
                            {Math.round(racer.trackPositionPercent)}%
                          </span>
                          <span className="text-amber-400 font-black">
                            {racer.score}đ
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. HỘP CÂU HỎI TOÁN HỌC (Hiển thị đầy đủ, rõ ràng trên màn hình) */}
              <div className="bg-[#111622] border border-[#21262D] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5">
                {/* Header Câu Hỏi */}
                <div className="flex items-center justify-between border-b border-[#21262D] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-mono font-bold border border-rose-500/30">
                      CÂU HỎI {currentQuestionIndex + 1} / {raceQuestions.length}
                    </span>
                    <span className="text-[11px] text-gray-400 hidden sm:inline">
                      Chọn đáp án chính xác & nhanh nhất để bứt tốc nitro!
                    </span>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Toán THCS
                  </span>
                </div>

                {/* Nội dung đề bài toán (Font lớn, MathRenderer hỗ trợ công thức, căn bậc, phân số) */}
                <div className="bg-[#0A0E17] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#30363D] shadow-inner">
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    Đề bài chặng đua:
                  </span>
                  <div className="text-lg sm:text-xl md:text-2xl font-black text-white leading-relaxed tracking-tight">
                    <MathRenderer text={currentQ?.content || (currentQ as any)?.question || ''} isLarge />
                  </div>
                </div>

                {/* Sơ đồ hình học hoặc bảng số liệu nếu có */}
                {(currentQ?.diagram || currentQ?.tableData) && (
                  <div className="p-2.5 bg-[#0A0E17] rounded-xl border border-[#30363D] flex justify-center overflow-x-auto">
                    <MathDiagramView
                      diagram={currentQ.diagram}
                      tableData={currentQ.tableData}
                      className="w-full"
                    />
                  </div>
                )}

                {/* 4 Phương án A, B, C, D (Dạng lưới 2x2 rõ ràng, dễ đọc) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                  {currentQ.options.map((opt) => {
                    const isRevealed = stage === 'round-result';
                    const isCorrectAnswer = opt.key === currentQ.correctAnswer;

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                          isRevealed && isCorrectAnswer
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 font-bold ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-900/30'
                            : 'bg-[#0A0E17] border-[#30363D] text-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-mono font-black flex items-center justify-center text-sm sm:text-base shrink-0 ${
                              isRevealed && isCorrectAnswer
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-400/20'
                                : 'bg-[#21262D] border border-[#30363D] text-rose-400'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="text-sm sm:text-base font-bold leading-relaxed">
                            <MathRenderer text={opt.text} />
                          </span>
                        </div>
                        {isRevealed && isCorrectAnswer && (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. HỘP KẾT QUẢ VÒNG ĐUA & GIẢI THÍCH (CHUYỂN SANG TRÁI) */}
              {stage === 'round-result' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0E17] border border-emerald-500/50 shadow-xl shadow-emerald-950/20 space-y-3 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-sm sm:text-base text-gray-200 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">Đáp án đúng:</span>
                        <strong className="text-emerald-400 font-mono text-base sm:text-lg bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg">
                          [ {currentQ.correctAnswer} ] -{' '}
                          <MathRenderer
                            text={currentQ.options.find((o) => o.key === currentQ.correctAnswer)?.text || ''}
                          />
                        </strong>
                      </div>
                      {currentQ.explanation && (
                        <div className="text-xs sm:text-sm text-gray-300 bg-[#161B22] p-2.5 rounded-xl border border-[#30363D] mt-2">
                          <strong className="text-amber-400">💡 Giải thích:</strong>{' '}
                          <MathRenderer text={currentQ.explanation} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-500/30 hover:scale-105 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer animate-pulse"
                    >
                      <span>
                        {currentQuestionIndex + 1 >= raceQuestions.length
                          ? 'Xem Kết Quả Về Đích 🏁'
                          : 'Sang Chặng Tiếp Theo 🏎️'}
                      </span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ==================================================== */}
            {/* CỘT PHẢI (RIGHT): CAMERA AI & BẢNG BẤM CHỌN CỦA TAY ĐUA */}
            {/* ==================================================== */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-3.5">
              {/* 1. CAMERA AI & PHƯƠNG THỨC TRẢ LỜI */}
              <div className="bg-[#111622] border border-[#21262D] rounded-2xl p-3 shadow-xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-rose-400" />
                    <span>Phương Thức TrẢ Lời:</span>
                  </div>
                  <div className="w-full sm:w-auto">
                    <GameInputSelector
                      currentMode={inputMode}
                      onModeChange={setInputMode}
                      allowedModes={racers.length === 1 ? ['camera', 'voice', 'manual'] : ['camera', 'manual']}
                      playerCount={racers.length}
                      onTurnOffCamera={() => setInputMode('manual')}
                    />
                  </div>
                </div>

                {/* Khung Camera AI Nhận Diện (Thu gọn compact vừa vặn) */}
                {inputMode === 'camera' && (
                  <div className="animate-fadeIn">
                    <CameraGestureOverlay
                      videoRef={videoRef}
                      canvasRef={canvasRef}
                      mediaStream={mediaStream}
                      isCameraActive={isCameraActive}
                      isLoadingModel={isLoadingModel}
                      cameraError={cameraError}
                      zoneCount={racers.length}
                      zoneDetections={zoneDetections}
                      onManualTrigger={(zIdx, opt) => {
                        if (racers[zIdx]) handleRacerSelect(racers[zIdx].id, opt);
                      }}
                      onRetryCamera={retryCamera}
                      onTurnOffCamera={() => setInputMode('manual')}
                      availableCameras={availableCameras}
                      activeDeviceId={activeDeviceId}
                      onSelectCamera={setActiveDeviceId}
                      playerLabels={racers.map((r) => r.name)}
                      compact={true}
                    />
                  </div>
                )}

                {/* Voice Recognition khi ở chế độ giọng nói */}
                {inputMode === 'voice' && racers.length === 1 && (
                  <div className="animate-fadeIn">
                    <VoiceRecognitionOverlay
                      isActive={stage === 'racing'}
                      isLocked={racers[0]?.selectedOption !== null}
                      lockedOption={racers[0]?.selectedOption || null}
                      onOptionRecognized={(opt) => {
                        if (stage === 'racing' && racers[0]?.selectedOption === null) {
                          handleRacerSelect(racers[0].id, opt);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 2. BẢNG BẤM CHỌN CỦA CÁC TAY ĐUA */}
              <div className="bg-[#111622] border border-[#21262D] rounded-2xl p-3 sm:p-3.5 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#21262D]">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Bảng Bấm Chọn Của Các Tay Đua</span>
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-gray-400">
                    {racers.filter((r) => r.selectedOption !== null).length}/{racers.length} đã chốt
                  </span>
                </div>

                <div className="space-y-2">
                  {racers.map((racer) => {
                    const hasSelected = racer.selectedOption !== null;
                    return (
                      <div
                        key={racer.id}
                        className="bg-[#0A0E17] border rounded-xl p-2 space-y-1.5 shadow-md"
                        style={{ borderColor: `${racer.color}50` }}
                      >
                        <div className="flex items-center justify-between border-b border-[#21262D] pb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{racer.carIcon}</span>
                            <span
                              className="text-xs font-bold truncate max-w-[110px]"
                              style={{ color: racer.color }}
                            >
                              {racer.name}
                            </span>
                          </div>
                          {hasSelected ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Đã chọn [{racer.selectedOption}]
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                              ⏳ Đang suy nghĩ...
                            </span>
                          )}
                        </div>

                        {/* 4 Options A, B, C, D */}
                        <div className="grid grid-cols-4 gap-1">
                          {[QuizOptionKeyEnum.A, QuizOptionKeyEnum.B, QuizOptionKeyEnum.C, QuizOptionKeyEnum.D].map((optKey) => {
                            const isSelected = racer.selectedOption === optKey;
                            const isCorrectAnswer = optKey === currentQ.correctAnswer;
                            const showResult = stage === 'round-result';

                            let buttonStyle =
                              'bg-[#161B22] border-[#30363D] text-gray-300 hover:border-gray-500 hover:bg-[#21262D] hover:text-white';

                            if (showResult) {
                              if (isCorrectAnswer) {
                                buttonStyle =
                                  'bg-emerald-600 border-emerald-400 text-white font-black shadow-md shadow-emerald-500/20';
                              } else if (isSelected && !isCorrectAnswer) {
                                buttonStyle =
                                  'bg-rose-950/80 border-rose-500 text-rose-300 line-through opacity-80';
                              }
                            } else if (isSelected) {
                              buttonStyle =
                                'bg-blue-600 border-blue-400 text-white font-bold shadow-md shadow-blue-500/20';
                            }

                            return (
                              <button
                                key={optKey}
                                type="button"
                                disabled={stage !== 'racing' || hasSelected}
                                onClick={() => handleRacerSelect(racer.id, optKey)}
                                className={`py-1 rounded-lg border text-center font-mono font-black text-xs sm:text-sm transition cursor-pointer hover:scale-[1.03] active:scale-[0.97] ${buttonStyle} disabled:cursor-default disabled:opacity-50`}
                              >
                                {optKey}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Keyboard shortcut guide */}
                <div className="pt-1 border-t border-[#21262D] text-[10px] text-gray-400 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span>💡 Phím tắt Tay Đua 1:</span>
                    <span className="font-mono text-gray-300">[1, 2, 3, 4] / [A, B, C, D]</span>
                  </div>
                  {racers.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span>💡 Phím tắt Tay Đua 2:</span>
                      <span className="font-mono text-gray-300">[5, 6, 7, 8] / [J, K, L, ;]</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PODIUM / FINAL RESULT STAGE ================= */}
        {stage === 'podium' && (
          <div className="max-w-5xl mx-auto w-full bg-[#111622] border border-[#21262D] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Hoàn Thành Cuộc Đua Toán Học</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Bục Vinh Quang Grand Prix
              </h2>
            </div>

            {/* Podium Visual */}
            <div className="flex items-end justify-center gap-3 pt-6 pb-2">
              {/* Rank 2 */}
              {rankedRacers[1] && (
                <div className="flex-1 text-center space-y-2 max-w-[150px]">
                  <span className="text-2xl">{rankedRacers[1].carIcon}</span>
                  <div className="text-xs font-bold text-white truncate">
                    {rankedRacers[1].name}
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-400">
                    {rankedRacers[1].score}đ
                  </div>
                  <div className="h-20 rounded-t-2xl bg-[#21262D] border-t border-x border-[#30363D] flex items-center justify-center font-bold text-gray-400 text-sm">
                    🥈 Hạng 2
                  </div>
                </div>
              )}

              {/* Rank 1 Champion */}
              {rankedRacers[0] && (
                <div className="flex-1 text-center space-y-2 max-w-[170px]">
                  <div className="text-3xl animate-bounce">👑</div>
                  <span className="text-3xl">{rankedRacers[0].carIcon}</span>
                  <div className="text-sm font-black text-amber-400 truncate">
                    {rankedRacers[0].name}
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 py-0.5 rounded-full border border-amber-500/30">
                    {rankedRacers[0].score}đ ({Math.round(rankedRacers[0].trackPositionPercent)}%)
                  </div>
                  <div className="h-28 rounded-t-2xl bg-gradient-to-b from-amber-500 to-amber-600 text-amber-950 flex items-center justify-center font-black text-base shadow-lg shadow-amber-500/20">
                    🥇 Vô Địch
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {rankedRacers[2] && (
                <div className="flex-1 text-center space-y-2 max-w-[150px]">
                  <span className="text-2xl">{rankedRacers[2].carIcon}</span>
                  <div className="text-xs font-bold text-white truncate">
                    {rankedRacers[2].name}
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-400">
                    {rankedRacers[2].score}đ
                  </div>
                  <div className="h-14 rounded-t-2xl bg-[#21262D] border-t border-x border-[#30363D] flex items-center justify-center font-bold text-amber-600/80 text-xs">
                    🥉 Hạng 3
                  </div>
                </div>
              )}
            </div>

            {/* Summary Table */}
            <div className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#0A0E17]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161B22] text-gray-400 font-semibold border-b border-[#30363D]">
                  <tr>
                    <th className="p-3 text-center w-14">Hạng</th>
                    <th className="p-3">Tay Đua</th>
                    <th className="p-3 text-center">Đúng/Tổng</th>
                    <th className="p-3 text-center">Tiến Độ</th>
                    <th className="p-3 text-right">Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262D]">
                  {rankedRacers.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-[#161B22]/50 transition">
                      <td className="p-3 text-center font-mono font-bold text-gray-300">
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                      </td>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span>{r.carIcon}</span>
                        <span>{r.name}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-gray-200">
                        {r.correctCount} / {raceQuestions.length}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-rose-400">
                        {Math.round(r.trackPositionPercent)}%
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-400">
                        {r.score} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleStartRace}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đua Lại (Trộn Câu Mới)</span>
              </button>
              <button
                onClick={() => setStage('config')}
                className="px-5 py-3 rounded-xl bg-[#161B22] border border-[#30363D] hover:bg-[#21262D] text-xs font-semibold text-gray-300 transition"
              >
                Cấu Hình Mới
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
