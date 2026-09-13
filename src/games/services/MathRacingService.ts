import { QuizOptionKeyEnum } from '../types/GameEnums';
import { RacingPlayerState } from '../types/GamePlatform';

export class MathRacingService {
  public static readonly DEFAULT_CAR_COLORS = [
    { color: '#EF4444', name: 'Đỏ Lửa', icon: '🏎️' },
    { color: '#3B82F6', name: 'Xanh Lam', icon: '🚙' },
    { color: '#EAB308', name: 'Vàng Sấm', icon: '🚗' },
    { color: '#10B981', name: 'Lục Bảo', icon: '🏎️' },
  ];

  /**
   * Initializes player states for race
   */
  public static initRacingPlayers(playerNames: string[]): RacingPlayerState[] {
    const validNames = playerNames.length > 0 ? playerNames : ['Học sinh 1', 'Học sinh 2'];
    return validNames.map((name, index) => {
      const style = this.DEFAULT_CAR_COLORS[index % this.DEFAULT_CAR_COLORS.length];
      return {
        id: `racer-${index + 1}`,
        name,
        color: style.color,
        carIcon: style.icon,
        trackPositionPercent: 0,
        speed: 0,
        nitroBoost: 0,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        selectedOption: null,
        responseTimeMs: 0,
        status: 'idle',
      };
    });
  }

  /**
   * Calculate advancement distance on track per question.
   * If total questions = N, base advancement per correct answer is ~ (100 / N)%.
   * Faster response (e.g. < 5s) gives nitro bonus + extra track distance!
   */
  public static calculateAdvance(
    isCorrect: boolean,
    responseTimeSec: number,
    timeLimitSec: number,
    totalQuestions: number
  ): {
    advancePercent: number;
    scoreGain: number;
    isNitro: boolean;
    speedKmH: number;
  } {
    if (!isCorrect) {
      return {
        advancePercent: 0,
        scoreGain: 0,
        isNitro: false,
        speedKmH: 0,
      };
    }

    const basePerQuestion = 100 / Math.max(1, totalQuestions);
    const speedRatio = Math.max(0, (timeLimitSec - responseTimeSec) / timeLimitSec);

    // Nitro bonus if answered in top 35% time
    const isNitro = speedRatio > 0.65;
    const speedBonus = isNitro ? 1.3 : 1.0 + speedRatio * 0.2;
    const advancePercent = Number((basePerQuestion * speedBonus).toFixed(1));

    const scoreGain = isNitro ? 15 : 10;
    const speedKmH = Math.round(120 + speedRatio * 160);

    return {
      advancePercent,
      scoreGain,
      isNitro,
      speedKmH,
    };
  }

  /**
   * Rank players at finish based on track position % desc, then score desc, then least time
   */
  public static rankRacers(players: RacingPlayerState[]): RacingPlayerState[] {
    return [...players].sort((a, b) => {
      if (b.trackPositionPercent !== a.trackPositionPercent) {
        return b.trackPositionPercent - a.trackPositionPercent;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (a.finishTimeSec || 999) - (b.finishTimeSec || 999);
    });
  }
}
