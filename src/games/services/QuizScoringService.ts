import { GradeRatingEnum, QuizOptionKeyEnum } from '../types/GameEnums';
import {
  PlayerAnswerRecord,
  PlayerStats,
  TeamStats,
  QuestionItem,
  GestureQuizConfig,
} from '../types/GestureQuiz';

export class QuizScoringService {
  /**
   * Calculates the rating based on percentage score (Spec Item 20)
   * 90–100% 🏆 Xuất sắc
   * 80–89%  ⭐ Tốt
   * 65–79%  👍 Khá
   * 50–64%  📘 Đạt
   * <50%    💪 Cần cố gắng
   */
  public static calculateGradeRating(correctCount: number, totalQuestions: number): {
    rating: GradeRatingEnum;
    label: string;
    badge: string;
    rate: number;
  } {
    if (totalQuestions <= 0) {
      return { rating: GradeRatingEnum.NEEDS_EFFORT, label: 'Cần cố gắng', badge: '💪', rate: 0 };
    }
    const rate = Math.round((correctCount / totalQuestions) * 100);

    if (rate >= 90) {
      return { rating: GradeRatingEnum.EXCELLENT, label: 'Xuất sắc', badge: '🏆', rate };
    } else if (rate >= 80) {
      return { rating: GradeRatingEnum.GOOD, label: 'Tốt', badge: '⭐', rate };
    } else if (rate >= 65) {
      return { rating: GradeRatingEnum.FAIR, label: 'Khá', badge: '👍', rate };
    } else if (rate >= 50) {
      return { rating: GradeRatingEnum.PASS, label: 'Đạt', badge: '📘', rate };
    } else {
      return { rating: GradeRatingEnum.NEEDS_EFFORT, label: 'Cần cố gắng', badge: '💪', rate };
    }
  }

