import React, { useState, useEffect, useRef } from 'react';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { CrosswordTile, CrosswordGameConfig } from '../types/GamePlatform';
import { CrosswordService, MathKeywordPreset } from '../services/CrosswordService';
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
  Sparkles,
  Trophy,
  RotateCcw,
  LogOut,
  HelpCircle,
  Clock,
  Layers,
  Award,
  ChevronRight,
  CheckCircle,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  Unlock,
  PartyPopper,
  Edit3,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface CrosswordGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
}

export const CrosswordGame: React.FC<CrosswordGameProps> = ({
  lessons,
  onExitToMenu,
}) => {
  // 1. Configuration State
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons[0]?.id || ''
  );
  const currentLesson =
    lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  const defaultPreset = CrosswordService.MATH_KEYWORDS[0];

  const [gameConfig, setGameConfig] = useState<CrosswordGameConfig>({
    purpose: 'warm-up',
    subject: currentLesson?.subject || 'Toán THCS',
    lessonTitle: currentLesson?.lessonTitle || '',
    questionPoolIds: currentLesson?.questionBank.map((q) => q.id) || [],
    questionsPerRound: 6,
    timeLimitPerQuestion: 20,
    keyword: defaultPreset.keyword,
    keywordClue: defaultPreset.clue,
    pointsPerQuestion: 10,
    bonusForEarlyKeyword: 50,
    playerNames: ['Học sinh THCS'],
  });

  // Input Mode: Camera / Voice / Manual (Default to camera for AI gesture detection)
  const [inputMode, setInputMode] = useState<InputModeType>('camera');

  // Game Lifecycle State
  const [stage, setStage] = useState<
    'config' | 'playing' | 'round-result' | 'keyword-solved'
  >('config');

  // Active Game State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [tiles, setTiles] = useState<CrosswordTile[]>([]);
  const [selectedOption, setSelectedOption] = useState<QuizOptionKeyEnum | null>(null);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [lastRevealedCount, setLastRevealedCount] = useState<number>(0);
  const [isGuessModalOpen, setIsGuessModalOpen] = useState<boolean>(false);
  const [guessInput, setGuessInput] = useState<string>('');
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);
  const [isSolvedEarly, setIsSolvedEarly] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    isActive: inputMode === 'camera' && stage !== 'keyword-solved' && (stage as string) !== 'summary',
    onZoneAnswerLocked: (_zIdx, option) => {
      if (stage === 'playing' && selectedOption === null) {
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
    if (stage === 'playing' && isTimerRunning) {
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

  // Start Crossword Game Handler
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

    const initialTiles = CrosswordService.initCrosswordTiles(gameConfig.keyword);

    setQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    setTiles(initialTiles);
    setSelectedOption(null);
    setScore(0);
    setLastRevealedCount(0);
    setIsSolvedEarly(false);
    setGuessFeedback(null);
    setTimeLeft(gameConfig.timeLimitPerQuestion);
    setIsTimerRunning(true);
    setStage('playing');
  };

  // User submits an answer for the question
  const handleSelectOption = (option: QuizOptionKeyEnum) => {
    if (stage !== 'playing' || selectedOption !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(option);
    setIsTimerRunning(false);

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = QuizScoringService.evaluateIndividualAnswer(
      option,
      currentQ.correctAnswer,
      currentQ.options
    );

    if (isCorrect) {
      soundEffects.playCorrect();
      const { updatedTiles, revealedLettersCount } =
        CrosswordService.revealTilesOnCorrectAnswer(
          tiles,
          currentQuestionIndex,
          questions.length
        );
      setTiles(updatedTiles);
      setLastRevealedCount(revealedLettersCount);
      setScore((s) => s + gameConfig.pointsPerQuestion);

      // Check if all tiles became revealed
      const allRevealed = updatedTiles.every((t) => t.isRevealed);
      if (allRevealed) {
        soundEffects.playVictory();
        setIsSolvedEarly(false);
        setStage('keyword-solved');
        return;
      }
    } else {
      soundEffects.playWrong();
      setLastRevealedCount(0);
    }

    setStage('round-result');
  };

  // Keyboard navigation for quick gameplay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (stage === 'round-result' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleNextQuestion();
      } else if (stage === 'playing' && selectedOption === null) {
        const key = e.key.toUpperCase();
        if (key === '1' || key === 'A') handleSelectOption(QuizOptionKeyEnum.A);
        else if (key === '2' || key === 'B') handleSelectOption(QuizOptionKeyEnum.B);
        else if (key === '3' || key === 'C') handleSelectOption(QuizOptionKeyEnum.C);
        else if (key === '4' || key === 'D') handleSelectOption(QuizOptionKeyEnum.D);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, selectedOption, currentQuestionIndex, questions.length]);

  // Time-up
  const handleTimeUp = () => {
    setIsTimerRunning(false);
    setLastRevealedCount(0);
    setStage('round-result');
  };

  // Guess Keyword early
  const handleGuessKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;

    const isMatch = CrosswordService.checkKeywordGuess(
      guessInput,
      gameConfig.keyword
    );

    if (isMatch) {
      soundEffects.playVictory();
      // Reveal all tiles & grant early bonus points
      const unrevealed = tiles.filter((t) => !t.isRevealed).length;
      const bonus = CrosswordService.calculateEarlyBonus(
        unrevealed,
        tiles.length,
        gameConfig.bonusForEarlyKeyword
      );

      const allOpen = tiles.map((t) => ({ ...t, isRevealed: true }));
      setTiles(allOpen);
      setScore((s) => s + bonus);
      setIsSolvedEarly(true);
      setIsGuessModalOpen(false);
      setIsTimerRunning(false);
      setStage('keyword-solved');
    } else {
      soundEffects.playWrong();
      setGuessFeedback('Chưa chính xác! Hãy tiếp tục trả lời câu hỏi để mở thêm gợi ý.');
    }
  };

  // Next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      // End game
      soundEffects.playVictory();
      setStage('keyword-solved');
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setTimeLeft(gameConfig.timeLimitPerQuestion);
      setIsTimerRunning(true);
      setStage('playing');
      resetZoneStates();
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const revealedTilesCount = tiles.filter((t) => t.isRevealed && t.letter !== ' ').length;
  const totalLettersCount = tiles.filter((t) => t.letter !== ' ').length;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#070B14] text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white"
    >
      {/* Platform Header */}
      <header className="border-b border-[#21262D] bg-[#0E131F]/90 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Ô Chữ Bí Mật Toán Học
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Khám Phá Từ Khóa
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-xs font-bold text-indigo-300 transition"
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
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <KeyRound className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Thiết Lập Ô Chữ Bí Mật
                </h2>
                <p className="text-xs text-gray-400">
                  Chọn từ khóa Toán học bí ẩn và cấu hình số câu hỏi mở ô
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
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.subject} (Lớp {lesson.grade}) - {lesson.lessonTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keyword Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Từ Khóa Toán Học Mẫu</span>
                </label>
                <select
                  onChange={(e) => {
                    const preset = CrosswordService.MATH_KEYWORDS.find(
                      (p) => p.keyword === e.target.value
                    );
                    if (preset) {
                      setGameConfig((prev) => ({
                        ...prev,
                        keyword: preset.keyword,
                        keywordClue: preset.clue,
                      }));
                    }
                  }}
                  value={gameConfig.keyword}
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {CrosswordService.MATH_KEYWORDS.map((k) => (
                    <option key={k.keyword} value={k.keyword}>
                      {k.keyword} ({k.subject} Lớp {k.grade})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Keyword Input */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tùy Chỉnh Từ Khóa & Gợi Ý</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={gameConfig.keyword}
                    onChange={(e) =>
                      setGameConfig((prev) => ({
                        ...prev,
                        keyword: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Ví dụ: ĐỊNH LÝ THALES"
                    className="bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={gameConfig.keywordClue}
                    onChange={(e) =>
                      setGameConfig((prev) => ({
                        ...prev,
                        keywordClue: e.target.value,
                      }))
                    }
                    placeholder="Gợi ý gợi mở cho từ khóa"
                    className="bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Questions per Round */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Số Câu Hỏi Mở Ô</span>
                </label>
                <select
                  value={gameConfig.questionsPerRound}
                  onChange={(e) =>
                    setGameConfig((prev) => ({
                      ...prev,
                      questionsPerRound: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={5}>5 câu hỏi</option>
                  <option value={6}>6 câu hỏi chuẩn</option>
                  <option value={8}>8 câu hỏi</option>
                  <option value={10}>10 câu hỏi</option>
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
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={15}>15 giây</option>
                  <option value={20}>20 giây (Chuẩn)</option>
                  <option value={30}>30 giây (Thư thả)</option>
                </select>
              </div>
            </div>

            {/* Input Mode Selector in Setup */}
            <div className="space-y-3 pt-3 border-t border-[#21262D]">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
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
                    playerLabels={['Người chơi']}
                  />
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <span>Bắt Đầu Giải Mã Ô Chữ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= PLAYING & ROUND-RESULT STAGE ================= */}
        {(stage === 'playing' || stage === 'round-result') && currentQ && (
          <div className="space-y-5">
            {/* 1. Crossword Matrix Grid */}
            <div className="bg-[#111622] border border-[#21262D] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Bảng Ô Chữ Bí Mật ({revealedTilesCount}/{totalLettersCount} chữ cái)
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                    Điểm: {score} đ
                  </div>
                  {/* Guess Keyword Early Button */}
                  <button
                    onClick={() => {
                      setGuessFeedback(null);
                      setGuessInput('');
                      setIsGuessModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Đoán Từ Khóa Ngay (+50đ)</span>
                  </button>
                </div>
              </div>

              {/* Crossword Letters Grid */}
              <div className="flex flex-wrap items-center justify-center gap-2 py-4 bg-[#0A0E17] rounded-2xl p-4 border border-[#30363D]">
                {tiles.map((tile, idx) => {
                  if (tile.letter === ' ') {
                    return <div key={idx} className="w-4 sm:w-6" />;
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-9 h-11 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center font-black text-base sm:text-xl transition-all duration-500 shadow-md ${
                        tile.isRevealed
                          ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border-indigo-400 scale-105 shadow-indigo-500/30'
                          : 'bg-[#161B22] text-transparent border-[#30363D] hover:border-gray-500'
                      }`}
                    >
                      {tile.isRevealed ? tile.letter : '?'}
                    </div>
                  );
                })}
              </div>

              {/* Clue Box */}
              <div className="text-xs text-gray-400 bg-[#0A0E17] p-3 rounded-xl border border-[#30363D] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Gợi ý từ khóa:</strong> {gameConfig.keywordClue}
                </span>
              </div>
            </div>

            {/* Input Mode Selector */}
            <GameInputSelector
              currentMode={inputMode}
              onModeChange={setInputMode}
              allowedModes={['camera', 'voice', 'manual']}
              playerCount={1}
              onTurnOffCamera={() => setInputMode('manual')}
            />

            {/* Active Input Overlay */}
            {inputMode === 'camera' && (
              <div className="animate-fadeIn">
                <CameraGestureOverlay
                  videoRef={videoRef}
                  canvasRef={canvasRef}
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
                  playerLabels={['Học sinh']}
                />
              </div>
            )}

            {inputMode === 'voice' && (
              <div className="animate-fadeIn">
                <VoiceRecognitionOverlay
                  isActive={stage === 'playing'}
                  isLocked={selectedOption !== null}
                  lockedOption={selectedOption}
                  onOptionRecognized={(opt) => {
                    if (stage === 'playing' && selectedOption === null) {
                      handleSelectOption(opt);
                    }
                  }}
                />
              </div>
            )}

            {/* 2. Active Question Box */}
            <div className="bg-[#111622] border border-[#21262D] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                  Câu hỏi mở ô {currentQuestionIndex + 1} / {questions.length}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}s</span>
                </div>
              </div>

              {/* Question */}
              <div className="bg-[#0A0E17] p-5 sm:p-6 rounded-2xl border border-[#30363D] shadow-inner">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                  Nội dung câu hỏi mở ô:
                </span>
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed tracking-tight">
                  <MathRenderer text={currentQ?.content || (currentQ as any)?.question || ''} isLarge />
                </div>
                {/* Diagrams and Data Tables */}
                {(currentQ?.diagram || currentQ?.tableData) && (
                  <div className="mt-3 flex justify-center">
                    <MathDiagramView diagram={currentQ.diagram} tableData={currentQ.tableData} />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOption === opt.key;
                  const isCorrect = opt.key === currentQ.correctAnswer;
                  const showResult = stage === 'round-result';

                  let style =
                    'bg-[#0A0E17] border-[#30363D] text-gray-200 hover:border-indigo-500 hover:bg-[#161B22]';
                  let keyBadge = 'bg-[#21262D] text-indigo-400 border-[#30363D]';

                  if (showResult) {
                    if (isCorrect) {
                      style =
                        'bg-emerald-950/60 border-emerald-400 text-emerald-200 font-black shadow-lg shadow-emerald-500/20';
                      keyBadge = 'bg-emerald-500 text-slate-950 border-emerald-300';
                    } else if (isSelected && !isCorrect) {
                      style = 'bg-rose-950/60 border-rose-500 text-rose-300 line-through opacity-80';
                      keyBadge = 'bg-rose-500 text-white border-rose-300';
                    } else {
                      style = 'bg-[#0A0E17]/50 border-[#21262D] text-gray-500 opacity-40';
                      keyBadge = 'bg-[#161B22] text-gray-500 border-[#21262D]';
                    }
                  } else if (isSelected) {
                    style = 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-lg shadow-indigo-600/30';
                    keyBadge = 'bg-white text-indigo-700 border-white';
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={stage !== 'playing' || selectedOption !== null}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`p-4 sm:p-5 rounded-2xl border text-left transition flex items-center gap-3.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${style}`}
                    >
                      <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-mono font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 border shadow-sm ${keyBadge}`}>
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

              {/* Round result feedback */}
              {stage === 'round-result' && (
                <div className="pt-4 border-t border-[#21262D] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0E17] p-4 sm:p-5 rounded-2xl border border-[#30363D]">
                  <div className="text-sm sm:text-base space-y-1.5 flex-1">
                    {lastRevealedCount > 0 ? (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-2 text-base sm:text-lg">
                        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                        Chính xác! Đã mở thêm {lastRevealedCount} ô chữ cái (+10đ).
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold text-base sm:text-lg">
                        Chưa chính xác! Đáp án đúng là [<strong className="text-white underline">{currentQ.correctAnswer}</strong>].
                      </span>
                    )}
                    {currentQ.explanation && (
                      <div className="text-xs sm:text-sm text-gray-300 bg-[#161B22] p-2.5 rounded-xl border border-[#30363D]">
                        <strong className="text-amber-400">Giải thích:</strong> {currentQ.explanation}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-600/25 hover:scale-105 transition flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex + 1 >= questions.length
                        ? 'Xem Kết Quả Ô Chữ 🏆'
                        : 'Câu Mở Ô Tiếp Theo 🧩'}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= KEYWORD SOLVED / END STAGE ================= */}
        {stage === 'keyword-solved' && (
          <div className="max-w-5xl mx-auto w-full bg-[#111622] border border-[#21262D] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-bounce">
              <PartyPopper className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isSolvedEarly
                    ? '🎉 Xuất Sắc! Đoán Đúng Từ Khóa Sớm'
                    : 'Hoàn Thành Trò Chơi Ô Chữ'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                TỪ KHÓA BÍ MẬT: {gameConfig.keyword}
              </h2>
            </div>

            {/* Fully Revealed Tiles */}
            <div className="flex flex-wrap items-center justify-center gap-2 py-4 bg-[#0A0E17] rounded-2xl p-4 border border-[#30363D]">
              {tiles.map((tile, idx) => {
                if (tile.letter === ' ') {
                  return <div key={idx} className="w-4 sm:w-6" />;
                }
                return (
                  <div
                    key={idx}
                    className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border-indigo-400 flex items-center justify-center font-black text-lg sm:text-xl shadow-lg shadow-indigo-500/30"
                  >
                    {tile.letter}
                  </div>
                );
              })}
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#0A0E17] border border-[#30363D]">
                <div className="text-xs text-gray-400">Số Ô Đã Mở</div>
                <div className="text-xl font-bold font-mono text-indigo-400">
                  {revealedTilesCount} / {totalLettersCount}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#0A0E17] border border-[#30363D]">
                <div className="text-xs text-gray-400">Điểm Thưởng Đoán Sớm</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {isSolvedEarly ? `+${gameConfig.bonusForEarlyKeyword}` : '0'} đ
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#0A0E17] border border-amber-500/40">
                <div className="text-xs text-gray-400">Tổng Điểm Trò Chơi</div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {score} đ
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleStartGame}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Chơi Lại Ô Chữ Mới</span>
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

        {/* ================= GUESS KEYWORD MODAL ================= */}
        {isGuessModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#111622] border border-[#30363D] rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span>Đoán Từ Khóa Bí Mật</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuessModalOpen(false)}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  Đóng ✕
                </button>
              </div>

              <p className="text-xs text-gray-400">
                Gợi ý: <span className="text-indigo-300">{gameConfig.keywordClue}</span>
              </p>

              <form onSubmit={handleGuessKeyword} className="space-y-3">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Nhập từ khóa suy luận..."
                  autoFocus
                  className="w-full bg-[#0A0E17] border border-[#30363D] rounded-xl px-3.5 py-2.5 text-sm text-white font-bold uppercase tracking-wider focus:outline-none focus:border-amber-500"
                />

                {guessFeedback && (
                  <div className="text-xs text-rose-400 font-medium">
                    {guessFeedback}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGuessModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#161B22] border border-[#30363D] text-xs font-semibold text-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20"
                  >
                    Xác Nhận Đoán 🔔
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
