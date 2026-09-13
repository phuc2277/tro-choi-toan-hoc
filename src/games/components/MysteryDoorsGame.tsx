import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import {
  MysteryDoorItem,
  MysteryDoorsGameConfig,
  MysteryDoorsPlayerState,
  MysteryThemePreset,
} from '../types/GamePlatform';
import { MysteryDoorsService } from '../services/MysteryDoorsService';
import { QuestionSelectionService } from '../services/QuestionSelectionService';
import { QuizScoringService } from '../services/QuizScoringService';
import { DEFAULT_LESSON_UNITS } from '../../data/defaultQuestionBanks';
import { CameraGestureOverlay } from './CameraGestureOverlay';
import { VoiceRecognitionOverlay } from './VoiceRecognitionOverlay';
import { GameInputSelector, InputModeType } from './GameInputSelector';
import { QuestionBankModal } from './QuestionBankModal';
import { MathRenderer } from './MathRenderer';
import { MathDiagramView } from './MathDiagramView';
import { soundEffects } from '../services/SoundEffects';
import { useMediaPipeHands } from '../gesture-quiz/hooks/useMediaPipeHands';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  LogOut,
  HelpCircle,
  Clock,
  Layers,
  Award,
  ChevronRight,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  Unlock,
  PartyPopper,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Users,
  User,
  Flame,
  Gift,
  Star,
  Check,
  DoorOpen,
  MousePointer,
  ArrowRight,
  AlertCircle,
  Lightbulb,
  Zap,
  X,
  EyeOff,
} from 'lucide-react';

interface MysteryDoorsGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
}

