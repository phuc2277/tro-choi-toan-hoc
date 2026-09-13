import React, { useState, useEffect, useRef } from 'react';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import {
  MillionaireConfig,
  MillionaireLifelines,
  AudienceVoteResult,
  ExpertAdvice,
} from '../types/GamePlatform';
import { QuestionSelectionService } from '../services/QuestionSelectionService';
import {
  MillionaireService,
  DEFAULT_PRIZE_LADDER,
  SAFETY_CHECKPOINTS,
} from '../services/MillionaireService';
import { QuizScoringService } from '../services/QuizScoringService';
import { QuestionBankModal } from './QuestionBankModal';
import { CameraGestureOverlay } from './CameraGestureOverlay';
import { VoiceRecognitionOverlay } from './VoiceRecognitionOverlay';
import { GameInputSelector, InputModeType } from './GameInputSelector';
import { MathRenderer } from './MathRenderer';
import { MathDiagramView } from './MathDiagramView';
import { soundEffects } from '../services/SoundEffects';
import { useMediaPipeHands } from '../gesture-quiz/hooks/useMediaPipeHands';
import {
  Trophy,
  Play,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  PhoneCall,
  Users,
  Maximize2,
  Minimize2,
  LogOut,
  Settings,
  ArrowRight,
  BookOpen,
  Sparkles,
  Award,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface MillionaireGameProps {
  lessons: LessonUnit[];
  onExitToMenu?: () => void;
}

export const MillionaireGame: React.FC<MillionaireGameProps> = ({ lessons, onExitToMenu }) => {
  // 1. Lesson & Config
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const currentLesson = lessons[selectedLessonIndex] || lessons[0];

  const [config, setConfig] = useState<MillionaireConfig>({
    purpose: 'practice',
    subject: currentLesson.subject,
    lessonTitle: currentLesson.lessonTitle,
    questionPoolIds: currentLesson.questionBank.map((q) => q.id),
    questionsPerRound: 10,
    timeLimitPerQuestion: 30,
    playerName: 'Học sinh Ưu tú',
    prizeLadder: DEFAULT_PRIZE_LADDER,
  });

  // Input Mode: Camera / Voice / Manual (Default to camera for AI gesture detection)
  const [inputMode, setInputMode] = useState<InputModeType>('camera');

  // Game Lifecycle State
  const [gameState, setGameState] = useState<
    'configuring' | 'ready' | 'playing' | 'question_result' | 'game_over' | 'victory'
  >('configuring');

  // Question Pool Modal
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState<boolean>(false);

  // Active Questions & Progression
  const [roundQuestions, setRoundQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [recentHistoryIds, setRecentHistoryIds] = useState<string[]>([]);

  // Lifelines
  const [lifelines, setLifelines] = useState<MillionaireLifelines>({
    fiftyFiftyUsed: false,
    askAudienceUsed: false,
    callExpertUsed: false,
  });
  const [hiddenOptions, setHiddenOptions] = useState<QuizOptionKeyEnum[]>([]);
  const [audiencePollModal, setAudiencePollModal] = useState<AudienceVoteResult[] | null>(null);
  const [expertAdviceModal, setExpertAdviceModal] = useState<ExpertAdvice | null>(null);

  // Answering & Lock State
  const [selectedAnswer, setSelectedAnswer] = useState<QuizOptionKeyEnum | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showCameraHud, setShowCameraHud] = useState<boolean>(true);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    manualTriggerZoneAnswer,
    retryCamera,
    availableCameras,
    activeDeviceId,
    setActiveDeviceId,
  } = useMediaPipeHands({
    zoneCount: 1,
    isActive: inputMode === 'camera' && gameState !== 'game_over' && gameState !== 'victory',
    onZoneAnswerLocked: (_zIdx, option) => {
      if (gameState === 'playing' && !isAnswerLocked && !hiddenOptions.includes(option)) {
        handleSelectOption(option);
      }
    },
  });

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

  // Start Millionaire game
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

    const { selectedQuestions, updatedHistory } = QuestionSelectionService.selectMillionaireQuestions(
      poolQuestions,
      config.questionsPerRound,
      recentHistoryIds
    );

    setRoundQuestions(selectedQuestions);
    setRecentHistoryIds(updatedHistory);
    setCurrentQuestionIndex(0);

    // Reset lifelines
    setLifelines({
      fiftyFiftyUsed: false,
      askAudienceUsed: false,
      callExpertUsed: false,
    });
    setHiddenOptions([]);
    setAudiencePollModal(null);
    setExpertAdviceModal(null);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setAnswerStatus('idle');

    setGameState('playing');
    setTimeLeft(config.timeLimitPerQuestion);
  };

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !isAnswerLocked) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0 && !isAnswerLocked) {
      // Time up -> Game Over
      setAnswerStatus('wrong');
      setGameState('game_over');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft, isAnswerLocked]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (gameState === 'playing' && !isAnswerLocked) {
        const key = e.key.toUpperCase();
        let chosen: QuizOptionKeyEnum | null = null;
        if (key === '1' || key === 'A') chosen = QuizOptionKeyEnum.A;
        else if (key === '2' || key === 'B') chosen = QuizOptionKeyEnum.B;
        else if (key === '3' || key === 'C') chosen = QuizOptionKeyEnum.C;
        else if (key === '4' || key === 'D') chosen = QuizOptionKeyEnum.D;

        if (chosen && !hiddenOptions.includes(chosen)) {
          e.preventDefault();
          handleSelectOption(chosen);
        }
      } else if (gameState === 'question_result' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isAnswerLocked, hiddenOptions]);

  // Select option & lock in
  const handleSelectOption = (optKey: QuizOptionKeyEnum) => {
    if (gameState !== 'playing' || isAnswerLocked || hiddenOptions.includes(optKey)) return;

    setSelectedAnswer(optKey);
    setIsAnswerLocked(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Dramatic reveal delay (1.5 seconds)
    setTimeout(() => {
      const currentQ = roundQuestions[currentQuestionIndex];
      const isCorrect = optKey === currentQ.correctAnswer;

      if (isCorrect) {
        soundEffects.playCorrect();
        setAnswerStatus('correct');
        setGameState('question_result');
      } else {
        soundEffects.playWrong();
        setAnswerStatus('wrong');
        setGameState('game_over');
      }
    }, 1500);
  };

  // Next Question or Victory
  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= roundQuestions.length) {
      soundEffects.playVictory();
      setGameState('victory');
    } else {
      setCurrentQuestionIndex(nextIdx);
      setSelectedAnswer(null);
      setIsAnswerLocked(false);
      setAnswerStatus('idle');
      setHiddenOptions([]);
      setGameState('playing');
      setTimeLeft(config.timeLimitPerQuestion);
      resetZoneStates();
    }
  };

  // Lifeline 1: 50:50
  const handleUseFiftyFifty = () => {
    if (lifelines.fiftyFiftyUsed || isAnswerLocked || gameState !== 'playing') return;
    const currentQ = roundQuestions[currentQuestionIndex];
    const hideList = MillionaireService.calculateFiftyFifty(currentQ.correctAnswer);
    setHiddenOptions(hideList);
    setLifelines((prev) => ({ ...prev, fiftyFiftyUsed: true }));
  };

  // Lifeline 2: Ask Audience
  const handleUseAskAudience = () => {
    if (lifelines.askAudienceUsed || isAnswerLocked || gameState !== 'playing') return;
    const currentQ = roundQuestions[currentQuestionIndex];
    const poll = MillionaireService.generateAudiencePoll(currentQ.correctAnswer, currentQuestionIndex);
    setAudiencePollModal(poll);
    setLifelines((prev) => ({ ...prev, askAudienceUsed: true }));
  };

  // Lifeline 3: Call Expert
  const handleUseCallExpert = () => {
    if (lifelines.callExpertUsed || isAnswerLocked || gameState !== 'playing') return;
    const currentQ = roundQuestions[currentQuestionIndex];
    const advice = MillionaireService.generateExpertCall(currentQ.correctAnswer, config.playerName);
    setExpertAdviceModal(advice);
    setLifelines((prev) => ({ ...prev, callExpertUsed: true }));
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
  const currentPrize = config.prizeLadder[currentQuestionIndex] || 100;
  const guaranteedPrize = MillionaireService.calculateGuaranteedReward(
    currentQuestionIndex,
    config.prizeLadder
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0A0E17] text-white flex flex-col font-sans select-none overflow-x-hidden"
    >
      {/* Top Header */}
      <header className="border-b border-[#30363D] bg-[#161B22]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  AI LÀ TRIỆU PHÚ
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Toán Học Đỉnh Cao
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

      {/* Main Area */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-stretch justify-start">
        {/* ==================================================== */}
        {/* 1. CONFIGURATION SCREEN                              */}
        {/* ==================================================== */}
        {gameState === 'configuring' && (
          <div className="w-full max-w-4xl mx-auto bg-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                THANG THƯỞNG 15 CÂU HỎI
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Thiết Lập Ai Là Triệu Phú
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                Chinh phục các mốc điểm thưởng quan trọng với 3 quyền trợ giúp trí tuệ!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lesson Selection */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Bài Học THCS:</span>
                </label>
                <select
                  value={selectedLessonIndex}
                  onChange={(e) => handleLessonChange(Number(e.target.value))}
                  className="w-full bg-[#161B22] border border-[#30363D] text-white text-xs rounded-xl p-2.5 focus:border-amber-500 focus:outline-hidden"
                >
                  {lessons.map((les, idx) => (
                    <option key={les.id} value={idx}>
                      Lớp {les.grade} - {les.lessonTitle} ({les.questionBank.length} câu)
                    </option>
                  ))}
                </select>
              </div>

              {/* Player Name */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300">Tên Thí Sinh Trên Ghế Nóng:</label>
                <input
                  type="text"
                  value={config.playerName}
                  onChange={(e) => setConfig((p) => ({ ...p, playerName: e.target.value }))}
                  className="w-full bg-[#161B22] border border-[#30363D] text-white text-xs rounded-xl p-2.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Question Pool / Exam Set Setting */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Bạn chọn đề nào</div>
                  <div className="text-xs text-gray-400">
                    Số câu đã chọn: <span className="font-mono text-emerald-400 font-bold">{config.questionPoolIds.length}</span> / {currentLesson.questionBank.length} câu
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuestionBankOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-600 hover:text-white transition cursor-pointer"
                >
                  Tùy Chọn Đề
                </button>
              </div>

              {/* Number of questions */}
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-gray-300">Số Câu Trong Thang Thưởng:</label>
                <div className="flex gap-2">
                  {[5, 10, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, questionsPerRound: num }))}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                        config.questionsPerRound === num
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-[#161B22] text-gray-400 border-[#30363D]'
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Mode Selector in Setup */}
            <div className="space-y-3 pt-3 border-t border-[#30363D]">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Phương Thức Trả Lời (Thiết Lập Trước Khi Chơi)</span>
              </label>
              <GameInputSelector
                currentMode={inputMode}
                onModeChange={setInputMode}
                allowedModes={['camera', 'voice', 'manual']}
                playerCount={1}
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
                    availableCameras={availableCameras}
                    activeDeviceId={activeDeviceId}
                    onSelectCamera={setActiveDeviceId}
                    playerLabels={[config.playerName || 'Người chơi']}
                  />
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-base tracking-wide shadow-xl shadow-amber-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>BẮT ĐẦU NGỒI LÊN GHẾ NÓNG</span>
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. ACTIVE MILLIONAIRE ROUND                          */}
        {/* ==================================================== */}
        {(gameState === 'playing' || gameState === 'question_result') && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left/Main Column: Questions & Big Options */}
            <div className="lg:col-span-8 space-y-4">
              {/* Top Lifelines Toolbar & Timer */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-4 shadow-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">Trợ Giúp:</span>
                  {/* 50:50 */}
                  <button
                    type="button"
                    disabled={lifelines.fiftyFiftyUsed || isAnswerLocked}
                    onClick={handleUseFiftyFifty}
                    className={`px-3.5 py-2 rounded-xl font-mono text-xs font-black border transition cursor-pointer ${
                      lifelines.fiftyFiftyUsed
                        ? 'bg-gray-800 text-gray-500 border-gray-700 opacity-40 cursor-not-allowed'
                        : 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600 hover:text-white shadow-sm'
                    }`}
                  >
                    50:50
                  </button>

                  {/* Ask Audience */}
                  <button
                    type="button"
                    disabled={lifelines.askAudienceUsed || isAnswerLocked}
                    onClick={handleUseAskAudience}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                      lifelines.askAudienceUsed
                        ? 'bg-gray-800 text-gray-500 border-gray-700 opacity-40 cursor-not-allowed'
                        : 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600 hover:text-white shadow-sm'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Khán Giả</span>
                  </button>

                  {/* Call Expert */}
                  <button
                    type="button"
                    disabled={lifelines.callExpertUsed || isAnswerLocked}
                    onClick={handleUseCallExpert}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                      lifelines.callExpertUsed
                        ? 'bg-gray-800 text-gray-500 border-gray-700 opacity-40 cursor-not-allowed'
                        : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600 hover:text-white shadow-sm'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Chuyên Gia</span>
                  </button>
                </div>

                {/* Milestone Badge & Timer */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    CÂU {currentQuestionIndex + 1}/{roundQuestions.length} — {currentPrize.toLocaleString('vi-VN')} ĐIỂM
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-sm font-black text-amber-400 bg-[#0A0E17] px-3.5 py-1.5 rounded-xl border border-[#30363D]">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{timeLeft}s</span>
                  </div>
                </div>
              </div>

              {/* Question Card with Math Support */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="text-center py-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-relaxed tracking-tight">
                    <MathRenderer text={currentQ?.content || ''} />
                  </h2>
                </div>

                {/* Math Diagram or Table if available */}
                {(currentQ?.diagram || currentQ?.tableData) && (
                  <div className="flex justify-center my-4">
                    <MathDiagramView diagram={currentQ?.diagram} tableData={currentQ?.tableData} />
                  </div>
                )}

                {/* Options 2x2 Grid with MathRenderer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {currentQ?.options.map((opt) => {
                    const isHidden = hiddenOptions.includes(opt.key);
                    const isSelected = selectedAnswer === opt.key;
                    const isCorrect = opt.key === currentQ.correctAnswer;

                    if (isHidden) {
                      return (
                        <div
                          key={opt.key}
                          className="min-h-[90px] sm:min-h-[110px] p-5 sm:p-6 rounded-2xl bg-[#0A0E17]/20 border border-[#30363D]/30 opacity-20 text-transparent select-none"
                        >
                          ---
                        </div>
                      );
                    }

                    let btnClass =
                      'bg-[#0A0E17] border-[#30363D] text-gray-200 hover:border-amber-500 hover:bg-[#1a1f29]';

                    if (isSelected && !isAnswerLocked) {
                      btnClass = 'bg-amber-600/30 border-amber-500 text-amber-200 ring-2 ring-amber-500/40';
                    }

                    if (isAnswerLocked && isSelected) {
                      if (answerStatus === 'idle') {
                        btnClass = 'bg-amber-500 text-slate-950 font-black border-amber-400 ring-4 ring-amber-400/40 animate-pulse';
                      } else if (answerStatus === 'correct') {
                        btnClass = 'bg-emerald-600 text-white font-black border-emerald-400 ring-4 ring-emerald-400/50';
                      } else if (answerStatus === 'wrong') {
                        btnClass = 'bg-rose-600 text-white font-black border-rose-400 ring-4 ring-rose-400/50';
                      }
                    } else if (gameState === 'question_result' && isCorrect) {
                      btnClass = 'bg-emerald-600 text-white font-black border-emerald-400 ring-4 ring-emerald-400/50';
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={isAnswerLocked}
                        onClick={() => handleSelectOption(opt.key)}
                        className={`min-h-[90px] sm:min-h-[110px] p-5 sm:p-6 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer shadow-lg hover:scale-[1.01] ${btnClass}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-mono font-black flex items-center justify-center bg-[#21262D] border border-[#30363D] text-amber-400 text-2xl sm:text-3xl shrink-0 shadow-inner">
                            {opt.key}
                          </span>
                          <span className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-relaxed text-white">
                            <MathRenderer text={opt.text} />
                          </span>
                        </div>
                        {gameState === 'question_result' && isCorrect && (
                          <CheckCircle2 className="w-8 h-8 text-white shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Question Result Prompt */}
                {gameState === 'question_result' && (
                  <div className="p-6 rounded-2xl bg-[#0A0E17] border border-[#30363D] space-y-3 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="text-base text-gray-200">
                        <span className="text-emerald-400 font-black text-xl">Chính xác xuất sắc! </span>
                        Bạn đã đạt mốc <strong className="text-amber-400 font-mono text-xl">{currentPrize.toLocaleString('vi-VN')}</strong> điểm.
                        {currentQ?.explanation && (
                          <div className="mt-2.5 text-base text-gray-300 bg-[#161B22] p-4 rounded-xl border border-[#30363D]">
                            <strong className="text-amber-400">Giải thích:</strong> <MathRenderer text={currentQ.explanation} />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-lg hover:opacity-95 transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 shrink-0"
                      >
                        <span>Câu Tiếp Theo</span>
                        <ArrowRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right/Sidebar: Input & Prize Ladder */}
            <div className="lg:col-span-4 space-y-4">
              {/* Input Selector with Camera Toggle */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">Phương thức điều khiển</span>
                  {inputMode === 'camera' && (
                    <button
                      type="button"
                      onClick={() => setShowCameraHud(!showCameraHud)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      {showCameraHud ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showCameraHud ? 'Thu gọn Camera' : 'Hiện Camera'}</span>
                    </button>
                  )}
                </div>

                <GameInputSelector
                  currentMode={inputMode}
                  onModeChange={setInputMode}
                  allowedModes={['camera', 'voice', 'manual']}
                  playerCount={1}
                  onTurnOffCamera={() => setInputMode('manual')}
                />

                {/* Camera Overlay when active & expanded */}
                {inputMode === 'camera' && showCameraHud && (
                  <div className="pt-2 animate-fadeIn">
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
                      playerLabels={[config.playerName || 'Người chơi']}
                    />
                  </div>
                )}

                {inputMode === 'voice' && (
                  <div className="pt-2 animate-fadeIn">
                    <VoiceRecognitionOverlay
                      isActive={gameState === 'playing'}
                      isLocked={isAnswerLocked}
                      lockedOption={selectedAnswer}
                      onOptionRecognized={(opt) => {
                        if (!isAnswerLocked && !hiddenOptions.includes(opt)) {
                          handleSelectOption(opt);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Prize Ladder */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#30363D]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Thang Tiền Thưởng</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {config.playerName}
                  </span>
                </div>

                {/* Ladder Steps (Reversed: 15 at top) */}
                <div className="space-y-1 font-mono text-xs max-h-[360px] overflow-y-auto pr-1">
                  {roundQuestions.map((_, idx) => {
                    const reverseIdx = roundQuestions.length - 1 - idx;
                    const isCurrent = reverseIdx === currentQuestionIndex;
                    const isPast = reverseIdx < currentQuestionIndex;
                    const isMilestone = reverseIdx === 4 || reverseIdx === 9 || reverseIdx === 14;
                    const prize = config.prizeLadder[reverseIdx] || 100;

                    return (
                      <div
                        key={reverseIdx}
                        className={`px-3 py-1.5 rounded-xl flex items-center justify-between border transition ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                            : isPast
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                            : isMilestone
                            ? 'bg-[#21262D] text-amber-300 font-bold border-amber-500/40'
                            : 'bg-[#0A0E17] text-gray-400 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-right font-bold">{reverseIdx + 1}</span>
                          {isMilestone && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="font-extrabold">{prize.toLocaleString('vi-VN')} điểm</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. GAME OVER / VICTORY SCREEN                        */}
        {/* ==================================================== */}
        {(gameState === 'game_over' || gameState === 'victory') && (
          <div className="w-full max-w-4xl mx-auto bg-[#161B22] border border-[#30363D] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-fadeIn">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl ${
                gameState === 'victory'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/20'
              }`}
            >
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {gameState === 'victory' ? 'CHINH PHỤC ĐỈNH CAO' : 'KẾT THÚC LƯỢT CHƠI'}
              </span>
              <h2 className="text-3xl font-black text-white">
                {gameState === 'victory'
                  ? 'TRIỆU PHÚ TOÁN HỌC XUẤT SẮC!'
                  : 'CHÚC MỪNG BẠN ĐÃ THAM GIA!'}
              </h2>
              <p className="text-xs text-gray-400">
                {gameState === 'victory'
                  ? `Thí sinh ${config.playerName} đã trả lời đúng toàn bộ các câu hỏi!`
                  : `Bạn đã dừng bước ở câu hỏi số ${currentQuestionIndex + 1}.`}
              </p>
            </div>

            {/* Prize Box */}
            <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 max-w-sm mx-auto">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Điểm Thưởng Nhận Được:
              </div>
              <div className="text-3xl font-mono font-black text-amber-400 mt-1">
                {gameState === 'victory'
                  ? config.prizeLadder[roundQuestions.length - 1].toLocaleString('vi-VN')
                  : guaranteedPrize.toLocaleString('vi-VN')}{' '}
                điểm
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={handleStartGame}
                className="py-3 px-4 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử Thách Lại Từ Đầu</span>
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

      {/* Audience Poll Modal */}
      {audiencePollModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Ý Kiến Khán Giả Trường Quay</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {audiencePollModal.map((item) => (
                <div key={item.option} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-amber-400">Phương án {item.option}</span>
                    <span className="text-white">{item.percent}%</span>
                  </div>
                  <div className="h-4 bg-[#0A0E17] rounded-full overflow-hidden border border-[#30363D]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAudiencePollModal(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition cursor-pointer"
            >
              Đóng Trợ Giúp
            </button>
          </div>
        </div>
      )}

      {/* Call Expert Advice Modal */}
      {expertAdviceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#30363D] pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{expertAdviceModal.expertName}</h4>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Độ tự tin: {expertAdviceModal.confidence}%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0E17] border border-[#30363D] text-xs text-gray-300 leading-relaxed">
              "{expertAdviceModal.message}"
            </div>

            <button
              type="button"
              onClick={() => setExpertAdviceModal(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition cursor-pointer"
            >
              Cảm Ơn Chuyên Gia
            </button>
          </div>
        </div>
      )}

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
