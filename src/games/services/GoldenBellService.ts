import { QuizOptionKeyEnum } from '../types/GameEnums';
import { GoldenBellContestant } from '../types/GamePlatform';
import { QuizOption } from '../types/GestureQuiz';
import { QuizScoringService } from './QuizScoringService';

export class GoldenBellService {
  public static readonly AVATAR_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#D946EF',
  ];

  /**
   * Initialize roster of contestants for Golden Bell arena
   */
  public static initContestants(names: string[]): GoldenBellContestant[] {
    const list = names.length > 0 ? names : Array.from({ length: 12 }, (_, i) => `Thí sinh SBD ${i + 1}`);
    return list.map((name, index) => ({
      id: `bell-c-${index + 1}`,
      name,
      avatarColor: this.AVATAR_COLORS[index % this.AVATAR_COLORS.length],
      isEliminated: false,
      score: 0,
      correctCount: 0,
      selectedOption: null,
      responseTimeMs: 0,
      rescuedCount: 0,
    }));
  }

  /**
   * Process a round answer results in elimination mode or survival mode
   */
  public static processRoundAnswers(
    contestants: GoldenBellContestant[],
    correctAnswer: QuizOptionKeyEnum | string,
    questionIndex: number,
    isEliminationMode: boolean,
    options?: QuizOption[]
  ): {
    updatedContestants: GoldenBellContestant[];
    eliminatedThisRound: GoldenBellContestant[];
    survivorCount: number;
  } {
    const eliminatedThisRound: GoldenBellContestant[] = [];

    const updatedContestants = contestants.map((c) => {
      // If already eliminated, stays eliminated unless rescued
      if (c.isEliminated) {
        return c;
      }

      const isCorrect = QuizScoringService.evaluateIndividualAnswer(
        c.selectedOption,
        correctAnswer,
        options
      );

      if (isCorrect) {
        return {
          ...c,
          correctCount: c.correctCount + 1,
          score: c.score + 10,
        };
      } else {
        if (isEliminationMode) {
          const eliminatedObj: GoldenBellContestant = {
            ...c,
            isEliminated: true,
            eliminatedAtQuestion: questionIndex + 1,
          };
          eliminatedThisRound.push(eliminatedObj);
          return eliminatedObj;
        } else {
          return {
            ...c,
          };
        }
      }
    });

    const survivorCount = updatedContestants.filter((c) => !c.isEliminated).length;

    return {
      updatedContestants,
      eliminatedThisRound,
      survivorCount,
    };
  }

  /**
   * Teacher rescue / Cứu trợ: Revive all or selected eliminated contestants
   */
  public static rescueContestants(
    contestants: GoldenBellContestant[],
    targetIds?: string[]
  ): GoldenBellContestant[] {
    return contestants.map((c) => {
      if (!c.isEliminated) return c;
      if (!targetIds || targetIds.includes(c.id)) {
        return {
          ...c,
          isEliminated: false,
          rescuedCount: c.rescuedCount + 1,
        };
      }
      return c;
    });
  }

  /**
   * Sort contestants by survival status, then correct answers, then score
   */
  public static rankContestants(contestants: GoldenBellContestant[]): GoldenBellContestant[] {
    return [...contestants].sort((a, b) => {
      if (a.isEliminated !== b.isEliminated) {
        return a.isEliminated ? 1 : -1;
      }
      if (b.correctCount !== a.correctCount) {
        return b.correctCount - a.correctCount;
      }
      return b.score - a.score;
    });
  }
}