export const MysteryDoorsGame: React.FC<MysteryDoorsGameProps> = ({
  lessons,
  onExitToMenu,
}) => {
  const safeLessons = lessons && lessons.length > 0 ? lessons : DEFAULT_LESSON_UNITS;

  // 1. Configuration State
  const [selectedLessonId, setSelectedLessonId] = useState<string>(safeLessons[0]?.id || '');
  const currentLesson = safeLessons.find((l) => l.id === selectedLessonId) || safeLessons[0];

  const defaultTheme = MysteryDoorsService.MYSTERY_THEMES[0];

  const [gameConfig, setGameConfig] = useState<MysteryDoorsGameConfig>({
    purpose: 'warm-up',
    subject: currentLesson?.subject || 'Toán THCS',
    lessonTitle: currentLesson?.lessonTitle || '',
    questionPoolIds: (currentLesson?.questionBank || []).map((q) => q.id),
    questionsPerRound: 8,
    timeLimitPerQuestion: 20,
    competitionMode: 'individual',
    playerNames: ['Học sinh 1', 'Học sinh 2'],
    doorCount: 8,
    secretKeyword: defaultTheme.secretKeyword,
    secretClue: defaultTheme.clue,
    themePresetId: defaultTheme.id,
    doorStyle: 'magical',
  });

  // Keep gameConfig in sync with currentLesson
  useEffect(() => {
    if (currentLesson) {
      setGameConfig((prev) => ({
        ...prev,
        subject: currentLesson.subject,
        lessonTitle: currentLesson.lessonTitle,
        questionPoolIds: (currentLesson.questionBank || []).map((q) => q.id),
      }));
    }
  }, [selectedLessonId, currentLesson]);

  // Selected Theme Preset
  const [selectedThemePreset, setSelectedThemePreset] = useState<MysteryThemePreset>(defaultTheme);

  // Input Mode: Camera / Voice / Manual (Default: camera for AI gesture detection)
  const [inputMode, setInputMode] = useState<InputModeType>('camera');

  // Game Lifecycle Stages: 'config' | 'playing' | 'door_active' | 'door_result' | 'finished'
  const [stage, setStage] = useState<'config' | 'playing' | 'door_active' | 'door_result' | 'finished'>('config');

  // Game Play State
  const [doors, setDoors] = useState<MysteryDoorItem[]>([]);
  const [players, setPlayers] = useState<MysteryDoorsPlayerState[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [activeDoor, setActiveDoor] = useState<MysteryDoorItem | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<QuizOptionKeyEnum | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [lastPointsGained, setLastPointsGained] = useState<{ total?: number; totalPoints?: number; breakdown: any } | null>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  // Secret Keyword Guessing State
  const [isSecretGuessModalOpen, setIsSecretGuessModalOpen] = useState<boolean>(false);
  const [guessInput, setGuessInput] = useState<string>('');
  const [guessFeedback, setGuessFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isSecretThemeSolved, setIsSecretThemeSolved] = useState<boolean>(false);

  // Modals & Controls
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState<boolean>(true);
  const [isCameraInQuestionVisible, setIsCameraInQuestionVisible] = useState<boolean>(true);
  const [isVoiceInQuestionVisible, setIsVoiceInQuestionVisible] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // State Refs to eliminate closure staleness during continuous MediaPipe & Speech recognition loops
  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const selectedOptionRef = useRef(selectedOption);
  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  const activeDoorRef = useRef(activeDoor);
  useEffect(() => {
    activeDoorRef.current = activeDoor;
  }, [activeDoor]);

  const activeQuestionRef = useRef(activeQuestion);
  useEffect(() => {
    activeQuestionRef.current = activeQuestion;
  }, [activeQuestion]);

  // MediaPipe AI Camera integration (Active throughout setup and gameplay when camera mode is chosen)
  const {
    videoRef,
    canvasRef,
    isLoadingModel,
    cameraError,
    isCameraActive,
    mediaStream,
    zoneDetections,
    resetZoneStates,
    manualTriggerZoneAnswer,
    retryCamera,
    availableCameras,
    activeDeviceId,
    setActiveDeviceId,
  } = useMediaPipeHands({
    zoneCount: 1,
    requiredStableFrames: 6,
    isActive: stage !== 'finished' && inputMode === 'camera',
    onZoneAnswerLocked: (_zoneIndex, option) => {
      if (stageRef.current === 'door_active' && selectedOptionRef.current === null) {
        handleSelectOption(option);
      }
    },
  });

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Toggle Mute Sound
  const handleToggleMute = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  // Start Game Initiation
  const handleStartGame = () => {
    soundEffects.playSpinTick();

    const bank = currentLesson?.questionBank || [];
    // 1. Select & shuffle questions
    const filteredPool = QuestionSelectionService.filterPoolQuestions(
      bank,
      gameConfig.questionPoolIds || []
    );
    const { selectedQuestions } = QuestionSelectionService.selectRoundQuestions(
      filteredPool.length > 0 ? filteredPool : bank,
      gameConfig.doorCount || 8
    );
    setQuestions(selectedQuestions);

    // 2. Generate doors
    const generatedDoors = MysteryDoorsService.generateDoors(
      gameConfig.doorCount || 8,
      selectedQuestions.length || 1
    );
    setDoors(generatedDoors);

    // 3. Initialize players
    const initializedPlayers = MysteryDoorsService.initPlayers(
      gameConfig.competitionMode || 'individual',
      gameConfig.playerNames || ['Học sinh 1', 'Học sinh 2']
    );
    setPlayers(initializedPlayers);
    setActivePlayerIndex(0);

    // 4. Reset secret theme status
    setIsSecretThemeSolved(false);
    setGuessFeedback(null);
    setGuessInput('');

    // Transition to playing
    setStage('playing');
  };

  // Click / Pick a Door to Open
  const handlePickDoor = (door: MysteryDoorItem) => {
    if (door.isOpen || door.isCompleted) return;

    soundEffects.playSpinTick();
    const question = questions[door.questionIndex] || questions[0];

    // Synchronously update refs BEFORE state so camera / voice / key callbacks see new door immediately
    activeDoorRef.current = door;
    activeQuestionRef.current = question;
    selectedOptionRef.current = null;
    stageRef.current = 'door_active';

    setActiveDoor(door);
    setActiveQuestion(question);
    setSelectedOption(null);
    setLastAnswerCorrect(null);
    setLastPointsGained(null);

    // Reset Hand Tracking states for the newly opened door
    resetZoneStates?.();

    // Extra time for time_freeze surprise
    const timeLimit = door.surpriseType === 'time_freeze'
      ? gameConfig.timeLimitPerQuestion + 15
      : gameConfig.timeLimitPerQuestion;

    setTimeLeft(timeLimit);
    setIsTimerRunning(true);
    setQuestionStartTime(Date.now());

    // Play specific sound for surprise type
    if (door.surpriseType === 'lucky_star' || door.surpriseType === 'mystery_gift') {
      soundEffects.playBellRing();
    }

    setStage('door_active');
  };

  // Handle Answer Selection
  const handleSelectOption = useCallback(
    (optionKey: QuizOptionKeyEnum) => {
      const currentActiveDoor = activeDoorRef.current;
      const currentActiveQuestion = activeQuestionRef.current;
      if (!currentActiveDoor || !currentActiveQuestion || selectedOptionRef.current !== null) return;

      // Cancel timer immediately
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsTimerRunning(false);

      // Lock immediately in ref and state to prevent re-entry
      selectedOptionRef.current = optionKey;
      stageRef.current = 'door_result';
      setSelectedOption(optionKey);

      const responseTimeSec = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
      const isCorrect = QuizScoringService.evaluateIndividualAnswer(
        optionKey,
        currentActiveQuestion.correctAnswer,
        currentActiveQuestion.options
      );
      setLastAnswerCorrect(isCorrect);

      const scoreResult = MysteryDoorsService.calculateDoorScore(
        currentActiveDoor.surpriseType,
        isCorrect,
        10,
        responseTimeSec,
        gameConfig.timeLimitPerQuestion
      );
      setLastPointsGained(scoreResult);

      const currentPlayer = players[activePlayerIndex];

      if (isCorrect) {
        soundEffects.playCorrect();
      } else {
        soundEffects.playWrong();
      }

      // Update Door State
      setDoors((prev) =>
        prev.map((d) =>
          d.id === currentActiveDoor.id
            ? {
                ...d,
                isOpen: true,
                isCompleted: true,
                isCorrect,
                solvedByPlayerName: currentPlayer?.name,
              }
            : d
        )
      );

      // Update Player Stats immediately with newly awarded points
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                score: p.score + scoreResult.totalPoints,
                doorsOpened: p.doorsOpened + 1,
                correctCount: isCorrect ? p.correctCount + 1 : p.correctCount,
                wrongCount: !isCorrect ? p.wrongCount + 1 : p.wrongCount,
              }
            : p
        )
      );

      setStage('door_result');
    },
    [questionStartTime, gameConfig.timeLimitPerQuestion, players, activePlayerIndex]
  );

  // Time Expired
  const handleTimeExpired = useCallback(() => {
    const currentActiveDoor = activeDoorRef.current;
    const currentActiveQuestion = activeQuestionRef.current;
    if (!currentActiveDoor || !currentActiveQuestion) return;

    // 1. If an option was already selected or locked, do not mark as wrong!
    if (selectedOptionRef.current !== null) {
      return;
    }

    // 2. If camera gesture was currently locked on an option, commit that answer
    const lockedZoneOption = zoneDetections[0]?.isLocked ? zoneDetections[0]?.detectedOption : null;
    if (lockedZoneOption) {
      handleSelectOption(lockedZoneOption);
      return;
    }

    // 3. Truly no answer selected before time expired
    setIsTimerRunning(false);
    setLastAnswerCorrect(false);
    setLastPointsGained({ totalPoints: 0, breakdown: { base: 0, bonus: 0, speedBonus: 0 } });
    soundEffects.playWrong();

    const currentPlayer = players[activePlayerIndex];

    setDoors((prev) =>
      prev.map((d) =>
        d.id === currentActiveDoor.id
          ? {
              ...d,
              isOpen: true,
              isCompleted: true,
              isCorrect: false,
              solvedByPlayerName: currentPlayer?.name,
            }
          : d
      )
    );

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              doorsOpened: p.doorsOpened + 1,
              wrongCount: p.wrongCount + 1,
            }
          : p
      )
    );

    setStage('door_result');
  }, [handleSelectOption, zoneDetections, players, activePlayerIndex]);

  // Timer Countdown Effect
  useEffect(() => {
    if (stage === 'door_active' && isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => {
          if (prev <= 4 && prev > 1) {
            soundEffects.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stage === 'door_active' && isTimerRunning && timeLeft === 0) {
      // Time Expired -> handle evaluation
      handleTimeExpired();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stage, isTimerRunning, timeLeft, handleTimeExpired]);

  // Keyboard Shortcuts Listener for fast classroom answers (1/A, 2/B, 3/C, 4/D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (stageRef.current !== 'door_active' || selectedOptionRef.current !== null) return;

      const key = e.key.toUpperCase();
      if (key === '1' || key === 'A') handleSelectOption(QuizOptionKeyEnum.A);
      else if (key === '2' || key === 'B') handleSelectOption(QuizOptionKeyEnum.B);
      else if (key === '3' || key === 'C') handleSelectOption(QuizOptionKeyEnum.C);
      else if (key === '4' || key === 'D') handleSelectOption(QuizOptionKeyEnum.D);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOption]);

  // Close Question Result & Return to Doors Board or End Game
  const handleNextTurn = () => {
    activeDoorRef.current = null;
    activeQuestionRef.current = null;
    selectedOptionRef.current = null;
    stageRef.current = 'playing';

    setActiveDoor(null);
    setActiveQuestion(null);
    setSelectedOption(null);
    setLastAnswerCorrect(null);
    setLastPointsGained(null);
    resetZoneStates?.();

    // Check if all doors are completed
    const remainingDoors = doors.filter((d) => !d.isCompleted);
    if (remainingDoors.length <= 1) {
      // Last door just completed -> finish game
      soundEffects.playVictory();
      setStage('finished');
      return;
    }

    // Switch turn to next player / team
    if (players.length > 1) {
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
    }

    setStage('playing');
  };

  // Handle Grand Secret Keyword Guess
  const handleCheckSecretKeyword = () => {
    if (!guessInput.trim()) return;

    const normalizedGuess = guessInput
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const normalizedTarget = selectedThemePreset.secretKeyword
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const isMatch = normalizedGuess === normalizedTarget;

    if (isMatch) {
      soundEffects.playVictory();
      setIsSecretThemeSolved(true);
      setGuessFeedback({
        isCorrect: true,
        message: `🎉 CHÍNH XÁC! Bạn đã giải mã thành công Mật Mã Toàn Cảnh: "${selectedThemePreset.secretKeyword}" và nhận +100 Điểm Thưởng Jackpot!`,
      });

      // Award +100 bonus points to current player
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex ? { ...p, score: p.score + 100 } : p
        )
      );

      // Reveal all doors
      setDoors((prev) =>
        prev.map((d) => ({
          ...d,
          isOpen: true,
          isCompleted: true,
          isCorrect: true,
        }))
      );
    } else {
      soundEffects.playWrong();
      setGuessFeedback({
        isCorrect: false,
        message: '❌ Chưa chính xác! Hãy mở thêm các cánh cửa để thu thập thêm manh mối nhé.',
      });
    }
  };

  // Replay Game
  const handleReplay = () => {
    handleStartGame();
  };

  // Reset to Setup Config
  const handleResetToConfig = () => {
    setStage('config');
    setActiveDoor(null);
    setActiveQuestion(null);
  };

  // Calculate game stats
  const openedDoorsCount = doors.filter((d) => d.isCompleted).length;
  const correctDoorsCount = doors.filter((d) => d.isCompleted && d.isCorrect).length;
  const totalScore = players.reduce((acc, curr) => acc + curr.score, 0);

  // Sorted players for Podium
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div
      ref={containerRef}
      className="h-screen max-h-screen bg-[#0A0E17] text-white flex flex-col font-sans select-none overflow-hidden"
    >
      {/* ========================================================
       * TOP NAVIGATION HEADER
       * ======================================================== */}
      <header className="border-b border-[#30363D] bg-[#161B22]/95 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 sticky top-0 z-40 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
            <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Ô CỬA BÍ MẬT</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI VISION
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block truncate max-w-md">
              {currentLesson.subject} • Lớp {currentLesson.grade} — {currentLesson.lessonTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {stage !== 'config' && (
            <button
              onClick={() => setIsSecretGuessModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-yellow-200" />
              <span>Giải Mã Bí Ẩn</span>
            </button>
          )}

          <button
            onClick={() => setIsQuestionBankModalOpen(true)}
            className="p-1.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white border border-[#30363D] transition cursor-pointer"
            title="Xem ngân hàng câu hỏi"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          </button>

          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white border border-[#30363D] transition cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white border border-[#30363D] transition cursor-pointer hidden sm:block"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onExitToMenu && (
            <button
              onClick={onExitToMenu}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================
       * MAIN CONTENT AREA (Single Viewport Fit)
       * ======================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 py-2 sm:py-3 flex flex-col justify-center overflow-hidden">
        {/* ========================================================
         * STAGE 1: CONFIGURATION SCREEN (Single Viewport Fit)
         * ======================================================== */}
        {stage === 'config' && (
          <div className="h-full flex flex-col justify-between py-1 animate-fadeIn">
            {/* Compact Header */}
            <div className="text-center space-y-0.5 shrink-0 mb-1.5">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center justify-center gap-2">
                <span>🚪 Cấu Hình Trò Chơi Ô Cửa Bí Mật</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI Vision & Voice
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Mở các ô cửa để giải câu hỏi Toán học & giải mã bức tranh chủ đề bí mật!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
              {/* Left Column: Lesson Selection */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-3.5 flex flex-col justify-between shadow-xl min-h-0">
                <div className="flex items-center justify-between border-b border-[#30363D] pb-2 mb-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>1. Chọn Bài Học & Bộ Câu Hỏi</span>
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono">{safeLessons.length} bài</span>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 min-h-0 max-h-[320px]">
                  {safeLessons.map((lesson) => {
                    const isSelected = lesson.id === selectedLessonId;
                    const questionCount = lesson.questionBank?.length || 0;
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          setSelectedLessonId(lesson.id);
                          setGameConfig((prev) => ({
                            ...prev,
                            subject: lesson.subject,
                            lessonTitle: lesson.lessonTitle,
                            questionPoolIds: (lesson.questionBank || []).map((q) => q.id),
                          }));
                        }}
                        className={`p-2.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30 text-white'
                            : 'bg-[#21262D] border-[#30363D] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {lesson.subject} • Lớp {lesson.grade}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {questionCount} câu
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">
                          {lesson.lessonTitle}
                        </h4>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Middle Column: Secret Mystery Theme & Door Settings */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-3.5 flex flex-col justify-between shadow-xl min-h-0">
                <div className="flex items-center justify-between border-b border-[#30363D] pb-2 mb-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. Chủ Đề Mật Mã Bí Ẩn</span>
                  </h3>
                  <span className="text-[10px] text-amber-300 font-bold">Bức Tranh Lớn</span>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 min-h-0 max-h-[320px]">
                  {MysteryDoorsService.MYSTERY_THEMES.map((theme) => {
                    const isSelected = theme.id === selectedThemePreset.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          setSelectedThemePreset(theme);
                          setGameConfig((prev) => ({
                            ...prev,
                            themePresetId: theme.id,
                            secretKeyword: theme.secretKeyword,
                            secretClue: theme.clue,
                          }));
                        }}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600/20 border-amber-500 ring-2 ring-amber-500/30 text-white'
                            : 'bg-[#21262D] border-[#30363D] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{theme.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-amber-300">{theme.secretKeyword}</h4>
                            <p className="text-[10px] text-gray-300 line-clamp-1">{theme.themeTitle}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Mode, Door Count & Start */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-3.5 flex flex-col justify-between shadow-xl min-h-0">
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#30363D] pb-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3. Chế Độ & Thiết Lập</span>
                  </h3>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setGameConfig((prev) => ({
                          ...prev,
                          competitionMode: 'individual',
                          playerNames: ['Học sinh 1', 'Học sinh 2'],
                        }))
                      }
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        gameConfig.competitionMode === 'individual'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-[#21262D] border-[#30363D] text-gray-300 hover:text-white'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>Cá Nhân (1-4)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setGameConfig((prev) => ({
                          ...prev,
                          competitionMode: 'team',
                          playerNames: ['Đội Rồng Lửa', 'Đội Đại Bàng Xanh'],
                        }))
                      }
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        gameConfig.competitionMode === 'team'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-[#21262D] border-[#30363D] text-gray-300 hover:text-white'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>Đồng Đội</span>
                    </button>
                  </div>

                  {/* Door Count Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-300 shrink-0">Số ô cửa:</span>
                    <div className="grid grid-cols-4 gap-1.5 flex-1">
                      {[4, 6, 8, 12].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGameConfig((prev) => ({ ...prev, doorCount: num }))}
                          className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition cursor-pointer text-center ${
                            gameConfig.doorCount === num
                              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                              : 'bg-[#21262D] border-[#30363D] text-gray-300 hover:text-white'
                          }`}
                        >
                          {num} Ô
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGameConfig((prev) => ({ ...prev, purpose: 'warm-up', timeLimitPerQuestion: 15 }))}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        gameConfig.purpose === 'warm-up'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-[#21262D] border-[#30363D] text-gray-400'
                      }`}
                    >
                      ⚡ Khởi Động (15s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGameConfig((prev) => ({ ...prev, purpose: 'practice', timeLimitPerQuestion: 25 }))}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        gameConfig.purpose === 'practice'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-[#21262D] border-[#30363D] text-gray-400'
                      }`}
                    >
                      🎯 Luyện Tập (25s)
                    </button>
                  </div>

                  {/* Input Mode Selector in Setup */}
                  <div className="pt-0.5">
                    <GameInputSelector
                      currentMode={inputMode}
                      onModeChange={setInputMode}
                      allowedModes={['camera', 'voice', 'manual']}
                      playerCount={1}
                      onTurnOffCamera={() => setInputMode('manual')}
                    />
                  </div>
                </div>

                {/* Start Button */}
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition cursor-pointer mt-2"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>BẮT ĐẦU MỞ Ô CỬA BÍ MẬT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
         * STAGE 2: PLAYING (DOORS MATRIX BOARD) - 100% Single Screen
         * ======================================================== */}
        {(stage === 'playing' || stage === 'door_active' || stage === 'door_result') && (
          <div className="h-full flex flex-col justify-between py-1 space-y-2 animate-fadeIn">
            {/* Top Game Bar: Player Turn & Secret Puzzle Progress */}
            {isTopBarVisible ? (
              <div className="relative bg-[#161B22] border border-[#30363D] rounded-2xl p-2 sm:p-2.5 shadow-lg shrink-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-center pr-7">
                  {/* Active Player Card */}
                  <div className="bg-[#0A0E17] border border-[#30363D] rounded-xl p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md text-xs"
                        style={{ backgroundColor: players[activePlayerIndex]?.avatarColor || '#3B82F6' }}
                      >
                        {activePlayerIndex + 1}
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                          LƯỢT THI ĐẤU
                        </span>
                        <h3 className="text-xs font-extrabold text-white leading-none">
                          {players[activePlayerIndex]?.name || 'Học sinh'}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 font-mono">ĐIỂM SỐ</span>
                      <div className="text-sm sm:text-base font-black text-amber-400 font-mono leading-none">
                        {players[activePlayerIndex]?.score || 0} đ
                      </div>
                    </div>
                  </div>

                  {/* Secret Clue Progress Banner */}
                  <div className="bg-gradient-to-r from-purple-900/40 via-[#0A0E17] to-amber-900/40 border border-purple-500/30 rounded-xl p-2 flex items-center justify-between">
                    <div className="space-y-0.5 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          MẢNH GHÉP: {openedDoorsCount}/{doors.length}
                        </span>
                        {isSecretThemeSolved && (
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> ĐÃ GIẢI
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {isSecretThemeSolved ? selectedThemePreset.secretKeyword : selectedThemePreset.themeTitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSecretGuessModalOpen(true)}
                      className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-[11px] shadow-sm transition cursor-pointer shrink-0"
                    >
                      🔍 Đoán
                    </button>
                  </div>

                  {/* Input Mode Switcher */}
                  <div className="bg-[#0A0E17] border border-[#30363D] rounded-xl p-1">
                    <GameInputSelector
                      currentMode={inputMode}
                      onModeChange={setInputMode}
                      allowedModes={['camera', 'voice', 'manual']}
                      playerCount={1}
                      onTurnOffCamera={() => setInputMode('manual')}
                    />
                  </div>
                </div>

                {/* Close X Button to hide Top Bar */}
                <button
                  type="button"
                  onClick={() => setIsTopBarVisible(false)}
                  title="Ẩn thanh thông tin để mở rộng màn hình chơi"
                  className="absolute top-2 right-2 p-1 rounded-lg bg-[#21262D] hover:bg-rose-500/20 hover:border-rose-500/40 border border-[#30363D] text-gray-400 hover:text-rose-300 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Compact Floating Pill to Restore Top Bar */
              <div className="flex items-center justify-between bg-[#161B22]/90 border border-[#30363D] rounded-xl px-3 py-1.5 text-xs backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Lượt: {players[activePlayerIndex]?.name || 'Học sinh'} ({players[activePlayerIndex]?.score || 0} đ)
                  </span>
                  <span className="text-gray-600 hidden sm:inline">•</span>
                  <span className="text-purple-300 hidden sm:inline">
                    Mảnh ghép: {openedDoorsCount}/{doors.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsSecretGuessModalOpen(true)}
                    className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition cursor-pointer"
                  >
                    🔍 Đoán mật mã
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTopBarVisible(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-[10px] font-bold transition cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Hiện thông tin</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
             * DOORS MATRIX GRID (Fits neatly in single screen)
             * ======================================================== */}
            {stage === 'playing' && (
              <div className="flex-1 flex flex-col justify-center space-y-1.5 py-1 min-h-0">
                <div className="text-center">
                  <p className="text-[11px] text-gray-400 font-medium">
                    👉 Hãy chọn một ô cửa bất kỳ để mở khóa thử thách & nhận quà bí mật!
                  </p>
                </div>

                <div
                  className={`grid gap-2.5 sm:gap-3 w-full mx-auto ${
                    doors.length <= 4
                      ? 'grid-cols-2 max-w-xl'
                      : doors.length <= 6
                      ? 'grid-cols-3 max-w-3xl'
                      : doors.length <= 8
                      ? 'grid-cols-4 max-w-4xl'
                      : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 max-w-6xl'
                  }`}
                >
                  {doors.map((door) => {
                    const isCompleted = door.isCompleted;
                    return (
                      <div
                        key={door.id}
                        onClick={() => !isCompleted && handlePickDoor(door)}
                        className={`relative rounded-2xl p-2.5 sm:p-3 transition-all duration-200 flex flex-col items-center justify-between text-center h-[105px] sm:h-[120px] md:h-[130px] border shadow-lg ${
                          isCompleted
                            ? door.isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 opacity-90'
                              : 'bg-rose-950/40 border-rose-500/40 text-rose-300 opacity-90'
                            : 'bg-gradient-to-b from-[#1c2333] via-[#161B22] to-[#0d1117] border-[#384252] hover:border-amber-400 hover:shadow-amber-500/20 hover:-translate-y-1 cursor-pointer group'
                        }`}
                      >
                        {/* Door Header Number */}
                        <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-gray-400">
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0A0E17] border border-[#30363D]">
                            #{door.number}
                          </span>
                          {isCompleted ? (
                            door.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )
                          ) : (
                            <KeyRound className="w-3.5 h-3.5 text-amber-400/70 group-hover:text-amber-400 transition" />
                          )}
                        </div>

                        {/* Center Visual Door Graphic */}
                        <div className="my-0.5 flex flex-col items-center">
                          {isCompleted ? (
                            <div className="space-y-0.5">
                              <span className="text-2xl sm:text-3xl">
                                {door.isCorrect ? '🔓' : '🔒'}
                              </span>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-300 line-clamp-1">
                                {door.solvedByPlayerName}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200 block">
                                {door.icon}
                              </span>
                              <span className="text-[11px] font-black text-white group-hover:text-amber-300 transition line-clamp-1">
                                {door.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Door Bottom Surprise Teaser / Status */}
                        <div className="w-full text-center">
                          {isCompleted ? (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                door.isCorrect
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {door.isCorrect ? '+ Đã Mở' : 'Chưa Mở'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full group-hover:bg-amber-500/20 transition">
                              ✨ Mở Ô
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================
             * STAGE 2.1: ACTIVE DOOR QUESTION SOLVING SCREEN (Single Viewport Fit & Large Classroom Visibility)
             * ======================================================== */}
            {(stage === 'door_active' || stage === 'door_result') && activeDoor && activeQuestion && (
              <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-start min-h-0 space-y-3 animate-fadeIn">
                {/* Main Bento Arena Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start flex-1 min-h-0">
                  {/* Left Column: Door Info + Question + 4 Big Options */}
                  <div
                    className={`${
                      (inputMode === 'camera' && isCameraInQuestionVisible) ||
                      (inputMode === 'voice' && isVoiceInQuestionVisible)
                        ? 'lg:col-span-7'
                        : 'lg:col-span-12'
                    } space-y-3.5 transition-all duration-300 flex flex-col justify-start`}
                  >
                    {/* Door Surprise Announcement & Timer Banner */}
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20 border-2 border-amber-500/40 shadow-xl shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0A0E17] border-2 border-amber-400 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
                          {activeDoor.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wide">
                              {activeDoor.label}
                            </span>
                            <span className="text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-xl bg-amber-400 text-slate-950 shadow-md">
                              {activeDoor.surpriseTitle}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-300 font-semibold line-clamp-1">
                            {activeDoor.surpriseDescription}
                          </p>
                        </div>
                      </div>

                      {/* Timer Display */}
                      <div className="flex items-center gap-2 bg-[#0A0E17] px-3.5 py-1.5 rounded-2xl border-2 border-[#30363D] shadow-inner">
                        <Clock
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            timeLeft <= 5 ? 'text-rose-400 animate-bounce' : 'text-amber-400'
                          }`}
                        />
                        <span
                          className={`text-base sm:text-xl font-mono font-black ${
                            timeLeft <= 5 ? 'text-rose-400' : 'text-amber-300'
                          }`}
                        >
                          {timeLeft}s
                        </span>
                      </div>
                    </div>

                    {/* Bento Question Box - Extra Large & Prominent */}
                    <div className="bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-2">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500" />
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-400 font-mono">
                        <span className="text-blue-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> CÂU HỎI THỬ THÁCH
                        </span>
                        <span className="font-bold text-gray-300 flex items-center gap-1.5 bg-[#21262D] px-3 py-1 rounded-xl border border-[#30363D]">
                          {inputMode === 'camera'
                            ? 'Giơ 1, 2, 3, 4 ngón tay'
                            : inputMode === 'voice'
                            ? 'Đọc to chữ A, B, C, D'
                            : 'Click chuột hoặc phím 1..4'}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight pt-1">
                        <MathRenderer
                          text={
                            activeQuestion.content ||
                            (activeQuestion as any).question ||
                            (activeQuestion as any).questionText ||
                            'Câu hỏi thử thách'
                          }
                        />
                      </h2>

                      {/* Diagrams and Data Tables */}
                      {(activeQuestion.diagram || activeQuestion.tableData) && (
                        <div className="mt-3 flex justify-center">
                          <MathDiagramView diagram={activeQuestion.diagram} tableData={activeQuestion.tableData} />
                        </div>
                      )}

                      {(activeQuestion as any).imageUrl && (
                        <div className="flex justify-center p-2 bg-[#0A0E17] rounded-2xl border border-[#30363D] mt-2">
                          <img
                            src={(activeQuestion as any).imageUrl}
                            alt="Question visual"
                            className="max-h-40 rounded-xl object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* 4 Option Bento Cards - Extra Large Text & High Visibility */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {activeQuestion.options.map((opt) => {
                        const isSelected = selectedOption === opt.key;
                        const isCorrectAnswer = QuizScoringService.evaluateIndividualAnswer(
                          opt.key,
                          activeQuestion.correctAnswer,
                          activeQuestion.options
                        );
                        const isResultMode = stage === 'door_result';

                        const optionStyles: Record<
                          QuizOptionKeyEnum,
                          {
                            icon: string;
                            count: string;
                            keyNum: string;
                            badgeColor: string;
                            borderHover: string;
                          }
                        > = {
                          [QuizOptionKeyEnum.A]: {
                            icon: '☝️',
                            count: '1 Ngón',
                            keyNum: '1',
                            badgeColor: 'bg-blue-500/25 border-blue-400 text-blue-300',
                            borderHover: 'hover:border-blue-400',
                          },
                          [QuizOptionKeyEnum.B]: {
                            icon: '✌️',
                            count: '2 Ngón',
                            keyNum: '2',
                            badgeColor: 'bg-emerald-500/25 border-emerald-400 text-emerald-300',
                            borderHover: 'hover:border-emerald-400',
                          },
                          [QuizOptionKeyEnum.C]: {
                            icon: '🤟',
                            count: '3 Ngón',
                            keyNum: '3',
                            badgeColor: 'bg-amber-500/25 border-amber-400 text-amber-300',
                            borderHover: 'hover:border-amber-400',
                          },
                          [QuizOptionKeyEnum.D]: {
                            icon: '🖐',
                            count: '4 Ngón',
                            keyNum: '4',
                            badgeColor: 'bg-purple-500/25 border-purple-400 text-purple-300',
                            borderHover: 'hover:border-purple-400',
                          },
                        };

                        const style = optionStyles[opt.key];

                        let cardStyle = `bg-[#21262D] border-2 sm:border-3 border-[#30363D] ${style.borderHover} hover:bg-[#282e38] text-white`;

                        if (isResultMode) {
                          if (isCorrectAnswer) {
                            cardStyle = 'bg-emerald-950/70 border-3 border-emerald-400 text-emerald-100 ring-4 ring-emerald-500/40 shadow-emerald-500/20';
                          } else if (isSelected && !isCorrectAnswer) {
                            cardStyle = 'bg-rose-950/70 border-3 border-rose-400 text-rose-200 ring-4 ring-rose-500/40 opacity-80';
                          } else {
                            cardStyle = 'bg-[#161B22] border-2 border-[#30363D] text-gray-500 opacity-50';
                          }
                        } else if (isSelected) {
                          cardStyle = 'bg-blue-950/70 border-3 border-blue-400 text-white ring-4 ring-blue-500/40 shadow-blue-500/20';
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={isResultMode}
                            onClick={() => handleSelectOption(opt.key)}
                            className={`p-5 sm:p-6 lg:p-7 rounded-3xl flex flex-col justify-between transition-all group shadow-xl space-y-3.5 text-left cursor-pointer hover:scale-[1.015] active:scale-[0.985] min-h-[120px] sm:min-h-[140px] md:min-h-[160px] ${cardStyle}`}
                            title={`Chọn đáp án ${opt.key} (Phím [${style.keyNum}] hoặc [${opt.key}])`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center font-mono font-black text-2xl sm:text-3xl md:text-4xl shadow-md group-hover:scale-105 transition shrink-0 ${style.badgeColor}`}
                                >
                                  {opt.key}
                                </div>
                                <span className="text-xs sm:text-sm font-extrabold text-gray-200 bg-[#161B22] px-3 py-1.5 rounded-xl border border-[#30363D] flex items-center gap-1.5 shadow-sm">
                                  <span>{style.icon}</span>
                                  <span>{style.count}</span>
                                  <span className="text-blue-400 font-mono font-black text-xs sm:text-sm ml-1 border-l border-[#30363D] pl-1.5">
                                    [{style.keyNum}]
                                  </span>
                                </span>
                              </div>
                              <span className="text-xs font-bold text-gray-400 opacity-70 group-hover:opacity-100 transition flex items-center gap-1 font-mono bg-[#161B22]/80 px-2.5 py-1 rounded-lg border border-[#30363D]">
                                <MousePointer className="w-3.5 h-3.5 text-blue-400" /> Click
                              </span>
                            </div>
                            <div className="pt-1">
                              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm break-words">
                                <MathRenderer text={opt.text} />
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Result Explanation & Continue CTA Banner */}
                    {stage === 'door_result' && (
                      <div className="p-5 sm:p-7 rounded-3xl bg-[#0A0E17] border-2 border-[#30363D] space-y-4 animate-fadeIn shadow-2xl shrink-0">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {lastAnswerCorrect ? (
                              <CheckCircle2 className="w-9 h-9 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-9 h-9 text-rose-400 shrink-0" />
                            )}
                            <div>
                              <div className="text-lg sm:text-2xl font-black text-white">
                                {lastAnswerCorrect
                                  ? `🎉 CHÍNH XÁC! +${lastPointsGained?.total ?? 10} Điểm Thưởng!`
                                  : `❌ CHƯA ĐÚNG! Đáp án chính xác là: ${activeQuestion.correctAnswer}`}
                              </div>
                              {activeQuestion.explanation && (
                                <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1">
                                  <strong className="text-amber-400">Giải thích:</strong> {activeQuestion.explanation}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleNextTurn}
                            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg shadow-xl shadow-blue-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                          >
                            <span>Tiếp Tục ➔</span>
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Camera AI / Voice Recognition Side Panel HUD */}
                  {inputMode === 'camera' && (
                    isCameraInQuestionVisible ? (
                      <div className="lg:col-span-5 space-y-2.5 animate-fadeIn flex flex-col justify-start">
                        <div className="p-3 bg-[#161B22] border-2 border-[#30363D] rounded-3xl space-y-2 shadow-2xl relative">
                          <div className="flex items-center justify-between text-xs font-bold text-gray-300 pr-7">
                            <span className="flex items-center gap-1.5 text-blue-400 font-mono uppercase tracking-wider">
                              <Sparkles className="w-4 h-4" />
                              AI Camera Vision HUD
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                              <span className="px-1.5 py-0.5 bg-[#0A0E17] rounded border border-[#30363D]">1=A</span>
                              <span className="px-1.5 py-0.5 bg-[#0A0E17] rounded border border-[#30363D]">2=B</span>
                              <span className="px-1.5 py-0.5 bg-[#0A0E17] rounded border border-[#30363D]">3=C</span>
                              <span className="px-1.5 py-0.5 bg-[#0A0E17] rounded border border-[#30363D]">4=D</span>
                            </div>
                          </div>

                          {/* Close X button to hide camera box */}
                          <button
                            type="button"
                            onClick={() => setIsCameraInQuestionVisible(false)}
                            title="Ẩn khung Camera để mở rộng toàn màn hình câu hỏi"
                            className="absolute top-3 right-3 p-1.5 rounded-xl bg-[#21262D] hover:bg-rose-500/20 border border-[#30363D] text-gray-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="w-full">
                            <CameraGestureOverlay
                              videoRef={videoRef}
                              canvasRef={canvasRef}
                              mediaStream={mediaStream}
                              isCameraActive={isCameraActive}
                              isLoadingModel={isLoadingModel}
                              cameraError={cameraError}
                              zoneCount={1}
                              zoneDetections={zoneDetections}
                              onManualTrigger={(zIdx, opt) => {
                                manualTriggerZoneAnswer?.(zIdx, opt);
                                handleSelectOption(opt);
                              }}
                              onRetryCamera={retryCamera}
                              onTurnOffCamera={() => setInputMode('manual')}
                              availableCameras={availableCameras}
                              activeDeviceId={activeDeviceId}
                              onSelectCamera={setActiveDeviceId}
                              playerLabels={[players[activePlayerIndex]?.name || 'Người chơi']}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Restore Camera Pill Button */
                      <div className="lg:col-span-12 flex items-center justify-between bg-[#161B22] border border-[#30363D] rounded-2xl px-4 py-2 text-xs shrink-0 shadow-md">
                        <span className="text-gray-400 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Camera AI đang quét cử chỉ ngầm (1, 2, 3, 4 ngón tay)
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCameraInQuestionVisible(true)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mở lại khung Camera AI</span>
                        </button>
                      </div>
                    )
                  )}

                  {/* Voice Recognition Assistant if Voice Mode */}
                  {inputMode === 'voice' && (
                    isVoiceInQuestionVisible ? (
                      <div className="lg:col-span-5 space-y-2.5 animate-fadeIn flex flex-col justify-start">
                        <div className="relative bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-4 shadow-2xl">
                          <div className="absolute top-3 right-3 z-10">
                            <button
                              type="button"
                              onClick={() => setIsVoiceInQuestionVisible(false)}
                              title="Ẩn khung nhận diện giọng nói"
                              className="p-1.5 rounded-xl bg-[#21262D] hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 border border-[#30363D] transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <VoiceRecognitionOverlay
                            isActive={stage === 'door_active' && selectedOption === null}
                            isLocked={selectedOption !== null}
                            lockedOption={selectedOption}
                            onOptionRecognized={(opt) => {
                              if (stageRef.current === 'door_active' && selectedOptionRef.current === null) {
                                handleSelectOption(opt);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="lg:col-span-12 flex items-center justify-between bg-[#161B22] border border-[#30363D] rounded-2xl px-4 py-2 text-xs shrink-0 shadow-md">
                        <span className="text-gray-400 font-medium">🎙️ Nhận diện giọng nói đang lắng nghe (Đọc to A, B, C, D)</span>
                        <button
                          type="button"
                          onClick={() => setIsVoiceInQuestionVisible(true)}
                          className="px-3 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition cursor-pointer"
                        >
                          Mở lại khung giọng nói
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
         * STAGE 3: FINISHED / VICTORY PODIUM SCREEN
         * ======================================================== */}
        {stage === 'finished' && (
          <div className="max-w-4xl mx-auto w-full bg-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn text-center">
            <div className="inline-flex p-4 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-lg">
              <Trophy className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Hoàn Thành Trò Chơi Ô Cửa Bí Mật!
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Chúc mừng tất cả các bạn học sinh đã xuất sắc giải mã các ô cửa và tìm ra bức tranh chủ đề bí mật!
              </p>
            </div>

            {/* Secret Theme Reveal Announcement */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-blue-900/50 border border-purple-500/40 text-left space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  MẬT MÃ BÍ ẨN TOÀN CẢNH ĐÃ ĐƯỢC GIẢI MÃ
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                {selectedThemePreset.secretKeyword} — {selectedThemePreset.themeTitle}
              </h3>
              <p className="text-xs text-gray-300 italic">
                "{selectedThemePreset.clue}"
              </p>
            </div>

            {/* Podium Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
              {sortedPlayers.map((player, rank) => {
                const medals = ['🥇 QUÁN QUÂN', '🥈 Á QUÂN', '🥉 HẠNG BA'];
                return (
                  <div
                    key={player.id}
                    className={`p-5 rounded-2xl border flex flex-col items-center justify-between space-y-3 ${
                      rank === 0
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-[#21262D] border-[#30363D]'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono text-amber-400">
                      {medals[rank] || `#${rank + 1}`}
                    </span>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-md"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.name[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{player.name}</h4>
                      <p className="text-xs text-gray-400 font-mono">
                        {player.correctCount} đúng / {player.doorsOpened} ô cửa
                      </p>
                    </div>
                    <div className="text-lg font-black text-amber-400 font-mono">
                      {player.score} Điểm
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleReplay}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại Trò Chơi</span>
              </button>

              <button
                type="button"
                onClick={handleResetToConfig}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-white font-bold text-xs sm:text-sm border border-[#30363D] transition cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Cấu Hình Bài Khác</span>
              </button>

              {onExitToMenu && (
                <button
                  type="button"
                  onClick={onExitToMenu}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Quay Về Menu</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
       * SECRET KEYWORD GUESS MODAL
       * ======================================================== */}
      {isSecretGuessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#161B22] border border-[#30363D] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Đoán Bức Tranh Mật Mã Bí Ẩn</h3>
                  <p className="text-xs text-gray-400">Nhận ngay +100 Điểm Thưởng Jackpot!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSecretGuessModalOpen(false);
                  setGuessFeedback(null);
                }}
                className="p-1.5 rounded-lg bg-[#21262D] text-gray-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0A0E17] border border-[#30363D] space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                GỢI Ý TỪ KHÓA:
              </span>
              <p className="text-xs text-gray-300 italic">
                "{selectedThemePreset.clue}"
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">
                Nhập câu trả lời từ khóa mật mã:
              </label>
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Ví dụ: ĐỊNH LÝ PYTAGO..."
                className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] border border-[#30363D] focus:border-amber-400 focus:outline-none text-white text-sm uppercase font-mono font-bold"
              />
            </div>

            {guessFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  guessFeedback.isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-500 text-rose-300'
                }`}
              >
                {guessFeedback.message}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSecretGuessModalOpen(false);
                  setGuessFeedback(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#21262D] text-gray-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCheckSecretKeyword}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-black shadow-md transition cursor-pointer"
              >
                Xác Nhận Đoán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
       * QUESTION BANK MODAL
       * ======================================================== */}
      <QuestionBankModal
        isOpen={isQuestionBankModalOpen}
        onClose={() => setIsQuestionBankModalOpen(false)}
        allLessonQuestions={currentLesson?.questionBank || []}
        selectedPoolIds={gameConfig.questionPoolIds}
        onSavePool={(newIds) => setGameConfig((prev) => ({ ...prev, questionPoolIds: newIds }))}
        lessonTitle={currentLesson?.lessonTitle || ''}
        subject={currentLesson?.subject || 'Toán THCS'}
        minRequired={gameConfig.doorCount}
      />
    </div>
  );
};
