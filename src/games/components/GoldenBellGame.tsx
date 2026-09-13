import React, { useState, useEffect, useRef } from 'react';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { GoldenBellContestant, GoldenBellConfig } from '../types/GamePlatform';
import { GoldenBellService } from '../services/GoldenBellService';
import { QuestionSelectionService } from '../services/QuestionSelectionService';
import { GoldenBellRemoteModal } from './GoldenBellRemoteModal';
import { GameInputSelector, InputModeType } from './GameInputSelector';
import { CameraGestureOverlay } from './CameraGestureOverlay';
import { MathRenderer } from './MathRenderer';
import { MathDiagramView } from './MathDiagramView';
import { soundEffects } from '../services/SoundEffects';
import { useMediaPipeHands } from '../gesture-quiz/hooks/useMediaPipeHands';
import {
  Bell,
  Trophy,
  RotateCcw,
  LogOut,
  Sparkles,
  Users,
  Layers,
  Award,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  HeartHandshake,
  UserX,
  UserCheck,
  ShieldAlert,
  Smartphone,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface GoldenBellGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
}

export const GoldenBellGame: React.FC<GoldenBellGameProps> = ({
  lessons,
  onExitToMenu,
}) => {
  // 1. Configuration State
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons[0]?.id || ''
  );
  const currentLesson =
    lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  const [gameConfig, setGameConfig] = useState<GoldenBellConfig>({
    purpose: 'warm-up',
    subject: currentLesson?.subject || 'Toán THCS',
    lessonTitle: currentLesson?.lessonTitle || '',
    questionPoolIds: currentLesson?.questionBank.map((q) => q.id) || [],
    questionsPerRound: 10,
    timeLimitPerQuestion: 15,
    eliminationMode: 'elimination',
    contestantCount: 12,
    contestantNames: Array.from({ length: 12 }, (_, i) => `Thí sinh ${i + 1}`),
    allowTeacherRescue: true,
  });

  // Input Mode & Remote Device Modal (Default to camera for AI gesture detection)
  const [inputMode, setInputMode] = useState<InputModeType>('camera');
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState<boolean>(false);

  // Game Lifecycle State
  const [stage, setStage] = useState<
    'config' | 'intro' | 'question' | 'round-summary' | 'winner'
  >('config');

  // Active Game State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [contestants, setContestants] = useState<GoldenBellContestant[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [eliminatedThisRound, setEliminatedThisRound] = useState<GoldenBellContestant[]>([]);
  const [rescueUsed, setRescueUsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const contestantsRef = useRef<GoldenBellContestant[]>([]);

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

  // MediaPipe hook for Camera Gesture recognition (for 1-4 contestants)
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
    zoneCount: Math.min(contestants.length || gameConfig.contestantCount, 4),
    isActive: inputMode === 'camera' && stage !== 'winner',
    onZoneAnswerLocked: (zoneIdx, option) => {
      if (stage !== 'question') return;
      const activeContestants = contestantsRef.current.filter((c) => !c.isEliminated);
      const currentC = activeContestants[zoneIdx] || contestantsRef.current[zoneIdx];
      if (currentC && currentC.selectedOption === null) {
        handleContestantSelect(currentC.id, option);
      }
    },
  });

  // Keep contestantsRef synchronized with state
  useEffect(() => {
    contestantsRef.current = contestants;
  }, [contestants]);

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
    if (stage === 'question' && isTimerRunning) {
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

  // Start Golden Bell Handler
  const handleStartGame = () => {
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

    const initialContestants = GoldenBellService.initContestants(
      gameConfig.contestantNames.slice(0, gameConfig.contestantCount)
    );

    setQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    setContestants(initialContestants);
    setRescueUsed(false);
    setEliminatedThisRound([]);
    setStage('intro');
  };

  const handleStartFirstQuestion = () => {
    setTimeLeft(gameConfig.timeLimitPerQuestion);
    setIsTimerRunning(true);
    setStage('question');
  };

  // Contestant answers
  const handleContestantSelect = (contestantId: string, option: QuizOptionKeyEnum) => {
    if (stage !== 'question') return;

    const updated = contestantsRef.current.map((c) => {
      if (c.id === contestantId && !c.isEliminated && c.selectedOption === null) {
        return {
          ...c,
          selectedOption: option,
        };
      }
      return c;
    });

    contestantsRef.current = updated;
    setContestants(updated);

    // If all active contestants have selected, immediately evaluate round
    const activeContestants = updated.filter((c) => !c.isEliminated);
    const allAnswered = activeContestants.length > 0 && activeContestants.every((c) => c.selectedOption !== null);
    if (allAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);
      evaluateRound(updated);
    }
  };

  // Quick batch helper for teacher in large classrooms
  const handleAllSelectSame = (option: QuizOptionKeyEnum) => {
    if (stage !== 'question') return;
    const updated = contestantsRef.current.map((c) =>
      !c.isEliminated && c.selectedOption === null ? { ...c, selectedOption: option } : c
    );
    contestantsRef.current = updated;
    setContestants(updated);

    const activeContestants = updated.filter((c) => !c.isEliminated);
    const allAnswered = activeContestants.length > 0 && activeContestants.every((c) => c.selectedOption !== null);
    if (allAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);
      evaluateRound(updated);
    }
  };

  // Time-up
  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    evaluateRound(contestantsRef.current);
  };

  // Evaluate Round
  const evaluateRound = (contestantsList?: GoldenBellContestant[]) => {
    const listToEvaluate = contestantsList || contestantsRef.current;
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const isElimination = gameConfig.eliminationMode === 'elimination';
    const result = GoldenBellService.processRoundAnswers(
      listToEvaluate,
      currentQ.correctAnswer,
      currentQuestionIndex,
      isElimination,
      currentQ.options
    );

    contestantsRef.current = result.updatedContestants;
    setContestants(result.updatedContestants);
    setEliminatedThisRound(result.eliminatedThisRound);

    if (result.eliminatedThisRound.length === 0) {
      soundEffects.playCorrect();
    } else {
      soundEffects.playWrong();
    }

    setStage('round-summary');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (stage === 'round-summary' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleNextRound();
      } else if (stage === 'question') {
        const key = e.key.toUpperCase();
        // If single active contestant or first active contestant
        const firstActive = contestants.find((c) => !c.isEliminated && c.selectedOption === null);
        if (firstActive) {
          if (key === '1' || key === 'A') handleContestantSelect(firstActive.id, QuizOptionKeyEnum.A);
          else if (key === '2' || key === 'B') handleContestantSelect(firstActive.id, QuizOptionKeyEnum.B);
          else if (key === '3' || key === 'C') handleContestantSelect(firstActive.id, QuizOptionKeyEnum.C);
          else if (key === '4' || key === 'D') handleContestantSelect(firstActive.id, QuizOptionKeyEnum.D);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, contestants, currentQuestionIndex, questions.length]);

  // Teacher Rescue Action
  const handleTeacherRescueAll = () => {
    const revived = GoldenBellService.rescueContestants(contestants);
    setContestants(revived);
    setRescueUsed(true);
    setEliminatedThisRound([]);
  };

  // Move to next question or end game
  const handleNextRound = () => {
    const activeSurvivors = contestants.filter((c) => !c.isEliminated);

    // End condition: last question reached OR everyone eliminated (if no rescue)
    if (
      currentQuestionIndex + 1 >= questions.length ||
      (gameConfig.eliminationMode === 'elimination' && activeSurvivors.length === 0)
    ) {
      soundEffects.playVictory();
      const ranked = GoldenBellService.rankContestants(contestants);
      setContestants(ranked);
      setStage('winner');
    } else {
      soundEffects.playBellRing();
      setCurrentQuestionIndex((prev) => prev + 1);
      setContestants((prev) =>
        prev.map((c) => ({
          ...c,
          selectedOption: null,
        }))
      );
      setEliminatedThisRound([]);
      setTimeLeft(gameConfig.timeLimitPerQuestion);
      setIsTimerRunning(true);
      setStage('question');
      resetZoneStates();
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const survivors = contestants.filter((c) => !c.isEliminated);
  const eliminatedList = contestants.filter((c) => c.isEliminated);
  const rankedContestants = GoldenBellService.rankContestants(contestants);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#070B14] text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black"
    >
      {/* Platform Header */}
      <header className="border-b border-[#21262D] bg-[#0E131F]/90 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Rung Chuông Vàng Toán Học
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {gameConfig.eliminationMode === 'elimination' ? 'Loại Trực Tiếp' : 'Tích Lũy Điểm'}
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-bold text-amber-300 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Rời Trò Chơi</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-stretch justify-start">
        {/* ================= CONFIGURATION STAGE ================= */}
        {stage === 'config' && (
          <div className="max-w-4xl mx-auto w-full bg-[#111622] border border-[#21262D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-[#21262D] pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Bell className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Thiết Lập Sàn Đấu Rung Chuông Vàng
                </h2>
                <p className="text-xs text-gray-400">
                  Cấu hình chế độ loại trực tiếp hoặc tính điểm cho lớp học
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
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.subject} (Lớp {lesson.grade}) - {lesson.lessonTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode: Elimination vs Survival */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chế Độ Thi Đấu</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGameConfig((prev) => ({
                        ...prev,
                        eliminationMode: 'elimination',
                      }))
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      gameConfig.eliminationMode === 'elimination'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-[#0A0E17] border-[#30363D] text-gray-400'
                    }`}
                  >
                    ⚡ Loại Trực Tiếp
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGameConfig((prev) => ({
                        ...prev,
                        eliminationMode: 'survival_points',
                      }))
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      gameConfig.eliminationMode === 'survival_points'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'bg-[#0A0E17] border-[#30363D] text-gray-400'
                    }`}
                  >
                    🌟 Không Loại Thí Sinh
                  </button>
                </div>
              </div>

              {/* Questions Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Số Câu Hỏi Sàn Đấu</span>
                </label>
                <select
                  value={gameConfig.questionsPerRound}
                  onChange={(e) =>
                    setGameConfig((prev) => ({
                      ...prev,
                      questionsPerRound: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={5}>5 câu thử thách</option>
                  <option value={8}>8 câu tiêu chuẩn</option>
                  <option value={10}>10 câu Rung Chuông Vàng</option>
                  <option value={15}>15 câu Đại Chung Kết</option>
                </select>
              </div>

              {/* Time Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Thời Gian Mỗi Câu</span>
                </label>
                <select
                  value={gameConfig.timeLimitPerQuestion}
                  onChange={(e) =>
                    setGameConfig((prev) => ({
                      ...prev,
                      timeLimitPerQuestion: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={10}>10 giây (Căng thẳng)</option>
                  <option value={15}>15 giây (Tiêu chuẩn)</option>
                  <option value={20}>20 giây (Vừa phải)</option>
                  <option value={30}>30 giây (Thoải mái)</option>
                </select>
              </div>
            </div>

            {/* Contestant Count Setup */}
            <div className="space-y-3 pt-3 border-t border-[#21262D]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Số Lượng Thí Sinh Tham Gia ({gameConfig.contestantCount} học sinh)</span>
                </label>
                <div className="flex gap-1.5">
                  {[6, 12, 18, 24].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        const newNames = Array.from(
                          { length: num },
                          (_, i) => `Thí sinh ${i + 1}`
                        );
                        setGameConfig((prev) => ({
                          ...prev,
                          contestantCount: num,
                          contestantNames: newNames,
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        gameConfig.contestantCount === num
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-[#0A0E17] border-[#30363D] text-gray-400'
                      }`}
                    >
                      {num} Thí sinh
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Mode Selector in Setup */}
            <div className="space-y-3 pt-3 border-t border-[#21262D]">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Phương Thức Trả Lời (Thiết Lập Trước Khi Vào Sàn Đấu)</span>
              </label>
              <GameInputSelector
                currentMode={inputMode}
                onModeChange={(mode) => {
                  setInputMode(mode);
                  if (mode === 'remote') {
                    setIsRemoteModalOpen(true);
                  }
                }}
                allowedModes={['manual', 'camera', 'remote']}
                playerCount={contestants.length}
                onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
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
                    zoneCount={Math.min(contestants.length, 6)}
                    zoneDetections={zoneDetections}
                    onManualTrigger={(zoneIdx, opt) => {
                      if (contestants[zoneIdx]) {
                        handleContestantSelect(contestants[zoneIdx].id, opt);
                      }
                    }}
                    onRetryCamera={retryCamera}
                    onTurnOffCamera={() => setInputMode('manual')}
                    availableCameras={availableCameras}
                    activeDeviceId={activeDeviceId}
                    onSelectCamera={setActiveDeviceId}
                    playerLabels={contestants.map((c) => c.name)}
                  />
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <span>Vào Sàn Đấu Rung Chuông Vàng</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= INTRO STAGE ================= */}
        {stage === 'intro' && (
          <div className="max-w-2xl mx-auto w-full text-center bg-[#111622] border border-[#21262D] rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 animate-bounce">
              <Bell className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Chào Mừng Đến Với Sàn Đấu Rung Chuông Vàng!
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
                {contestants.length} thí sinh đã sẵn sàng trên sàn đấu. Hãy vượt qua tất cả{' '}
                {questions.length} câu hỏi Toán học để chạm tay vào chiếc Chuông Vàng danh giá!
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-gray-300">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>
                  <strong>{contestants.length}</strong> Thí sinh
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>{questions.length}</strong> Câu hỏi
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>{gameConfig.timeLimitPerQuestion}s</strong> / câu
                </span>
              </div>
            </div>

            <button
              onClick={handleStartFirstQuestion}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:scale-105 transition"
            >
              Bắt Đầu Câu Số 1 🔔
            </button>
          </div>
        )}

        {/* ================= ACTIVE QUESTION & ROUND SUMMARY STAGE ================= */}
        {(stage === 'question' || stage === 'round-summary') && currentQ && (
          <div className="space-y-5">
            {/* Top Status Bar: Bell & Survivors */}
            <div className="bg-[#111622] border border-[#21262D] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Bell className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    CÂU HỎI {currentQuestionIndex + 1} / {questions.length}
                  </div>
                  <div className="text-xs text-gray-400">
                    {gameConfig.eliminationMode === 'elimination'
                      ? 'Thí sinh trả lời sai sẽ tạm dừng sàn đấu'
                      : 'Tất cả thí sinh cùng tích lũy điểm'}
                  </div>
                </div>
              </div>

              {/* Survivor Stats Badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#0A0E17] px-3.5 py-1.5 rounded-xl border border-[#30363D]">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs">
                    Còn lại:{' '}
                    <strong className="text-emerald-400 font-mono font-bold">
                      {survivors.length}
                    </strong>{' '}
                    / {contestants.length}
                  </span>
                </div>

                {eliminatedList.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#0A0E17] px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 text-xs">
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>
                      Đã loại: <strong className="font-mono">{eliminatedList.length}</strong>
                    </span>
                  </div>
                )}

                {/* Timer Bar */}
                <div className="flex items-center gap-2 bg-[#0A0E17] px-3 py-1.5 rounded-xl border border-[#30363D]">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-mono font-bold text-sm text-amber-300">
                    {timeLeft}s
                  </span>
                </div>
              </div>
            </div>

            {/* Input Mode Selector for Golden Bell */}
            <GameInputSelector
              currentMode={inputMode}
              onModeChange={(mode) => {
                setInputMode(mode);
                if (mode === 'remote') {
                  setIsRemoteModalOpen(true);
                }
              }}
              allowedModes={['manual', 'camera', 'remote']}
              playerCount={Math.min(contestants.length, 4)}
              onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
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
                  zoneCount={Math.min(contestants.length, 4)}
                  zoneDetections={zoneDetections}
                  onManualTrigger={(zIdx, opt) => {
                    const activeContestants = contestants.filter((c) => !c.isEliminated);
                    const target = activeContestants[zIdx] || contestants[zIdx];
                    if (target) handleContestantSelect(target.id, opt);
                  }}
                  onRetryCamera={retryCamera}
                  onTurnOffCamera={() => setInputMode('manual')}
                  availableCameras={availableCameras}
                  activeDeviceId={activeDeviceId}
                  onSelectCamera={setActiveDeviceId}
                  playerLabels={contestants.slice(0, 4).map((c) => c.name)}
                />
              </div>
            )}

            {/* Question Text Box */}
            <div className="bg-[#111622] border border-[#21262D] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="bg-[#0A0E17] p-5 sm:p-6 rounded-2xl border border-[#30363D] shadow-inner">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block mb-2">
                  Nội dung câu hỏi:
                </span>
                <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed tracking-tight">
                  <MathRenderer text={currentQ?.content || (currentQ as any)?.question || ''} />
                </p>
                {/* Diagrams and Data Tables */}
                {(currentQ?.diagram || currentQ?.tableData) && (
                  <div className="mt-3 flex justify-center">
                    <MathDiagramView diagram={currentQ.diagram} tableData={currentQ.tableData} />
                  </div>
                )}
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                {currentQ.options.map((opt) => {
                  const isCorrect = opt.key === currentQ.correctAnswer;
                  const showResult = stage === 'round-summary';

                  let style =
                    'bg-[#0A0E17] border-[#30363D] text-gray-200 hover:border-gray-500';
                  let keyBadge = 'bg-[#21262D] text-amber-400 border-[#30363D]';

                  if (showResult) {
                    if (isCorrect) {
                      style =
                        'bg-emerald-950/60 border-emerald-400 text-emerald-200 font-black shadow-lg shadow-emerald-500/20';
                      keyBadge = 'bg-emerald-500 text-slate-950 border-emerald-300';
                    } else {
                      style = 'bg-[#0A0E17]/50 border-[#21262D] text-gray-500 opacity-50';
                      keyBadge = 'bg-[#161B22] text-gray-500 border-[#21262D]';
                    }
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between transition ${style}`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 mr-2">
                        <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-mono font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 border shadow-sm ${keyBadge}`}>
                          {opt.key}
                        </span>
                        <span className="text-base sm:text-lg md:text-xl font-bold leading-relaxed">
                          <MathRenderer text={opt.text} />
                        </span>
                      </div>
                      {stage === 'question' && (
                        <button
                          type="button"
                          onClick={() => handleAllSelectSame(opt.key)}
                          className="text-xs bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white px-3 py-1.5 rounded-xl border border-blue-500/30 font-bold transition shrink-0 cursor-pointer"
                          title="Gán cho tất cả thí sinh đang chọn"
                        >
                          Chọn chung
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contestants Arena Grid */}
            <div className="bg-[#111622] border border-[#21262D] rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Sàn Thi Đấu Thí Sinh ({contestants.length} vị trí)</span>
                </h3>
                <span className="text-[11px] text-gray-500">
                  Bấm vào từng thí sinh để chọn A, B, C, D
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {contestants.map((c) => {
                  const isElim = c.isEliminated;
                  const hasAnswered = c.selectedOption !== null;
                  const showResult = stage === 'round-summary';
                  const isCorrect = c.selectedOption === currentQ.correctAnswer;

                  let borderClass = 'border-[#30363D] bg-[#0A0E17]';
                  if (isElim) {
                    borderClass = 'border-rose-900/40 bg-rose-950/20 opacity-50';
                  } else if (showResult) {
                    borderClass = isCorrect
                      ? 'border-emerald-500/60 bg-emerald-950/30'
                      : 'border-rose-500/60 bg-rose-950/30';
                  } else if (hasAnswered) {
                    borderClass = 'border-blue-500/60 bg-blue-950/20';
                  }

                  return (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-2xl border transition relative flex flex-col justify-between ${borderClass}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.avatarColor }}
                        />
                        {isElim ? (
                          <span className="text-[10px] text-rose-400 font-bold">Đã loại</span>
                        ) : hasAnswered ? (
                          <span className="text-[10px] font-mono font-bold text-amber-400">
                            [{c.selectedOption}]
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-mono">...</span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-white truncate">{c.name}</div>
                      <div className="text-[10px] font-mono text-gray-400">
                        {c.correctCount}đ ({c.score}p)
                      </div>

                      {/* Mini Buttons A B C D */}
                      {!isElim && stage === 'question' && (
                        <div className="grid grid-cols-4 gap-1 mt-2">
                          {(['A', 'B', 'C', 'D'] as QuizOptionKeyEnum[]).map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => handleContestantSelect(c.id, k)}
                              className={`py-0.5 rounded text-[10px] font-mono font-bold border transition ${
                                c.selectedOption === k
                                  ? 'bg-amber-500 text-black border-amber-400'
                                  : 'bg-[#161B22] border-[#30363D] text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Round Summary Actions */}
            {stage === 'round-summary' && (
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm sm:text-base space-y-1.5 flex-1">
                  <div className="text-gray-200">
                    Đáp án chuẩn xác:{' '}
                    <strong className="text-emerald-400 font-mono text-base sm:text-lg">
                      [ {currentQ.correctAnswer} ] -{' '}
                      {currentQ.options.find((o) => o.key === currentQ.correctAnswer)?.text}
                    </strong>
                  </div>
                  {currentQ.explanation && (
                    <div className="text-xs sm:text-sm text-gray-300 bg-[#161B22] p-2.5 rounded-xl border border-[#30363D]">
                      <strong className="text-amber-400">Giải thích:</strong> {currentQ.explanation}
                    </div>
                  )}
                  {eliminatedThisRound.length > 0 && (
                    <div className="text-rose-400 font-bold text-sm sm:text-base">
                      ⚠️ {eliminatedThisRound.length} thí sinh bị loại ở câu này!
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Teacher Rescue Button */}
                  {gameConfig.allowTeacherRescue && !rescueUsed && eliminatedList.length > 0 && (
                    <button
                      onClick={handleTeacherRescueAll}
                      className="px-5 py-3 rounded-xl bg-purple-600/30 border border-purple-500/60 hover:bg-purple-600 text-purple-200 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      <span>Cứu Trợ Thí Sinh 🛟</span>
                    </button>
                  )}

                  <button
                    onClick={handleNextRound}
                    className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 hover:scale-105 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex + 1 >= questions.length
                        ? 'Xem Kết Quả Chuông Vàng 🏆'
                        : 'Câu Tiếp Theo 🔔'}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= WINNER PODIUM STAGE ================= */}
        {stage === 'winner' && (
          <div className="max-w-5xl mx-auto w-full bg-[#111622] border border-[#21262D] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-2xl shadow-amber-500/40 animate-bounce">
                <Bell className="w-10 h-10" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Hoàn Thành Sàn Đấu Rung Chuông Vàng</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {survivors.length > 0
                  ? `Chúc Mừng ${survivors[0].name} Đã Rung Chuông Vàng! 🔔`
                  : 'Bảng Xếp Hạng Chung Cuộc Sàn Đấu'}
              </h2>
            </div>

            {/* Top Survivors Spotlight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {rankedContestants.slice(0, 3).map((c, i) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border text-center space-y-2 ${
                    i === 0
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-[#0A0E17] border-[#30363D]'
                  }`}
                >
                  <div className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                  <div className="text-sm font-bold text-white">{c.name}</div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {c.correctCount} / {questions.length} câu đúng
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">{c.score} điểm</div>
                </div>
              ))}
            </div>

            {/* Roster Table */}
            <div className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#0A0E17]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161B22] text-gray-400 font-semibold border-b border-[#30363D]">
                  <tr>
                    <th className="p-3 text-center w-14">Hạng</th>
                    <th className="p-3">Thí Sinh</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-center">Số Câu Đúng</th>
                    <th className="p-3 text-right">Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262D]">
                  {rankedContestants.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-[#161B22]/50 transition">
                      <td className="p-3 text-center font-mono font-bold text-gray-300">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-white">{c.name}</td>
                      <td className="p-3 text-center">
                        {c.isEliminated ? (
                          <span className="text-rose-400 text-[11px] font-mono">
                            Dừng lại câu {c.eliminatedAtQuestion}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-bold">
                            Chạm Đích 🏆
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-gray-200">
                        {c.correctCount} / {questions.length}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-400">
                        {c.score} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleStartGame}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đấu Lại Trận Mới 🔔</span>
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
        {/* Remote / Separate Device Modal for Golden Bell */}
        <GoldenBellRemoteModal
          isOpen={isRemoteModalOpen}
          onClose={() => setIsRemoteModalOpen(false)}
          contestants={contestants}
          currentQuestionIndex={currentQuestionIndex}
          onContestantAnswer={handleContestantSelect}
          onBatchAnswer={handleAllSelectSame}
        />
      </main>
    </div>
  );
};
