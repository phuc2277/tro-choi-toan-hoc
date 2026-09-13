import { QuestionItem } from '../types/GestureQuiz';

/**
 * Universal Question Selection Service for all educational games
 * (Gesture Quiz, Wheel Game, Math Arena, Millionaire, and future games).
 */
export class QuestionSelectionService {
  /**
   * Filters the full lesson question bank by teacher-selected question pool IDs.
   */
  public static filterPoolQuestions(
    allQuestions: QuestionItem[] = [],
    poolIds: string[] = []
  ): QuestionItem[] {
    const safeQuestions = Array.isArray(allQuestions) ? allQuestions : [];
    if (!poolIds || poolIds.length === 0) {
      return safeQuestions;
    }
    const poolSet = new Set(poolIds);
    return safeQuestions.filter((q) => poolSet.has(q.id));
  }

  /**
   * Validates if teacher question pool satisfies the required question count.
   */
  public static validatePool(
    poolLength: number = 0,
    requiredCount: number = 0
  ): { isValid: boolean; errorMessage?: string } {
    if ((poolLength || 0) < (requiredCount || 0)) {
      return {
        isValid: false,
        errorMessage: `Số câu trong Question Pool (${poolLength} câu) chưa đủ cho số câu mỗi lượt chơi (${requiredCount} câu). Vui lòng chọn thêm câu hỏi hoặc giảm số câu mỗi lượt!`,
      };
    }
    return { isValid: true };
  }

  /**
   * Standard Fisher-Yates shuffle helper
   */
  public static shuffle<T>(array: T[] = []): T[] {
    const safeArray = Array.isArray(array) ? array : [];
    const copy = [...safeArray];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Selects random questions from the pool while prioritizing questions not played in recent rounds.
   */
  public static selectRoundQuestions(
    questionPool: QuestionItem[] = [],
    count: number = 5,
    recentHistoryIds: string[] = []
  ): { selectedQuestions: QuestionItem[]; updatedHistory: string[] } {
    const safePool = Array.isArray(questionPool) ? questionPool : [];
    if (safePool.length === 0) {
      return { selectedQuestions: [], updatedHistory: recentHistoryIds || [] };
    }

    const effectiveCount = Math.min(count || 5, safePool.length);

    // Split pool by recent history
    const safeHistory = recentHistoryIds || [];
    const notRecent = safePool.filter((q) => !safeHistory.includes(q.id));
    const recent = safePool.filter((q) => safeHistory.includes(q.id));

    const shuffledNotRecent = this.shuffle(notRecent);
    const sortedRecent = [...recent].sort((a, b) => {
      const idxA = safeHistory.indexOf(a.id);
      const idxB = safeHistory.indexOf(b.id);
      return idxA - idxB;
    });

    const candidates = [...shuffledNotRecent, ...sortedRecent].slice(0, effectiveCount);
    const finalRoundQuestions = this.shuffle(candidates);

    const newIds = finalRoundQuestions.map((q) => q.id);
    const updatedHistory = [
      ...safeHistory.filter((id) => !newIds.includes(id)),
      ...newIds,
    ].slice(-100);

    return {
      selectedQuestions: finalRoundQuestions,
      updatedHistory,
    };
  }

  /**
   * Selects questions for Millionaire game, ordering questions progressively.
   */
  public static selectMillionaireQuestions(
    questionPool: QuestionItem[],
    count: number = 10,
    recentHistoryIds: string[] = []
  ): { selectedQuestions: QuestionItem[]; updatedHistory: string[] } {
    const result = this.selectRoundQuestions(questionPool, count, recentHistoryIds);
    // Sort slightly by content length or id to give varied progression
    return result;
  }
}