  /**
   * Evaluates answers for an individual round with full robustness
   */
  public static evaluateIndividualAnswer(
    selectedOption: QuizOptionKeyEnum | string | null | undefined,
    correctOption: QuizOptionKeyEnum | string | null | undefined,
    options?: { key: QuizOptionKeyEnum | string; text: string }[]
  ): boolean {
    if (!selectedOption || !correctOption) return false;

    const normSelected = String(selectedOption).trim().toUpperCase();
    const normCorrect = String(correctOption).trim().toUpperCase();

    // 1. Direct match: 'A' === 'A'
    if (normSelected === normCorrect) return true;

    // 2. Prefix matching: 'A.' or 'A:' or 'A '
    if (
      normCorrect.startsWith(normSelected + '.') ||
      normCorrect.startsWith(normSelected + ':') ||
      normCorrect.startsWith(normSelected + ' ')
    ) {
      return true;
    }
    if (
      normSelected.startsWith(normCorrect + '.') ||
      normSelected.startsWith(normCorrect + ':') ||
      normSelected.startsWith(normCorrect + ' ')
    ) {
      return true;
    }

    // 3. Option text match fallback
    if (options && options.length > 0) {
      const selectedItem = options.find(
        (o) => String(o.key).trim().toUpperCase() === normSelected
      );
      if (
        selectedItem &&
        selectedItem.text.trim().toLowerCase() === String(correctOption).trim().toLowerCase()
      ) {
        return true;
      }

      const correctItem = options.find(
        (o) => o.text.trim().toLowerCase() === String(correctOption).trim().toLowerCase()
      );
      if (
        correctItem &&
        String(correctItem.key).trim().toUpperCase() === normSelected
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluates team scoring for a single question (Spec Item 14 & 17)
   * Rule: All team members MUST answer correctly to earn 1 point.
   * If even one member answers incorrectly or does not answer -> 0 point.
   */
  public static evaluateTeamRound(
    memberAnswers: PlayerAnswerRecord[],
    correctOption: QuizOptionKeyEnum
  ): { earnedPoint: number; allCorrect: boolean } {
    if (memberAnswers.length === 0) return { earnedPoint: 0, allCorrect: false };

    const allCorrect = memberAnswers.every(
      (ans) => ans.selectedOption && ans.selectedOption.toUpperCase() === correctOption.toUpperCase()
    );

    return {
      earnedPoint: allCorrect ? 1 : 0,
      allCorrect,
    };
  }

  /**
   * Aggregate individual rankings sorted by:
   * 1. Score desc (most points wins)
   * 2. Total time asc (faster completion wins when tied)
   * 3. Accuracy rate desc
   */
  public static computeIndividualLeaderboard(
    players: { id: string; name: string }[],
    roundHistory: { playerAnswers: PlayerAnswerRecord[]; question: QuestionItem }[]
  ): PlayerStats[] {
    const totalQuestions = roundHistory.length;

    return players
      .map((p) => {
        let correctCount = 0;
        let totalTimeSeconds = 0;

        roundHistory.forEach((r) => {
          const ans = r.playerAnswers.find((a) => a.playerId === p.id);
          if (ans) {
            if (ans.selectedOption === r.question.correctAnswer) {
              correctCount += 1;
            }
            if (ans.timeSpentSeconds !== undefined) {
              totalTimeSeconds += ans.timeSpentSeconds;
            }
          }
        });

        const ratingInfo = this.calculateGradeRating(correctCount, totalQuestions);
        const roundedTotalTime = Math.round(totalTimeSeconds * 10) / 10;
        const averageTime =
          totalQuestions > 0 ? Math.round((totalTimeSeconds / totalQuestions) * 10) / 10 : 0;

        return {
          id: p.id,
          name: p.name,
          score: correctCount,
          correctCount,
          totalQuestions,
          accuracyRate: ratingInfo.rate,
          totalTimeSeconds: roundedTotalTime,
          averageTimeSeconds: averageTime,
          gradeRating: ratingInfo.rating,
          ratingLabel: `${ratingInfo.badge} ${ratingInfo.label}`,
        };
      })
      .sort((a, b) => {
        // 1. Highest score first
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // 2. Faster total completion time first (tie-breaker)
        if (a.totalTimeSeconds !== b.totalTimeSeconds) {
          return a.totalTimeSeconds - b.totalTimeSeconds;
        }
        // 3. Accuracy rate
        return b.accuracyRate - a.accuracyRate;
      });
  }

  /**
   * Aggregate team rankings with time tie-breaker
   */
  public static computeTeamLeaderboard(
    teams: { id: string; name: string; color: string; memberIds: string[]; memberNames: string[] }[],
    roundHistory: { playerAnswers: PlayerAnswerRecord[]; question: QuestionItem }[]
  ): TeamStats[] {
    const totalQuestions = roundHistory.length;

    return teams
      .map((team) => {
        let teamScore = 0;
        let totalTimeSeconds = 0;

        roundHistory.forEach((r) => {
          const teamMemberAnswers = r.playerAnswers.filter((a) => team.memberIds.includes(a.playerId));
          const { earnedPoint } = this.evaluateTeamRound(teamMemberAnswers, r.question.correctAnswer);
          teamScore += earnedPoint;

          // Team response time for a question is the max time taken by any member (or sum of times)
          if (teamMemberAnswers.length > 0) {
            const maxMemberTime = Math.max(
              ...teamMemberAnswers.map((a) => a.timeSpentSeconds ?? 15)
            );
            totalTimeSeconds += maxMemberTime;
          }
        });

        const ratingInfo = this.calculateGradeRating(teamScore, totalQuestions);
        const roundedTotalTime = Math.round(totalTimeSeconds * 10) / 10;
        const averageTime =
          totalQuestions > 0 ? Math.round((totalTimeSeconds / totalQuestions) * 10) / 10 : 0;

        return {
          id: team.id,
          name: team.name,
          color: team.color,
          score: teamScore,
          totalQuestions,
          accuracyRate: ratingInfo.rate,
          totalTimeSeconds: roundedTotalTime,
          averageTimeSeconds: averageTime,
          gradeRating: ratingInfo.rating,
          ratingLabel: `${ratingInfo.badge} ${ratingInfo.label}`,
          memberIds: team.memberIds,
          memberNames: team.memberNames,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (a.totalTimeSeconds !== b.totalTimeSeconds) {
          return a.totalTimeSeconds - b.totalTimeSeconds;
        }
        return b.accuracyRate - a.accuracyRate;
      });
  }
}
