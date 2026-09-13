import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GestureQuizConfig,
  QuestionItem,
  PlayerAnswerRecord,
  RoundScoreItem,
  PlayerStats,
  TeamStats,
} from '../../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../../types/GameEnums';
import { RoundSelectionService } from '../../services/RoundSelectionService';
import { QuizScoringService } from '../../services/QuizScoringService';
import confetti from 'canvas-confetti';

export type GameStage =
  | 'mode_selection'
  | 'game_config'
  | 'pool_selection'
  | 'pre_round_countdown'
  | 'active_question'
  | 'question_result'
  | 'final_result'
  | 'review_history';

interface UseGestureQuizProps {
  initialConfig?: GestureQuizConfig;
  allAvailableQuestions: QuestionItem[];
}

export function useGestureQuiz({ initialConfig, allAvailableQuestions }: UseGestureQuizProps) {
  const [stage, setStage] = useState<GameStage>('mode_selection');
  const [config, setConfig] = useState<GestureQuizConfig | null>(initialConfig || null);

  // Active round questions
  const [roundQuestions, setRoundQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Recent question IDs history for smart replay non-repetition
  const [recentQuestionIdHistory, setRecentQuestionIdHistory] = useState<string[]>([]);

  // Sequential team turn tracking (if sequential mode is enabled)
  const [currentSequentialTeamIndex, setCurrentSequentialTeamIndex] = useState<number>(0);

  // Active question answers
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, PlayerAnswerRecord>>({});
  // Completed rounds history
  const [roundHistory, setRoundHistory] = useState<RoundScoreItem[]>([]);

  // Pre-round 3..2..1 countdown timer
  const [countdownNumber, setCountdownNumber] = useState<number>(3);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Derived list of players based on config
  const players = useRef<{ id: string; name: string; playerIndex: number; teamId?: string }[]>([]);
  // Derived list of teams based on config
  const teams = useRef<
    { id: string; name: string; color: string; memberIds: string[]; memberNames: string[] }[]
  >([]);

  // Build players and teams definition from current config
  const initializePlayersAndTeams = useCallback((currentCfg: GestureQuizConfig) => {
    const newPlayers: { id: string; name: string; playerIndex: number; teamId?: string }[] = [];
    const newTeams: {
      id: string;
      name: string;
      color: string;
      memberIds: string[];
      memberNames: string[];
    }[] = [];

    const TEAM_COLORS = [
      { name: 'Đội Đỏ (Rồng Vàng)', color: '#ef4444' },
      { name: 'Đội Xanh (Đại Dương)', color: '#3b82f6' },
      { name: 'Đội Xanh Lá (Chiến Binh)', color: '#10b981' },
      { name: 'Đội Vàng (Tia Chớp)', color: '#f59e0b' },
    ];

    if (currentCfg.competitionMode === 'individual') {
      const pCount = currentCfg.individualConfig?.playerCount || 1;
      for (let i = 0; i < pCount; i++) {
        newPlayers.push({
          id: `player-${i + 1}`,
          name: `Người ${i + 1}`,
          playerIndex: i,
        });
      }
    } else {
      // Team mode
      const isSimultaneous = currentCfg.teamConfig?.competitionType === 'simultaneous';
      if (isSimultaneous) {
        // Exactly 2 teams, 2 players each (Total 4)
        // Team 1: Player 1, Player 2 (Left Zone)
        // Team 2: Player 3, Player 4 (Right Zone)
        const team1Members = ['player-1', 'player-2'];
        const team2Members = ['player-3', 'player-4'];

        newPlayers.push(
          { id: 'player-1', name: 'Người 1 (Đội 1)', playerIndex: 0, teamId: 'team-1' },
          { id: 'player-2', name: 'Người 2 (Đội 1)', playerIndex: 1, teamId: 'team-1' },
          { id: 'player-3', name: 'Người 3 (Đội 2)', playerIndex: 2, teamId: 'team-2' },
          { id: 'player-4', name: 'Người 4 (Đội 2)', playerIndex: 3, teamId: 'team-2' }
        );

        newTeams.push(
          {
            id: 'team-1',
            name: 'Đội 1 (Bên Trái)',
            color: '#ef4444',
            memberIds: team1Members,
            memberNames: ['Người 1', 'Người 2'],
          },
          {
            id: 'team-2',
            name: 'Đội 2 (Bên Phải)',
            color: '#3b82f6',
            memberIds: team2Members,
            memberNames: ['Người 3', 'Người 4'],
          }
        );
      } else {
        // Sequential team mode: 2-4 teams, 2-4 players per team
        const tCount = currentCfg.teamConfig?.teamCount || 2;
        const pPerTeam = currentCfg.teamConfig?.playersPerTeam || 2;

        let globalPlayerIdx = 0;
        for (let t = 0; t < tCount; t++) {
          const tId = `team-${t + 1}`;
          const tMemberIds: string[] = [];
          const tMemberNames: string[] = [];

          for (let p = 0; p < pPerTeam; p++) {
            const pId = `player-${globalPlayerIdx + 1}`;
            const pName = `Thành viên ${p + 1} (${TEAM_COLORS[t]?.name || `Đội ${t + 1}`})`;
            tMemberIds.push(pId);
            tMemberNames.push(pName);

            newPlayers.push({
              id: pId,
              name: pName,
              playerIndex: p, // relative to zone in sequential turn
              teamId: tId,
            });
            globalPlayerIdx++;
          }

          newTeams.push({
            id: tId,
            name: TEAM_COLORS[t]?.name || `Đội ${t + 1}`,
            color: TEAM_COLORS[t]?.color || '#6366f1',
            memberIds: tMemberIds,
            memberNames: tMemberNames,
          });
        }
      }
    }

    players.current = newPlayers;
    teams.current = newTeams;
  }, []);

  // Launch game with validated config
  const startQuizWithConfig = useCallback(
    (newConfig: GestureQuizConfig) => {
      // Validate question pool
      const poolQuestions = allAvailableQuestions.filter((q) =>
        newConfig.questionPoolIds.includes(q.id)
      );

      const validation = RoundSelectionService.validatePoolCapacity(
        poolQuestions.length,
        newConfig.questionsPerRound
      );

      if (!validation.isValid) {
        alert(validation.errorMessage);
        return;
      }

      setConfig(newConfig);
      initializePlayersAndTeams(newConfig);

      // Select questions for this round prioritizing unused ones
      const { selectedQuestions, updatedHistory } = RoundSelectionService.selectQuestionsForRound(
        poolQuestions,
        newConfig.questionsPerRound,
        recentQuestionIdHistory
      );

      setRoundQuestions(selectedQuestions);
      setRecentQuestionIdHistory(updatedHistory);
      setCurrentQuestionIndex(0);
      setCurrentSequentialTeamIndex(0);
      setRoundHistory([]);
      setCurrentAnswers({});

      // Start pre-round countdown (3..2..1)
      setCountdownNumber(3);
      setStage('pre_round_countdown');
    },
    [allAvailableQuestions, initializePlayersAndTeams, recentQuestionIdHistory]
  );

  // Pre-round 3-second countdown effect
  useEffect(() => {
    if (stage !== 'pre_round_countdown') return;

    if (countdownNumber > 0) {
      const timer = setTimeout(() => {
        setCountdownNumber((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Start question
      if (config) {
        setTimeLeft(config.timeLimitPerQuestion);
        setIsTimerRunning(true);
        questionStartTimeRef.current = Date.now();
        setStage('active_question');
      }
    }
  }, [stage, countdownNumber, config]);

  // Record an answer for a specific player (from Camera Gesture or Voice or Simulator)
  const recordPlayerAnswer = useCallback(
    (playerId: string, option: QuizOptionKeyEnum) => {
      if (stage !== 'active_question') return;

      const playerObj = players.current.find((p) => p.id === playerId);
      if (!playerObj) return;

      const now = Date.now();
      const timeLimit = config?.timeLimitPerQuestion || 15;
      const elapsedSec = Math.max(
        0.2,
        Math.min(timeLimit, (now - questionStartTimeRef.current) / 1000)
      );
      const roundedTime = Number(elapsedSec.toFixed(1));

      setCurrentAnswers((prev) => ({
        ...prev,
        [playerId]: {
          playerId,
          playerName: playerObj.name,
          playerIndex: playerObj.playerIndex,
          teamId: playerObj.teamId,
          selectedOption: option,
          isCorrect: false, // will be evaluated when round completes
          answeredAtTimestamp: now,
          timeSpentSeconds: roundedTime,
          stableFrames: 15,
        },
      }));
    },
    [stage, config]
  );

  // Evaluate current question results and score
  const evaluateCurrentQuestion = useCallback(() => {
    if (!config || roundQuestions.length === 0) return;

    const currentQ = roundQuestions[currentQuestionIndex];
    if (!currentQ) return;

    setIsTimerRunning(false);

    // Get expected active players for this turn
    let expectedPlayers: { id: string; name: string; playerIndex: number; teamId?: string }[] = [];
    const isSequentialTeam =
      config.competitionMode === 'team' && config.teamConfig?.competitionType === 'sequential';

    if (isSequentialTeam) {
      const activeTeam = teams.current[currentSequentialTeamIndex];
      expectedPlayers = players.current.filter((p) => activeTeam.memberIds.includes(p.id));
    } else {
      expectedPlayers = players.current;
    }

    const defaultTimeoutSec = config.timeLimitPerQuestion;

    // Build finalized answer records
    const finalPlayerAnswers: PlayerAnswerRecord[] = expectedPlayers.map((p) => {
      const existing = currentAnswers[p.id];
      const selected = existing?.selectedOption || null;
      const isCorrect = QuizScoringService.evaluateIndividualAnswer(
        selected,
        currentQ.correctAnswer,
        currentQ.options
      );
      const timeSpent = existing?.timeSpentSeconds ?? defaultTimeoutSec;

      return {
        playerId: p.id,
        playerName: p.name,
        playerIndex: p.playerIndex,
        teamId: p.teamId,
        selectedOption: selected,
        isCorrect,
        answeredAtTimestamp: existing?.answeredAtTimestamp || Date.now(),
        timeSpentSeconds: Number(timeSpent.toFixed(1)),
        stableFrames: existing?.stableFrames || 0,
      };
    });

    const isLastTeamInSequential =
      !isSequentialTeam || currentSequentialTeamIndex >= teams.current.length - 1;

    // Check if we need to progress team in sequential mode or evaluate question
    if (isSequentialTeam && !isLastTeamInSequential) {
      // Save partial answers for this team and switch to next team for the same question
      setCurrentSequentialTeamIndex((prev) => prev + 1);
      setTimeLeft(config.timeLimitPerQuestion);
      questionStartTimeRef.current = Date.now();
      setIsTimerRunning(true);
      return;
    }

    // Question complete for all teams/players
    const fullRoundAnswers = [
      ...(roundHistory[currentQuestionIndex]?.playerAnswers || []),
      ...finalPlayerAnswers,
    ];

    const roundScoreItem: RoundScoreItem = {
      questionIndex: currentQuestionIndex,
      question: currentQ,
      playerAnswers: fullRoundAnswers,
    };

    setRoundHistory((prev) => {
      const copy = [...prev];
      copy[currentQuestionIndex] = roundScoreItem;
      return copy;
    });

    setStage('question_result');
  }, [config, roundQuestions, currentQuestionIndex, currentAnswers, currentSequentialTeamIndex, roundHistory]);

  // Immediately evaluate question as soon as all active participants have locked their answer
  useEffect(() => {
    if (stage !== 'active_question' || !config || roundQuestions.length === 0) return;

    let expectedPlayers: { id: string }[] = [];
    const isSequentialTeam =
      config.competitionMode === 'team' && config.teamConfig?.competitionType === 'sequential';

    if (isSequentialTeam) {
      const activeTeam = teams.current[currentSequentialTeamIndex];
      if (activeTeam) {
        expectedPlayers = players.current.filter((p) => activeTeam.memberIds.includes(p.id));
      }
    } else {
      expectedPlayers = players.current;
    }

    if (expectedPlayers.length > 0) {
      const allAnswered = expectedPlayers.every((p) => currentAnswers[p.id]?.selectedOption);
      if (allAnswered) {
        const timeoutId = setTimeout(() => {
          evaluateCurrentQuestion();
        }, 350);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [stage, config, currentAnswers, currentSequentialTeamIndex, roundQuestions, evaluateCurrentQuestion]);

  // Main question countdown timer
  useEffect(() => {
    if (stage !== 'active_question' || !isTimerRunning) return;

    if (timeLeft <= 0) {
      evaluateCurrentQuestion();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          evaluateCurrentQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, isTimerRunning, timeLeft, evaluateCurrentQuestion]);

  // Auto-trigger evaluation when all current expected players have submitted
  useEffect(() => {
    if (stage !== 'active_question') return;

    let targetPlayers = players.current;
    if (config?.competitionMode === 'team' && config.teamConfig?.competitionType === 'sequential') {
      const activeTeam = teams.current[currentSequentialTeamIndex];
      if (activeTeam) {
        targetPlayers = players.current.filter((p) => activeTeam.memberIds.includes(p.id));
      }
    }

    if (targetPlayers.length > 0) {
      const allSubmitted = targetPlayers.every(
        (p) => currentAnswers[p.id] && currentAnswers[p.id].selectedOption !== null
      );
      if (allSubmitted) {
        // Small 300ms buffer before revealing result
        const timeout = setTimeout(() => {
          evaluateCurrentQuestion();
        }, 350);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentAnswers, stage, config, currentSequentialTeamIndex, evaluateCurrentQuestion]);

  // Move to next question or final result
  const nextQuestion = useCallback(() => {
    if (!config) return;

    if (currentQuestionIndex + 1 < roundQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentSequentialTeamIndex(0);
      setCurrentAnswers({});
      setTimeLeft(config.timeLimitPerQuestion);
      questionStartTimeRef.current = Date.now();
      setIsTimerRunning(true);
      setStage('active_question');
    } else {
      // Completed all questions in the round!
      setStage('final_result');
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }
  }, [config, currentQuestionIndex, roundQuestions.length]);

  // Replay round button (Mục 21: không sử dụng lại nguyên bộ câu vừa chơi nếu còn câu khác trong pool)
  const replayRound = useCallback(() => {
    if (!config) return;

    const poolQuestions = allAvailableQuestions.filter((q) =>
      config.questionPoolIds.includes(q.id)
    );

    const { selectedQuestions, updatedHistory } = RoundSelectionService.selectQuestionsForRound(
      poolQuestions,
      config.questionsPerRound,
      recentQuestionIdHistory
    );

    setRoundQuestions(selectedQuestions);
    setRecentQuestionIdHistory(updatedHistory);
    setCurrentQuestionIndex(0);
    setCurrentSequentialTeamIndex(0);
    setRoundHistory([]);
    setCurrentAnswers({});
    setCountdownNumber(3);
    setStage('pre_round_countdown');
  }, [config, allAvailableQuestions, recentQuestionIdHistory]);

  // Compute live leaderboard
  const individualLeaderboard: PlayerStats[] = QuizScoringService.computeIndividualLeaderboard(
    players.current,
    roundHistory
  );

  const teamLeaderboard: TeamStats[] = QuizScoringService.computeTeamLeaderboard(
    teams.current,
    roundHistory
  );

  return {
    stage,
    setStage,
    config,
    setConfig,
    roundQuestions,
    currentQuestionIndex,
    currentQuestion: roundQuestions[currentQuestionIndex] || null,
    timeLeft,
    isTimerRunning,
    countdownNumber,
    currentAnswers,
    roundHistory,
    players: players.current,
    teams: teams.current,
    currentSequentialTeamIndex,
    activeSequentialTeam: teams.current[currentSequentialTeamIndex] || null,
    individualLeaderboard,
    teamLeaderboard,
    startQuizWithConfig,
    recordPlayerAnswer,
    evaluateCurrentQuestion,
    nextQuestion,
    replayRound,
  };
}
