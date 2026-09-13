import { ArenaPlayerState } from '../types/GamePlatform';

export class MathArenaService {
  /**
   * Calculates individual player score for a round:
   * Base score: 100
   * Speed bonus: up to +50 points if answered quickly
   * Streak bonus: +10 pts per streak step
   */
  public static calculateQuestionScore(
    isCorrect: boolean,
    responseTimeMs: number,
    timeLimitSeconds: number,
    speedBonusEnabled: boolean = true,
    currentStreak: number = 0
  ): { scoreGain: number; streak: number } {
    if (!isCorrect) {
      return { scoreGain: 0, streak: 0 };
    }

    const baseScore = 100;
    let speedBonus = 0;

    if (speedBonusEnabled) {
      const totalTimeMs = timeLimitSeconds * 1000;
      const timeLeftRatio = Math.max(0, (totalTimeMs - responseTimeMs) / totalTimeMs);
      speedBonus = Math.round(timeLeftRatio * 50);
    }

    const newStreak = currentStreak + 1;
    const streakBonus = Math.min(50, (newStreak - 1) * 10);

    const totalGain = baseScore + speedBonus + streakBonus;

    return {
      scoreGain: totalGain,
      streak: newStreak,
    };
  }

  /**
   * Sorts player leaderboard in descending order
   */
  public static rankPlayers(players: ArenaPlayerState[]): ArenaPlayerState[] {
    return [...players].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.correctCount !== a.correctCount) {
        return b.correctCount - a.correctCount;
      }
      return a.responseTimeMs - b.responseTimeMs;
    });
  }
}
