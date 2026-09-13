import React, { useState, useEffect, useRef } from 'react';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import {
  ObstacleItem,
  ObstacleCourseConfig,
  ExplorerState,
} from '../types/GamePlatform';
import { ObstacleCourseService } from '../services/ObstacleCourseService';
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
  Mountain,
  Trophy,
  RotateCcw,
  LogOut,
  Sparkles,
  Heart,
  Clock,
  Layers,
  Award,
  ChevronRight,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Shield,
  Compass,
  Footprints,
  Flame,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ObstacleCourseGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
}

export const ObstacleCourseGame: React.FC<ObstacleCourseGameProps> = ({
  lessons,
  onExitToMenu,
}) => {
  // 1. Configuration State
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons[0]?.id || ''
  );
  const currentLesson =
    lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  const [gameConfig, setGameConfig] = useState<ObstacleCourseConfig>({
    purpose: 'warm-up',
    subject: currentLesson?.subject || 'Toán THCS',
    lessonTitle: currentLesson?.lessonTitle || '',
    questionPoolIds: currentLesson?.questionBank.map((q) => q.id) || [],
    questionsPerRound: 6,
    timeLimitPerQuestion: 15,
    explorerName: 'Nhà Thám Hiểm Toán Học',
    difficulty: 'standard',
  });

  // Input Mode: Camera / Voice / Manual (Default to camera for AI gesture detection)
  const [inputMode, setInputMode] = useState<InputModeType>('camera');

  // Game Lifecycle State
  const [stage, setStage] = useState<
    'config' | 'trekking' | 'facing_obstacle' | 'obstacle_result' | 'summit'
  >('config');

  // Active Game State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [obstacles, setObstacles] = useState<ObstacleItem[]>([]);
  const [explorer, setExplorer] = useState<ExplorerState>(
    ObstacleCourseService.initExplorer(6)
  );
  const [currentObstacleIndex, setCurrentObstacleIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<QuizOptionKeyEnum | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [newItemDiscovered, setNewItemDiscovered] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

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

  // MediaPipe hook for Gesture recognition
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
    isActive: inputMode === 'camera' && (stage as string) !== 'victory' && (stage as string) !== 'game_over',
    onZoneAnswerLocked: (_zIdx, option) => {
      if (stage === 'facing_obstacle' && selectedOption === null) {
        handleSelectOption(option);
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

  // Main Question Countdown Timer
  useEffect(() => {
    if (stage === 'facing_obstacle' && isTimerRunning) {
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

  // Start Expedition Handler
  const handleStartExpedition = () => {
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

    const generatedObstacles = ObstacleCourseService.generateObstacles(
      gameConfig.questionsPerRound
    );
    const initialExplorer = ObstacleCourseService.initExplorer(
      gameConfig.questionsPerRound
    );

    setQuestions(selectedQuestions);
    setObstacles(generatedObstacles);
    setExplorer(initialExplorer);
    setCurrentObstacleIndex(0);
    setSelectedOption(null);
    setNewItemDiscovered(null);
    setTimeLeft(gameConfig.timeLimitPerQuestion);
    questionStartTimeRef.current = Date.now();
    setIsTimerRunning(true);
    setStage('facing_obstacle');
  };

  // Select Option on Obstacle
  const handleSelectOption = (option: QuizOptionKeyEnum) => {
    if (stage !== 'facing_obstacle' || selectedOption !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(option);
    setIsTimerRunning(false);

    const currentQ = questions[currentObstacleIndex];
    const isCorrect = QuizScoringService.evaluateIndividualAnswer(
      option,
      currentQ.correctAnswer,
      currentQ.options
    );

    if (isCorrect) {
      soundEffects.playCorrect();
    } else {
      soundEffects.playWrong();
    }
    const responseTimeSec = Math.max(
      1,
      (Date.now() - questionStartTimeRef.current) / 1000
    );

    const { updatedExplorer, itemFound } =
      ObstacleCourseService.processObstacleAttempt(
        explorer,
        isCorrect,
        responseTimeSec
      );

    // Update obstacle status
    setObstacles((prev) =>
      prev.map((obs, idx) =>
        idx === currentObstacleIndex
          ? { ...obs, isCleared: true, clearedByCorrect: isCorrect }
          : obs
      )
    );

    setExplorer(updatedExplorer);
    setNewItemDiscovered(itemFound || null);
    setStage('obstacle_result');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (stage === 'obstacle_result' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleNextObstacle();
      } else if (stage === 'facing_obstacle' && selectedOption === null) {
        const key = e.key.toUpperCase();
        if (key === '1' || key === 'A') handleSelectOption(QuizOptionKeyEnum.A);
        else if (key === '2' || key === 'B') handleSelectOption(QuizOptionKeyEnum.B);
        else if (key === '3' || key === 'C') handleSelectOption(QuizOptionKeyEnum.C);
        else if (key === '4' || key === 'D') handleSelectOption(QuizOptionKeyEnum.D);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, selectedOption, currentObstacleIndex, questions.length]);

  // Time-up on Obstacle
  const handleTimeUp = () => {
    setIsTimerRunning(false);
    const responseTimeSec = gameConfig.timeLimitPerQuestion;
    const { updatedExplorer } = ObstacleCourseService.processObstacleAttempt(
      explorer,
      false,
      responseTimeSec
    );

    setObstacles((prev) =>
      prev.map((obs, idx) =>
        idx === currentObstacleIndex
          ? { ...obs, isCleared: true, clearedByCorrect: false }
          : obs
      )
    );

    setExplorer(updatedExplorer);
    setNewItemDiscovered(null);
    setStage('obstacle_result');
  };

  // Continue to next obstacle or Summit
  const handleNextObstacle = () => {
    if (currentObstacleIndex + 1 >= questions.length) {
      soundEffects.playVictory();
      setStage('summit');
    } else {
      setCurrentObstacleIndex((prev) => prev + 1);
      setSelectedOption(null);
      setNewItemDiscovered(null);
      setTimeLeft(gameConfig.timeLimitPerQuestion);
      questionStartTimeRef.current = Date.now();
      setIsTimerRunning(true);
      setStage('facing_obstacle');
      resetZoneStates();
    }
  };

  const currentQ = questions[currentObstacleIndex];
  const currentObs = obstacles[currentObstacleIndex];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#070B14] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-white"
    >
      {/* Platform Header */}
      <header className="border-b border-[#21262D] bg-[#0E131F]/90 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Vượt Chướng Ngại Vật Toán Học
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Chinh Phục Đỉnh Núi
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold text-emerald-300 transition"
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
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Mountain className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Thiết Lập Chuyến Thám Hiểm Toán Học
                </h2>
                <p className="text-xs text-gray-400">
                  Cấu hình các chướng ngại vật trên đường leo núi chinh phục đỉnh cao
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
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  <span>Mục Đích Thử Thách</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGameConfig((prev) => ({ ...prev, purpose: 'warm-up' }))
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      gameConfig.purpose === 'warm-up'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#0A0E17] border-[#30363D] text-gray-400'
                    }`}
                  >
                    🧗 Khởi Động Vui
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGameConfig((prev) => ({ ...prev, purpose: 'practice' }))
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      gameConfig.purpose === 'practice'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'bg-[#0A0E17] border-[#30363D] text-gray-400'
                    }`}
                  >
                    🏔️ Luyện Tập Leo Núi
                  </button>
                </div>
              </div>

              {/* Obstacles Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Số Chướng Ngại Vật</span>
                </label>
                <select
                  value={gameConfig.questionsPerRound}
                  onChange={(e) =>
                    setGameConfig((prev) => ({
                      ...prev,
                      questionsPerRound: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={4}>4 chướng ngại (Hành trình ngắn)</option>
                  <option value={6}>6 chướng ngại (Tiêu chuẩn)</option>
                  <option value={8}>8 chướng ngại (Thử thách cao)</option>
                  <option value={10}>10 chướng ngại (Đại thám hiểm)</option>
                </select>
              </div>

              {/* Time Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Thời Gian Mỗi Chướng Ngại</span>
                </label>
                <select
                  value={gameConfig.timeLimitPerQuestion}
                  onChange={(e) =>
                    setGameConfig((prev) => ({
                      ...prev,
                      timeLimitPerQuestion: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={10}>10 giây</option>
                  <option value={15}>15 giây (Chuẩn)</option>
                  <option value={20}>20 giây</option>
                  <option value={30}>30 giây</option>
                </select>
              </div>
            </div>

            {/* Input Mode Selector in Setup */}
            <div className="pt-2 border-t border-[#21262D] space-y-3">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phương Thức Trả Lời (Thiết Lập Trước Khi Chơi)</span>
              </label>
              <GameInputSelector
                currentMode={inputMode}
                onModeChange={setInputMode}
                allowedModes={['camera', 'voice', 'manual']}
                playerCount={1}
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
                    zoneCount={1}
                    zoneDetections={zoneDetections}
                    onManualTrigger={(_zIdx, opt) => handleSelectOption(opt)}
                    onRetryCamera={retryCamera}
                    onTurnOffCamera={() => setInputMode('manual')}
                    availableCameras={availableCameras}
                    activeDeviceId={activeDeviceId}
                    onSelectCamera={setActiveDeviceId}
                    playerLabels={[gameConfig.explorerName || 'Nhà thám hiểm']}
                  />
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartExpedition}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Xuất Phát Chuyến Thám Hiểm</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= FACING OBSTACLE & RESULT STAGE ================= */}
        {(stage === 'facing_obstacle' || stage === 'obstacle_result') &&
          currentQ &&
          currentObs && (
            <div className="space-y-5">
              {/* Top Header with Quick Input Mode Switching if needed */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <GameInputSelector
                  currentMode={inputMode}
                  onModeChange={setInputMode}
                  allowedModes={['camera', 'voice', 'manual']}
                  playerCount={1}
                  onTurnOffCamera={() => setInputMode('manual')}
                />
              </div>

              {/* 1. Interactive Expedition Mountain Map Track */}
              <div className="bg-[#111622] border border-[#21262D] rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Footprints className="w-4 h-4" />
                      <span>
                        Chặng {currentObstacleIndex + 1} / {obstacles.length}:{' '}
                        {currentObs.name}
                      </span>
                    </div>
                  </div>

                  {/* Health Bar & Stats */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5 bg-[#0A0E17] px-3 py-1 rounded-xl border border-rose-500/30 text-rose-300">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span>{explorer.health}% Thể Lực</span>
                    </div>
                    <div className="text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                      {explorer.score}đ
                    </div>
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}s</span>
                    </div>
                  </div>
                </div>

                {/* Visual Mountain Obstacles Trail */}
                <div className="flex items-center justify-between gap-2 p-3 bg-[#0A0E17] rounded-2xl border border-[#30363D] overflow-x-auto">
                  {obstacles.map((obs, idx) => {
                    const isCurrent = idx === currentObstacleIndex;
                    const isPassed = idx < currentObstacleIndex;

                    let nodeStyle = 'border-[#30363D] bg-[#161B22] text-gray-500';
                    if (isCurrent) {
                      nodeStyle =
                        'border-emerald-400 bg-emerald-950/60 text-emerald-300 scale-110 shadow-lg shadow-emerald-500/20';
                    } else if (isPassed) {
                      nodeStyle = obs.clearedByCorrect
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400'
                        : 'border-rose-500/50 bg-rose-950/20 text-rose-400';
                    }

                    return (
                      <React.Fragment key={obs.id}>
                        <div
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all min-w-[70px] ${nodeStyle}`}
                        >
                          <span className="text-xl">{obs.icon}</span>
                          <span className="text-[10px] font-bold truncate max-w-[65px]">
                            {obs.name}
                          </span>
                          {isPassed && (
                            <span className="text-[9px]">
                              {obs.clearedByCorrect ? '✓ Xong' : '✕ Bị thương'}
                            </span>
                          )}
                        </div>
                        {idx < obstacles.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 min-w-[15px] ${
                              isPassed ? 'bg-emerald-500' : 'bg-[#30363D]'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Active Input Overlay */}
              {inputMode === 'camera' && (
                <div className="animate-fadeIn">
                  <CameraGestureOverlay
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    mediaStream={mediaStream}
                    isCameraActive={isCameraActive}
                    isLoadingModel={isLoadingModel}
                    cameraError={cameraError}
                    zoneCount={1}
                    zoneDetections={zoneDetections}
                    onManualTrigger={(_zIdx, opt) => handleSelectOption(opt)}
                    onRetryCamera={retryCamera}
                    onTurnOffCamera={() => setInputMode('manual')}
                    availableCameras={availableCameras}
                    activeDeviceId={activeDeviceId}
                    onSelectCamera={setActiveDeviceId}
                    playerLabels={[gameConfig.explorerName || 'Nhà thám hiểm']}
                  />
                </div>
              )}

              {inputMode === 'voice' && (
                <div className="animate-fadeIn">
                  <VoiceRecognitionOverlay
                    isActive={stage === 'facing_obstacle'}
                    isLocked={selectedOption !== null}
                    lockedOption={selectedOption}
                    onOptionRecognized={(opt) => {
                      if (stage === 'facing_obstacle' && selectedOption === null) {
                        handleSelectOption(opt);
                      }
                    }}
                  />
                </div>
              )}

              {/* 2. Obstacle Challenge & Question Box */}
              <div className="bg-[#111622] border border-[#21262D] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                {/* Obstacle Description Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#161B22] to-[#1a2332] border border-emerald-500/30 flex items-start gap-3.5">
                  <span className="text-3xl">{currentObs.icon}</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      Thử Thách: {currentObs.name}
                    </h3>
                    <p className="text-xs text-gray-300 mt-1">
                      {currentObs.description}
                    </p>
                  </div>
                </div>

                {/* Math Question Text */}
                <div className="bg-[#0A0E17] p-5 sm:p-6 rounded-2xl border border-[#30363D] shadow-inner">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                    Nội dung câu hỏi:
                  </span>
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed tracking-tight">
                    <MathRenderer text={currentQ?.content || (currentQ as any)?.question || ''} isLarge />
                  </div>
                  {/* Diagrams and Data Tables if present */}
                  {(currentQ?.diagram || currentQ?.tableData) && (
                    <div className="mt-3 flex justify-center">
                      <MathDiagramView diagram={currentQ.diagram} tableData={currentQ.tableData} />
                    </div>
                  )}
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOption === opt.key;
                    const isCorrect = opt.key === currentQ.correctAnswer;
                    const showResult = stage === 'obstacle_result';

                    let style =
                      'bg-[#0A0E17] border-[#30363D] text-gray-200 hover:border-emerald-500 hover:bg-[#161B22]';
                    let keyBadgeStyle = 'bg-[#21262D] text-emerald-400 border-[#30363D]';

                    if (showResult) {
                      if (isCorrect) {
                        style =
                          'bg-emerald-950/60 border-emerald-400 text-emerald-200 font-black shadow-lg shadow-emerald-500/20';
                        keyBadgeStyle = 'bg-emerald-500 text-slate-950 border-emerald-300';
                      } else if (isSelected && !isCorrect) {
                        style =
                          'bg-rose-950/60 border-rose-500 text-rose-300 line-through opacity-80';
                        keyBadgeStyle = 'bg-rose-500 text-white border-rose-300';
                      } else {
                        style = 'bg-[#0A0E17]/50 border-[#21262D] text-gray-500 opacity-40';
                        keyBadgeStyle = 'bg-[#161B22] text-gray-500 border-[#21262D]';
                      }
                    } else if (isSelected) {
                      style =
                        'bg-emerald-600 border-emerald-400 text-white font-bold shadow-lg shadow-emerald-600/30';
                      keyBadgeStyle = 'bg-white text-emerald-700 border-white';
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={
                          stage !== 'facing_obstacle' || selectedOption !== null
                        }
                        onClick={() => handleSelectOption(opt.key)}
                        className={`p-4 sm:p-5 rounded-2xl border text-left transition flex items-center gap-3.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${style}`}
                      >
                        <span
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-mono font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 border shadow-sm ${keyBadgeStyle}`}
                        >
                          {opt.key}
                        </span>
                        <span className="text-base sm:text-lg md:text-xl font-bold leading-relaxed flex-1">
                          <MathRenderer text={opt.text} />
                        </span>
                        {showResult && isCorrect && (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Obstacle Result Actions */}
                {stage === 'obstacle_result' && (
                  <div className="pt-4 border-t border-[#21262D] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0E17] p-4 sm:p-5 rounded-2xl border border-[#30363D]">
                    <div className="text-sm sm:text-base space-y-1.5 flex-1">
                      {selectedOption === currentQ.correctAnswer ? (
                        <div className="text-emerald-400 font-extrabold flex items-center gap-2 text-base sm:text-lg">
                          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>
                            Vượt chướng ngại vật thành công! (+10 điểm)
                          </span>
                        </div>
                      ) : (
                        <div className="text-rose-400 font-bold text-base sm:text-lg">
                          Chưa vượt qua! Mất 15% thể lực. Đáp án đúng là [
                          <strong className="text-white underline">{currentQ.correctAnswer}</strong>].
                        </div>
                      )}
                      {currentQ.explanation && (
                        <div className="text-xs sm:text-sm text-gray-300 bg-[#161B22] p-2.5 rounded-xl border border-[#30363D]">
                          <strong className="text-amber-400">Giải thích:</strong> {currentQ.explanation}
                        </div>
                      )}
                      {newItemDiscovered && (
                        <div className="text-amber-400 text-xs sm:text-sm font-bold">
                          🎁 Nhận được bảo vật: {newItemDiscovered}!
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleNextObstacle}
                      className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/25 hover:scale-105 transition flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      <span>
                        {currentObstacleIndex + 1 >= questions.length
                          ? 'Cắm Cờ Trên Đỉnh Núi 🏆'
                          : 'Tiếp Tục Hành Trình 🧗'}
                      </span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ================= SUMMIT FINISH STAGE ================= */}
        {stage === 'summit' && (
          <div className="max-w-5xl mx-auto w-full bg-[#111622] border border-[#21262D] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce">
              <Mountain className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Chinh Phục Thành Công Đỉnh Núi</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Chúc Mừng {gameConfig.explorerName} Đã Hoàn Thành Thám Hiểm! 🚩
              </h2>
            </div>

            {/* Expedition Summary Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#0A0E17] border border-[#30363D]">
                <div className="text-xs text-gray-400">Chướng Ngại Đã Vượt</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {explorer.clearedCount} / {obstacles.length}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#0A0E17] border border-[#30363D]">
                <div className="text-xs text-gray-400">Thể Lực Còn Lại</div>
                <div className="text-xl font-bold font-mono text-rose-400">
                  {explorer.health}%
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#0A0E17] border border-[#30363D]">
                <div className="text-xs text-gray-400">Thời Gian Leo Núi</div>
                <div className="text-xl font-bold font-mono text-blue-400">
                  {explorer.totalTimeSeconds}s
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#0A0E17] border border-amber-500/40">
                <div className="text-xs text-gray-400">Tổng Điểm Thám Hiểm</div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {explorer.score} đ
                </div>
              </div>
            </div>

            {/* Unlocked Relics */}
            <div className="p-4 rounded-2xl bg-[#0A0E17] border border-[#30363D] text-left space-y-2">
              <div className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Bảo Vật Thu Thập Được Trên Hành Trình</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {explorer.itemsUnlocked.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1 rounded-xl bg-[#161B22] border border-[#30363D] text-emerald-300 font-semibold"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleStartExpedition}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bắt Đầu Chuyến Thám Hiểm Mới</span>
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
