import React, { useEffect, useCallback, useState } from 'react';
import {
  QuestionItem,
  GestureQuizConfig,
  PlayerAnswerRecord,
} from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { CameraGestureOverlay } from './CameraGestureOverlay';
import { VoiceRecognitionOverlay } from './VoiceRecognitionOverlay';
import { KeyboardMouseInputOverlay } from './KeyboardMouseInputOverlay';
import { MathRenderer } from './MathRenderer';
import { MathDiagramView } from './MathDiagramView';
import { useMediaPipeHands } from '../gesture-quiz/hooks/useMediaPipeHands';
import { Clock, CheckCircle, Sparkles, FastForward, Keyboard, MousePointer, X, Eye } from 'lucide-react';

interface QuizActiveRoundProps {
  config: GestureQuizConfig;
  currentQuestion: QuestionItem;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  totalTimeLimit: number;
  currentAnswers: Record<string, PlayerAnswerRecord>;
  onRecordAnswer: (playerId: string, option: QuizOptionKeyEnum) => void;
  players: { id: string; name: string; playerIndex: number; teamId?: string }[];
  teams: { id: string; name: string; color: string; memberIds: string[]; memberNames: string[] }[];
  currentSequentialTeamIndex: number;
  onForceSubmit: () => void;
}

export const QuizActiveRound: React.FC<QuizActiveRoundProps> = ({
  config,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  timeLeft,
  totalTimeLimit,
  currentAnswers,
  onRecordAnswer,
  players,
  teams,
  currentSequentialTeamIndex,
  onForceSubmit,
}) => {
  const isIndividual = config.competitionMode === 'individual';
  const isVoiceMode = isIndividual && config.individualConfig?.inputMode === 'voice';
  const isConfigKeyboardMouse =
    (isIndividual && config.individualConfig?.inputMode === 'keyboard_mouse') ||
    (!isIndividual && config.teamConfig?.inputMode === 'keyboard_mouse');

  const [isCameraTurnedOff, setIsCameraTurnedOff] = useState(false);
  const isKeyboardMouseMode = isConfigKeyboardMouse || isCameraTurnedOff;

  // Determine active zone count for camera
  let activeZoneCount = 1;
  let activePlayers = players;
  let activeTeamTitle: string | null = null;

  if (isIndividual) {
    activeZoneCount = config.individualConfig?.playerCount || 1;
  } else {
    // Team mode
    if (config.teamConfig?.competitionType === 'simultaneous') {
      // 2 teams x 2 members = 4 zones
      activeZoneCount = 4;
    } else {
      // Sequential team mode: active team is teams[currentSequentialTeamIndex]
      const activeTeam = teams[currentSequentialTeamIndex];
      if (activeTeam) {
        activePlayers = players.filter((p) => activeTeam.memberIds.includes(p.id));
        activeZoneCount = activePlayers.length;
        activeTeamTitle = `LƯỢT THI: ${activeTeam.name} (${currentSequentialTeamIndex + 1}/${teams.length})`;
      }
    }
  }

  // Camera hook with automatic zone locking (only runs when camera is actually used)
  const isCameraNeeded = !isVoiceMode && !isKeyboardMouseMode && !isCameraTurnedOff;
  const {
    videoRef,
    canvasRef,
    isLoadingModel,
    cameraError,
    isCameraActive,
    mediaStream,
    zoneDetections,
    manualTriggerZoneAnswer,
    retryCamera,
    stopCamera,
    availableCameras,
    activeDeviceId,
    setActiveDeviceId,
  } = useMediaPipeHands({
    zoneCount: activeZoneCount,
    requiredStableFrames: 15,
    isActive: isCameraNeeded,
    onZoneAnswerLocked: (zoneIndex, option) => {
      const targetPlayer = activePlayers[zoneIndex];
      if (targetPlayer) {
        onRecordAnswer(targetPlayer.id, option);
      }
    },
  });

  const handleTurnOffCamera = () => {
    stopCamera();
    setIsCameraTurnedOff(true);
  };

  const handleManualTrigger = (zoneIndex: number, option: QuizOptionKeyEnum) => {
    if (isCameraNeeded) {
      manualTriggerZoneAnswer(zoneIndex, option);
    }
    const targetPlayer = activePlayers[zoneIndex];
    if (targetPlayer) {
      onRecordAnswer(targetPlayer.id, option);
    }
  };

  const handleVoiceAnswer = (option: QuizOptionKeyEnum) => {
    const p1 = players[0];
    if (p1) {
      onRecordAnswer(p1.id, option);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toUpperCase();

      // Primary / Single Player / P1:
      const p1 = activePlayers[0];
      if (p1 && !currentAnswers[p1.id]?.selectedOption) {
        if (key === '1' || key === 'A') {
          onRecordAnswer(p1.id, QuizOptionKeyEnum.A);
        } else if (key === '2' || key === 'B') {
          onRecordAnswer(p1.id, QuizOptionKeyEnum.B);
        } else if (key === '3' || key === 'C') {
          onRecordAnswer(p1.id, QuizOptionKeyEnum.C);
        } else if (key === '4' || key === 'D') {
          onRecordAnswer(p1.id, QuizOptionKeyEnum.D);
        }
      }

      // Player 2 in multiplayer:
      const p2 = activePlayers[1];
      if (p2 && !currentAnswers[p2.id]?.selectedOption) {
        if (key === '5' || key === 'F') {
          onRecordAnswer(p2.id, QuizOptionKeyEnum.A);
        } else if (key === '6' || key === 'G') {
          onRecordAnswer(p2.id, QuizOptionKeyEnum.B);
        } else if (key === '7' || key === 'H') {
          onRecordAnswer(p2.id, QuizOptionKeyEnum.C);
        } else if (key === '8' || key === 'J') {
          onRecordAnswer(p2.id, QuizOptionKeyEnum.D);
        }
      }

      // Player 3 in multiplayer:
      const p3 = activePlayers[2];
      if (p3 && !currentAnswers[p3.id]?.selectedOption) {
        if (key === 'Q') onRecordAnswer(p3.id, QuizOptionKeyEnum.A);
        else if (key === 'W') onRecordAnswer(p3.id, QuizOptionKeyEnum.B);
        else if (key === 'E') onRecordAnswer(p3.id, QuizOptionKeyEnum.C);
        else if (key === 'R') onRecordAnswer(p3.id, QuizOptionKeyEnum.D);
      }

      // Player 4 in multiplayer:
      const p4 = activePlayers[3];
      if (p4 && !currentAnswers[p4.id]?.selectedOption) {
        if (key === 'U') onRecordAnswer(p4.id, QuizOptionKeyEnum.A);
        else if (key === 'I') onRecordAnswer(p4.id, QuizOptionKeyEnum.B);
        else if (key === 'O') onRecordAnswer(p4.id, QuizOptionKeyEnum.C);
        else if (key === 'P') onRecordAnswer(p4.id, QuizOptionKeyEnum.D);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePlayers, currentAnswers, onRecordAnswer]);

  // Click on Option Card Handler (Mouse click)
  const handleCardClick = (optKey: QuizOptionKeyEnum) => {
    // If single active player, record for that player
    if (activePlayers.length === 1 && activePlayers[0]) {
      onRecordAnswer(activePlayers[0].id, optKey);
      return;
    }

    // If multiplayer, record for first player who hasn't answered yet
    const firstUnanswered = activePlayers.find((p) => !currentAnswers[p.id]?.selectedOption) || activePlayers[0];
    if (firstUnanswered) {
      onRecordAnswer(firstUnanswered.id, optKey);
    }
  };

  // Timer calculation
  const timeProgress = Math.max(0, timeLeft / totalTimeLimit);
  const isUrgent = timeLeft <= 5;

  const playerLabels = activePlayers.map((p) => p.name);
  const teamLabels = activePlayers.map((p) => {
    if (!p.teamId) return '';
    const t = teams.find((item) => item.id === p.teamId);
    return t ? t.name : '';
  });

  const [isSidePanelVisible, setIsSidePanelVisible] = useState<boolean>(true);
  const [isBottomGuideVisible, setIsBottomGuideVisible] = useState<boolean>(true);

  const answeredCount = activePlayers.filter((p) => currentAnswers[p.id]?.selectedOption).length;

  return (
    <div className="w-full mx-auto flex flex-col justify-between h-full space-y-2.5 sm:space-y-3 animate-fadeIn">
      {/* Top Bento Header Bar */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-2.5 sm:p-3 relative overflow-hidden shadow-lg flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />

        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 px-2.5 py-1 rounded-xl font-mono font-black text-white shadow-md text-xs sm:text-sm">
            Q{currentQuestionIndex + 1}/{totalQuestions}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs sm:text-sm font-black text-blue-400">
                CÂU HỎI {currentQuestionIndex + 1}
              </span>
              <span className="rounded-lg bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                {config.subject}
              </span>
              {config.purpose === 'warm-up' ? (
                <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  🚀 Khởi Động
                </span>
              ) : (
                <span className="rounded-lg bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                  🎯 Luyện Tập
                </span>
              )}
              {isKeyboardMouseMode && (
                <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Keyboard className="w-3 h-3" /> Chuột & Phím
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-medium truncate max-w-md">{config.lessonTitle}</p>
          </div>
        </div>

        {activeTeamTitle && (
          <div className="rounded-xl bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs font-black text-purple-300 animate-pulse">
            👥 {activeTeamTitle}
          </div>
        )}

        {/* Timer & Controls */}
        <div className="flex items-center gap-2.5">
          {!isSidePanelVisible && (
            <button
              type="button"
              onClick={() => setIsSidePanelVisible(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition cursor-pointer"
              title="Hiện lại khung Camera và Bảng tiến độ học sinh"
            >
              <Sparkles className="w-3 h-3" />
              <span>Hiện Camera & Nộp</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isUrgent ? 'text-orange-400 animate-bounce' : 'text-blue-400'}`} />
            <div
              className={`font-mono text-lg sm:text-2xl font-black tabular-nums ${
                isUrgent ? 'text-orange-400 animate-pulse' : 'text-white'
              }`}
            >
              {timeLeft}s
            </div>
          </div>

          <div className="w-16 sm:w-24 h-2 bg-[#0A0E17] rounded-full overflow-hidden border border-[#30363D]">
            <div
              className={`h-full transition-all duration-1000 ${
                isUrgent ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${timeProgress * 100}%` }}
            />
          </div>

          <button
            onClick={onForceSubmit}
            className="flex items-center gap-1 rounded-xl border border-[#30363D] bg-[#21262D] px-2.5 py-1 text-[11px] sm:text-xs font-bold text-gray-200 hover:border-gray-500 hover:bg-[#2f3640] hover:text-white transition cursor-pointer"
            title="Khóa và xem đáp án ngay"
          >
            <span>Khóa câu</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Bento Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start flex-1 min-h-0">
        {/* Left Column: Question + Options (Expands to full 12 cols when sidebar is hidden) */}
        <div className={`${isSidePanelVisible ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3.5 transition-all duration-300 flex flex-col justify-start`}>
          {/* Bento Question Box */}
          <div className="bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500" />
            <div className="flex items-center justify-between text-xs sm:text-sm mb-3 text-gray-400 font-mono">
              <span className="text-blue-400 font-black uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> NỘI DUNG CÂU HỎI
              </span>
              <span className="font-bold text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm bg-[#21262D] px-3 py-1 rounded-xl border border-[#30363D]">
                {isKeyboardMouseMode ? (
                  <>
                    <MousePointer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Click chuột hoặc phím 1, 2, 3, 4</span>
                  </>
                ) : isVoiceMode ? (
                  <span>Nói rõ chữ A, B, C, D</span>
                ) : (
                  <span>Giơ 1, 2, 3, 4 ngón tay trước camera</span>
                )}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              <MathRenderer text={currentQuestion.content} />
            </h2>

            {/* Diagrams and Data Tables */}
            {(currentQuestion.diagram || currentQuestion.tableData) && (
              <div className="mt-4 flex justify-center">
                <MathDiagramView diagram={currentQuestion.diagram} tableData={currentQuestion.tableData} />
              </div>
            )}
          </div>

          {/* 4 Option Bento Cards - Extra Large Text & Cards for Classroom Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQuestion.options.map((opt) => {
              const optionStyles: Record<
                QuizOptionKeyEnum,
                {
                  label: string;
                  icon: string;
                  count: string;
                  keyNum: string;
                  badgeColor: string;
                  borderHover: string;
                }
              > = {
                [QuizOptionKeyEnum.A]: {
                  label: '1 ngón tay',
                  icon: '☝️',
                  count: '1 Ngón',
                  keyNum: '1',
                  badgeColor: 'bg-blue-500/25 border-blue-400 text-blue-300',
                  borderHover: 'hover:border-blue-400',
                },
                [QuizOptionKeyEnum.B]: {
                  label: '2 ngón tay',
                  icon: '✌️',
                  count: '2 Ngón',
                  keyNum: '2',
                  badgeColor: 'bg-emerald-500/25 border-emerald-400 text-emerald-300',
                  borderHover: 'hover:border-emerald-400',
                },
                [QuizOptionKeyEnum.C]: {
                  label: '3 ngón tay',
                  icon: '🤟',
                  count: '3 Ngón',
                  keyNum: '3',
                  badgeColor: 'bg-amber-500/25 border-amber-400 text-amber-300',
                  borderHover: 'hover:border-amber-400',
                },
                [QuizOptionKeyEnum.D]: {
                  label: '4 ngón tay',
                  icon: '🖐',
                  count: '4 Ngón',
                  keyNum: '4',
                  badgeColor: 'bg-purple-500/25 border-purple-400 text-purple-300',
                  borderHover: 'hover:border-purple-400',
                },
              };

              const style = optionStyles[opt.key];
              const isSelectedByAny = activePlayers.some((p) => currentAnswers[p.id]?.selectedOption === opt.key);

              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => handleCardClick(opt.key)}
                  className={`bg-[#21262D] border-2 sm:border-3 rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all group shadow-xl space-y-3.5 text-left cursor-pointer hover:scale-[1.015] active:scale-[0.985] min-h-[130px] sm:min-h-[150px] md:min-h-[170px] ${
                    isSelectedByAny
                      ? 'border-blue-400 bg-blue-950/60 ring-4 ring-blue-500/40 shadow-blue-500/20'
                      : `border-[#30363D] ${style.borderHover} hover:bg-[#282e38]`
                  }`}
                  title={`Click để chọn đáp án ${opt.key} (Phím [${style.keyNum}] hoặc [${opt.key}])`}
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

          {/* Simultaneous Team Hint Bar */}
          {config.competitionMode === 'team' && config.teamConfig?.competitionType === 'simultaneous' && (
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-3 text-xs sm:text-sm text-gray-300 flex items-center justify-between shrink-0 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-red-300">Đội 1 (Bên Trái): Người 1 & Người 2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-bold text-blue-300">Đội 2 (Bên Phải): Người 3 & Người 4</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Camera / Voice / Keyboard-Mouse Bento Box (Can be hidden with X button) */}
        {isSidePanelVisible && (
          <div className="lg:col-span-5 space-y-2.5 animate-fadeIn flex flex-col justify-between h-full min-h-0">
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-3 shadow-xl space-y-2 relative">
              <div className="flex items-center justify-between text-xs border-b border-[#30363D] pb-2 pr-7">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  {isKeyboardMouseMode
                    ? 'BÀN PHÍM & CHUỘT'
                    : isVoiceMode
                    ? 'NHẬN DIỆN GIỌNG NÓI'
                    : 'AI CAMERA VISION HUD'}
                </span>
                <span className="font-mono font-bold text-gray-400 text-[10px]">
                  {isKeyboardMouseMode ? 'KEYBOARD / MOUSE' : `${activeZoneCount} KHU VỰC`}
                </span>
              </div>

              {/* Close X Button for Sidebar */}
              <button
                type="button"
                onClick={() => setIsSidePanelVisible(false)}
                title="Ẩn khung Camera & Tiến độ để mở rộng toàn màn hình câu hỏi"
                className="absolute top-2.5 right-2.5 p-1 rounded-md bg-[#21262D] hover:bg-rose-500/20 border border-[#30363D] text-gray-400 hover:text-rose-300 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>

              {isKeyboardMouseMode ? (
                <KeyboardMouseInputOverlay
                  players={activePlayers}
                  currentAnswers={currentAnswers}
                  onSelectOption={onRecordAnswer}
                  isSinglePlayer={activePlayers.length === 1}
                />
              ) : isVoiceMode ? (
                <VoiceRecognitionOverlay
                  isActive={true}
                  isLocked={!!currentAnswers['player-1']?.selectedOption}
                  lockedOption={currentAnswers['player-1']?.selectedOption || null}
                  onOptionRecognized={handleVoiceAnswer}
                />
              ) : (
                <CameraGestureOverlay
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  mediaStream={mediaStream}
                  isCameraActive={isCameraActive}
                  isLoadingModel={isLoadingModel}
                  cameraError={cameraError}
                  zoneCount={activeZoneCount}
                  zoneDetections={zoneDetections}
                  playerLabels={playerLabels}
                  teamLabels={teamLabels}
                  availableCameras={availableCameras}
                  activeDeviceId={activeDeviceId}
                  onSelectCamera={setActiveDeviceId}
                  onManualTrigger={handleManualTrigger}
                  onRetryCamera={retryCamera}
                  onTurnOffCamera={handleTurnOffCamera}
                />
              )}
            </div>

            {/* Bento Box: Real-Time Submissions Standings */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-3 shadow-xl space-y-2">
              <div className="flex items-center justify-between font-extrabold text-xs text-gray-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                  TIẾN ĐỘ CHỐT ĐÁP ÁN
                </span>
                <span className="font-mono font-black text-blue-400 text-xs">
                  {answeredCount} / {activePlayers.length} ĐÃ CHỐT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {activePlayers.map((p) => {
                  const ans = currentAnswers[p.id];
                  const isLocked = !!ans?.selectedOption;
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl px-2.5 py-1.5 text-xs flex items-center justify-between border transition font-bold ${
                        isLocked
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-200 shadow-sm'
                          : 'bg-[#21262D] border-[#30363D] text-gray-400'
                      }`}
                    >
                      <span className="font-black truncate pr-1 text-white text-[11px]">{p.name}</span>
                      <span className="font-mono font-black text-[10px] shrink-0">
                        {isLocked ? `[ ${ans?.selectedOption} ]` : '...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bento Banner: Quick Input Reference (Can be closed with X button) */}
      {isBottomGuideVisible && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/30 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-white shadow-lg relative shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-lg">
              HƯỚNG DẪN
            </span>
            <span className="text-[11px] text-blue-100 hidden sm:inline font-medium">
              Giơ ngón tay trước camera, bấm phím số 1, 2, 3, 4 hoặc click chuột trực tiếp
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-black font-mono">
              <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/15">1/A ☝️</span>
              <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/15">2/B ✌️</span>
              <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/15">3/C 🤟</span>
              <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/15">4/D 🖐️</span>
            </div>
            <button
              type="button"
              onClick={() => setIsBottomGuideVisible(false)}
              title="Ẩn thanh hướng dẫn"
              className="p-1 rounded-md bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

